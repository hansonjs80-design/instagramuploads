import { createHash } from "node:crypto";
import type { AnalyzeSourceInput, SourceAnalysisProvider, SourceMetadata } from "@/services/source-analysis/types";
import { detectSource } from "@/services/source-analysis/platform-detector";

type YoutubeVideoResponse = {
  items?: Array<{
    snippet?: { channelTitle?: string; title?: string; description?: string; tags?: string[]; categoryId?: string; publishedAt?: string; defaultLanguage?: string; defaultAudioLanguage?: string; thumbnails?: Record<string, { url?: string }> };
    contentDetails?: { duration?: string; caption?: string };
    statistics?: Record<string, string>;
  }>;
  error?: { message?: string };
};

export class YoutubeAnalyzer implements SourceAnalysisProvider {
  readonly name = "YOUTUBE_OFFICIAL";

  async analyze(input: AnalyzeSourceInput) {
    const detected = detectSource(input.sourceUrl);
    if (detected.platform !== "youtube") throw new Error("YouTube 링크가 아닙니다.");
    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (apiKey) return this.withDataApi(input, detected, apiKey);
    return this.withOembed(input, detected);
  }

  private async withDataApi(input: AnalyzeSourceInput, detected: ReturnType<typeof detectSource>, apiKey: string) {
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.searchParams.set("part", "snippet,contentDetails,statistics");
    endpoint.searchParams.set("id", detected.platformContentId);
    endpoint.searchParams.set("key", apiKey);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(12_000) });
    const payload = await response.json() as YoutubeVideoResponse;
    if (!response.ok) throw new Error(payload.error?.message || `YouTube metadata 요청 실패 (${response.status})`);
    const video = payload.items?.[0];
    if (!video) throw new Error("YouTube 영상 공개 정보를 찾을 수 없습니다.");
    const snippet = video.snippet ?? {};
    const metadata = baseMetadata(detected.platformContentId, input.expertName);
    metadata.creatorName = input.expertName?.trim() || snippet.channelTitle || "확인 필요";
    metadata.channelName = snippet.channelTitle || "";
    metadata.title = snippet.title || "제목 확인 필요";
    metadata.description = snippet.description || "";
    metadata.tags = snippet.tags ?? [];
    metadata.category = snippet.categoryId || "";
    metadata.publishedAt = snippet.publishedAt || "";
    metadata.duration = video.contentDetails?.duration || "";
    metadata.defaultLanguage = snippet.defaultLanguage || "";
    metadata.audioLanguage = snippet.defaultAudioLanguage || "";
    metadata.thumbnailUrl = bestThumbnail(snippet.thumbnails);
    metadata.statistics = Object.fromEntries(Object.entries(video.statistics ?? {}).flatMap(([key, value]) => {
      const number = Number(value); return Number.isFinite(number) ? [[key, number]] : [];
    }));
    const caption = video.contentDetails?.caption === "true" ? "AVAILABLE_NOT_AUTHORIZED" as const : "UNAVAILABLE" as const;
    return {
      ...detected,
      sourceRevision: revision(metadata), metadata,
      availability: { metadata: "AVAILABLE" as const, caption, media: input.mediaFile ? "UPLOADED" as const : "NOT_PROVIDED" as const, transcript: "NOT_ATTEMPTED" as const, frames: "NOT_ATTEMPTED" as const },
      provider: this.name, errorCode: caption === "AVAILABLE_NOT_AUTHORIZED" ? "CAPTION_NOT_AUTHORIZED" : null,
      userMessage: caption === "AVAILABLE_NOT_AUTHORIZED"
        ? "자막 존재 여부는 확인했지만 현재 권한으로 자막 본문을 다운로드할 수 없습니다. 공개 메타데이터로 분석했습니다."
        : "YouTube 공개 메타데이터를 분석했습니다.",
    };
  }

  private async withOembed(input: AnalyzeSourceInput, detected: ReturnType<typeof detectSource>) {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("url", detected.normalizedUrl);
    endpoint.searchParams.set("format", "json");
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(String(response.status));
      const payload = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
      const metadata = baseMetadata(detected.platformContentId, input.expertName);
      metadata.creatorName = input.expertName?.trim() || payload.author_name || "확인 필요";
      metadata.channelName = payload.author_name || "";
      metadata.title = payload.title || "제목 확인 필요";
      metadata.thumbnailUrl = payload.thumbnail_url || "";
      return {
        ...detected, sourceRevision: revision(metadata), metadata,
        availability: { metadata: "MINIMAL" as const, caption: "UNKNOWN" as const, media: input.mediaFile ? "UPLOADED" as const : "NOT_PROVIDED" as const, transcript: "NOT_ATTEMPTED" as const, frames: "NOT_ATTEMPTED" as const },
        provider: "YOUTUBE_OEMBED", errorCode: "METADATA_ONLY",
        userMessage: "YouTube API 키가 없어 제목·제작자·썸네일 등 최소 공개 정보로 분석했습니다.",
      };
    } catch {
      const metadata = baseMetadata(detected.platformContentId, input.expertName);
      return { ...detected, sourceRevision: revision(metadata), metadata,
        availability: { metadata: "MINIMAL" as const, caption: "UNKNOWN" as const, media: input.mediaFile ? "UPLOADED" as const : "NOT_PROVIDED" as const, transcript: "NOT_ATTEMPTED" as const, frames: "NOT_ATTEMPTED" as const },
        provider: "URL_ONLY", errorCode: "METADATA_ONLY", userMessage: "링크는 확인했지만 공개 메타데이터에 접근하지 못했습니다. URL 정보와 사용자가 추가한 자료만 분석합니다." };
    }
  }
}

function baseMetadata(contentId: string, expertName?: string): SourceMetadata {
  return { contentId, creatorName: expertName?.trim() || "확인 필요", channelName: "", title: "제목 확인 필요", description: "", tags: [], category: "", publishedAt: "", duration: "", defaultLanguage: "", audioLanguage: "", thumbnailUrl: "", statistics: {} };
}
function revision(metadata: SourceMetadata): string { return createHash("sha256").update(`${metadata.title}|${metadata.publishedAt}|${metadata.description}`).digest("hex").slice(0, 16); }
function bestThumbnail(thumbnails?: Record<string, { url?: string }>): string { return thumbnails?.maxres?.url || thumbnails?.standard?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || ""; }
