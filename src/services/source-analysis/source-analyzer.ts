import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { transcribeMedia } from "@/services/ai/transcription";
import { classifyContent, mergeClassification } from "@/services/source-analysis/classification-engine";
import { InstagramAnalyzer } from "@/services/source-analysis/instagram-analyzer";
import { detectSource } from "@/services/source-analysis/platform-detector";
import { getCachedAnalysis, saveSourceAnalysis } from "@/services/source-analysis/repository";
import type { AnalyzeSourceInput, ContentClaim, SourceAnalysis, SourceAnalysisProvider, SourceEvidence } from "@/services/source-analysis/types";
import { YoutubeAnalyzer } from "@/services/source-analysis/youtube-analyzer";

export async function analyzeSource(input: AnalyzeSourceInput, providerOverride?: SourceAnalysisProvider): Promise<SourceAnalysis> {
  const detected = detectSource(input.sourceUrl);
  if (!input.force) {
    const cached = await getCachedAnalysis(detected.normalizedUrl, input.mode);
    if (cached && !input.script?.trim() && !input.caption?.trim() && !input.note?.trim() && !input.mediaFile) return cached;
  }
  const provider = providerOverride ?? (detected.platform === "youtube" ? new YoutubeAnalyzer() : new InstagramAnalyzer());
  const providerResult = await provider.analyze(input);
  const evidence: SourceEvidence[] = [];
  addEvidence(evidence, "METADATA", "title", providerResult.metadata.title, providerResult.availability.metadata === "AVAILABLE" ? 90 : 55);
  addEvidence(evidence, "DESCRIPTION", "description", providerResult.metadata.description, 82);
  addEvidence(evidence, "USER_SCRIPT", "user-script", input.script, 98);
  addEvidence(evidence, "TRANSCRIPT", "user-caption", input.caption, 98);
  addEvidence(evidence, "USER_NOTE", "user-note", input.note, 90);

  let transcript: SourceAnalysis["transcript"] = [];
  let transcriptText = "";
  let sourceLanguage = providerResult.metadata.audioLanguage || providerResult.metadata.defaultLanguage || detectLanguage([input.script, input.caption, providerResult.metadata.description].filter(Boolean).join(" "));
  const availability = { ...providerResult.availability };
  let mediaMessage = "";
  if (input.mediaFile && input.mode !== "FAST") {
    try {
      const result = await transcribeMedia(input.mediaFile);
      transcript = result.segments;
      transcriptText = result.text;
      sourceLanguage = result.language;
      availability.transcript = "AVAILABLE";
      addEvidence(evidence, "TRANSCRIPT", "uploaded-media", transcriptText, 92);
      mediaMessage = " 업로드한 미디어의 음성을 전사해 분석 정확도를 높였습니다.";
    } catch (error) {
      availability.transcript = "UNAVAILABLE";
      mediaMessage = ` 미디어 전사는 완료하지 못했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`;
    }
    availability.frames = "UNAVAILABLE";
  }

  const directText = [input.script, input.caption, transcriptText].filter((item) => item?.trim()).join("\n\n");
  const availableText = [directText, providerResult.metadata.title, providerResult.metadata.description, providerResult.metadata.tags.join(" "), input.note].filter((item) => item?.trim()).join("\n\n");
  const frames: SourceAnalysis["frames"] = [];
  const evidenceLevel = levelFor(Boolean(directText), frames.length > 0, providerResult.availability.metadata);
  const quality = evidenceLevel === "A" || evidenceLevel === "B" ? "HIGH" : evidenceLevel === "C" || evidenceLevel === "D" ? "MEDIUM" : "LIMITED";
  const confidence = ({ A: 94, B: 86, C: 76, D: providerResult.availability.metadata === "AVAILABLE" ? 66 : 55, E: 35 } as const)[evidenceLevel];
  const claims = claimsFromDirectText(directText, evidence, sourceLanguage);
  const classification = classifyContent(availableText, evidence);
  const now = new Date().toISOString();
  const cacheKey = createHash("sha256").update(`${providerResult.normalizedUrl}|${providerResult.sourceRevision}|${input.mode}|${createHash("sha1").update(directText).digest("hex")}`).digest("hex");
  const previous = input.force ? await getCachedAnalysis(providerResult.normalizedUrl, input.mode) : null;
  const analysis: SourceAnalysis = {
    id: randomUUID(), contentId: null, sourceUrl: input.sourceUrl, normalizedUrl: providerResult.normalizedUrl,
    platform: providerResult.platform, sourcePlatform: providerResult.sourcePlatform, platformContentId: providerResult.platformContentId,
    sourceRevision: providerResult.sourceRevision, cacheKey, mode: input.mode, provider: providerResult.provider,
    status: evidenceLevel === "E" ? "PARTIAL" : "COMPLETE", errorCode: providerResult.errorCode,
    userMessage: `${providerResult.userMessage}${mediaMessage}`.trim(), metadata: providerResult.metadata, availability,
    evidenceLevel, quality, confidence, sourceLanguage, availableText, evidence, transcript, frames, claims,
    classification: previous ? mergeClassification(previous.classification, classification) : classification,
    createdAt: now, updatedAt: now,
  };
  return saveSourceAnalysis(analysis);
}

function addEvidence(list: SourceEvidence[], type: SourceEvidence["type"], locator: string, raw: string | undefined, confidence: number) {
  const excerpt = raw?.trim();
  if (!excerpt) return;
  list.push({ id: randomUUID(), type, locator, excerpt: excerpt.slice(0, 1800), confidence });
}
function levelFor(transcript: boolean, frames: boolean, metadata: "AVAILABLE" | "MINIMAL" | "UNAVAILABLE"): SourceAnalysis["evidenceLevel"] {
  if (transcript && frames) return "A";
  if (transcript) return "B";
  if (frames) return "C";
  if (metadata === "AVAILABLE" || metadata === "MINIMAL") return "D";
  return "E";
}
function detectLanguage(text: string) { return /[가-힣]/.test(text) ? "ko" : text.trim() ? "en" : "unknown"; }
function claimsFromDirectText(text: string, evidence: SourceEvidence[], language: string): ContentClaim[] {
  if (!text.trim()) return [];
  const directEvidence = evidence.filter((item) => ["USER_SCRIPT", "TRANSCRIPT"].includes(item.type));
  return text.split(/(?<=[.!?。])\s+|\n+/).map((item) => item.trim()).filter((item) => item.length >= 20).slice(0, 8).map((claim) => ({
    id: randomUUID(), claim: claim.slice(0, 500), evidenceType: directEvidence[0]?.type ?? "TRANSCRIPT",
    evidenceIds: directEvidence.map((item) => item.id), timestampSeconds: null, frameId: null, confidence: 82,
    sourceLanguage: language, status: "EXTRACTED" as const,
  }));
}
