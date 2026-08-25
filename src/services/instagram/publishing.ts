import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getDatabase } from "@/lib/db/client";
import { getContentById, getInstagramOutput } from "@/lib/db/repository";
import { getInstagramAccount, getAccountToken } from "./account-repository";
import { InstagramProviderError } from "./errors";
import { getMediaStorageProvider } from "./media-storage";
import { getInstagramProvider } from "./provider";
import { INSTAGRAM_CAROUSEL_MAX_ITEMS, type PublishJobStatus } from "./types";

export type PublishJob = { id: string; contentId: string; outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN"; status: PublishJobStatus; caption: string; qualityScore: number; brandScore: number; createdAt: string; completedAt: string | null; errorCode: string | null; errorMessage: string | null; carouselContainerId: string | null; instagramMediaId: string | null; nextPollAt: string | null; accountUsername: string; cardCount: number; permalink: string };
type JobRow = { id: string; content_id: string; output_type: "INSTAGRAM_KR" | "INSTAGRAM_EN"; status: PublishJobStatus; caption: string; quality_score: number; brand_score: number; created_at: string; completed_at: string | null; error_code: string | null; error_message: string | null; carousel_container_id: string | null; instagram_media_id: string | null; next_poll_at: string | null; username: string; card_count: number; permalink: string | null };

function mapJob(row: JobRow): PublishJob { return { id: row.id, contentId: row.content_id, outputType: row.output_type, status: row.status, caption: row.caption, qualityScore: row.quality_score, brandScore: row.brand_score, createdAt: row.created_at, completedAt: row.completed_at, errorCode: row.error_code, errorMessage: row.error_message, carouselContainerId: row.carousel_container_id, instagramMediaId: row.instagram_media_id, nextPollAt: row.next_poll_at, accountUsername: row.username, cardCount: row.card_count, permalink: row.permalink || "" }; }

export function getPublishJob(id: string): PublishJob | null {
  const row = getDatabase().prepare(`SELECT j.*, a.username, (SELECT COUNT(*) FROM instagram_publish_assets x WHERE x.publish_job_id=j.id) card_count, p.permalink FROM instagram_publish_jobs j JOIN instagram_accounts a ON a.id=j.account_id LEFT JOIN instagram_published_posts p ON p.publish_job_id=j.id WHERE j.id=?`).get(id) as JobRow | undefined;
  return row ? mapJob(row) : null;
}

export function getLatestPublishJobByContent(contentId: string, outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN" = "INSTAGRAM_KR"): PublishJob | null {
  const row = getDatabase().prepare(`SELECT j.*, a.username, (SELECT COUNT(*) FROM instagram_publish_assets x WHERE x.publish_job_id=j.id) card_count, p.permalink FROM instagram_publish_jobs j JOIN instagram_accounts a ON a.id=j.account_id LEFT JOIN instagram_published_posts p ON p.publish_job_id=j.id WHERE j.content_id=? AND j.output_type=? ORDER BY j.created_at DESC LIMIT 1`).get(contentId, outputType) as JobRow | undefined;
  return row ? mapJob(row) : null;
}

function jpegDimensions(bytes: Buffer): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

export async function createPublishJob(input: { contentId: string; outputType: "INSTAGRAM_KR" | "INSTAGRAM_EN"; caption: string; images: string[]; confirmed: boolean; republish?: boolean }): Promise<PublishJob> {
  if (!input.confirmed) throw new Error("최종 게시 확인이 필요합니다.");
  const account = getInstagramAccount();
  const content = getContentById(input.contentId);
  const instagramOutput = content ? getInstagramOutput(input.contentId, input.outputType) : null;
  if (!account || !content || !instagramOutput) throw new Error("게시할 계정 또는 콘텐츠가 준비되지 않았습니다.");
  if (input.images.length < 2 || input.images.length > INSTAGRAM_CAROUSEL_MAX_ITEMS || input.images.length !== instagramOutput.instagramCards.length) throw new Error("Carousel 이미지 수와 카드 순서가 일치하지 않습니다.");
  if (instagramOutput.instagramEngine.quality.warnings.some((warning) => warning.severity === "error")) throw new Error("치명적인 Instagram 품질 오류를 먼저 해결해 주세요.");
  if (!instagramOutput.instagramCards.at(-1)?.source && !input.caption.includes("Source")) throw new Error("출처 정보가 누락되었습니다.");
  const decoded = input.images.map((data, index) => {
    const match = data.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new Error(`${index + 1}번 이미지는 JPEG 형식이 아닙니다.`);
    const bytes = Buffer.from(match[1], "base64");
    const dimensions = jpegDimensions(bytes);
    if (!dimensions || dimensions.width !== 1080 || dimensions.height !== 1350) throw new Error(`${index + 1}번 이미지는 1080×1350 JPEG여야 합니다.`);
    return { bytes, hash: createHash("sha256").update(bytes).digest("hex") };
  });
  if (new Set(decoded.map((item) => item.hash)).size !== decoded.length) throw new Error("중복 이미지가 포함되어 있습니다.");
  const version = content.updatedAt;
  const idempotencyKey = createHash("sha256").update([input.contentId, input.outputType, version, account.id, ...decoded.map((item) => item.hash)].join("|")).digest("hex");
  const existing = getDatabase().prepare("SELECT id, status FROM instagram_publish_jobs WHERE idempotency_key = ?").get(idempotencyKey) as { id: string; status: PublishJobStatus } | undefined;
  if (existing && (!input.republish || existing.status !== "PUBLISHED")) throw new InstagramProviderError("DUPLICATE_PUBLISH");
  const jobId = randomUUID();
  const directory = join(process.cwd(), ".data", "instagram-publish", jobId);
  await mkdir(directory, { recursive: true });
  const now = new Date().toISOString();
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare(`INSERT INTO instagram_publish_jobs (id, account_id, content_id, content_version_id, output_type, idempotency_key, status, caption, quality_score, brand_score, created_at, confirmed_at) VALUES (?, ?, ?, ?, ?, ?, 'PREPARING', ?, ?, ?, ?, ?)`)
      .run(jobId, account.id, input.contentId, version, input.outputType, input.republish ? `${idempotencyKey}-${randomUUID()}` : idempotencyKey, input.caption, instagramOutput.instagramEngine.quality.total, instagramOutput.instagramEngine.quality.scores.brand, now, now);
    for (let index = 0; index < decoded.length; index++) {
      const path = join(directory, `${String(index + 1).padStart(2, "0")}.jpg`);
      await writeFile(path, decoded[index].bytes);
      db.prepare(`INSERT INTO instagram_publish_assets (id, publish_job_id, card_id, order_index, local_path, jpeg_path, public_url, public_storage_key, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?)`)
        .run(randomUUID(), jobId, String(index + 1), index, path, path, `${jobId}-${String(index + 1).padStart(2, "0")}.jpg`, decoded[index].hash, now);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return getPublishJob(jobId)!;
}

function setStatus(id: string, status: PublishJobStatus, extras: { carousel?: string; media?: string; nextPoll?: string | null } = {}) {
  getDatabase().prepare(`UPDATE instagram_publish_jobs SET status=?, started_at=COALESCE(started_at, ?), carousel_container_id=COALESCE(?, carousel_container_id), instagram_media_id=COALESCE(?, instagram_media_id), next_poll_at=? WHERE id=?`)
    .run(status, new Date().toISOString(), extras.carousel ?? null, extras.media ?? null, extras.nextPoll ?? null, id);
}

export async function advancePublishJob(id: string): Promise<PublishJob> {
  const db = getDatabase();
  const raw = db.prepare("SELECT * FROM instagram_publish_jobs WHERE id=?").get(id) as { account_id: string; content_id: string; content_version_id: string; output_type: "INSTAGRAM_KR" | "INSTAGRAM_EN"; status: PublishJobStatus; caption: string; carousel_container_id: string | null; next_poll_at: string | null } | undefined;
  if (!raw) throw new Error("게시 작업을 찾을 수 없습니다.");
  if (["PUBLISHED", "FAILED"].includes(raw.status)) return getPublishJob(id)!;
  const account = getInstagramAccount();
  if (!account || account.id !== raw.account_id) throw new Error("게시 계정 연결을 확인해 주세요.");
  const provider = getInstagramProvider(account.publishMode);
  const storage = getMediaStorageProvider(account.publishMode === "MOCK");
  const token = getAccountToken(account.id);
  const assets = db.prepare("SELECT * FROM instagram_publish_assets WHERE publish_job_id=? ORDER BY order_index").all(id) as Array<{ id: string; jpeg_path: string; public_storage_key: string; public_url: string; child_container_id: string | null; container_status: string }>;
  try {
    if (raw.status === "PREPARING") setStatus(id, "VALIDATING");
    else if (raw.status === "VALIDATING") {
      const health = await storage.healthCheck();
      const limit = await provider.getPublishingLimit(account.instagramUserId, token);
      if (!health.ok) throw new InstagramProviderError("MEDIA_NOT_PUBLIC");
      if (!limit.available) throw new InstagramProviderError("RATE_LIMIT");
      setStatus(id, "UPLOADING_ASSETS");
    } else if (raw.status === "UPLOADING_ASSETS") {
      for (const asset of assets) {
        const url = await storage.upload(asset.public_storage_key, await readFile(asset.jpeg_path), "image/jpeg");
        if (account.publishMode === "LIVE") {
          const publicResponse = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
          if (!publicResponse.ok || !/^image\/jpeg/i.test(publicResponse.headers.get("content-type") || "")) throw new InstagramProviderError("MEDIA_NOT_PUBLIC");
        }
        db.prepare("UPDATE instagram_publish_assets SET public_url=? WHERE id=?").run(url, asset.id);
      }
      setStatus(id, "CREATING_CHILD_CONTAINERS");
    } else if (raw.status === "CREATING_CHILD_CONTAINERS") {
      for (const asset of assets) {
        const child = await provider.createImageContainer(account.instagramUserId, asset.public_url || storage.getPublicUrl(asset.public_storage_key), token);
        db.prepare("UPDATE instagram_publish_assets SET child_container_id=?, container_status='IN_PROGRESS' WHERE id=?").run(child, asset.id);
      }
      setStatus(id, "WAITING_CHILDREN", { nextPoll: new Date(Date.now() + (account.publishMode === "MOCK" ? 0 : 60_000)).toISOString() });
    } else if (raw.status === "WAITING_CHILDREN") {
      if (raw.next_poll_at && new Date(raw.next_poll_at).getTime() > Date.now()) return getPublishJob(id)!;
      let complete = true;
      for (const asset of assets) {
        const status = await provider.getContainerStatus(asset.child_container_id!, token);
        db.prepare("UPDATE instagram_publish_assets SET container_status=? WHERE id=?").run(status, asset.id);
        if (["ERROR", "EXPIRED"].includes(status)) throw new InstagramProviderError("CONTAINER_ERROR");
        if (status !== "FINISHED" && status !== "PUBLISHED") complete = false;
      }
      setStatus(id, complete ? "CREATING_CAROUSEL" : "WAITING_CHILDREN", { nextPoll: complete ? null : new Date(Date.now() + 60_000).toISOString() });
    } else if (raw.status === "CREATING_CAROUSEL") {
      const children = assets.map((asset) => asset.child_container_id!).filter(Boolean);
      const carousel = await provider.createCarouselContainer(account.instagramUserId, children, raw.caption, token);
      setStatus(id, "WAITING_CAROUSEL", { carousel, nextPoll: new Date(Date.now() + (account.publishMode === "MOCK" ? 0 : 60_000)).toISOString() });
    } else if (raw.status === "WAITING_CAROUSEL") {
      if (raw.next_poll_at && new Date(raw.next_poll_at).getTime() > Date.now()) return getPublishJob(id)!;
      const status = await provider.getContainerStatus(raw.carousel_container_id!, token);
      if (["ERROR", "EXPIRED"].includes(status)) throw new InstagramProviderError("CONTAINER_ERROR");
      setStatus(id, status === "FINISHED" || status === "PUBLISHED" ? "READY_TO_PUBLISH" : "WAITING_CAROUSEL", { nextPoll: new Date(Date.now() + 60_000).toISOString() });
    } else if (raw.status === "READY_TO_PUBLISH") setStatus(id, "PUBLISHING");
    else if (raw.status === "PUBLISHING") {
      const result = await provider.publishContainer(account.instagramUserId, raw.carousel_container_id!, token);
      const now = new Date().toISOString();
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("UPDATE instagram_publish_jobs SET status='PUBLISHED', instagram_media_id=?, completed_at=?, next_poll_at=NULL WHERE id=?").run(result.mediaId, now, id);
        const job = getPublishJob(id)!;
        db.prepare(`INSERT INTO instagram_published_posts (id, instagram_account_id, content_id, content_version_id, output_type, publish_job_id, instagram_media_id, permalink, caption, card_count, published_at, quality_score, brand_score, source_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`)
          .run(randomUUID(), account.id, raw.content_id, raw.content_version_id, raw.output_type, id, result.mediaId, result.permalink, raw.caption, assets.length, now, job.qualityScore, job.brandScore, raw.content_id);
        db.exec("COMMIT");
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    }
  } catch (error) {
    const code = error instanceof InstagramProviderError ? error.code : String(error instanceof Error ? error.message : "API_ERROR").replace(/^MOCK_/, "");
    const message = error instanceof Error ? error.message : "Instagram 게시에 실패했습니다.";
    db.prepare("UPDATE instagram_publish_jobs SET status='FAILED', failed_at=?, error_code=?, error_message=? WHERE id=?").run(new Date().toISOString(), code, message.slice(0, 500), id);
  }
  return getPublishJob(id)!;
}

export function listPublishedPosts() {
  return getDatabase().prepare(`SELECT p.id, p.instagram_media_id mediaId, p.output_type outputType, p.permalink, p.caption, p.card_count cardCount, p.published_at publishedAt, p.quality_score qualityScore, p.brand_score brandScore, p.status, a.username, c.original_title title, c.expert_name expertName FROM instagram_published_posts p JOIN instagram_accounts a ON a.id=p.instagram_account_id JOIN content_items c ON c.id=p.content_id ORDER BY p.published_at DESC`).all();
}
