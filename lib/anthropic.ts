import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export { anthropic }

export async function parseScript(scriptText: string): Promise<ParsedScript> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: SCRIPT_PARSER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please analyze the following script and break it down into scenes and shots. Output your analysis as JSON.

SCRIPT:
${scriptText}`,
      },
    ],
  })

  // Extract the text content from the response
  const textContent = response.content.find((block) => block.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response")
  }

  // Parse the JSON from the response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in response")
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParsedScript
  return parsed
}

// Types for parsed script
export interface ParsedScene {
  sceneIndex: number
  title: string
  location: string | null
  characters: string[]
  mood: string
  shots: ParsedShot[]
}

export interface ParsedShot {
  shotIndex: number
  description: string
  cameraMovement: string
  mood: string
  duration: number
}

export interface ParsedScript {
  scenes: ParsedScene[]
}

// Script parser system prompt
const SCRIPT_PARSER_SYSTEM_PROMPT = `You are a professional video production assistant specializing in biblical content. Your job is to analyze scripts and break them down into scenes and shots for video production.

When given a script, you will:

1. Identify natural scene breaks (changes in location, time, or major narrative shifts)
2. For each scene, identify:
   - A descriptive title
   - The location/setting
   - Characters present (use their biblical names)
   - The mood/tone

3. Break each scene into individual shots (approximately 4 seconds each by default)
4. For each shot, provide:
   - A detailed visual description (what the camera sees)
   - Suggested camera movement
   - Mood classification
   - Estimated duration

Output your analysis as JSON in this exact format:
{
  "scenes": [
    {
      "sceneIndex": 0,
      "title": "Scene title",
      "location": "Desert camp at sunset",
      "characters": ["Abraham", "Isaac"],
      "mood": "dramatic",
      "shots": [
        {
          "shotIndex": 0,
          "description": "Wide establishing shot of desert landscape with tents in the distance, golden sunset lighting casting long shadows across the sand dunes",
          "cameraMovement": "STATIC",
          "mood": "PEACEFUL",
          "duration": 4
        }
      ]
    }
  ]
}

Camera movement options: STATIC, PAN_LEFT, PAN_RIGHT, ZOOM_IN, ZOOM_OUT, PUSH_IN, HAND_HELD, CUSTOM
Mood options: DRAMATIC, PEACEFUL, APOCALYPTIC, DIVINE, FOREBODING, ACTION

Be cinematic and specific in your visual descriptions. Think like a film director. Each shot description should be vivid enough to generate a compelling image.`
