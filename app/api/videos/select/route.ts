import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shotId, videoId } = body

    if (!shotId || !videoId) {
      return NextResponse.json(
        { error: "Shot ID and Video ID are required" },
        { status: 400 }
      )
    }

    // Verify the video belongs to the shot
    const video = await prisma.videoGeneration.findFirst({
      where: {
        id: videoId,
        shotId: shotId,
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: "Video not found for this shot" },
        { status: 404 }
      )
    }

    // Deselect all videos for this shot
    await prisma.videoGeneration.updateMany({
      where: { shotId },
      data: { selected: false },
    })

    // Select the specified video
    const updatedVideo = await prisma.videoGeneration.update({
      where: { id: videoId },
      data: { selected: true },
    })

    return NextResponse.json({
      success: true,
      video: updatedVideo,
    })
  } catch (error) {
    console.error("Video selection error:", error)
    return NextResponse.json(
      { error: "Failed to select video" },
      { status: 500 }
    )
  }
}
