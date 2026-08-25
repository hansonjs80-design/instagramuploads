export function buildPostgresSchemaStatements(sqliteSchema: string): string[] {
  const statements = sqliteSchema
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("PRAGMA"))
    .map((statement) => statement
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "BIGSERIAL PRIMARY KEY")
      .replace(/^INSERT OR IGNORE INTO brand_profiles/, "INSERT INTO brand_profiles")
      .replace(/\bINSERT OR IGNORE INTO\b/g, "INSERT INTO"));

  const defaultsIndex = statements.findIndex((statement) =>
    statement.startsWith("CREATE TABLE IF NOT EXISTS instagram_output_account_defaults"),
  );
  if (defaultsIndex >= 0) {
    const [defaultsTable] = statements.splice(defaultsIndex, 1);
    const accountsIndex = statements.findIndex((statement) =>
      statement.startsWith("CREATE TABLE IF NOT EXISTS instagram_accounts"),
    );
    statements.splice(accountsIndex + 1, 0, defaultsTable);
  }

  return statements.map((statement) => {
    if (statement.startsWith("INSERT INTO brand_profiles")) {
      return `${statement} ON CONFLICT (id) DO NOTHING`;
    }
    return statement;
  });
}
