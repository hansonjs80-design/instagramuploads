import type { PublishMode } from "./types";

const configuredVersion = process.env.INSTAGRAM_API_VERSION?.trim();
export const INSTAGRAM_API_VERSION = configuredVersion && /^v\d+\.\d+$/.test(configuredVersion) ? configuredVersion : "v23.0";
export const INSTAGRAM_GRAPH_BASE = `https://graph.instagram.com/${INSTAGRAM_API_VERSION}`;
export const INSTAGRAM_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
export const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

export function getPublishMode(): PublishMode {
  return process.env.INSTAGRAM_PUBLISH_MODE === "LIVE" ? "LIVE" : "MOCK";
}

export function getRedirectUri(): string {
  const explicit = process.env.INSTAGRAM_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const base = process.env.APP_BASE_URL?.trim();
  if (!base) throw new Error("APP_BASE_URL 또는 INSTAGRAM_REDIRECT_URI를 설정해 주세요.");
  return `${base.replace(/\/$/, "")}/api/instagram/oauth/callback`;
}
