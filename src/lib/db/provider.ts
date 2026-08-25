import "server-only";
import { getDatabase } from "./client";

export type DatabaseProviderInfo = { provider: "sqlite" | "postgres"; ready: boolean; persistent: boolean; message: string };

export function getDatabaseProviderInfo(): DatabaseProviderInfo {
  const provider = process.env.DATABASE_PROVIDER === "postgres" ? "postgres" : "sqlite";
  if (provider === "postgres") return { provider, ready: false, persistent: true, message: "PostgreSQL adapter 선택은 준비됐지만 이 checkout에는 연결 드라이버와 migration 실행이 필요합니다." };
  try {
    getDatabase().prepare("SELECT 1 AS ok").get();
    if (process.env.NODE_ENV === "production") return { provider, ready: false, persistent: false, message: "Vercel production에서는 local SQLite가 영속 저장소가 아닙니다." };
    return { provider, ready: true, persistent: true, message: "Local SQLite ready" };
  } catch (error) { return { provider, ready: false, persistent: false, message: error instanceof Error ? error.message : "Database unavailable" }; }
}
