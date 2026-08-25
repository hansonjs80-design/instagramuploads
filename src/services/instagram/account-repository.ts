import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { decryptToken, encryptToken } from "./token-crypto";
import type { InstagramAccount, PublishMode } from "./types";

type AccountRow = { id: string; instagram_user_id: string; username: string; account_type: InstagramAccount["accountType"]; profile_picture_url: string; encrypted_access_token: string; expires_at: string | null; scopes_json: string; connection_status: InstagramAccount["connectionStatus"]; publish_mode: PublishMode; connected_at: string; last_validated_at: string | null };

function map(row: AccountRow): InstagramAccount {
  const expiring = row.expires_at && new Date(row.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60_000;
  return { id: row.id, instagramUserId: row.instagram_user_id, username: row.username, accountType: row.account_type, profilePictureUrl: row.profile_picture_url, scopes: JSON.parse(row.scopes_json) as string[], connectionStatus: expiring ? "TOKEN_EXPIRING" : row.connection_status, publishMode: row.publish_mode, expiresAt: row.expires_at, connectedAt: row.connected_at, lastValidatedAt: row.last_validated_at };
}

export async function getInstagramAccount(): Promise<InstagramAccount | null> {
  const db = await getDatabase();
  const row = await db.get<AccountRow>("SELECT * FROM instagram_accounts WHERE connection_status != 'DISCONNECTED' ORDER BY connected_at DESC LIMIT 1");
  return row ? map(row) : null;
}

export async function getAccountToken(id: string): Promise<string> {
  const db = await getDatabase();
  const row = await db.get<{ encrypted_access_token: string; publish_mode: PublishMode }>("SELECT encrypted_access_token, publish_mode FROM instagram_accounts WHERE id = ?", [id]);
  if (!row) throw new Error("Instagram 계정을 찾을 수 없습니다.");
  return row.publish_mode === "MOCK" ? "mock-access-token" : decryptToken(row.encrypted_access_token);
}

export async function saveInstagramAccount(input: { instagramUserId: string; username: string; accountType: InstagramAccount["accountType"]; profilePictureUrl: string; accessToken: string; tokenType: string; expiresAt: string | null; scopes: string[]; publishMode: PublishMode }): Promise<InstagramAccount> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const encrypted = input.publishMode === "MOCK" ? "mock-token-not-a-credential" : encryptToken(input.accessToken);
  const db = await getDatabase();
  await db.run(`INSERT INTO instagram_accounts
    (id, instagram_user_id, username, account_type, profile_picture_url, encrypted_access_token, token_type, expires_at, scopes_json, connection_status, publish_mode, connected_at, last_validated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONNECTED', ?, ?, ?)
    ON CONFLICT(instagram_user_id) DO UPDATE SET username=excluded.username, account_type=excluded.account_type, profile_picture_url=excluded.profile_picture_url, encrypted_access_token=excluded.encrypted_access_token, token_type=excluded.token_type, expires_at=excluded.expires_at, scopes_json=excluded.scopes_json, connection_status='CONNECTED', publish_mode=excluded.publish_mode, connected_at=excluded.connected_at, last_validated_at=excluded.last_validated_at`,
    [id, input.instagramUserId, input.username, input.accountType, input.profilePictureUrl, encrypted, input.tokenType, input.expiresAt, JSON.stringify(input.scopes), input.publishMode, now, now]);
  return (await getInstagramAccount())!;
}

export async function disconnectInstagramAccount(): Promise<void> {
  const db = await getDatabase();
  await db.run("UPDATE instagram_accounts SET connection_status = 'DISCONNECTED', encrypted_access_token = '', last_validated_at = ?", [new Date().toISOString()]);
}

export async function markAccountValidated(id: string): Promise<void> {
  const db = await getDatabase();
  await db.run("UPDATE instagram_accounts SET last_validated_at = ?, connection_status = 'CONNECTED' WHERE id = ?", [new Date().toISOString(), id]);
}
