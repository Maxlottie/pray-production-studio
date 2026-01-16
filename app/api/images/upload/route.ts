import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadBuffer, generateProjectKey } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const shotId = formData.get("shotId") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!shotId) {
      return NextResponse.json(
        { error: "Shot ID is required" },
        { status: 400 }
      )
    }

    // Verify the shot exists and get project info
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: { project: true },
    })

    if (!shot) {
      return NextResponse.json(
        { error: "Shot not found" },
        { status: 404 }
      )
    }

    // Check if S3 is configured
    const s3Configured = !!(
      process.env.AWS_S3_BUCKET_NAME &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ACCESS_KEY_ID !== "your_aws_access_key"
    )

    let imageUrl: string

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (s3Configured) {
      // Upload to S3
      const timestamp = Date.now()
      const extension = file.name.split(".").pop() || "png"
      const filename = `shot_${shot.shotIndex}_upload_${timestamp}.${extension}`
      const s3Key = generateProjectKey(shot.projectId, "images", filename)

      imageUrl = await uploadBuffer(s3Key, buffer, file.type || "image/png")
      console.log(`[S3] Uploaded user image to: ${imageUrl}`)
    } else {
      // Fall back to data URL for local development
      const base64 = buffer.toString("base64")
      const mimeType = file.type || "image/png"
      imageUrl = `data:${mimeType};base64,${base64}`
      console.log("[Upload] S3 not configured, using data URL")
    }

    // Create the image generation record
    const imageGeneration = await prisma.imageGeneration.create({
      data: {
        shotId: shot.id,
        prompt: "User uploaded image",
        imageUrl,
        selected: false,
      },
    })

    // Check if this is the first image for the shot - auto-select it
    const existingImagesCount = await prisma.imageGeneration.count({
      where: { shotId: shot.id },
    })

    if (existingImagesCount === 1) {
      await prisma.imageGeneration.update({
        where: { id: imageGeneration.id },
        data: { selected: true },
      })
      imageGeneration.selected = true
    }

    return NextResponse.json({
      success: true,
      image: imageGeneration,
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
