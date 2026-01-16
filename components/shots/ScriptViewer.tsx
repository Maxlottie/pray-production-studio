"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Script } from "@prisma/client"

interface ScriptViewerProps {
  scripts: Script[]
  selectedVersion: number
  onVersionChange: (version: number) => void
}

export function ScriptViewer({
  scripts,
  selectedVersion,
  onVersionChange,
}: ScriptViewerProps) {
  const currentScript = scripts.find((s) => s.version === selectedVersion)

  if (scripts.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center py-12">
          <p className="text-[#6b6b6b]">No script uploaded yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Script</CardTitle>
        {scripts.length > 1 && (
          <Select
            value={String(selectedVersion)}
            onValueChange={(value) => onVersionChange(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              {scripts.map((script) => (
                <SelectItem key={script.version} value={String(script.version)}>
                  Version {script.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {currentScript ? (
          <pre className="whitespace-pre-wrap font-mono text-sm text-[#2d2d2d] leading-relaxed">
            {currentScript.rawText}
          </pre>
        ) : (
          <p className="text-[#6b6b6b]">Script not found.</p>
        )}
      </CardContent>
    </Card>
  )
}
