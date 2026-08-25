import test from "node:test";
import assert from "node:assert/strict";
import { describeGenerationFailure } from "../src/lib/ai/error-message.ts";

test("translates OpenAI quota errors into an actionable Korean message", () => {
  const failure = describeGenerationFailure(new Error("You exceeded your current quota, please check your plan and billing details."));

  assert.equal(failure.code, "OPENAI_QUOTA_EXCEEDED");
  assert.equal(failure.status, 429);
  assert.match(failure.message, /사용 한도 또는 크레딧/);
  assert.match(failure.actionUrl, /billing/);
});

test("translates a missing API key without referring only to local env files", () => {
  const failure = describeGenerationFailure("OPENAI_API_KEY가 설정되지 않았습니다. .env.local을 확인해 주세요.");

  assert.equal(failure.code, "OPENAI_NOT_CONFIGURED");
  assert.equal(failure.status, 503);
  assert.match(failure.message, /Production 환경변수/);
});

test("keeps an unknown generation error for diagnostics", () => {
  const failure = describeGenerationFailure(new Error("unexpected schema failure"));

  assert.equal(failure.code, "GENERATION_FAILED");
  assert.equal(failure.status, 502);
  assert.equal(failure.message, "unexpected schema failure");
});
