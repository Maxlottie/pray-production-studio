"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Star, Trash2, Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { VariationTabs } from "./VariationTabs"
import { ReferenceImageUploader } from "./ReferenceImageUploader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
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

interface CharacterDetailModalProps {
  character: CharacterWithVariations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (character: CharacterWithVariations) => Promise<void>
  onDelete: (characterId: string) => Promise<void>
  onUploadImage: (variationId: string, file: File) => Promise<void>
  onDeleteImage: (imageId: string) => Promise<void>
  onSetPrimaryImage: (imageId: string) => Promise<void>
  onAddVariation: (
    characterId: string,
    type: VariationType,
    customLabel?: string
  ) => Promise<void>
}

export function CharacterDetailModal({
  character,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onUploadImage,
  onDeleteImage,
  onSetPrimaryImage,
  onAddVariation,
}: CharacterDetailModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [activeVariationId, setActiveVariationId] = useState<string | null>(
    null
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showAddVariation, setShowAddVariation] = useState(false)
  const [newVariationType, setNewVariationType] =
    useState<VariationType>("ADULT")
  const [customLabel, setCustomLabel] = useState("")

  useEffect(() => {
    if (character) {
      setName(character.name)
      // Set first variation as active
      if (character.variations.length > 0 && !activeVariationId) {
        setActiveVariationId(character.variations[0].id)
      }
    }
  }, [character, activeVariationId])

  const activeVariation = character?.variations.find(
    (v) => v.id === activeVariationId
  )

  useEffect(() => {
    if (activeVariation) {
      setDescription(activeVariation.description || "")
    }
  }, [activeVariation])

  const handleSave = async () => {
    if (!character) return
    setIsSaving(true)
    try {
      await onSave({
        ...character,
        name,
        variations: character.variations.map((v) =>
          v.id === activeVariationId
            ? { ...v, description }
            : v
        ),
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!character) return
    if (!confirm("Are you sure you want to delete this character?")) return
    setIsDeleting(true)
    try {
      await onDelete(character.id)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpload = async (file: File) => {
    if (!activeVariationId) return
    setIsUploading(true)
    try {
      await onUploadImage(activeVariationId, file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddVariation = async () => {
    if (!character) return
    await onAddVariation(
      character.id,
      newVariationType,
      newVariationType === "CUSTOM" ? customLabel : undefined
    )
    setShowAddVariation(false)
    setCustomLabel("")
  }

  if (!character) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Character</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
              Character Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Abraham"
            />
          </div>

          {/* Variation Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[#2d2d2d]">
                Variations
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddVariation(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variation
              </Button>
            </div>
            <VariationTabs
              variations={character.variations}
              activeVariationId={activeVariationId}
              onSelect={setActiveVariationId}
            />
          </div>

          {/* Add Variation Form */}
          {showAddVariation && (
            <div className="flex items-end gap-2 p-3 bg-primary/5 rounded-md">
              <div className="flex-1">
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
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newVariationType === "CUSTOM" && (
                <Input
                  className="flex-1"
                  placeholder="Custom label"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
              )}
              <Button size="sm" onClick={handleAddVariation}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddVariation(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Reference Images */}
          {activeVariation && (
            <div>
              <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                Reference Images
              </label>
              <div className="grid grid-cols-4 gap-3">
                {activeVariation.images.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2",
                      img.isPrimary
                        ? "border-accent ring-2 ring-accent/20"
                        : "border-transparent"
                    )}
                  >
                    <Image
                      src={img.imageUrl}
                      alt="Reference"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group">
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isPrimary && (
                          <button
                            onClick={() => onSetPrimaryImage(img.id)}
                            className="p-1 bg-white rounded-full shadow"
                            title="Set as primary"
                          >
                            <Star className="h-3 w-3 text-accent" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteImage(img.id)}
                          className="p-1 bg-white rounded-full shadow"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                      {img.isPrimary && (
                        <div className="absolute top-1 left-1">
                          <Star className="h-4 w-4 text-accent fill-accent" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <ReferenceImageUploader
                  onUpload={handleUpload}
                  isUploading={isUploading}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {activeVariation && (
            <div>
              <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                Visual Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the character's appearance for AI image generation..."
                className="min-h-[100px]"
              />
              <p className="mt-1 text-xs text-[#6b6b6b]">
                This description will be injected into image prompts for visual
                consistency.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete Character"
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
