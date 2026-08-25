import type { TagCategory } from "@/lib/content/types";

export const tagCategoryLabels: Record<TagCategory, string> = {
  topic: "주제",
  body_part: "신체 부위",
  exercise: "운동",
  symptom: "증상",
  biomechanics: "생체역학",
};

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function splitCommaList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
