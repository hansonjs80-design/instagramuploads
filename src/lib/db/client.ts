import "server-only";

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath =
  process.env.SQLITE_DATABASE_PATH ??
  join(process.cwd(), ".data", "exercise-content-studio.db");

declare global {
  var exerciseContentStudioDb: DatabaseSync | undefined;
}

function createDatabase(): DatabaseSync {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const schema = readFileSync(join(process.cwd(), "database", "schema.sql"), "utf8");
  database.exec(schema);
  ensureColumn(database, "content_items", "output_mode", "TEXT NOT NULL DEFAULT 'both'");
  ensureColumn(database, "content_items", "selected_outputs_json", "TEXT NOT NULL DEFAULT '[\"NAVER_BLOG_KR\",\"INSTAGRAM_KR\"]'");
  ensureColumn(database, "content_items", "experience_note", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "blog_posts", "naver_seo_json", "TEXT NOT NULL DEFAULT '{}'");
  ensureColumn(database, "blog_posts", "editor_json", "TEXT NOT NULL DEFAULT '{}'");
  ensureColumn(database, "blog_posts", "selected_title", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "blog_posts", "selected_hook", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "brand_profiles", "instagram_settings_json", "TEXT NOT NULL DEFAULT '{}'");
  ensureColumn(database, "instagram_publish_jobs", "output_type", "TEXT NOT NULL DEFAULT 'INSTAGRAM_KR'");
  ensureColumn(database, "instagram_published_posts", "output_type", "TEXT NOT NULL DEFAULT 'INSTAGRAM_KR'");
  return database;
}

function ensureColumn(
  database: DatabaseSync,
  table: string,
  column: string,
  definition: string,
): void {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function getDatabase(): DatabaseSync {
  if (!globalThis.exerciseContentStudioDb) {
    globalThis.exerciseContentStudioDb = createDatabase();
  }
  return globalThis.exerciseContentStudioDb;
}
