"use client"

import { useState } from "react"
import { RefreshCw, Check, Clock, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Shot, CameraMovement, ShotMood, ShotStatus } from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }

interface ShotCardProps {
  shot: SerializedShot
  onUpdate: (
    shotId: string,
    updates: Partial<{
      description: string
      cameraMovement: CameraMovement
      duration: number
      mood: ShotMood
      status: ShotStatus
    }>
  ) => void
  onRegenerateDescription?: (shotId: string) => void
  isUpdating?: boolean
}

const cameraMovementOptions: { value: CameraMovement; label: string }[] = [
  { value: "STATIC", label: "Static" },
  { value: "PAN_LEFT", label: "Pan Left" },
  { value: "PAN_RIGHT", label: "Pan Right" },
  { value: "ZOOM_IN", label: "Zoom In" },
  { value: "ZOOM_OUT", label: "Zoom Out" },
  { value: "PUSH_IN", label: "Push In" },
  { value: "HAND_HELD", label: "Hand Held" },
]

const moodOptions: { value: ShotMood; label: string }[] = [
  { value: "DRAMATIC", label: "Dramatic" },
  { value: "PEACEFUL", label: "Peaceful" },
  { value: "APOCALYPTIC", label: "Apocalyptic" },
  { value: "DIVINE", label: "Divine" },
  { value: "FOREBODING", label: "Foreboding" },
  { value: "ACTION", label: "Action" },
]

export function ShotCard({
  shot,
  onUpdate,
  onRegenerateDescription,
  isUpdating = false,
}: ShotCardProps) {
  const [localDescription, setLocalDescription] = useState(shot.description)

  const handleDescriptionBlur = () => {
    if (localDescription !== shot.description) {
      onUpdate(shot.id, { description: localDescription })
    }
  }

  const isApproved = shot.status === "APPROVED"

  return (
    <Card
      className={cn(
        "transition-all",
        isApproved && "border-success/50 bg-success/5"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={isApproved ? "success" : "outline"}>
              <Video className="mr-1 h-3 w-3" />
              Shot {shot.shotIndex + 1}
            </Badge>
            {isApproved && (
              <Badge variant="success">
                <Check className="mr-1 h-3 w-3" />
                Approved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isApproved}
              onCheckedChange={(checked) =>
                onUpdate(shot.id, {
                  status: checked ? "APPROVED" : "PENDING",
                })
              }
              disabled={isUpdating}
            />
            <span className="text-xs text-[#6b6b6b]">Approve</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <Textarea
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            className="min-h-[100px] text-sm"
            placeholder="Shot description..."
            disabled={isUpdating}
          />
          {onRegenerateDescription && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => onRegenerateDescription(shot.id)}
              disabled={isUpdating}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Regenerate Description
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3">
          {/* Camera Movement */}
          <div>
            <label className="text-xs font-medium text-[#6b6b6b] mb-1 block">
              Camera
            </label>
            <Select
              value={shot.cameraMovement}
              onValueChange={(value) =>
                onUpdate(shot.id, { cameraMovement: value as CameraMovement })
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cameraMovementOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-[#6b6b6b] mb-1 block">
              Duration
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Number(shot.duration)}
                onChange={(e) =>
                  onUpdate(shot.id, { duration: parseFloat(e.target.value) || 4 })
                }
                className="h-9 text-xs"
                min={1}
                max={30}
                step={0.5}
                disabled={isUpdating}
              />
              <Clock className="h-4 w-4 text-[#9ca3af]" />
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs font-medium text-[#6b6b6b] mb-1 block">
              Mood
            </label>
            <Select
              value={shot.mood}
              onValueChange={(value) =>
                onUpdate(shot.id, { mood: value as ShotMood })
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
