import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type MIMECategory =
  | "image"
  | "audio"
  | "pdf"
  | "doc"
  | "docx"
  | "video"
  | "other";

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "bmp",
  "heic",
  "heif",
]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac"]);
const VIDEO_EXTS = new Set([
  "mp4",
  "webm",
  "mov",
  "avi",
  "mkv",
  "mpeg",
  "mpg",
  "ogv",
  "wmv",
]);
const PDF_EXTS = new Set(["pdf"]);
const DOC_EXT_DOC = "doc";
const DOC_EXT_DOCX = "docx";

function normalize_token(t: string): string {
  return t.split(";")[0].trim().toLowerCase();
}

export function compute_mime_type(
  accept: string | null | undefined,
): MIMECategory {
  if (!accept) {
    return "other";
  }

  const tokens = accept.split(",").map(normalize_token).filter(Boolean);

  let saw_audio = false;
  let saw_video = false;

  for (const t of tokens) {
    if (t.startsWith(".")) {
      const ext = t.slice(1);
      if (IMAGE_EXTS.has(ext)) {
        return "image";
      }
      if (AUDIO_EXTS.has(ext)) {
        saw_audio = true;
      }
      if (VIDEO_EXTS.has(ext)) {
        saw_video = true;
      }
      if (PDF_EXTS.has(ext)) {
        return "pdf";
      }
      if (ext === DOC_EXT_DOCX) {
        return "docx";
      }
      if (ext === DOC_EXT_DOC) {
        return "doc";
      }
      continue;
    }

    if (!t.includes("/")) {
      if (IMAGE_EXTS.has(t)) {
        return "image";
      }
      if (AUDIO_EXTS.has(t)) {
        saw_audio = true;
      }
      if (VIDEO_EXTS.has(t)) {
        saw_video = true;
      }
      if (PDF_EXTS.has(t)) {
        return "pdf";
      }
      if (t === DOC_EXT_DOCX) {
        return "docx";
      }
      if (t === DOC_EXT_DOC) {
        return "doc";
      }
      continue;
    }

    if (t.startsWith("image/")) {
      return "image";
    }
    if (t.startsWith("audio/")) {
      saw_audio = true;
    }
    if (t.startsWith("video/")) {
      saw_video = true;
    }
    if (t.includes("pdf")) {
      return "pdf";
    }

    if (
      t.includes(
        "vnd.openxmlformats-officedocument.wordprocessingml.document",
      ) ||
      t.includes("wordprocessingml") ||
      t.includes("openxml")
    ) {
      return "docx";
    }

    if (t.includes("msword")) {
      return "doc";
    }

    if (t.includes("word")) {
      return "doc";
    }
  }

  if (saw_video) {
    return "video";
  }
  if (saw_audio) {
    return "audio";
  }
  return "other";
}
