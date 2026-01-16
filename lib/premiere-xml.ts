/**
 * Premiere Pro XML (FCP XML) generation for project export
 */

import type { Shot, VideoGeneration, ImageGeneration } from "@prisma/client"

// Use serialized types where Decimal is converted to number for client components
type SerializedShot = Omit<Shot, "duration"> & { duration: number }
type ShotWithMedia = SerializedShot & {
  images: ImageGeneration[]
  videos: VideoGeneration[]
}

interface ProjectData {
  id: string
  title: string
  aspectRatio: "LANDSCAPE" | "PORTRAIT"
  shots: ShotWithMedia[]
  narrationUrl?: string | null
  musicUrl?: string | null
}

/**
 * Generate Premiere Pro compatible FCP XML
 */
export function generatePremiereXML(project: ProjectData): string {
  const { title, aspectRatio, shots, narrationUrl, musicUrl } = project

  // Calculate dimensions based on aspect ratio
  const width = aspectRatio === "LANDSCAPE" ? 1920 : 1080
  const height = aspectRatio === "LANDSCAPE" ? 1080 : 1920
  const frameRate = 30

  // Calculate total duration in frames
  const totalFrames = shots.reduce(
    (sum, shot) => sum + Math.round(Number(shot.duration) * frameRate),
    0
  )

  // Generate clip entries
  const clipEntries = shots
    .map((shot, index) => {
      const selectedVideo = shot.videos.find((v) => v.selected)
      const selectedImage = shot.images.find((i) => i.selected)
      const mediaUrl = selectedVideo?.videoUrl || selectedImage?.imageUrl
      const isVideo = !!selectedVideo?.videoUrl

      const startFrame = shots
        .slice(0, index)
        .reduce((sum, s) => sum + Math.round(Number(s.duration) * frameRate), 0)
      const durationFrames = Math.round(Number(shot.duration) * frameRate)

      if (!mediaUrl) return ""

      return `
        <clipitem id="shot_${shot.shotIndex + 1}">
          <name>Shot ${shot.shotIndex + 1}</name>
          <duration>${durationFrames}</duration>
          <rate>
            <timebase>${frameRate}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <start>${startFrame}</start>
          <end>${startFrame + durationFrames}</end>
          <in>0</in>
          <out>${durationFrames}</out>
          <file id="file_shot_${shot.shotIndex + 1}">
            <name>shot_${String(shot.shotIndex + 1).padStart(2, "0")}.${isVideo ? "mp4" : "png"}</name>
            <pathurl>file://./videos/shot_${String(shot.shotIndex + 1).padStart(2, "0")}.${isVideo ? "mp4" : "png"}</pathurl>
            <rate>
              <timebase>${frameRate}</timebase>
              <ntsc>FALSE</ntsc>
            </rate>
            <duration>${durationFrames}</duration>
            <media>
              <video>
                <samplecharacteristics>
                  <width>${width}</width>
                  <height>${height}</height>
                </samplecharacteristics>
              </video>
            </media>
          </file>
        </clipitem>`
    })
    .join("\n")

  // Generate audio tracks
  let audioTracks = ""

  if (narrationUrl) {
    audioTracks += `
      <track>
        <clipitem id="narration">
          <name>Narration</name>
          <duration>${totalFrames}</duration>
          <rate>
            <timebase>${frameRate}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <start>0</start>
          <end>${totalFrames}</end>
          <in>0</in>
          <out>${totalFrames}</out>
          <file id="file_narration">
            <name>narration.mp3</name>
            <pathurl>file://./audio/narration.mp3</pathurl>
            <media>
              <audio>
                <channelcount>2</channelcount>
              </audio>
            </media>
          </file>
        </clipitem>
      </track>`
  }

  if (musicUrl) {
    audioTracks += `
      <track>
        <clipitem id="music">
          <name>Music</name>
          <duration>${totalFrames}</duration>
          <rate>
            <timebase>${frameRate}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <start>0</start>
          <end>${totalFrames}</end>
          <in>0</in>
          <out>${totalFrames}</out>
          <file id="file_music">
            <name>music.mp3</name>
            <pathurl>file://./audio/music.mp3</pathurl>
            <media>
              <audio>
                <channelcount>2</channelcount>
              </audio>
            </media>
          </file>
        </clipitem>
      </track>`
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${escapeXml(title)}</name>
    <children>
      <sequence id="main_sequence">
        <name>${escapeXml(title)}</name>
        <duration>${totalFrames}</duration>
        <rate>
          <timebase>${frameRate}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <timecode>
          <rate>
            <timebase>${frameRate}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <string>00:00:00:00</string>
          <frame>0</frame>
          <displayformat>NDF</displayformat>
        </timecode>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${width}</width>
                <height>${height}</height>
                <anamorphic>FALSE</anamorphic>
                <pixelaspectratio>square</pixelaspectratio>
                <fielddominance>none</fielddominance>
                <rate>
                  <timebase>${frameRate}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
              </samplecharacteristics>
            </format>
            <track>
              ${clipEntries}
            </track>
          </video>
          <audio>
            <numOutputChannels>2</numOutputChannels>
            <format>
              <samplecharacteristics>
                <depth>16</depth>
                <samplerate>48000</samplerate>
              </samplecharacteristics>
            </format>
            ${audioTracks}
          </audio>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`

  return xml
}

/**
 * Escape special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Generate a simple EDL (Edit Decision List) as an alternative
 */
export function generateEDL(project: ProjectData): string {
  const { title, shots } = project
  const frameRate = 30

  let edl = `TITLE: ${title}\nFCM: NON-DROP FRAME\n\n`

  let currentFrame = 0

  shots.forEach((shot, index) => {
    const durationFrames = Math.round(Number(shot.duration) * frameRate)
    const startTC = framesToTimecode(currentFrame, frameRate)
    const endTC = framesToTimecode(currentFrame + durationFrames, frameRate)

    edl += `${String(index + 1).padStart(3, "0")}  001      V     C        `
    edl += `${startTC} ${endTC} ${startTC} ${endTC}\n`
    edl += `* FROM CLIP NAME: shot_${String(shot.shotIndex + 1).padStart(2, "0")}.mp4\n\n`

    currentFrame += durationFrames
  })

  return edl
}

/**
 * Convert frame count to timecode string
 */
function framesToTimecode(frames: number, frameRate: number): string {
  const totalSeconds = Math.floor(frames / frameRate)
  const remainingFrames = frames % frameRate

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(remainingFrames).padStart(2, "0")}`
}
