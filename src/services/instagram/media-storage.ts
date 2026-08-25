import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { del, head, put } from "@vercel/blob";
import type { MediaStorageProvider } from "./types";

class CustomPublicStorageProvider implements MediaStorageProvider {
  readonly name: string = "CUSTOM_PUBLIC";
  private readonly root = join(process.cwd(), "public", "publish-assets");
  private readonly base = (process.env.MEDIA_STORAGE_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  getPublicUrl(key: string) { return `${this.base}/publish-assets/${encodeURIComponent(key)}`; }
  async upload(key: string, bytes: Uint8Array) { await mkdir(this.root, { recursive: true }); await writeFile(join(this.root, key), bytes); return this.getPublicUrl(key); }
  async delete(key: string) { await rm(join(this.root, key), { force: true }); }
  async exists(key: string) { try { await access(join(this.root, key)); return true; } catch { return false; } }
  async healthCheck() {
    if (!this.base) return { ok: false, message: "MEDIA_STORAGE_PUBLIC_BASE_URL이 필요합니다." };
    try {
      const url = new URL(this.base);
      if (["localhost", "127.0.0.1", "::1"].includes(url.hostname) || url.protocol !== "https:") return { ok: false, message: "LIVE 게시에는 외부에서 접근 가능한 HTTPS 미디어 URL이 필요합니다." };
      return { ok: true, message: "공개 HTTPS 주소가 설정되었습니다. 게시 사전검사에서 각 이미지 접근성을 다시 확인합니다." };
    } catch { return { ok: false, message: "공개 미디어 URL 형식이 올바르지 않습니다." }; }
  }
}

class MockStorageProvider extends CustomPublicStorageProvider {
  readonly name = "MOCK";
  getPublicUrl(key: string) { return `https://mock.storage.invalid/publish-assets/${encodeURIComponent(key)}`; }
  async healthCheck() { return { ok: true, message: "Mock public media storage ready" }; }
}

class VercelBlobStorageProvider implements MediaStorageProvider {
  readonly name = "VERCEL_BLOB";
  private readonly base = (process.env.MEDIA_STORAGE_PUBLIC_BASE_URL || "").replace(/\/$/, "");

  getPublicUrl(key: string) {
    return this.base ? `${this.base}/${key.split("/").map(encodeURIComponent).join("/")}` : "";
  }

  async upload(key: string, bytes: Uint8Array, contentType: "image/jpeg") {
    const blob = await put(`instagram-publish/${key}`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  async delete(key: string) {
    await del(`instagram-publish/${key}`, { token: process.env.BLOB_READ_WRITE_TOKEN });
  }

  async exists(key: string) {
    try {
      await head(`instagram-publish/${key}`, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { ok: false, message: "VERCEL_BLOB에는 BLOB_READ_WRITE_TOKEN이 필요합니다." };
    }
    return { ok: true, message: "Vercel Blob server credential configured" };
  }
}

export function getMediaStorageProvider(mock: boolean): MediaStorageProvider {
  if (mock) return new MockStorageProvider();
  return process.env.MEDIA_STORAGE_PROVIDER === "VERCEL_BLOB"
    ? new VercelBlobStorageProvider()
    : new CustomPublicStorageProvider();
}
