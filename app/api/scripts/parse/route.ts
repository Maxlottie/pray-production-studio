import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { parseScript, ParsedScript } from "@/lib/anthropic"
import { CameraMovement, ShotMood, Prisma } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, scriptText, sourceFileName } = body

    if (!projectId || !scriptText) {
      return NextResponse.json(
        { error: "Project ID and script text are required" },
        { status: 400 }
      )
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        createdById: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get the latest script version for this project
    const latestScript = await prisma.script.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
    })

    const newVersion = (latestScript?.version || 0) + 1

    // Parse the script with Claude
    let parsedData: ParsedScript
    try {
      parsedData = await parseScript(scriptText)
    } catch (parseError) {
      console.error("Error parsing script:", parseError)
      return NextResponse.json(
        { error: "Failed to parse script. Please try again." },
        { status: 500 }
      )
    }

    // Create the script record
    const script = await prisma.script.create({
      data: {
        projectId,
        version: newVersion,
        rawText: scriptText,
        sourceFileName,
        parsedData: JSON.parse(JSON.stringify(parsedData)) as Prisma.InputJsonValue,
        status: "PARSED",
      },
    })

    // Delete existing scenes and shots for this project (we're replacing them)
    await prisma.shot.deleteMany({ where: { projectId } })
    await prisma.scene.deleteMany({ where: { projectId } })

    // Create scenes and shots from parsed data
    let globalShotIndex = 0

    for (const sceneData of parsedData.scenes) {
      const scene = await prisma.scene.create({
        data: {
          projectId,
          sceneIndex: sceneData.sceneIndex,
          title: sceneData.title,
          location: sceneData.location,
          characterIds: [], // Will be populated in Phase 3 with character linking
        },
      })

      for (const shotData of sceneData.shots) {
        await prisma.shot.create({
          data: {
            projectId,
            sceneId: scene.id,
            shotIndex: globalShotIndex,
            description: shotData.description,
            cameraMovement: mapCameraMovement(shotData.cameraMovement),
            duration: shotData.duration,
            mood: mapShotMood(shotData.mood),
            status: "PENDING",
          },
        })
        globalShotIndex++
      }
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "IN_PROGRESS" },
    })

    // Fetch the complete result
    const result = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scripts: {
          orderBy: { version: "desc" },
          take: 1,
        },
        scenes: {
          orderBy: { sceneIndex: "asc" },
          include: {
            shots: {
              orderBy: { shotIndex: "asc" },
            },
          },
        },
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in script parsing:", error)
    return NextResponse.json(
      { error: "Failed to process script" },
      { status: 500 }
    )
  }
}

function mapCameraMovement(movement: string): CameraMovement {
  const mapping: Record<string, CameraMovement> = {
    STATIC: "STATIC",
    PAN_LEFT: "PAN_LEFT",
    PAN_RIGHT: "PAN_RIGHT",
    ZOOM_IN: "ZOOM_IN",
    ZOOM_OUT: "ZOOM_OUT",
    PUSH_IN: "PUSH_IN",
    HAND_HELD: "HAND_HELD",
    CUSTOM: "CUSTOM",
  }
  return mapping[movement.toUpperCase()] || "STATIC"
}

function mapShotMood(mood: string): ShotMood {
  const mapping: Record<string, ShotMood> = {
    DRAMATIC: "DRAMATIC",
    PEACEFUL: "PEACEFUL",
    APOCALYPTIC: "APOCALYPTIC",
    DIVINE: "DIVINE",
    FOREBODING: "FOREBODING",
    ACTION: "ACTION",
  }
  return mapping[mood.toUpperCase()] || "DRAMATIC"
}
