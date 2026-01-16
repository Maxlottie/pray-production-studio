import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import * as minimax from "@/lib/minimax"
import * as runway from "@/lib/runway"
import type { VideoProvider, MotionType } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shotId, imageId, provider = "MINIMAX", motionType = "SUBTLE" } = body

    if (!shotId || !imageId) {
      return NextResponse.json(
        { error: "Shot ID and Image ID are required" },
        { status: 400 }
      )
    }

    // Fetch the shot and image
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: { project: true },
    })

    if (!shot) {
      return NextResponse.json({ error: "Shot not found" }, { status: 404 })
    }

    const image = await prisma.imageGeneration.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Create video generation record
    const videoGeneration = await prisma.videoGeneration.create({
      data: {
        shotId,
        sourceImageId: imageId,
        provider: provider as VideoProvider,
        motionType: motionType as MotionType,
        status: "PENDING",
      },
    })

    // Start video generation based on provider
    try {
      let taskId: string

      if (provider === "MINIMAX") {
        const motionParams = minimax.getMotionParameters(motionType)
        const result = await minimax.generateVideo({
          imageUrl: image.imageUrl,
          prompt: `${shot.description}, ${motionParams.prompt}`,
          motionType,
        })
        taskId = result.taskId
      } else {
        const motionParams = runway.getMotionParameters(motionType)
        const result = await runway.generateVideo({
          imageUrl: image.imageUrl,
          prompt: `${shot.description}, ${motionParams.prompt}`,
          motionType,
        })
        taskId = result.taskId
      }

      // Update with task ID and set to processing
      await prisma.videoGeneration.update({
        where: { id: videoGeneration.id },
        data: {
          status: "PROCESSING",
          // Store task ID in a field (we could add a taskId field to schema,
          // or store in errorMessage temporarily for polling)
        },
      })

      return NextResponse.json({
        success: true,
        video: {
          ...videoGeneration,
          taskId,
          status: "PROCESSING",
        },
      })
    } catch (apiError) {
      // Update video generation as failed
      await prisma.videoGeneration.update({
        where: { id: videoGeneration.id },
        data: {
          status: "FAILED",
          errorMessage:
            apiError instanceof Error ? apiError.message : "Video generation failed",
        },
      })

      return NextResponse.json({
        success: false,
        video: {
          ...videoGeneration,
          status: "FAILED",
          errorMessage:
            apiError instanceof Error ? apiError.message : "Video generation failed",
        },
      })
    }
  } catch (error) {
    console.error("Video generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    )
  }
}
