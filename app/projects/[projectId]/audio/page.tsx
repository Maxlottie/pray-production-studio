import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { AudioPageClient } from "@/components/audio/AudioPageClient"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AudioPage({
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
    include: {
      scripts: {
        orderBy: { version: "desc" },
        take: 1,
      },
      audio: true,
    },
  })

  if (!project) {
    redirect("/dashboard")
  }

  return (
    <AppShell>
      <Header
        title="Audio Production"
        subtitle="Record narration and generate background music"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.title, href: `/projects/${project.id}` },
          { label: "Audio" },
        ]}
      />

      <div className="p-6">
        <AudioPageClient project={project} />
      </div>
    </AppShell>
  )
}
