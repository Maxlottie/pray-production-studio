"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MotionType } from "@prisma/client"

interface MotionSelectorProps {
  value: MotionType
  onChange: (value: MotionType) => void
  disabled?: boolean
}

const motionOptions: { value: MotionType; label: string; description: string }[] = [
  { value: "SUBTLE", label: "Subtle", description: "Minimal movement, atmospheric" },
  { value: "PAN_LEFT", label: "Pan Left", description: "Smooth horizontal pan left" },
  { value: "PAN_RIGHT", label: "Pan Right", description: "Smooth horizontal pan right" },
  { value: "ZOOM_IN", label: "Zoom In", description: "Dramatic zoom toward subject" },
  { value: "ZOOM_OUT", label: "Zoom Out", description: "Epic pullback shot" },
  { value: "PUSH_IN", label: "Push In", description: "Dolly forward movement" },
  { value: "HAND_HELD", label: "Hand Held", description: "Documentary-style shake" },
  { value: "CUSTOM", label: "Custom", description: "Custom motion settings" },
]

export function MotionSelector({
  value,
  onChange,
  disabled = false,
}: MotionSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as MotionType)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select motion type" />
      </SelectTrigger>
      <SelectContent>
        {motionOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex flex-col">
              <span>{option.label}</span>
              <span className="text-xs text-[#6b6b6b]">{option.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { motionOptions }
