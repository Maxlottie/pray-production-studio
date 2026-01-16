import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { parseDocx } from "@/lib/utils/docx-parser"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let text: string

    if (fileName.endsWith(".docx")) {
      const buffer = Buffer.from(await file.arrayBuffer())
      text = await parseDocx(buffer)
    } else if (fileName.endsWith(".txt")) {
      text = await file.text()
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .docx or .txt file." },
        { status: 400 }
      )
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "The file appears to be empty" },
        { status: 400 }
      )
    }

    return NextResponse.json({ text: text.trim() })
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    )
  }
}
