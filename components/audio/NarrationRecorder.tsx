"use client"

import { useState, useRef, useCallback } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NarrationRecorderProps {
  onRecordingComplete: (blob: Blob) => Promise<void>
  isUploading?: boolean
}

export function NarrationRecorder({
  onRecordingComplete,
  isUploading = false,
}: NarrationRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        stream.getTracks().forEach((track) => track.stop())
        await onRecordingComplete(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
      alert("Failed to access microphone. Please check your permissions.")
    }
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex items-center justify-center p-6 rounded-lg border-2 border-dashed transition-colors",
          isRecording
            ? "border-red-500 bg-red-50"
            : "border-border hover:border-accent/50"
        )}
      >
        {isRecording ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                <Mic className="h-8 w-8 text-white" />
              </div>
            </div>
            <span className="text-lg font-mono text-red-600">
              {formatTime(recordingTime)}
            </span>
            <span className="text-sm text-red-600">Recording...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#6b6b6b]">
            <Mic className="h-8 w-8" />
            <span className="text-sm">Click to start recording</span>
          </div>
        )}
      </div>

      <Button
        variant={isRecording ? "outline" : "secondary"}
        className={cn("w-full", isRecording && "border-red-500 text-red-600")}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : isRecording ? (
          <>
            <Square className="mr-2 h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Start Recording
          </>
        )}
      </Button>
    </div>
  )
}
