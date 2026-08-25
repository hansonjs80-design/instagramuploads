export const SESSION_COOKIE = "ecs_owner_session";

export function configuredAuthSubjects(environment: NodeJS.ProcessEnv = process.env): string[] {
  return [environment.STUDIO_OWNER_EMAIL, environment.STUDIO_ADMIN_USERNAME]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));
}

function bytes(value: string): ArrayBuffer { return new TextEncoder().encode(value).buffer as ArrayBuffer; }
function encode(value: ArrayBuffer): string { return Buffer.from(value).toString("base64url"); }

async function signature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(await crypto.subtle.sign("HMAC", key, bytes(payload)));
}

export async function createSessionToken(email: string, secret: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ sub: email, exp: Date.now() + 7 * 24 * 60 * 60_000 })).toString("base64url");
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret || secret.length < 32) return false;
  const [payload, signed] = token.split(".");
  if (!payload || !signed || await signature(payload, secret) !== signed) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown; exp?: unknown };
    return typeof parsed.sub === "string" && configuredAuthSubjects().includes(parsed.sub.toLowerCase()) && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch { return false; }
}
