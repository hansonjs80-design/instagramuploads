import type { Platform } from "@/lib/content/types";
import type { SourcePlatform } from "@/services/source-analysis/types";

export class SourceAnalysisInputError extends Error {
  constructor(message: string) { super(message); this.name = "SourceAnalysisInputError"; }
}

export type DetectedSource = {
  normalizedUrl: string;
  platform: Platform;
  sourcePlatform: SourcePlatform;
  platformContentId: string;
};

export function detectSource(sourceUrl: string): DetectedSource {
  let url: URL;
  try {
    url = new URL(sourceUrl.trim());
  } catch {
    throw new SourceAnalysisInputError("올바른 YouTube 또는 Instagram URL을 입력해 주세요.");
  }
  if (url.protocol !== "https:") throw new SourceAnalysisInputError("콘텐츠 링크는 https 주소여야 합니다.");

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (!id) throw new SourceAnalysisInputError("YouTube 영상 ID를 확인할 수 없습니다.");
    return youtubeResult(id, false);
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const isShort = segments[0] === "shorts";
    const id = isShort ? segments[1] : url.searchParams.get("v") ?? (segments[0] === "embed" ? segments[1] : "");
    if (!id) throw new SourceAnalysisInputError("YouTube 영상 ID를 확인할 수 없습니다.");
    return youtubeResult(id, isShort);
  }
  if (host === "instagram.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const kind = segments[0];
    const id = segments[1] ?? "";
    if (!id || !["p", "reel", "reels", "tv"].includes(kind)) {
      throw new SourceAnalysisInputError("Instagram 게시물 또는 Reel 링크를 입력해 주세요.");
    }
    const sourcePlatform: SourcePlatform = kind === "reel" || kind === "reels" || kind === "tv"
      ? "INSTAGRAM_REEL"
      : "INSTAGRAM_POST";
    return {
      normalizedUrl: `https://www.instagram.com/${kind === "reels" ? "reel" : kind}/${id}/`,
      platform: "instagram",
      sourcePlatform,
      platformContentId: id,
    };
  }
  throw new SourceAnalysisInputError("YouTube 또는 Instagram 콘텐츠 링크만 분석할 수 있습니다.");
}

function youtubeResult(id: string, isShort: boolean): DetectedSource {
  return {
    normalizedUrl: `https://www.youtube.com/watch?v=${id}`,
    platform: "youtube",
    sourcePlatform: isShort ? "YOUTUBE_SHORTS" : "YOUTUBE_VIDEO",
    platformContentId: id,
  };
}
