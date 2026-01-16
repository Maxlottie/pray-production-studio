/**
 * Runway API integration for video generation
 * Secondary video generation provider
 */

const RUNWAY_API_BASE = "https://api.runwayml.com/v1"

export interface RunwayVideoOptions {
  imageUrl: string
  prompt?: string
  motionType?: string
  duration?: number
}

export interface RunwayVideoResponse {
  taskId: string
  status: "pending" | "processing" | "completed" | "failed"
  videoUrl?: string
  error?: string
  progress?: number
}

/**
 * Start video generation from an image using Runway Gen-3
 */
export async function generateVideo(
  options: RunwayVideoOptions
): Promise<RunwayVideoResponse> {
  const { imageUrl, prompt, motionType = "subtle", duration = 4 } = options

  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error("RUNWAY_API_KEY is not configured")
  }

  try {
    const motionParams = getMotionParameters(motionType)

    const response = await fetch(`${RUNWAY_API_BASE}/image-to-video`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-09-13",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptImage: imageUrl,
        promptText: prompt || motionParams.prompt,
        duration,
        watermark: false,
        seed: Math.floor(Math.random() * 1000000),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Runway API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      taskId: data.id,
      status: "pending",
    }
  } catch (error) {
    console.error("Runway video generation error:", error)
    throw error
  }
}

/**
 * Check the status of a video generation task
 */
export async function checkVideoStatus(
  taskId: string
): Promise<RunwayVideoResponse> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error("RUNWAY_API_KEY is not configured")
  }

  try {
    const response = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-09-13",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Runway API error: ${response.status}`)
    }

    const data = await response.json()

    // Map Runway status to our status
    let status: RunwayVideoResponse["status"] = "pending"
    if (data.status === "RUNNING" || data.status === "THROTTLED") {
      status = "processing"
    } else if (data.status === "SUCCEEDED") {
      status = "completed"
    } else if (data.status === "FAILED" || data.status === "CANCELLED") {
      status = "failed"
    }

    return {
      taskId,
      status,
      videoUrl: data.output?.[0] || data.artifacts?.[0]?.url,
      error: data.failure || data.failureCode,
      progress: data.progress ? Math.round(data.progress * 100) : undefined,
    }
  } catch (error) {
    console.error("Runway status check error:", error)
    throw error
  }
}

/**
 * Map motion type to Runway prompt parameters
 */
export function getMotionParameters(motionType: string): {
  prompt: string
} {
  const motionMap: Record<string, { prompt: string }> = {
    SUBTLE: {
      prompt: "very subtle ambient movement, gentle atmospheric motion, cinematic stillness with minimal movement",
    },
    PAN_LEFT: {
      prompt: "camera panning smoothly to the left, cinematic pan shot, horizontal camera movement",
    },
    PAN_RIGHT: {
      prompt: "camera panning smoothly to the right, cinematic pan shot, horizontal camera movement",
    },
    ZOOM_IN: {
      prompt: "camera slowly zooming in, dramatic zoom focus, cinematic zoom movement toward subject",
    },
    ZOOM_OUT: {
      prompt: "camera slowly zooming out, revealing wider scene, epic pullback shot",
    },
    PUSH_IN: {
      prompt: "camera pushing forward dramatically, dolly in movement, approaching subject",
    },
    HAND_HELD: {
      prompt: "subtle handheld camera movement, organic motion, documentary style camera shake",
    },
    CUSTOM: {
      prompt: "cinematic camera movement, epic biblical scene animation",
    },
  }

  return motionMap[motionType] || motionMap.SUBTLE
}

/**
 * Cancel a running video generation task
 */
export async function cancelVideoGeneration(taskId: string): Promise<void> {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    throw new Error("RUNWAY_API_KEY is not configured")
  }

  try {
    await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-09-13",
      },
    })
  } catch (error) {
    console.error("Runway cancel error:", error)
    throw error
  }
}
