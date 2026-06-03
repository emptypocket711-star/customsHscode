#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");

function usage() {
  return [
    "Preview migration application plan",
    "usage: npm run db:preview-migration:plan -- --file supabase/migrations/<timestamp_name>.sql",
    "secretValues=not-printed"
  ].join("\n");
}

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") {
      args.set("file", argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith("--file=")) {
      args.set("file", arg.slice("--file=".length));
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      args.set("help", "true");
    }
  }

  return args;
}

function assert(condition, message) {
  if (condition) return;
  throw new Error(message);
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function migrationFiles() {
  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
}

function normalizeMigrationPath(input) {
  assert(input, "--file 인자가 필요합니다.");
  assert(!path.isAbsolute(input), "--file은 repo 기준 상대 경로로 입력합니다.");

  const normalized = path.normalize(input);
  assert(!normalized.startsWith(".."), "--file은 repo 밖을 가리킬 수 없습니다.");
  assert(normalized.startsWith(path.join("supabase", "migrations")), "--file은 supabase/migrations 아래 SQL이어야 합니다.");
  assert(normalized.endsWith(".sql"), "--file은 .sql 파일이어야 합니다.");

  const absolutePath = path.join(root, normalized);
  assert(existsSync(absolutePath), `migration 파일이 없습니다: ${normalized}`);
  assert(path.dirname(absolutePath) === migrationsDir, "migration 파일은 supabase/migrations 직하위에 있어야 합니다.");

  const fileName = path.basename(normalized);
  const files = migrationFiles();
  const index = files.indexOf(fileName);
  assert(index >= 0, `migration 목록에서 파일을 찾지 못했습니다: ${fileName}`);

  return {
    fileName,
    index,
    latestFileName: files.at(-1),
    normalized,
    total: files.length
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.has("help")) {
    console.log(usage());
    return;
  }

  const migration = normalizeMigrationPath(args.get("file"));

  console.log("Preview migration application plan");
  console.log(`migration=${migration.normalized}`);
  console.log(`migrationOrder=${migration.index + 1}/${migration.total}`);
  console.log(`latestMigration=${migration.latestFileName}`);
  console.log("secretValues=not-printed");
  console.log("steps=");
  console.log(`1. dryRun=vercel env run -e preview -- sh -c ${shellQuote(`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "begin;" -f ${migration.normalized} -c "rollback;"`)}`);
  console.log(`2. apply=vercel env run -e preview -- sh -c ${shellQuote(`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f ${migration.normalized}`)}`);
  console.log("3. dbHealth=vercel env run -e preview -- npm run health:db");
  console.log("4. marketplaceSchema=vercel env run -e preview -- npm run smoke:marketplace-schema");
  console.log("5. regression=vercel env run -e preview -- npm run smoke:staging:suite -- https://your-preview-url.vercel.app");
  console.log("rollbackPolicy=적용된 Supabase migration은 직접 되돌리지 않고 후속 migration으로 수정합니다.");
  console.log("result=ok");
}

try {
  main();
} catch (error) {
  console.error("Preview migration application plan failed");
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
}
