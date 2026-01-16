"use client"

import { useState } from "react"
import { SceneHeader } from "./SceneHeader"
import { ShotCard } from "./ShotCard"
import type { Scene, Shot, CameraMovement, ShotMood, ShotStatus } from "@prisma/client"

type SceneWithShots = Scene & { shots: Shot[] }

interface ShotListProps {
  scenes: SceneWithShots[]
  onUpdateShot: (
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
  defaultExpanded?: boolean
}

export function ShotList({
  scenes,
  onUpdateShot,
  onRegenerateDescription,
  isUpdating = false,
  defaultExpanded = true,
}: ShotListProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(
    defaultExpanded ? new Set(scenes.map((s) => s.id)) : new Set()
  )

  const toggleScene = (sceneId: string) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev)
      if (next.has(sceneId)) {
        next.delete(sceneId)
      } else {
        next.add(sceneId)
      }
      return next
    })
  }

  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-[#6b6b6b]">No shots yet. Parse a script to generate shots.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {scenes.map((scene) => (
        <SceneHeader
          key={scene.id}
          scene={scene}
          isExpanded={expandedScenes.has(scene.id)}
          onToggle={() => toggleScene(scene.id)}
        >
          {scene.shots.map((shot) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              onUpdate={onUpdateShot}
              onRegenerateDescription={onRegenerateDescription}
              isUpdating={isUpdating}
            />
          ))}
        </SceneHeader>
      ))}
    </div>
  )
}
