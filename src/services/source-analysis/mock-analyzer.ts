import type { AnalyzeSourceInput, SourceAnalysisProvider } from "@/services/source-analysis/types";
import { detectSource } from "@/services/source-analysis/platform-detector";

export class MockSourceProvider implements SourceAnalysisProvider {
  readonly name = "MOCK";
  constructor(private readonly scenario: "METADATA_ONLY" | "FULL" | "PRIVATE" = "FULL") {}
  async analyze(input: AnalyzeSourceInput) {
    const detected = detectSource(input.sourceUrl);
    return {
      ...detected, sourceRevision: `mock-${this.scenario.toLocaleLowerCase()}`, provider: this.name,
      status: undefined,
      metadata: { contentId: detected.platformContentId, creatorName: input.expertName || "Movement Expert", channelName: "Movement Lab", title: "Foot pronation and big toe pressure", description: this.scenario === "PRIVATE" ? "" : "How foot pronation changes pressure while walking", tags: ["foot", "walking", "pronation"], category: "Education", publishedAt: "2026-08-01T00:00:00Z", duration: "PT5M", defaultLanguage: "en", audioLanguage: "en", thumbnailUrl: "https://example.com/thumb.jpg", statistics: {} },
      availability: { metadata: this.scenario === "PRIVATE" ? "MINIMAL" as const : "AVAILABLE" as const, caption: this.scenario === "FULL" ? "AVAILABLE_NOT_AUTHORIZED" as const : "UNKNOWN" as const, media: input.mediaFile ? "UPLOADED" as const : "NOT_PROVIDED" as const, transcript: "NOT_ATTEMPTED" as const, frames: "NOT_ATTEMPTED" as const },
      errorCode: this.scenario === "PRIVATE" ? "PRIVATE_CONTENT" : this.scenario === "METADATA_ONLY" ? "METADATA_ONLY" : null,
      userMessage: this.scenario === "PRIVATE" ? "비공개 콘텐츠라 최소 링크 정보만 확인했습니다." : "Mock 공개 메타데이터 분석 완료",
    };
  }
}
