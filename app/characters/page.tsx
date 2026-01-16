import { AppShell } from "@/components/layout/AppShell"
import { Header } from "@/components/layout/Header"
import { CharactersPageClient } from "@/components/characters/CharactersPageClient"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function CharactersPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch all characters with variations and images
  const characters = await prisma.character.findMany({
    include: {
      variations: {
        include: {
          images: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <AppShell>
      <Header
        title="Character Library"
        subtitle="Manage character reference images for consistent AI generation"
      />

      <div className="p-6">
        <CharactersPageClient initialCharacters={characters} />
      </div>
    </AppShell>
  )
}
