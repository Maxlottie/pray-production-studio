import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { generateSpeech } from "@/lib/elevenlabs"
import { uploadBuffer } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, text, voiceId } = body

    if (!projectId || !text || !voiceId) {
      return NextResponse.json(
        { error: "Project ID, text, and voice ID are required" },
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

    // Generate speech using ElevenLabs
    const audioBuffer = await generateSpeech({
      text,
      voiceId,
    })

    // Upload to S3
    const timestamp = Date.now()
    const key = `projects/${projectId}/audio/narration_${timestamp}.mp3`
    const audioUrl = await uploadBuffer(key, audioBuffer, "audio/mpeg")

    // Update or create project audio record
    await prisma.projectAudio.upsert({
      where: { projectId },
      update: {
        narrationUrl: audioUrl,
        narrationSource: "TTS",
      },
      create: {
        projectId,
        narrationUrl: audioUrl,
        narrationSource: "TTS",
      },
    })

    return NextResponse.json({
      success: true,
      audioUrl,
    })
  } catch (error) {
    console.error("TTS generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    )
  }
}
