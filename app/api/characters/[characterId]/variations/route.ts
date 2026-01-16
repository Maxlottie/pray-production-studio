import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import type { VariationType } from "@prisma/client"

// POST - Add a variation to a character
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { characterId } = await params
    const body = await request.json()
    const { type, customLabel } = body

    if (!type) {
      return NextResponse.json(
        { error: "Variation type is required" },
        { status: 400 }
      )
    }

    // Verify character exists
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      )
    }

    const variation = await prisma.characterVariation.create({
      data: {
        characterId,
        type: type as VariationType,
        customLabel: type === "CUSTOM" ? customLabel : null,
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json({ variation }, { status: 201 })
  } catch (error) {
    console.error("Variation creation error:", error)
    return NextResponse.json(
      { error: "Failed to create variation" },
      { status: 500 }
    )
  }
}
