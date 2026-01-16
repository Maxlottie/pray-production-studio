"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music, Film, Image, Video, Layers, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectTabsProps {
  projectId: string
  shotsCount: number
  approvedShotsCount?: number
  imagesCount?: number
  videosCount?: number
}

export function ProjectTabs({
  projectId,
  shotsCount,
  approvedShotsCount = 0,
  imagesCount = 0,
  videosCount = 0,
}: ProjectTabsProps) {
  const pathname = usePathname()

  const tabs = [
    {
      name: "Audio",
      href: `/projects/${projectId}/audio`,
      icon: Music,
      status: "available" as const,
      complete: false, // Will be updated in Phase 5
    },
    {
      name: "Shots",
      href: `/projects/${projectId}/shots`,
      icon: Film,
      status: "available" as const,
      complete: shotsCount > 0 && approvedShotsCount === shotsCount,
      count: shotsCount,
    },
    {
      name: "Images",
      href: `/projects/${projectId}/images`,
      icon: Image,
      status: shotsCount > 0 ? ("available" as const) : ("locked" as const),
      complete: imagesCount > 0 && imagesCount >= shotsCount,
      count: imagesCount,
    },
    {
      name: "Videos",
      href: `/projects/${projectId}/videos`,
      icon: Video,
      status: shotsCount > 0 ? ("available" as const) : ("locked" as const),
      complete: videosCount > 0 && videosCount >= shotsCount,
      count: videosCount,
    },
    {
      name: "Assembly",
      href: `/projects/${projectId}/assembly`,
      icon: Layers,
      status: shotsCount > 0 ? ("available" as const) : ("locked" as const),
      complete: false,
    },
  ]

  return (
    <div className="border-b border-border bg-surface">
      <div className="px-6">
        <nav className="flex gap-1 -mb-px" aria-label="Project tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const isLocked = tab.status === "locked"

            return (
              <Link
                key={tab.name}
                href={isLocked ? "#" : tab.href}
                className={cn(
                  "group flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-[#6b6b6b] hover:text-[#2d2d2d] hover:border-border",
                  isLocked && "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (isLocked) e.preventDefault()
                }}
              >
                <tab.icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-accent" : "text-[#9ca3af] group-hover:text-[#6b6b6b]"
                  )}
                />
                <span>{tab.name}</span>
                {tab.complete && (
                  <Check className="h-4 w-4 text-success" />
                )}
                {tab.count !== undefined && tab.count > 0 && !tab.complete && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {tab.count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
