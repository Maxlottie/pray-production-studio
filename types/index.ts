import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
  }
}

// Re-export Prisma types for convenience
export type {
  Project,
  Script,
  Scene,
  Shot,
  ImageGeneration,
  VideoGeneration,
  ProjectAudio,
  Character,
  CharacterVariation,
  CharacterReferenceImage,
  StyleGuide,
  AssistantConversation,
  User,
} from "@prisma/client"

export type {
  AspectRatio,
  ProjectStatus,
  ScriptStatus,
  CameraMovement,
  ShotMood,
  ShotStatus,
  VideoProvider,
  MotionType,
  VideoStatus,
  NarrationSource,
  MusicSource,
  VariationType,
} from "@prisma/client"
