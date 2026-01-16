import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth-options"
import { exportToGoogleDrive } from "@/lib/google-drive"
import { generatePremiereXML } from "@/lib/premiere-xml"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      )
    }

    // Get the user's Google access token from their account
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    })

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 400 }
      )
    }

    // Fetch project with all related data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdById: session.user.id,
      },
      include: {
        shots: {
          include: {
            images: true,
            videos: true,
          },
          orderBy: { shotIndex: "asc" },
        },
        audio: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Prepare files for export
    const files: {
      name: string
      content: Buffer | string
      mimeType: string
      folder: "images" | "videos" | "audio" | "root"
    }[] = []

    // Add Premiere XML
    const xml = generatePremiereXML({
      id: project.id,
      title: project.title,
      aspectRatio: project.aspectRatio as "LANDSCAPE" | "PORTRAIT",
      shots: project.shots,
      narrationUrl: project.audio?.narrationUrl,
      musicUrl: project.audio?.musicUrl,
    })
    files.push({
      name: "project.xml",
      content: xml,
      mimeType: "application/xml",
      folder: "root",
    })

    // Download and add media files
    for (const shot of project.shots) {
      const selectedImage = shot.images.find((i) => i.selected)
      const selectedVideo = shot.videos.find((v) => v.selected)

      if (selectedImage) {
        try {
          const response = await fetch(selectedImage.imageUrl)
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer())
            files.push({
              name: `shot_${String(shot.shotIndex + 1).padStart(2, "0")}.png`,
              content: buffer,
              mimeType: "image/png",
              folder: "images",
            })
          }
        } catch (e) {
          console.error(`Failed to fetch image for shot ${shot.shotIndex}:`, e)
        }
      }

      if (selectedVideo?.videoUrl) {
        try {
          const response = await fetch(selectedVideo.videoUrl)
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer())
            files.push({
              name: `shot_${String(shot.shotIndex + 1).padStart(2, "0")}.mp4`,
              content: buffer,
              mimeType: "video/mp4",
              folder: "videos",
            })
          }
        } catch (e) {
          console.error(`Failed to fetch video for shot ${shot.shotIndex}:`, e)
        }
      }
    }

    // Add audio files
    if (project.audio?.narrationUrl) {
      try {
        const response = await fetch(project.audio.narrationUrl)
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer())
          files.push({
            name: "narration.mp3",
            content: buffer,
            mimeType: "audio/mpeg",
            folder: "audio",
          })
        }
      } catch (e) {
        console.error("Failed to fetch narration:", e)
      }
    }

    if (project.audio?.musicUrl) {
      try {
        const response = await fetch(project.audio.musicUrl)
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer())
          files.push({
            name: "music.mp3",
            content: buffer,
            mimeType: "audio/mpeg",
            folder: "audio",
          })
        }
      } catch (e) {
        console.error("Failed to fetch music:", e)
      }
    }

    // Export to Google Drive
    const result = await exportToGoogleDrive({
      accessToken: account.access_token,
      projectTitle: project.title,
      files,
    })

    return NextResponse.json({
      success: true,
      folderId: result.folderId,
      folderUrl: result.folderUrl,
    })
  } catch (error) {
    console.error("Google Drive export error:", error)
    return NextResponse.json(
      { error: "Failed to export to Google Drive" },
      { status: 500 }
    )
  }
}
