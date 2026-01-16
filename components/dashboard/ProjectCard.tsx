"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Project, User } from "@prisma/client"

interface ProjectWithUser extends Project {
  createdBy: Pick<User, "name" | "image">
}

interface ProjectCardProps {
  project: ProjectWithUser
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-warning/10 text-warning",
  COMPLETED: "bg-success/10 text-success",
}

const statusLabels = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-card-hover">
        {/* Thumbnail */}
        <div className="aspect-video bg-primary-light relative overflow-hidden rounded-t-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/20">P</span>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-[#2d2d2d] truncate group-hover:text-primary transition-colors">
            {project.title}
          </h3>

          {/* Badges */}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {project.aspectRatio === "LANDSCAPE" ? "16:9" : "9:16"}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusColors[project.status]
              )}
            >
              {statusLabels[project.status]}
            </span>
          </div>

          {/* Meta */}
          <div className="mt-3 flex items-center justify-between text-xs text-[#6b6b6b]">
            <span>
              Updated{" "}
              {formatDistanceToNow(new Date(project.updatedAt), {
                addSuffix: true,
              })}
            </span>
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={project.createdBy.image || ""} />
                <AvatarFallback className="text-[10px]">
                  {project.createdBy.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">
                {project.createdBy.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
