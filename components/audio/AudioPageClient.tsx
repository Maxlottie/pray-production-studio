"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioPlayer } from "./AudioPlayer"
import { NarrationRecorder } from "./NarrationRecorder"
import { TTSGenerator } from "./TTSGenerator"
import { MusicGenerator } from "./MusicGenerator"
import type { Project, Script, ProjectAudio } from "@prisma/client"

interface AudioPageClientProps {
  project: Project & {
    scripts: Script[]
    audio: ProjectAudio | null
  }
}

export function AudioPageClient({ project }: AudioPageClientProps) {
  const router = useRouter()
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [narrationUrl, setNarrationUrl] = useState(project.audio?.narrationUrl || null)
  const [musicUrl, setMusicUrl] = useState(project.audio?.musicUrl || null)

  // Get script text
  const scriptText =
    project.scripts[0]?.rawText || "No script available. Please add a script first."

  const handleTTSGenerate = useCallback(
    async (voiceId: string) => {
      setIsGeneratingTTS(true)
      try {
        const response = await fetch("/api/audio/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            text: scriptText,
            voiceId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate TTS")
        }

        const data = await response.json()
        setNarrationUrl(data.audioUrl)
        router.refresh()
      } catch (error) {
        console.error("TTS error:", error)
        alert("Failed to generate narration")
      } finally {
        setIsGeneratingTTS(false)
      }
    },
    [project.id, scriptText, router]
  )

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setIsUploading(true)
      try {
        // Get presigned URL
        const urlResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            filename: `narration_${Date.now()}.webm`,
            contentType: "audio/webm",
            type: "audio",
          }),
        })

        if (!urlResponse.ok) {
          throw new Error("Failed to get upload URL")
        }

        const { uploadUrl, fileUrl } = await urlResponse.json()

        // Upload the recording
        await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": "audio/webm" },
        })

        setNarrationUrl(fileUrl)
        router.refresh()
      } catch (error) {
        console.error("Upload error:", error)
        alert("Failed to upload recording")
      } finally {
        setIsUploading(false)
      }
    },
    [project.id, router]
  )

  const handleMusicGenerate = useCallback(
    async (style: string, customPrompt?: string) => {
      setIsGeneratingMusic(true)
      try {
        const response = await fetch("/api/audio/music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            style,
            customPrompt,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate music")
        }

        const data = await response.json()
        setMusicUrl(data.audioUrl)
        router.refresh()
      } catch (error) {
        console.error("Music error:", error)
        alert("Failed to generate music")
      } finally {
        setIsGeneratingMusic(false)
      }
    },
    [project.id, router]
  )

  const handleFileUpload = useCallback(
    async (file: File, type: "narration" | "music") => {
      setIsUploading(true)
      try {
        const urlResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            filename: `${type}_${Date.now()}.${file.name.split(".").pop()}`,
            contentType: file.type,
            type: "audio",
          }),
        })

        if (!urlResponse.ok) {
          throw new Error("Failed to get upload URL")
        }

        const { uploadUrl, fileUrl } = await urlResponse.json()

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })

        if (type === "narration") {
          setNarrationUrl(fileUrl)
        } else {
          setMusicUrl(fileUrl)
        }

        router.refresh()
      } catch (error) {
        console.error("Upload error:", error)
        alert("Failed to upload file")
      } finally {
        setIsUploading(false)
      }
    },
    [project.id, router]
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Narration Section */}
        <Card>
          <CardHeader>
            <CardTitle>Narration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {narrationUrl && (
              <div className="p-3 bg-primary/5 rounded-md">
                <AudioPlayer src={narrationUrl} />
              </div>
            )}

            <Tabs defaultValue="tts">
              <TabsList className="w-full">
                <TabsTrigger value="tts" className="flex-1">
                  Text-to-Speech
                </TabsTrigger>
                <TabsTrigger value="record" className="flex-1">
                  Record
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tts" className="mt-4">
                <TTSGenerator
                  text={scriptText}
                  onGenerate={handleTTSGenerate}
                  isGenerating={isGeneratingTTS}
                />
              </TabsContent>

              <TabsContent value="record" className="mt-4">
                <NarrationRecorder
                  onRecordingComplete={handleRecordingComplete}
                  isUploading={isUploading}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    id="narration-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "narration")
                    }}
                  />
                  <label htmlFor="narration-upload">
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      disabled={isUploading}
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Audio File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-[#6b6b6b] text-center">
                    Supports MP3, WAV, M4A formats
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Music Section */}
        <Card>
          <CardHeader>
            <CardTitle>Background Music</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {musicUrl && (
              <div className="p-3 bg-primary/5 rounded-md">
                <AudioPlayer src={musicUrl} />
              </div>
            )}

            <Tabs defaultValue="generate">
              <TabsList className="w-full">
                <TabsTrigger value="generate" className="flex-1">
                  Generate
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="mt-4">
                <MusicGenerator
                  onGenerate={handleMusicGenerate}
                  isGenerating={isGeneratingMusic}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    id="music-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, "music")
                    }}
                  />
                  <label htmlFor="music-upload">
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      disabled={isUploading}
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Music File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-[#6b6b6b] text-center">
                    Supports MP3, WAV, M4A formats
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Script Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Script</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[300px] overflow-y-auto p-4 bg-primary/5 rounded-md">
            <p className="text-sm text-[#2d2d2d] whitespace-pre-wrap">
              {scriptText}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${project.id}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}/shots`)}
          >
            Skip Audio
          </Button>
          <Button onClick={() => router.push(`/projects/${project.id}/shots`)}>
            Continue to Shots
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
