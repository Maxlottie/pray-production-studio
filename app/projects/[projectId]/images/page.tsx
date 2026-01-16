import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { ImagesPageClient } from "@/components/images/ImagesPageClient"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ImagesPage({
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

  // Fetch scenes with shots and images
  const scenesRaw = await prisma.scene.findMany({
    where: { projectId },
    include: {
      shots: {
        include: {
          images: {
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
        title="Image Generation"
        subtitle="Generate epic biblical images for each shot"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.title, href: `/projects/${project.id}` },
          { label: "Images" },
        ]}
      />

      <div className="p-6">
        <ImagesPageClient project={project} scenes={scenes} />
      </div>
    </AppShell>
  )
}
