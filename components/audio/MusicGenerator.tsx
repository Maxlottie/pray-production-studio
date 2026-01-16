"use client"

import { useState } from "react"
import { Loader2, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface MusicGeneratorProps {
  onGenerate: (style: string, customPrompt?: string) => Promise<void>
  isGenerating?: boolean
}

const musicStyles = [
  {
    id: "CINEMATIC_ORCHESTRAL",
    name: "Cinematic Orchestral",
    prompt: "epic orchestral soundtrack, biblical, cinematic, dramatic strings and brass",
  },
  {
    id: "AMBIENT_TENSION",
    name: "Ambient Tension",
    prompt: "ambient tension, suspenseful, mysterious, dark atmospheric pads",
  },
  {
    id: "EPIC_BATTLE",
    name: "Epic Battle",
    prompt: "epic battle music, intense percussion, dramatic brass, war drums",
  },
  {
    id: "PEACEFUL_MEDITATIVE",
    name: "Peaceful/Meditative",
    prompt: "peaceful meditation music, soft piano, gentle strings, contemplative",
  },
  {
    id: "DRAMATIC_STRINGS",
    name: "Dramatic Strings",
    prompt: "dramatic string orchestra, emotional, sweeping violins, cinematic",
  },
  {
    id: "CUSTOM",
    name: "Custom",
    prompt: "",
  },
]

export function MusicGenerator({
  onGenerate,
  isGenerating = false,
}: MusicGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState(musicStyles[0].id)
  const [customPrompt, setCustomPrompt] = useState("")

  const handleGenerate = async () => {
    const style = musicStyles.find((s) => s.id === selectedStyle)
    const prompt = selectedStyle === "CUSTOM" ? customPrompt : style?.prompt
    await onGenerate(selectedStyle, prompt)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
          Music Style
        </label>
        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {musicStyles.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStyle === "CUSTOM" && (
        <div>
          <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
            Custom Prompt
          </label>
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe the music style..."
          />
        </div>
      )}

      {selectedStyle !== "CUSTOM" && (
        <div className="p-3 bg-primary/5 rounded-md">
          <p className="text-xs text-[#6b6b6b]">
            {musicStyles.find((s) => s.id === selectedStyle)?.prompt}
          </p>
        </div>
      )}

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || (selectedStyle === "CUSTOM" && !customPrompt)}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Music className="mr-2 h-4 w-4" />
            Generate Music
          </>
        )}
      </Button>
    </div>
  )
}
