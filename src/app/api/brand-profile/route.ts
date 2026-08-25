import { NextResponse } from "next/server";
import { templateKeys, type BrandProfile, type HashtagGroups, type TemplateKey } from "@/lib/content/types";
import { getBrandProfile, saveBrandProfile } from "@/lib/db/repository";

export const runtime = "nodejs";

function text(value: unknown, label: string, max = 500): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}을(를) 입력해 주세요.`);
  return value.trim().slice(0, max);
}

function stringList(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

export async function GET() {
  return NextResponse.json({ profile: await getBrandProfile() });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<BrandProfile>;
    const humor = Number(body.humorLevel);
    const colors = body.categoryBadgeColors && typeof body.categoryBadgeColors === "object"
      ? Object.fromEntries(
          Object.entries(body.categoryBadgeColors)
            .filter(([, color]) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color))
            .slice(0, 20),
        )
      : {};
    const hashtags = (body.hashtagGroups ?? {}) as Partial<HashtagGroups>;
    const template = templateKeys.includes(body.cardTemplate as TemplateKey)
      ? (body.cardTemplate as TemplateKey)
      : "carousel_story";
    const profile = await saveBrandProfile({
      brandName: text(body.brandName, "브랜드 이름", 100),
      tagline: text(body.tagline, "태그라인", 240),
      audience: text(body.audience, "대상 독자"),
      toneOfVoice: text(body.toneOfVoice, "목소리"),
      humorLevel: Number.isFinite(humor) ? Math.max(0, Math.min(5, humor)) : 2.5,
      expertiseLevel: text(body.expertiseLevel, "전문성 수준"),
      visualStyle: text(body.visualStyle, "시각 스타일"),
      brandColors: [],
      primaryColor: /^#[0-9a-f]{6}$/i.test(body.primaryColor ?? "") ? body.primaryColor! : "#203A5B",
      secondaryColor: /^#[0-9a-f]{6}$/i.test(body.secondaryColor ?? "") ? body.secondaryColor! : "#88C9C1",
      accentColor: /^#[0-9a-f]{6}$/i.test(body.accentColor ?? "") ? body.accentColor! : "#F28C7B",
      fontFamily: text(body.fontFamily, "폰트", 200),
      logoDataUrl: typeof body.logoDataUrl === "string" && body.logoDataUrl.length < 7_000_000 ? body.logoDataUrl : "",
      watermarkEnabled: Boolean(body.watermarkEnabled),
      ctaStyle: text(body.ctaStyle, "CTA 스타일"),
      signatureCta: text(body.signatureCta, "고정 CTA"),
      sourceCitationStyle: text(body.sourceCitationStyle, "출처 표기 스타일"),
      recurringPhrases: stringList(body.recurringPhrases),
      recurringContentBlocks: stringList(body.recurringContentBlocks),
      hashtagGroups: {
        brand: stringList(hashtags.brand),
        topic: stringList(hashtags.topic, 30),
        audience: stringList(hashtags.audience, 30),
        search: stringList(hashtags.search, 40),
        niche: stringList(hashtags.niche, 30),
      },
      cardTemplate: template,
      blogTemplate: text(body.blogTemplate, "블로그 템플릿"),
      imageStyleRules: stringList(body.imageStyleRules, 20),
      categoryBadgeColors: colors,
      instagramSettings: {
        defaultCardMin: Math.max(5, Math.min(9, Number(body.instagramSettings?.defaultCardMin) || 5)),
        defaultCardMax: Math.max(5, Math.min(9, Number(body.instagramSettings?.defaultCardMax) || 9)),
        hookStylePreference: body.instagramSettings?.hookStylePreference || "공감과 궁금증의 균형",
        bodyCharacterMode: ["OFF", "LOW", "MEDIUM"].includes(body.instagramSettings?.bodyCharacterMode ?? "") ? body.instagramSettings!.bodyCharacterMode : "LOW",
        ctaPreference: body.instagramSettings?.ctaPreference || "SAVE",
        coverStyle: body.instagramSettings?.coverStyle || "bold editorial",
        imageStyle: body.instagramSettings?.imageStyle || "clean medical illustration",
        textDensity: ["LOW", "BALANCED", "DETAILED"].includes(body.instagramSettings?.textDensity ?? "") ? body.instagramSettings!.textDensity : "BALANCED",
        safeMargin: Math.max(48, Math.min(140, Number(body.instagramSettings?.safeMargin) || 72)),
        badgePosition: body.instagramSettings?.badgePosition || "top-left",
        logoPosition: body.instagramSettings?.logoPosition || "bottom-left",
        footerStyle: body.instagramSettings?.footerStyle || "compact",
        sourceCardStyle: body.instagramSettings?.sourceCardStyle || "clean",
        sourceDisplay: ["LAST_CARD", "CAPTION", "BOTH"].includes(body.instagramSettings?.sourceDisplay ?? "") ? body.instagramSettings!.sourceDisplay : "BOTH",
      },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "브랜드 프로필 저장에 실패했습니다." },
      { status: 400 },
    );
  }
}
