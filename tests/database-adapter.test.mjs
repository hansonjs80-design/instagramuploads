import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPostgresSchemaStatements } from "../src/lib/db/schema.ts";

test("PostgreSQL schema migration removes SQLite-only syntax and orders foreign keys", () => {
  const schema = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
  const statements = buildPostgresSchemaStatements(schema);
  const joined = statements.join(";\n");
  assert.doesNotMatch(joined, /PRAGMA|AUTOINCREMENT|INSERT OR IGNORE/);
  assert.match(joined, /BIGSERIAL PRIMARY KEY/);
  assert.match(joined, /ON CONFLICT \(id\) DO NOTHING/);
  const account = statements.findIndex((item) => item.includes("CREATE TABLE IF NOT EXISTS instagram_accounts"));
  const defaults = statements.findIndex((item) => item.includes("CREATE TABLE IF NOT EXISTS instagram_output_account_defaults"));
  assert.ok(account >= 0 && defaults > account);
});
