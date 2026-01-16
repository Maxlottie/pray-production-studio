"use client"

import Link from "next/link"
import { Plus, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "./ProjectCard"
import type { Project, User } from "@prisma/client"

interface ProjectWithUser extends Project {
  createdBy: Pick<User, "name" | "image">
}

interface ProjectGridProps {
  projects: ProjectWithUser[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FolderOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-[#2d2d2d]">No projects yet</h3>
        <p className="mt-1 text-sm text-[#6b6b6b]">
          Create your first project to get started
        </p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
