import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { generatePremiereXML } from "@/lib/premiere-xml"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
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

    // Fetch project with all related data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdById: user.id,
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

    // Convert shots with Decimal duration to number for XML generation
    const shotsWithNumberDuration = project.shots.map(shot => ({
      ...shot,
      duration: Number(shot.duration),
    }))

    // Generate Premiere XML
    const xml = generatePremiereXML({
      id: project.id,
      title: project.title,
      aspectRatio: project.aspectRatio as "LANDSCAPE" | "PORTRAIT",
      shots: shotsWithNumberDuration,
      narrationUrl: project.audio?.narrationUrl,
      musicUrl: project.audio?.musicUrl,
    })

    // Return XML as downloadable file
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-zA-Z0-9]/g, "_")}.xml"`,
      },
    })
  } catch (error) {
    console.error("Premiere XML export error:", error)
    return NextResponse.json(
      { error: "Failed to generate Premiere XML" },
      { status: 500 }
    )
  }
}
