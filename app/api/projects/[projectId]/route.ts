import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { AspectRatio, ProjectStatus } from "@prisma/client"

// GET /api/projects/[projectId] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            image: true,
          },
        },
        scripts: {
          orderBy: {
            version: "desc",
          },
          take: 1,
        },
        scenes: {
          orderBy: {
            sceneIndex: "asc",
          },
        },
        shots: {
          orderBy: {
            shotIndex: "asc",
          },
          include: {
            images: true,
            videos: true,
          },
        },
        audio: true,
        _count: {
          select: {
            shots: true,
            scenes: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[projectId] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        createdById: session.user.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, aspectRatio, status } = body

    // Validation
    const updateData: {
      title?: string
      aspectRatio?: AspectRatio
      status?: ProjectStatus
    } = {}

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }

    if (aspectRatio !== undefined) {
      if (!Object.values(AspectRatio).includes(aspectRatio as AspectRatio)) {
        return NextResponse.json(
          { error: "Invalid aspect ratio" },
          { status: 400 }
        )
      }
      updateData.aspectRatio = aspectRatio as AspectRatio
    }

    if (status !== undefined) {
      if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        )
      }
      updateData.status = status as ProjectStatus
    }

    const project = await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: updateData,
      include: {
        createdBy: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        createdById: session.user.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    await prisma.project.delete({
      where: {
        id: params.projectId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
