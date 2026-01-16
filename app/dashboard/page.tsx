import Link from "next/link"
import { Plus } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { ProjectGrid } from "@/components/dashboard/ProjectGrid"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

// Get all projects (auth temporarily disabled for demo)
async function getProjects(userId?: string) {
  const projects = await prisma.project.findMany({
    where: userId ? { createdById: userId } : undefined,
    include: {
      createdBy: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return projects
}

export default async function DashboardPage() {
  const session = await getSession()

  // Auth temporarily disabled - show all projects for demo
  const projects = await getProjects(session?.user?.id)

  return (
    <AppShell>
      <Header
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        actions={
          <Button asChild variant="secondary">
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        }
      />

      <div className="p-6">
        <ProjectGrid projects={projects} />
      </div>
    </AppShell>
  )
}
