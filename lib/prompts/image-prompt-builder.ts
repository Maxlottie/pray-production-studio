import type { ShotMood, VisualStyle } from "@prisma/client"

/**
 * Visual Style modifiers - these control whether the output looks like
 * a photograph, painting, or animation
 */
export const VISUAL_STYLE_MODIFIERS: Record<VisualStyle, string> = {
  PHOTOREALISTIC: "photorealistic, shot on Sony A7IV, 35mm lens, natural skin texture, visible pores, real photography, documentary style, no CGI, no digital painting, no illustration",
  HYPERREALISTIC_CINEMATIC: "hyperrealistic like a Hollywood film still, practical lighting, real actors, film grain, shot on ARRI Alexa, anamorphic lens flare, no CGI enhancement",
  DRAMATIC_REALISM: "photorealistic dramatic photography, chiaroscuro lighting, real human subjects, visible skin imperfections, sweat and dirt texture, raw and gritty, photojournalism style",
  EPIC_FILM_STILL: "movie still from epic biblical film, 70mm IMAX photography, real locations, practical effects, no digital enhancement, Ridley Scott cinematography style",
  PAINTERLY_ARTISTIC: "digital painting, concept art style, artistic interpretation, painterly brushstrokes",
  ANIMATED_STYLIZED: "3D animated style, Pixar-like rendering, stylized characters",
}

/**
 * Visual Style display labels
 */
export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  PHOTOREALISTIC: "Photorealistic",
  HYPERREALISTIC_CINEMATIC: "Hyperrealistic Cinematic",
  DRAMATIC_REALISM: "Dramatic Realism",
  EPIC_FILM_STILL: "Epic Film Still",
  PAINTERLY_ARTISTIC: "Painterly/Artistic",
  ANIMATED_STYLIZED: "Animated/Stylized",
}

/**
 * Visual Style descriptions for UI
 */
export const VISUAL_STYLE_DESCRIPTIONS: Record<VisualStyle, string> = {
  PHOTOREALISTIC: "Real photography look with natural skin texture and documentary style",
  HYPERREALISTIC_CINEMATIC: "Hollywood film still with practical lighting and film grain",
  DRAMATIC_REALISM: "Gritty photojournalism with chiaroscuro lighting",
  EPIC_FILM_STILL: "70mm IMAX epic biblical film aesthetic",
  PAINTERLY_ARTISTIC: "Digital painting with artistic brushstrokes",
  ANIMATED_STYLIZED: "3D animated Pixar-like style",
}

/**
 * Mood modifiers - emotional tone of the scene
 */
export const MOOD_MODIFIERS: Record<ShotMood, string> = {
  DRAMATIC: "dramatic cinematic scene, warm dying light mixing with growing shadows, intense emotional moment",
  PEACEFUL: "serene atmosphere, golden hour lighting, tranquil, soft ethereal glow, calm and contemplative",
  APOCALYPTIC: "apocalyptic cinematic scene, foreboding, haunting atmosphere, ominous skies, end times feeling",
  DIVINE: "divine light, heavenly radiance, ethereal glow, rays of holy light, sacred and transcendent",
  FOREBODING: "ominous atmosphere, dark shadows, building tension, threatening skies, sense of dread",
  ACTION: "dynamic composition, motion energy, intensity, dramatic movement, urgent and powerful",
}

/**
 * Technical base for all prompts - applied to all styles
 */
const TECHNICAL_BASE = "8k resolution, cinematic lighting, biblical era"

/**
 * Negative prompt to avoid unwanted elements
 */
export const NEGATIVE_PROMPT = `cartoon, anime, low quality, blurry, modern clothing, anachronistic elements, watermark, text, logo, childish, cute, oversaturated, plastic looking, artificial, CGI look, video game style, medieval european, fantasy armor`

export interface PromptBuilderOptions {
  description: string
  mood: ShotMood
  visualStyle: VisualStyle
  aspectRatio: "LANDSCAPE" | "PORTRAIT"
  characterDescriptions?: string[]
  referenceContext?: string
}

/**
 * Build a comprehensive image generation prompt
 *
 * Structure:
 * [Scene Description], [Mood], [Technical Base], [Visual Style Keywords]
 */
export function buildImagePrompt(options: PromptBuilderOptions): string {
  const {
    description,
    mood,
    visualStyle,
    characterDescriptions = [],
    referenceContext,
  } = options

  const parts: string[] = []

  // 1. Start with the scene description
  parts.push(description)

  // 2. Add mood modifier for emotional tone
  parts.push(MOOD_MODIFIERS[mood])

  // 3. Add technical base
  parts.push(TECHNICAL_BASE)

  // 4. Add visual style keywords (this is what controls the look)
  parts.push(VISUAL_STYLE_MODIFIERS[visualStyle])

  // 5. Add character descriptions if provided
  if (characterDescriptions.length > 0) {
    parts.push(...characterDescriptions)
  }

  // 6. Add reference context if using a reference image
  if (referenceContext) {
    parts.push(`maintaining visual consistency with: ${referenceContext}`)
  }

  return parts.filter(Boolean).join(", ")
}

/**
 * Build a short preview of the prompt for display
 */
export function buildPromptPreview(options: PromptBuilderOptions): string {
  const fullPrompt = buildImagePrompt(options)
  if (fullPrompt.length <= 200) {
    return fullPrompt
  }
  return fullPrompt.slice(0, 197) + "..."
}

/**
 * Get all visual style options for dropdowns
 */
export function getVisualStyleOptions(): { value: VisualStyle; label: string; description: string }[] {
  return (Object.keys(VISUAL_STYLE_MODIFIERS) as VisualStyle[]).map((style) => ({
    value: style,
    label: VISUAL_STYLE_LABELS[style],
    description: VISUAL_STYLE_DESCRIPTIONS[style],
  }))
}

/**
 * Get the style guide prompt components
 */
export function getStyleGuideComponents() {
  return {
    visualStyles: VISUAL_STYLE_MODIFIERS,
    moods: MOOD_MODIFIERS,
    technicalBase: TECHNICAL_BASE,
    negativePrompt: NEGATIVE_PROMPT,
  }
}

// Legacy exports for backwards compatibility (Camera modifiers - kept for video mode later)
export const CAMERA_MODIFIERS: Record<string, string> = {
  STATIC: "perfectly composed shot",
  PAN_LEFT: "cinematic composition with depth",
  PAN_RIGHT: "cinematic composition with depth",
  ZOOM_IN: "cinematic close focus, detailed",
  ZOOM_OUT: "cinematic wide shot, epic scale, vast landscape",
  PUSH_IN: "cinematic depth, leading lines",
  HAND_HELD: "intimate perspective, immediate presence",
  CUSTOM: "cinematic composition",
}
