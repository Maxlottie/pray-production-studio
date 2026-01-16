"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, Send, Sparkles, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageList } from "./MessageList"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  actionsTaken?: boolean
}

interface AssistantPanelProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  currentPage?: "shots" | "images" | "videos" | "assembly"
  onRefresh?: () => void
}

export function AssistantPanel({
  projectId,
  isOpen,
  onClose,
  currentPage = "images",
  onRefresh,
}: AssistantPanelProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [lastActionTime, setLastActionTime] = useState<number | null>(null)
  const hasLoadedHistory = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load conversation history when panel opens
  useEffect(() => {
    if (isOpen && !hasLoadedHistory.current) {
      loadConversationHistory()
    }
  }, [isOpen, projectId])

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadConversationHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/assistant?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages)
          hasLoadedHistory.current = true
        }
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: userMessage.content,
          history: messages,
          currentPage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        actionsTaken: data.actionsTaken,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // If actions were taken, refresh the page data
      if (data.actionsTaken) {
        setLastActionTime(Date.now())
        // Refresh the page to show new data
        if (onRefresh) {
          onRefresh()
        } else {
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Assistant error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, projectId, messages, currentPage, onRefresh, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Quick prompts based on current page
  const getQuickPrompts = () => {
    switch (currentPage) {
      case "images":
        return [
          "Shot 1 needs to look more epic and cinematic",
          "Make all shots in Scene 1 more dramatic",
          "Regenerate Shot 5 with more divine lighting",
          "Change Shot 3 to EPIC_FILM_STILL style",
        ]
      case "shots":
        return [
          "Review my shots and suggest improvements",
          "Make Shot 2's description more visual",
          "What shots need more detail?",
          "Help me improve the narrative flow",
        ]
      case "videos":
        return [
          "Which shots need video generation?",
          "Suggest motion types for my shots",
          "Review my video progress",
          "Help optimize video settings",
        ]
      default:
        return [
          "Review my project and suggest improvements",
          "Help me improve Shot 1",
          "What needs the most attention?",
          "Make this more cinematic",
        ]
    }
  }

  const quickPrompts = getQuickPrompts()

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-[420px] bg-white border-l border-border shadow-lg transform transition-transform duration-300 z-50 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-[#2d2d2d]">AI Assistant</h2>
          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Can take actions
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Last action indicator */}
      {lastActionTime && Date.now() - lastActionTime < 10000 && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-200 text-green-700 text-xs flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Action completed! Page data refreshed.
        </div>
      )}

      {/* Messages */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-sm text-[#6b6b6b]">Loading conversation...</span>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {/* Quick Prompts */}
      {messages.length === 0 && !isLoadingHistory && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[#6b6b6b] mb-2">Try asking me to:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-[#6b6b6b] hover:bg-accent/20 hover:text-[#2d2d2d] transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to do... (e.g., 'Make Shot 5 more epic')"
            disabled={isLoading}
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            rows={2}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-[#9ca3af] mt-2">
          I can regenerate images, update shot settings, and make batch changes. Just tell me what you need!
        </p>
      </div>
    </div>
  )
}
