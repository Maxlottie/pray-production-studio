"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AspectRatioSelector } from "@/components/projects/AspectRatioSelector"
import type { AspectRatio } from "@prisma/client"

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("LANDSCAPE")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError("Please enter a project title")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          aspectRatio,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create project")
      }

      const project = await response.json()
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell>
      <Header
        title="New Project"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: "New Project" },
        ]}
      />

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Create a New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[#2d2d2d] mb-2"
                >
                  Project Title
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Genesis 22 - The Binding of Isaac"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
                  Aspect Ratio
                </label>
                <AspectRatioSelector
                  value={aspectRatio}
                  onChange={setAspectRatio}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-error/10 p-3 text-sm text-error">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={isLoading}
                >
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isLoading || !title.trim()}
                >
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
