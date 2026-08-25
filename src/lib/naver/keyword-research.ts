import "server-only";

import { getNaverTrendProvider } from "@/lib/naver/providers";
import type { KeywordTrend } from "@/lib/naver/providers/types";

export type KeywordType = "PRIMARY" | "SECONDARY" | "LONG-TAIL" | "QUESTION" | "CONCEPT";
type Candidate = { keyword: string; type: KeywordType; intents: string[] };

export type KeywordResearchResult = {
  topic: string;
  periodMonths: number;
  candidates: Array<Candidate & {
    trend: KeywordTrend | null;
    searchIntentMatch: number;
    contentRelevance: number;
    naverTrend: number;
    brandFit: number;
    expertiseFit: number;
    longTailSpecificity: number;
    contentOpportunity: number;
    score: number;
  }>;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  titleCandidates: string[];
  trendSource: "naver_datalab" | "estimated";
  provider: string;
  trendNotice: string;
};

async function aiCandidates(topic: string): Promise<Candidate[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return fallbackCandidates(topic);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        minItems: 10,
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["keyword", "type", "intents"],
          properties: {
            keyword: { type: "string" },
            type: {
              type: "string",
              enum: ["PRIMARY", "SECONDARY", "LONG-TAIL", "QUESTION", "CONCEPT"],
            },
            intents: {
              type: "array",
              minItems: 1,
              items: {
                type: "string",
                enum: ["CAUSE", "SYMPTOM", "HOW-TO", "EXERCISE", "COMPARISON", "MYTH", "CHECKLIST", "EDUCATION", "PAIN-SOLUTION"],
              },
            },
          },
        },
      },
    },
  } as const;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini", store: false,
      instructions: "운동·재활 네이버 검색 의도 기획자입니다. 과장된 치료 표현 없이 실제 질문과 일치하는 한국어 검색어 12개를 PRIMARY, SECONDARY, LONG-TAIL, QUESTION, CONCEPT로 분류하세요. 검색 의도는 CAUSE, SYMPTOM, HOW-TO, EXERCISE, COMPARISON, MYTH, CHECKLIST, EDUCATION, PAIN-SOLUTION 중 선택하세요.",
      input: `주제: ${topic}`,
      text: {
        format: {
          type: "json_schema",
          name: "naver_keywords",
          strict: true,
          schema,
        },
      },
    }), signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) return fallbackCandidates(topic);
  const payload = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const text = payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  try { return text ? (JSON.parse(text) as { candidates: Candidate[] }).candidates : fallbackCandidates(topic); } catch { return fallbackCandidates(topic); }
}

function fallbackCandidates(topic: string): Candidate[] {
  return [
    [topic, "PRIMARY", ["EDUCATION"]], [`${topic} 원인`, "SECONDARY", ["CAUSE"]],
    [`${topic} 증상`, "SECONDARY", ["SYMPTOM"]], [`${topic} 운동`, "SECONDARY", ["HOW-TO", "EXERCISE"]],
    [`걸을 때 ${topic}`, "LONG-TAIL", ["CAUSE", "SYMPTOM"]], [`${topic} 아플 때`, "LONG-TAIL", ["PAIN-SOLUTION"]],
    [`${topic} 왜 생기나요`, "QUESTION", ["CAUSE"]], [`${topic} 스트레칭`, "LONG-TAIL", ["HOW-TO"]],
    [`${topic} 체크`, "LONG-TAIL", ["CHECKLIST"]], [`${topic} 잘못된 상식`, "QUESTION", ["MYTH"]],
    [`${topic} 움직임`, "CONCEPT", ["EDUCATION"]], [`${topic} 비교`, "CONCEPT", ["COMPARISON"]],
  ].map(([keyword, type, intents]) => ({ keyword, type, intents })) as Candidate[];
}

export async function researchKeywords(topic: string, periodMonths = 12): Promise<KeywordResearchResult> {
  const candidates = await aiCandidates(topic);
  const provider = getNaverTrendProvider();
  let trends: KeywordTrend[] = [];
  try { trends = await provider.compare(candidates.map((item) => item.keyword), periodMonths); } catch { trends = []; }
  const trendMap = new Map(trends.map((trend) => [trend.keyword, trend]));
  const maxTrend = Math.max(1, ...trends.map((trend) => trend.trendScore));
  const scored = candidates.map((candidate, index) => {
    const trend = trendMap.get(candidate.keyword) ?? null;
    const searchIntentMatch = candidate.intents.length > 0 ? 23 + Math.min(2, candidate.intents.length) : 15;
    const contentRelevance = candidate.keyword.includes(topic) ? 20 : 16;
    const naverTrend = trend ? Math.max(1, Math.round((trend.trendScore / maxTrend) * 15)) : 8;
    const brandFit = /통증|움직임|운동|보행|자세|재활|체크/.test(candidate.keyword) ? 15 : 12;
    const expertiseFit = /원인|운동|움직임|비교|체크/.test(candidate.keyword) ? 10 : 8;
    const longTailSpecificity = candidate.type === "LONG-TAIL" || candidate.type === "QUESTION" ? 10 : candidate.type === "PRIMARY" ? 6 : 8;
    const contentOpportunity = index < 5 ? 5 : 4;
    return { ...candidate, trend, searchIntentMatch, contentRelevance, naverTrend, brandFit, expertiseFit, longTailSpecificity, contentOpportunity, score: searchIntentMatch + contentRelevance + naverTrend + brandFit + expertiseFit + longTailSpecificity + contentOpportunity };
  }).sort((a, b) => b.score - a.score);
  const primaryKeyword = scored[0]?.keyword ?? topic;
  return {
    topic, periodMonths, candidates: scored, primaryKeyword,
    secondaryKeywords: scored.filter((item) => item.type === "SECONDARY").slice(0, 5).map((item) => item.keyword),
    longTailKeywords: scored.filter((item) => item.type === "LONG-TAIL" || item.type === "QUESTION").slice(0, 5).map((item) => item.keyword),
    titleCandidates: [
      `${primaryKeyword}이 반복될 때 함께 봐야 하는 움직임`, `${primaryKeyword}, 왜 비슷한 불편감이 다시 생길까요?`,
      `${primaryKeyword}만 보면 놓치기 쉬운 한 가지`, `${primaryKeyword} 때문에 계속 신경 쓰인다면 체크해보세요`,
      `${primaryKeyword}과 움직임의 연결, 쉽게 풀어보면`, `${primaryKeyword} 운동 전에 확인할 3가지`,
      `${primaryKeyword}, 흔한 오해와 실제 적용 방법`, `${primaryKeyword}을 움직임 관점에서 이해하는 법`,
    ],
    trendSource: trends.length ? "naver_datalab" : "estimated", provider: provider.name,
    trendNotice: trends.length ? `최근 ${periodMonths}개월 네이버 데이터랩의 상대 검색 관심도를 반영했습니다. 절대 검색량이 아닙니다.` : "NAVER API 자격 증명이 없어 Trend는 중립값입니다. 절대 검색량이나 예측값이 아닙니다.",
  };
}
