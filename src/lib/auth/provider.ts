import "server-only";
import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { configuredAuthSubjects, createSessionToken, SESSION_COOKIE, verifySessionToken } from "./session";

export interface AuthenticationProvider {
  verifyCredentials(identifier: string, password: string): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
  createSession(identifier: string): Promise<string>;
}

class SingleOwnerAuthProvider implements AuthenticationProvider {
  async verifyCredentials(identifier: string, password: string) {
    const normalized = identifier.trim().toLowerCase();
    const owner = process.env.STUDIO_OWNER_EMAIL?.trim().toLowerCase();
    const admin = process.env.STUDIO_ADMIN_USERNAME?.trim().toLowerCase();
    const stored = normalized === owner
      ? process.env.STUDIO_PASSWORD_HASH?.trim()
      : normalized === admin
        ? process.env.STUDIO_ADMIN_PASSWORD_HASH?.trim()
        : undefined;
    if (!configuredAuthSubjects().includes(normalized) || !stored) return false;
    const [iterationsRaw, salt, expectedHex] = stored.split(":");
    const iterations = Number(iterationsRaw);
    if (!Number.isInteger(iterations) || iterations < 100_000 || !salt || !/^[0-9a-f]{64}$/i.test(expectedHex || "")) return false;
    const actual = pbkdf2Sync(password, salt, iterations, 32, "sha256");
    return timingSafeEqual(actual, Buffer.from(expectedHex, "hex"));
  }
  async isAuthenticated() { return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value, process.env.STUDIO_SESSION_SECRET); }
  async createSession(identifier: string) {
    const secret = process.env.STUDIO_SESSION_SECRET;
    if (!secret || secret.length < 32) throw new Error("STUDIO_SESSION_SECRET은 32자 이상이어야 합니다.");
    return createSessionToken(identifier.trim().toLowerCase(), secret);
  }
}

export const authProvider: AuthenticationProvider = new SingleOwnerAuthProvider();
