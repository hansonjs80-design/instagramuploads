import test from "node:test";
import assert from "node:assert/strict";
import { parseOutputTypes } from "../src/lib/content/validation.ts";

test("keeps only supported output engines in canonical order", () => {
  assert.deepEqual(
    parseOutputTypes(["INSTAGRAM_EN", "INVALID", "NAVER_BLOG_KR"]),
    ["NAVER_BLOG_KR", "INSTAGRAM_EN"],
  );
});

test("requires at least one output when a selection is supplied", () => {
  assert.throws(() => parseOutputTypes([]), /하나 이상 선택/);
});

test("defaults older content to Korean Naver and Instagram outputs", () => {
  assert.deepEqual(parseOutputTypes(undefined), ["NAVER_BLOG_KR", "INSTAGRAM_KR"]);
});
