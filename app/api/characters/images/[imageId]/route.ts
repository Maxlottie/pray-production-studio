import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// PATCH - Update image (set as primary)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageId } = await params
    const body = await request.json()
    const { isPrimary } = body

    // Get the image to find its variation
    const image = await prisma.characterReferenceImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    if (isPrimary) {
      // First, unset all other images in this variation as primary
      await prisma.characterReferenceImage.updateMany({
        where: { variationId: image.variationId },
        data: { isPrimary: false },
      })
    }

    // Update the image
    const updatedImage = await prisma.characterReferenceImage.update({
      where: { id: imageId },
      data: { isPrimary },
    })

    return NextResponse.json({ image: updatedImage })
  } catch (error) {
    console.error("Image update error:", error)
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageId } = await params

    // Get the image first to check if it's primary
    const image = await prisma.characterReferenceImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Delete the image
    await prisma.characterReferenceImage.delete({
      where: { id: imageId },
    })

    // If it was primary, make another image primary
    if (image.isPrimary) {
      const nextImage = await prisma.characterReferenceImage.findFirst({
        where: { variationId: image.variationId },
        orderBy: { createdAt: "asc" },
      })

      if (nextImage) {
        await prisma.characterReferenceImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Image deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  }
}
