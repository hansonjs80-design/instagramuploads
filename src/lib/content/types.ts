export const tagCategories = [
  "topic",
  "body_part",
  "exercise",
  "symptom",
  "biomechanics",
] as const;

export type TagCategory = (typeof tagCategories)[number];
export type Platform = "youtube" | "instagram";
export type ContentStatus = "draft" | "generated" | "error";
export type OutputMode = "instagram" | "naver_blog" | "both";

export type ContentTag = {
  id?: number;
  name: string;
  category: TagCategory;
};

export type ExerciseIdea = {
  name: string;
  purpose: string;
  instructions: string;
  bodyPart: string;
};

export type ContentAnalysis = {
  keyClaims: string[];
  biomechanicsPrinciples: string[];
  clinicalInterpretation: string;
  easyExplanation: string;
  practicalApplication: string[];
  exerciseIdeas: ExerciseIdea[];
  precautions: string[];
  model: string;
};

export type InstagramCard = {
  slide: number;
  headline: string;
  subheadline?: string;
  body: string;
  callout?: string;
  imageDescription: string;
  source: string;
  categoryBadge?: string;
  summaryText?: string;
  purpose?: InstagramCardPurpose;
  visualType?: InstagramVisualType;
  swipeFlow?: InstagramSwipeFlow;
  textDensity?: "LOW" | "GOOD" | "HIGH" | "TOO_HIGH";
  locks?: { headline: boolean; image: boolean; card: boolean };
  style?: InstagramCardStyle;
};

export type InstagramCardPurpose =
  | "HOOK" | "RELATABLE_PROBLEM" | "KEY_PRINCIPLE" | "EASY_EXPLANATION"
  | "VISUAL_EXPLANATION" | "APPLICATION" | "MISTAKE" | "TAKEAWAY" | "SOURCE_CTA";

export type InstagramVisualType =
  | "COVER" | "ILLUSTRATION" | "MEDICAL_DIAGRAM" | "MOVEMENT_DIAGRAM"
  | "COMPARISON" | "HUMOR" | "BODY_CHARACTER" | "EXERCISE" | "CHECKLIST"
  | "TEXT_ONLY" | "SUMMARY" | "SOURCE";

export type InstagramSwipeFlow = {
  currentMessage: string;
  curiosityGap: string;
  nextCardReason: string;
  transitionLine: string;
};

export type InstagramCardStyle = {
  textAlign: "left" | "center" | "right";
  headlineSize: number;
  bodySize: number;
  fontWeight: 400 | 500 | 600 | 700 | 800;
  lineHeight: number;
  textPosition: "top" | "center" | "bottom";
  background: string;
  imageDataUrl: string;
  imageSize: number;
  imagePosition: "top" | "center" | "bottom" | "left" | "right";
  spacing: number;
  logoPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "hidden";
  footerStyle: "compact" | "band" | "hidden";
  badgeStyle: "pill" | "square" | "outline" | "hidden";
  summaryBoxStyle: "soft" | "solid" | "outline" | "hidden";
  sourceBoxStyle: "plain" | "band" | "hidden";
};

export type InstagramCarousel = {
  cards: InstagramCard[];
  width: number;
  height: number;
};

export type BlogPost = {
  title: string;
  hook: string;
  whoThisIsFor: string[];
  problemExplanation: string;
  expertConcept: string;
  easyExplanation: string;
  clinicalInterpretation: string;
  applications: string[];
  precautions: string[];
  summary: string;
  sourceText: string;
  relatedContentCta: string;
  naverSeo: NaverSeoPlan;
  markdown: string;
};

export type QualityCheck = { label: string; passed: boolean; note: string };

export type NaverSeoPlan = {
  primaryTopic: string;
  searchIntents: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  relatedConcepts: string[];
  titleCandidates: Array<{
    type: "search" | "curiosity" | "contrarian" | "empathy" | "expert_easy";
    title: string;
  }>;
  recommendedTitle: string;
  imagePlan: Array<{ position: string; role: string; brief: string; caption: string }>;
  tags: HashtagGroups;
  topicCluster: { name: string; relatedTopics: string[] };
  relatedContentTitles: string[];
  originalityChecks: QualityCheck[];
  keywordWarnings: string[];
  brandChecks: QualityCheck[];
  readiness: "ready" | "needs_revision";
  seoScore: {
    searchIntent: number;
    titleQuality: number;
    originality: number;
    expertiseInterpretation: number;
    readability: number;
    structure: number;
    imageUsefulness: number;
    sourceTransparency: number;
    brandConsistency: number;
    relatedContent: number;
    total: number;
  };
};

export type ContentItem = {
  id: string;
  expertName: string;
  platform: Platform;
  originalTitle: string;
  sourceUrl: string;
  originalScript: string;
  templateKey: TemplateKey;
  outputMode: OutputMode;
  experienceNote: string;
  registeredAt: string;
  status: ContentStatus;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  tags: ContentTag[];
  analysis: ContentAnalysis | null;
  instagram: InstagramCarousel | null;
  blog: BlogPost | null;
  creative: CreativeBrief | null;
  instagramEngine: InstagramEnginePlan | null;
  sourceAnalysis: import("@/services/source-analysis/types").SourceAnalysis | null;
  localizations: ContentLocalization[];
};

export type ContentSummary = Omit<
  ContentItem,
  "originalScript" | "analysis" | "instagram" | "blog" | "creative" | "instagramEngine" | "sourceAnalysis" | "localizations"
> & {
  excerpt: string;
};

export type GeneratedBundle = {
  analysis: Omit<ContentAnalysis, "model">;
  instagramCards: InstagramCard[];
  blog: BlogPost;
  suggestedTags: ContentTag[];
  creative: Omit<CreativeBrief, "templateKey">;
  instagramEngine: InstagramEnginePlan;
  localizations?: ContentLocalization[];
};

export type ContentLocalization = {
  locale: "en";
  platform: "instagram" | "blog";
  data: {
    title: string;
    hook: string;
    body: string;
    caption: string;
    keywords: string[];
    hashtags: string[];
    sourceNotice: string;
  };
};

export type CreateContentInput = {
  expertName: string;
  sourceUrl: string;
  originalTitle: string;
  originalScript: string;
  templateKey: TemplateKey;
  outputMode: OutputMode;
  experienceNote: string;
  tags: ContentTag[];
  sourceAnalysisId: string;
};

export const templateKeys = [
  "myth_vs_truth",
  "problem_cause_solution",
  "checklist",
  "common_mistake",
  "simple_explanation",
  "exercise_application",
  "carousel_story",
] as const;

export type TemplateKey = (typeof templateKeys)[number];

export type HookVariant = {
  type:
    | "CURIOSITY" | "EMPATHY" | "CONTRARIAN" | "PAIN" | "MISTAKE"
    | "QUESTION" | "CHECKLIST" | "SURPRISE" | "MYTH" | "STORY";
  text: string;
  score: number;
  clickbaitRisk: "LOW" | "MEDIUM" | "HIGH";
  scoreBreakdown: {
    stopPower: number;
    curiosity: number;
    audienceRelevance: number;
    clarity: number;
    specificity: number;
    brandFit: number;
  };
};

export type ContentAngle = {
  type:
    | "PAIN" | "COMMON_MISTAKE" | "SURPRISING_FACT" | "MOVEMENT" | "DAILY_LIFE"
    | "MYTH" | "CHECKLIST" | "BEGINNER" | "EXERCISE" | "PATIENT_EDUCATION";
  title: string;
  description: string;
  targetAudience: string;
  whyItWorks: string;
  expectedHookStrength: number;
  saveValue: number;
  shareValue: number;
  recommendedCardCount: number;
};

export type ImageBrief = {
  slide: number;
  role:
    | "hook_image"
    | "explanatory_diagram"
    | "humorous_concept_illustration"
    | "comparison_visual"
    | "summary_visual";
  description: string;
};

export type CreativeBrief = {
  hooks: HookVariant[];
  contentAngles: ContentAngle[];
  metaphors: string[];
  empathyLines: string[];
  humorLines: string[];
  imageBriefs: ImageBrief[];
  hashtags: HashtagGroups;
  templateKey: TemplateKey;
};

export type HashtagGroups = {
  brand: string[];
  topic: string[];
  audience: string[];
  search: string[];
  niche?: string[];
};

export type InstagramStoryboardCard = {
  cardNumber: number;
  purpose: InstagramCardPurpose;
  headline: string;
  visualType: InstagramVisualType;
  visualDescription: string;
  layout: string;
  emotion: string;
  transition: string;
  imageNeeded: boolean;
};

export type InstagramCaption = {
  hook: string;
  context: string;
  additionalValue: string;
  shortExplanation: string;
  takeaway: string;
  source: string;
  cta: string;
  primaryTopic: string;
  secondaryTopics: string[];
  audienceTerms: string[];
  fullText: string;
};

export type InstagramQuality = {
  total: number;
  scores: {
    hook: number;
    swipe: number;
    clarity: number;
    save: number;
    share: number;
    visual: number;
    textDensity: number;
    brand: number;
    caption: number;
    source: number;
  };
  warnings: Array<{ card: number | null; message: string; severity: "info" | "warning" | "error" }>;
  ready: boolean;
};

export type InstagramEnginePlan = {
  selectedAngleType: ContentAngle["type"];
  selectedHookText: string;
  personality: "STANDARD" | "FRIENDLY" | "PROFESSIONAL" | "PLAYFUL" | "SERIOUS" | "STORYTELLING" | "MYTH_BUSTING";
  targetAudience: string;
  cardCount: number;
  storyboard: InstagramStoryboardCard[];
  caption: InstagramCaption;
  hashtags: HashtagGroups;
  cta: { type: "SAVE" | "SHARE" | "COMMENT" | "FOLLOW" | "NEXT_CONTENT" | "SELF_CHECK"; text: string };
  saveValue: string;
  shareValue: string;
  sourceNotice: string;
  quality: InstagramQuality;
};

export type BrandProfile = {
  brandName: string;
  tagline: string;
  audience: string;
  toneOfVoice: string;
  humorLevel: number;
  expertiseLevel: string;
  visualStyle: string;
  brandColors: string[];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoDataUrl: string;
  watermarkEnabled: boolean;
  ctaStyle: string;
  signatureCta: string;
  sourceCitationStyle: string;
  recurringPhrases: string[];
  recurringContentBlocks: string[];
  hashtagGroups: HashtagGroups;
  cardTemplate: TemplateKey;
  blogTemplate: string;
  imageStyleRules: string[];
  categoryBadgeColors: Record<string, string>;
  instagramSettings: {
    defaultCardMin: number;
    defaultCardMax: number;
    hookStylePreference: string;
    bodyCharacterMode: "OFF" | "LOW" | "MEDIUM";
    ctaPreference: string;
    coverStyle: string;
    imageStyle: string;
    textDensity: "LOW" | "BALANCED" | "DETAILED";
    safeMargin: number;
    badgePosition: string;
    logoPosition: string;
    footerStyle: string;
    sourceCardStyle: string;
    sourceDisplay: "LAST_CARD" | "CAPTION" | "BOTH";
  };
  updatedAt: string;
};

export type NaverEditorSection = {
  id: string;
  title: string;
  content: string;
  locked: boolean;
};

export type ContentVersion = {
  id: string;
  versionNumber: number;
  snapshot: { sections: NaverEditorSection[]; selectedTitle: string; selectedHook: string };
  changeSummary: string;
  createdAt: string;
};

export type ImageAsset = {
  id: string;
  imageType: string;
  purpose: string;
  positionIndex: number;
  caption: string;
  altDescription: string;
  imagePrompt: string;
  brandStyle: string;
  imageDataUrl: string;
  width: number;
  height: number;
  status: string;
};
