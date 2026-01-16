"use client"

import { useRef, useEffect } from "react"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Bot className="h-12 w-12 text-accent/50 mb-4" />
          <p className="text-[#6b6b6b] text-sm">
            Hi! I&apos;m your AI production assistant.
          </p>
          <p className="text-[#6b6b6b] text-xs mt-1">
            Ask me anything about your project.
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex gap-3",
            message.role === "user" ? "flex-row-reverse" : ""
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              message.role === "user"
                ? "bg-accent text-primary"
                : "bg-primary text-white"
            )}
          >
            {message.role === "user" ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-2 text-sm",
              message.role === "user"
                ? "bg-accent/10 text-[#2d2d2d]"
                : "bg-primary/5 text-[#2d2d2d]"
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div className="bg-primary/5 rounded-lg px-4 py-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-[#6b6b6b] rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-[#6b6b6b] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="w-2 h-2 bg-[#6b6b6b] rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
