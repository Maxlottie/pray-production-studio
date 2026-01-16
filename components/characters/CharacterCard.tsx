"use client"

import Image from "next/image"
import { User, ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

interface CharacterCardProps {
  character: CharacterWithVariations
  onClick: () => void
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  // Find primary image across all variations
  const primaryImage = character.variations
    .flatMap((v) => v.images)
    .find((img) => img.isPrimary)

  const firstImage =
    primaryImage ||
    character.variations.flatMap((v) => v.images)[0]

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-card-hover"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square bg-primary/5">
          {firstImage ? (
            <Image
              src={firstImage.imageUrl}
              alt={character.name}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <User className="h-16 w-16 text-[#9ca3af]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-[#2d2d2d]">{character.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {character.variations.length} variation
              {character.variations.length !== 1 ? "s" : ""}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-[#6b6b6b]">
              <ImageIcon className="h-3 w-3" />
              {character.variations.reduce(
                (acc, v) => acc + v.images.length,
                0
              )}{" "}
              images
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
