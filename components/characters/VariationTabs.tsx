"use client"

import { cn } from "@/lib/utils"
import type { VariationType } from "@prisma/client"

interface VariationTabsProps {
  variations: {
    id: string
    type: VariationType
    customLabel: string | null
  }[]
  activeVariationId: string | null
  onSelect: (variationId: string) => void
}

const VARIATION_LABELS: Record<VariationType, string> = {
  YOUNG: "Young",
  ADULT: "Adult",
  OLD: "Old",
  CUSTOM: "Custom",
}

export function VariationTabs({
  variations,
  activeVariationId,
  onSelect,
}: VariationTabsProps) {
  return (
    <div className="flex border-b border-border">
      {variations.map((variation) => (
        <button
          key={variation.id}
          onClick={() => onSelect(variation.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeVariationId === variation.id
              ? "border-b-2 border-accent text-accent"
              : "text-[#6b6b6b] hover:text-[#2d2d2d]"
          )}
        >
          {variation.type === "CUSTOM" && variation.customLabel
            ? variation.customLabel
            : VARIATION_LABELS[variation.type]}
        </button>
      ))}
    </div>
  )
}
