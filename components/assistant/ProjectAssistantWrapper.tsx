"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AssistantPanel } from "./AssistantPanel"
import { AssistantToggle } from "./AssistantToggle"
import { AssistantContextProvider } from "./AssistantContext"

interface ProjectAssistantWrapperProps {
  projectId: string
  children: React.ReactNode
}

export function ProjectAssistantWrapper({
  projectId,
  children,
}: ProjectAssistantWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  // Detect current page from URL
  const getCurrentPage = (): "shots" | "images" | "videos" | "assembly" => {
    if (pathname.includes("/shots")) return "shots"
    if (pathname.includes("/images")) return "images"
    if (pathname.includes("/videos")) return "videos"
    if (pathname.includes("/assembly")) return "assembly"
    return "images" // Default
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <AssistantContextProvider>
      {children}

      {/* AI Assistant - Available on all project pages */}
      <AssistantToggle
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
        isOpen={isAssistantOpen}
      />
      <AssistantPanel
        projectId={projectId}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentPage={getCurrentPage()}
        onRefresh={handleRefresh}
      />
    </AssistantContextProvider>
  )
}
