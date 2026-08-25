import {
  tagCategories,
  templateKeys,
  type ContentTag,
  type CreateContentInput,
  type Platform,
  type OutputMode,
  type TagCategory,
  type TemplateKey,
} from "@/lib/content/types";

const allowedHosts: Record<Platform, string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  instagram: ["instagram.com", "www.instagram.com"],
};

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export function detectPlatform(sourceUrl: string): Platform {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new InputError("올바른 YouTube 또는 Instagram URL을 입력해 주세요.");
  }

  if (parsed.protocol !== "https:") {
    throw new InputError("출처 URL은 https 주소여야 합니다.");
  }

  const hostname = parsed.hostname.toLowerCase();
  const platform = (Object.entries(allowedHosts) as [Platform, string[]][]).find(
    ([, hosts]) => hosts.includes(hostname),
  )?.[0];

  if (!platform) {
    throw new InputError("YouTube 또는 Instagram 주소만 등록할 수 있습니다.");
  }

  return platform;
}

function cleanText(value: unknown, label: string, minimum = 1): string {
  if (typeof value !== "string") {
    throw new InputError(`${label}을(를) 입력해 주세요.`);
  }
  const cleaned = value.trim();
  if (cleaned.length < minimum) {
    throw new InputError(`${label}은(는) ${minimum}자 이상 입력해 주세요.`);
  }
  return cleaned;
}

function optionalText(value: unknown, fallback: string, maximum: number): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maximum) : fallback;
}

function parseTags(value: unknown): ContentTag[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as { name?: unknown; category?: unknown };
    if (typeof candidate.name !== "string") return [];
    const name = candidate.name.trim().replace(/\s+/g, " ");
    if (!name) return [];
    const category = tagCategories.includes(candidate.category as TagCategory)
      ? (candidate.category as TagCategory)
      : "topic";
    const key = `${category}:${name.toLocaleLowerCase()}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ name: name.slice(0, 60), category }];
  });
}

export function parseCreateContentInput(value: unknown): CreateContentInput {
  if (!value || typeof value !== "object") {
    throw new InputError("등록할 콘텐츠 정보가 필요합니다.");
  }

  const body = value as Record<string, unknown>;
  const sourceUrl = cleanText(body.sourceUrl, "출처 URL");
  detectPlatform(sourceUrl);

  return {
    expertName: optionalText(body.expertName, "확인 필요", 100),
    sourceUrl,
    originalTitle: optionalText(body.originalTitle, "자동 분석 콘텐츠", 240),
    originalScript: optionalText(body.originalScript, "원본 스크립트가 제공되지 않았습니다. 공개 메타데이터와 확인된 근거만 사용합니다.", 100_000),
    templateKey: templateKeys.includes(body.templateKey as TemplateKey)
      ? (body.templateKey as TemplateKey)
      : "carousel_story",
    outputMode: (["instagram", "naver_blog", "both"].includes(String(body.outputMode))
      ? body.outputMode
      : "both") as OutputMode,
    experienceNote:
      typeof body.experienceNote === "string" ? body.experienceNote.trim().slice(0, 3000) : "",
    tags: parseTags(body.tags),
    sourceAnalysisId: typeof body.sourceAnalysisId === "string" ? body.sourceAnalysisId.trim() : "",
  };
}
