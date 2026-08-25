export const INSTAGRAM_CAROUSEL_MAX_ITEMS = 10;
export const INSTAGRAM_PUBLISH_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"] as const;

export type PublishMode = "MOCK" | "LIVE";
export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "ERROR" | "EXPIRED" | "PUBLISHED";
export type PublishJobStatus =
  | "DRAFT" | "PREPARING" | "VALIDATING" | "UPLOADING_ASSETS"
  | "CREATING_CHILD_CONTAINERS" | "WAITING_CHILDREN" | "CREATING_CAROUSEL"
  | "WAITING_CAROUSEL" | "READY_TO_PUBLISH" | "PUBLISHING" | "PUBLISHED" | "FAILED";

export type InstagramAccount = {
  id: string;
  instagramUserId: string;
  username: string;
  accountType: "BUSINESS" | "CREATOR" | "UNKNOWN";
  profilePictureUrl: string;
  scopes: string[];
  connectionStatus: "CONNECTED" | "TOKEN_EXPIRING" | "RECONNECT_REQUIRED" | "DISCONNECTED";
  publishMode: PublishMode;
  expiresAt: string | null;
  connectedAt: string;
  lastValidatedAt: string | null;
};

export type ConnectionHealth = {
  account: boolean;
  token: boolean;
  professionalAccount: boolean;
  publishingPermission: boolean;
  apiReachable: boolean;
  mediaStorage: boolean;
  ready: boolean;
  messages: string[];
};

export type PublishingLimit = { usage: number; total: number | null; available: boolean };
export type PublishResult = { mediaId: string; permalink: string };

export interface InstagramProvider {
  readonly mode: PublishMode;
  getAccount(accessToken: string): Promise<Omit<InstagramAccount, "id" | "publishMode" | "connectionStatus" | "connectedAt" | "lastValidatedAt" | "expiresAt" | "scopes">>;
  getPermissions(accessToken: string): Promise<string[]>;
  getPublishingLimit(accountId: string, accessToken: string): Promise<PublishingLimit>;
  createImageContainer(accountId: string, imageUrl: string, accessToken: string): Promise<string>;
  createCarouselContainer(accountId: string, childIds: string[], caption: string, accessToken: string): Promise<string>;
  getContainerStatus(containerId: string, accessToken: string): Promise<ContainerStatus>;
  publishContainer(accountId: string, creationId: string, accessToken: string): Promise<PublishResult>;
  getPublishedMedia(mediaId: string, accessToken: string): Promise<PublishResult>;
}

export interface MediaStorageProvider {
  readonly name: string;
  upload(key: string, bytes: Uint8Array, contentType: "image/jpeg"): Promise<string>;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}
