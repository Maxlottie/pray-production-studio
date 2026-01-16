/**
 * ElevenLabs API integration for audio generation
 * TTS, voice enhancement, and music generation
 */

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

export interface Voice {
  voice_id: string
  name: string
  category: string
  preview_url?: string
}

export interface TTSOptions {
  text: string
  voiceId: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  style?: number
}

export interface MusicOptions {
  prompt: string
  duration?: number
  style?: string
}

/**
 * Get available voices
 */
export async function getVoices(): Promise<Voice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: {
        "xi-api-key": apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const data = await response.json()
    return data.voices || []
  } catch (error) {
    console.error("ElevenLabs get voices error:", error)
    throw error
  }
}

/**
 * Generate speech from text
 */
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const {
    text,
    voiceId,
    modelId = "eleven_multilingual_v2",
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.5,
  } = options

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail?.message ||
          `ElevenLabs API error: ${response.status}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("ElevenLabs TTS error:", error)
    throw error
  }
}

/**
 * Enhance audio using voice changer
 */
export async function enhanceAudio(
  audioBuffer: Buffer,
  voiceId: string
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }

  try {
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" })
    formData.append("audio", blob, "audio.mp3")
    formData.append("model_id", "eleven_english_sts_v2")

    const response = await fetch(
      `${ELEVENLABS_API_BASE}/speech-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail?.message ||
          `ElevenLabs API error: ${response.status}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("ElevenLabs enhance error:", error)
    throw error
  }
}

/**
 * Generate background music
 * Note: ElevenLabs may not have a direct music generation API,
 * this is a placeholder for potential future integration or
 * could be replaced with another service
 */
export async function generateMusic(options: MusicOptions): Promise<Buffer> {
  const { prompt, duration = 30 } = options

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured")
  }

  // ElevenLabs sound generation API
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/sound-generation`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail?.message ||
          `ElevenLabs API error: ${response.status}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("ElevenLabs music generation error:", error)
    throw error
  }
}

/**
 * Predefined music styles for biblical content
 */
export const MUSIC_STYLES = {
  CINEMATIC_ORCHESTRAL: "epic orchestral soundtrack, biblical, cinematic, dramatic strings and brass",
  AMBIENT_TENSION: "ambient tension, suspenseful, mysterious, dark atmospheric pads",
  EPIC_BATTLE: "epic battle music, intense percussion, dramatic brass, war drums",
  PEACEFUL_MEDITATIVE: "peaceful meditation music, soft piano, gentle strings, contemplative",
  DRAMATIC_STRINGS: "dramatic string orchestra, emotional, sweeping violins, cinematic",
} as const

/**
 * Recommended voices for biblical narration
 */
export const RECOMMENDED_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm female narrator" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Strong male narrator" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft female voice" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Deep male narrator" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Warm female voice" },
] as const
