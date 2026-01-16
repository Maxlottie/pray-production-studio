"use client"

import { cn } from "@/lib/utils"
import type { VideoProvider } from "@prisma/client"

interface ProviderSelectorProps {
  value: VideoProvider
  onChange: (value: VideoProvider) => void
  disabled?: boolean
}

const providers: { value: VideoProvider; label: string }[] = [
  { value: "MINIMAX", label: "Minimax" },
  { value: "RUNWAY", label: "Runway" },
]

export function ProviderSelector({
  value,
  onChange,
  disabled = false,
}: ProviderSelectorProps) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {providers.map((provider) => (
        <button
          key={provider.value}
          type="button"
          onClick={() => onChange(provider.value)}
          disabled={disabled}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
            value === provider.value
              ? "bg-accent text-primary"
              : "bg-white text-[#6b6b6b] hover:bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {provider.label}
        </button>
      ))}
    </div>
  )
}
