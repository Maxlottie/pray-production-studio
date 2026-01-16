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
 * Mood prefixes - the opening mood word for prompts
 */
export const MOOD_PREFIX: Record<ShotMood, string> = {
  DRAMATIC: "Dramatic",
  PEACEFUL: "Peaceful",
  APOCALYPTIC: "Apocalyptic",
  DIVINE: "Divine",
  FOREBODING: "Foreboding",
  ACTION: "Intense",
}

/**
 * Atmospheric elements by mood
 */
export const MOOD_ATMOSPHERE: Record<ShotMood, string> = {
  DRAMATIC: "warm dying light mixing with growing shadows, shafts of golden light piercing through",
  PEACEFUL: "soft golden hour glow, gentle diffused light, calm stillness in the air",
  APOCALYPTIC: "ominous storm clouds gathering, eerie dim light, dust particles in the air",
  DIVINE: "radiant heavenly light breaking through clouds, ethereal glow surrounding the scene",
  FOREBODING: "dark shadows creeping in, threatening overcast sky, oppressive stillness",
  ACTION: "dynamic lighting with motion blur, dust kicked up, energy crackling in the air",
}

/**
 * Emotional/spiritual tone by mood
 */
export const MOOD_EMOTIONAL_TONE: Record<ShotMood, string> = {
  DRAMATIC: "intense emotional weight, pivotal moment, raw human emotion",
  PEACEFUL: "serene contemplation, inner peace, spiritual tranquility",
  APOCALYPTIC: "existential dread, world-ending gravity, overwhelming scale of destruction",
  DIVINE: "sacred transcendence, holy presence, awe-inspiring reverence",
  FOREBODING: "mounting tension, impending doom, unsettling anticipation",
  ACTION: "urgent desperation, life-or-death stakes, primal survival instinct",
}

/**
 * Color palette suggestions by mood
 */
export const MOOD_COLOR_PALETTE: Record<ShotMood, string> = {
  DRAMATIC: "warm amber and deep shadow tones",
  PEACEFUL: "soft golds, warm earth tones, gentle blues",
  APOCALYPTIC: "desaturated grays, sickly yellows, deep reds",
  DIVINE: "radiant whites, heavenly golds, soft blues",
  FOREBODING: "cold blues, dark grays, muted earth tones",
  ACTION: "high contrast, bold shadows, fiery oranges",
}

/**
 * Technical close for all prompts - camera and quality specs
 */
const TECHNICAL_CLOSE = "8k resolution, masterful composition, biblical era Middle Eastern setting"

/**
 * Negative prompt to avoid unwanted elements
 */
export const NEGATIVE_PROMPT = `cartoon, anime, low quality, blurry, modern clothing, anachronistic elements, watermark, text, logo, childish, cute, oversaturated, plastic looking, artificial, CGI look, video game style, medieval european, fantasy armor`

export interface PromptBuilderOptions {
  description: string
  mood: ShotMood
  visualStyle: VisualStyle
  aspectRatio: "LANDSCAPE" | "PORTRAIT"
  composition?: string // e.g., "wide angle", "close-up", "medium shot"
  characterDescriptions?: string[]
  referenceContext?: string
}

/**
 * Build a comprehensive image generation prompt
 *
 * Format:
 * [MOOD] cinematic scene of [SUBJECT/ACTION], [COMPOSITION], [KEY VISUAL DETAILS],
 * [ATMOSPHERIC ELEMENTS], [EMOTIONAL/SPIRITUAL TONE], [COLOR PALETTE], [TECHNICAL CLOSE]
 */
export function buildImagePrompt(options: PromptBuilderOptions): string {
  const {
    description,
    mood,
    visualStyle,
    composition,
    characterDescriptions = [],
    referenceContext,
  } = options

  const parts: string[] = []

  // 1. [MOOD] cinematic scene of [SUBJECT/ACTION]
  const moodPrefix = MOOD_PREFIX[mood]
  parts.push(`${moodPrefix} cinematic scene of ${description}`)

  // 2. [COMPOSITION] - if provided, otherwise skip
  if (composition) {
    parts.push(composition)
  }

  // 3. [KEY VISUAL DETAILS] - from visual style
  parts.push(VISUAL_STYLE_MODIFIERS[visualStyle])

  // 4. [ATMOSPHERIC ELEMENTS]
  parts.push(MOOD_ATMOSPHERE[mood])

  // 5. [EMOTIONAL/SPIRITUAL TONE]
  parts.push(MOOD_EMOTIONAL_TONE[mood])

  // 6. [COLOR PALETTE]
  parts.push(MOOD_COLOR_PALETTE[mood])

  // 7. [TECHNICAL CLOSE]
  parts.push(TECHNICAL_CLOSE)

  // Add character descriptions if provided
  if (characterDescriptions.length > 0) {
    parts.push(...characterDescriptions)
  }

  // Add reference context if using a reference image
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
    moodPrefixes: MOOD_PREFIX,
    moodAtmosphere: MOOD_ATMOSPHERE,
    moodEmotionalTone: MOOD_EMOTIONAL_TONE,
    moodColorPalette: MOOD_COLOR_PALETTE,
    technicalClose: TECHNICAL_CLOSE,
    negativePrompt: NEGATIVE_PROMPT,
  }
}

// Legacy exports for backwards compatibility
export const MOOD_MODIFIERS: Record<ShotMood, string> = {
  DRAMATIC: `${MOOD_PREFIX.DRAMATIC} - ${MOOD_ATMOSPHERE.DRAMATIC}, ${MOOD_EMOTIONAL_TONE.DRAMATIC}`,
  PEACEFUL: `${MOOD_PREFIX.PEACEFUL} - ${MOOD_ATMOSPHERE.PEACEFUL}, ${MOOD_EMOTIONAL_TONE.PEACEFUL}`,
  APOCALYPTIC: `${MOOD_PREFIX.APOCALYPTIC} - ${MOOD_ATMOSPHERE.APOCALYPTIC}, ${MOOD_EMOTIONAL_TONE.APOCALYPTIC}`,
  DIVINE: `${MOOD_PREFIX.DIVINE} - ${MOOD_ATMOSPHERE.DIVINE}, ${MOOD_EMOTIONAL_TONE.DIVINE}`,
  FOREBODING: `${MOOD_PREFIX.FOREBODING} - ${MOOD_ATMOSPHERE.FOREBODING}, ${MOOD_EMOTIONAL_TONE.FOREBODING}`,
  ACTION: `${MOOD_PREFIX.ACTION} - ${MOOD_ATMOSPHERE.ACTION}, ${MOOD_EMOTIONAL_TONE.ACTION}`,
}

// Camera modifiers - kept for video mode later
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
