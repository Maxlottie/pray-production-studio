/**
 * AI Assistant system prompt builder with full project context and tool definitions
 */

interface ShotContext {
  id: string
  shotIndex: number
  description: string
  mood: string
  visualStyle: string
  cameraMovement: string
  duration: number
  hasImages: boolean
  imageCount: number
  hasVideo: boolean
}

interface SceneContext {
  id: string
  sceneIndex: number
  title: string
  location: string | null
  shots: ShotContext[]
}

interface ProjectContext {
  projectId: string
  title: string
  aspectRatio: string
  status: string
  totalScenes: number
  totalShots: number
  shotsWithImages: number
  shotsWithVideos: number
  hasNarration: boolean
  hasMusic: boolean
  scriptText?: string | null
  scenes?: SceneContext[]
  currentPage?: "shots" | "images" | "videos" | "assembly"
}

/**
 * Build the system prompt for the AI assistant with full project knowledge
 */
export function buildAssistantSystemPrompt(context: ProjectContext): string {
  // Build scene breakdown with shot IDs for tool use
  let sceneBreakdown = ""
  if (context.scenes && context.scenes.length > 0) {
    sceneBreakdown = `

## FULL SCENE & SHOT BREAKDOWN:
${context.scenes.map((scene) => `
### Scene ${scene.sceneIndex + 1}: ${scene.title} (ID: ${scene.id})
Location: ${scene.location || "Not specified"}
${scene.shots.map((shot) => `
  **Shot ${shot.shotIndex + 1}** (ID: ${shot.id}):
  - Description: ${shot.description}
  - Mood: ${shot.mood}
  - Visual Style: ${shot.visualStyle || "PHOTOREALISTIC"}
  - Camera: ${shot.cameraMovement}
  - Duration: ${shot.duration}s
  - Images: ${shot.hasImages ? `${shot.imageCount} generated` : "None yet"}
  - Video: ${shot.hasVideo ? "Generated" : "Not yet"}`).join("")}
`).join("\n")}`
  }

  // Include script if available
  let scriptSection = ""
  if (context.scriptText) {
    scriptSection = `

## ORIGINAL SCRIPT:
"""
${context.scriptText.slice(0, 2000)}${context.scriptText.length > 2000 ? "... [truncated]" : ""}
"""
`
  }

  return `You are an AI Production Assistant for Pray Production Studio, helping create epic biblical videos for the AI BIBLE brand.

## YOUR CAPABILITIES:
You can **take real actions** on this project using tools:
1. **regenerate_shot_images** - Generate new images for a single shot
2. **regenerate_multiple_shots** - Generate images for MULTIPLE shots IN PARALLEL (FAST! Use this when user requests multiple shots)
3. **update_shot** - Change a shot's description, mood, or visual style
4. **update_and_regenerate** - Update shot settings AND regenerate images in one action
5. **batch_update_shots** - Update multiple shots at once for consistency

**IMPORTANT:** When user asks to regenerate multiple shots (e.g., "regenerate shots 5-10"), ALWAYS use regenerate_multiple_shots - it's 3x faster than calling regenerate_shot_images multiple times!

When the user asks you to improve, enhance, fix, or regenerate a shot - USE YOUR TOOLS to do it!

## PROJECT OVERVIEW:
- **Project:** ${context.title} (ID: ${context.projectId})
- **Aspect Ratio:** ${context.aspectRatio} (${context.aspectRatio === "LANDSCAPE" ? "16:9 horizontal" : "9:16 vertical/mobile"})
- **Status:** ${context.status}
- **Progress:** ${context.shotsWithImages}/${context.totalShots} shots have images, ${context.shotsWithVideos}/${context.totalShots} have videos
- **Current Page:** ${context.currentPage || "unknown"}
${scriptSection}${sceneBreakdown}

## VISUAL STYLES AVAILABLE:
- **PHOTOREALISTIC**: Natural photography, documentary style, real skin texture
- **HYPERREALISTIC_CINEMATIC**: Hollywood film still, ARRI Alexa look
- **DRAMATIC_REALISM**: Gritty photojournalism, raw and intense
- **EPIC_FILM_STILL**: 70mm IMAX epic, Ridley Scott style
- **PAINTERLY_ARTISTIC**: Digital painting, concept art style
- **ANIMATED_STYLIZED**: 3D Pixar-like rendering

## MOODS AVAILABLE:
- **DRAMATIC**: Warm dying light, growing shadows, intense
- **PEACEFUL**: Golden hour, serene, ethereal glow
- **APOCALYPTIC**: Foreboding, haunting, ominous
- **DIVINE**: Heavenly radiance, holy light rays
- **FOREBODING**: Dark shadows, tension, threatening
- **ACTION**: Dynamic, motion energy, intensity

## HOW TO RESPOND:
1. When user asks to improve/enhance/regenerate a shot → USE TOOLS to do it
2. When user asks about the project → Answer from your knowledge
3. When suggesting changes → Be specific about what you'd change and why
4. After taking actions → Confirm what you did and tell user to check results

## IMPORTANT:
- Shot numbers are 1-indexed for the user (Shot 1, Shot 2...)
- Always use the shot ID from the breakdown above when calling tools
- When regenerating, you can provide a custom prompt to enhance the default one
- For epic biblical content, prefer HYPERREALISTIC_CINEMATIC or EPIC_FILM_STILL styles
- Be creative but stay true to the biblical narrative`
}

/**
 * Tool definitions for Claude API
 */
export const ASSISTANT_TOOLS = [
  {
    name: "regenerate_shot_images",
    description:
      "Regenerate all 4 images for a specific shot. Use this when the user wants new/better images. This deletes existing images and generates fresh ones with the current or custom prompt.",
    input_schema: {
      type: "object" as const,
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to regenerate images for (from the shot breakdown)",
        },
        enhancedPrompt: {
          type: "string",
          description:
            "Optional: An enhanced/improved prompt to use. If not provided, uses the shot's current settings to build the prompt. Use this to add extra details like 'more dramatic lighting' or 'close-up emotional shot'.",
        },
      },
      required: ["shotId"],
    },
  },
  {
    name: "update_shot",
    description:
      "Update a shot's settings (description, mood, visual style). Does NOT regenerate images - use this when you just want to change settings for future generations.",
    input_schema: {
      type: "object" as const,
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to update",
        },
        description: {
          type: "string",
          description: "New visual description for the shot (what the camera sees)",
        },
        mood: {
          type: "string",
          enum: ["DRAMATIC", "PEACEFUL", "APOCALYPTIC", "DIVINE", "FOREBODING", "ACTION"],
          description: "The mood/atmosphere of the shot",
        },
        visualStyle: {
          type: "string",
          enum: [
            "PHOTOREALISTIC",
            "HYPERREALISTIC_CINEMATIC",
            "DRAMATIC_REALISM",
            "EPIC_FILM_STILL",
            "PAINTERLY_ARTISTIC",
            "ANIMATED_STYLIZED",
          ],
          description: "The visual rendering style",
        },
      },
      required: ["shotId"],
    },
  },
  {
    name: "update_and_regenerate",
    description:
      "Update a shot's settings AND immediately regenerate its images. Use this for a complete refresh - change the settings and generate new images in one action.",
    input_schema: {
      type: "object" as const,
      properties: {
        shotId: {
          type: "string",
          description: "The ID of the shot to update and regenerate",
        },
        description: {
          type: "string",
          description: "New visual description for the shot",
        },
        mood: {
          type: "string",
          enum: ["DRAMATIC", "PEACEFUL", "APOCALYPTIC", "DIVINE", "FOREBODING", "ACTION"],
          description: "The mood/atmosphere",
        },
        visualStyle: {
          type: "string",
          enum: [
            "PHOTOREALISTIC",
            "HYPERREALISTIC_CINEMATIC",
            "DRAMATIC_REALISM",
            "EPIC_FILM_STILL",
            "PAINTERLY_ARTISTIC",
            "ANIMATED_STYLIZED",
          ],
          description: "The visual rendering style",
        },
      },
      required: ["shotId"],
    },
  },
  {
    name: "batch_update_shots",
    description:
      "Update multiple shots at once with the same mood or visual style. Great for ensuring consistency across a scene or the entire project.",
    input_schema: {
      type: "object" as const,
      properties: {
        shotIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of shot IDs to update",
        },
        mood: {
          type: "string",
          enum: ["DRAMATIC", "PEACEFUL", "APOCALYPTIC", "DIVINE", "FOREBODING", "ACTION"],
          description: "The mood to apply to all shots",
        },
        visualStyle: {
          type: "string",
          enum: [
            "PHOTOREALISTIC",
            "HYPERREALISTIC_CINEMATIC",
            "DRAMATIC_REALISM",
            "EPIC_FILM_STILL",
            "PAINTERLY_ARTISTIC",
            "ANIMATED_STYLIZED",
          ],
          description: "The visual style to apply to all shots",
        },
        regenerate: {
          type: "boolean",
          description: "Whether to regenerate images for all updated shots (can take a while for many shots)",
        },
      },
      required: ["shotIds"],
    },
  },
  {
    name: "regenerate_multiple_shots",
    description:
      "Regenerate images for multiple shots IN PARALLEL. MUCH faster than calling regenerate_shot_images multiple times. Use this when user asks to regenerate multiple shots (e.g., 'regenerate shots 5-10' or 'regenerate shots 1, 3, and 5'). Processes up to 3 shots at once for speed.",
    input_schema: {
      type: "object" as const,
      properties: {
        shotIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of shot IDs to regenerate images for",
        },
        enhancedPrompt: {
          type: "string",
          description:
            "Optional: An enhanced prompt to apply to ALL shots being regenerated. Good for applying consistent style like 'more epic and dramatic lighting'.",
        },
      },
      required: ["shotIds"],
    },
  },
]

/**
 * Build context summary for a single shot
 */
export function buildShotContext(shot: {
  shotIndex: number
  description: string
  mood: string
  cameraMovement: string
  duration: number
  hasImage: boolean
  hasVideo: boolean
}): string {
  return `Shot ${shot.shotIndex + 1}:
- Description: ${shot.description}
- Mood: ${shot.mood}
- Camera: ${shot.cameraMovement}
- Duration: ${shot.duration}s
- Has Image: ${shot.hasImage ? "Yes" : "No"}
- Has Video: ${shot.hasVideo ? "Yes" : "No"}`
}

/**
 * Prompt templates for common assistant tasks
 */
export const ASSISTANT_PROMPTS = {
  improveDescription: (description: string) =>
    `Please improve this shot description for better AI image generation. Make it more visually specific and cinematic while maintaining the biblical context: "${description}"`,

  suggestMood: (description: string) =>
    `Based on this shot description, what mood would best fit? Options are DRAMATIC, PEACEFUL, APOCALYPTIC, DIVINE, FOREBODING, or ACTION. Description: "${description}"`,

  reviewProject: () =>
    `Please review this project and provide 3-5 specific suggestions for improvement. Consider the narrative flow, visual consistency, and areas that might need attention.`,
}
