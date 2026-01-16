import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { CameraMovement, ShotMood, VisualStyle } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shotId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { shotId } = await params
    const body = await request.json()
    const { description, mood, cameraMovement, visualStyle, duration } = body

    // Verify shot exists
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
    })

    if (!shot) {
      return NextResponse.json({ error: "Shot not found" }, { status: 404 })
    }

    // Build update data
    const updateData: {
      description?: string
      mood?: ShotMood
      cameraMovement?: CameraMovement
      visualStyle?: VisualStyle
      duration?: number
    } = {}

    if (description !== undefined) {
      updateData.description = description
    }

    if (mood !== undefined) {
      updateData.mood = mood as ShotMood
    }

    if (cameraMovement !== undefined) {
      updateData.cameraMovement = cameraMovement as CameraMovement
    }

    if (visualStyle !== undefined) {
      updateData.visualStyle = visualStyle as VisualStyle
    }

    if (duration !== undefined) {
      updateData.duration = parseFloat(duration)
    }

    // Update the shot
    const updatedShot = await prisma.shot.update({
      where: { id: shotId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      shot: updatedShot,
    })
  } catch (error) {
    console.error("Shot update error:", error)
    return NextResponse.json(
      { error: "Failed to update shot" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shotId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { shotId } = await params

    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        images: {
          orderBy: { createdAt: "desc" },
        },
        videos: {
          orderBy: { createdAt: "desc" },
        },
        scene: true,
      },
    })

    if (!shot) {
      return NextResponse.json({ error: "Shot not found" }, { status: 404 })
    }

    return NextResponse.json({ shot })
  } catch (error) {
    console.error("Shot fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shot" },
      { status: 500 }
    )
  }
}
