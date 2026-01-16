"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Check, Loader2, ImagePlus, Pencil, MoreVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getDisplayUrl } from "@/lib/image-url"
import type { Shot, ImageGeneration } from "@prisma/client"

// Estimated time for generating 4 images (in seconds)
// Based on real-world testing: ~60-70 seconds for 4 parallel image generations
const ESTIMATED_GENERATION_TIME = 70

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }

interface ImageCardProps {
  shot: SerializedShot & { images: ImageGeneration[] }
  sceneTitle: string
  aspectRatio: "LANDSCAPE" | "PORTRAIT"
  onGenerate: (shotId: string) => void
  onSelectImage: (shotId: string, imageId: string) => void
  onEditPrompt: (shot: SerializedShot) => void
  onRegenerate: (
    shotId: string,
    type: "single" | "scene" | "forward" | "reference"
  ) => void
  onViewImage: (imageUrl: string, shotIndex: number) => void
  isGenerating?: boolean
}

export function ImageCard({
  shot,
  sceneTitle,
  aspectRatio,
  onGenerate,
  onSelectImage,
  onEditPrompt,
  onRegenerate,
  onViewImage,
  isGenerating = false,
}: ImageCardProps) {
  // Progress bar state
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start/stop progress bar when generation starts/stops
  useEffect(() => {
    if (isGenerating) {
      // Reset progress
      setProgress(0)
      setElapsedTime(0)

      // Update progress every 500ms
      progressIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newElapsed = prev + 0.5
          // Progress follows a curve that slows down near the end (never reaches 100%)
          const newProgress = Math.min(95, (newElapsed / ESTIMATED_GENERATION_TIME) * 100 * 0.95)
          setProgress(newProgress)
          return newElapsed
        })
      }, 500)
    } else {
      // Stop progress and reset
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      setProgress(0)
      setElapsedTime(0)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isGenerating])

  // Dynamic aspect ratio class based on project settings
  const aspectClass = aspectRatio === "PORTRAIT" ? "aspect-[9/16]" : "aspect-video"
  const selectedImage = shot.images.find((img) => img.selected)
  const hasImages = shot.images.length > 0

  // Format remaining time
  const remainingSeconds = Math.max(0, Math.ceil(ESTIMATED_GENERATION_TIME - elapsedTime))
  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `~${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `~${seconds}s`
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Shot {shot.shotIndex + 1}
          </Badge>
          <span className="text-xs text-[#6b6b6b] truncate max-w-[120px]">
            {sceneTitle}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditPrompt(shot)} disabled={isGenerating}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Prompt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRegenerate(shot.id, "single")}
              disabled={isGenerating}
            >
              {isGenerating ? "Regenerating..." : "Regenerate this shot"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRegenerate(shot.id, "scene")}
              disabled={isGenerating}
            >
              Regenerate rest of scene
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRegenerate(shot.id, "forward")}
              disabled={isGenerating}
            >
              Regenerate all following
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRegenerate(shot.id, "reference")}
              disabled={isGenerating}
            >
              Use as reference for following
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image Grid */}
      <CardContent className="p-3">
        {/* Description */}
        <p className="text-xs text-[#6b6b6b] mb-3 line-clamp-2">
          {shot.description}
        </p>

        {/* Image Grid (2x2) */}
        <div className="relative">
          {/* Loading overlay with progress bar when regenerating existing images */}
          {isGenerating && hasImages && (
            <div className="absolute inset-0 z-10 bg-black/80 rounded-md flex flex-col items-center justify-center gap-4 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="text-white text-sm font-medium">Generating images...</span>

              {/* Progress bar */}
              <div className="w-full max-w-[200px]">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-white/60 text-xs">{Math.round(progress)}%</span>
                  <span className="text-white/60 text-xs">{formatTime(remainingSeconds)} remaining</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress card when generating NEW images (no existing images) */}
          {isGenerating && !hasImages ? (
            <div className="bg-primary/5 border-2 border-dashed border-accent/30 rounded-md flex flex-col items-center justify-center gap-4 p-8">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <span className="text-[#2d2d2d] text-sm font-medium">Generating 4 images...</span>

              {/* Progress bar */}
              <div className="w-full max-w-[220px]">
                <div className="h-2.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[#6b6b6b] text-xs font-medium">{Math.round(progress)}%</span>
                  <span className="text-[#6b6b6b] text-xs">{formatTime(remainingSeconds)} remaining</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((index) => {
                const image = shot.images[index]

                if (image) {
                  const isSelected = image.selected

                  return (
                    <div
                      key={image.id}
                      className={cn(
                        `relative ${aspectClass} rounded-md overflow-hidden border-2 transition-all group cursor-pointer`,
                        isSelected
                          ? "border-accent ring-2 ring-accent/20"
                          : "border-transparent hover:border-accent/50",
                        isGenerating && "opacity-50"
                      )}
                      onClick={() => !isGenerating && onViewImage(getDisplayUrl(image.imageUrl), shot.shotIndex)}
                    >
                      <Image
                        src={getDisplayUrl(image.imageUrl)}
                        alt={`Shot ${shot.shotIndex + 1} - Option ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                      />
                      {/* Select button - always visible in corner */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isGenerating) onSelectImage(shot.id, image.id)
                        }}
                        className={cn(
                          "absolute top-1 right-1 rounded-full p-1 transition-all",
                          isSelected
                            ? "bg-accent text-primary"
                            : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
                        )}
                        title={isSelected ? "Selected" : "Click to select"}
                        disabled={isGenerating}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  )
                }

                // Empty slot (only shown when not generating)
                return (
                  <button
                    key={index}
                    onClick={() => onGenerate(shot.id)}
                    disabled={isGenerating}
                    className={cn(
                      `${aspectClass} rounded-md border-2 border-dashed border-border flex items-center justify-center transition-colors`,
                      !isGenerating && "hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    <ImagePlus className="h-5 w-5 text-[#9ca3af]" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Generate Button - only show when no images and not generating */}
        {!hasImages && !isGenerating && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-3"
            onClick={() => onGenerate(shot.id)}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Generate Images
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
