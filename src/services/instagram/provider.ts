import { getPublishMode } from "./config";
import { InstagramLoginProvider } from "./instagram-login-provider";
import { InstagramMockProvider } from "./mock-provider";
import type { InstagramProvider, PublishMode } from "./types";

export function getInstagramProvider(mode: PublishMode = getPublishMode()): InstagramProvider {
  return mode === "LIVE" ? new InstagramLoginProvider() : new InstagramMockProvider();
}
