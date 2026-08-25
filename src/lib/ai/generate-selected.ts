import "server-only";

import { generationJsonSchema } from "@/lib/ai/schema";
import { AiConfigurationError, getConfiguredModel } from "@/lib/ai/generate";
import type {
  ContentItem,
  CoreResearchResult,
  InstagramOutputData,
  NaverOutputData,
  OutputType,
} from "@/lib/content/types";
import { getBrandProfile, listContents } from "@/lib/db/repository";

type OpenAIResponse = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  output_text?: string;
  error?: { message?: string };
};

const schemaProperties = generationJsonSchema.properties;
const coreResearchSchema = {
  type: "object", additionalProperties: false, required: ["analysis", "suggestedTags"],
  properties: { analysis: schemaProperties.analysis, suggestedTags: schemaProperties.suggestedTags },
  $defs: generationJsonSchema.$defs,
} as const;
const naverOutputSchema = {
  type: "object", additionalProperties: false, required: ["blog"],
  properties: { blog: schemaProperties.blog }, $defs: generationJsonSchema.$defs,
} as const;
const instagramOutputSchema = {
  type: "object", additionalProperties: false, required: ["instagramCards", "instagramEngine", "creative"],
  properties: {
    instagramCards: schemaProperties.instagramCards,
    instagramEngine: schemaProperties.instagramEngine,
    creative: schemaProperties.creative,
  },
  $defs: generationJsonSchema.$defs,
} as const;

function responseText(payload: OpenAIResponse): string {
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text" && item.text)?.text ?? "";
}

async function structuredRequest<T>(name: string, instructions: string, input: unknown, schema: object): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AiConfigurationError();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getConfiguredModel(), store: false, instructions,
      input: JSON.stringify(input),
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI 요청이 실패했습니다 (${response.status}).`);
  const text = responseText(payload);
  if (!text) throw new Error("OpenAI 응답이 비어 있습니다.");
  return JSON.parse(text) as T;
}

function sharedInput(content: ContentItem, core?: CoreResearchResult["analysis"]) {
  const source = content.sourceAnalysis;
  return {
    source: {
      expert: content.expertName, platform: content.platform, title: content.originalTitle,
      url: content.sourceUrl, evidenceLevel: source?.evidenceLevel ?? "UNKNOWN",
      confidence: source?.confidence ?? 0, availableText: source?.availableText || content.originalScript,
    },
    classification: source?.classification ?? {},
    experienceNote: content.experienceNote || "",
    coreResearch: core,
  };
}

const safetyRules = `원문을 번역·재게시하거나 긴 문장을 복사하지 마세요. SOURCE CLAIM, INTERPRETATION, APPLICATION을 분리하세요.
근거 수준이 낮으면 전문가 발언을 단정하거나 구체적인 장면·운동 지시를 만들어내지 마세요.
완치, 100%, 무조건, 반드시 치료 같은 의료 단정과 공포성 표현을 사용하지 마세요.
출처 제작자, 플랫폼, 원본 제목, URL을 명확하게 표시하고 독창적인 설명과 시각 브리프를 만드세요.`;

export async function getOrCreateCoreResearch(content: ContentItem): Promise<{ result: CoreResearchResult; reused: boolean }> {
  if (content.analysis) {
    const analysis = {
      keyClaims: content.analysis.keyClaims,
      biomechanicsPrinciples: content.analysis.biomechanicsPrinciples,
      clinicalInterpretation: content.analysis.clinicalInterpretation,
      easyExplanation: content.analysis.easyExplanation,
      practicalApplication: content.analysis.practicalApplication,
      exerciseIdeas: content.analysis.exerciseIdeas,
      precautions: content.analysis.precautions,
    };
    return { result: { analysis, suggestedTags: [] }, reused: true };
  }
  const result = await structuredRequest<CoreResearchResult>(
    "exercise_core_research",
    `운동·재활 콘텐츠의 공통 Research Core를 한국어로 작성합니다. 어떤 출력 플랫폼의 카피도 아직 만들지 마세요.
Original Content → Key Claims → Biomechanics / Rehabilitation Principles → Clinical Interpretation → Easy Explanation → Practical Application → Exercise Ideas → Precautions 순서로 분석하세요.
${safetyRules}`,
    sharedInput(content), coreResearchSchema,
  );
  return { result, reused: false };
}

export async function generateNaverKr(content: ContentItem, core: CoreResearchResult["analysis"]): Promise<NaverOutputData> {
  const [brand, contents] = await Promise.all([getBrandProfile(), listContents({ limit: 30 })]);
  const relatedLibrary = contents.filter((item) => item.id !== content.id)
    .map((item) => ({ title: item.originalTitle, tags: item.tags.map((tag) => tag.name) }));
  return structuredRequest<NaverOutputData>(
    "naver_blog_kr",
    `공통 Research Core만 사용해 한국어 네이버 블로그 콘텐츠를 독립 생성하세요. Instagram 문장을 늘여 쓰지 마세요.
검색 의도와 한국어 키워드를 먼저 분석하고, 제목 후보 5개, 모바일 가독성, 운영자 해석, 1~3개 적용법, 주의점, 이미지 계획, 태그, 출처를 포함하세요.
경험 입력이 비어 있으면 환자 경험을 만들지 말고 '적용할 때 확인할 포인트'로 전환하세요.
브랜드: ${brand.brandName}; 대상: ${brand.audience}; 말투: ${brand.toneOfVoice}; CTA: ${brand.signatureCta}; 색상: ${brand.primaryColor}/${brand.secondaryColor}/${brand.accentColor}.
markdown에는 [BOLD], [CALLOUT], [IMAGE], [SOURCE], [RELATED] 표시를 사용하세요. SEO 점수는 순위 예측이 아닌 내부 품질 점수이며 합계를 정확히 계산하세요.
${safetyRules}`,
    { ...sharedInput(content, core), relatedLibrary }, naverOutputSchema,
  );
}

function assertInstagramOutput(output: InstagramOutputData): void {
  if (output.instagramCards.length < 5 || output.instagramCards.length > 9) throw new Error("Instagram 카드는 5~9장이어야 합니다.");
  if (output.instagramEngine.cardCount !== output.instagramCards.length) throw new Error("Instagram 카드와 Storyboard 수가 일치하지 않습니다.");
}

export async function generateInstagram(
  content: ContentItem,
  core: CoreResearchResult["analysis"],
  locale: "ko" | "en",
): Promise<InstagramOutputData> {
  const brand = await getBrandProfile();
  const isEnglish = locale === "en";
  const languageRules = isEnglish
    ? `Write for a native English-speaking audience. Do not translate or inspect any Korean Instagram output. Build the hook, humor, metaphor, CTA, keywords, hashtags, caption, card rhythm and line lengths independently from the Research Core. Use natural English movement and rehabilitation search terms.`
    : `한국 Instagram 사용자를 위해 자연스러운 한국어 후크, 공감, 가벼운 유머, CTA, 검색어, 해시태그와 캡션을 독립적으로 만드세요.`;
  const result = await structuredRequest<InstagramOutputData>(
    isEnglish ? "instagram_carousel_en" : "instagram_carousel_kr",
    `${languageRules}
Instagram 전용 5~9장 Carousel을 만드세요. 한 카드에는 핵심 메시지 하나만 두고 Hook → Problem → Why → Explanation → Application → Takeaway → Source 흐름을 내용에 맞게 구성하세요.
Hook 10개와 콘텐츠 각도 6개 이상을 만들고 점수화하세요. swipeFlow, textDensity, Storyboard, Caption, CTA, 저장·공유 가치, Quality Score를 완성하세요.
이미지는 중요한 텍스트를 포함하지 않는 독창적인 교육형 브리프로 작성하세요. 1080×1350 안전 영역을 고려하고, 언어별 글자 길이에 맞춰 레이아웃을 조절하세요.
브랜드: ${brand.brandName}; 시각 스타일: ${brand.visualStyle}; 색상: ${brand.primaryColor}/${brand.secondaryColor}/${brand.accentColor}; 유머: ${brand.humorLevel}/5; CTA: ${brand.signatureCta}.
${safetyRules}`,
    sharedInput(content, core), instagramOutputSchema,
  );
  assertInstagramOutput(result);
  return result;
}

export function instagramLocaleForOutput(outputType: OutputType): "ko" | "en" {
  if (outputType === "INSTAGRAM_KR") return "ko";
  if (outputType === "INSTAGRAM_EN") return "en";
  throw new Error("Instagram 출력 타입이 아닙니다.");
}
