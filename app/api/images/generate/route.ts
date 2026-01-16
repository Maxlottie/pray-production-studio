import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateImage, downloadImage } from "@/lib/openai"
import { uploadBuffer, generateProjectKey } from "@/lib/s3"
import {
  buildImagePrompt,
  NEGATIVE_PROMPT,
} from "@/lib/prompts/image-prompt-builder"
import type { ShotMood, VisualStyle } from "@prisma/client"

// Number of images to generate per request (reduced to 2 for faster generation)
const IMAGES_PER_GENERATION = 2

export async function POST(request: NextRequest) {
  try {
    // Auth temporarily disabled for demo
    const body = await request.json()
    const { shotId, customPrompt, count = IMAGES_PER_GENERATION, regenerate = false } = body

    if (!shotId) {
      return NextResponse.json(
        { error: "Shot ID is required" },
        { status: 400 }
      )
    }

    // Fetch the shot with project info
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        project: true,
        scene: {
          include: {
            shots: {
              include: {
                images: {
                  where: { selected: true },
                },
              },
              orderBy: { shotIndex: "asc" },
            },
          },
        },
      },
    })

    if (!shot) {
      return NextResponse.json({ error: "Shot not found" }, { status: 404 })
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

    // If regenerating, delete all existing images for this shot first
    if (regenerate) {
      console.log(`[API] Regenerating shot ${shotId} - deleting existing images`)
      await prisma.imageGeneration.deleteMany({
        where: { shotId: shot.id },
      })
    }

    // Check how many images already exist for this shot
    const existingImagesCount = await prisma.imageGeneration.count({
      where: { shotId: shot.id },
    })

    // Calculate how many images to generate (fill up to 2)
    const imagesToGenerate = Math.min(count, 2 - existingImagesCount)

    if (imagesToGenerate <= 0) {
      return NextResponse.json({
        success: true,
        message: "Shot already has 4 images",
        images: [],
      })
    }

    // Try to upload to S3, fall back to base64/URL if S3 not configured
    const s3Configured = !!(
      process.env.AWS_S3_BUCKET_NAME &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ACCESS_KEY_ID !== "your_aws_access_key"
    )

    // Generate multiple images in parallel
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
              // Extract base64 data from data URL
              const base64Data = generatedImage.url.split(",")[1]
              imageBuffer = Buffer.from(base64Data, "base64")
              console.log("[S3] Converting base64 image to buffer for upload")
            } else {
              // Download from URL
              imageBuffer = await downloadImage(generatedImage.url)
            }

            const timestamp = Date.now()
            const filename = `shot_${shot.shotIndex}_${timestamp}_${index}.png`
            const s3Key = generateProjectKey(shot.projectId, "images", filename)
            imageUrl = await uploadBuffer(s3Key, imageBuffer, "image/png")
            console.log(`[S3] Uploaded image to: ${imageUrl}`)
          } catch (s3Error) {
            console.warn("[S3] Upload failed, using image URL directly:", s3Error)
            imageUrl = generatedImage.url
          }
        } else {
          console.log("[S3] Not configured, using image URL directly")
          imageUrl = generatedImage.url
        }

        return { url: imageUrl, success: true }
      } catch (error) {
        console.error(`Failed to generate image ${index + 1}:`, error)
        return { url: null, success: false, error }
      }
    })

    const results = await Promise.all(generationPromises)
    const successfulImages = results.filter(r => r.success && r.url)

    if (successfulImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any images" },
        { status: 500 }
      )
    }

    // Create image generation records for all successful images
    const createdImages = await Promise.all(
      successfulImages.map(async (result, index) => {
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

    // Auto-select the first image if this is a fresh shot
    if (existingImagesCount === 0 && createdImages.length > 0) {
      await prisma.imageGeneration.update({
        where: { id: createdImages[0].id },
        data: { selected: true },
      })
      createdImages[0].selected = true
    }

    return NextResponse.json({
      success: true,
      images: createdImages,
      generated: successfulImages.length,
      failed: results.filter(r => !r.success).length,
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    )
  }
}
