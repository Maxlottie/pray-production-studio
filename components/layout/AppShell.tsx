"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          collapsed ? "md:pl-16" : "md:pl-60"
        )}
      >
        {children}
      </main>
    </div>
  )
}
