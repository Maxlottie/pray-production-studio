import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
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
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Verify project exists and belongs to user
  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      createdById: session.user.id,
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
