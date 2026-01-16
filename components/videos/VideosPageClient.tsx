"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoGrid } from "./VideoGrid"
import type {
  Scene,
  Shot,
  ImageGeneration,
  VideoGeneration,
  Project,
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

interface VideosPageClientProps {
  project: Project
  scenes: SceneWithShots[]
}

export function VideosPageClient({ project, scenes }: VideosPageClientProps) {
  const router = useRouter()
  const [generatingShots, setGeneratingShots] = useState<Set<string>>(new Set())
  const [generatingVideoId, setGeneratingVideoId] = useState<string | undefined>()
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)

  // Calculate progress
  const allShots = scenes.flatMap((scene) => scene.shots)
  const shotsWithSelectedImages = allShots.filter((shot) =>
    shot.images.some((img) => img.selected)
  )
  const shotsWithCompletedVideos = allShots.filter((shot) =>
    shot.videos.some((vid) => vid.status === "COMPLETED")
  )
  const progress =
    shotsWithSelectedImages.length > 0
      ? Math.round(
          (shotsWithCompletedVideos.length / shotsWithSelectedImages.length) * 100
        )
      : 0

  // Poll for video status updates
  useEffect(() => {
    const processingVideos = allShots
      .flatMap((shot) => shot.videos)
      .filter(
        (vid) => vid.status === "PENDING" || vid.status === "PROCESSING"
      )

    if (processingVideos.length === 0) return

    const interval = setInterval(() => {
      router.refresh()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [allShots, router])

  const handleGenerate = useCallback(
    async (
      shotId: string,
      imageId: string,
      provider: VideoProvider,
      motionType: MotionType
    ) => {
      setGeneratingShots((prev) => new Set(prev).add(shotId))

      try {
        const response = await fetch("/api/videos/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shotId, imageId, provider, motionType }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to generate video")
        }

        const data = await response.json()
        if (data.video) {
          setGeneratingVideoId(data.video.id)
        }

        // Refresh to show the new video record
        router.refresh()
      } catch (error) {
        console.error("Generation error:", error)
        alert(error instanceof Error ? error.message : "Failed to generate video")
      } finally {
        setGeneratingShots((prev) => {
          const next = new Set(prev)
          next.delete(shotId)
          return next
        })
      }
    },
    [router]
  )

  const handleSelectVideo = useCallback(
    async (shotId: string, videoId: string) => {
      try {
        const response = await fetch("/api/videos/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shotId, videoId }),
        })

        if (!response.ok) {
          throw new Error("Failed to select video")
        }

        router.refresh()
      } catch (error) {
        console.error("Selection error:", error)
        alert("Failed to select video")
      }
    },
    [router]
  )

  const handleRetry = useCallback(
    async (videoId: string) => {
      // Find the video to get shot and image info
      const video = allShots
        .flatMap((shot) => shot.videos)
        .find((v) => v.id === videoId)

      if (video) {
        const shot = allShots.find((s) => s.id === video.shotId)
        if (shot) {
          await handleGenerate(
            shot.id,
            video.sourceImageId,
            video.provider,
            video.motionType
          )
        }
      }
    },
    [allShots, handleGenerate]
  )

  const handleGenerateAll = useCallback(async () => {
    setIsGeneratingAll(true)

    // Get shots with selected images but no completed videos
    const shotsToGenerate = shotsWithSelectedImages.filter(
      (shot) => !shot.videos.some((vid) => vid.status === "COMPLETED")
    )

    // Generate sequentially to avoid rate limits
    for (const shot of shotsToGenerate) {
      const selectedImage = shot.images.find((img) => img.selected)
      if (selectedImage) {
        await handleGenerate(shot.id, selectedImage.id, "MINIMAX", "SUBTLE")
        // Add a small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    setIsGeneratingAll(false)
  }, [shotsWithSelectedImages, handleGenerate])

  const canContinue = shotsWithSelectedImages.every((shot) =>
    shot.videos.some((vid) => vid.selected && vid.status === "COMPLETED")
  )

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[#6b6b6b]">
            {shotsWithCompletedVideos.length} of {shotsWithSelectedImages.length}{" "}
            videos complete
          </div>
          <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleGenerateAll}
          disabled={isGeneratingAll || shotsWithSelectedImages.length === 0}
        >
          {isGeneratingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All Videos
            </>
          )}
        </Button>
      </div>

      {/* Video Grid */}
      <VideoGrid
        scenes={scenes}
        onGenerate={handleGenerate}
        onSelectVideo={handleSelectVideo}
        onRetry={handleRetry}
        generatingShots={generatingShots}
        generatingVideoId={generatingVideoId}
      />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${project.id}/images`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Images
        </Button>
        <Button
          onClick={() => router.push(`/projects/${project.id}/assembly`)}
          disabled={!canContinue}
        >
          Continue to Assembly
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
