import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export { openai }

export type AspectRatioType = "LANDSCAPE" | "PORTRAIT"

export interface GenerateImageOptions {
  prompt: string
  aspectRatio?: AspectRatioType
  quality?: "standard" | "hd"
  style?: "vivid" | "natural"
}

export interface GeneratedImage {
  url: string
  revisedPrompt?: string
}

/**
 * Generate an image using OpenAI's GPT Image 1.5 (gpt-image-1.5)
 * Released December 2025 - 4x faster than gpt-image-1 with better quality
 * Falls back to gpt-image-1, then DALL-E 3 if unavailable
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GeneratedImage> {
  const { prompt, aspectRatio = "LANDSCAPE", quality = "hd" } = options

  // GPT Image supports: 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait), and up to 4096x4096
  const gptImageSize = aspectRatio === "LANDSCAPE" ? "1536x1024" : "1024x1536"

  // DALL-E 3 fallback sizes: 1024x1024, 1792x1024 (landscape), 1024x1792 (portrait)
  const dalleSize = aspectRatio === "LANDSCAPE" ? "1792x1024" : "1024x1792"

  // Try GPT Image 1.5 first (latest model as of Dec 2025 - 4x faster, better quality)
  console.log(`[OpenAI] Attempting GPT Image 1.5 (gpt-image-1.5) generation, size: ${gptImageSize}`)
  console.log(`[OpenAI] Prompt (first 200 chars): ${prompt.substring(0, 200)}...`)

  try {
    // GPT Image 1.5 generation - latest model
    // Note: Returns base64 by default
    const response = await openai.images.generate({
      model: "gpt-image-1.5" as string, // Cast to avoid TypeScript issues with newer model
      prompt,
      n: 1,
      size: gptImageSize as "1024x1024" | "1536x1024" | "1024x1536",
      quality: quality === "hd" ? "high" : "medium",
    } as Parameters<typeof openai.images.generate>[0])

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data returned from GPT Image")
    }

    const image = response.data[0]

    // GPT Image may return base64 or URL
    if (image.b64_json) {
      console.log(`[OpenAI] GPT Image returned base64 image - SUCCESS with gpt-image-1.5!`)
      return {
        url: `data:image/png;base64,${image.b64_json}`,
        revisedPrompt: image.revised_prompt,
      }
    }

    if (!image.url) {
      throw new Error("No image URL returned from GPT Image")
    }

    console.log(`[OpenAI] Successfully generated image with GPT Image 1.5!`)
    return {
      url: image.url,
      revisedPrompt: image.revised_prompt,
    }
  } catch (gptImage15Error: unknown) {
    console.warn("[OpenAI] GPT Image 1.5 failed, trying gpt-image-1 fallback...")

    // Log the specific error
    if (gptImage15Error && typeof gptImage15Error === "object") {
      const err = gptImage15Error as { status?: number; message?: string; code?: string; error?: { message?: string } }
      console.warn(`[OpenAI] GPT Image 1.5 Error: ${err.message || err.error?.message || JSON.stringify(gptImage15Error)}`)
    }

    // First fallback: try gpt-image-1
    try {
      console.log(`[OpenAI] Trying gpt-image-1 fallback, size: ${gptImageSize}`)

      const response = await openai.images.generate({
        model: "gpt-image-1" as string,
        prompt,
        n: 1,
        size: gptImageSize as "1024x1024" | "1536x1024" | "1024x1536",
        quality: quality === "hd" ? "high" : "medium",
      } as Parameters<typeof openai.images.generate>[0])

      if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from GPT Image 1")
      }

      const image = response.data[0]

      if (image.b64_json) {
        console.log(`[OpenAI] GPT Image 1 returned base64 image - SUCCESS with gpt-image-1!`)
        return {
          url: `data:image/png;base64,${image.b64_json}`,
          revisedPrompt: image.revised_prompt,
        }
      }

      if (!image.url) {
        throw new Error("No image URL returned from GPT Image 1")
      }

      console.log(`[OpenAI] Successfully generated image with GPT Image 1!`)
      return {
        url: image.url,
        revisedPrompt: image.revised_prompt,
      }
    } catch (gptImage1Error: unknown) {
      console.warn("[OpenAI] GPT Image 1 also failed, trying DALL-E 3 fallback...")

      if (gptImage1Error && typeof gptImage1Error === "object") {
        const err = gptImage1Error as { status?: number; message?: string; code?: string; error?: { message?: string } }
        console.warn(`[OpenAI] GPT Image 1 Error: ${err.message || err.error?.message || JSON.stringify(gptImage1Error)}`)
      }

    // Final fallback to DALL-E 3
    try {
      console.log(`[OpenAI] Falling back to DALL-E 3, size: ${dalleSize}`)

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: dalleSize,
        quality,
        style: "natural", // "natural" for more realistic, less cartoony look
      })

      if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from DALL-E 3")
      }

      const image = response.data[0]

      if (!image.url) {
        throw new Error("No image URL returned from DALL-E 3")
      }

      console.log(`[OpenAI] Generated image with DALL-E 3 (final fallback)`)
      return {
        url: image.url,
        revisedPrompt: image.revised_prompt,
      }
    } catch (dalleError: unknown) {
      console.error("[OpenAI] DALL-E 3 fallback also failed:", dalleError)
      throw dalleError
    }
    } // close gptImage1Error catch
  } // close gptImage15Error catch
}

/**
 * Download an image from a URL and return it as a buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate multiple images for a shot (for selection)
 * Uses GPT Image 1.5 (or fallback models) which only supports n=1
 */
export async function generateMultipleImages(
  options: GenerateImageOptions,
  count: number = 4
): Promise<GeneratedImage[]> {
  // GPT Image models only support n=1, so we make multiple parallel requests
  const promises = Array.from({ length: count }, () => generateImage(options))

  const results = await Promise.allSettled(promises)

  return results
    .filter((result): result is PromiseFulfilledResult<GeneratedImage> =>
      result.status === "fulfilled"
    )
    .map((result) => result.value)
}
