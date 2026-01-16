import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProjectAssistantWrapper } from "@/components/assistant/ProjectAssistantWrapper"

interface ProjectLayoutProps {
  children: React.ReactNode
  params: { projectId: string }
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  // Auth temporarily disabled - just verify project exists
  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
    },
    select: {
      id: true,
      title: true,
    },
  })

  if (!project) {
    redirect("/dashboard")
  }

  return (
    <ProjectAssistantWrapper projectId={params.projectId}>
      {children}
    </ProjectAssistantWrapper>
  )
}
