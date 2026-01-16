import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { AspectRatio } from "@prisma/client"

// Helper to get or create a demo user (auth temporarily disabled)
async function getDemoUserId(): Promise<string> {
  const demoEmail = "demo@pray.com"

  // Use upsert to handle race conditions
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {}, // Don't update anything if exists
    create: {
      email: demoEmail,
      name: "Demo User",
    },
  })

  console.log("[API] Using demo user:", user.id)
  return user.id
}

// GET /api/projects - List all projects for the current user
export async function GET() {
  try {
    const session = await getSession()

    // Auth temporarily disabled - use demo user if no session
    const userId = session?.user?.id || await getDemoUserId()

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
    const session = await getSession()

    // Auth temporarily disabled - use demo user if no session
    const userId = session?.user?.id || await getDemoUserId()

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
