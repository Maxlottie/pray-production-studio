import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"
import { buildAssistantSystemPrompt, ASSISTANT_TOOLS } from "@/lib/prompts/assistant-system"
import { buildImagePrompt } from "@/lib/prompts/image-prompt-builder"
import { generateImage, downloadImage } from "@/lib/openai"
import { uploadBuffer, generateProjectKey } from "@/lib/s3"
import type { ShotMood, VisualStyle } from "@prisma/client"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface Message {
  role: "user" | "assistant"
  content: string
}

// Direct image generation function (bypasses API route auth issues)
async function generateImagesForShot(
  shotId: string,
  customPrompt?: string
): Promise<{ success: boolean; message: string; generated?: number }> {
  try {
    // Fetch the shot with project info
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        project: true,
        scene: true,
      },
    })

    if (!shot) {
      return { success: false, message: "Shot not found" }
    }

    // Build the prompt
    const prompt =
      customPrompt ||
      buildImagePrompt({
        description: shot.description,
        mood: shot.mood as ShotMood,
        visualStyle: (shot.visualStyle || "PHOTOREALISTIC") as VisualStyle,
        aspectRatio: shot.project.aspectRatio as "LANDSCAPE" | "PORTRAIT",
      })

    // Delete existing images for this shot (regenerate mode)
    console.log(`[Assistant] Regenerating shot ${shotId} - deleting existing images`)
    await prisma.imageGeneration.deleteMany({
      where: { shotId: shot.id },
    })

    // Check if S3 is configured
    const s3Configured = !!(
      process.env.AWS_S3_BUCKET_NAME &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ACCESS_KEY_ID !== "your_aws_access_key"
    )

    // Generate 4 images in parallel
    const imagesToGenerate = 4
    console.log(`[Assistant] Generating ${imagesToGenerate} images for shot ${shot.shotIndex + 1}`)

    const generationPromises = Array.from({ length: imagesToGenerate }, async (_, index) => {
      try {
        const generatedImage = await generateImage({
          prompt,
          aspectRatio: shot.project.aspectRatio as "LANDSCAPE" | "PORTRAIT",
        })

        let imageUrl: string

        if (s3Configured) {
          try {
            let imageBuffer: Buffer

            // Handle base64 data URLs vs regular URLs
            if (generatedImage.url.startsWith("data:image")) {
              const base64Data = generatedImage.url.split(",")[1]
              imageBuffer = Buffer.from(base64Data, "base64")
            } else {
              imageBuffer = await downloadImage(generatedImage.url)
            }

            const timestamp = Date.now()
            const filename = `shot_${shot.shotIndex}_${timestamp}_${index}.png`
            const s3Key = generateProjectKey(shot.projectId, "images", filename)
            imageUrl = await uploadBuffer(s3Key, imageBuffer, "image/png")
            console.log(`[Assistant] Uploaded image to S3: ${s3Key}`)
          } catch (s3Error) {
            console.warn("[Assistant] S3 upload failed, using image URL directly:", s3Error)
            imageUrl = generatedImage.url
          }
        } else {
          imageUrl = generatedImage.url
        }

        return { url: imageUrl, success: true }
      } catch (error) {
        console.error(`[Assistant] Failed to generate image ${index + 1}:`, error)
        return { url: null, success: false, error }
      }
    })

    const results = await Promise.all(generationPromises)
    const successfulImages = results.filter((r) => r.success && r.url)

    if (successfulImages.length === 0) {
      return { success: false, message: "Failed to generate any images" }
    }

    // Create image generation records
    const createdImages = await Promise.all(
      successfulImages.map(async (result) => {
        const imageGeneration = await prisma.imageGeneration.create({
          data: {
            shotId: shot.id,
            prompt,
            imageUrl: result.url!,
            selected: false,
          },
        })
        return imageGeneration
      })
    )

    // Auto-select the first image
    if (createdImages.length > 0) {
      await prisma.imageGeneration.update({
        where: { id: createdImages[0].id },
        data: { selected: true },
      })
    }

    console.log(`[Assistant] Successfully generated ${successfulImages.length} images for shot ${shot.shotIndex + 1}`)

    return {
      success: true,
      message: `Successfully generated ${successfulImages.length} new images for Shot ${shot.shotIndex + 1}. Refresh the page to see them.`,
      generated: successfulImages.length,
    }
  } catch (error) {
    console.error("[Assistant] Image generation error:", error)
    return { success: false, message: `Failed to generate images: ${error}` }
  }
}

// Tool execution functions
async function executeRegenerateShot(
  shotId: string,
  enhancedPrompt?: string
): Promise<{ success: boolean; message: string }> {
  return generateImagesForShot(shotId, enhancedPrompt)
}

async function executeUpdateShot(
  shotId: string,
  updates: { description?: string; mood?: string; visualStyle?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const shot = await prisma.shot.update({
      where: { id: shotId },
      data: {
        ...(updates.description && { description: updates.description }),
        ...(updates.mood && { mood: updates.mood as ShotMood }),
        ...(updates.visualStyle && { visualStyle: updates.visualStyle as VisualStyle }),
      },
    })

    const changedFields = Object.keys(updates).filter(
      (k) => updates[k as keyof typeof updates]
    )
    return {
      success: true,
      message: `Updated Shot ${shot.shotIndex + 1}: changed ${changedFields.join(", ")}`,
    }
  } catch (error) {
    console.error("Update shot error:", error)
    return { success: false, message: "Failed to update shot" }
  }
}

async function executeUpdateAndRegenerate(
  shotId: string,
  updates: { description?: string; mood?: string; visualStyle?: string }
): Promise<{ success: boolean; message: string }> {
  // First update the shot
  const updateResult = await executeUpdateShot(shotId, updates)
  if (!updateResult.success) {
    return updateResult
  }

  // Then regenerate images
  const regenResult = await executeRegenerateShot(shotId)
  if (!regenResult.success) {
    return {
      success: false,
      message: `Shot updated but image regeneration failed: ${regenResult.message}`,
    }
  }

  return {
    success: true,
    message: `${updateResult.message}. ${regenResult.message}`,
  }
}

async function executeBatchUpdateShots(
  shotIds: string[],
  mood?: string,
  visualStyle?: string,
  regenerate?: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    // Update all shots
    const updateData: { mood?: ShotMood; visualStyle?: VisualStyle } = {}
    if (mood) updateData.mood = mood as ShotMood
    if (visualStyle) updateData.visualStyle = visualStyle as VisualStyle

    await prisma.shot.updateMany({
      where: { id: { in: shotIds } },
      data: updateData,
    })

    let message = `Updated ${shotIds.length} shots`
    if (mood) message += ` with mood: ${mood}`
    if (visualStyle) message += ` with style: ${visualStyle}`

    // Regenerate if requested - use parallel processing
    if (regenerate) {
      message += ". Starting image regeneration..."
      const result = await executeRegenerateMultipleShots(shotIds)
      message = `Updated shots. ${result.message}`
    }

    return { success: true, message }
  } catch (error) {
    console.error("Batch update error:", error)
    return { success: false, message: "Failed to batch update shots" }
  }
}

// Parallel regeneration of multiple shots (FAST!)
async function executeRegenerateMultipleShots(
  shotIds: string[],
  enhancedPrompt?: string
): Promise<{ success: boolean; message: string; results: { shotId: string; success: boolean }[] }> {
  console.log(`[Assistant] Starting PARALLEL regeneration of ${shotIds.length} shots`)

  // Process shots in batches of 3 for parallel execution (balances speed vs rate limits)
  const BATCH_SIZE = 3
  const results: { shotId: string; success: boolean; shotIndex?: number }[] = []

  for (let i = 0; i < shotIds.length; i += BATCH_SIZE) {
    const batch = shotIds.slice(i, i + BATCH_SIZE)
    console.log(`[Assistant] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} shots in parallel`)

    // Process this batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (shotId) => {
        const result = await generateImagesForShot(shotId, enhancedPrompt)
        return { shotId, success: result.success, shotIndex: result.generated }
      })
    )

    results.push(...batchResults)
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount

  let message = `Regenerated images for ${successCount}/${shotIds.length} shots in parallel`
  if (failCount > 0) {
    message += ` (${failCount} failed)`
  }
  message += ". Refresh the page to see the new images."

  console.log(`[Assistant] Parallel regeneration complete: ${successCount} succeeded, ${failCount} failed`)

  return {
    success: successCount > 0,
    message,
    results,
  }
}

// Process tool calls from Claude
async function processToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  console.log(`[Assistant] Processing tool: ${toolName}`)

  switch (toolName) {
    case "regenerate_shot_images": {
      const result = await executeRegenerateShot(
        toolInput.shotId as string,
        toolInput.enhancedPrompt as string | undefined
      )
      return JSON.stringify(result)
    }
    case "update_shot": {
      const result = await executeUpdateShot(toolInput.shotId as string, {
        description: toolInput.description as string | undefined,
        mood: toolInput.mood as string | undefined,
        visualStyle: toolInput.visualStyle as string | undefined,
      })
      return JSON.stringify(result)
    }
    case "update_and_regenerate": {
      const result = await executeUpdateAndRegenerate(toolInput.shotId as string, {
        description: toolInput.description as string | undefined,
        mood: toolInput.mood as string | undefined,
        visualStyle: toolInput.visualStyle as string | undefined,
      })
      return JSON.stringify(result)
    }
    case "batch_update_shots": {
      const result = await executeBatchUpdateShots(
        toolInput.shotIds as string[],
        toolInput.mood as string | undefined,
        toolInput.visualStyle as string | undefined,
        toolInput.regenerate as boolean | undefined
      )
      return JSON.stringify(result)
    }
    case "regenerate_multiple_shots": {
      const result = await executeRegenerateMultipleShots(
        toolInput.shotIds as string[],
        toolInput.enhancedPrompt as string | undefined
      )
      return JSON.stringify(result)
    }
    default:
      return JSON.stringify({ success: false, message: `Unknown tool: ${toolName}` })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, message, history = [], currentPage = "images" } = body

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "Project ID and message are required" },
        { status: 400 }
      )
    }

    // Fetch project context with FULL details
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdById: user.id,
      },
      include: {
        scripts: {
          orderBy: { version: "desc" },
          take: 1,
        },
        scenes: {
          orderBy: { sceneIndex: "asc" },
          include: {
            shots: {
              orderBy: { shotIndex: "asc" },
              include: {
                images: true,
                videos: true,
              },
            },
          },
        },
        audio: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get the latest script
    const latestScript = project.scripts[0]

    // Calculate project stats
    const allShots = project.scenes.flatMap((scene) => scene.shots)

    // Build comprehensive context with shot IDs for tool use
    const context = {
      projectId: project.id,
      title: project.title,
      aspectRatio: project.aspectRatio,
      status: project.status,
      totalScenes: project.scenes.length,
      totalShots: allShots.length,
      shotsWithImages: allShots.filter((s) => s.images.length > 0).length,
      shotsWithVideos: allShots.filter((s) =>
        s.videos.some((v) => v.status === "COMPLETED")
      ).length,
      hasNarration: !!project.audio?.narrationUrl,
      hasMusic: !!project.audio?.musicUrl,
      scriptText: latestScript?.rawText || null,
      currentPage: currentPage as "shots" | "images" | "videos" | "assembly",
      scenes: project.scenes.map((scene) => ({
        id: scene.id,
        sceneIndex: scene.sceneIndex,
        title: scene.title,
        location: scene.location,
        shots: scene.shots.map((shot) => ({
          id: shot.id,
          shotIndex: shot.shotIndex,
          description: shot.description,
          mood: shot.mood,
          visualStyle: shot.visualStyle || "PHOTOREALISTIC",
          cameraMovement: shot.cameraMovement,
          duration: Number(shot.duration),
          hasImages: shot.images.length > 0,
          imageCount: shot.images.length,
          hasVideo: shot.videos.some((v) => v.status === "COMPLETED"),
        })),
      })),
    }

    // Build system prompt with full context
    const systemPrompt = buildAssistantSystemPrompt(context)

    // Build messages for Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((m: Message) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ]

    // Call Claude API with tools
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      tools: ASSISTANT_TOOLS as Anthropic.Tool[],
      messages,
    })

    // Track tool results for the conversation
    const toolResults: { tool: string; result: string }[] = []

    // Handle tool use - loop until we get a final text response
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      )

      // Process each tool call
      const toolResultContents: Anthropic.ToolResultBlockParam[] = []
      for (const toolUse of toolUseBlocks) {
        console.log(`[Assistant] Executing tool: ${toolUse.name}`, JSON.stringify(toolUse.input))
        const result = await processToolCall(
          toolUse.name,
          toolUse.input as Record<string, unknown>
        )
        console.log(`[Assistant] Tool result:`, result)
        toolResults.push({ tool: toolUse.name, result })
        toolResultContents.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        })
      }

      // Continue the conversation with tool results
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        tools: ASSISTANT_TOOLS as Anthropic.Tool[],
        messages: [
          ...messages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResultContents },
        ],
      })
    }

    // Extract final response text
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    )
    const responseText = textBlock?.text || "I completed the action but couldn't generate a response."

    // Determine if any actions were taken
    const actionsTaken = toolResults.length > 0

    // Update or create conversation record
    await prisma.assistantConversation.upsert({
      where: { projectId },
      update: {
        messages: JSON.parse(
          JSON.stringify([
            ...history,
            { role: "user", content: message },
            { role: "assistant", content: responseText },
          ])
        ),
      },
      create: {
        projectId,
        messages: JSON.parse(
          JSON.stringify([
            { role: "user", content: message },
            { role: "assistant", content: responseText },
          ])
        ),
      },
    })

    return NextResponse.json({
      response: responseText,
      actionsTaken,
      toolResults,
    })
  } catch (error) {
    console.error("Assistant error:", error)
    return NextResponse.json(
      { error: "Failed to get assistant response" },
      { status: 500 }
    )
  }
}

// GET - Fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    const conversation = await prisma.assistantConversation.findUnique({
      where: { projectId },
    })

    return NextResponse.json({
      messages: conversation?.messages || [],
    })
  } catch (error) {
    console.error("Conversation fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
  }
}
