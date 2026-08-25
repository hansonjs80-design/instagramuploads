import test from "node:test";
import assert from "node:assert/strict";
import { detectSource } from "../src/services/source-analysis/platform-detector.ts";
import { classifyContent, mergeClassification } from "../src/services/source-analysis/classification-engine.ts";

test("detects and normalizes supported source URLs", () => {
  assert.deepEqual(detectSource("https://youtu.be/abc123").sourcePlatform, "YOUTUBE_VIDEO");
  assert.equal(detectSource("https://www.youtube.com/shorts/short42").sourcePlatform, "YOUTUBE_SHORTS");
  assert.equal(detectSource("https://www.instagram.com/reel/reel42/").sourcePlatform, "INSTAGRAM_REEL");
  assert.equal(detectSource("https://www.instagram.com/p/post42/").platformContentId, "post42");
});

test("classifies Korean and English movement evidence with confidence", () => {
  const evidence = [{ id: "e1", type: "TRANSCRIPT", locator: "0:12", excerpt: "foot pronation and 엄지발가락 통증 while walking", confidence: 95 }];
  const result = classifyContent(evidence[0].excerpt, evidence);
  assert.equal(result.bodyRegions[0].value, "FOOT");
  assert.ok(result.bodyRegions.some((item) => item.value === "BIG TOE"));
  assert.ok(result.biomechanics.some((item) => item.value === "PRONATION"));
  assert.equal(result.keywords.instagramEn.primary[0].value, "foot pain");
});

test("rerun preserves locked and user-modified classifications", () => {
  const before = classifyContent("foot pain while walking", []);
  before.bodyRegions[0] = { ...before.bodyRegions[0], value: "BIG TOE", state: "LOCKED", locked: true };
  const after = classifyContent("knee pain while running", []);
  const merged = mergeClassification(before, after);
  assert.equal(merged.bodyRegions[0].value, "BIG TOE");
  assert.equal(merged.bodyRegions[0].locked, true);
  assert.ok(merged.bodyRegions.some((item) => item.value === "KNEE"));
});

test("low-evidence fallback stays explicit and reviewable", () => {
  const result = classifyContent("Untitled rehabilitation content", []);
  assert.equal(result.bodyRegions[0].value, "FULL BODY");
  assert.equal(result.bodyRegions[0].confidence, 35);
  assert.equal(result.bodyRegions[0].state, "AI_SUGGESTED");
});
