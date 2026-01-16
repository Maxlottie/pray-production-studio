import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CameraMovement, ShotMood, ShotStatus } from "@prisma/client"

// GET /api/shots?projectId=xxx - Get all shots for a project
export async function GET(request: NextRequest) {
  try {
    // Auth temporarily disabled for demo
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    const shots = await prisma.shot.findMany({
      where: { projectId },
      include: {
        scene: true,
        images: true,
        videos: true,
      },
      orderBy: { shotIndex: "asc" },
    })

    return NextResponse.json(shots)
  } catch (error) {
    console.error("Error fetching shots:", error)
    return NextResponse.json(
      { error: "Failed to fetch shots" },
      { status: 500 }
    )
  }
}

// PATCH /api/shots - Update a shot
export async function PATCH(request: NextRequest) {
  try {
    // Auth temporarily disabled for demo
    const body = await request.json()
    const { shotId, description, cameraMovement, duration, mood, status } = body

    if (!shotId) {
      return NextResponse.json(
        { error: "Shot ID is required" },
        { status: 400 }
      )
    }

    // Verify shot exists
    const existingShot = await prisma.shot.findUnique({
      where: { id: shotId },
    })

    if (!existingShot) {
      return NextResponse.json({ error: "Shot not found" }, { status: 404 })
    }

    // Build update data
    const updateData: {
      description?: string
      cameraMovement?: CameraMovement
      duration?: number
      mood?: ShotMood
      status?: ShotStatus
    } = {}

    if (description !== undefined) {
      updateData.description = description
    }

    if (cameraMovement !== undefined) {
      if (!Object.values(CameraMovement).includes(cameraMovement)) {
        return NextResponse.json(
          { error: "Invalid camera movement" },
          { status: 400 }
        )
      }
      updateData.cameraMovement = cameraMovement
    }

    if (duration !== undefined) {
      const durationNum = parseFloat(duration)
      if (isNaN(durationNum) || durationNum < 0.5 || durationNum > 60) {
        return NextResponse.json(
          { error: "Duration must be between 0.5 and 60 seconds" },
          { status: 400 }
        )
      }
      updateData.duration = durationNum
    }

    if (mood !== undefined) {
      if (!Object.values(ShotMood).includes(mood)) {
        return NextResponse.json(
          { error: "Invalid mood" },
          { status: 400 }
        )
      }
      updateData.mood = mood
    }

    if (status !== undefined) {
      if (!Object.values(ShotStatus).includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    const shot = await prisma.shot.update({
      where: { id: shotId },
      data: updateData,
      include: {
        scene: true,
      },
    })

    return NextResponse.json(shot)
  } catch (error) {
    console.error("Error updating shot:", error)
    return NextResponse.json(
      { error: "Failed to update shot" },
      { status: 500 }
    )
  }
}

// POST /api/shots/approve-all - Approve all shots for a project
export async function POST(request: NextRequest) {
  try {
    // Auth temporarily disabled for demo
    const body = await request.json()
    const { projectId, action } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    if (action === "approve-all") {
      await prisma.shot.updateMany({
        where: { projectId },
        data: { status: "APPROVED" },
      })

      return NextResponse.json({ success: true, message: "All shots approved" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in shots action:", error)
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    )
  }
}
