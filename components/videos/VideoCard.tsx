"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  Play,
  Pause,
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
  MoreVertical,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MotionSelector } from "./MotionSelector"
import { ProviderSelector } from "./ProviderSelector"
import { cn } from "@/lib/utils"
import type {
  Shot,
  ImageGeneration,
  VideoGeneration,
  VideoProvider,
  MotionType,
} from "@prisma/client"

type ShotWithMedia = Shot & {
  images: ImageGeneration[]
  videos: VideoGeneration[]
}

interface VideoCardProps {
  shot: ShotWithMedia
  sceneTitle: string
  onGenerate: (
    shotId: string,
    imageId: string,
    provider: VideoProvider,
    motionType: MotionType
  ) => void
  onSelectVideo: (shotId: string, videoId: string) => void
  onRetry: (videoId: string) => void
  isGenerating?: boolean
  generatingVideoId?: string
}

export function VideoCard({
  shot,
  sceneTitle,
  onGenerate,
  onSelectVideo,
  onRetry,
  isGenerating = false,
  generatingVideoId,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [provider, setProvider] = useState<VideoProvider>("MINIMAX")
  const [motionType, setMotionType] = useState<MotionType>("SUBTLE")

  const selectedImage = shot.images.find((img) => img.selected)
  const selectedVideo = shot.videos.find((vid) => vid.selected)
  const hasVideos = shot.videos.length > 0

  // Get status info
  const getStatusInfo = (video: VideoGeneration) => {
    switch (video.status) {
      case "PENDING":
        return { icon: Loader2, color: "text-[#6b6b6b]", label: "Queued" }
      case "PROCESSING":
        return { icon: Loader2, color: "text-accent", label: "Processing" }
      case "COMPLETED":
        return { icon: Check, color: "text-green-600", label: "Complete" }
      case "FAILED":
        return { icon: AlertCircle, color: "text-red-500", label: "Failed" }
      default:
        return { icon: Loader2, color: "text-[#6b6b6b]", label: "Unknown" }
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleGenerate = () => {
    if (selectedImage) {
      onGenerate(shot.id, selectedImage.id, provider, motionType)
    }
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
            <DropdownMenuItem onClick={handleGenerate} disabled={!selectedImage}>
              Regenerate video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="p-3 space-y-3">
        {/* Source Image */}
        {selectedImage ? (
          <div className="relative aspect-video rounded-md overflow-hidden bg-primary/5">
            <Image
              src={selectedImage.imageUrl}
              alt={`Shot ${shot.shotIndex + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video rounded-md border-2 border-dashed border-border flex items-center justify-center">
            <p className="text-sm text-[#6b6b6b]">No image selected</p>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-[#6b6b6b] line-clamp-2">{shot.description}</p>

        {/* Provider & Motion Type */}
        <div className="space-y-2">
          <ProviderSelector
            value={provider}
            onChange={setProvider}
            disabled={isGenerating}
          />
          <MotionSelector
            value={motionType}
            onChange={setMotionType}
            disabled={isGenerating}
          />
        </div>

        {/* Video Preview / Status */}
        {hasVideos ? (
          <div className="space-y-2">
            {shot.videos.map((video) => {
              const statusInfo = getStatusInfo(video)
              const StatusIcon = statusInfo.icon
              const isThisGenerating =
                generatingVideoId === video.id ||
                video.status === "PROCESSING" ||
                video.status === "PENDING"

              return (
                <div
                  key={video.id}
                  className={cn(
                    "relative rounded-md overflow-hidden border-2 transition-all",
                    video.selected
                      ? "border-accent ring-2 ring-accent/20"
                      : "border-transparent"
                  )}
                >
                  {video.status === "COMPLETED" && video.videoUrl ? (
                    <div className="relative aspect-video bg-black">
                      <video
                        ref={video.selected ? videoRef : undefined}
                        src={video.videoUrl}
                        className="w-full h-full object-contain"
                        loop
                        playsInline
                        onEnded={() => setIsPlaying(false)}
                      />
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="h-12 w-12 text-white" />
                        ) : (
                          <Play className="h-12 w-12 text-white" />
                        )}
                      </button>
                      {!video.selected && (
                        <button
                          onClick={() => onSelectVideo(shot.id, video.id)}
                          className="absolute top-2 right-2 px-2 py-1 bg-white rounded text-xs font-medium hover:bg-accent hover:text-primary transition-colors"
                        >
                          Select
                        </button>
                      )}
                      {video.selected && (
                        <div className="absolute top-2 right-2 bg-accent text-primary rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ) : video.status === "FAILED" ? (
                    <div className="aspect-video bg-red-50 flex flex-col items-center justify-center gap-2 p-4">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <p className="text-xs text-red-600 text-center">
                        {video.errorMessage || "Video generation failed"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRetry(video.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <div className="aspect-video bg-primary/5 flex flex-col items-center justify-center gap-2">
                      <StatusIcon
                        className={cn(
                          "h-8 w-8",
                          statusInfo.color,
                          isThisGenerating && "animate-spin"
                        )}
                      />
                      <p className="text-xs text-[#6b6b6b]">{statusInfo.label}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedImage}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
