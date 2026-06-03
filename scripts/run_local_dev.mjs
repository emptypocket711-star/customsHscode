#!/usr/bin/env node

import { spawn } from "node:child_process";

const localSupabaseUrl = process.env.LOCAL_SUPABASE_URL || "http://127.0.0.1:54321";
const localDatabaseUrl = process.env.LOCAL_DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const localPublishableKey = process.env.LOCAL_SUPABASE_ANON_KEY || "LOCAL_SUPABASE_ANON_KEY_REQUIRED";
const localSecretKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY || "LOCAL_SUPABASE_SERVICE_ROLE_KEY_REQUIRED";
const port = process.env.LOCAL_DEV_PORT || process.env.PORT || "3100";
const aiProvider = process.env.LOCAL_AI_PROVIDER || "mock";
const host = process.env.LOCAL_DEV_HOST || "127.0.0.1";

function origin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "invalid-url";
  }
}

function urlHost(value) {
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

const env = {
  ...process.env,
  AI_PROVIDER: aiProvider,
  DATABASE_URL: localDatabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: localPublishableKey,
  NEXT_PUBLIC_SUPABASE_URL: localSupabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: localSecretKey,
  SUPABASE_URL: localSupabaseUrl
};

if (process.argv.includes("--print-env")) {
  console.log("Local dev env");
  console.log(`baseUrl=http://${host}:${port}`);
  console.log(`supabaseOrigin=${origin(env.NEXT_PUBLIC_SUPABASE_URL)}`);
  console.log(`databaseHost=${urlHost(env.DATABASE_URL)}`);
  console.log(`aiProvider=${env.AI_PROVIDER}`);
  console.log("secretValues=not-printed");
  process.exit(0);
}

console.log("Starting local Next.js dev server");
console.log(`baseUrl=http://${host}:${port}`);
console.log(`supabaseOrigin=${origin(env.NEXT_PUBLIC_SUPABASE_URL)}`);
console.log(`aiProvider=${env.AI_PROVIDER}`);
console.log("secretValues=not-printed");

const child = spawn("npx", ["next", "dev", "-H", host, "-p", port], {
  env,
  stdio: "inherit"
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
