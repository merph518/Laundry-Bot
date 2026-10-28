import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import oracledb from "oracledb";

const [envFile, sqlFile] = process.argv.slice(2);

if (!envFile || !sqlFile) {
  console.error("Usage: tsx src/scripts/runSql.ts <env-file> <sql-file>");
  process.exit(2);
}

// Splits a migration into statements. It drops whole-line comments and splits on ";", so a
// semicolon inside a string literal is not supported.
function splitStatements(sql: string): string[] {
  return sql
    .replace(/^\s*--.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const env = dotenv.parse(readFileSync(envFile));
  const user = env.ORACLE_USER;
  const password = env.ORACLE_PASSWORD;
  const connectString = env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    throw new Error(`Missing ORACLE_USER, ORACLE_PASSWORD or ORACLE_CONNECT_STRING in ${envFile}.`);
  }

  const statements = splitStatements(readFileSync(sqlFile, "utf8"));
  const connection = await oracledb.getConnection({ user, password, connectString });

  try {
    for (const statement of statements) {
      if (/^commit$/i.test(statement)) {
        await connection.commit();
        console.log("COMMIT");
        continue;
      }

      const result = await connection.execute(statement);
      const summary = statement.split("\n")[0].slice(0, 70);
      console.log(`ok: ${summary}${result.rowsAffected === undefined ? "" : ` (${result.rowsAffected} rows)`}`);
    }
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed.", error instanceof Error ? error.message : error);
  process.exit(1);
});
