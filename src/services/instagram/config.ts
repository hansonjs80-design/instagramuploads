import type { PublishMode } from "./types";

const configuredVersion = process.env.INSTAGRAM_API_VERSION?.trim();
export const INSTAGRAM_API_VERSION = configuredVersion && /^v\d+\.\d+$/.test(configuredVersion) ? configuredVersion : "v23.0";
export const INSTAGRAM_GRAPH_BASE = `https://graph.instagram.com/${INSTAGRAM_API_VERSION}`;
export const INSTAGRAM_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
export const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

export function getPublishMode(): PublishMode {
  return process.env.INSTAGRAM_PUBLISH_MODE === "LIVE" ? "LIVE" : "MOCK";
}

export function getAppBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelHost = process.env.VERCEL_URL?.trim() || process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  throw new Error("APP_BASE_URL 또는 VERCEL_URL을 설정해 주세요.");
}

export function getRedirectUri(): string {
  const explicit = process.env.INSTAGRAM_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return `${getAppBaseUrl()}/api/instagram/oauth/callback`;
}
