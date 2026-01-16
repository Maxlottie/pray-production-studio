"use client"

import { ChevronRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  onMenuClick?: () => void
  breadcrumbs?: { label: string; href?: string }[]
}

export function Header({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: HeaderProps) {
  return (
    <header className="bg-surface border-b border-border px-6 py-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-[#6b6b6b] mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[#2d2d2d]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2d2d2d]">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[#6b6b6b]">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
