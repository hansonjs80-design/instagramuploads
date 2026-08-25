import type { TemplateKey } from "@/lib/content/types";

export const contentTemplates: Array<{
  key: TemplateKey;
  name: string;
  description: string;
  flow: string[];
}> = [
  {
    key: "myth_vs_truth",
    name: "Myth vs Truth",
    description: "익숙한 오해를 짚고 더 정확한 관점으로 전환합니다.",
    flow: ["통념", "왜 믿게 되는가", "핵심 원리", "실제 해석", "적용", "주의", "정리"],
  },
  {
    key: "problem_cause_solution",
    name: "Problem → Cause → Solution",
    description: "문제에서 원리와 실천 방법으로 자연스럽게 이동합니다.",
    flow: ["문제", "관찰", "가능한 원리", "쉬운 해석", "해결 방향", "주의", "요약"],
  },
  {
    key: "checklist",
    name: "Checklist",
    description: "독자가 스스로 확인할 수 있는 짧은 점검 흐름입니다.",
    flow: ["후킹", "체크 1", "체크 2", "체크 3", "적용", "주의", "결과 읽기"],
  },
  {
    key: "common_mistake",
    name: "Common Mistake",
    description: "흔한 실수를 비난 없이 설명하고 대안을 제시합니다.",
    flow: ["흔한 실수", "왜 생기는가", "원리", "느낌 구분", "수정", "주의", "요약"],
  },
  {
    key: "simple_explanation",
    name: "Simple Explanation",
    description: "어려운 생체역학 개념을 일상 언어와 비유로 풉니다.",
    flow: ["질문", "어려운 지점", "핵심 원리", "비유", "예시", "주의", "한 줄 정리"],
  },
  {
    key: "exercise_application",
    name: "Exercise Application",
    description: "개념을 안전한 운동 관찰과 적용으로 연결합니다.",
    flow: ["목표", "문제", "원리", "준비", "운동", "실수", "다음 행동"],
  },
  {
    key: "carousel_story",
    name: "Carousel Story",
    description: "문제 인식부터 이해, 적용, 출처까지 이야기처럼 전개합니다.",
    flow: ["후킹", "문제", "원리", "쉬운 설명", "적용", "주의", "요약+출처"],
  },
];

export function getContentTemplate(key: TemplateKey) {
  return contentTemplates.find((template) => template.key === key) ?? contentTemplates.at(-1)!;
}
