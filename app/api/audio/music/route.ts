import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { generateMusic } from "@/lib/elevenlabs"
import { uploadBuffer } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, style, customPrompt, duration = 60 } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdById: user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Generate music using ElevenLabs
    const audioBuffer = await generateMusic({
      prompt: customPrompt || style,
      duration,
    })

    // Upload to S3
    const timestamp = Date.now()
    const key = `projects/${projectId}/audio/music_${timestamp}.mp3`
    const audioUrl = await uploadBuffer(key, audioBuffer, "audio/mpeg")

    // Update or create project audio record
    await prisma.projectAudio.upsert({
      where: { projectId },
      update: {
        musicUrl: audioUrl,
        musicSource: "GENERATED",
      },
      create: {
        projectId,
        musicUrl: audioUrl,
        musicSource: "GENERATED",
      },
    })

    return NextResponse.json({
      success: true,
      audioUrl,
    })
  } catch (error) {
    console.error("Music generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate music" },
      { status: 500 }
    )
  }
}
