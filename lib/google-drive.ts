/**
 * Google Drive API integration for project export
 */

import { google } from "googleapis"

interface DriveExportOptions {
  accessToken: string
  projectTitle: string
  files: {
    name: string
    content: Buffer | string
    mimeType: string
    folder: "images" | "videos" | "audio" | "root"
  }[]
}

interface DriveExportResult {
  folderId: string
  folderUrl: string
}

/**
 * Create Google Drive client with access token
 */
function createDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: "v3", auth })
}

/**
 * Export project files to Google Drive
 */
export async function exportToGoogleDrive(
  options: DriveExportOptions
): Promise<DriveExportResult> {
  const { accessToken, projectTitle, files } = options
  const drive = createDriveClient(accessToken)

  try {
    // Create main project folder
    const mainFolder = await drive.files.create({
      requestBody: {
        name: projectTitle,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id, webViewLink",
    })

    const mainFolderId = mainFolder.data.id!

    // Create subfolders
    const subfolders: Record<string, string> = {}
    const folderNames = ["images", "videos", "audio"]

    for (const folderName of folderNames) {
      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [mainFolderId],
        },
        fields: "id",
      })
      subfolders[folderName] = folder.data.id!
    }

    // Upload files
    for (const file of files) {
      const parentId =
        file.folder === "root" ? mainFolderId : subfolders[file.folder]

      const media = {
        mimeType: file.mimeType,
        body:
          typeof file.content === "string"
            ? file.content
            : bufferToStream(file.content),
      }

      await drive.files.create({
        requestBody: {
          name: file.name,
          parents: [parentId],
        },
        media,
        fields: "id",
      })
    }

    return {
      folderId: mainFolderId,
      folderUrl: mainFolder.data.webViewLink || `https://drive.google.com/drive/folders/${mainFolderId}`,
    }
  } catch (error) {
    console.error("Google Drive export error:", error)
    throw error
  }
}

/**
 * Convert Buffer to readable stream
 */
function bufferToStream(buffer: Buffer): NodeJS.ReadableStream {
  const { Readable } = require("stream")
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

/**
 * Check if user has Google Drive connected
 */
export async function checkDriveAccess(accessToken: string): Promise<boolean> {
  try {
    const drive = createDriveClient(accessToken)
    await drive.about.get({ fields: "user" })
    return true
  } catch {
    return false
  }
}

/**
 * Get folder picker configuration for Google Drive
 */
export function getFolderPickerConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    developerKey: process.env.GOOGLE_API_KEY,
    viewId: "FOLDERS",
    supportDrives: true,
    multiselect: false,
  }
}
