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
    const { shotId, imageId } = body

    if (!shotId || !imageId) {
      return NextResponse.json(
        { error: "Shot ID and Image ID are required" },
        { status: 400 }
      )
    }

    // Verify the image belongs to the shot
    const image = await prisma.imageGeneration.findFirst({
      where: {
        id: imageId,
        shotId: shotId,
      },
    })

    if (!image) {
      return NextResponse.json(
        { error: "Image not found for this shot" },
        { status: 404 }
      )
    }

    // Deselect all images for this shot
    await prisma.imageGeneration.updateMany({
      where: { shotId },
      data: { selected: false },
    })

    // Select the specified image
    const updatedImage = await prisma.imageGeneration.update({
      where: { id: imageId },
      data: { selected: true },
    })

    return NextResponse.json({
      success: true,
      image: updatedImage,
    })
  } catch (error) {
    console.error("Image selection error:", error)
    return NextResponse.json(
      { error: "Failed to select image" },
      { status: 500 }
    )
  }
}
