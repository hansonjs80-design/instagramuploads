import type { GeneratedBundle } from "@/lib/content/types";

const prohibitedClaims = [
  "무조건 낫습니다",
  "이것만 하면 됩니다",
  "100% 해결",
  "반드시 교정됩니다",
  "통증 완치",
  "충격적인 진실",
  "의사도 모르는",
] as const;

export function assertSafeMedicalLanguage(bundle: GeneratedBundle): void {
  assertSafeMedicalOutput(bundle);

  const scores = bundle.blog.naverSeo.seoScore;
  const calculated =
    scores.searchIntent + scores.titleQuality + scores.originality +
    scores.expertiseInterpretation + scores.readability + scores.structure +
    scores.imageUsefulness + scores.sourceTransparency +
    scores.brandConsistency + scores.relatedContent;
  scores.total = Math.max(0, Math.min(100, calculated));

  const keyword = bundle.blog.naverSeo.primaryKeyword.trim();
  if (keyword) {
    const occurrences = bundle.blog.markdown.split(keyword).length - 1;
    const paragraphCount = Math.max(1, bundle.blog.markdown.split(/\n\s*\n/).length);
    if (occurrences > Math.max(7, Math.ceil(paragraphCount * 0.65))) {
      bundle.blog.naverSeo.keywordWarnings.push(
        "대표 키워드가 문맥상 불필요하게 반복되고 있습니다. 대명사나 자연스러운 유사 표현으로 검토하세요.",
      );
      bundle.blog.naverSeo.readiness = "needs_revision";
    }
  }
}

export function assertSafeMedicalOutput(output: unknown): void {
  const serialized = JSON.stringify(output);
  const found = prohibitedClaims.find((phrase) => serialized.includes(phrase));
  if (found) throw new Error(`과장 또는 단정 표현이 감지되었습니다: ${found}`);
}
