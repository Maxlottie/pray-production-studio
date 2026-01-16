import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { VideosPageClient } from "@/components/videos/VideosPageClient"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function VideosPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  // Auth temporarily disabled
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
  })

  if (!project) {
    redirect("/dashboard")
  }

  // Fetch scenes with shots, images, and videos
  const scenesRaw = await prisma.scene.findMany({
    where: { projectId },
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
  })

  // Serialize Decimal fields to numbers for client components
  const scenes = scenesRaw.map((scene) => ({
    ...scene,
    shots: scene.shots.map((shot) => ({
      ...shot,
      duration: Number(shot.duration),
    })),
  }))

  return (
    <AppShell>
      <Header
        title="Video Generation"
        subtitle="Transform images into animated video clips"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.title, href: `/projects/${project.id}` },
          { label: "Videos" },
        ]}
      />

      <div className="p-6">
        <VideosPageClient project={project} scenes={scenes} />
      </div>
    </AppShell>
  )
}
