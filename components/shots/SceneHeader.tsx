"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, MapPin, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Scene, Shot } from "@prisma/client"

interface SceneHeaderProps {
  scene: Scene & { shots: Shot[] }
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function SceneHeader({
  scene,
  isExpanded,
  onToggle,
  children,
}: SceneHeaderProps) {
  const totalDuration = scene.shots.reduce(
    (sum, shot) => sum + Number(shot.duration),
    0
  )
  const approvedCount = scene.shots.filter(
    (shot) => shot.status === "APPROVED"
  ).length
  const allApproved = approvedCount === scene.shots.length && scene.shots.length > 0

  return (
    <div className="mb-4">
      {/* Scene Header */}
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-card-hover",
          allApproved && "border-success/50 bg-success/5"
        )}
        onClick={onToggle}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Scene info */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>

              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Scene {scene.sceneIndex + 1}</Badge>
                  <h3 className="font-semibold text-[#2d2d2d]">{scene.title}</h3>
                </div>

                <div className="mt-1 flex items-center gap-4 text-sm text-[#6b6b6b]">
                  {scene.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {scene.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalDuration.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-[#2d2d2d]">
                  {scene.shots.length} shots
                </p>
                <p
                  className={cn(
                    "text-xs",
                    allApproved ? "text-success" : "text-[#6b6b6b]"
                  )}
                >
                  {approvedCount} approved
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shots */}
      {isExpanded && (
        <div className="mt-2 ml-6 pl-4 border-l-2 border-border space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}
