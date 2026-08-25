export type TrendPoint = { period: string; ratio: number };
export type KeywordTrend = {
  keyword: string;
  series: TrendPoint[];
  trendScore: number;
  momentum: number;
  seasonality: number;
  recentChange: number;
  stability: number;
};

export interface NaverTrendProvider {
  readonly name: "NAVER_API_HUB" | "LEGACY_NAVER_DEVELOPERS";
  isConfigured(): boolean;
  compare(keywords: string[], periodMonths: number): Promise<KeywordTrend[]>;
}
