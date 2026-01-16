"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sparkles, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssistantToggleProps {
  onClick: () => void
  isOpen: boolean
}

const STORAGE_KEY = "assistant-toggle-position"
const DRAG_THRESHOLD = 5 // Pixels moved before considered a drag

export function AssistantToggle({ onClick, isOpen }: AssistantToggleProps) {
  const [position, setPosition] = useState({ x: 24, y: 24 }) // Distance from right/bottom
  const [isDragging, setIsDragging] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPosition(parsed)
      } catch (e) {
        // Ignore invalid saved position
      }
    }
  }, [])

  // Save position when drag ends
  useEffect(() => {
    if (!isDragging && !isHolding) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
    }
  }, [position, isDragging, isHolding])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setStartPos({ x: e.clientX, y: e.clientY })
    setHasMoved(false)
    setIsHolding(true)

    // Start drag mode after short hold (200ms)
    holdTimeoutRef.current = setTimeout(() => {
      setIsDragging(true)
    }, 200)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setStartPos({ x: touch.clientX, y: touch.clientY })
    setHasMoved(false)
    setIsHolding(true)

    // Start drag mode after short hold
    holdTimeoutRef.current = setTimeout(() => {
      setIsDragging(true)
    }, 300)
  }, [])

  useEffect(() => {
    if (!isHolding) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startPos.x - e.clientX
      const deltaY = startPos.y - e.clientY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > DRAG_THRESHOLD) {
        setHasMoved(true)
        if (!isDragging) {
          // Clear the hold timeout and start dragging immediately
          if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current)
          }
          setIsDragging(true)
        }
      }

      if (isDragging) {
        setPosition((prev) => ({
          x: Math.max(10, Math.min(window.innerWidth - 70, prev.x + deltaX)),
          y: Math.max(10, Math.min(window.innerHeight - 70, prev.y + deltaY)),
        }))
        setStartPos({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
      }

      // If we didn't move much and weren't in drag mode, trigger click
      if (!hasMoved && !isDragging) {
        onClick()
      }

      setIsHolding(false)
      setIsDragging(false)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const deltaX = startPos.x - touch.clientX
      const deltaY = startPos.y - touch.clientY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > DRAG_THRESHOLD) {
        setHasMoved(true)
        if (!isDragging) {
          if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current)
          }
          setIsDragging(true)
        }
      }

      if (isDragging) {
        setPosition((prev) => ({
          x: Math.max(10, Math.min(window.innerWidth - 70, prev.x + deltaX)),
          y: Math.max(10, Math.min(window.innerHeight - 70, prev.y + deltaY)),
        }))
        setStartPos({ x: touch.clientX, y: touch.clientY })
      }
    }

    const handleTouchEnd = () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
      }

      if (!hasMoved && !isDragging) {
        onClick()
      }

      setIsHolding(false)
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isHolding, isDragging, startPos, hasMoved, onClick])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
      }
    }
  }, [])

  return (
    <button
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={cn(
        "fixed h-14 w-14 rounded-full shadow-lg z-40 transition-all flex items-center justify-center select-none",
        isDragging ? "cursor-grabbing scale-110 opacity-90" : "cursor-pointer",
        isOpen
          ? "bg-primary hover:bg-primary-light"
          : "bg-accent hover:bg-accent-light"
      )}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
      title="Click to chat • Drag to move"
    >
      {isDragging ? (
        <GripVertical className="h-6 w-6 text-white" />
      ) : (
        <Sparkles className={cn("h-6 w-6", isOpen ? "text-white" : "text-primary")} />
      )}
    </button>
  )
}
