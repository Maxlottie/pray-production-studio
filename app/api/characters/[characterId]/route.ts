import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// GET - Get a single character
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { characterId } = await params

    const character = await prisma.character.findUnique({
      where: { id: characterId },
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
    })

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ character })
  } catch (error) {
    console.error("Character fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch character" },
      { status: 500 }
    )
  }
}

// PATCH - Update a character
export async function PATCH(
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
    const { name, variations } = body

    // Update character name
    const updateData: { name?: string } = {}
    if (name !== undefined) {
      updateData.name = name
    }

    const character = await prisma.character.update({
      where: { id: characterId },
      data: updateData,
      include: {
        variations: {
          include: {
            images: true,
          },
        },
      },
    })

    // Update variations if provided
    if (variations && Array.isArray(variations)) {
      for (const variation of variations) {
        if (variation.id && variation.description !== undefined) {
          await prisma.characterVariation.update({
            where: { id: variation.id },
            data: { description: variation.description },
          })
        }
      }
    }

    // Fetch updated character
    const updatedCharacter = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        variations: {
          include: {
            images: true,
          },
        },
      },
    })

    return NextResponse.json({ character: updatedCharacter })
  } catch (error) {
    console.error("Character update error:", error)
    return NextResponse.json(
      { error: "Failed to update character" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a character
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { characterId } = await params

    await prisma.character.delete({
      where: { id: characterId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Character deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete character" },
      { status: 500 }
    )
  }
}
