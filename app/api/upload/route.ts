import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getUploadUrl, generateProjectKey } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, filename, contentType, type } = body

    if (!projectId || !filename || !contentType || !type) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, filename, contentType, type" },
        { status: 400 }
      )
    }

    // Validate type
    if (!["images", "videos", "audio"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be one of: images, videos, audio" },
        { status: 400 }
      )
    }

    // Generate S3 key
    const key = generateProjectKey(projectId, type, filename)

    // Get presigned upload URL
    const { uploadUrl, fileUrl } = await getUploadUrl(key, contentType)

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileUrl,
      key,
    })
  } catch (error) {
    console.error("Upload URL generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
