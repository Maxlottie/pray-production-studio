import { NextRequest, NextResponse } from "next/server"
import { getObject } from "@/lib/s3"

// Cache images for 1 hour on the edge
export const revalidate = 3600

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params

    // Reconstruct the full key from the URL segments
    const key = keyParts.join("/")

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 })
    }

    console.log(`[S3 Proxy] Fetching: ${key}`)

    // Fetch the object from S3
    const response = await getObject(key)

    if (!response.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Convert the readable stream to a buffer
    const chunks: Uint8Array[] = []
    const reader = response.Body.transformToWebStream().getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const buffer = Buffer.concat(chunks)

    // Determine content type
    const contentType = response.ContentType || "image/png"

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("[S3 Proxy] Error:", error)

    // Check if it's a "not found" error
    if ((error as { name?: string }).name === "NoSuchKey") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    )
  }
}
