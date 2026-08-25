import { INSTAGRAM_GRAPH_BASE } from "./config";
import { InstagramProviderError } from "./errors";
import type { ContainerStatus, InstagramProvider, PublishResult, PublishingLimit } from "./types";

type MetaError = { error?: { code?: number; error_subcode?: number; message?: string }; id?: string; status_code?: string; permalink?: string; data?: unknown[]; user_id?: string; username?: string; account_type?: string; profile_picture_url?: string };

async function graph(path: string, accessToken: string, init?: RequestInit): Promise<MetaError> {
  const response = await fetch(`${INSTAGRAM_GRAPH_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded", ...init?.headers },
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json() as MetaError;
  if (!response.ok || payload.error) {
    const metaCode = payload.error?.code;
    const code = metaCode === 190 ? "TOKEN_EXPIRED" : metaCode === 10 || metaCode === 200 ? "PERMISSION_MISSING" : metaCode === 4 || metaCode === 32 ? "RATE_LIMIT" : "API_ERROR";
    throw new InstagramProviderError(code, { status: response.status, metaCode, requestId: response.headers.get("x-fb-request-id") ?? undefined });
  }
  return payload;
}

function idOf(payload: MetaError): string {
  const id = payload.id || payload.user_id;
  if (!id) throw new InstagramProviderError("API_ERROR");
  return id;
}

export class InstagramLoginProvider implements InstagramProvider {
  readonly mode = "LIVE" as const;

  async getAccount(accessToken: string) {
    const value = await graph("/me?fields=user_id,username,account_type,profile_picture_url", accessToken);
    const type: "BUSINESS" | "CREATOR" | "UNKNOWN" = value.account_type === "BUSINESS" || value.account_type === "CREATOR" ? value.account_type : "UNKNOWN";
    if (type === "UNKNOWN") throw new InstagramProviderError("PERSONAL_ACCOUNT");
    return { instagramUserId: idOf(value), username: value.username || "instagram", accountType: type, profilePictureUrl: value.profile_picture_url || "" };
  }

  async getPermissions(accessToken: string): Promise<string[]> {
    const payload = await graph("/me/permissions", accessToken);
    const data = Array.isArray(payload.data) ? payload.data : [];
    return data.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { permission?: unknown; status?: unknown };
      return typeof row.permission === "string" && row.status === "granted" ? [row.permission] : [];
    });
  }

  async getPublishingLimit(accountId: string, accessToken: string): Promise<PublishingLimit> {
    const payload = await graph(`/${encodeURIComponent(accountId)}/content_publishing_limit?fields=quota_usage,config`, accessToken);
    const row = Array.isArray(payload.data) && payload.data[0] && typeof payload.data[0] === "object" ? payload.data[0] as { quota_usage?: unknown; config?: { quota_total?: unknown } } : {};
    const usage = Number(row.quota_usage) || 0;
    const total = Number.isFinite(Number(row.config?.quota_total)) ? Number(row.config?.quota_total) : null;
    return { usage, total, available: total === null || usage < total };
  }

  async createImageContainer(accountId: string, imageUrl: string, accessToken: string): Promise<string> {
    const body = new URLSearchParams({ image_url: imageUrl, is_carousel_item: "true" });
    return idOf(await graph(`/${encodeURIComponent(accountId)}/media`, accessToken, { method: "POST", body }));
  }

  async createCarouselContainer(accountId: string, childIds: string[], caption: string, accessToken: string): Promise<string> {
    const body = new URLSearchParams({ media_type: "CAROUSEL", children: childIds.join(","), caption });
    return idOf(await graph(`/${encodeURIComponent(accountId)}/media`, accessToken, { method: "POST", body }));
  }

  async getContainerStatus(containerId: string, accessToken: string): Promise<ContainerStatus> {
    const status = (await graph(`/${encodeURIComponent(containerId)}?fields=status_code`, accessToken)).status_code;
    if (!["IN_PROGRESS", "FINISHED", "ERROR", "EXPIRED", "PUBLISHED"].includes(status || "")) throw new InstagramProviderError("CONTAINER_ERROR");
    return status as ContainerStatus;
  }

  async publishContainer(accountId: string, creationId: string, accessToken: string): Promise<PublishResult> {
    const body = new URLSearchParams({ creation_id: creationId });
    const mediaId = idOf(await graph(`/${encodeURIComponent(accountId)}/media_publish`, accessToken, { method: "POST", body }));
    return this.getPublishedMedia(mediaId, accessToken);
  }

  async getPublishedMedia(mediaId: string, accessToken: string): Promise<PublishResult> {
    const payload = await graph(`/${encodeURIComponent(mediaId)}?fields=id,permalink`, accessToken);
    return { mediaId: idOf(payload), permalink: payload.permalink || "" };
  }
}
