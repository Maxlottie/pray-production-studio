import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { AssemblyPageClient } from "@/components/assembly/AssemblyPageClient"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AssemblyPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  // Auth temporarily disabled
  const projectRaw = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    include: {
      scenes: {
        include: {
          shots: {
            include: {
              images: {
                orderBy: { createdAt: "desc" },
              },
              videos: {
                orderBy: { createdAt: "desc" },
              },
            },
            orderBy: { shotIndex: "asc" },
          },
        },
        orderBy: { sceneIndex: "asc" },
      },
      audio: true,
    },
  })

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

  return (
    <AppShell>
      <Header
        title="Assembly & Export"
        subtitle="Arrange clips and export your final video"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.title, href: `/projects/${project.id}` },
          { label: "Assembly" },
        ]}
      />

      <div className="p-6">
        <AssemblyPageClient project={project} />
      </div>
    </AppShell>
  )
}
