import "server-only";

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";
import { buildPostgresSchemaStatements } from "./schema";

export type DatabaseProvider = "sqlite" | "postgres";
export type QueryValue = string | number | null;
export type RunResult = { changes: number };

export interface AppDatabase {
  readonly provider: DatabaseProvider;
  run(sql: string, params?: readonly QueryValue[]): Promise<RunResult>;
  get<T>(sql: string, params?: readonly QueryValue[]): Promise<T | undefined>;
  all<T>(sql: string, params?: readonly QueryValue[]): Promise<T[]>;
  transaction<T>(callback: (database: AppDatabase) => Promise<T>): Promise<T>;
}

const databasePath =
  process.env.SQLITE_DATABASE_PATH ??
  join(process.cwd(), ".data", "exercise-content-studio.db");

declare global {
  var exerciseContentStudioDbPromise: Promise<AppDatabase> | undefined;
}

class SqliteDatabase implements AppDatabase {
  readonly provider = "sqlite" as const;

  constructor(private readonly database: DatabaseSync) {}

  async run(sql: string, params: readonly QueryValue[] = []): Promise<RunResult> {
    const result = this.database.prepare(sql).run(...params);
    return { changes: Number(result.changes) };
  }

  async get<T>(sql: string, params: readonly QueryValue[] = []): Promise<T | undefined> {
    return this.database.prepare(sql).get(...params) as T | undefined;
  }

  async all<T>(sql: string, params: readonly QueryValue[] = []): Promise<T[]> {
    return this.database.prepare(sql).all(...params) as T[];
  }

  async transaction<T>(callback: (database: AppDatabase) => Promise<T>): Promise<T> {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = await callback(this);
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

type PostgresSql = ReturnType<typeof postgres>;

function postgresQuery(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

class PostgresDatabase implements AppDatabase {
  readonly provider = "postgres" as const;

  constructor(private readonly sql: PostgresSql) {}

  async run(query: string, params: readonly QueryValue[] = []): Promise<RunResult> {
    const result = await this.sql.unsafe(postgresQuery(query), params as never[]);
    return { changes: result.count };
  }

  async get<T>(query: string, params: readonly QueryValue[] = []): Promise<T | undefined> {
    const rows = await this.sql.unsafe(postgresQuery(query), params as never[]);
    return rows[0] as T | undefined;
  }

  async all<T>(query: string, params: readonly QueryValue[] = []): Promise<T[]> {
    const rows = await this.sql.unsafe(postgresQuery(query), params as never[]);
    return rows as unknown as T[];
  }

  async transaction<T>(callback: (database: AppDatabase) => Promise<T>): Promise<T> {
    return this.sql.begin(async (transaction) =>
      callback(new PostgresDatabase(transaction as unknown as PostgresSql)),
    ) as Promise<T>;
  }
}

function createSqliteDatabase(): AppDatabase {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  const schema = readFileSync(join(process.cwd(), "database", "schema.sql"), "utf8");
  database.exec(schema);
  ensureSqliteColumn(database, "content_items", "output_mode", "TEXT NOT NULL DEFAULT 'both'");
  ensureSqliteColumn(database, "content_items", "selected_outputs_json", "TEXT NOT NULL DEFAULT '[\"NAVER_BLOG_KR\",\"INSTAGRAM_KR\"]'");
  ensureSqliteColumn(database, "content_items", "experience_note", "TEXT NOT NULL DEFAULT ''");
  ensureSqliteColumn(database, "blog_posts", "naver_seo_json", "TEXT NOT NULL DEFAULT '{}'");
  ensureSqliteColumn(database, "blog_posts", "editor_json", "TEXT NOT NULL DEFAULT '{}'");
  ensureSqliteColumn(database, "blog_posts", "selected_title", "TEXT NOT NULL DEFAULT ''");
  ensureSqliteColumn(database, "blog_posts", "selected_hook", "TEXT NOT NULL DEFAULT ''");
  ensureSqliteColumn(database, "brand_profiles", "instagram_settings_json", "TEXT NOT NULL DEFAULT '{}'");
  ensureSqliteColumn(database, "instagram_publish_jobs", "output_type", "TEXT NOT NULL DEFAULT 'INSTAGRAM_KR'");
  ensureSqliteColumn(database, "instagram_published_posts", "output_type", "TEXT NOT NULL DEFAULT 'INSTAGRAM_KR'");
  return new SqliteDatabase(database);
}

function ensureSqliteColumn(
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

async function createPostgresDatabase(): Promise<AppDatabase> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: "require",
    onnotice: () => undefined,
  });
  const database = new PostgresDatabase(sql);
  const sqliteSchema = readFileSync(join(process.cwd(), "database", "schema.sql"), "utf8");
  await database.transaction(async (transaction) => {
    await transaction.run("SELECT pg_advisory_xact_lock(873204125)");
    await transaction.run("CREATE TABLE IF NOT EXISTS app_schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
    const applied = await transaction.get<{ version: number }>("SELECT version FROM app_schema_migrations WHERE version = 1");
    if (!applied) {
      for (const statement of buildPostgresSchemaStatements(sqliteSchema)) {
        await transaction.run(statement);
      }
      await transaction.run("INSERT INTO app_schema_migrations (version, applied_at) VALUES (1, ?)", [new Date().toISOString()]);
    }
  });
  return database;
}

function configuredProvider(): DatabaseProvider {
  if (process.env.DATABASE_PROVIDER === "sqlite") return "sqlite";
  if (process.env.DATABASE_PROVIDER === "postgres" || process.env.DATABASE_URL) return "postgres";
  return "sqlite";
}

export function getDatabase(): Promise<AppDatabase> {
  if (!globalThis.exerciseContentStudioDbPromise) {
    globalThis.exerciseContentStudioDbPromise = configuredProvider() === "postgres"
      ? createPostgresDatabase()
      : Promise.resolve(createSqliteDatabase());
  }
  return globalThis.exerciseContentStudioDbPromise;
}

export function getConfiguredDatabaseProvider(): DatabaseProvider {
  return configuredProvider();
}
