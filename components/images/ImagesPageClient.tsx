"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, Sparkles, ChevronLeft, ChevronRight, X, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ImageGrid } from "./ImageGrid"
import { PromptEditor } from "./PromptEditor"
import { getDisplayUrl } from "@/lib/image-url"
import { useAssistantContextOptional } from "@/components/assistant/AssistantContext"
import type { Scene, Shot, ImageGeneration, Project } from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }
type ShotWithImages = SerializedShot & { images: ImageGeneration[] }
type SceneWithShots = Scene & { shots: ShotWithImages[] }

interface ImagesPageClientProps {
  project: Project
  scenes: SceneWithShots[]
}

export function ImagesPageClient({ project, scenes }: ImagesPageClientProps) {
  const router = useRouter()
  const assistantContext = useAssistantContextOptional()
  const isAssistantWorking = assistantContext?.isAssistantWorking ?? false
  const [generatingShots, setGeneratingShots] = useState<Set<string>>(new Set())
  const [uploadingShots, setUploadingShots] = useState<Set<string>>(new Set())
  const [editingShot, setEditingShot] = useState<SerializedShot | null>(null)
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ url: string; shotIndex: number; imageIndex: number } | null>(null)

  // Get all images for arrow key navigation (use display URLs)
  const allImages = scenes.flatMap((scene) =>
    scene.shots.flatMap((shot) =>
      shot.images.map((image) => ({
        url: getDisplayUrl(image.imageUrl),
        shotIndex: shot.shotIndex,
      }))
    )
  )

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        // Go to previous image
        const currentIndex = lightboxImage.imageIndex
        if (currentIndex > 0) {
          const prevImage = allImages[currentIndex - 1]
          setLightboxImage({
            url: prevImage.url,
            shotIndex: prevImage.shotIndex,
            imageIndex: currentIndex - 1,
          })
        }
      } else if (e.key === "ArrowRight") {
        // Go to next image
        const currentIndex = lightboxImage.imageIndex
        if (currentIndex < allImages.length - 1) {
          const nextImage = allImages[currentIndex + 1]
          setLightboxImage({
            url: nextImage.url,
            shotIndex: nextImage.shotIndex,
            imageIndex: currentIndex + 1,
          })
        }
      } else if (e.key === "Escape") {
        setLightboxImage(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxImage, allImages])

  // Aspect ratio from project
  const aspectRatio = project.aspectRatio as "LANDSCAPE" | "PORTRAIT"

  // Calculate progress
  const allShots = scenes.flatMap((scene) => scene.shots)
  const shotsWithImages = allShots.filter((shot) => shot.images.length > 0)
  const progress = allShots.length > 0
    ? Math.round((shotsWithImages.length / allShots.length) * 100)
    : 0

  const handleGenerate = useCallback(async (shotId: string, customPrompt?: string, regenerate: boolean = false) => {
    setGeneratingShots((prev) => new Set(prev).add(shotId))

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shotId, customPrompt, regenerate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate image")
      }

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Generation error:", error)
      alert(error instanceof Error ? error.message : "Failed to generate image")
    } finally {
      setGeneratingShots((prev) => {
        const next = new Set(prev)
        next.delete(shotId)
        return next
      })
    }
  }, [router])

  const handleSelectImage = useCallback(async (shotId: string, imageId: string) => {
    try {
      const response = await fetch("/api/images/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shotId, imageId }),
      })

      if (!response.ok) {
        throw new Error("Failed to select image")
      }

      router.refresh()
    } catch (error) {
      console.error("Selection error:", error)
      alert("Failed to select image")
    }
  }, [router])

  const handleEditPrompt = useCallback((shot: SerializedShot) => {
    setEditingShot(shot)
    setIsPromptEditorOpen(true)
  }, [])

  const handleSavePrompt = useCallback(async (
    shotId: string,
    updates: { description?: string; mood?: string; visualStyle?: string }
  ) => {
    try {
      const response = await fetch(`/api/shots/${shotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update shot")
      }

      router.refresh()
    } catch (error) {
      console.error("Update error:", error)
      alert("Failed to update shot")
    }
  }, [router])

  const handleRegenerate = useCallback(async (
    shotId: string,
    type: "single" | "scene" | "forward" | "reference"
  ) => {
    // Regenerate with regenerate=true to delete existing images first
    if (type === "single") {
      await handleGenerate(shotId, undefined, true) // Pass regenerate=true
    } else {
      // Find shots to regenerate based on type
      const shotIndex = allShots.findIndex((s) => s.id === shotId)
      if (shotIndex === -1) return

      const shot = allShots[shotIndex]
      let shotsToRegenerate: ShotWithImages[] = []

      if (type === "scene") {
        // Regenerate remaining shots in scene
        shotsToRegenerate = allShots.filter(
          (s) => s.sceneId === shot.sceneId && s.shotIndex >= shot.shotIndex
        )
      } else if (type === "forward") {
        // Regenerate all following shots
        shotsToRegenerate = allShots.filter((s) => s.shotIndex >= shot.shotIndex)
      }

      // Generate sequentially to avoid rate limits, with regenerate=true
      for (const s of shotsToRegenerate) {
        await handleGenerate(s.id, undefined, true)
      }
    }
  }, [allShots, handleGenerate])

  const handleGenerateAll = useCallback(async () => {
    setIsGeneratingAll(true)

    // Get shots without images
    const shotsWithoutImages = allShots.filter((shot) => shot.images.length === 0)

    // Generate sequentially to avoid rate limits, continue on errors
    for (const shot of shotsWithoutImages) {
      try {
        setGeneratingShots((prev) => new Set(prev).add(shot.id))

        const response = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shotId: shot.id }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error(`Failed to generate image for shot ${shot.shotIndex + 1}:`, error.error)
          // Continue to next shot instead of stopping
        }

        router.refresh()
      } catch (error) {
        console.error(`Error generating shot ${shot.shotIndex + 1}:`, error)
        // Continue to next shot
      } finally {
        setGeneratingShots((prev) => {
          const next = new Set(prev)
          next.delete(shot.id)
          return next
        })
      }
    }

    setIsGeneratingAll(false)
    router.refresh()
  }, [allShots, router])

  const handleViewImage = useCallback((url: string, shotIndex: number) => {
    // Find the index in the allImages array
    const imageIndex = allImages.findIndex(img => img.url === url)
    setLightboxImage({ url, shotIndex, imageIndex: imageIndex >= 0 ? imageIndex : 0 })
  }, [allImages])

  const handleUpload = useCallback(async (shotId: string, file: File) => {
    setUploadingShots((prev) => new Set(prev).add(shotId))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("shotId", shotId)

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload image")
      }

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setUploadingShots((prev) => {
        const next = new Set(prev)
        next.delete(shotId)
        return next
      })
    }
  }, [router])

  const canContinue = allShots.every((shot) =>
    shot.images.some((img) => img.selected)
  )

  return (
    <div className="space-y-6">
      {/* Assistant Working Banner */}
      {isAssistantWorking && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg animate-pulse">
          <Bot className="h-5 w-5 text-accent animate-bounce" />
          <div className="flex-1">
            <span className="text-sm font-medium text-[#2d2d2d]">AI Assistant is working on your request...</span>
            <span className="text-xs text-[#6b6b6b] ml-2">This may take a moment if generating images.</span>
          </div>
          <Loader2 className="h-4 w-4 text-accent animate-spin" />
        </div>
      )}

      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[#6b6b6b]">
            {shotsWithImages.length} of {allShots.length} shots complete
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
          disabled={isGeneratingAll || allShots.length === 0}
        >
          {isGeneratingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All
            </>
          )}
        </Button>
      </div>

      {/* Image Grid */}
      <ImageGrid
        scenes={scenes}
        aspectRatio={aspectRatio}
        onGenerate={handleGenerate}
        onSelectImage={handleSelectImage}
        onEditPrompt={handleEditPrompt}
        onRegenerate={handleRegenerate}
        onViewImage={handleViewImage}
        onUpload={handleUpload}
        generatingShots={generatingShots}
        uploadingShots={uploadingShots}
      />

      {/* Prompt Editor Modal */}
      <PromptEditor
        shot={editingShot}
        aspectRatio={project.aspectRatio as "LANDSCAPE" | "PORTRAIT"}
        open={isPromptEditorOpen}
        onOpenChange={setIsPromptEditorOpen}
        onSave={handleSavePrompt}
        onGenerate={handleGenerate}
        isGenerating={editingShot ? generatingShots.has(editingShot.id) : false}
      />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${project.id}/shots`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Shots
        </Button>
        <Button
          onClick={() => router.push(`/projects/${project.id}/videos`)}
          disabled={!canContinue}
        >
          Continue to Videos
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className={`max-w-5xl p-0 overflow-hidden bg-black border-none ${aspectRatio === "PORTRAIT" ? "max-h-[90vh]" : ""}`}>
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Navigation arrows */}
          {lightboxImage && lightboxImage.imageIndex > 0 && (
            <button
              onClick={() => {
                const prevImage = allImages[lightboxImage.imageIndex - 1]
                setLightboxImage({
                  url: prevImage.url,
                  shotIndex: prevImage.shotIndex,
                  imageIndex: lightboxImage.imageIndex - 1,
                })
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {lightboxImage && lightboxImage.imageIndex < allImages.length - 1 && (
            <button
              onClick={() => {
                const nextImage = allImages[lightboxImage.imageIndex + 1]
                setLightboxImage({
                  url: nextImage.url,
                  shotIndex: nextImage.shotIndex,
                  imageIndex: lightboxImage.imageIndex + 1,
                })
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {lightboxImage && (
            <div className={`relative w-full ${aspectRatio === "PORTRAIT" ? "aspect-[9/16] max-h-[80vh]" : "aspect-video"}`}>
              <Image
                src={lightboxImage.url}
                alt={`Shot ${lightboxImage.shotIndex + 1} - Full View`}
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
          )}
          {lightboxImage && (
            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm">
              Shot {lightboxImage.shotIndex + 1} ({lightboxImage.imageIndex + 1}/{allImages.length})
            </div>
          )}
          {lightboxImage && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded text-xs">
              Use arrow keys to navigate
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
