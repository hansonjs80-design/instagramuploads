import type { InstagramCard, InstagramQuality } from "@/lib/content/types";

const CLICKBAIT = /충격적인 진실|의사도 모르는|99%가 모르는|무조건|100%|이것만 하면|완치|절대/;

export function getTextDensity(card: InstagramCard): InstagramCard["textDensity"] {
  const length = `${card.headline}${card.subheadline ?? ""}${card.body}${card.callout ?? ""}`.replace(/\s/g, "").length;
  if (length < 45) return "LOW";
  if (length <= 150) return "GOOD";
  if (length <= 220) return "HIGH";
  return "TOO_HIGH";
}

export function scoreInstagram(cards: InstagramCard[], caption = ""): InstagramQuality {
  const warnings: InstagramQuality["warnings"] = [];
  const first = cards[0];
  const last = cards.at(-1);
  const densities = cards.map(getTextDensity);
  densities.forEach((density, index) => {
    if (density === "HIGH" || density === "TOO_HIGH") warnings.push({ card: index + 1, message: `Card ${index + 1} 글자량이 ${density === "TOO_HIGH" ? "너무 많습니다" : "많습니다"}. 한 장 한 메시지로 줄여보세요.`, severity: density === "TOO_HIGH" ? "error" : "warning" });
  });
  if (first && CLICKBAIT.test(first.headline)) warnings.push({ card: 1, message: "후크의 클릭베이트 위험이 높습니다.", severity: "error" });
  if (!cards.every((card, index) => index === cards.length - 1 || Boolean(card.swipeFlow?.transitionLine))) warnings.push({ card: null, message: "일부 카드의 Swipe transition이 약합니다.", severity: "warning" });
  if (!last?.source) warnings.push({ card: cards.length, message: "출처 정보가 없습니다.", severity: "error" });
  if (!/저장|체크|비교|요약|운동/.test(cards.map((card) => `${card.headline} ${card.body} ${card.summaryText ?? ""}`).join(" "))) warnings.push({ card: null, message: "실제 저장 가치 요소가 부족합니다.", severity: "warning" });

  const scores = {
    hook: Math.max(45, 94 - (first && CLICKBAIT.test(first.headline) ? 30 : 0) - ((first?.headline.length ?? 0) > 55 ? 12 : 0)),
    swipe: Math.max(50, 94 - cards.filter((card, index) => index < cards.length - 1 && !card.swipeFlow?.transitionLine).length * 7),
    clarity: Math.max(50, 94 - densities.filter((value) => value === "HIGH").length * 5 - densities.filter((value) => value === "TOO_HIGH").length * 12),
    save: /체크|비교|요약|운동|방법/.test(cards.map((card) => `${card.headline} ${card.body}`).join(" ")) ? 91 : 68,
    share: /혹시|반복|이런 적|쉽게 말하면/.test(cards.map((card) => card.body).join(" ")) ? 88 : 72,
    visual: new Set(cards.map((card) => card.visualType).filter(Boolean)).size >= 4 ? 91 : 76,
    textDensity: Math.max(50, 96 - densities.filter((value) => value === "HIGH").length * 6 - densities.filter((value) => value === "TOO_HIGH").length * 15),
    brand: cards.every((card) => card.categoryBadge && card.style) ? 95 : 82,
    caption: caption.length >= 120 && caption !== first?.body ? 90 : 72,
    source: last?.source ? 100 : 45,
  };
  const total = Math.round(
    scores.hook * .15 + scores.swipe * .15 + scores.clarity * .1 + scores.save * .1 +
    scores.share * .1 + scores.visual * .1 + scores.textDensity * .1 + scores.brand * .1 +
    scores.caption * .05 + scores.source * .05,
  );
  return { total, scores, warnings, ready: total >= 85 && !warnings.some((warning) => warning.severity === "error") };
}

export function improveUnlockedCards(cards: InstagramCard[]): InstagramCard[] {
  return cards.map((card) => {
    if (card.locks?.card) return card;
    const density = getTextDensity(card);
    const body = density === "HIGH" || density === "TOO_HIGH"
      ? card.body.split(/(?<=[.!?요다])\s+|\n+/).filter(Boolean).slice(0, 3).join("\n")
      : card.body;
    return {
      ...card,
      headline: card.locks?.headline ? card.headline : card.headline.replace(CLICKBAIT, "꼭 확인할 포인트"),
      body,
      textDensity: getTextDensity({ ...card, body }),
    };
  });
}
