"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Play, Pause, SkipBack, SkipForward, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Shot, VideoGeneration, ImageGeneration } from "@prisma/client"

type ShotWithMedia = Shot & {
  images: ImageGeneration[]
  videos: VideoGeneration[]
}

interface PreviewPlayerProps {
  shots: ShotWithMedia[]
  aspectRatio: "LANDSCAPE" | "PORTRAIT"
  currentShotIndex: number
  onShotChange: (index: number) => void
  narrationUrl?: string | null
  musicUrl?: string | null
}

export function PreviewPlayer({
  shots,
  aspectRatio,
  currentShotIndex,
  onShotChange,
  narrationUrl,
  musicUrl,
}: PreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const narrationRef = useRef<HTMLAudioElement>(null)
  const musicRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const currentShot = shots[currentShotIndex]
  const selectedVideo = currentShot?.videos.find((v) => v.selected)
  const selectedImage = currentShot?.images.find((i) => i.selected)

  // Calculate total duration
  const totalDuration = shots.reduce(
    (sum, shot) => sum + Number(shot.duration),
    0
  )

  // Handle video end - move to next shot
  const handleVideoEnded = useCallback(() => {
    if (currentShotIndex < shots.length - 1) {
      onShotChange(currentShotIndex + 1)
    } else {
      setIsPlaying(false)
      onShotChange(0)
    }
  }, [currentShotIndex, shots.length, onShotChange])

  // Sync playback
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
    if (isPlaying && narrationRef.current) {
      narrationRef.current.play().catch(() => {})
    }
    if (isPlaying && musicRef.current) {
      musicRef.current.play().catch(() => {})
    }
  }, [isPlaying, currentShotIndex])

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause()
      narrationRef.current?.pause()
      musicRef.current?.pause()
    }
    setIsPlaying(!isPlaying)
  }

  const skipBack = () => {
    if (currentShotIndex > 0) {
      onShotChange(currentShotIndex - 1)
    }
  }

  const skipForward = () => {
    if (currentShotIndex < shots.length - 1) {
      onShotChange(currentShotIndex + 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate current time based on shot index
  const getCurrentTimeFromIndex = () => {
    return shots
      .slice(0, currentShotIndex)
      .reduce((sum, shot) => sum + Number(shot.duration), 0)
  }

  return (
    <div className="space-y-4">
      {/* Video Display */}
      <div
        className={cn(
          "relative bg-black rounded-lg overflow-hidden",
          aspectRatio === "LANDSCAPE" ? "aspect-video" : "aspect-[9/16] max-h-[60vh]"
        )}
      >
        {selectedVideo?.videoUrl ? (
          <video
            ref={videoRef}
            src={selectedVideo.videoUrl}
            className="w-full h-full object-contain"
            onEnded={handleVideoEnded}
            playsInline
          />
        ) : selectedImage ? (
          <Image
            src={selectedImage.imageUrl}
            alt={`Shot ${currentShotIndex + 1}`}
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-white/50">No media available</p>
          </div>
        )}

        {/* Shot indicator */}
        <div className="absolute top-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
          Shot {currentShotIndex + 1} of {shots.length}
        </div>

        {/* Fullscreen button */}
        <button className="absolute top-4 right-4 p-2 bg-black/50 rounded hover:bg-black/70 transition-colors">
          <Maximize2 className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Hidden audio elements */}
      {narrationUrl && (
        <audio ref={narrationRef} src={narrationUrl} preload="auto" />
      )}
      {musicUrl && (
        <audio ref={musicRef} src={musicUrl} preload="auto" loop />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={skipBack}
          disabled={currentShotIndex === 0}
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={skipForward}
          disabled={currentShotIndex === shots.length - 1}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#6b6b6b] w-12">
          {formatTime(getCurrentTimeFromIndex())}
        </span>
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{
              width: `${(getCurrentTimeFromIndex() / totalDuration) * 100}%`,
            }}
          />
        </div>
        <span className="text-xs text-[#6b6b6b] w-12 text-right">
          {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  )
}
