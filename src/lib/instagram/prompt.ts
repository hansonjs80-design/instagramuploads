import type { BrandProfile, ContentItem } from "@/lib/content/types";

export function instagramEnginePrompt(content: ContentItem, brand: BrandProfile): string {
  const settings = brand.instagramSettings;
  return `INSTAGRAM CONTENT ENGINE:
- Naver Blog 문장을 자르거나 줄여 쓰지 말고, 공유 가능한 Source/Research/Key Claims만 바탕으로 Instagram용 콘텐츠를 새로 설계하세요.
- 최소 6개 Angle을 만들고, 10개 Hook 유형(CURIOSITY, EMPATHY, CONTRARIAN, PAIN, MISTAKE, QUESTION, CHECKLIST, SURPRISE, MYTH, STORY)을 정확히 하나씩 만드세요.
- Hook은 Stop Power 25, Curiosity 20, Audience Relevance 20, Clarity 15, Specificity 10, Brand Fit 10으로 채점하세요.
- 과장 표현(충격적인 진실, 의사도 모르는, 99%가 모르는, 무조건, 100%, 이것만 하면, 완치, 절대)은 Clickbait Risk를 높이고 선택하지 마세요.
- 내용 난이도에 따라 ${settings.defaultCardMin}~${settings.defaultCardMax}장으로 설계하고 한 장에 한 메시지만 담으세요.
- 카드마다 purpose, visualType, progressive disclosure, currentMessage, curiosityGap, nextCardReason, transitionLine을 작성하세요.
- 패턴 인터럽트를 위해 COVER/DIAGRAM/HUMOR/COMPARISON/EXERCISE/SUMMARY가 반복되지 않도록 Storyboard를 먼저 설계하세요.
- 중요한 한국어 문구는 이미지 프롬프트에 넣지 말고 코드 오버레이용 copy로 분리하세요.
- Caption은 Cover 문구를 반복하지 않고 추가 맥락을 주며 HOOK→CONTEXT→ADDITIONAL VALUE→EXPLANATION→TAKEAWAY→SOURCE→CTA 순서를 따르세요.
- 해시태그는 BRAND/TOPIC/SEARCH/AUDIENCE/NICHE로 분리하고, 검색어를 도배하지 마세요.
- sourceNotice는 '원본 콘텐츠를 그대로 번역하거나 재게시하지 않고, 핵심 개념을 참고해 별도의 설명과 해석을 더해 재구성했습니다.'를 포함하세요.
- Quality는 알고리즘 예측이 아닌 내부 품질 점수입니다. Hook 15, Swipe 15, Clarity 10, Save 10, Share 10, Visual 10, Text Density 10, Brand 10, Caption 5, Source 5로 평가하세요.
- 사용자가 입력하지 않은 환자 사례나 임상 경험은 만들지 마세요. 입력 경험: ${content.experienceNote || "없음"}
- Personality 기본 STANDARD, Body Character Mode ${settings.bodyCharacterMode}, Safe Margin ${settings.safeMargin}px, Text Density ${settings.textDensity}.
- 브랜드: ${brand.brandName}, 말투: ${brand.toneOfVoice}, 유머 ${brand.humorLevel}/5, CTA ${brand.signatureCta}, 색상 ${brand.primaryColor}/${brand.secondaryColor}/${brand.accentColor}.`;
}
