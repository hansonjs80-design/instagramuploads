import { createHash, randomBytes } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { INSTAGRAM_AUTHORIZE_URL, INSTAGRAM_TOKEN_URL, getRedirectUri } from "./config";
import { InstagramProviderError } from "./errors";
import { INSTAGRAM_PUBLISH_SCOPES } from "./types";

export async function createAuthorizationUrl(): Promise<string> {
  const appId = process.env.META_APP_ID?.trim();
  if (!appId) throw new InstagramProviderError("CONFIGURATION");
  const redirectUri = getRedirectUri();
  const state = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60_000);
  const db = await getDatabase();
  await db.run("INSERT INTO instagram_oauth_states (state_hash, redirect_uri, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [createHash("sha256").update(state).digest("hex"), redirectUri, now.toISOString(), expires.toISOString()]);
  const url = new URL(INSTAGRAM_AUTHORIZE_URL);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_PUBLISH_SCOPES.join(","));
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeAuthorizationCode(code: string, state: string): Promise<{ accessToken: string; userId: string; expiresAt: string | null }> {
  const hash = createHash("sha256").update(state).digest("hex");
  const db = await getDatabase();
  const row = await db.get<{ redirect_uri: string; expires_at: string }>("SELECT redirect_uri, expires_at FROM instagram_oauth_states WHERE state_hash = ?", [hash]);
  await db.run("DELETE FROM instagram_oauth_states WHERE state_hash = ?", [hash]);
  if (!row || new Date(row.expires_at).getTime() < Date.now() || row.redirect_uri !== getRedirectUri()) throw new Error("OAuth state가 만료되었거나 일치하지 않습니다.");
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  if (!appId || !secret) throw new InstagramProviderError("CONFIGURATION");
  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: appId, client_secret: secret, grant_type: "authorization_code", redirect_uri: row.redirect_uri, code }),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json() as { access_token?: unknown; user_id?: unknown; expires_in?: unknown };
  if (!response.ok || typeof payload.access_token !== "string" || (typeof payload.user_id !== "string" && typeof payload.user_id !== "number")) throw new InstagramProviderError("API_ERROR", { status: response.status });
  const expires = Number(payload.expires_in);
  return { accessToken: payload.access_token, userId: String(payload.user_id), expiresAt: Number.isFinite(expires) ? new Date(Date.now() + expires * 1000).toISOString() : null };
}
