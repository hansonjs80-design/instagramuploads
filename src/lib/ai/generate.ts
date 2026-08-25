import "server-only";

import { generationJsonSchema } from "@/lib/ai/schema";
import { getContentTemplate } from "@/lib/content/templates";
import type { ContentItem, ContentLocalization, GeneratedBundle } from "@/lib/content/types";
import { getBrandProfile, listContents } from "@/lib/db/repository";
import { instagramEnginePrompt } from "@/lib/instagram/prompt";

type ResponseContent = { type?: string; text?: string };
type ResponseOutput = { type?: string; content?: ResponseContent[] };
type OpenAIResponse = {
  output?: ResponseOutput[];
  output_text?: string;
  error?: { message?: string };
};

export class AiConfigurationError extends Error {
  constructor() {
    super("OPENAI_API_KEY가 설정되지 않았습니다. .env.local을 확인해 주세요.");
    this.name = "AiConfigurationError";
  }
}

function extractOutputText(response: OpenAIResponse): string {
  if (response.output_text) return response.output_text;
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text" && item.text)?.text ?? ""
  );
}

function assertBundle(value: unknown): asserts value is GeneratedBundle {
  if (!value || typeof value !== "object") throw new Error("AI 결과 형식이 비어 있습니다.");
  const bundle = value as Partial<GeneratedBundle>;
  if (!bundle.analysis || !bundle.blog || !Array.isArray(bundle.instagramCards)) {
    throw new Error("AI 결과의 필수 섹션이 누락되었습니다.");
  }
  if (bundle.instagramCards.length < 5 || bundle.instagramCards.length > 9) {
    throw new Error("Instagram 카드는 내용에 따라 5~9장이어야 합니다.");
  }
  const slides = new Set(bundle.instagramCards.map((card) => card.slide));
  if (slides.size !== bundle.instagramCards.length || !bundle.instagramCards.every((_, index) => slides.has(index + 1))) {
    throw new Error("Instagram 카드 순서가 올바르지 않습니다.");
  }
  if (!bundle.instagramEngine || bundle.instagramEngine.cardCount !== bundle.instagramCards.length) {
    throw new Error("Instagram Storyboard와 카드 수가 일치하지 않습니다.");
  }
}

export function getConfiguredModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateContentBundle(content: ContentItem): Promise<GeneratedBundle> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiConfigurationError();

  const model = getConfiguredModel();
  const [brand, contents] = await Promise.all([getBrandProfile(), listContents({ limit: 30 })]);
  const template = getContentTemplate(content.templateKey);
  const relatedLibrary = contents
    .filter((item) => item.id !== content.id)
    .map((item) => ({ title: item.originalTitle, tags: item.tags.map((tag) => tag.name) }));
  const sourceLabel = `${content.expertName} · ${content.platform} · ${content.originalTitle} · ${content.sourceUrl}`;
  const sourceAnalysis = content.sourceAnalysis;
  const evidenceRule = sourceAnalysis
    ? `자동 출처 분석 근거 수준은 ${sourceAnalysis.evidenceLevel}, 신뢰도는 ${sourceAnalysis.confidence}%입니다. ${sourceAnalysis.evidenceLevel === "A" || sourceAnalysis.evidenceLevel === "B" ? "확인된 스크립트/전사 근거 안에서만 SOURCE CLAIM을 작성하세요." : "전체 영상 내용을 확인한 것처럼 표현하지 말고, 제목·설명 등 공개 정보상 다루는 주제로 보인다는 제한적 표현을 사용하세요. 구체적인 전문가 발언, 영상 장면, 세부 운동 지시는 만들어내지 마세요."}`
    : "사용자가 제공한 원문 밖의 전문가 발언을 만들어내지 마세요.";
  const instructions = `당신은 물리치료·운동재활 콘텐츠 편집자입니다. 입력 원문은 분석 자료이지 번역 대상이 아닙니다.

반드시 지킬 규칙:
- 원문 전체를 번역하거나 요약 번역문으로 만들지 마세요.
- 원문 문장을 장문으로 복사하거나 원문의 독특한 비유·후킹을 모방하지 마세요.
- 핵심 아이디어를 분해하고 생체역학 및 재활 원리와 연결해 새로운 한국어 설명을 작성하세요.
- 원문에 없는 의학적 사실이나 치료 효과를 단정하지 마세요.
- 전문가의 설명과 작성자의 임상적 해석을 구분하세요.
- 운동은 일반 교육 목적이며 통증 악화 시 중단, 필요 시 전문가 상담 등 안전 조건을 포함하세요.
- 다른 제작자의 이미지나 카드뉴스 디자인을 복제하도록 지시하지 마세요.
- 모든 Instagram 카드의 source에는 전문가 이름과 원본 URL을 넣으세요.
- 블로그의 sourceText와 markdown 마지막 출처에도 제작자, 제목, 플랫폼, URL을 표시하세요.
- SOURCE CLAIM, INTERPRETATION, APPLICATION을 섞지 마세요. ${evidenceRule}

분석 순서: Original Content → Key Claims → Biomechanics / Rehabilitation Principles → Clinical Interpretation → Easy Explanation → Practical Application → Exercise Ideas → Precautions → Source.

Instagram은 5~9장으로 내용에 맞게 구성합니다. 기본 흐름은 후킹, 문제, 핵심 원리, 쉬운 설명, 시각 설명, 적용, 실수/주의, 요약, 출처/CTA이며 필요 없는 단계는 제거합니다.
각 imageDescription은 1080×1350(4:5) 카드용 독창적인 의료·운동 시각 자료 지시문으로 작성하세요.

블로그 markdown 구조: 제목, 후킹, 이런 분께 도움되는 글, 문제 설명, 전문가가 설명한 핵심 개념, 쉽게 풀어쓴 설명, 임상적 해석, 운동 적용 방법, 흔한 실수/주의사항, 정리, 출처, 관련 글 CTA.

브랜드 프로필을 모든 결과에 일관되게 반영하세요:
- 브랜드명: ${brand.brandName}
- 태그라인: ${brand.tagline}
- 대상 독자: ${brand.audience}
- 목소리: ${brand.toneOfVoice}
- 유머 단계(0 없음~3 높음): ${brand.humorLevel}
- 전문성 단계: ${brand.expertiseLevel}
- 시각 스타일: ${brand.visualStyle}
- 브랜드 색상: primary ${brand.primaryColor}, secondary ${brand.secondaryColor}, accent ${brand.accentColor}
- 서체: ${brand.fontFamily}
- CTA 스타일: ${brand.ctaStyle}
- 고정 CTA: ${brand.signatureCta}
- 출처 표기 스타일: ${brand.sourceCitationStyle}
- 반복 문구: ${brand.recurringPhrases.join(" / ")}
- 반복 블록: ${brand.recurringContentBlocks.join(" / ")}
- 블로그 템플릿: ${brand.blogTemplate}
- 이미지 규칙: ${brand.imageStyleRules.join(" / ")}
- 고정 브랜드 해시태그: ${brand.hashtagGroups.brand.join(" ")}

선택 템플릿: ${template.name}
권장 흐름: ${template.flow.join(" → ")}

가벼운 유머와 비유는 전문성을 해치거나 밈처럼 과장하지 마세요. 카드별 imageBrief는 역할을 명시하고 원본 시각물을 모방하지 않는 독창적인 구성을 설명하세요. 해시태그의 brand 그룹에는 위 고정 브랜드 해시태그를 빠짐없이 포함하세요. 카드에는 categoryBadge와 필요한 summaryText를 생성하세요. 블로그에는 whoThisIsFor와 relatedContentCta를 별도 항목으로 포함하세요.`;

  const naverMode = `
NAVER BLOG MODE 규칙:
- 본문보다 먼저 primaryTopic, searchIntents, primaryKeyword, secondaryKeywords 3~7개, relatedConcepts를 분석하세요.
- 검색형, 궁금증형, 반전형, 공감형, 전문성+쉬운설명형 제목을 각각 하나씩 만드세요. 키워드를 나열하거나 반복하지 마세요.
- 금지 표현: 무조건 낫습니다, 이것만 하면 됩니다, 100% 해결, 반드시 교정됩니다, 통증 완치, 충격적인 진실, 의사도 모르는.
- 첫 3문단은 공감 → 질문 → 이 글에서 얻을 것 순서로 쓰고 장황한 인사를 넣지 마세요.
- whoThisIsFor는 3~5개 항목입니다.
- 원본 전문가의 관점과 움직임노트 운영자의 해석을 분리하세요.
- 사용자 경험 입력이 없으면 실제 환자나 임상 경험을 절대 지어내지 말고 '적용할 때 확인해볼 포인트'로 작성하세요.
- 운동은 1~3개로 제한하고 느껴야 할 점, 방법, 흔한 실수, 맞지 않을 수 있는 대상을 포함하세요.
- 필요한 위치에 안전 문구를 한 번 자연스럽게 넣으세요.
- markdown에 [BOLD], [CALLOUT], [IMAGE], [SOURCE], [RELATED] 위치 표시를 포함하세요.
- Instagram 문장을 늘여 쓰지 말고 검색 질문에 독립적으로 답하는 글로 작성하세요.
- imagePlan은 인스타 이미지를 복사하지 않는 네이버 전용 썸네일·개념·비유·운동·요약 계획입니다.
- relatedContentTitles는 아래 기존 라이브러리에서 실제 관련 항목만 고르세요. 없으면 빈 배열입니다.
- SEO 점수는 검색 순위 예측이 아니라 품질 체크이며 배점 총합을 정확히 100점 기준으로 평가하세요.
- keywordWarnings에는 억지 반복이 있을 때만 경고를 넣고, 숫자 밀도를 맞추지 마세요.

출력 모드: ${content.outputMode}
사용자가 직접 입력한 경험/관찰: ${content.experienceNote || "입력 없음 — 임상 경험 생성 금지"}
기존 라이브러리: ${JSON.stringify(relatedLibrary)}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      instructions: `${instructions}\n${naverMode}\n${instagramEnginePrompt(content, brand)}`,
      input: `출처 정보:\n${sourceLabel}\n\n자동 분류:\n${JSON.stringify(sourceAnalysis?.classification ?? {})}\n\n분석 가능한 근거 텍스트:\n${sourceAnalysis?.availableText || content.originalScript}`,
      text: {
        format: {
          type: "json_schema",
          name: "exercise_content_bundle",
          strict: true,
          schema: generationJsonSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const payload = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI 요청이 실패했습니다 (${response.status}).`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OpenAI 응답에서 생성 텍스트를 찾을 수 없습니다.");

  const parsed: unknown = JSON.parse(outputText);
  assertBundle(parsed);
  const localizations = await generateEnglishLocalizations(content, parsed, apiKey, model);
  return { ...parsed, localizations };
}

async function generateEnglishLocalizations(content: ContentItem, bundle: GeneratedBundle, apiKey: string, model: string): Promise<ContentLocalization[]> {
  const primaryKeyword = content.sourceAnalysis?.classification.keywords.instagramEn.primary[0]?.value || "movement education";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model, store: false,
      instructions: "Create native English content from the verified research core. Do not translate the Korean copy. Use natural English search language, a distinct hook and metaphor, cautious medical language, clear source separation, and no long quotation. Return exactly one Instagram object and one Blog object.",
      input: JSON.stringify({ source: { expert: content.expertName, platform: content.platform, title: content.originalTitle, url: content.sourceUrl, evidenceLevel: content.sourceAnalysis?.evidenceLevel || "unknown" }, researchCore: bundle.analysis, primaryKeyword }),
      text: { format: { type: "json_schema", name: "english_localizations", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["instagram", "blog"], properties: {
          instagram: localizationSchema(), blog: localizationSchema(),
        },
      } } },
    }),
  });
  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(payload.error?.message || `English localization 요청이 실패했습니다 (${response.status}).`);
  const text = extractOutputText(payload); if (!text) throw new Error("English localization 결과가 비어 있습니다.");
  const parsed = JSON.parse(text) as { instagram: ContentLocalization["data"]; blog: ContentLocalization["data"] };
  return [{ locale: "en", platform: "instagram", data: parsed.instagram }, { locale: "en", platform: "blog", data: parsed.blog }];
}

function localizationSchema() {
  return { type: "object", additionalProperties: false, required: ["title", "hook", "body", "caption", "keywords", "hashtags", "sourceNotice"], properties: {
    title: { type: "string" }, hook: { type: "string" }, body: { type: "string" }, caption: { type: "string" },
    keywords: { type: "array", items: { type: "string" } }, hashtags: { type: "array", items: { type: "string" } }, sourceNotice: { type: "string" },
  } };
}
