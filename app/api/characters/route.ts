import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { VariationType } from "@prisma/client"

// GET - List all characters
export async function GET() {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const characters = await prisma.character.findMany({
      include: {
        variations: {
          include: {
            images: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ characters })
  } catch (error) {
    console.error("Characters fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    )
  }
}

// POST - Create a new character
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, variationType = "ADULT", customLabel } = body

    if (!name) {
      return NextResponse.json(
        { error: "Character name is required" },
        { status: 400 }
      )
    }

    const character = await prisma.character.create({
      data: {
        name,
        variations: {
          create: {
            type: variationType as VariationType,
            customLabel: variationType === "CUSTOM" ? customLabel : null,
          },
        },
      },
      include: {
        variations: {
          include: {
            images: true,
          },
        },
      },
    })

    return NextResponse.json({ character }, { status: 201 })
  } catch (error) {
    console.error("Character creation error:", error)
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    )
  }
}
