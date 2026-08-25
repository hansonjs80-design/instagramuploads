import "server-only";

import { DataLabTrendProvider } from "@/lib/naver/providers/naver-datalab";
import type { NaverTrendProvider } from "@/lib/naver/providers/types";

export function getNaverTrendProvider(): NaverTrendProvider {
  const configured = process.env.NAVER_API_PROVIDER?.trim().toUpperCase();
  return new DataLabTrendProvider(
    configured === "LEGACY_NAVER_DEVELOPERS" ? "LEGACY_NAVER_DEVELOPERS" : "NAVER_API_HUB",
  );
}
