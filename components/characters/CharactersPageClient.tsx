"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CharacterGrid } from "./CharacterGrid"
import { CharacterDetailModal } from "./CharacterDetailModal"
import type {
  Character,
  CharacterVariation,
  CharacterReferenceImage,
  VariationType,
} from "@prisma/client"

type VariationWithImages = CharacterVariation & {
  images: CharacterReferenceImage[]
}
type CharacterWithVariations = Character & {
  variations: VariationWithImages[]
}

interface CharactersPageClientProps {
  initialCharacters: CharacterWithVariations[]
}

export function CharactersPageClient({
  initialCharacters,
}: CharactersPageClientProps) {
  const router = useRouter()
  const [characters, setCharacters] =
    useState<CharacterWithVariations[]>(initialCharacters)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterWithVariations | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCharacterName, setNewCharacterName] = useState("")
  const [newVariationType, setNewVariationType] =
    useState<VariationType>("ADULT")
  const [isCreating, setIsCreating] = useState(false)

  // Filter characters by search query
  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const refreshCharacters = useCallback(async () => {
    try {
      const response = await fetch("/api/characters")
      if (response.ok) {
        const data = await response.json()
        setCharacters(data.characters)
      }
    } catch (error) {
      console.error("Failed to refresh characters:", error)
    }
  }, [])

  const handleCharacterClick = useCallback(
    (character: CharacterWithVariations) => {
      setSelectedCharacter(character)
      setIsDetailOpen(true)
    },
    []
  )

  const handleCreateCharacter = useCallback(async () => {
    if (!newCharacterName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCharacterName,
          variationType: newVariationType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create character")
      }

      await refreshCharacters()
      setIsCreateOpen(false)
      setNewCharacterName("")
    } catch (error) {
      console.error("Create error:", error)
      alert("Failed to create character")
    } finally {
      setIsCreating(false)
    }
  }, [newCharacterName, newVariationType, refreshCharacters])

  const handleSaveCharacter = useCallback(
    async (character: CharacterWithVariations) => {
      try {
        const response = await fetch(`/api/characters/${character.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: character.name,
            variations: character.variations,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save character")
        }

        await refreshCharacters()
      } catch (error) {
        console.error("Save error:", error)
        throw error
      }
    },
    [refreshCharacters]
  )

  const handleDeleteCharacter = useCallback(
    async (characterId: string) => {
      try {
        const response = await fetch(`/api/characters/${characterId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete character")
        }

        await refreshCharacters()
      } catch (error) {
        console.error("Delete error:", error)
        throw error
      }
    },
    [refreshCharacters]
  )

  const handleUploadImage = useCallback(
    async (variationId: string, file: File) => {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(
          `/api/characters/variations/${variationId}/images`,
          {
            method: "POST",
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        await refreshCharacters()

        // Update selected character
        if (selectedCharacter) {
          const updatedResponse = await fetch(
            `/api/characters/${selectedCharacter.id}`
          )
          if (updatedResponse.ok) {
            const data = await updatedResponse.json()
            setSelectedCharacter(data.character)
          }
        }
      } catch (error) {
        console.error("Upload error:", error)
        throw error
      }
    },
    [refreshCharacters, selectedCharacter]
  )

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        const response = await fetch(`/api/characters/images/${imageId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete image")
        }

        await refreshCharacters()

        // Update selected character
        if (selectedCharacter) {
          const updatedResponse = await fetch(
            `/api/characters/${selectedCharacter.id}`
          )
          if (updatedResponse.ok) {
            const data = await updatedResponse.json()
            setSelectedCharacter(data.character)
          }
        }
      } catch (error) {
        console.error("Delete image error:", error)
        throw error
      }
    },
    [refreshCharacters, selectedCharacter]
  )

  const handleSetPrimaryImage = useCallback(
    async (imageId: string) => {
      try {
        const response = await fetch(`/api/characters/images/${imageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
        })

        if (!response.ok) {
          throw new Error("Failed to set primary image")
        }

        await refreshCharacters()

        // Update selected character
        if (selectedCharacter) {
          const updatedResponse = await fetch(
            `/api/characters/${selectedCharacter.id}`
          )
          if (updatedResponse.ok) {
            const data = await updatedResponse.json()
            setSelectedCharacter(data.character)
          }
        }
      } catch (error) {
        console.error("Set primary error:", error)
        throw error
      }
    },
    [refreshCharacters, selectedCharacter]
  )

  const handleAddVariation = useCallback(
    async (
      characterId: string,
      type: VariationType,
      customLabel?: string
    ) => {
      try {
        const response = await fetch(
          `/api/characters/${characterId}/variations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, customLabel }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to add variation")
        }

        await refreshCharacters()

        // Update selected character
        const updatedResponse = await fetch(
          `/api/characters/${characterId}`
        )
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()
          setSelectedCharacter(data.character)
        }
      } catch (error) {
        console.error("Add variation error:", error)
        throw error
      }
    },
    [refreshCharacters]
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Character
        </Button>
      </div>

      {/* Character Count */}
      <p className="text-sm text-[#6b6b6b]">
        {filteredCharacters.length} character
        {filteredCharacters.length !== 1 ? "s" : ""}
      </p>

      {/* Character Grid */}
      <CharacterGrid
        characters={filteredCharacters}
        onCharacterClick={handleCharacterClick}
      />

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onSave={handleSaveCharacter}
        onDelete={handleDeleteCharacter}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
        onSetPrimaryImage={handleSetPrimaryImage}
        onAddVariation={handleAddVariation}
      />

      {/* Create Character Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                Character Name
              </label>
              <Input
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                placeholder="e.g., Abraham, Moses, David"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                Initial Variation
              </label>
              <Select
                value={newVariationType}
                onValueChange={(v) => setNewVariationType(v as VariationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YOUNG">Young</SelectItem>
                  <SelectItem value="ADULT">Adult</SelectItem>
                  <SelectItem value="OLD">Old</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCharacter}
              disabled={isCreating || !newCharacterName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Character"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
