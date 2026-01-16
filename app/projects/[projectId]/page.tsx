import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { ProjectTabs } from "@/components/projects/ProjectTabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Music, Film, Image, Video, Layers, ArrowRight, Check } from "lucide-react"

// Auth temporarily disabled - find project by ID only
async function getProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
    },
    include: {
      createdBy: {
        select: {
          name: true,
          image: true,
        },
      },
      scripts: {
        orderBy: { version: "desc" },
        take: 1,
      },
      scenes: {
        include: {
          shots: {
            include: {
              images: {
                where: { selected: true },
              },
              videos: {
                where: { selected: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          shots: true,
          scenes: true,
        },
      },
    },
  })

  return project
}

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  // Auth temporarily disabled
  const project = await getProject(params.projectId)

  if (!project) {
    redirect("/dashboard")
  }

  // Calculate stats
  const totalShots = project._count.shots
  const approvedShots = project.scenes.reduce(
    (sum, scene) =>
      sum + scene.shots.filter((shot) => shot.status === "APPROVED").length,
    0
  )
  const shotsWithImages = project.scenes.reduce(
    (sum, scene) =>
      sum + scene.shots.filter((shot) => shot.images.length > 0).length,
    0
  )
  const shotsWithVideos = project.scenes.reduce(
    (sum, scene) =>
      sum + scene.shots.filter((shot) => shot.videos.length > 0).length,
    0
  )

  const stages = [
    {
      title: "Shot Planning",
      description: "Upload script and plan your shot list",
      icon: Film,
      href: `/projects/${project.id}/shots`,
      status: "available" as const,
      complete: totalShots > 0 && approvedShots === totalShots,
      progress: totalShots > 0 ? `${approvedShots}/${totalShots} approved` : null,
    },
    {
      title: "Audio",
      description: "Record or generate narration and background music (optional)",
      icon: Music,
      href: `/projects/${project.id}/audio`,
      status: "available" as const,
      complete: false,
      progress: null,
    },
    {
      title: "Image Generation",
      description: "Generate images for each shot",
      icon: Image,
      href: `/projects/${project.id}/images`,
      status: totalShots > 0 ? ("available" as const) : ("locked" as const),
      complete: shotsWithImages > 0 && shotsWithImages >= totalShots,
      progress: totalShots > 0 ? `${shotsWithImages}/${totalShots} complete` : null,
    },
    {
      title: "Video Generation",
      description: "Transform images into animated clips",
      icon: Video,
      href: `/projects/${project.id}/videos`,
      status: totalShots > 0 ? ("available" as const) : ("locked" as const),
      complete: shotsWithVideos > 0 && shotsWithVideos >= totalShots,
      progress: totalShots > 0 ? `${shotsWithVideos}/${totalShots} complete` : null,
    },
    {
      title: "Assembly & Export",
      description: "Arrange clips and export to Premiere",
      icon: Layers,
      href: `/projects/${project.id}/assembly`,
      status: totalShots > 0 ? ("available" as const) : ("locked" as const),
      complete: false,
      progress: null,
    },
  ]

  // Determine next step
  const nextStep = stages.find(
    (stage) => !stage.complete && stage.status === "available"
  )

  return (
    <AppShell>
      <Header
        title={project.title}
        subtitle={`${project.aspectRatio === "LANDSCAPE" ? "16:9 Landscape" : "9:16 Portrait"}`}
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.title },
        ]}
        actions={
          <Badge
            variant={
              project.status === "COMPLETED"
                ? "success"
                : project.status === "IN_PROGRESS"
                ? "warning"
                : "outline"
            }
          >
            {project.status.replace("_", " ")}
          </Badge>
        }
      />

      <ProjectTabs
        projectId={project.id}
        shotsCount={totalShots}
        approvedShotsCount={approvedShots}
        imagesCount={shotsWithImages}
        videosCount={shotsWithVideos}
      />

      <div className="p-6">
        {/* Next Step Card */}
        {nextStep && (
          <Card className="mb-6 border-accent/50 bg-accent/5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                  <nextStep.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d2d2d]">
                    Next Step: {nextStep.title}
                  </h3>
                  <p className="text-sm text-[#6b6b6b]">{nextStep.description}</p>
                </div>
              </div>
              <Button asChild variant="secondary">
                <Link href={nextStep.href}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Production Pipeline */}
        <h2 className="text-lg font-semibold text-[#2d2d2d] mb-4">
          Production Pipeline
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, index) => (
            <Card
              key={stage.title}
              className={
                stage.status === "locked"
                  ? "opacity-50"
                  : stage.complete
                  ? "border-success/50 bg-success/5"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        stage.complete
                          ? "bg-success/20"
                          : "bg-accent/10"
                      }`}
                    >
                      {stage.complete ? (
                        <Check className="h-5 w-5 text-success" />
                      ) : (
                        <stage.icon className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{stage.title}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Step {index + 1}
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  {stage.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stage.progress && (
                  <p className="text-sm text-[#6b6b6b] mb-3">{stage.progress}</p>
                )}
                <Button
                  asChild={stage.status !== "locked"}
                  variant="outline"
                  className="w-full"
                  disabled={stage.status === "locked"}
                >
                  {stage.status === "locked" ? (
                    <span>Complete previous steps</span>
                  ) : (
                    <Link href={stage.href}>
                      {stage.complete ? "Review" : "Open"}
                    </Link>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Info */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[#6b6b6b]">Total Scenes</p>
              <p className="text-2xl font-semibold text-[#2d2d2d]">
                {project._count.scenes}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[#6b6b6b]">Total Shots</p>
              <p className="text-2xl font-semibold text-[#2d2d2d]">
                {totalShots}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-[#6b6b6b]">Script Version</p>
              <p className="text-2xl font-semibold text-[#2d2d2d]">
                {project.scripts[0]?.version || "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
