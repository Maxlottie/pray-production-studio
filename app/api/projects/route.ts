import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { AspectRatio } from "@prisma/client"

// Demo user email for auth-disabled mode
const DEMO_EMAIL = "demo@pray.com"

// GET /api/projects - List all projects for the current user
export async function GET() {
  try {
    // Auth temporarily disabled - always use demo user
    const demoUser = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      create: {
        email: DEMO_EMAIL,
        name: "Demo User",
      },
    })
    const userId = demoUser.id

    const projects = await prisma.project.findMany({
      where: {
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            shots: true,
            scenes: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Auth temporarily disabled - always use demo user
    const demoUser = await prisma.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      create: {
        email: DEMO_EMAIL,
        name: "Demo User",
      },
    })
    const userId = demoUser.id

    const body = await request.json()
    const { title, aspectRatio } = body

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (
      aspectRatio &&
      !Object.values(AspectRatio).includes(aspectRatio as AspectRatio)
    ) {
      return NextResponse.json(
        { error: "Invalid aspect ratio" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        aspectRatio: (aspectRatio as AspectRatio) || "LANDSCAPE",
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to create project: ${errorMessage}` },
      { status: 500 }
    )
  }
}
