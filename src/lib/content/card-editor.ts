import type { InstagramCard, InstagramCardStyle } from "@/lib/content/types";

export const defaultCardBackgrounds = [
  "#123c39",
  "#e8f2ee",
  "#d9ed83",
  "#f5e4c5",
  "#dce6f2",
  "#efe8f5",
] as const;

export function defaultCardStyle(index: number): InstagramCardStyle {
  return {
    textAlign: index === 0 ? "center" : "left",
    headlineSize: index === 0 ? 64 : 52,
    bodySize: 29,
    fontWeight: 700,
    lineHeight: 1.42,
    textPosition: index === 0 ? "center" : "bottom",
    background: defaultCardBackgrounds[index % defaultCardBackgrounds.length],
    imageDataUrl: "",
    imageSize: 58,
    imagePosition: "center",
    spacing: 72,
    logoPosition: "bottom-right",
    footerStyle: "compact",
    badgeStyle: "pill",
    summaryBoxStyle: index === 6 ? "soft" : "hidden",
    sourceBoxStyle: index === 6 ? "band" : "plain",
  };
}

export function normalizeCard(card: InstagramCard, index: number): InstagramCard {
  return {
    ...card,
    slide: index + 1,
    style: { ...defaultCardStyle(index), ...card.style },
  };
}

export function normalizeCards(cards: InstagramCard[]): InstagramCard[] {
  return cards.map(normalizeCard);
}
