"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReferenceImageUploaderProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

export function ReferenceImageUploader({
  onUpload,
  isUploading = false,
}: ReferenceImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await onUpload(acceptedFiles[0])
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragActive || isDragging
          ? "border-accent bg-accent/5"
          : "border-border hover:border-accent/50",
        isUploading && "cursor-not-allowed opacity-50"
      )}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <>
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-accent" />
          <span className="text-sm text-[#6b6b6b]">Uploading...</span>
        </>
      ) : (
        <>
          <Upload className="mb-2 h-8 w-8 text-[#9ca3af]" />
          <span className="text-sm text-[#6b6b6b]">Upload Image</span>
        </>
      )}
    </div>
  )
}
