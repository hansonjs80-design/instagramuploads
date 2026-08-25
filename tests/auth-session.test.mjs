import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session.ts";

test("signed owner session rejects tampering", async () => {
  const secret = "0123456789abcdef0123456789abcdef";
  process.env.STUDIO_OWNER_EMAIL = "owner@example.com";
  const token = await createSessionToken("owner@example.com", secret);
  assert.equal(await verifySessionToken(token, secret), true);
  assert.equal(await verifySessionToken(`${token}x`, secret), false);
});
