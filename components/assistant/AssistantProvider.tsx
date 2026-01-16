"use client"

import { useState } from "react"
import { AssistantPanel } from "./AssistantPanel"
import { AssistantToggle } from "./AssistantToggle"
import { AssistantContextProvider } from "./AssistantContext"

interface AssistantProviderProps {
  projectId: string
  children: React.ReactNode
}

export function AssistantProvider({
  projectId,
  children,
}: AssistantProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AssistantContextProvider>
      {children}
      <AssistantToggle onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      <AssistantPanel
        projectId={projectId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </AssistantContextProvider>
  )
}
