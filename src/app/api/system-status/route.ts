import { NextResponse } from "next/server";
import { getDatabaseProviderInfo } from "@/lib/db/provider";
import { getInstagramAccount } from "@/services/instagram/account-repository";
import { getMediaStorageProvider } from "@/services/instagram/media-storage";
import { getPublishMode } from "@/services/instagram/config";

export const runtime = "nodejs";
type Status = { name: string; status: "READY" | "WARNING" | "ERROR"; message: string };
export async function GET() {
  const items: Status[] = [];
  items.push({ name: "AI Provider", status: process.env.OPENAI_API_KEY ? "READY" : "WARNING", message: process.env.OPENAI_API_KEY ? "OpenAI server credential configured" : "OPENAI_API_KEY가 필요합니다." });
  const database = getDatabaseProviderInfo();
  items.push({ name: "Database", status: database.ready ? "READY" : "ERROR", message: database.message });
  const media = await getMediaStorageProvider(getPublishMode() === "MOCK").healthCheck();
  items.push({ name: "Media Storage", status: media.ok ? "READY" : "ERROR", message: media.message });
  const instagram = getInstagramAccount();
  items.push({ name: "Instagram API", status: instagram ? (instagram.connectionStatus === "CONNECTED" ? "READY" : "WARNING") : "WARNING", message: instagram ? `@${instagram.username} · ${instagram.publishMode}` : "계정이 연결되지 않았습니다." });
  items.push({ name: "Naver API", status: process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET ? "READY" : "WARNING", message: process.env.NAVER_CLIENT_ID ? "Naver trend credential configured" : "키워드 후보는 동작하지만 실제 Trend 비교에는 API 설정이 필요합니다." });
  let appUrlStatus: Status["status"] = "ERROR"; let appUrlMessage = "APP_BASE_URL이 필요합니다.";
  try { const app = new URL(process.env.APP_BASE_URL || ""); appUrlStatus = app.protocol === "https:" || process.env.NODE_ENV !== "production" ? "READY" : "ERROR"; appUrlMessage = app.toString(); } catch {}
  items.push({ name: "Application URL", status: appUrlStatus, message: appUrlMessage });
  const authReady = Boolean(process.env.STUDIO_OWNER_EMAIL && process.env.STUDIO_PASSWORD_HASH && (process.env.STUDIO_SESSION_SECRET?.length ?? 0) >= 32);
  items.push({ name: "Authentication", status: authReady ? "READY" : "ERROR", message: authReady ? "Single-owner server authentication configured" : "Owner email, password hash, 32+ character session secret가 필요합니다." });
  return NextResponse.json({ environment: process.env.NODE_ENV === "production" ? "PRODUCTION" : "DEVELOPMENT", items });
}
