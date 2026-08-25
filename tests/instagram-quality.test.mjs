import test from "node:test";
import assert from "node:assert/strict";
import { getTextDensity, scoreInstagram } from "../src/lib/instagram/quality-engine.ts";

const style = { textAlign: "left", headlineSize: 52, bodySize: 29, fontWeight: 700, lineHeight: 1.4, textPosition: "center", background: "#fff", imageDataUrl: "", imageSize: 50, imagePosition: "center", spacing: 72, logoPosition: "bottom-right", footerStyle: "compact", badgeStyle: "pill", summaryBoxStyle: "soft", sourceBoxStyle: "plain" };

test("text density flags very long cards", () => {
  assert.equal(getTextDensity({ slide: 1, headline: "제목", body: "긴 설명".repeat(100), imageDescription: "image", source: "source", style }), "TOO_HIGH");
});

test("quality guard rejects clickbait and missing source", () => {
  const cards = [
    { slide: 1, headline: "100% 완치되는 충격적인 진실", body: "내용", imageDescription: "image", source: "source", categoryBadge: "PAIN", style },
    { slide: 2, headline: "정리", body: "저장해두고 체크", imageDescription: "image", source: "", categoryBadge: "SUMMARY", style },
  ];
  const report = scoreInstagram(cards, "짧은 캡션");
  assert.equal(report.ready, false);
  assert.ok(report.warnings.some((warning) => warning.message.includes("클릭베이트")));
  assert.ok(report.warnings.some((warning) => warning.message.includes("출처")));
});
