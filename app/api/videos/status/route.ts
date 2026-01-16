import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { uploadBuffer } from "@/lib/s3"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      )
    }

    const video = await prisma.videoGeneration.findUnique({
      where: { id: videoId },
      include: {
        shot: {
          include: { project: true },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Video status error:", error)
    return NextResponse.json(
      { error: "Failed to fetch video status" },
      { status: 500 }
    )
  }
}

// POST - Update video status (called by webhook or polling)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { videoId, status, videoUrl, errorMessage } = body

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      )
    }

    const video = await prisma.videoGeneration.findUnique({
      where: { id: videoId },
      include: {
        shot: {
          include: { project: true },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // If video URL is provided and status is completed, upload to S3
    let finalVideoUrl = videoUrl
    if (status === "COMPLETED" && videoUrl) {
      try {
        // Download video from provider
        const response = await fetch(videoUrl)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Upload to S3
          const timestamp = Date.now()
          const key = `projects/${video.shot.projectId}/videos/shot_${video.shot.shotIndex}_${timestamp}.mp4`
          finalVideoUrl = await uploadBuffer(key, buffer, "video/mp4")
        }
      } catch (uploadError) {
        console.error("Failed to upload video to S3:", uploadError)
        // Keep original URL if upload fails
      }
    }

    // Update video generation record
    const updatedVideo = await prisma.videoGeneration.update({
      where: { id: videoId },
      data: {
        status: status || video.status,
        videoUrl: finalVideoUrl || video.videoUrl,
        errorMessage: errorMessage || video.errorMessage,
      },
    })

    // If this is the first completed video for the shot, auto-select it
    if (status === "COMPLETED") {
      const existingSelected = await prisma.videoGeneration.findFirst({
        where: {
          shotId: video.shotId,
          selected: true,
        },
      })

      if (!existingSelected) {
        await prisma.videoGeneration.update({
          where: { id: videoId },
          data: { selected: true },
        })
        updatedVideo.selected = true
      }
    }

    return NextResponse.json({ video: updatedVideo })
  } catch (error) {
    console.error("Video status update error:", error)
    return NextResponse.json(
      { error: "Failed to update video status" },
      { status: 500 }
    )
  }
}
