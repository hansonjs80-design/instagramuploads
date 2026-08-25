import "server-only";

import type { TranscriptSegment } from "@/services/source-analysis/types";

type TranscriptionPayload = {
  text?: string;
  language?: string;
  segments?: Array<{ id?: number; start?: number; end?: number; text?: string }>;
  error?: { message?: string };
};

export async function transcribeMedia(file: File): Promise<{ text: string; language: string; segments: TranscriptSegment[] }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY가 없어 업로드한 미디어를 전사할 수 없습니다.");
  const maxBytes = Number(process.env.SOURCE_MEDIA_MAX_BYTES || 25 * 1024 * 1024);
  if (file.size > maxBytes) throw new Error(`업로드 파일이 전사 제한(${Math.round(maxBytes / 1024 / 1024)}MB)을 초과했습니다.`);

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("model", process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-transcribe");
  form.set("response_format", "verbose_json");
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(180_000),
  });
  const payload = await response.json() as TranscriptionPayload;
  if (!response.ok) throw new Error(payload.error?.message || `미디어 전사 요청 실패 (${response.status})`);
  const text = payload.text?.trim() || "";
  if (!text) throw new Error("전사 결과가 비어 있습니다.");
  const language = payload.language || "unknown";
  const segments = (payload.segments?.length ? payload.segments : [{ id: 0, start: 0, end: 0, text }]).map((segment, index) => ({
    id: `transcript-${segment.id ?? index}`,
    startSeconds: segment.start ?? 0,
    endSeconds: segment.end ?? 0,
    text: segment.text?.trim() || "",
    language,
    confidence: 90,
  })).filter((segment) => segment.text);
  return { text, language, segments };
}
