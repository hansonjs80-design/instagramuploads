import { getInstagramAccount, getAccountToken, markAccountValidated } from "./account-repository";
import { getInstagramProvider } from "./provider";
import { getMediaStorageProvider } from "./media-storage";
import { INSTAGRAM_PUBLISH_SCOPES, type ConnectionHealth } from "./types";

export async function checkInstagramHealth(): Promise<{ health: ConnectionHealth; limit: { usage: number; total: number | null; available: boolean } | null }> {
  const account = getInstagramAccount();
  const messages: string[] = [];
  if (!account) return { health: { account: false, token: false, professionalAccount: false, publishingPermission: false, apiReachable: false, mediaStorage: false, ready: false, messages: ["Instagram 계정을 연결해 주세요."] }, limit: null };
  const provider = getInstagramProvider(account.publishMode);
  const storage = getMediaStorageProvider(account.publishMode === "MOCK");
  let token = false, apiReachable = false, professionalAccount = false, publishingPermission = false;
  let limit = null;
  const storageHealth = await storage.healthCheck();
  if (!storageHealth.ok) messages.push(storageHealth.message);
  try {
    const accessToken = getAccountToken(account.id);
    const remote = await provider.getAccount(accessToken);
    token = true; apiReachable = true; professionalAccount = remote.accountType === "BUSINESS" || remote.accountType === "CREATOR";
    const permissions = await provider.getPermissions(accessToken);
    publishingPermission = INSTAGRAM_PUBLISH_SCOPES.every((permission) => permissions.includes(permission));
    if (!publishingPermission) messages.push("필수 게시 권한이 없습니다.");
    limit = await provider.getPublishingLimit(account.instagramUserId, accessToken);
    if (!limit.available) messages.push("현재 API 게시 한도에 도달했습니다.");
    markAccountValidated(account.id);
  } catch (error) { messages.push(error instanceof Error ? error.message : "Instagram API 연결 검사에 실패했습니다."); }
  const ready = token && apiReachable && professionalAccount && publishingPermission && storageHealth.ok && Boolean(limit?.available);
  return { health: { account: true, token, professionalAccount, publishingPermission, apiReachable, mediaStorage: storageHealth.ok, ready, messages }, limit };
}
