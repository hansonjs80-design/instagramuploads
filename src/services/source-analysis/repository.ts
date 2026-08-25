import "server-only";

import { randomUUID } from "node:crypto";
import { getDatabase, type AppDatabase } from "@/lib/db/client";
import type { ContentClassification, SourceAnalysis } from "@/services/source-analysis/types";

type AnalysisRow = {
  id: string; content_id: string | null; source_url: string; normalized_url: string; platform: SourceAnalysis["platform"];
  source_platform: SourceAnalysis["sourcePlatform"]; platform_content_id: string; source_revision: string; cache_key: string;
  analysis_mode: SourceAnalysis["mode"]; provider: string; status: SourceAnalysis["status"]; error_code: string | null;
  user_message: string; metadata_json: string; availability_json: string; evidence_level: SourceAnalysis["evidenceLevel"];
  quality: SourceAnalysis["quality"]; confidence: number; source_language: string; available_text: string; created_at: string; updated_at: string;
};

export async function getCachedAnalysis(normalizedUrl: string, mode: SourceAnalysis["mode"]): Promise<SourceAnalysis | null> {
  const db = await getDatabase();
  const row = await db.get<{ id: string }>("SELECT id FROM source_analyses WHERE normalized_url = ? AND analysis_mode = ? ORDER BY updated_at DESC LIMIT 1", [normalizedUrl, mode]);
  return row ? getSourceAnalysis(row.id, db) : null;
}

export async function getSourceAnalysis(id: string, database?: AppDatabase): Promise<SourceAnalysis | null> {
  const db = database ?? await getDatabase();
  const row = await db.get<AnalysisRow>("SELECT * FROM source_analyses WHERE id = ?", [id]);
  if (!row) return null;
  const [evidence, transcript, frames, claims, classificationRow] = await Promise.all([
    db.all<Record<string, string | number>>("SELECT id, evidence_type, locator, excerpt, confidence FROM source_evidence WHERE analysis_id = ? ORDER BY created_at", [id]),
    db.all<Record<string, string | number>>("SELECT id, start_seconds, end_seconds, segment_text, language, confidence FROM transcript_segments WHERE analysis_id = ? ORDER BY start_seconds", [id]),
    db.all<Record<string, string | number>>("SELECT id, timestamp_seconds, local_path, observation, confidence FROM video_frames WHERE analysis_id = ? ORDER BY timestamp_seconds", [id]),
    db.all<Record<string, string | number | null>>("SELECT id, claim_text, evidence_type, evidence_ids_json, timestamp_seconds, frame_id, confidence, source_language, claim_status FROM content_claims WHERE analysis_id = ? ORDER BY created_at", [id]),
    db.get<{ classification_json: string }>("SELECT classification_json FROM content_classifications WHERE analysis_id = ?", [id]),
  ]);
  if (!classificationRow) return null;
  return {
    id: row.id, contentId: row.content_id, sourceUrl: row.source_url, normalizedUrl: row.normalized_url,
    platform: row.platform, sourcePlatform: row.source_platform, platformContentId: row.platform_content_id,
    sourceRevision: row.source_revision, cacheKey: row.cache_key, mode: row.analysis_mode, provider: row.provider,
    status: row.status, errorCode: row.error_code, userMessage: row.user_message,
    metadata: JSON.parse(row.metadata_json), availability: JSON.parse(row.availability_json), evidenceLevel: row.evidence_level,
    quality: row.quality, confidence: row.confidence, sourceLanguage: row.source_language, availableText: row.available_text,
    evidence: evidence.map((item) => ({ id: String(item.id), type: item.evidence_type as SourceAnalysis["evidence"][number]["type"], locator: String(item.locator), excerpt: String(item.excerpt), confidence: Number(item.confidence) })),
    transcript: transcript.map((item) => ({ id: String(item.id), startSeconds: Number(item.start_seconds), endSeconds: Number(item.end_seconds), text: String(item.segment_text), language: String(item.language), confidence: Number(item.confidence) })),
    frames: frames.map((item) => ({ id: String(item.id), timestampSeconds: Number(item.timestamp_seconds), localPath: String(item.local_path), observation: String(item.observation), confidence: Number(item.confidence) })),
    claims: claims.map((item) => ({ id: String(item.id), claim: String(item.claim_text), evidenceType: item.evidence_type as SourceAnalysis["claims"][number]["evidenceType"], evidenceIds: JSON.parse(String(item.evidence_ids_json)), timestampSeconds: item.timestamp_seconds === null ? null : Number(item.timestamp_seconds), frameId: item.frame_id ? String(item.frame_id) : null, confidence: Number(item.confidence), sourceLanguage: String(item.source_language), status: item.claim_status as SourceAnalysis["claims"][number]["status"] })),
    classification: JSON.parse(classificationRow.classification_json), createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function getSourceAnalysisForContent(contentId: string, database?: AppDatabase): Promise<SourceAnalysis | null> {
  const db = database ?? await getDatabase();
  const row = await db.get<{ id: string }>("SELECT id FROM source_analyses WHERE content_id = ?", [contentId]);
  return row ? getSourceAnalysis(row.id, db) : null;
}

export async function saveSourceAnalysis(analysis: SourceAnalysis): Promise<SourceAnalysis> {
  const db = await getDatabase();
  const existing = await db.get<{ id: string; content_id: string | null; created_at: string }>("SELECT id, content_id, created_at FROM source_analyses WHERE cache_key = ?", [analysis.cacheKey]);
  const id = existing?.id ?? analysis.id;
  const createdAt = existing?.created_at ?? analysis.createdAt;
  await db.transaction(async (transaction) => {
    await transaction.run(`INSERT INTO source_analyses (id, content_id, source_url, normalized_url, platform, source_platform, platform_content_id, source_revision, cache_key, analysis_mode, provider, status, error_code, user_message, metadata_json, availability_json, evidence_level, quality, confidence, source_language, available_text, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET source_url=excluded.source_url, provider=excluded.provider, status=excluded.status, error_code=excluded.error_code, user_message=excluded.user_message, metadata_json=excluded.metadata_json, availability_json=excluded.availability_json, evidence_level=excluded.evidence_level, quality=excluded.quality, confidence=excluded.confidence, source_language=excluded.source_language, available_text=excluded.available_text, updated_at=excluded.updated_at`,
      [id, existing?.content_id ?? analysis.contentId, analysis.sourceUrl, analysis.normalizedUrl, analysis.platform, analysis.sourcePlatform, analysis.platformContentId, analysis.sourceRevision, analysis.cacheKey, analysis.mode, analysis.provider, analysis.status, analysis.errorCode, analysis.userMessage, JSON.stringify(analysis.metadata), JSON.stringify(analysis.availability), analysis.evidenceLevel, analysis.quality, analysis.confidence, analysis.sourceLanguage, analysis.availableText, createdAt, analysis.updatedAt]);
    for (const table of ["source_evidence", "transcript_segments", "video_frames", "content_claims", "content_classifications"] as const) {
      await transaction.run(`DELETE FROM ${table} WHERE analysis_id = ?`, [id]);
    }
    for (const item of analysis.evidence) await transaction.run("INSERT INTO source_evidence (id, analysis_id, evidence_type, locator, excerpt, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [item.id, id, item.type, item.locator, item.excerpt, item.confidence, analysis.updatedAt]);
    for (const item of analysis.transcript) await transaction.run("INSERT INTO transcript_segments (id, analysis_id, start_seconds, end_seconds, segment_text, language, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [item.id, id, item.startSeconds, item.endSeconds, item.text, item.language, item.confidence, analysis.updatedAt]);
    for (const item of analysis.frames) await transaction.run("INSERT INTO video_frames (id, analysis_id, timestamp_seconds, local_path, observation, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [item.id, id, item.timestampSeconds, item.localPath, item.observation, item.confidence, analysis.updatedAt]);
    for (const item of analysis.claims) await transaction.run("INSERT INTO content_claims (id, analysis_id, claim_text, evidence_type, evidence_ids_json, timestamp_seconds, frame_id, confidence, source_language, claim_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [item.id, id, item.claim, item.evidenceType, JSON.stringify(item.evidenceIds), item.timestampSeconds, item.frameId, item.confidence, item.sourceLanguage, item.status, analysis.updatedAt, analysis.updatedAt]);
    await transaction.run("INSERT INTO content_classifications (id, analysis_id, classification_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [randomUUID(), id, JSON.stringify(analysis.classification), analysis.updatedAt, analysis.updatedAt]);
  });
  return (await getSourceAnalysis(id))!;
}

export async function updateSourceClassification(id: string, classification: ContentClassification): Promise<SourceAnalysis> {
  const db = await getDatabase();
  const current = await getSourceAnalysis(id, db);
  if (!current) throw new Error("분석 결과를 찾을 수 없습니다.");
  const now = new Date().toISOString();
  await db.transaction(async (transaction) => {
    await transaction.run("INSERT INTO classification_overrides (id, analysis_id, field_path, previous_value_json, next_value_json, action, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [randomUUID(), id, "classification", JSON.stringify(current.classification), JSON.stringify(classification), "USER_EDIT", now]);
    await transaction.run("UPDATE content_classifications SET classification_json = ?, updated_at = ? WHERE analysis_id = ?", [JSON.stringify(classification), now, id]);
    await transaction.run("UPDATE source_analyses SET updated_at = ? WHERE id = ?", [now, id]);
  });
  return (await getSourceAnalysis(id))!;
}

export async function attachAnalysisToContent(analysisId: string, contentId: string, database?: AppDatabase): Promise<void> {
  const db = database ?? await getDatabase();
  const result = await db.run("UPDATE source_analyses SET content_id = ?, updated_at = ? WHERE id = ?", [contentId, new Date().toISOString(), analysisId]);
  if (!result.changes) throw new Error("연결할 분석 결과를 찾을 수 없습니다.");
}
