# CLAUDE.md - Pray Production Studio

## Project Implementation Roadmap

This project will be built in 6 phases. Each phase should be completed fully before moving to the next. Reference this roadmap and the full specification below when implementing any feature.

### Phase 1: Foundation ✅ (CURRENT)
- Next.js 14+ with App Router, TypeScript, Tailwind CSS
- Prisma schema with ALL models and enums (do not skip any)
- NextAuth.js with Google Provider
- AppShell layout with collapsible sidebar
- Dashboard page and basic project creation
- Protected routes via middleware

### Phase 2: Project & Script Flow
- Project detail pages with tabbed navigation (Audio, Shots, Images, Videos, Assembly)
- Script upload (paste text or upload .docx file)
- Claude API integration for script parsing
- Shot list generation from parsed script
- ShotCard and ShotList components
- Scene grouping with SceneHeader component

### Phase 3: Image Generation Pipeline
- AWS S3 integration with presigned URLs for uploads
- OpenAI GPT-4o integration for image generation
- Character library with reference images
- ImageCard and ImageGrid components
- Regeneration options (single, scene, forward, with reference)
- Image selection for video generation

### Phase 4: Video Generation
- Minimax API integration (primary provider)
- Runway API integration (secondary provider)
- Motion type selector component
- Status polling for async video generation
- VideoCard and VideoGrid components
- Video selection for final assembly

### Phase 5: Audio & Assembly
- ElevenLabs TTS integration
- Audio upload and recording options
- Music generation
- Timeline component for assembly
- Preview player
- Premiere XML export generation
- Google Drive export integration

### Phase 6: Polish & AI Assistant
- Claude-powered assistant panel for project help
- Error handling improvements
- Loading states and skeleton loaders
- Mobile responsive refinements
- Edge case handling
- Final documentation

---

## Implementation Guidelines

1. **Always use the tech stack specified** - do not substitute libraries
2. **Follow the exact project structure** - file paths matter for imports
3. **Use shadcn/ui components** - run `npx shadcn-ui@latest add [component]` as needed
4. **Match the color palette exactly** - primary: #1a1a2e, accent: #d4a84b
5. **All API routes need error handling** - wrap in try-catch, return proper status codes
6. **Add loading states** - use skeleton loaders for async operations
7. **Mobile first** - sidebar collapses, grids become single column
8. **TypeScript strict mode** - no `any` types, proper interfaces for all data

---

# Pray Production Studio - Complete Specification

## Overview

Pray Production Studio is a web-based video production tool that automates the creation of epic animated biblical videos for the AI BIBLE brand. It takes a script from concept to Premiere-ready video through an AI-powered pipeline.

**Target Users:** Content producers at Pray.com (Zak, Max, and team)

**Core Flow:**
```
Script Upload → Audio Production (optional) → Shot Planning → Image Generation → Video Generation → Assembly & Export
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | Vercel Postgres |
| ORM | Prisma |
| Authentication | NextAuth.js with Google Provider |
| File Storage | AWS S3 |
| Image Generation | OpenAI GPT-4o |
| Video Generation | Minimax (primary), Runway (secondary) |
| Audio | ElevenLabs (TTS, voice changer, music) |
| AI Assistant | Anthropic Claude API |
| Hosting | Vercel |
| Export Integration | Google Drive API |

---

## Environment Variables

Create a `.env.local` file with these variables:

```env
# Database (auto-populated by Vercel Postgres)
DATABASE_URL="your_vercel_postgres_url"

# Authentication
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate_a_random_secret_here"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# AI Services
OPENAI_API_KEY="your_openai_api_key"
ANTHROPIC_API_KEY="your_anthropic_api_key"

# Video Generation
MINIMAX_API_KEY="your_minimax_api_key"
RUNWAY_API_KEY="your_runway_api_key"

# Audio Generation
ELEVENLABS_API_KEY="your_elevenlabs_api_key"

# AWS S3 Storage
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_S3_BUCKET_NAME="pray-production-studio"
AWS_REGION="us-east-1"
```

---

## Project Structure

```
pray-production-studio/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (redirects to /dashboard)
│   ├── globals.css
│   ├── dashboard/
│   │   └── page.tsx
│   ├── projects/
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [projectId]/
│   │       ├── page.tsx (overview/router)
│   │       ├── audio/
│   │       │   └── page.tsx
│   │       ├── shots/
│   │       │   └── page.tsx
│   │       ├── images/
│   │       │   └── page.tsx
│   │       ├── videos/
│   │       │   └── page.tsx
│   │       └── assembly/
│   │           └── page.tsx
│   ├── characters/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── projects/
│       │   ├── route.ts (GET all, POST create)
│       │   └── [projectId]/
│       │       └── route.ts
│       ├── scripts/
│       │   ├── parse/
│       │   │   └── route.ts
│       │   └── upload/
│       │       └── route.ts
│       ├── shots/
│       │   └── route.ts
│       ├── images/
│       │   ├── generate/
│       │   │   └── route.ts
│       │   └── regenerate/
│       │       └── route.ts
│       ├── videos/
│       │   ├── generate/
│       │   │   └── route.ts
│       │   └── status/
│       │       └── route.ts
│       ├── audio/
│       │   ├── tts/
│       │   │   └── route.ts
│       │   ├── enhance/
│       │   │   └── route.ts
│       │   └── music/
│       │       └── route.ts
│       ├── characters/
│       │   └── route.ts
│       ├── assistant/
│       │   └── route.ts
│       ├── export/
│       │   ├── drive/
│       │   │   └── route.ts
│       │   └── premiere/
│       │       └── route.ts
│       └── upload/
│           └── route.ts (S3 presigned URLs)
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppShell.tsx
│   ├── dashboard/
│   │   ├── ProjectCard.tsx
│   │   └── ProjectGrid.tsx
│   ├── projects/
│   │   ├── ScriptInput.tsx
│   │   ├── AspectRatioSelector.tsx
│   │   └── ProjectStatus.tsx
│   ├── audio/
│   │   ├── NarrationRecorder.tsx
│   │   ├── TTSGenerator.tsx
│   │   ├── MusicGenerator.tsx
│   │   └── AudioPlayer.tsx
│   ├── shots/
│   │   ├── ShotCard.tsx
│   │   ├── ShotList.tsx
│   │   ├── SceneHeader.tsx
│   │   └── ScriptViewer.tsx
│   ├── images/
│   │   ├── ImageCard.tsx
│   │   ├── ImageGrid.tsx
│   │   ├── PromptEditor.tsx
│   │   └── RegenerateDropdown.tsx
│   ├── videos/
│   │   ├── VideoCard.tsx
│   │   ├── VideoGrid.tsx
│   │   ├── MotionSelector.tsx
│   │   └── ProviderSelector.tsx
│   ├── assembly/
│   │   ├── Timeline.tsx
│   │   ├── PreviewPlayer.tsx
│   │   └── ExportOptions.tsx
│   ├── characters/
│   │   ├── CharacterCard.tsx
│   │   ├── CharacterGrid.tsx
│   │   ├── VariationTabs.tsx
│   │   └── ReferenceImageUploader.tsx
│   └── assistant/
│       ├── AssistantPanel.tsx
│       ├── AssistantToggle.tsx
│       └── MessageList.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── s3.ts
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── minimax.ts
│   ├── runway.ts
│   ├── elevenlabs.ts
│   ├── google-drive.ts
│   ├── premiere-xml.ts
│   ├── prompts/
│   │   ├── script-parser.ts
│   │   ├── shot-generator.ts
│   │   ├── image-prompt-builder.ts
│   │   └── assistant-system.ts
│   └── utils/
│       ├── docx-parser.ts
│       └── duration-calculator.ts
├── hooks/
│   ├── useProject.ts
│   ├── useShots.ts
│   ├── useImageGeneration.ts
│   ├── useVideoGeneration.ts
│   └── useAssistant.ts
├── types/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── logo.svg
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}

// ==================== USER & AUTH ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  projects      Project[]
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==================== PROJECT ====================

enum AspectRatio {
  LANDSCAPE  // 16:9
  PORTRAIT   // 9:16
}

enum ProjectStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
}

model Project {
  id          String        @id @default(cuid())
  title       String
  aspectRatio AspectRatio   @default(LANDSCAPE)
  status      ProjectStatus @default(DRAFT)
  createdById String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  // Relations
  createdBy   User          @relation(fields: [createdById], references: [id])
  scripts     Script[]
  scenes      Scene[]
  shots       Shot[]
  audio       ProjectAudio?
  assistant   AssistantConversation?
}

// ==================== SCRIPT ====================

enum ScriptStatus {
  DRAFT
  PARSED
  APPROVED
}

model Script {
  id             String       @id @default(cuid())
  projectId      String
  version        Int          @default(1)
  rawText        String       @db.Text
  sourceFileName String?
  parsedData     Json?        // Parsed scenes/structure from AI
  status         ScriptStatus @default(DRAFT)
  createdAt      DateTime     @default(now())
  
  // Relations
  project        Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, version])
}

// ==================== SCENE ====================

model Scene {
  id               String   @id @default(cuid())
  projectId        String
  sceneIndex       Int
  title            String
  location         String?
  characterIds     String[] // Array of CharacterVariation IDs
  referenceImageId String?  // For "use as reference" feature
  createdAt        DateTime @default(now())
  
  // Relations
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  shots            Shot[]
  
  @@unique([projectId, sceneIndex])
}

// ==================== SHOT ====================

enum CameraMovement {
  STATIC
  PAN_LEFT
  PAN_RIGHT
  ZOOM_IN
  ZOOM_OUT
  PUSH_IN
  HAND_HELD
  CUSTOM
}

enum ShotMood {
  DRAMATIC
  PEACEFUL
  APOCALYPTIC
  DIVINE
  FOREBODING
  ACTION
}

enum ShotStatus {
  PENDING
  APPROVED
}

model Shot {
  id                   String         @id @default(cuid())
  projectId            String
  sceneId              String
  shotIndex            Int
  description          String         @db.Text
  cameraMovement       CameraMovement @default(STATIC)
  customCameraMovement String?
  duration             Decimal        @default(4.0) @db.Decimal(5, 2)
  mood                 ShotMood       @default(DRAMATIC)
  status               ShotStatus     @default(PENDING)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
  
  // Relations
  project              Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  scene                Scene          @relation(fields: [sceneId], references: [id], onDelete: Cascade)
  images               ImageGeneration[]
  videos               VideoGeneration[]
  
  @@unique([projectId, shotIndex])
}

// ==================== IMAGE GENERATION ====================

model ImageGeneration {
  id        String   @id @default(cuid())
  shotId    String
  prompt    String   @db.Text
  imageUrl  String
  selected  Boolean  @default(false)
  createdAt DateTime @default(now())
  
  // Relations
  shot      Shot     @relation(fields: [shotId], references: [id], onDelete: Cascade)
  videos    VideoGeneration[]
}

// ==================== VIDEO GENERATION ====================

enum VideoProvider {
  MINIMAX
  RUNWAY
}

enum MotionType {
  SUBTLE
  PAN_LEFT
  PAN_RIGHT
  ZOOM_IN
  ZOOM_OUT
  PUSH_IN
  HAND_HELD
  CUSTOM
}

enum VideoStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model VideoGeneration {
  id               String        @id @default(cuid())
  shotId           String
  sourceImageId    String
  provider         VideoProvider @default(MINIMAX)
  motionType       MotionType    @default(SUBTLE)
  customMotionType String?
  videoUrl         String?
  status           VideoStatus   @default(PENDING)
  selected         Boolean       @default(false)
  errorMessage     String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  // Relations
  shot             Shot          @relation(fields: [shotId], references: [id], onDelete: Cascade)
  sourceImage      ImageGeneration @relation(fields: [sourceImageId], references: [id])
}

// ==================== AUDIO ====================

enum NarrationSource {
  RECORDED
  TTS
  UPLOADED
}

enum MusicSource {
  GENERATED
  UPLOADED
}

model ProjectAudio {
  id              String           @id @default(cuid())
  projectId       String           @unique
  narrationUrl    String?
  narrationSource NarrationSource?
  musicUrl        String?
  musicSource     MusicSource?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Relations
  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// ==================== CHARACTER LIBRARY ====================

model Character {
  id         String              @id @default(cuid())
  name       String
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt
  
  // Relations
  variations CharacterVariation[]
}

enum VariationType {
  YOUNG
  ADULT
  OLD
  CUSTOM
}

model CharacterVariation {
  id           String                    @id @default(cuid())
  characterId  String
  type         VariationType             @default(ADULT)
  customLabel  String?
  description  String?                   @db.Text
  createdAt    DateTime                  @default(now())
  
  // Relations
  character    Character                 @relation(fields: [characterId], references: [id], onDelete: Cascade)
  images       CharacterReferenceImage[]
}

model CharacterReferenceImage {
  id          String             @id @default(cuid())
  variationId String
  imageUrl    String
  isPrimary   Boolean            @default(false)
  createdAt   DateTime           @default(now())
  
  // Relations
  variation   CharacterVariation @relation(fields: [variationId], references: [id], onDelete: Cascade)
}

// ==================== STYLE GUIDE ====================

model StyleGuide {
  id             String   @id @default(cuid())
  name           String
  basePrompt     String   @db.Text
  negativePrompt String   @db.Text
  isDefault      Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// ==================== AI ASSISTANT ====================

model AssistantConversation {
  id        String   @id @default(cuid())
  projectId String   @unique
  messages  Json     @default("[]") // Array of message objects
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

---

## Style Guide (Design System)

### Color Palette

```css
:root {
  /* Primary Colors */
  --color-primary: #1a1a2e;        /* Deep Navy - headers, sidebar, primary buttons */
  --color-primary-light: #2d2d44;  /* Lighter navy for hover states */
  --color-accent: #d4a84b;         /* Warm Gold - accents, active states */
  --color-accent-light: #e6c36a;   /* Light gold for hover */
  
  /* Backgrounds */
  --color-bg-main: #f8f7f4;        /* Off-white - main content area */
  --color-bg-surface: #ffffff;     /* White - cards, panels */
  --color-bg-sidebar: #1a1a2e;     /* Same as primary - sidebar bg */
  
  /* Text */
  --color-text-primary: #2d2d2d;   /* Dark charcoal - body text */
  --color-text-secondary: #6b6b6b; /* Medium gray - secondary text */
  --color-text-muted: #9ca3af;     /* Light gray - muted text */
  --color-text-inverse: #ffffff;   /* White - text on dark bg */
  
  /* Borders */
  --color-border: #e5e5e5;         /* Light border */
  --color-border-focus: #d4a84b;   /* Gold border on focus */
  
  /* Status Colors */
  --color-success: #4a9d6e;        /* Soft green */
  --color-warning: #e6a23c;        /* Amber */
  --color-error: #d64545;          /* Soft red */
  --color-info: #5b8def;           /* Blue */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

### Tailwind Config Extension

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a1a2e',
          light: '#2d2d44',
        },
        accent: {
          DEFAULT: '#d4a84b',
          light: '#e6c36a',
        },
        surface: '#ffffff',
        background: '#f8f7f4',
        border: '#e5e5e5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### Component Styling Patterns

**Cards:**
```tsx
<div className="bg-white rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow">
  {/* content */}
</div>
```

**Primary Button:**
```tsx
<button className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-md font-medium transition-colors">
  Button Text
</button>
```

**Accent Button:**
```tsx
<button className="bg-accent hover:bg-accent-light text-primary px-4 py-2 rounded-md font-medium transition-colors">
  Button Text
</button>
```

**Outline Button:**
```tsx
<button className="border border-border hover:border-accent text-primary px-4 py-2 rounded-md font-medium transition-colors">
  Button Text
</button>
```

**Form Input:**
```tsx
<input className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
```

**Sidebar Item:**
```tsx
<a className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-primary-light rounded-md transition-colors">
  <Icon className="w-5 h-5" />
  <span>Label</span>
</a>
```

---

## AI Prompts

### Script Parser System Prompt

```typescript
// lib/prompts/script-parser.ts

export const SCRIPT_PARSER_SYSTEM_PROMPT = `You are a professional video production assistant specializing in biblical content. Your job is to analyze scripts and break them down into scenes and shots for video production.

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

Camera movement options: STATIC, PAN_LEFT, PAN_RIGHT, ZOOM_IN, ZOOM_OUT, PUSH_IN, HAND_HELD
Mood options: DRAMATIC, PEACEFUL, APOCALYPTIC, DIVINE, FOREBODING, ACTION

Be cinematic and specific in your visual descriptions. Think like a film director.`
```

### Image Prompt Builder

```typescript
// lib/prompts/image-prompt-builder.ts

export const MASTER_STYLE_PROMPT = `epic biblical scene, cinematic color grading, volumetric light rays, masterpiece composition, 8k masterpiece, hyperrealistic, divine light`

export const MOOD_MODIFIERS: Record<string, string> = {
  DRAMATIC: 'dramatic cinematic scene, warm dying light mixing with growing shadows',
  PEACEFUL: 'serene atmosphere, golden hour lighting, tranquil, soft ethereal glow',
  APOCALYPTIC: 'Apocalyptic cinematic scene, foreboding cinematic scene, haunting cinematic scene',
  DIVINE: 'divine light, heavenly radiance, ethereal glow, rays of holy light',
  FOREBODING: 'ominous atmosphere, dark shadows, building tension, threatening skies',
  ACTION: 'dynamic composition, motion energy, intensity, dramatic movement'
}

export const CAMERA_MODIFIERS: Record<string, string> = {
  STATIC: 'perfectly composed shot',
  PAN_LEFT: 'cinematic composition with depth',
  PAN_RIGHT: 'cinematic composition with depth',
  ZOOM_IN: 'cinematic close focus, detailed',
  ZOOM_OUT: 'cinematic wide shot, epic scale, vast landscape',
  PUSH_IN: 'cinematic depth, leading lines',
  HAND_HELD: 'intimate perspective, immediate presence'
}

export const ASPECT_RATIO_MODIFIERS: Record<string, string> = {
  LANDSCAPE: 'cinematic 16:9 aspect ratio, horizontal composition',
  PORTRAIT: 'vertical 9:16 composition, portrait orientation, mobile-optimized framing'
}

export const NEGATIVE_PROMPT = `cartoon, anime, low quality, blurry, modern clothing, anachronistic elements, watermark, text, logo, childish, cute, oversaturated, plastic looking, artificial, CGI look, video game style`

export function buildImagePrompt({
  description,
  mood,
  cameraMovement,
  aspectRatio,
  characterDescriptions = []
}: {
  description: string
  mood: string
  cameraMovement: string
  aspectRatio: string
  characterDescriptions?: string[]
}): string {
  const parts = [
    description,
    MASTER_STYLE_PROMPT,
    MOOD_MODIFIERS[mood] || MOOD_MODIFIERS.DRAMATIC,
    CAMERA_MODIFIERS[cameraMovement] || '',
    ASPECT_RATIO_MODIFIERS[aspectRatio] || ASPECT_RATIO_MODIFIERS.LANDSCAPE,
    ...characterDescriptions
  ]
  
  return parts.filter(Boolean).join(', ')
}
```

### AI Assistant System Prompt

```typescript
// lib/prompts/assistant-system.ts

export function buildAssistantSystemPrompt(projectContext: string): string {
  return `You are an AI production assistant for Pray Production Studio, helping create epic biblical videos.

You have full context of the current project:
${projectContext}

You can help the producer by:
1. Answering questions about the project
2. Making suggestions for improvements
3. Taking actions when requested

Available actions you can take (use tool calls):
- update_shot_description: Update the visual description of a shot
- update_shot_mood: Change the mood of a shot
- update_shot_camera: Change the camera movement of a shot
- update_shot_duration: Change the duration of a shot
- batch_update_prompts: Apply a style change to multiple shots (e.g., "add teal and orange color grading")
- flag_for_regeneration: Mark shots for regeneration
- reorder_shots: Change the order of shots

When the producer asks you to make changes, use the appropriate tool to make the change.
When answering questions, be concise and helpful.
When making suggestions, be specific and actionable.

Always maintain the epic, cinematic biblical style of the AI BIBLE brand.`
}
```

---

## Screen Specifications

### Screen 1: Dashboard

**Route:** `/dashboard`

**Layout:**
- Sidebar (left, 240px width)
- Main content area

**Sidebar Contents:**
- Logo at top
- Navigation:
  - Projects (active by default)
  - Character Library
  - Style Guide Settings
- User profile at bottom (avatar, name, logout)

**Main Content:**
- Header: "Projects" title + "New Project" button (accent color)
- Filter bar: Status filter (All, Draft, In Progress, Completed) + Search input
- Project grid (3 columns on desktop, responsive)

**Project Card Contents:**
- Thumbnail (first selected image or placeholder)
- Title
- Aspect ratio badge (16:9 or 9:16)
- Status badge (colored by status)
- "Last updated: [relative time]"
- Creator avatar + name

**Empty State:**
- Illustration
- "No projects yet"
- "Create your first project" button

---

### Screen 2: New Project

**Route:** `/projects/new`

**Layout:** Centered form (max-width 600px)

**Form Fields:**

1. **Title**
   - Text input
   - Placeholder: "e.g., Genesis 22 - The Binding of Isaac"
   - Required

2. **Aspect Ratio**
   - Two large clickable cards side by side:
     - 16:9 (Landscape) - with preview rectangle
     - 9:16 (Portrait) - with preview rectangle
   - Default: 16:9

3. **Script Input**
   - Tab interface: "Paste Text" | "Upload File"
   - Paste Text tab:
     - Large textarea
     - Placeholder: "Paste your script here..."
   - Upload File tab:
     - Drag-and-drop zone
     - Accepts .docx, .txt
     - Shows file name when uploaded

4. **Character Detection** (appears after script is entered)
   - "Detected Characters" label
   - List of character name chips (auto-detected by AI)
   - Each chip is clickable to link to character library
   - "+ Add Character" to manually add

**Actions:**
- "Cancel" button (outline) → returns to dashboard
- "Create Project" button (primary) → creates project, parses script, redirects to audio page

---

### Screen 3: Audio Production

**Route:** `/projects/[projectId]/audio`

**Layout:** Two-column (60/40 split)

**Left Column - Narration:**

- Section header: "Narration"
- "Skip Narration" toggle in header

- For each scene (collapsible):
  - Scene title header
  - Script text (read-only)
  - Audio controls:
    - Three option buttons: "Record" | "Text-to-Speech" | "Upload"
    - Record: Opens browser recording interface
    - TTS: Shows voice selector dropdown + "Generate" button
    - Upload: File picker
  - If audio exists:
    - Waveform visualization
    - Play/pause button
    - Duration display
    - "Enhance with AI" button (sends to ElevenLabs voice changer)
    - "Remove" button

**Right Column - Music:**

- Section header: "Background Music"
- Style selector dropdown:
  - Cinematic Orchestral
  - Ambient Tension
  - Epic Battle
  - Peaceful/Meditative
  - Dramatic Strings
  - Custom (shows text input)
- "Generate Music" button
- Generated options grid (up to 4)
  - Each shows:
    - Play button
    - Duration
    - "Select" button
- OR "Upload Custom" button

**Footer Actions:**
- "Back" button
- "Skip Audio & Continue" button (outline)
- "Continue to Shot Planning" button (primary)

---

### Screen 4: Shot Planning

**Route:** `/projects/[projectId]/shots`

**Layout:** Two-column (40/60 split)

**Left Column - Script Viewer:**
- Header: "Script" + version selector dropdown
- Scrollable script text
- Scene breaks highlighted
- Current scene highlighted as user scrolls shots

**Right Column - Shot List:**
- Header: "Shots" + shot count + "Approve All" button

- For each scene:
  - **Scene Header Card:**
    - Scene number + title
    - Location
    - Characters (avatar chips)
    - Total duration
    - Expand/collapse toggle
  
  - **Shot Cards** (within scene):
    - Shot number badge (e.g., "Shot 5")
    - Visual description (textarea, editable)
    - Three inline selectors:
      - Camera movement dropdown
      - Duration input (seconds)
      - Mood dropdown
    - "Regenerate Description" button (icon)
    - Approve checkbox

**Footer Actions:**
- "Back to Audio" button
- "Approve All & Continue" button (primary, disabled until all approved)

---

### Screen 5: Image Generation

**Route:** `/projects/[projectId]/images`

**Layout:** Full-width grid + AI Assistant panel

**Header:**
- "Image Generation" title
- Progress: "12 of 25 shots complete"
- "Generate All" button (accent)

**Main Grid:**
- 3-column grid of shot cards

**Shot Card Contents:**
- Shot number badge
- Scene label (small text)
- Description (editable textarea)
- Image grid (2x2):
  - Shows generated images
  - Empty slots show "Generate" button
  - Selected image has gold border
  - Click image to select
- Action buttons:
  - "Regenerate" dropdown:
    - This shot only
    - This shot + rest of scene
    - This shot + all following
    - Use as reference for following
  - "Edit Prompt" button (opens modal)

**Prompt Editor Modal:**
- Shot description (editable)
- Generated prompt preview (read-only, shows full prompt with style)
- Character references section (shows which characters, their images)
- "Apply & Generate" button

**AI Assistant Panel:**
- Floating button in bottom-right
- Expands to 400px wide slide-out
- Chat interface with message history
- Input field at bottom
- Can be collapsed

**Footer Actions:**
- "Back to Shots" button
- "Continue to Video" button (primary, enabled when all shots have selected image)

---

### Screen 6: Video Generation

**Route:** `/projects/[projectId]/videos`

**Layout:** Full-width grid + AI Assistant panel

**Header:**
- "Video Generation" title
- Progress: "8 of 25 clips complete"
- "Generate All Videos" button (accent)

**Main Grid:**
- 3-column grid of shot cards

**Shot Card Contents:**
- Shot number badge
- Selected image (thumbnail)
- Description (read-only)
- **Provider Selector:** Minimax | Runway (toggle buttons)
- **Motion Type Dropdown:**
  - Subtle
  - Pan Left
  - Pan Right
  - Zoom In
  - Zoom Out
  - Push In
  - Hand-held
  - Custom (shows text input)
- **Status Indicator:**
  - Pending (gray)
  - Processing (amber, with spinner)
  - Complete (green)
  - Failed (red, with retry button)
- **Video Preview:**
  - If complete: video player with play button
  - If processing: progress indicator
  - If failed: error message + "Retry" button
- **Regenerate Dropdown** (same options as images)

**Batch Actions Bar (sticky at bottom when items selected):**
- "Apply to Selected:" label
- Provider toggle
- Motion type dropdown
- "Generate Selected" button

**AI Assistant Panel:** Same as images screen

**Footer Actions:**
- "Back to Images" button
- "Continue to Assembly" button (primary, enabled when all complete)

---

### Screen 7: Assembly & Export

**Route:** `/projects/[projectId]/assembly`

**Layout:** Vertical stack

**Section 1 - Timeline:**
- Horizontal scrollable timeline
- Each clip shown as:
  - Thumbnail
  - Shot number
  - Duration bar (proportional width)
- Drag to reorder
- Click to select
- Audio tracks below (if exists):
  - Narration waveform
  - Music waveform

**Section 2 - Preview Player:**
- Large video player (16:9 or 9:16 based on project)
- Plays all clips in sequence
- Controls: Play/Pause, scrub bar, time display
- Current shot indicator

**Section 3 - Project Info:**
- Total duration
- Number of shots
- Aspect ratio
- Status

**Section 4 - Export Options:**
- **Primary:** "Export to Google Drive" button (accent)
  - Opens Google folder picker
  - Shows progress during export
  - Creates organized folder structure
- **Secondary:** "Download All" button (outline)
  - Downloads zip file
- **Tertiary:** "Download Premiere XML Only" link

**Folder Structure Created:**
```
[Project Title]/
├── project.xml
├── images/
│   ├── shot_01.png
│   ├── shot_02.png
│   └── ...
├── videos/
│   ├── shot_01.mp4
│   ├── shot_02.mp4
│   └── ...
└── audio/
    ├── narration.mp3
    └── music.mp3
```

**Footer Actions:**
- "Back to Videos" button
- "Mark as Complete" button (primary)

**AI Assistant Panel:** Available

---

### Screen 8: Character Library

**Route:** `/characters`

**Layout:** Sidebar + Main content

**Header:**
- "Character Library" title
- Character count
- "+ Add Character" button (accent)

**Search/Filter Bar:**
- Search input
- (Future: filter by variation type)

**Character Grid:**
- 4-column grid of character cards

**Character Card:**
- Primary reference image (or placeholder)
- Character name
- Variation count badge
- Click to open detail modal

**Character Detail Modal:**
- Character name (editable)
- **Variation Tabs:** Young | Adult | Old | [Custom tabs]
- For selected variation:
  - Reference images grid
  - Primary image indicator (star icon)
  - "Set as Primary" on hover
  - "Upload Image" button
  - "Delete" button per image
  - Description textarea (for prompt injection)
- "+ Add Variation" button:
  - Dropdown: Young, Adult, Old, Custom
  - Custom shows label input
- "Delete Character" button (danger)
- "Save" button

**Add Character Modal:**
- Name input
- Initial variation selector
- "Create" button

---

## API Endpoints

### Authentication

```typescript
// app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Restrict to @pray.com emails
      if (profile?.email?.endsWith('@pray.com')) {
        return true
      }
      return false
    },
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export { handler as GET, handler as POST }
```

### Projects API

```typescript
// app/api/projects/route.ts

// GET - List all projects
// POST - Create new project

// app/api/projects/[projectId]/route.ts

// GET - Get project with all relations
// PATCH - Update project
// DELETE - Delete project
```

### Script Parsing API

```typescript
// app/api/scripts/parse/route.ts

// POST - Parse script with Claude
// Body: { projectId, scriptText }
// Returns: { scenes: [...], shots: [...] }
```

### Image Generation API

```typescript
// app/api/images/generate/route.ts

// POST - Generate image for a shot
// Body: { shotId, prompt?, regenerateType? }
// Returns: { imageUrl, generationId }

// app/api/images/regenerate/route.ts

// POST - Regenerate images
// Body: { shotId, type: 'single' | 'scene' | 'forward' | 'reference' }
```

### Video Generation API

```typescript
// app/api/videos/generate/route.ts

// POST - Generate video from image
// Body: { shotId, imageId, provider, motionType }
// Returns: { generationId, status }

// app/api/videos/status/route.ts

// GET - Check video generation status
// Query: { generationId }
// Returns: { status, videoUrl?, error? }
```

### Audio API

```typescript
// app/api/audio/tts/route.ts

// POST - Generate TTS narration
// Body: { text, voiceId }
// Returns: { audioUrl }

// app/api/audio/enhance/route.ts

// POST - Enhance audio with voice changer
// Body: { audioUrl, voiceId }
// Returns: { enhancedUrl }

// app/api/audio/music/route.ts

// POST - Generate background music
// Body: { style, duration }
// Returns: { musicUrl }
```

### Assistant API

```typescript
// app/api/assistant/route.ts

// POST - Send message to assistant
// Body: { projectId, message }
// Returns: { response, actions?: [...] }
```

### Export API

```typescript
// app/api/export/premiere/route.ts

// POST - Generate Premiere XML
// Body: { projectId }
// Returns: { xmlContent }

// app/api/export/drive/route.ts

// POST - Export to Google Drive
// Body: { projectId, folderId }
// Returns: { driveUrl }
```

---

## Key Implementation Details

### Word Document Parsing

```typescript
// lib/utils/docx-parser.ts

import mammoth from 'mammoth'

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
```

### S3 Upload with Presigned URLs

```typescript
// lib/s3.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  })
  return getSignedUrl(s3Client, command, { expiresIn: 3600 })
}
```

### Premiere XML Generation

```typescript
// lib/premiere-xml.ts

export function generatePremiereXML(project: ProjectWithShots): string {
  // Generate FCP XML format that Premiere can import
  // Include:
  // - Sequence with project aspect ratio
  // - Video track with all clips
  // - Audio track(s) if narration/music exists
  // - Proper timecodes based on shot durations
}
```

### OpenAI Image Generation with References

```typescript
// lib/openai.ts

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateImage({
  prompt,
  referenceImages = [],
  aspectRatio = 'LANDSCAPE'
}: {
  prompt: string
  referenceImages?: string[]
  aspectRatio?: 'LANDSCAPE' | 'PORTRAIT'
}) {
  // Use GPT-4o with vision for image generation with references
  // This allows character consistency by including reference images
  
  const size = aspectRatio === 'LANDSCAPE' ? '1792x1024' : '1024x1792'
  
  // If reference images exist, use chat completion with image inputs
  // Otherwise, use standard DALL-E generation
}
```

---

## Seed Data

### Default Style Guide

```typescript
// prisma/seed.ts

const defaultStyleGuide = {
  name: 'AI Bible Epic Style',
  basePrompt: 'epic biblical scene, cinematic color grading, volumetric light rays, masterpiece composition, 8k masterpiece, hyperrealistic, divine light',
  negativePrompt: 'cartoon, anime, low quality, blurry, modern clothing, anachronistic elements, watermark, text, logo, childish, cute, oversaturated, plastic looking',
  isDefault: true,
}
```

---

## Deployment Steps

1. **Create Vercel Project**
   ```bash
   vercel
   ```

2. **Set up Vercel Postgres**
   - Go to Vercel Dashboard → Storage → Create Database → Postgres
   - Copy connection string to environment variables

3. **Add Environment Variables in Vercel**
   - Add all variables from `.env.local` template

4. **Set up Google OAuth**
   - Create project in Google Cloud Console
   - Enable Google Drive API
   - Create OAuth credentials
   - Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

5. **Create S3 Bucket**
   - Create bucket in AWS Console
   - Configure CORS for browser uploads
   - Create IAM user with S3 access

6. **Run Database Migration**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

7. **Deploy**
   ```bash
   vercel --prod
   ```

---

## Development Commands

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Seed database
npx prisma db seed

# Run development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@prisma/client": "5.x",
    "next-auth": "4.x",
    "@auth/prisma-adapter": "1.x",
    "openai": "4.x",
    "@anthropic-ai/sdk": "0.x",
    "@aws-sdk/client-s3": "3.x",
    "@aws-sdk/s3-request-presigner": "3.x",
    "mammoth": "1.x",
    "googleapis": "130.x",
    "lucide-react": "0.x",
    "tailwindcss": "3.x",
    "class-variance-authority": "0.x",
    "clsx": "2.x",
    "tailwind-merge": "2.x",
    "zustand": "4.x",
    "react-dropzone": "14.x",
    "react-hot-toast": "2.x",
    "@tanstack/react-query": "5.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "prisma": "5.x",
    "@types/node": "20.x",
    "@types/react": "18.x",
    "tailwindcss-animate": "1.x",
    "eslint": "8.x",
    "eslint-config-next": "14.x"
  }
}
```

---

## Notes for Claude Code

1. **Start with the foundation**: Set up Next.js, Prisma, and authentication first
2. **Use shadcn/ui components**: Run `npx shadcn-ui@latest init` and add components as needed
3. **Environment variables**: The developer will add these in Vercel dashboard
4. **File uploads**: Use presigned URLs for direct browser-to-S3 uploads
5. **API polling**: For video generation, implement polling for status checks
6. **Error handling**: Wrap all API calls in try-catch, show toast notifications
7. **Loading states**: Add skeleton loaders for all async operations
8. **Mobile responsive**: Sidebar collapses on mobile, grids become single column

---

This specification document contains everything needed to build Pray Production Studio. The developer should be able to copy this into Claude Code and begin implementation immediately.
