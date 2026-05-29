#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENDPOINT = "https://unipass.customs.go.kr:38010/ext/rest/trifFxrtInfoQry/retrieveTrifFxrtInfo";
const SOURCE_NAME = "관세청 관세환율 정보";
const SOURCE_VERSION = "myc-openapi-api012-v1.0";

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function seoulDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextSunday(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const dayOfWeek = date.getUTCDay();
  return addDays(dateString, (7 - dayOfWeek) % 7 || 7);
}

function yyyymmdd(dateString) {
  return dateString.replace(/-/g, "");
}

function xmlBlocks(source, tagName) {
  return Array.from(source.matchAll(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "gi"))).map((match) => match[1] ?? "");
}

function xmlValue(source, tagName) {
  return source.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"))?.[1]?.trim() ?? "";
}

function yyyymmddToDate(value) {
  const digits = value.replace(/[^0-9]/g, "");
  return digits.length >= 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : null;
}

function parseExchangeRateRows(rawText) {
  return xmlBlocks(rawText, "trifFxrtInfoQryRsltVo")
    .map((block) => ({
      country_code: xmlValue(block, "cntySgn") || null,
      currency_unit_name: xmlValue(block, "mtryUtNm") || null,
      currency_code: xmlValue(block, "currSgn").toUpperCase(),
      rate: Number(xmlValue(block, "fxrt")),
      effective_from: yyyymmddToDate(xmlValue(block, "aplyBgnDt")),
      direction: xmlValue(block, "imexTp") === "1" ? "export" : "import"
    }))
    .filter((row) => row.currency_code && Number.isFinite(row.rate) && row.effective_from);
}

function redactedUrl(url) {
  const redacted = new URL(url.toString());
  redacted.searchParams.set("crkyCn", "[redacted]");
  return redacted.toString();
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function fetchExchangeRateSnapshot({ endpoint, serviceKey, direction, requestedDate }) {
  const url = new URL(endpoint);
  url.searchParams.set("crkyCn", serviceKey);
  url.searchParams.set("qryYymmDd", yyyymmdd(requestedDate));
  url.searchParams.set("imexTp", direction === "export" ? "1" : "2");

  const response = await fetch(url, {
    headers: {
      accept: "application/xml, text/xml;q=0.9, */*;q=0.8"
    },
    signal: AbortSignal.timeout(Number(process.env.PUBLIC_DATA_REQUEST_TIMEOUT_MS || 15000))
  });
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`API012 ${direction} ${requestedDate} failed with HTTP ${response.status}.`);
  }

  return {
    rawText,
    sourceUrl: redactedUrl(url),
    retrievedAt: new Date().toISOString(),
    checksum: createHash("sha256").update(rawText).digest("hex")
  };
}

async function upsertSnapshotAndRates({ supabase, snapshot, rows, effectiveFrom }) {
  const { data, error: snapshotError } = await supabase
    .from("legal_source_snapshots")
    .insert({
      source_type: "exchange_rate",
      source_name: SOURCE_NAME,
      source_url: snapshot.sourceUrl,
      source_version: SOURCE_VERSION,
      published_at: null,
      retrieved_at: snapshot.retrievedAt,
      effective_from: effectiveFrom,
      effective_to: null,
      checksum: snapshot.checksum,
      raw_file_path: null,
      status: "fetched",
      created_by: null
    })
    .select("id")
    .single();

  if (snapshotError) throw new Error(snapshotError.message);

  const records = rows.map((row) => ({
    ...row,
    source_name: SOURCE_NAME,
    source_url: snapshot.sourceUrl,
    source_version: SOURCE_VERSION,
    retrieved_at: snapshot.retrievedAt,
    checksum: snapshot.checksum,
    source_snapshot_id: data.id,
    status: "published",
    updated_at: snapshot.retrievedAt
  }));

  const { error } = await supabase
    .from("customs_exchange_rates")
    .upsert(records, { onConflict: "direction,currency_code,effective_from" });

  if (error) throw new Error(error.message);
  return records.length;
}

async function main() {
  loadDotEnv(".env.local");

  const basisDate = process.argv[2] || seoulDateString();
  const endpoint = process.env.CUSTOMS_API_EXCHANGE_RATE_URL || DEFAULT_ENDPOINT;
  const serviceKey = process.env.CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY
    || process.env.CUSTOMS_API_SERVICE_KEY
    || process.env.CUSTOMS_API_API012_SERVICE_KEY
    || process.env.CUSTOMS_API012_SERVICE_KEY;
  if (!serviceKey) throw new Error("CUSTOMS_API_EXCHANGE_RATE_SERVICE_KEY is required.");

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
  const requestedDates = Array.from(new Set([basisDate, nextSunday(basisDate)]));
  const directions = ["import", "export"];
  const summary = [];

  for (const direction of directions) {
    for (const requestedDate of requestedDates) {
      const snapshot = await fetchExchangeRateSnapshot({ endpoint, serviceKey, direction, requestedDate });
      const rows = parseExchangeRateRows(snapshot.rawText).filter((row) => row.direction === direction);
      const effectiveFrom = rows.find((row) => row.effective_from)?.effective_from ?? requestedDate;
      const upserted = await upsertSnapshotAndRates({ supabase, snapshot, rows, effectiveFrom });

      summary.push({
        direction,
        requestedDate,
        effectiveFrom,
        fetched: rows.length,
        upserted
      });
    }
  }

  console.log(JSON.stringify({
    ok: true,
    basisDate,
    nextWeekProbeDate: requestedDates.find((date) => date > basisDate) ?? null,
    summary
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
