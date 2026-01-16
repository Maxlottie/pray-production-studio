import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import {
  MOOD_MODIFIERS,
  NEGATIVE_PROMPT,
  getStyleGuideComponents,
} from "@/lib/prompts/image-prompt-builder"

// Get the technical close as master style
const { technicalClose: MASTER_STYLE_PROMPT } = getStyleGuideComponents()

export default async function SettingsPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch style guide
  const styleGuide = await prisma.styleGuide.findFirst({
    where: { isDefault: true },
  })

  return (
    <AppShell>
      <Header
        title="Settings"
        subtitle="Configure your production studio preferences"
      />

      <div className="p-6">
        <div className="max-w-2xl space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6b6b6b]">
                    Name
                  </label>
                  <p className="text-[#2d2d2d]">
                    {session.user.name || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6b6b6b]">
                    Email
                  </label>
                  <p className="text-[#2d2d2d]">{session.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Style Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Style Guide</CardTitle>
              <CardDescription>
                Default prompts and settings for image generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Style */}
              <div>
                <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                  Master Style Prompt
                </label>
                <div className="p-3 bg-primary/5 rounded-md">
                  <p className="text-sm text-[#6b6b6b] font-mono">
                    {styleGuide?.basePrompt || MASTER_STYLE_PROMPT}
                  </p>
                </div>
              </div>

              {/* Mood Modifiers */}
              <div>
                <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                  Mood Modifiers
                </label>
                <div className="space-y-2">
                  {Object.entries(MOOD_MODIFIERS).map(([mood, modifier]) => (
                    <div
                      key={mood}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-primary/5"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {mood}
                      </Badge>
                      <p className="text-sm text-[#6b6b6b]">{modifier}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="text-sm font-medium text-[#2d2d2d] mb-2 block">
                  Negative Prompt
                </label>
                <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                  <p className="text-sm text-red-700 font-mono">
                    {styleGuide?.negativePrompt || NEGATIVE_PROMPT}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
              <CardDescription>
                External service connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: "OpenAI (DALL-E)",
                    configured: !!process.env.OPENAI_API_KEY,
                  },
                  {
                    name: "Anthropic (Claude)",
                    configured: !!process.env.ANTHROPIC_API_KEY,
                  },
                  {
                    name: "ElevenLabs",
                    configured: !!process.env.ELEVENLABS_API_KEY,
                  },
                  {
                    name: "Minimax",
                    configured: !!process.env.MINIMAX_API_KEY,
                  },
                  {
                    name: "Runway",
                    configured: !!process.env.RUNWAY_API_KEY,
                  },
                  {
                    name: "AWS S3",
                    configured: !!process.env.AWS_ACCESS_KEY_ID,
                  },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-[#2d2d2d]">{service.name}</span>
                    <Badge
                      variant={service.configured ? "secondary" : "outline"}
                      className={
                        service.configured ? "bg-green-100 text-green-700" : ""
                      }
                    >
                      {service.configured ? "Connected" : "Not configured"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
