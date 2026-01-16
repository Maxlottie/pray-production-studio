"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, Film } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScriptInput } from "@/components/projects/ScriptInput"
import { ScriptViewer } from "./ScriptViewer"
import { ShotList } from "./ShotList"
import type { Project, Script, Scene, Shot, CameraMovement, ShotMood, ShotStatus } from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }
type SceneWithShots = Scene & { shots: SerializedShot[] }

interface ShotsPageClientProps {
  project: Project & {
    scripts: Script[]
    scenes: SceneWithShots[]
  }
}

export function ShotsPageClient({ project }: ShotsPageClientProps) {
  const router = useRouter()
  const [scriptText, setScriptText] = useState("")
  const [fileName, setFileName] = useState<string | undefined>()
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedScriptVersion, setSelectedScriptVersion] = useState(
    project.scripts[0]?.version || 1
  )

  const hasScript = project.scripts.length > 0
  const hasShots = project.scenes.some((scene) => scene.shots.length > 0)

  const handleParseScript = async () => {
    if (!scriptText.trim()) {
      setError("Please enter or upload a script")
      return
    }

    setIsParsing(true)
    setError(null)

    try {
      const response = await fetch("/api/scripts/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          scriptText: scriptText.trim(),
          sourceFileName: fileName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to parse script")
      }

      // Refresh the page to show the new shots
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse script")
    } finally {
      setIsParsing(false)
    }
  }

  const handleUpdateShot = async (
    shotId: string,
    updates: Partial<{
      description: string
      cameraMovement: CameraMovement
      duration: number
      mood: ShotMood
      status: ShotStatus
    }>
  ) => {
    setIsUpdating(true)

    try {
      const response = await fetch("/api/shots", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shotId,
          ...updates,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update shot")
      }

      router.refresh()
    } catch (err) {
      console.error("Error updating shot:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApproveAll = async () => {
    setIsUpdating(true)

    try {
      const response = await fetch("/api/shots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          action: "approve-all",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve all shots")
      }

      router.refresh()
    } catch (err) {
      console.error("Error approving all shots:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const totalShots = project.scenes.reduce((sum, scene) => sum + scene.shots.length, 0)
  const approvedShots = project.scenes.reduce(
    (sum, scene) =>
      sum + scene.shots.filter((shot) => shot.status === "APPROVED").length,
    0
  )
  const allApproved = totalShots > 0 && approvedShots === totalShots

  // No script yet - show script input
  if (!hasScript) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-accent" />
              Upload Your Script
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-[#6b6b6b]">
              Paste your script text or upload a .docx file. The AI will analyze
              it and break it down into scenes and shots for video production.
            </p>

            <ScriptInput
              value={scriptText}
              onChange={setScriptText}
              fileName={fileName}
              onFileNameChange={setFileName}
              disabled={isParsing}
            />

            {error && (
              <div className="rounded-md bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={handleParseScript}
                disabled={isParsing || !scriptText.trim()}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Greenlighting...
                  </>
                ) : (
                  "Greenlight Script"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Has script - show two-column layout with script viewer and shot list
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      {/* Left - Script Viewer */}
      <div className="lg:h-[calc(100vh-200px)] lg:sticky lg:top-6">
        <ScriptViewer
          scripts={project.scripts}
          selectedVersion={selectedScriptVersion}
          onVersionChange={setSelectedScriptVersion}
        />
      </div>

      {/* Right - Shot List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#2d2d2d]">Shots</h2>
            <p className="text-sm text-[#6b6b6b]">
              {approvedShots} of {totalShots} shots approved
            </p>
          </div>
          <div className="flex items-center gap-3">
            {allApproved ? (
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                All shots approved
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleApproveAll}
                disabled={isUpdating || totalShots === 0}
              >
                Approve All
              </Button>
            )}
          </div>
        </div>

        <ShotList
          scenes={project.scenes}
          onUpdateShot={handleUpdateShot}
          isUpdating={isUpdating}
          defaultExpanded={true}
        />

        {hasShots && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="secondary"
              disabled={!allApproved}
              onClick={() => router.push(`/projects/${project.id}/images`)}
            >
              Advance to Storyboarding
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
