"use client"

import { useState } from "react"
import { Loader2, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TTSGeneratorProps {
  text: string
  onGenerate: (voiceId: string) => Promise<void>
  isGenerating?: boolean
}

const voices = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm female narrator" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Strong male narrator" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft female voice" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Deep male narrator" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Warm female voice" },
]

export function TTSGenerator({
  text,
  onGenerate,
  isGenerating = false,
}: TTSGeneratorProps) {
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id)

  const handleGenerate = async () => {
    await onGenerate(selectedVoice)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
          Voice
        </label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                <div className="flex flex-col">
                  <span>{voice.name}</span>
                  <span className="text-xs text-[#6b6b6b]">
                    {voice.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-3 bg-primary/5 rounded-md">
        <p className="text-sm text-[#6b6b6b] line-clamp-3">{text}</p>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !text}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Volume2 className="mr-2 h-4 w-4" />
            Generate Narration
          </>
        )}
      </Button>
    </div>
  )
}
