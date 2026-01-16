/**
 * Minimax API integration for video generation
 * Primary video generation provider
 */

const MINIMAX_API_BASE = "https://api.minimax.chat/v1"

export interface MinimaxVideoOptions {
  imageUrl: string
  prompt?: string
  motionType?: string
}

export interface MinimaxVideoResponse {
  taskId: string
  status: "pending" | "processing" | "completed" | "failed"
  videoUrl?: string
  error?: string
}

/**
 * Start video generation from an image
 */
export async function generateVideo(
  options: MinimaxVideoOptions
): Promise<MinimaxVideoResponse> {
  const { imageUrl, prompt, motionType = "subtle" } = options

  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not configured")
  }

  try {
    // Minimax video generation API call
    const response = await fetch(`${MINIMAX_API_BASE}/video/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "video-01",
        image_url: imageUrl,
        prompt: prompt || `Subtle ${motionType} camera movement, cinematic, epic biblical scene`,
        motion_strength: motionType === "subtle" ? 0.3 : 0.6,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Minimax API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      taskId: data.task_id || data.id,
      status: "pending",
    }
  } catch (error) {
    console.error("Minimax video generation error:", error)
    throw error
  }
}

/**
 * Check the status of a video generation task
 */
export async function checkVideoStatus(
  taskId: string
): Promise<MinimaxVideoResponse> {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY is not configured")
  }

  try {
    const response = await fetch(`${MINIMAX_API_BASE}/video/status/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Minimax API error: ${response.status}`)
    }

    const data = await response.json()

    // Map Minimax status to our status
    let status: MinimaxVideoResponse["status"] = "pending"
    if (data.status === "processing" || data.status === "running") {
      status = "processing"
    } else if (data.status === "completed" || data.status === "success") {
      status = "completed"
    } else if (data.status === "failed" || data.status === "error") {
      status = "failed"
    }

    return {
      taskId,
      status,
      videoUrl: data.video_url || data.output_url,
      error: data.error_message,
    }
  } catch (error) {
    console.error("Minimax status check error:", error)
    throw error
  }
}

/**
 * Map motion type to Minimax parameters
 */
export function getMotionParameters(motionType: string): {
  prompt: string
  strength: number
} {
  const motionMap: Record<string, { prompt: string; strength: number }> = {
    SUBTLE: {
      prompt: "very subtle movement, barely perceptible motion, cinematic stillness",
      strength: 0.2,
    },
    PAN_LEFT: {
      prompt: "smooth pan left camera movement, cinematic pan",
      strength: 0.5,
    },
    PAN_RIGHT: {
      prompt: "smooth pan right camera movement, cinematic pan",
      strength: 0.5,
    },
    ZOOM_IN: {
      prompt: "slow zoom in, dramatic focus, cinematic zoom",
      strength: 0.4,
    },
    ZOOM_OUT: {
      prompt: "slow zoom out, revealing epic scale, cinematic pullback",
      strength: 0.4,
    },
    PUSH_IN: {
      prompt: "dramatic push in, dolly forward, cinematic approach",
      strength: 0.5,
    },
    HAND_HELD: {
      prompt: "subtle handheld movement, organic camera shake, documentary feel",
      strength: 0.3,
    },
    CUSTOM: {
      prompt: "cinematic camera movement",
      strength: 0.4,
    },
  }

  return motionMap[motionType] || motionMap.SUBTLE
}
