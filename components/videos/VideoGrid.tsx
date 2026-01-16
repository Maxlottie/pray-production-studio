"use client"

import { VideoCard } from "./VideoCard"
import { Video } from "lucide-react"
import type {
  Scene,
  Shot,
  ImageGeneration,
  VideoGeneration,
  VideoProvider,
  MotionType,
} from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }
type ShotWithMedia = SerializedShot & {
  images: ImageGeneration[]
  videos: VideoGeneration[]
}
type SceneWithShots = Scene & { shots: ShotWithMedia[] }

interface VideoGridProps {
  scenes: SceneWithShots[]
  onGenerate: (
    shotId: string,
    imageId: string,
    provider: VideoProvider,
    motionType: MotionType
  ) => void
  onSelectVideo: (shotId: string, videoId: string) => void
  onRetry: (videoId: string) => void
  generatingShots: Set<string>
  generatingVideoId?: string
}

export function VideoGrid({
  scenes,
  onGenerate,
  onSelectVideo,
  onRetry,
  generatingShots,
  generatingVideoId,
}: VideoGridProps) {
  // Flatten all shots with their scene info
  const allShots = scenes.flatMap((scene) =>
    scene.shots.map((shot) => ({
      shot,
      sceneTitle: scene.title,
    }))
  )

  if (allShots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Video className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-[#2d2d2d]">No shots available</h3>
        <p className="mt-1 max-w-md text-sm text-[#6b6b6b]">
          Please generate and select images for your shots first in the Images tab.
        </p>
      </div>
    )
  }

  // Check if all shots have selected images
  const shotsWithoutImages = allShots.filter(
    ({ shot }) => !shot.images.some((img) => img.selected)
  )

  if (shotsWithoutImages.length === allShots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Video className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-[#2d2d2d]">No images selected</h3>
        <p className="mt-1 max-w-md text-sm text-[#6b6b6b]">
          Please select images for your shots in the Images tab before generating videos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {allShots.map(({ shot, sceneTitle }) => (
        <VideoCard
          key={shot.id}
          shot={shot}
          sceneTitle={sceneTitle}
          onGenerate={onGenerate}
          onSelectVideo={onSelectVideo}
          onRetry={onRetry}
          isGenerating={generatingShots.has(shot.id)}
          generatingVideoId={generatingVideoId}
        />
      ))}
    </div>
  )
}
