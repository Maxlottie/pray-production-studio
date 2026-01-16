"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { GripVertical, Volume2, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Shot, VideoGeneration, ImageGeneration } from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }
type ShotWithMedia = SerializedShot & {
  images: ImageGeneration[]
  videos: VideoGeneration[]
}

interface TimelineProps {
  shots: ShotWithMedia[]
  narrationUrl?: string | null
  musicUrl?: string | null
  onReorder?: (shotIds: string[]) => void
  currentShotIndex?: number
  onShotClick?: (index: number) => void
}

export function Timeline({
  shots,
  narrationUrl,
  musicUrl,
  onReorder,
  currentShotIndex = 0,
  onShotClick,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Calculate total duration
  const totalDuration = shots.reduce(
    (sum, shot) => sum + Number(shot.duration),
    0
  )

  // Calculate position as percentage
  const getPositionPercent = (index: number) => {
    const preceding = shots.slice(0, index)
    const precedingDuration = preceding.reduce(
      (sum, shot) => sum + Number(shot.duration),
      0
    )
    return (precedingDuration / totalDuration) * 100
  }

  // Calculate width as percentage
  const getWidthPercent = (duration: number) => {
    return (Number(duration) / totalDuration) * 100
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newShots = [...shots]
    const [draggedShot] = newShots.splice(draggedIndex, 1)
    newShots.splice(targetIndex, 0, draggedShot)

    setDraggedIndex(targetIndex)
    onReorder?.(newShots.map((s) => s.id))
  }

  return (
    <div className="space-y-2">
      {/* Video Track */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
          <span className="w-20">Video</span>
        </div>
        <div
          ref={containerRef}
          className="relative h-20 bg-primary/5 rounded-md overflow-hidden"
        >
          {shots.map((shot, index) => {
            const selectedImage = shot.images.find((img) => img.selected)
            const selectedVideo = shot.videos.find((vid) => vid.selected)

            return (
              <div
                key={shot.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onClick={() => onShotClick?.(index)}
                className={cn(
                  "absolute top-0 h-full flex items-center border-r border-white/20 cursor-pointer transition-all",
                  index === currentShotIndex
                    ? "ring-2 ring-accent ring-inset z-10"
                    : "hover:ring-1 hover:ring-accent/50",
                  draggedIndex === index && "opacity-50"
                )}
                style={{
                  left: `${getPositionPercent(index)}%`,
                  width: `${getWidthPercent(Number(shot.duration))}%`,
                }}
              >
                {selectedImage && (
                  <Image
                    src={selectedImage.imageUrl}
                    alt={`Shot ${shot.shotIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                  <span className="text-[10px] text-white font-medium">
                    {shot.shotIndex + 1}
                  </span>
                  <span className="text-[10px] text-white/80">
                    {Number(shot.duration)}s
                  </span>
                </div>
                <div className="absolute top-1 left-1 opacity-50 hover:opacity-100">
                  <GripVertical className="h-3 w-3 text-white" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Audio Tracks */}
      {narrationUrl && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
            <Volume2 className="h-3 w-3" />
            <span>Narration</span>
          </div>
          <div className="relative h-8 bg-blue-500/20 rounded-md">
            <div className="absolute inset-0 flex items-center px-2">
              <div className="w-full h-2 bg-blue-500/40 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {musicUrl && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6b6b6b]">
            <Music className="h-3 w-3" />
            <span>Music</span>
          </div>
          <div className="relative h-8 bg-green-500/20 rounded-md">
            <div className="absolute inset-0 flex items-center px-2">
              <div className="w-full h-2 bg-green-500/40 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time markers */}
      <div className="flex justify-between text-xs text-[#6b6b6b] px-1">
        <span>0:00</span>
        <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, "0")}</span>
      </div>
    </div>
  )
}
