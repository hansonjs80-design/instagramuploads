import "server-only";

import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { detectPlatform } from "@/lib/content/validation";
import type {
  BlogPost,
  BrandProfile,
  ContentAnalysis,
  ContentItem,
  ContentLocalization,
  ContentStatus,
  ContentSummary,
  ContentTag,
  ContentVersion,
  CreativeBrief,
  CreateContentInput,
  GeneratedBundle,
  InstagramCarousel,
  InstagramEnginePlan,
  InstagramOutputData,
  ImageAsset,
  NaverOutputData,
  NaverEditorSection,
  Platform,
  OutputMode,
  OutputDataMap,
  OutputType,
  TagCategory,
  TemplateKey,
} from "@/lib/content/types";
import { attachAnalysisToContent, getSourceAnalysisForContent } from "@/services/source-analysis/repository";

type ContentRow = {
  id: string;
  expert_name: string;
  platform: Platform;
  original_title: string;
  source_url: string;
  original_script: string;
  template_key: TemplateKey;
  output_mode: OutputMode;
  selected_outputs_json: string;
  experience_note: string;
  registered_at: string;
  status: ContentStatus;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type AnalysisRow = {
  key_claims_json: string;
  biomechanics_principles_json: string;
  clinical_interpretation: string;
  easy_explanation: string;
  practical_application_json: string;
  exercise_ideas_json: string;
  precautions_json: string;
  model: string;
};

type InstagramRow = { cards_json: string; width: number; height: number };
type InstagramEngineRow = { engine_json: string };
type BlogRow = {
  title: string;
  hook: string;
  who_this_is_for: string;
  problem_explanation: string;
  expert_concept: string;
  easy_explanation: string;
  clinical_interpretation: string;
  applications_json: string;
  precautions_json: string;
  summary: string;
  source_text: string;
  related_content_cta: string;
  naver_seo_json: string;
  markdown: string;
};
type CreativeRow = {
  hooks_json: string;
  content_angles_json: string;
  metaphors_json: string;
  empathy_lines_json: string;
  humor_lines_json: string;
  image_briefs_json: string;
  hashtags_json: string;
  template_key: TemplateKey;
};
type BrandRow = {
  brand_name: string;
  tagline: string;
  audience: string;
  tone_of_voice: string;
  humor_level: number;
  expertise_level: string;
  visual_style: string;
  brand_colors_json: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  logo_data_url: string;
  watermark_enabled: number;
  cta_style: string;
  signature_cta: string;
  source_citation_style: string;
  recurring_phrases_json: string;
  recurring_content_blocks_json: string;
  hashtag_groups_json: string;
  card_template: TemplateKey;
  blog_template: string;
  image_style_rules_json: string;
  category_badge_colors_json: string;
  instagram_settings_json: string;
  updated_at: string;
};

function json<T>(value: string): T {
  return JSON.parse(value) as T;
}

function blogSections(blog: BlogPost): NaverEditorSection[] {
  return [
    ["hook", "Hook", blog.hook], ["who", "이런 분께 도움이 돼요", blog.whoThisIsFor.map((item) => `• ${item}`).join("\n")],
    ["problem", "왜 이런 불편감이 생길까요?", blog.problemExplanation], ["expert", "SOURCE CLAIM · 전문가 핵심 개념", blog.expertConcept],
    ["easy", "쉽게 말하면", blog.easyExplanation], ["interpretation", "INTERPRETATION · 움직임노트 해석", blog.clinicalInterpretation],
    ["application", "APPLICATION · 실제 적용", blog.applications.map((item) => `• ${item}`).join("\n")],
    ["precautions", "흔한 실수 / 주의점", blog.precautions.map((item) => `• ${item}`).join("\n")],
    ["summary", "움직임노트 | 한 줄 정리", blog.summary], ["source", "참고 콘텐츠", blog.sourceText],
    ["related", "같이 읽으면 이해가 더 쉬워요", blog.relatedContentCta],
  ].map(([id, title, content]) => ({ id, title, content, locked: false }));
}

function getTags(contentId: string): ContentTag[] {
  return getDatabase()
    .prepare(
      `SELECT tags.id, tags.name, tags.category
       FROM tags
       INNER JOIN content_tags ON content_tags.tag_id = tags.id
       WHERE content_tags.content_id = ?
       ORDER BY tags.category, tags.name`,
    )
    .all(contentId) as ContentTag[];
}

function mapRow(
  row: ContentRow,
): Omit<ContentItem, "tags" | "analysis" | "instagram" | "blog" | "creative" | "instagramEngine" | "instagramEn" | "generatedOutputTypes" | "sourceAnalysis" | "localizations"> {
  return {
    id: row.id,
    expertName: row.expert_name,
    platform: row.platform,
    originalTitle: row.original_title,
    sourceUrl: row.source_url,
    originalScript: row.original_script,
    templateKey: row.template_key,
    outputMode: row.output_mode,
    selectedOutputTypes: json<OutputType[]>(row.selected_outputs_json),
    experienceNote: row.experience_note,
    registeredAt: row.registered_at,
    status: row.status,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createContent(input: CreateContentInput): ContentItem {
  const db = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  const platform = detectPlatform(input.sourceUrl);

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `INSERT INTO content_items
       (id, expert_name, platform, original_title, source_url, original_script,
        template_key, output_mode, selected_outputs_json, experience_note, registered_at, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    ).run(
      id,
      input.expertName,
      platform,
      input.originalTitle,
      input.sourceUrl,
      input.originalScript,
      input.templateKey,
      input.outputMode,
      JSON.stringify(input.selectedOutputTypes),
      input.experienceNote,
      now,
      now,
      now,
    );

    attachTags(id, input.tags);
    if (input.sourceAnalysisId) attachAnalysisToContent(input.sourceAnalysisId, id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getContentById(id)!;
}

export function getNaverEditor(contentId: string): {
  sections: NaverEditorSection[];
  selectedTitle: string;
  selectedHook: string;
  images: ImageAsset[];
} | null {
  const db = getDatabase();
  const row = db.prepare("SELECT editor_json, selected_title, selected_hook FROM blog_posts WHERE content_id = ?").get(contentId) as { editor_json: string; selected_title: string; selected_hook: string } | undefined;
  if (!row) return null;
  const saved = json<{ sections?: NaverEditorSection[] }>(row.editor_json || "{}");
  const images = db.prepare("SELECT id, image_type, purpose, position_index, caption, alt_description, image_prompt, brand_style, image_data_url, width, height, status FROM image_assets WHERE content_id = ? AND platform = 'naver' ORDER BY position_index").all(contentId) as Array<Record<string, string | number>>;
  return {
    sections: saved.sections ?? [], selectedTitle: row.selected_title, selectedHook: row.selected_hook,
    images: images.map((image) => ({ id: String(image.id), imageType: String(image.image_type), purpose: String(image.purpose), positionIndex: Number(image.position_index), caption: String(image.caption), altDescription: String(image.alt_description), imagePrompt: String(image.image_prompt), brandStyle: String(image.brand_style), imageDataUrl: String(image.image_data_url), width: Number(image.width), height: Number(image.height), status: String(image.status) })),
  };
}

export function saveNaverEditor(contentId: string, editor: { sections: NaverEditorSection[]; selectedTitle: string; selectedHook: string }, versionSummary?: string): void {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    if (versionSummary) {
      const current = db.prepare("SELECT editor_json, selected_title, selected_hook FROM blog_posts WHERE content_id = ?").get(contentId) as { editor_json: string; selected_title: string; selected_hook: string };
      const number = (db.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS number FROM content_versions WHERE content_id = ?").get(contentId) as { number: number }).number;
      db.prepare("INSERT INTO content_versions (id, content_id, version_number, snapshot_json, change_summary, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(randomUUID(), contentId, number, JSON.stringify({ ...json(current.editor_json), selectedTitle: current.selected_title, selectedHook: current.selected_hook }), versionSummary, new Date().toISOString());
    }
    db.prepare("UPDATE blog_posts SET editor_json = ?, selected_title = ?, selected_hook = ?, updated_at = ? WHERE content_id = ?")
      .run(JSON.stringify(editor), editor.selectedTitle, editor.selectedHook, new Date().toISOString(), contentId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function listContentVersions(contentId: string): ContentVersion[] {
  const rows = getDatabase().prepare("SELECT * FROM content_versions WHERE content_id = ? ORDER BY version_number DESC").all(contentId) as Array<{ id: string; version_number: number; snapshot_json: string; change_summary: string; created_at: string }>;
  return rows.map((row) => ({ id: row.id, versionNumber: row.version_number, snapshot: json(row.snapshot_json), changeSummary: row.change_summary, createdAt: row.created_at }));
}

function attachTags(contentId: string, tags: ContentTag[]): void {
  const db = getDatabase();
  const insertTag = db.prepare(
    `INSERT INTO tags (name, normalized_name, category)
     VALUES (?, ?, ?)
     ON CONFLICT(normalized_name, category) DO UPDATE SET name = excluded.name`,
  );
  const findTag = db.prepare(
    "SELECT id FROM tags WHERE normalized_name = ? AND category = ?",
  );
  const connect = db.prepare(
    "INSERT OR IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)",
  );

  for (const tag of tags) {
    const normalized = tag.name.trim().toLocaleLowerCase();
    if (!normalized) continue;
    insertTag.run(tag.name.trim(), normalized, tag.category);
    const row = findTag.get(normalized, tag.category) as { id: number };
    connect.run(contentId, row.id);
  }
}

export function getContentById(id: string): ContentItem | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM content_items WHERE id = ?").get(id) as
    | ContentRow
    | undefined;
  if (!row) return null;

  const analysisRow = db
    .prepare("SELECT * FROM analyses WHERE content_id = ?")
    .get(id) as AnalysisRow | undefined;
  const instagramRow = db
    .prepare("SELECT * FROM instagram_carousels WHERE content_id = ?")
    .get(id) as InstagramRow | undefined;
  const blogRow = db
    .prepare("SELECT * FROM blog_posts WHERE content_id = ?")
    .get(id) as BlogRow | undefined;
  const creativeRow = db
    .prepare("SELECT * FROM creative_briefs WHERE content_id = ?")
    .get(id) as CreativeRow | undefined;
  const instagramEngineRow = db
    .prepare("SELECT engine_json FROM instagram_engine_results WHERE content_id = ?")
    .get(id) as InstagramEngineRow | undefined;
  const localizationRows = db.prepare("SELECT locale, platform, localization_json FROM localizations WHERE content_id = ? ORDER BY locale, platform").all(id) as Array<{ locale: "en"; platform: "instagram" | "blog"; localization_json: string }>;
  const outputRows = db.prepare("SELECT output_type, output_json FROM content_outputs WHERE content_id = ? ORDER BY output_type").all(id) as Array<{ output_type: OutputType; output_json: string }>;
  const outputMap = new Map(outputRows.map((item) => [item.output_type, item.output_json]));

  const analysis: ContentAnalysis | null = analysisRow
    ? {
        keyClaims: json<string[]>(analysisRow.key_claims_json),
        biomechanicsPrinciples: json<string[]>(analysisRow.biomechanics_principles_json),
        clinicalInterpretation: analysisRow.clinical_interpretation,
        easyExplanation: analysisRow.easy_explanation,
        practicalApplication: json<string[]>(analysisRow.practical_application_json),
        exerciseIdeas: json(analysisRow.exercise_ideas_json),
        precautions: json<string[]>(analysisRow.precautions_json),
        model: analysisRow.model,
      }
    : null;

  const instagram: InstagramCarousel | null = instagramRow
    ? {
        cards: json(instagramRow.cards_json),
        width: instagramRow.width,
        height: instagramRow.height,
      }
    : null;

  const blog: BlogPost | null = blogRow
    ? {
        title: blogRow.title,
        hook: blogRow.hook,
        whoThisIsFor: json<string[]>(blogRow.who_this_is_for),
        problemExplanation: blogRow.problem_explanation,
        expertConcept: blogRow.expert_concept,
        easyExplanation: blogRow.easy_explanation,
        clinicalInterpretation: blogRow.clinical_interpretation,
        applications: json(blogRow.applications_json),
        precautions: json(blogRow.precautions_json),
        summary: blogRow.summary,
        sourceText: blogRow.source_text,
        relatedContentCta: blogRow.related_content_cta,
        naverSeo: json(blogRow.naver_seo_json),
        markdown: blogRow.markdown,
      }
    : null;

  const creative: CreativeBrief | null = creativeRow
    ? {
        hooks: json(creativeRow.hooks_json),
        contentAngles: json(creativeRow.content_angles_json),
        metaphors: json(creativeRow.metaphors_json),
        empathyLines: json(creativeRow.empathy_lines_json),
        humorLines: json(creativeRow.humor_lines_json),
        imageBriefs: json(creativeRow.image_briefs_json),
        hashtags: json(creativeRow.hashtags_json),
        templateKey: creativeRow.template_key,
      }
    : null;

  return {
    ...mapRow(row),
    tags: getTags(id),
    analysis,
    instagram,
    blog,
    creative,
    instagramEngine: instagramEngineRow ? json<InstagramEnginePlan>(instagramEngineRow.engine_json) : null,
    instagramEn: outputMap.has("INSTAGRAM_EN") ? json<InstagramOutputData>(outputMap.get("INSTAGRAM_EN")!) : null,
    generatedOutputTypes: outputRows.map((item) => item.output_type),
    sourceAnalysis: getSourceAnalysisForContent(id),
    localizations: localizationRows.map((item) => ({ locale: item.locale, platform: item.platform, data: json<ContentLocalization["data"]>(item.localization_json) })),
  };
}

export function listContents(options: {
  query?: string;
  platform?: Platform | "all";
  category?: TagCategory | "all";
  generatedOnly?: boolean;
  limit?: number;
} = {}): ContentSummary[] {
  const db = getDatabase();
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  const query = options.query?.trim();

  if (query) {
    const pattern = `%${query}%`;
    clauses.push(`(
      content_items.expert_name LIKE ? COLLATE NOCASE OR
      content_items.original_title LIKE ? COLLATE NOCASE OR
      content_items.original_script LIKE ? COLLATE NOCASE OR
      EXISTS (
        SELECT 1 FROM content_tags ct
        INNER JOIN tags t ON t.id = ct.tag_id
        WHERE ct.content_id = content_items.id AND t.name LIKE ? COLLATE NOCASE
      ) OR
      EXISTS (
        SELECT 1 FROM analyses a
        WHERE a.content_id = content_items.id AND (
          a.key_claims_json LIKE ? COLLATE NOCASE OR
          a.biomechanics_principles_json LIKE ? COLLATE NOCASE OR
          a.clinical_interpretation LIKE ? COLLATE NOCASE OR
          a.exercise_ideas_json LIKE ? COLLATE NOCASE
        )
      )
    )`);
    values.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }

  if (options.platform && options.platform !== "all") {
    clauses.push("content_items.platform = ?");
    values.push(options.platform);
  }

  if (options.category && options.category !== "all") {
    clauses.push(`EXISTS (
      SELECT 1 FROM content_tags ct
      INNER JOIN tags t ON t.id = ct.tag_id
      WHERE ct.content_id = content_items.id AND t.category = ?
    )`);
    values.push(options.category);
  }

  if (options.generatedOnly) {
    clauses.push("content_items.status = 'generated'");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.max(1, Math.min(options.limit ?? 100, 250));
  values.push(limit);

  const rows = db
    .prepare(
      `SELECT content_items.*
       FROM content_items
       ${where}
       ORDER BY content_items.registered_at DESC
       LIMIT ?`,
    )
    .all(...values) as ContentRow[];

  return rows.map((row) => ({
    ...mapRow(row),
    tags: getTags(row.id),
    excerpt:
      row.original_script.length > 150
        ? `${row.original_script.slice(0, 150)}…`
        : row.original_script,
  }));
}

export function getDashboardStats(): {
  total: number;
  generated: number;
  youtube: number;
  instagram: number;
} {
  const row = getDatabase()
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) AS generated,
        SUM(CASE WHEN platform = 'youtube' THEN 1 ELSE 0 END) AS youtube,
        SUM(CASE WHEN platform = 'instagram' THEN 1 ELSE 0 END) AS instagram
       FROM content_items`,
    )
    .get() as Record<string, number | null>;

  return {
    total: row.total ?? 0,
    generated: row.generated ?? 0,
    youtube: row.youtube ?? 0,
    instagram: row.instagram ?? 0,
  };
}

function snapshotAndUpsertOutput<T extends OutputType>(
  contentId: string,
  outputType: T,
  output: OutputDataMap[T],
  model: string,
  now: string,
): void {
  const db = getDatabase();
  const current = db.prepare("SELECT output_json, model FROM content_outputs WHERE content_id = ? AND output_type = ?")
    .get(contentId, outputType) as { output_json: string; model: string } | undefined;
  if (current) {
    const versionNumber = (db.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS number FROM output_versions WHERE content_id = ? AND output_type = ?")
      .get(contentId, outputType) as { number: number }).number;
    db.prepare(`INSERT INTO output_versions (id, content_id, output_type, version_number, snapshot_json, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), contentId, outputType, versionNumber, current.output_json, current.model, now);
  }
  db.prepare(`INSERT INTO content_outputs (id, content_id, output_type, output_json, model, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(content_id, output_type) DO UPDATE SET output_json=excluded.output_json, model=excluded.model, updated_at=excluded.updated_at`)
    .run(randomUUID(), contentId, outputType, JSON.stringify(output), model, now, now);
}

export function saveCoreResearch(
  contentId: string,
  analysis: Omit<ContentAnalysis, "model">,
  suggestedTags: ContentTag[],
  model: string,
): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`INSERT INTO analyses (
      id, content_id, key_claims_json, biomechanics_principles_json, clinical_interpretation,
      easy_explanation, practical_application_json, exercise_ideas_json, precautions_json,
      model, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(content_id) DO UPDATE SET key_claims_json=excluded.key_claims_json,
      biomechanics_principles_json=excluded.biomechanics_principles_json,
      clinical_interpretation=excluded.clinical_interpretation,
      easy_explanation=excluded.easy_explanation,
      practical_application_json=excluded.practical_application_json,
      exercise_ideas_json=excluded.exercise_ideas_json,
      precautions_json=excluded.precautions_json, model=excluded.model, updated_at=excluded.updated_at`)
      .run(randomUUID(), contentId, JSON.stringify(analysis.keyClaims), JSON.stringify(analysis.biomechanicsPrinciples),
        analysis.clinicalInterpretation, analysis.easyExplanation, JSON.stringify(analysis.practicalApplication),
        JSON.stringify(analysis.exerciseIdeas), JSON.stringify(analysis.precautions), model, now, now);
    attachTags(contentId, suggestedTags);
    db.prepare("UPDATE content_items SET last_error=NULL, updated_at=? WHERE id=?").run(now, contentId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function saveInstagramOutput(
  contentId: string,
  outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN",
  output: InstagramOutputData,
  model: string,
): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    snapshotAndUpsertOutput(contentId, outputType, output, model, now);
    if (outputType === "INSTAGRAM_KR") {
      db.prepare(`INSERT INTO creative_briefs (id, content_id, hooks_json, content_angles_json, metaphors_json,
        empathy_lines_json, humor_lines_json, image_briefs_json, hashtags_json, template_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(content_id) DO UPDATE SET hooks_json=excluded.hooks_json, content_angles_json=excluded.content_angles_json,
        metaphors_json=excluded.metaphors_json, empathy_lines_json=excluded.empathy_lines_json,
        humor_lines_json=excluded.humor_lines_json, image_briefs_json=excluded.image_briefs_json,
        hashtags_json=excluded.hashtags_json, template_key=excluded.template_key, updated_at=excluded.updated_at`)
        .run(randomUUID(), contentId, JSON.stringify(output.creative.hooks), JSON.stringify(output.creative.contentAngles),
          JSON.stringify(output.creative.metaphors), JSON.stringify(output.creative.empathyLines), JSON.stringify(output.creative.humorLines),
          JSON.stringify(output.creative.imageBriefs), JSON.stringify(output.creative.hashtags), getContentById(contentId)?.templateKey ?? "carousel_story", now, now);
      db.prepare(`INSERT INTO instagram_carousels (id, content_id, cards_json, width, height, created_at, updated_at)
        VALUES (?, ?, ?, 1080, 1350, ?, ?)
        ON CONFLICT(content_id) DO UPDATE SET cards_json=excluded.cards_json, width=1080, height=1350, updated_at=excluded.updated_at`)
        .run(randomUUID(), contentId, JSON.stringify(output.instagramCards), now, now);
      db.prepare(`INSERT INTO instagram_engine_results (id, content_id, engine_json, selected_hook, selected_angle, personality, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(content_id) DO UPDATE SET engine_json=excluded.engine_json, selected_hook=excluded.selected_hook,
        selected_angle=excluded.selected_angle, personality=excluded.personality, updated_at=excluded.updated_at`)
        .run(randomUUID(), contentId, JSON.stringify(output.instagramEngine), output.instagramEngine.selectedHookText,
          output.instagramEngine.selectedAngleType, output.instagramEngine.personality, now, now);
      db.prepare("DELETE FROM instagram_hooks WHERE content_id=?").run(contentId);
      const insertHook = db.prepare(`INSERT INTO instagram_hooks
        (id, content_id, hook_text, hook_type, score, clickbait_risk, score_json, used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      output.creative.hooks.forEach((hook) => insertHook.run(randomUUID(), contentId, hook.text, hook.type,
        hook.score, hook.clickbaitRisk, JSON.stringify(hook.scoreBreakdown),
        hook.text === output.instagramEngine.selectedHookText ? 1 : 0, now));
      db.prepare("DELETE FROM content_angles WHERE content_id=?").run(contentId);
      const insertAngle = db.prepare(`INSERT INTO content_angles
        (id, content_id, angle_type, title, description, is_selected, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      output.creative.contentAngles.forEach((angle) => insertAngle.run(randomUUID(), contentId, angle.type,
        angle.title, angle.description, angle.type === output.instagramEngine.selectedAngleType ? 1 : 0, now));
    }
    db.prepare("UPDATE content_items SET status='generated', last_error=NULL, updated_at=? WHERE id=?").run(now, contentId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function saveNaverOutput(contentId: string, output: NaverOutputData, model: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  const blog = output.blog;
  db.exec("BEGIN IMMEDIATE");
  try {
    snapshotAndUpsertOutput(contentId, "NAVER_BLOG_KR", output, model, now);
    db.prepare(`INSERT INTO blog_posts (id, content_id, title, hook, who_this_is_for, problem_explanation,
      expert_concept, easy_explanation, clinical_interpretation, applications_json, precautions_json,
      summary, source_text, related_content_cta, naver_seo_json, markdown, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id) DO UPDATE SET title=excluded.title, hook=excluded.hook,
      who_this_is_for=excluded.who_this_is_for, problem_explanation=excluded.problem_explanation,
      expert_concept=excluded.expert_concept, easy_explanation=excluded.easy_explanation,
      clinical_interpretation=excluded.clinical_interpretation, applications_json=excluded.applications_json,
      precautions_json=excluded.precautions_json, summary=excluded.summary, source_text=excluded.source_text,
      related_content_cta=excluded.related_content_cta, naver_seo_json=excluded.naver_seo_json,
      markdown=excluded.markdown, updated_at=excluded.updated_at`)
      .run(randomUUID(), contentId, blog.title, blog.hook, JSON.stringify(blog.whoThisIsFor), blog.problemExplanation,
        blog.expertConcept, blog.easyExplanation, blog.clinicalInterpretation, JSON.stringify(blog.applications),
        JSON.stringify(blog.precautions), blog.summary, blog.sourceText, blog.relatedContentCta,
        JSON.stringify(blog.naverSeo), blog.markdown, now, now);
    const editor = { sections: blogSections(blog), selectedTitle: blog.naverSeo.recommendedTitle || blog.title, selectedHook: blog.hook };
    db.prepare("UPDATE blog_posts SET editor_json=?, selected_title=?, selected_hook=? WHERE content_id=?")
      .run(JSON.stringify(editor), editor.selectedTitle, editor.selectedHook, contentId);
    const seo = blog.naverSeo;
    db.prepare("DELETE FROM keywords WHERE content_id=?").run(contentId);
    const insertKeyword = db.prepare(`INSERT INTO keywords
      (id, content_id, keyword, keyword_type, search_intent_json, is_primary, is_selected, score_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`);
    [
      { keyword: seo.primaryKeyword, type: "PRIMARY", primary: 1 },
      ...seo.secondaryKeywords.map((keyword) => ({ keyword, type: "SECONDARY", primary: 0 })),
      ...seo.relatedConcepts.map((keyword) => ({ keyword, type: "CONCEPT", primary: 0 })),
    ].forEach((keyword) => insertKeyword.run(randomUUID(), contentId, keyword.keyword, keyword.type,
      JSON.stringify(seo.searchIntents), keyword.primary, JSON.stringify({ generated: true }), now));
    db.prepare("DELETE FROM image_assets WHERE content_id=? AND platform='naver'").run(contentId);
    const insertImage = db.prepare(`INSERT INTO image_assets
      (id, content_id, platform, image_type, purpose, position_index, caption, alt_description, image_prompt, brand_style, created_at, updated_at)
      VALUES (?, ?, 'naver', ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    seo.imagePlan.forEach((image, index) => insertImage.run(randomUUID(), contentId, image.role.toUpperCase(),
      image.role, index, image.caption, image.caption, image.brief, "움직임노트 Naver Blog", now, now));
    const clusterName = seo.topicCluster.name.toUpperCase();
    db.prepare(`INSERT INTO topic_clusters (id, name, description, created_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET description=excluded.description`)
      .run(randomUUID(), clusterName, seo.topicCluster.relatedTopics.join(", "), now);
    const cluster = db.prepare("SELECT id FROM topic_clusters WHERE name=?").get(clusterName) as { id: string };
    db.prepare("INSERT OR IGNORE INTO content_topic_clusters (content_id, cluster_id) VALUES (?, ?)").run(contentId, cluster.id);
    db.prepare("DELETE FROM quality_reports WHERE content_id=? AND report_type='naver_content_quality'").run(contentId);
    db.prepare(`INSERT INTO quality_reports (id, content_id, report_type, score, status, checks_json, created_at)
      VALUES (?, ?, 'naver_content_quality', ?, ?, ?, ?)`)
      .run(randomUUID(), contentId, seo.seoScore.total, seo.readiness,
        JSON.stringify({ originality: seo.originalityChecks, brand: seo.brandChecks, keywordWarnings: seo.keywordWarnings }), now);
    db.prepare("UPDATE content_items SET status='generated', last_error=NULL, updated_at=? WHERE id=?").run(now, contentId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function listOutputVersions(contentId: string, outputType: OutputType) {
  return getDatabase().prepare(`SELECT id, version_number versionNumber, snapshot_json snapshotJson,
    model, created_at createdAt FROM output_versions WHERE content_id=? AND output_type=? ORDER BY version_number DESC`)
    .all(contentId, outputType) as Array<{ id: string; versionNumber: number; snapshotJson: string; model: string; createdAt: string }>;
}

export function getInstagramOutput(
  contentId: string,
  outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN",
): InstagramOutputData | null {
  const row = getDatabase().prepare("SELECT output_json FROM content_outputs WHERE content_id=? AND output_type=?")
    .get(contentId, outputType) as { output_json: string } | undefined;
  if (row) return json<InstagramOutputData>(row.output_json);
  if (outputType === "INSTAGRAM_EN") return null;
  const content = getContentById(contentId);
  return content?.instagram && content.creative && content.instagramEngine ? {
    instagramCards: content.instagram.cards,
    creative: content.creative,
    instagramEngine: content.instagramEngine,
  } : null;
}

export function saveInstagramEditor(
  contentId: string,
  outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN",
  cards: InstagramCarousel["cards"],
  engine?: InstagramEnginePlan,
  createVersion = false,
): void {
  const db = getDatabase();
  const current = getInstagramOutput(contentId, outputType);
  if (!current) throw new Error("저장된 카드뉴스를 찾을 수 없습니다.");
  const next: InstagramOutputData = { ...current, instagramCards: cards, instagramEngine: engine ?? current.instagramEngine };
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    if (createVersion) {
      const number = (db.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS number FROM output_versions WHERE content_id=? AND output_type=?")
        .get(contentId, outputType) as { number: number }).number;
      db.prepare(`INSERT INTO output_versions (id, content_id, output_type, version_number, snapshot_json, model, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(randomUUID(), contentId, outputType, number, JSON.stringify(current), "manual-editor", now);
    }
    db.prepare(`INSERT INTO content_outputs (id, content_id, output_type, output_json, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'manual-editor', ?, ?)
      ON CONFLICT(content_id, output_type) DO UPDATE SET output_json=excluded.output_json, updated_at=excluded.updated_at`)
      .run(randomUUID(), contentId, outputType, JSON.stringify(next), now, now);
    if (outputType === "INSTAGRAM_KR") {
      db.prepare("UPDATE instagram_carousels SET cards_json=?, updated_at=? WHERE content_id=?")
        .run(JSON.stringify(cards), now, contentId);
      db.prepare(`UPDATE instagram_engine_results SET engine_json=?, selected_hook=?, selected_angle=?, personality=?, updated_at=? WHERE content_id=?`)
        .run(JSON.stringify(next.instagramEngine), next.instagramEngine.selectedHookText, next.instagramEngine.selectedAngleType, next.instagramEngine.personality, now, contentId);
    }
    db.prepare("UPDATE content_items SET updated_at=? WHERE id=?").run(now, contentId);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function listInstagramOutputVersions(contentId: string, outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN") {
  const rows = listOutputVersions(contentId, outputType);
  return rows.map((row) => {
    const snapshot = json<InstagramOutputData>(row.snapshotJson);
    return {
      id: row.id, versionNumber: row.versionNumber,
      snapshot: { cards: snapshot.instagramCards, engine: snapshot.instagramEngine },
      score: snapshot.instagramEngine.quality.total,
      hookText: snapshot.instagramEngine.selectedHookText,
      cardCount: snapshot.instagramCards.length,
      createdAt: row.createdAt,
    };
  });
}

export function saveGeneratedBundle(
  contentId: string,
  bundle: GeneratedBundle,
  model: string,
): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(
      `INSERT INTO analyses (
        id, content_id, key_claims_json, biomechanics_principles_json,
        clinical_interpretation, easy_explanation, practical_application_json,
        exercise_ideas_json, precautions_json, model, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id) DO UPDATE SET
        key_claims_json = excluded.key_claims_json,
        biomechanics_principles_json = excluded.biomechanics_principles_json,
        clinical_interpretation = excluded.clinical_interpretation,
        easy_explanation = excluded.easy_explanation,
        practical_application_json = excluded.practical_application_json,
        exercise_ideas_json = excluded.exercise_ideas_json,
        precautions_json = excluded.precautions_json,
        model = excluded.model,
        updated_at = excluded.updated_at`,
    ).run(
      randomUUID(),
      contentId,
      JSON.stringify(bundle.analysis.keyClaims),
      JSON.stringify(bundle.analysis.biomechanicsPrinciples),
      bundle.analysis.clinicalInterpretation,
      bundle.analysis.easyExplanation,
      JSON.stringify(bundle.analysis.practicalApplication),
      JSON.stringify(bundle.analysis.exerciseIdeas),
      JSON.stringify(bundle.analysis.precautions),
      model,
      now,
      now,
    );

    if (bundle.localizations) {
      const saveLocalization = db.prepare(`INSERT INTO localizations (id, content_id, locale, platform, localization_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(content_id, locale, platform) DO UPDATE SET localization_json = excluded.localization_json, updated_at = excluded.updated_at`);
      bundle.localizations.forEach((item) => saveLocalization.run(randomUUID(), contentId, item.locale, item.platform, JSON.stringify(item.data), now, now));
    }

    db.prepare(
      `INSERT INTO creative_briefs (
        id, content_id, hooks_json, content_angles_json, metaphors_json,
        empathy_lines_json, humor_lines_json, image_briefs_json, hashtags_json,
        template_key, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id) DO UPDATE SET
        hooks_json = excluded.hooks_json,
        content_angles_json = excluded.content_angles_json,
        metaphors_json = excluded.metaphors_json,
        empathy_lines_json = excluded.empathy_lines_json,
        humor_lines_json = excluded.humor_lines_json,
        image_briefs_json = excluded.image_briefs_json,
        hashtags_json = excluded.hashtags_json,
        template_key = excluded.template_key,
        updated_at = excluded.updated_at`,
    ).run(
      randomUUID(),
      contentId,
      JSON.stringify(bundle.creative.hooks),
      JSON.stringify(bundle.creative.contentAngles),
      JSON.stringify(bundle.creative.metaphors),
      JSON.stringify(bundle.creative.empathyLines),
      JSON.stringify(bundle.creative.humorLines),
      JSON.stringify(bundle.creative.imageBriefs),
      JSON.stringify(bundle.creative.hashtags),
      getContentById(contentId)?.templateKey ?? "carousel_story",
      now,
      now,
    );

    db.prepare(
      `INSERT INTO instagram_carousels
       (id, content_id, cards_json, width, height, created_at, updated_at)
       VALUES (?, ?, ?, 1080, 1350, ?, ?)
       ON CONFLICT(content_id) DO UPDATE SET
         cards_json = excluded.cards_json,
         width = excluded.width,
         height = excluded.height,
         updated_at = excluded.updated_at`,
    ).run(randomUUID(), contentId, JSON.stringify(bundle.instagramCards), now, now);

    db.prepare(
      `INSERT INTO instagram_engine_results
       (id, content_id, engine_json, selected_hook, selected_angle, personality, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(content_id) DO UPDATE SET
         engine_json = excluded.engine_json,
         selected_hook = excluded.selected_hook,
         selected_angle = excluded.selected_angle,
         personality = excluded.personality,
         updated_at = excluded.updated_at`,
    ).run(
      randomUUID(), contentId, JSON.stringify(bundle.instagramEngine),
      bundle.instagramEngine.selectedHookText, bundle.instagramEngine.selectedAngleType,
      bundle.instagramEngine.personality, now, now,
    );

    db.prepare("DELETE FROM instagram_hooks WHERE content_id = ?").run(contentId);
    const insertHook = db.prepare(`INSERT INTO instagram_hooks
      (id, content_id, hook_text, hook_type, score, clickbait_risk, score_json, used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    bundle.creative.hooks.forEach((hook) => insertHook.run(
      randomUUID(), contentId, hook.text, hook.type, hook.score, hook.clickbaitRisk,
      JSON.stringify(hook.scoreBreakdown), hook.text === bundle.instagramEngine.selectedHookText ? 1 : 0, now,
    ));

    db.prepare(
      `INSERT INTO blog_posts (
        id, content_id, title, hook, who_this_is_for, problem_explanation, expert_concept,
        easy_explanation, clinical_interpretation, applications_json,
        precautions_json, summary, source_text, related_content_cta, naver_seo_json, markdown, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(content_id) DO UPDATE SET
        title = excluded.title,
        hook = excluded.hook,
        who_this_is_for = excluded.who_this_is_for,
        problem_explanation = excluded.problem_explanation,
        expert_concept = excluded.expert_concept,
        easy_explanation = excluded.easy_explanation,
        clinical_interpretation = excluded.clinical_interpretation,
        applications_json = excluded.applications_json,
        precautions_json = excluded.precautions_json,
        summary = excluded.summary,
        source_text = excluded.source_text,
        related_content_cta = excluded.related_content_cta,
        naver_seo_json = excluded.naver_seo_json,
        markdown = excluded.markdown,
        updated_at = excluded.updated_at`,
    ).run(
      randomUUID(),
      contentId,
      bundle.blog.title,
      bundle.blog.hook,
      JSON.stringify(bundle.blog.whoThisIsFor),
      bundle.blog.problemExplanation,
      bundle.blog.expertConcept,
      bundle.blog.easyExplanation,
      bundle.blog.clinicalInterpretation,
      JSON.stringify(bundle.blog.applications),
      JSON.stringify(bundle.blog.precautions),
      bundle.blog.summary,
      bundle.blog.sourceText,
      bundle.blog.relatedContentCta,
      JSON.stringify(bundle.blog.naverSeo),
      bundle.blog.markdown,
      now,
      now,
    );

    const editor = {
      sections: blogSections(bundle.blog),
      selectedTitle: bundle.blog.naverSeo.recommendedTitle || bundle.blog.title,
      selectedHook: bundle.blog.hook,
    };
    db.prepare("UPDATE blog_posts SET editor_json = ?, selected_title = ?, selected_hook = ? WHERE content_id = ?")
      .run(JSON.stringify(editor), editor.selectedTitle, editor.selectedHook, contentId);

    const seo = bundle.blog.naverSeo;
    db.prepare("DELETE FROM keywords WHERE content_id = ?").run(contentId);
    const insertKeyword = db.prepare(`INSERT INTO keywords
      (id, content_id, keyword, keyword_type, search_intent_json, is_primary, is_selected, score_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`);
    const keywordRows = [
      { keyword: seo.primaryKeyword, type: "PRIMARY", primary: 1 },
      ...seo.secondaryKeywords.map((keyword) => ({ keyword, type: "SECONDARY", primary: 0 })),
      ...seo.relatedConcepts.map((keyword) => ({ keyword, type: "CONCEPT", primary: 0 })),
    ];
    for (const keyword of keywordRows) insertKeyword.run(randomUUID(), contentId, keyword.keyword, keyword.type, JSON.stringify(seo.searchIntents), keyword.primary, JSON.stringify({ generated: true }), now);

    db.prepare("DELETE FROM content_angles WHERE content_id = ?").run(contentId);
    const insertAngle = db.prepare(`INSERT INTO content_angles
      (id, content_id, angle_type, title, description, is_selected, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    bundle.creative.contentAngles.forEach((angle, index) => insertAngle.run(randomUUID(), contentId, angle.type, angle.title, angle.description, index === 0 ? 1 : 0, now));

    db.prepare("DELETE FROM image_assets WHERE content_id = ? AND platform = 'naver'").run(contentId);
    const insertImage = db.prepare(`INSERT INTO image_assets
      (id, content_id, platform, image_type, purpose, position_index, caption, alt_description, image_prompt, brand_style, created_at, updated_at)
      VALUES (?, ?, 'naver', ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    seo.imagePlan.forEach((image, index) => insertImage.run(randomUUID(), contentId, image.role.toUpperCase(), image.role, index, image.caption, image.caption, image.brief, "움직임노트 Naver Blog", now, now));

    const clusterName = seo.topicCluster.name.toUpperCase();
    db.prepare(`INSERT INTO topic_clusters (id, name, description, created_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET description = excluded.description`).run(randomUUID(), clusterName, seo.topicCluster.relatedTopics.join(", "), now);
    const cluster = db.prepare("SELECT id FROM topic_clusters WHERE name = ?").get(clusterName) as { id: string };
    db.prepare("INSERT OR IGNORE INTO content_topic_clusters (content_id, cluster_id) VALUES (?, ?)").run(contentId, cluster.id);

    db.prepare("DELETE FROM quality_reports WHERE content_id = ?").run(contentId);
    db.prepare(`INSERT INTO quality_reports (id, content_id, report_type, score, status, checks_json, created_at)
      VALUES (?, ?, 'naver_content_quality', ?, ?, ?, ?)`).run(randomUUID(), contentId, seo.seoScore.total, seo.readiness, JSON.stringify({ originality: seo.originalityChecks, brand: seo.brandChecks, keywordWarnings: seo.keywordWarnings }), now);

    attachTags(contentId, bundle.suggestedTags);
    db.prepare(
      `UPDATE content_items
       SET status = 'generated', last_error = NULL, updated_at = ?
       WHERE id = ?`,
    ).run(now, contentId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function markGenerationError(contentId: string, message: string): void {
  getDatabase()
    .prepare(
      `UPDATE content_items SET status = 'error', last_error = ?, updated_at = ? WHERE id = ?`,
    )
    .run(message.slice(0, 500), new Date().toISOString(), contentId);
}

export function saveInstagramCards(contentId: string, cards: InstagramCarousel["cards"]): void {
  const result = getDatabase().prepare(
      `UPDATE instagram_carousels
       SET cards_json = ?, updated_at = ?
       WHERE content_id = ?`,
    )
    .run(JSON.stringify(cards), new Date().toISOString(), contentId);
  if (result.changes === 0) throw new Error("저장된 카드뉴스를 찾을 수 없습니다.");
}

export function saveInstagramEngine(contentId: string, engine: InstagramEnginePlan, createVersion = false): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    if (createVersion) {
      const current = getContentById(contentId);
      if (current?.instagram) {
        const versionNumber = (db.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS number FROM instagram_versions WHERE content_id = ?").get(contentId) as { number: number }).number;
        db.prepare(`INSERT INTO instagram_versions
          (id, content_id, version_number, snapshot_json, score, hook_text, card_count, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(randomUUID(), contentId, versionNumber,
            JSON.stringify({ cards: current.instagram.cards, engine: current.instagramEngine }),
            current.instagramEngine?.quality.total ?? 0, current.instagramEngine?.selectedHookText ?? "",
            current.instagram.cards.length, now);
      }
    }
    const result = db.prepare(`UPDATE instagram_engine_results SET engine_json = ?, selected_hook = ?, selected_angle = ?, personality = ?, updated_at = ? WHERE content_id = ?`)
      .run(JSON.stringify(engine), engine.selectedHookText, engine.selectedAngleType, engine.personality, now, contentId);
    if (result.changes === 0) throw new Error("Instagram 엔진 결과를 찾을 수 없습니다.");
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function listInstagramVersions(contentId: string): Array<{ id: string; versionNumber: number; snapshot: { cards: InstagramCarousel["cards"]; engine: InstagramEnginePlan | null }; score: number; hookText: string; cardCount: number; createdAt: string }> {
  const rows = getDatabase().prepare("SELECT * FROM instagram_versions WHERE content_id=? ORDER BY version_number DESC").all(contentId) as Array<{ id: string; version_number: number; snapshot_json: string; score: number; hook_text: string; card_count: number; created_at: string }>;
  return rows.map((row) => ({ id: row.id, versionNumber: row.version_number, snapshot: json(row.snapshot_json), score: row.score, hookText: row.hook_text, cardCount: row.card_count, createdAt: row.created_at }));
}

export function getBrandProfile(): BrandProfile {
  const row = getDatabase()
    .prepare("SELECT * FROM brand_profiles WHERE id = 'default'")
    .get() as BrandRow;
  return {
    brandName: row.brand_name,
    tagline: row.tagline,
    audience: row.audience,
    toneOfVoice: row.tone_of_voice,
    humorLevel: row.humor_level,
    expertiseLevel: row.expertise_level,
    visualStyle: row.visual_style,
    brandColors: json(row.brand_colors_json),
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    fontFamily: row.font_family,
    logoDataUrl: row.logo_data_url,
    watermarkEnabled: Boolean(row.watermark_enabled),
    ctaStyle: row.cta_style,
    signatureCta: row.signature_cta,
    sourceCitationStyle: row.source_citation_style,
    recurringPhrases: json(row.recurring_phrases_json),
    recurringContentBlocks: json(row.recurring_content_blocks_json),
    hashtagGroups: json(row.hashtag_groups_json),
    cardTemplate: row.card_template,
    blogTemplate: row.blog_template,
    imageStyleRules: json(row.image_style_rules_json),
    categoryBadgeColors: json(row.category_badge_colors_json),
    instagramSettings: {
      defaultCardMin: 5, defaultCardMax: 9, hookStylePreference: "공감과 궁금증의 균형",
      bodyCharacterMode: "LOW", ctaPreference: "SAVE", coverStyle: "bold editorial",
      imageStyle: "clean medical illustration", textDensity: "BALANCED", safeMargin: 72,
      badgePosition: "top-left", logoPosition: "bottom-left", footerStyle: "compact",
      sourceCardStyle: "clean", sourceDisplay: "BOTH", ...json<Partial<BrandProfile["instagramSettings"]>>(row.instagram_settings_json || "{}"),
    },
    updatedAt: row.updated_at,
  };
}

export function saveBrandProfile(profile: Omit<BrandProfile, "updatedAt">): BrandProfile {
  const updatedAt = new Date().toISOString();
  getDatabase()
    .prepare(
      `UPDATE brand_profiles SET
        brand_name = ?, tagline = ?, audience = ?, tone_of_voice = ?, humor_level = ?,
        expertise_level = ?, visual_style = ?, brand_colors_json = ?,
        primary_color = ?, secondary_color = ?, accent_color = ?, font_family = ?,
        logo_data_url = ?, watermark_enabled = ?, cta_style = ?, signature_cta = ?,
        source_citation_style = ?, recurring_phrases_json = ?,
        recurring_content_blocks_json = ?, hashtag_groups_json = ?,
        card_template = ?, blog_template = ?, image_style_rules_json = ?,
        category_badge_colors_json = ?, instagram_settings_json = ?, updated_at = ?
       WHERE id = 'default'`,
    )
    .run(
      profile.brandName,
      profile.tagline,
      profile.audience,
      profile.toneOfVoice,
      profile.humorLevel,
      profile.expertiseLevel,
      profile.visualStyle,
      JSON.stringify([profile.primaryColor, profile.secondaryColor, profile.accentColor]),
      profile.primaryColor,
      profile.secondaryColor,
      profile.accentColor,
      profile.fontFamily,
      profile.logoDataUrl,
      profile.watermarkEnabled ? 1 : 0,
      profile.ctaStyle,
      profile.signatureCta,
      profile.sourceCitationStyle,
      JSON.stringify(profile.recurringPhrases),
      JSON.stringify(profile.recurringContentBlocks),
      JSON.stringify(profile.hashtagGroups),
      profile.cardTemplate,
      profile.blogTemplate,
      JSON.stringify(profile.imageStyleRules),
      JSON.stringify(profile.categoryBadgeColors),
      JSON.stringify(profile.instagramSettings),
      updatedAt,
    );
  return getBrandProfile();
}
