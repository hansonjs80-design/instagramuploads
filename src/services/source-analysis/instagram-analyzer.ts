import { createHash } from "node:crypto";
import type { AnalyzeSourceInput, SourceAnalysisProvider, SourceMetadata } from "@/services/source-analysis/types";
import { detectSource } from "@/services/source-analysis/platform-detector";

export class InstagramAnalyzer implements SourceAnalysisProvider {
  readonly name = "INSTAGRAM_OFFICIAL_OEMBED";

  async analyze(input: AnalyzeSourceInput) {
    const detected = detectSource(input.sourceUrl);
    if (detected.platform !== "instagram") throw new Error("Instagram 링크가 아닙니다.");
    const accessToken = process.env.META_OEMBED_ACCESS_TOKEN?.trim();
    const metadata = emptyMetadata(detected.platformContentId, input.expertName);
    if (!accessToken) return minimal(input, detected, metadata, "Instagram 공개 콘텐츠 분석용 Meta 토큰이 없어 링크와 사용자가 추가한 자료만 분석합니다.");

    try {
      const version = process.env.INSTAGRAM_API_VERSION?.trim() || "v24.0";
      const endpoint = new URL(`https://graph.facebook.com/${version}/instagram_oembed`);
      endpoint.searchParams.set("url", detected.normalizedUrl);
      endpoint.searchParams.set("access_token", accessToken);
      endpoint.searchParams.set("omitscript", "true");
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(12_000) });
      const payload = await response.json() as { author_name?: string; title?: string; thumbnail_url?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || String(response.status));
      metadata.creatorName = input.expertName?.trim() || payload.author_name || "확인 필요";
      metadata.channelName = payload.author_name || "";
      metadata.title = payload.title || "Instagram 콘텐츠";
      metadata.thumbnailUrl = payload.thumbnail_url || "";
      return { ...detected, sourceRevision: hash(metadata), metadata,
        availability: { metadata: "MINIMAL" as const, caption: "UNKNOWN" as const, media: input.mediaFile ? "UPLOADED" as const : "NOT_PROVIDED" as const, transcript: "NOT_ATTEMPTED" as const, frames: "NOT_ATTEMPTED" as const },
        provider: this.name, errorCode: "METADATA_ONLY", userMessage: "Instagram 공식 oEmbed 공개 정보로 분석했습니다. 게시물 본문·영상은 계정 권한이나 사용자가 추가한 자료가 있을 때만 분석합니다." };
    } catch {
      return minimal(input, detected, metadata, "Instagram 링크는 확인했지만 공식 API 공개 정보에 접근하지 못했습니다. 링크와 사용자가 추가한 자료만 분석합니다.");
    }
  }
}

function emptyMetadata(contentId: string, expertName?: string): SourceMetadata {
  return { contentId, creatorName: expertName?.trim() || "확인 필요", channelName: "", title: "Instagram 콘텐츠", description: "", tags: [], category: "", publishedAt: "", duration: "", defaultLanguage: "", audioLanguage: "", thumbnailUrl: "", statistics: {} };
}
function hash(metadata: SourceMetadata) { return createHash("sha256").update(`${metadata.title}|${metadata.creatorName}`).digest("hex").slice(0, 16); }
function minimal(input: AnalyzeSourceInput, detected: ReturnType<typeof detectSource>, metadata: SourceMetadata, userMessage: string) {
  return { ...detected, sourceRevision: hash(metadata), metadata,
    availability: { metadata: "MINIMAL" as const, caption: "UNKNOWN" as const, media: input.mediaFile ? "UPLOADED" as const : "NOT_PROVIDED" as const, transcript: "NOT_ATTEMPTED" as const, frames: "NOT_ATTEMPTED" as const },
    provider: "URL_ONLY", errorCode: "METADATA_ONLY", userMessage };
}
