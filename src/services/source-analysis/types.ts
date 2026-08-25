import type { Platform } from "@/lib/content/types";

export type SourcePlatform =
  | "YOUTUBE_VIDEO"
  | "YOUTUBE_SHORTS"
  | "INSTAGRAM_POST"
  | "INSTAGRAM_REEL"
  | "INSTAGRAM_CAROUSEL";

export type AnalysisMode = "FAST" | "STANDARD" | "DEEP";
export type EvidenceLevel = "A" | "B" | "C" | "D" | "E";
export type AnalysisQuality = "HIGH" | "MEDIUM" | "LIMITED";
export type EvidenceType = "METADATA" | "DESCRIPTION" | "TRANSCRIPT" | "FRAME" | "USER_SCRIPT" | "USER_NOTE";
export type SuggestionState = "AI_SUGGESTED" | "USER_CONFIRMED" | "USER_MODIFIED" | "LOCKED";

export type SourceMetadata = {
  contentId: string;
  creatorName: string;
  channelName: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  publishedAt: string;
  duration: string;
  defaultLanguage: string;
  audioLanguage: string;
  thumbnailUrl: string;
  statistics: Record<string, number>;
};

export type SourceAvailability = {
  metadata: "AVAILABLE" | "MINIMAL" | "UNAVAILABLE";
  caption: "AVAILABLE" | "UNAVAILABLE" | "AVAILABLE_NOT_AUTHORIZED" | "UNKNOWN";
  media: "UPLOADED" | "AUTHORIZED" | "UNAVAILABLE" | "NOT_PROVIDED";
  transcript: "AVAILABLE" | "UNAVAILABLE" | "NOT_ATTEMPTED";
  frames: "AVAILABLE" | "UNAVAILABLE" | "NOT_ATTEMPTED";
};

export type SourceEvidence = {
  id: string;
  type: EvidenceType;
  locator: string;
  excerpt: string;
  confidence: number;
};

export type TranscriptSegment = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  language: string;
  confidence: number;
};

export type VideoFrame = {
  id: string;
  timestampSeconds: number;
  localPath: string;
  observation: string;
  confidence: number;
};

export type ContentClaim = {
  id: string;
  claim: string;
  evidenceType: EvidenceType;
  evidenceIds: string[];
  timestampSeconds: number | null;
  frameId: string | null;
  confidence: number;
  sourceLanguage: string;
  status: "EXTRACTED" | "USER_CONFIRMED" | "USER_EDITED" | "REJECTED";
};

export type ClassificationValue = {
  id: string;
  value: string;
  confidence: number;
  state: SuggestionState;
  evidenceIds: string[];
  primary: boolean;
  locked: boolean;
};

export type KeywordSet = {
  primary: ClassificationValue[];
  secondary: ClassificationValue[];
  longTail: ClassificationValue[];
  related: ClassificationValue[];
};

export type ContentClassification = {
  bodyRegions: ClassificationValue[];
  symptoms: ClassificationValue[];
  movements: ClassificationValue[];
  biomechanics: ClassificationValue[];
  exercises: ClassificationValue[];
  audiences: ClassificationValue[];
  purposes: ClassificationValue[];
  difficulty: ClassificationValue[];
  searchIntentsKr: ClassificationValue[];
  searchIntentsEn: ClassificationValue[];
  keywords: {
    naver: KeywordSet;
    instagramKr: KeywordSet;
    instagramEn: KeywordSet;
    englishBlog: KeywordSet;
  };
  topicClusters: ClassificationValue[];
  seriesSuggestions: Array<ClassificationValue & { reason: string }>;
};

export type SourceAnalysis = {
  id: string;
  contentId: string | null;
  sourceUrl: string;
  normalizedUrl: string;
  platform: Platform;
  sourcePlatform: SourcePlatform;
  platformContentId: string;
  sourceRevision: string;
  cacheKey: string;
  mode: AnalysisMode;
  provider: string;
  status: "COMPLETE" | "PARTIAL" | "FAILED";
  errorCode: string | null;
  userMessage: string;
  metadata: SourceMetadata;
  availability: SourceAvailability;
  evidenceLevel: EvidenceLevel;
  quality: AnalysisQuality;
  confidence: number;
  sourceLanguage: string;
  availableText: string;
  evidence: SourceEvidence[];
  transcript: TranscriptSegment[];
  frames: VideoFrame[];
  claims: ContentClaim[];
  classification: ContentClassification;
  createdAt: string;
  updatedAt: string;
};

export type AnalyzeSourceInput = {
  sourceUrl: string;
  mode: AnalysisMode;
  expertName?: string;
  script?: string;
  caption?: string;
  note?: string;
  experienceNote?: string;
  mediaFile?: File | null;
  force?: boolean;
};

export interface SourceAnalysisProvider {
  readonly name: string;
  analyze(input: AnalyzeSourceInput): Promise<Pick<SourceAnalysis,
    "normalizedUrl" | "platform" | "sourcePlatform" | "platformContentId" |
    "sourceRevision" | "metadata" | "availability" | "provider" | "errorCode" | "userMessage"
  >>;
}
