/**
 * Client-side utilities for handling image URLs
 * Converts S3 URLs to proxy URLs for secure access
 */

/**
 * Check if a URL is an S3 URL that needs proxying
 */
export function isS3Url(url: string): boolean {
  if (!url) return false
  return (
    url.startsWith("s3://") ||
    (url.includes(".s3.") && url.includes("amazonaws.com"))
  )
}

/**
 * Extract S3 key from various URL formats
 */
export function extractS3Key(url: string): string | null {
  if (!url) return null

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
 * Convert any image URL to a displayable URL
 * - S3 URLs get converted to proxy URLs
 * - Other URLs (OpenAI, data URLs, etc.) pass through unchanged
 */
export function getDisplayUrl(url: string): string {
  if (!url) return ""

  // If it's an S3 URL, convert to proxy URL
  const key = extractS3Key(url)
  if (key) {
    // Encode each path segment separately to handle slashes correctly
    const encodedKey = key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
    return `/api/images/proxy/${encodedKey}`
  }

  // Return original URL for non-S3 URLs (OpenAI, data URLs, etc.)
  return url
}

/**
 * Check if a URL is a data URL (base64)
 */
export function isDataUrl(url: string): boolean {
  return url?.startsWith("data:") || false
}

/**
 * Check if a URL is from OpenAI (temporary URLs)
 */
export function isOpenAIUrl(url: string): boolean {
  return url?.includes("oaidalleapiprodscus.blob.core.windows.net") || false
}
