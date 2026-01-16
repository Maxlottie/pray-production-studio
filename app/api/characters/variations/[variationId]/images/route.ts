import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { uploadBuffer } from "@/lib/s3"

// POST - Upload an image to a variation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ variationId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { variationId } = await params

    // Verify variation exists
    const variation = await prisma.characterVariation.findUnique({
      where: { id: variationId },
      include: { character: true, images: true },
    })

    if (!variation) {
      return NextResponse.json(
        { error: "Variation not found" },
        { status: 404 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "png"
    const key = `characters/${variation.character.id}/${variationId}_${timestamp}.${extension}`
    const imageUrl = await uploadBuffer(key, buffer, file.type)

    // Check if this is the first image
    const isFirst = variation.images.length === 0

    // Create image record
    const image = await prisma.characterReferenceImage.create({
      data: {
        variationId,
        imageUrl,
        isPrimary: isFirst,
      },
    })

    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
