"use client"

import { ImageCard } from "./ImageCard"
import type { Scene, Shot, ImageGeneration } from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }
type ShotWithImages = SerializedShot & { images: ImageGeneration[] }
type SceneWithShots = Scene & { shots: ShotWithImages[] }

interface ImageGridProps {
  scenes: SceneWithShots[]
  aspectRatio: "LANDSCAPE" | "PORTRAIT"
  onGenerate: (shotId: string) => void
  onSelectImage: (shotId: string, imageId: string) => void
  onEditPrompt: (shot: SerializedShot) => void
  onRegenerate: (
    shotId: string,
    type: "single" | "scene" | "forward" | "reference"
  ) => void
  onViewImage: (imageUrl: string, shotIndex: number) => void
  onUpload: (shotId: string, file: File) => void
  generatingShots: Set<string>
  uploadingShots: Set<string>
}

export function ImageGrid({
  scenes,
  aspectRatio,
  onGenerate,
  onSelectImage,
  onEditPrompt,
  onRegenerate,
  onViewImage,
  onUpload,
  generatingShots,
  uploadingShots,
}: ImageGridProps) {
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
        <p className="text-[#6b6b6b]">
          No shots available. Please create shots first in the Shots tab.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {allShots.map(({ shot, sceneTitle }) => (
        <ImageCard
          key={shot.id}
          shot={shot}
          sceneTitle={sceneTitle}
          aspectRatio={aspectRatio}
          onGenerate={onGenerate}
          onSelectImage={onSelectImage}
          onEditPrompt={onEditPrompt}
          onRegenerate={onRegenerate}
          onViewImage={onViewImage}
          onUpload={onUpload}
          isGenerating={generatingShots.has(shot.id)}
          isUploading={uploadingShots.has(shot.id)}
        />
      ))}
    </div>
  )
}
