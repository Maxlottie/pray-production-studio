"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface AssistantContextValue {
  // Shots currently being processed by the assistant
  processingShots: Set<string>
  // Add a shot to processing state
  addProcessingShot: (shotId: string) => void
  // Remove a shot from processing state
  removeProcessingShot: (shotId: string) => void
  // Clear all processing shots
  clearProcessingShots: () => void
  // Set multiple processing shots at once
  setProcessingShots: (shotIds: string[]) => void
  // Whether the assistant is currently working
  isAssistantWorking: boolean
  setIsAssistantWorking: (working: boolean) => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantContextProvider({ children }: { children: ReactNode }) {
  const [processingShots, setProcessingShotsState] = useState<Set<string>>(new Set())
  const [isAssistantWorking, setIsAssistantWorking] = useState(false)

  const addProcessingShot = useCallback((shotId: string) => {
    setProcessingShotsState((prev) => new Set(prev).add(shotId))
  }, [])

  const removeProcessingShot = useCallback((shotId: string) => {
    setProcessingShotsState((prev) => {
      const next = new Set(prev)
      next.delete(shotId)
      return next
    })
  }, [])

  const clearProcessingShots = useCallback(() => {
    setProcessingShotsState(new Set())
  }, [])

  const setProcessingShots = useCallback((shotIds: string[]) => {
    setProcessingShotsState(new Set(shotIds))
  }, [])

  return (
    <AssistantContext.Provider
      value={{
        processingShots,
        addProcessingShot,
        removeProcessingShot,
        clearProcessingShots,
        setProcessingShots,
        isAssistantWorking,
        setIsAssistantWorking,
      }}
    >
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistantContext() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error("useAssistantContext must be used within AssistantContextProvider")
  }
  return context
}

// Optional hook that doesn't throw - for components that might be outside provider
export function useAssistantContextOptional() {
  return useContext(AssistantContext)
}
