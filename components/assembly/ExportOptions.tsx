"use client"

import { useState } from "react"
import {
  Cloud,
  Download,
  FileCode,
  Loader2,
  Check,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ExportOptionsProps {
  projectId: string
  projectTitle: string
  onExportToDrive: () => Promise<string | null>
  onDownloadAll: () => Promise<void>
  onDownloadXML: () => Promise<void>
  isExporting?: boolean
}

export function ExportOptions({
  projectId,
  projectTitle,
  onExportToDrive,
  onDownloadAll,
  onDownloadXML,
  isExporting = false,
}: ExportOptionsProps) {
  const [driveUrl, setDriveUrl] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "success" | "error"
  >("idle")

  const handleExportToDrive = async () => {
    setExportStatus("exporting")
    try {
      const url = await onExportToDrive()
      if (url) {
        setDriveUrl(url)
        setExportStatus("success")
      } else {
        setExportStatus("error")
      }
    } catch (error) {
      console.error("Export error:", error)
      setExportStatus("error")
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Google Drive Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-5 w-5 text-accent" />
            Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6b6b6b] mb-4">
            Export your project files to Google Drive with organized folder
            structure.
          </p>
          {driveUrl ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">Exported successfully!</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(driveUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Drive
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleExportToDrive}
              disabled={exportStatus === "exporting" || isExporting}
            >
              {exportStatus === "exporting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Cloud className="mr-2 h-4 w-4" />
                  Export to Drive
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Download All */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-5 w-5 text-accent" />
            Download All
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6b6b6b] mb-4">
            Download all project assets as a ZIP file including images, videos,
            and audio.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={onDownloadAll}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Premiere XML */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode className="h-5 w-5 text-accent" />
            Premiere XML
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6b6b6b] mb-4">
            Download Premiere Pro compatible XML for timeline import.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={onDownloadXML}
            disabled={isExporting}
          >
            <FileCode className="mr-2 h-4 w-4" />
            Download XML
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
