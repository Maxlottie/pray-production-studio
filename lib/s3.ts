import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "pray-production-studio"

export interface UploadUrlResult {
  uploadUrl: string
  fileUrl: string
  key: string
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<UploadUrlResult> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })
  // Return a special s3:// URL format that we'll convert to proxy URL on the frontend
  const fileUrl = `s3://${BUCKET_NAME}/${key}`

  return {
    uploadUrl,
    fileUrl,
    key,
  }
}

/**
 * Generate a presigned URL for downloading a file from S3 (expires in 1 hour by default)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Get an object from S3 as a stream/buffer
 */
export async function getObject(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return s3Client.send(command)
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Upload a buffer directly to S3 (private - no public ACL)
 * Returns an s3:// URL that should be converted to a proxy URL for display
 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // No ACL - bucket is private, we'll use presigned URLs or proxy to access
  })

  await s3Client.send(command)

  // Return s3:// URL format - will be converted to proxy URL for display
  return `s3://${BUCKET_NAME}/${key}`
}

/**
 * Check if a URL is an S3 URL (either s3:// or https://...s3...amazonaws.com)
 */
export function isS3Url(url: string): boolean {
  return url.startsWith("s3://") || url.includes(".s3.") && url.includes("amazonaws.com")
}

/**
 * Extract S3 key from various URL formats
 */
export function extractS3Key(url: string): string | null {
  // Handle s3:// format
  if (url.startsWith("s3://")) {
    const match = url.match(/^s3:\/\/[^/]+\/(.+)$/)
    return match ? match[1] : null
  }

  // Handle https://bucket.s3.region.amazonaws.com/key format
  if (url.includes(".s3.") && url.includes("amazonaws.com")) {
    const match = url.match(/amazonaws\.com\/(.+)$/)
    return match ? match[1] : null
  }

  return null
}

/**
 * Convert an S3 URL to a proxy URL for secure access
 */
export function toProxyUrl(url: string): string {
  const key = extractS3Key(url)
  if (key) {
    return `/api/images/proxy/${encodeURIComponent(key)}`
  }
  // Return original URL if not an S3 URL
  return url
}

/**
 * Generate a unique key for a project file
 */
export function generateProjectKey(
  projectId: string,
  type: "images" | "videos" | "audio",
  filename: string
): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `projects/${projectId}/${type}/${timestamp}_${sanitizedFilename}`
}

/**
 * Generate a unique key for a character reference image
 */
export function generateCharacterKey(
  characterId: string,
  variationId: string,
  filename: string
): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `characters/${characterId}/${variationId}/${timestamp}_${sanitizedFilename}`
}
