import "server-only";
import { getConfiguredDatabaseProvider, getDatabase } from "./client";

export type DatabaseProviderInfo = { provider: "sqlite" | "postgres"; ready: boolean; persistent: boolean; message: string };

export async function getDatabaseProviderInfo(): Promise<DatabaseProviderInfo> {
  const provider = getConfiguredDatabaseProvider();
  try {
    const database = await getDatabase();
    await database.get("SELECT 1 AS ok");
    if (provider === "postgres") return { provider, ready: true, persistent: true, message: "Supabase PostgreSQL ready" };
    if (process.env.NODE_ENV === "production") return { provider, ready: false, persistent: false, message: "Vercel production에서는 local SQLite가 영속 저장소가 아닙니다." };
    return { provider, ready: true, persistent: true, message: "Local SQLite ready" };
  } catch (error) { return { provider, ready: false, persistent: false, message: error instanceof Error ? error.message : "Database unavailable" }; }
}
