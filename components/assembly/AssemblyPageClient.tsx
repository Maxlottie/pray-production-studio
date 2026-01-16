"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Check, Clock, Video, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Timeline } from "./Timeline"
import { PreviewPlayer } from "./PreviewPlayer"
import { ExportOptions } from "./ExportOptions"
import type {
  Project,
  Scene,
  Shot,
  ImageGeneration,
  VideoGeneration,
  ProjectAudio,
} from "@prisma/client"

type ShotWithMedia = Shot & {
  images: ImageGeneration[]
  videos: VideoGeneration[]
}

type SceneWithShots = Scene & {
  shots: ShotWithMedia[]
}

interface AssemblyPageClientProps {
  project: Project & {
    scenes: SceneWithShots[]
    audio: ProjectAudio | null
  }
}

export function AssemblyPageClient({ project }: AssemblyPageClientProps) {
  const router = useRouter()
  const [currentShotIndex, setCurrentShotIndex] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  // Flatten shots from all scenes
  const allShots = project.scenes.flatMap((scene) => scene.shots)

  // Calculate stats
  const totalDuration = allShots.reduce(
    (sum, shot) => sum + Number(shot.duration),
    0
  )
  const shotsWithVideos = allShots.filter((shot) =>
    shot.videos.some((v) => v.selected && v.status === "COMPLETED")
  )
  const shotsWithImages = allShots.filter((shot) =>
    shot.images.some((i) => i.selected)
  )

  const handleExportToDrive = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to export to Drive")
      }

      const data = await response.json()
      return data.folderUrl
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export to Google Drive")
      return null
    } finally {
      setIsExporting(false)
    }
  }, [project.id])

  const handleDownloadXML = useCallback(async () => {
    try {
      const response = await fetch("/api/export/premiere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate XML")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, "_")}.xml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("XML download error:", error)
      alert("Failed to download XML")
    }
  }, [project.id, project.title])

  const handleDownloadAll = useCallback(async () => {
    setIsExporting(true)
    try {
      // For now, just download the XML
      // Full ZIP download would require server-side processing
      await handleDownloadXML()
    } finally {
      setIsExporting(false)
    }
  }, [handleDownloadXML])

  const handleMarkComplete = useCallback(async () => {
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      router.refresh()
    } catch (error) {
      console.error("Status update error:", error)
    }
  }, [project.id, router])

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, "0")}
                </p>
                <p className="text-xs text-[#6b6b6b]">Total Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{allShots.length}</p>
                <p className="text-xs text-[#6b6b6b]">Total Shots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{shotsWithImages.length}</p>
                <p className="text-xs text-[#6b6b6b]">Images Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge
                variant={project.aspectRatio === "LANDSCAPE" ? "secondary" : "outline"}
              >
                {project.aspectRatio === "LANDSCAPE" ? "16:9" : "9:16"}
              </Badge>
              <div>
                <p className="text-sm font-medium">{project.aspectRatio}</p>
                <p className="text-xs text-[#6b6b6b]">Aspect Ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline
            shots={allShots}
            narrationUrl={project.audio?.narrationUrl}
            musicUrl={project.audio?.musicUrl}
            currentShotIndex={currentShotIndex}
            onShotClick={setCurrentShotIndex}
          />
        </CardContent>
      </Card>

      {/* Preview Player */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <PreviewPlayer
            shots={allShots}
            aspectRatio={project.aspectRatio as "LANDSCAPE" | "PORTRAIT"}
            currentShotIndex={currentShotIndex}
            onShotChange={setCurrentShotIndex}
            narrationUrl={project.audio?.narrationUrl}
            musicUrl={project.audio?.musicUrl}
          />
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportOptions
            projectId={project.id}
            projectTitle={project.title}
            onExportToDrive={handleExportToDrive}
            onDownloadAll={handleDownloadAll}
            onDownloadXML={handleDownloadXML}
            isExporting={isExporting}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${project.id}/videos`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
        <Button
          onClick={handleMarkComplete}
          disabled={project.status === "COMPLETED"}
        >
          {project.status === "COMPLETED" ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Mark as Complete
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
