import { randomUUID } from "node:crypto";
import type { InstagramProvider } from "./types";

export class InstagramMockProvider implements InstagramProvider {
  readonly mode = "MOCK" as const;
  constructor(private readonly scenario = process.env.INSTAGRAM_MOCK_SCENARIO || "SUCCESS") {}
  private fail(stage: string) {
    if (this.scenario === stage) throw new Error(`MOCK_${stage}`);
  }
  async getAccount() { this.fail("TOKEN_EXPIRED"); return { instagramUserId: "mock-ig-1001", username: "movementnote_mock", accountType: "CREATOR" as const, profilePictureUrl: "" }; }
  async getPermissions() { this.fail("PERMISSION_ERROR"); return ["instagram_business_basic", "instagram_business_content_publish"]; }
  async getPublishingLimit() { this.fail("RATE_LIMIT"); return { usage: 3, total: 100, available: true }; }
  async createImageContainer() { this.fail("CHILD_CONTAINER_FAILURE"); return `mock-child-${randomUUID()}`; }
  async createCarouselContainer() { this.fail("CAROUSEL_FAILURE"); return `mock-carousel-${randomUUID()}`; }
  async getContainerStatus() { return "FINISHED" as const; }
  async publishContainer() { this.fail("PUBLISH_TIMEOUT"); const mediaId = `mock-media-${randomUUID()}`; return { mediaId, permalink: `https://www.instagram.com/p/mock-${mediaId.slice(-8)}/` }; }
  async getPublishedMedia(mediaId: string) { return { mediaId, permalink: `https://www.instagram.com/p/mock-${mediaId.slice(-8)}/` }; }
}
