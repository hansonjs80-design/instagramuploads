PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  expert_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  original_title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  original_script TEXT NOT NULL,
  template_key TEXT NOT NULL DEFAULT 'carousel_story',
  output_mode TEXT NOT NULL DEFAULT 'both' CHECK (output_mode IN ('instagram', 'naver_blog', 'both')),
  experience_note TEXT NOT NULL DEFAULT '',
  registered_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'error')),
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'topic'
    CHECK (category IN ('topic', 'body_part', 'exercise', 'symptom', 'biomechanics')),
  UNIQUE(normalized_name, category)
);

CREATE TABLE IF NOT EXISTS content_tags (
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  key_claims_json TEXT NOT NULL,
  biomechanics_principles_json TEXT NOT NULL,
  clinical_interpretation TEXT NOT NULL,
  easy_explanation TEXT NOT NULL,
  practical_application_json TEXT NOT NULL,
  exercise_ideas_json TEXT NOT NULL,
  precautions_json TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_carousels (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  cards_json TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 1080,
  height INTEGER NOT NULL DEFAULT 1350,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_engine_results (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  engine_json TEXT NOT NULL,
  selected_hook TEXT NOT NULL,
  selected_angle TEXT NOT NULL,
  personality TEXT NOT NULL DEFAULT 'STANDARD',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_hooks (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  hook_text TEXT NOT NULL,
  hook_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  clickbait_risk TEXT NOT NULL,
  score_json TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_versions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  score INTEGER NOT NULL,
  hook_text TEXT NOT NULL,
  card_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(content_id, version_number)
);

CREATE TABLE IF NOT EXISTS instagram_performance (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  followers_gained INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_accounts (
  id TEXT PRIMARY KEY,
  instagram_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  account_type TEXT NOT NULL,
  profile_picture_url TEXT NOT NULL DEFAULT '',
  encrypted_access_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TEXT,
  scopes_json TEXT NOT NULL,
  connection_status TEXT NOT NULL,
  publish_mode TEXT NOT NULL DEFAULT 'MOCK',
  connected_at TEXT NOT NULL,
  last_validated_at TEXT
);

CREATE TABLE IF NOT EXISTS instagram_oauth_states (
  state_hash TEXT PRIMARY KEY,
  redirect_uri TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_publish_jobs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE RESTRICT,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE RESTRICT,
  content_version_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  caption TEXT NOT NULL,
  quality_score INTEGER NOT NULL,
  brand_score INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  failed_at TEXT,
  error_code TEXT,
  error_message TEXT,
  carousel_container_id TEXT,
  instagram_media_id TEXT,
  next_poll_at TEXT,
  confirmed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS instagram_publish_assets (
  id TEXT PRIMARY KEY,
  publish_job_id TEXT NOT NULL REFERENCES instagram_publish_jobs(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  local_path TEXT NOT NULL,
  jpeg_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  public_storage_key TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  child_container_id TEXT,
  container_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  cleaned_at TEXT,
  UNIQUE(publish_job_id, order_index)
);

CREATE TABLE IF NOT EXISTS instagram_published_posts (
  id TEXT PRIMARY KEY,
  instagram_account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE RESTRICT,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE RESTRICT,
  content_version_id TEXT NOT NULL,
  publish_job_id TEXT NOT NULL UNIQUE REFERENCES instagram_publish_jobs(id) ON DELETE RESTRICT,
  instagram_media_id TEXT NOT NULL,
  permalink TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL,
  card_count INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  quality_score INTEGER NOT NULL,
  brand_score INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_instagram_publish_jobs_content ON instagram_publish_jobs(content_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_published_posts_date ON instagram_published_posts(published_at DESC);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  who_this_is_for TEXT NOT NULL,
  problem_explanation TEXT NOT NULL,
  expert_concept TEXT NOT NULL,
  easy_explanation TEXT NOT NULL,
  clinical_interpretation TEXT NOT NULL,
  applications_json TEXT NOT NULL,
  precautions_json TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_text TEXT NOT NULL,
  related_content_cta TEXT NOT NULL,
  naver_seo_json TEXT NOT NULL,
  editor_json TEXT NOT NULL DEFAULT '{}',
  selected_title TEXT NOT NULL DEFAULT '',
  selected_hook TEXT NOT NULL DEFAULT '',
  markdown TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS keywords (
  id TEXT PRIMARY KEY,
  content_id TEXT REFERENCES content_items(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT NOT NULL,
  search_intent_json TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_selected INTEGER NOT NULL DEFAULT 1,
  score_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS keyword_trends (
  id TEXT PRIMARY KEY,
  keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  period_months INTEGER NOT NULL,
  metrics_json TEXT NOT NULL,
  series_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_angles (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  angle_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_selected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image_assets (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  image_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  position_index INTEGER NOT NULL,
  caption TEXT NOT NULL,
  alt_description TEXT NOT NULL,
  image_prompt TEXT NOT NULL,
  brand_style TEXT NOT NULL,
  image_data_url TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL DEFAULT 1200,
  height INTEGER NOT NULL DEFAULT 675,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topic_clusters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#203A5B',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_topic_clusters (
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL REFERENCES topic_clusters(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, cluster_id)
);

CREATE TABLE IF NOT EXISTS content_series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  thumbnail_style_json TEXT NOT NULL,
  badge TEXT NOT NULL,
  color TEXT NOT NULL,
  title_pattern TEXT NOT NULL,
  cta TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_series_items (
  series_id TEXT NOT NULL REFERENCES content_series(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  PRIMARY KEY (series_id, content_id)
);

CREATE TABLE IF NOT EXISTS content_versions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(content_id, version_number)
);

CREATE TABLE IF NOT EXISTS quality_reports (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  status TEXT NOT NULL,
  checks_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creative_briefs (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  hooks_json TEXT NOT NULL,
  content_angles_json TEXT NOT NULL,
  metaphors_json TEXT NOT NULL,
  empathy_lines_json TEXT NOT NULL,
  humor_lines_json TEXT NOT NULL,
  image_briefs_json TEXT NOT NULL,
  hashtags_json TEXT NOT NULL,
  template_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_analyses (
  id TEXT PRIMARY KEY,
  content_id TEXT UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  source_platform TEXT NOT NULL,
  platform_content_id TEXT NOT NULL,
  source_revision TEXT NOT NULL DEFAULT '',
  cache_key TEXT NOT NULL UNIQUE,
  analysis_mode TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  user_message TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL,
  availability_json TEXT NOT NULL,
  evidence_level TEXT NOT NULL,
  quality TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  source_language TEXT NOT NULL DEFAULT '',
  available_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_evidence (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  locator TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  start_seconds REAL NOT NULL,
  end_seconds REAL NOT NULL,
  segment_text TEXT NOT NULL,
  language TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS video_frames (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  timestamp_seconds REAL NOT NULL,
  local_path TEXT NOT NULL DEFAULT '',
  observation TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_claims (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  evidence_ids_json TEXT NOT NULL,
  timestamp_seconds REAL,
  frame_id TEXT,
  confidence INTEGER NOT NULL,
  source_language TEXT NOT NULL,
  claim_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_classifications (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL UNIQUE REFERENCES source_analyses(id) ON DELETE CASCADE,
  classification_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classification_overrides (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  field_path TEXT NOT NULL,
  previous_value_json TEXT NOT NULL,
  next_value_json TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_media_assets (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  local_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS localizations (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  platform TEXT NOT NULL,
  localization_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(content_id, locale, platform)
);

CREATE TABLE IF NOT EXISTS classification_corrections (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL REFERENCES source_analyses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  ai_value TEXT NOT NULL,
  user_value TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS brand_profiles (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  brand_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  audience TEXT NOT NULL,
  tone_of_voice TEXT NOT NULL,
  humor_level REAL NOT NULL DEFAULT 2.5 CHECK (humor_level BETWEEN 0 AND 5),
  expertise_level TEXT NOT NULL,
  visual_style TEXT NOT NULL,
  brand_colors_json TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  font_family TEXT NOT NULL,
  logo_data_url TEXT NOT NULL,
  watermark_enabled INTEGER NOT NULL DEFAULT 0,
  cta_style TEXT NOT NULL,
  signature_cta TEXT NOT NULL,
  source_citation_style TEXT NOT NULL,
  recurring_phrases_json TEXT NOT NULL,
  recurring_content_blocks_json TEXT NOT NULL,
  hashtag_groups_json TEXT NOT NULL,
  card_template TEXT NOT NULL,
  blog_template TEXT NOT NULL,
  image_style_rules_json TEXT NOT NULL,
  category_badge_colors_json TEXT NOT NULL,
  instagram_settings_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO brand_profiles (
  id, brand_name, tagline, audience, tone_of_voice, humor_level, expertise_level,
  visual_style, brand_colors_json, primary_color, secondary_color, accent_color,
  font_family, logo_data_url, watermark_enabled, cta_style, signature_cta,
  source_citation_style, recurring_phrases_json, recurring_content_blocks_json,
  hashtag_groups_json, card_template, blog_template, image_style_rules_json,
  category_badge_colors_json, updated_at
) VALUES (
  'default', '움직임노트', '어려운 운동·재활 개념을 누구나 이해하기 쉽게 풀어주는 움직임 콘텐츠 채널',
  '통증이 있는 일반인 / 운동초보 / 직장인 / 육아맘 / 자세·보행·재활에 관심 있는 사람',
  '친절하고 쉬우며 공감형이고 전문적이되 살짝 재치 있는 말투. 겁주거나 과하게 단정하지 않기', 2.5,
  '전문가 개념을 정확히 유지하면서 일반인이 바로 이해하고 적용할 수 있는 수준',
  '깔끔한 의학·운동 교육형 일러스트, 여백이 충분한 카드, 단순 도식과 화살표',
  '["#203A5B", "#88C9C1", "#F3F5F7", "#F28C7B", "#1F2933", "#5B6573"]',
  '#203A5B', '#88C9C1', '#F28C7B', 'Pretendard, SUIT, Noto Sans KR, sans-serif', '', 0,
  '부담을 주지 않는 저장·확인 유도',
  '저장해두고 필요할 때 다시 봐',
  'Source — Expert / Platform / Original Title / URL',
  '["혹시 이런 적 있지?","쉽게 말하면","한 줄로 정리하면","생각보다 여기만의 문제는 아닐 수 있어","이건 꼭 기억해두면 좋아"]',
  '["한 줄 요약","오늘의 핵심","흔한 오해","체크 포인트","저장 포인트","출처"]',
  '{"brand":["#움직임노트","#쉽게보는재활","#몸읽기노트"],"topic":["#재활운동","#움직임교육","#통증관리","#자세교정","#보행분석","#교정운동","#운동교육"],"audience":["#운동초보","#통증있는사람","#직장인통증관리","#오래서있는직업","#육아맘운동","#생활속재활"],"search":["#허리통증","#어깨통증","#무릎통증","#발통증","#발목통증","#골반통증","#도수치료","#물리치료","#스트레칭","#재활운동"]}',
  'carousel_story', 'clinical_editorial',
  '["clean medical illustration","simple movement diagram","normal vs limited comparison visual","light humorous concept illustration","simple summary icons","no complex backgrounds","avoid frightening anatomy","no copied creator imagery","no embedded text"]',
  '{"FOOT / ANKLE":"#88C9C1","KNEE":"#BFD7EA","HIP / PELVIS":"#203A5B","RIB CAGE / BREATHING":"#F28C7B","WALKING / RUNNING":"#152B47","PAIN CHECK":"#D6DADF","EXERCISE":"#CDE8D1","COMMON MISTAKES":"#F5B2A6"}',
  CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_items_expert ON content_items(expert_name);
CREATE INDEX IF NOT EXISTS idx_content_items_platform ON content_items(platform);
CREATE INDEX IF NOT EXISTS idx_content_items_registered_at ON content_items(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_normalized_name ON tags(normalized_name);
CREATE INDEX IF NOT EXISTS idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX IF NOT EXISTS idx_source_analyses_url ON source_analyses(normalized_url, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_evidence_analysis ON source_evidence(analysis_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_analysis ON transcript_segments(analysis_id, start_seconds);
CREATE INDEX IF NOT EXISTS idx_content_claims_analysis ON content_claims(analysis_id);
