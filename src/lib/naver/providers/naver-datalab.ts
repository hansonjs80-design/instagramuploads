import "server-only";

import type { KeywordTrend, NaverTrendProvider, TrendPoint } from "@/lib/naver/providers/types";

function calculate(keyword: string, series: TrendPoint[]): KeywordTrend {
  const values = series.map((point) => point.ratio);
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const recent = values.slice(-3);
  const earlier = values.slice(-6, -3);
  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / Math.max(1, recent.length);
  const earlierAverage = earlier.reduce((sum, value) => sum + value, 0) / Math.max(1, earlier.length);
  const momentum = recentAverage - earlierAverage;
  const recentChange = values.length > 1 ? values.at(-1)! - values.at(-2)! : 0;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, values.length);
  const stability = Math.max(0, 100 - Math.sqrt(variance));
  const seasonality = values.length >= 12 ? Math.max(...values) - Math.min(...values) : 0;
  return { keyword, series, trendScore: average, momentum, seasonality, recentChange, stability };
}

export class DataLabTrendProvider implements NaverTrendProvider {
  readonly name: "NAVER_API_HUB" | "LEGACY_NAVER_DEVELOPERS";
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly endpoint: string;

  constructor(name: NaverTrendProvider["name"]) {
    this.name = name;
    this.clientId = process.env.NAVER_CLIENT_ID?.trim() || "";
    this.clientSecret = process.env.NAVER_CLIENT_SECRET?.trim() || "";
    this.endpoint =
      (name === "NAVER_API_HUB" ? process.env.NAVER_API_HUB_BASE_URL?.trim() : "") ||
      "https://openapi.naver.com/v1/datalab/search";
  }

  isConfigured() { return Boolean(this.clientId && this.clientSecret); }

  async compare(keywords: string[], periodMonths: number): Promise<KeywordTrend[]> {
    if (!this.isConfigured()) return [];
    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - periodMonths);
    const date = (value: Date) => value.toISOString().slice(0, 10);
    const all: KeywordTrend[] = [];
    for (let index = 0; index < keywords.length; index += 5) {
      const batch = keywords.slice(index, index + 5);
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "X-Naver-Client-Id": this.clientId,
          "X-Naver-Client-Secret": this.clientSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: date(start), endDate: date(end), timeUnit: periodMonths <= 3 ? "date" : "month",
          keywordGroups: batch.map((keyword) => ({ groupName: keyword, keywords: [keyword] })),
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`NAVER 상대 검색 트렌드 요청 실패 (${response.status})`);
      const payload = await response.json() as { results?: Array<{ title: string; data: TrendPoint[] }> };
      for (const result of payload.results ?? []) all.push(calculate(result.title, result.data.map((point) => ({ period: point.period, ratio: Number(point.ratio) }))));
    }
    return all;
  }
}
