"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScriptInputProps {
  value: string
  onChange: (value: string) => void
  fileName?: string
  onFileNameChange?: (name: string | undefined) => void
  disabled?: boolean
}

export function ScriptInput({
  value,
  onChange,
  fileName,
  onFileNameChange,
  disabled = false,
}: ScriptInputProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/scripts/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to process file")
        }

        const { text } = await response.json()
        onChange(text)
        onFileNameChange?.(file.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process file")
      } finally {
        setIsProcessing(false)
      }
    },
    [onChange, onFileNameChange]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0])
      }
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    disabled: disabled || isProcessing,
  })

  const clearFile = () => {
    onChange("")
    onFileNameChange?.(undefined)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste" disabled={disabled}>
            <FileText className="mr-2 h-4 w-4" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" disabled={disabled}>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste">
          <Textarea
            placeholder="Paste your script here...

Example:
SCENE 1: THE DESERT - DAY
Abraham and Isaac walk through the barren desert landscape. The sun beats down mercilessly as they carry wood for the sacrifice..."
            className="min-h-[300px] font-mono text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="upload">
          {fileName ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2d2d2d]">{fileName}</p>
                    <p className="text-sm text-[#6b6b6b]">
                      {value.length.toLocaleString()} characters
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 max-h-[200px] overflow-auto rounded border border-border bg-background p-3">
                <pre className="whitespace-pre-wrap font-mono text-xs text-[#6b6b6b]">
                  {value.slice(0, 1000)}
                  {value.length > 1000 && "..."}
                </pre>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                isDragActive
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50",
                (disabled || isProcessing) &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <>
                  <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" />
                  <p className="text-sm text-[#6b6b6b]">Processing file...</p>
                </>
              ) : isDragActive ? (
                <>
                  <Upload className="mb-4 h-10 w-10 text-accent" />
                  <p className="text-sm text-accent">Drop the file here</p>
                </>
              ) : (
                <>
                  <Upload className="mb-4 h-10 w-10 text-[#9ca3af]" />
                  <p className="text-sm text-[#6b6b6b]">
                    Drag and drop your script file, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-[#9ca3af]">
                    Supports .docx and .txt files
                  </p>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <div className="rounded-md bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}
    </div>
  )
}
