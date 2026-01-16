"use client"

import { CharacterCard } from "./CharacterCard"
import { Users } from "lucide-react"
import type {
  Character,
  CharacterVariation,
  CharacterReferenceImage,
} from "@prisma/client"

type VariationWithImages = CharacterVariation & {
  images: CharacterReferenceImage[]
}
type CharacterWithVariations = Character & {
  variations: VariationWithImages[]
}

interface CharacterGridProps {
  characters: CharacterWithVariations[]
  onCharacterClick: (character: CharacterWithVariations) => void
}

export function CharacterGrid({
  characters,
  onCharacterClick,
}: CharacterGridProps) {
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Users className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-[#2d2d2d]">
          No characters yet
        </h3>
        <p className="mt-1 max-w-md text-sm text-[#6b6b6b]">
          Create your first character to maintain visual consistency across your
          biblical scenes.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {characters.map((character) => (
        <CharacterCard
          key={character.id}
          character={character}
          onClick={() => onCharacterClick(character)}
        />
      ))}
    </div>
  )
}
