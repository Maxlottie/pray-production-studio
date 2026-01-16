"use client"

import { cn } from "@/lib/utils"
import type { AspectRatio } from "@prisma/client"

interface AspectRatioSelectorProps {
  value: AspectRatio
  onChange: (value: AspectRatio) => void
}

export function AspectRatioSelector({
  value,
  onChange,
}: AspectRatioSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Landscape 16:9 */}
      <button
        type="button"
        onClick={() => onChange("LANDSCAPE")}
        className={cn(
          "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
          value === "LANDSCAPE"
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50"
        )}
      >
        <div
          className={cn(
            "mb-3 w-full aspect-video rounded border-2",
            value === "LANDSCAPE"
              ? "border-accent bg-accent/20"
              : "border-border bg-primary/5"
          )}
        />
        <span
          className={cn(
            "font-medium",
            value === "LANDSCAPE" ? "text-accent" : "text-[#2d2d2d]"
          )}
        >
          16:9 Landscape
        </span>
        <span className="mt-1 text-xs text-[#6b6b6b]">YouTube, Desktop</span>
      </button>

      {/* Portrait 9:16 */}
      <button
        type="button"
        onClick={() => onChange("PORTRAIT")}
        className={cn(
          "flex flex-col items-center rounded-lg border-2 p-4 transition-all",
          value === "PORTRAIT"
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50"
        )}
      >
        <div
          className={cn(
            "mb-3 w-1/2 aspect-[9/16] rounded border-2",
            value === "PORTRAIT"
              ? "border-accent bg-accent/20"
              : "border-border bg-primary/5"
          )}
        />
        <span
          className={cn(
            "font-medium",
            value === "PORTRAIT" ? "text-accent" : "text-[#2d2d2d]"
          )}
        >
          9:16 Portrait
        </span>
        <span className="mt-1 text-xs text-[#6b6b6b]">TikTok, Reels, Shorts</span>
      </button>
    </div>
  )
}
