import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { ShotsPageClient } from "@/components/shots/ShotsPageClient"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

// Auth temporarily disabled
async function getProjectWithShots(projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    include: {
      scripts: {
        orderBy: { version: "desc" },
      },
      scenes: {
        orderBy: { sceneIndex: "asc" },
        include: {
          shots: {
            orderBy: { shotIndex: "asc" },
          },
        },
      },
    },
  })

  return project
}

export default async function ShotsPage({
  params,
}: {
  params: { projectId: string }
}) {
  // Auth temporarily disabled
  const projectRaw = await getProjectWithShots(params.projectId)

  if (!projectRaw) {
    redirect("/dashboard")
  }

  // Serialize Decimal fields to numbers for client components
  const project = {
    ...projectRaw,
    scenes: projectRaw.scenes.map((scene) => ({
      ...scene,
      shots: scene.shots.map((shot) => ({
        ...shot,
        duration: Number(shot.duration),
      })),
    })),
  }

  const totalShots = project.scenes.reduce(
    (sum, scene) => sum + scene.shots.length,
    0
  )

  return (
    <AppShell>
      <Header
        title="Shot Planning"
        subtitle={
          totalShots > 0
            ? `${totalShots} shots across ${project.scenes.length} scenes`
            : "Upload your script to generate shots"
        }
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.title, href: `/projects/${project.id}` },
          { label: "Shots" },
        ]}
      />

      <div className="p-6">
        <ShotsPageClient project={project} />
      </div>
    </AppShell>
  )
}
