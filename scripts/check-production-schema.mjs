#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const ENV_PATH = path.join(ROOT, ".env.local");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function stripSqlComments(sql) {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeIdentifier(identifier) {
  return identifier
    .trim()
    .replace(/^public\./i, "")
    .replace(/^"|"$/g, "")
    .toLowerCase();
}

function splitTopLevel(input) {
  const parts = [];
  let current = "";
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];

    if (char === "'" && previous !== "\\" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && previous !== "\\" && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (char === "(") depth += 1;
      if (char === ")" && depth > 0) depth -= 1;
      if (char === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function firstIdentifier(definition) {
  const match = definition.trim().match(/^"([^"]+)"|^([a-zA-Z_][a-zA-Z0-9_]*)/);
  return match ? normalizeIdentifier(match[1] ?? match[2]) : null;
}

function isColumnDefinition(definition) {
  return !/^(constraint|primary\s+key|foreign\s+key|unique|check|exclude)\b/i.test(definition.trim());
}

function addExpectedColumn(expectedColumns, tableName, columnName, fileName) {
  const normalizedTable = normalizeIdentifier(tableName);
  const normalizedColumn = normalizeIdentifier(columnName);
  if (!expectedColumns.has(normalizedTable)) expectedColumns.set(normalizedTable, new Map());
  if (!expectedColumns.get(normalizedTable).has(normalizedColumn)) {
    expectedColumns.get(normalizedTable).set(normalizedColumn, fileName);
  }
}

function parseExpectedSchema() {
  const expectedTables = new Map();
  const expectedColumns = new Map();
  const expectedFunctions = new Map();
  const expectedRlsTables = new Map();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  for (const fileName of files) {
    const sql = stripSqlComments(readFileSync(path.join(MIGRATIONS_DIR, fileName), "utf8"));

    for (const match of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?((?:public\.)?"?[a-zA-Z0-9_]+"?)\s*\(([\s\S]*?)\);/gi)) {
      const tableName = normalizeIdentifier(match[1]);
      expectedTables.set(tableName, expectedTables.get(tableName) ?? fileName);

      for (const definition of splitTopLevel(match[2])) {
        if (!isColumnDefinition(definition)) continue;
        const columnName = firstIdentifier(definition);
        if (columnName) addExpectedColumn(expectedColumns, tableName, columnName, fileName);
      }
    }

    for (const match of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?((?:public\.)?"?[a-zA-Z0-9_]+"?)\s+([\s\S]*?);/gi)) {
      const tableName = normalizeIdentifier(match[1]);
      const body = match[2];

      if (/enable\s+row\s+level\s+security/i.test(body)) {
        expectedRlsTables.set(tableName, expectedRlsTables.get(tableName) ?? fileName);
      }

      for (const definition of splitTopLevel(body)) {
        const addColumnMatch = definition.match(/add\s+column\s+(?:if\s+not\s+exists\s+)?("?[a-zA-Z_][a-zA-Z0-9_]*"?)/i);
        if (addColumnMatch) addExpectedColumn(expectedColumns, tableName, addColumnMatch[1], fileName);
      }
    }

    for (const match of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?("?[_a-zA-Z][a-zA-Z0-9_]*"?)/gi)) {
      const functionName = normalizeIdentifier(match[1]);
      expectedFunctions.set(functionName, fileName);
    }

    for (const match of sql.matchAll(/drop\s+function\s+if\s+exists\s+(?:public\.)?("?[_a-zA-Z][a-zA-Z0-9_]*"?)/gi)) {
      expectedFunctions.delete(normalizeIdentifier(match[1]));
    }
  }

  return { expectedTables, expectedColumns, expectedFunctions, expectedRlsTables };
}

function runPsql(sql) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Set it in the shell or .env.local.");
  }

  return execFileSync("psql", [process.env.DATABASE_URL, "-At", "-c", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function getActualSchema() {
  const tables = new Map();
  const tableRows = runPsql(`
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
    order by c.relname;
  `);

  for (const row of tableRows.split("\n").filter(Boolean)) {
    const [tableName, rlsEnabled] = row.split("|");
    tables.set(normalizeIdentifier(tableName), rlsEnabled === "t");
  }

  const columns = new Map();
  const columnRows = runPsql(`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
    order by table_name, ordinal_position;
  `);

  for (const row of columnRows.split("\n").filter(Boolean)) {
    const [tableName, columnName] = row.split("|").map(normalizeIdentifier);
    if (!columns.has(tableName)) columns.set(tableName, new Set());
    columns.get(tableName).add(columnName);
  }

  const functions = new Set();
  const functionRows = runPsql(`
    select distinct p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
    order by p.proname;
  `);

  for (const row of functionRows.split("\n").filter(Boolean)) {
    functions.add(normalizeIdentifier(row));
  }

  return { tables, columns, functions };
}

function formatIssue(issue) {
  if (issue.type === "missing_table") {
    return `BLOCKER missing table: ${issue.table} (${issue.file})`;
  }
  if (issue.type === "missing_column") {
    return `BLOCKER missing column: ${issue.table}.${issue.column} (${issue.file})`;
  }
  if (issue.type === "missing_function") {
    return `BLOCKER missing RPC/function: ${issue.functionName} (${issue.file})`;
  }
  if (issue.type === "rls_disabled") {
    return `WARN RLS disabled: ${issue.table} (${issue.file})`;
  }
  return JSON.stringify(issue);
}

function main() {
  loadDotEnv(ENV_PATH);

  const asJson = process.argv.includes("--json");
  const expected = parseExpectedSchema();
  const actual = getActualSchema();

  const issues = [];

  for (const [table, file] of expected.expectedTables.entries()) {
    if (!actual.tables.has(table)) {
      issues.push({ severity: "BLOCKER", type: "missing_table", table, file });
    }
  }

  for (const [table, columns] of expected.expectedColumns.entries()) {
    const actualColumns = actual.columns.get(table);
    if (!actualColumns) continue;

    for (const [column, file] of columns.entries()) {
      if (!actualColumns.has(column)) {
        issues.push({ severity: "BLOCKER", type: "missing_column", table, column, file });
      }
    }
  }

  for (const [functionName, file] of expected.expectedFunctions.entries()) {
    if (!actual.functions.has(functionName)) {
      issues.push({ severity: "BLOCKER", type: "missing_function", functionName, file });
    }
  }

  for (const [table, file] of expected.expectedRlsTables.entries()) {
    if (actual.tables.has(table) && !actual.tables.get(table)) {
      issues.push({ severity: "WARN", type: "rls_disabled", table, file });
    }
  }

  const blockerCount = issues.filter((issue) => issue.severity === "BLOCKER").length;
  const warnCount = issues.filter((issue) => issue.severity === "WARN").length;
  const result = blockerCount > 0 ? "BLOCKER" : warnCount > 0 ? "WARN" : "OK";
  const report = {
    result,
    summary: {
      expectedTables: expected.expectedTables.size,
      actualPublicTables: actual.tables.size,
      expectedColumns: [...expected.expectedColumns.values()].reduce((sum, columns) => sum + columns.size, 0),
      expectedFunctions: expected.expectedFunctions.size,
      actualPublicFunctions: actual.functions.size,
      blockerCount,
      warnCount
    },
    issues
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("HS Finder Production Schema Check");
    console.log("");
    console.log(`Result: ${result}`);
    console.log(`Tables: ${report.summary.actualPublicTables}/${report.summary.expectedTables}`);
    console.log(`Expected columns checked: ${report.summary.expectedColumns}`);
    console.log(`RPC/functions: ${report.summary.actualPublicFunctions} public / ${report.summary.expectedFunctions} expected`);
    console.log(`Issues: ${blockerCount} blocker, ${warnCount} warning`);
    console.log("");

    if (issues.length === 0) {
      console.log("No schema drift found.");
    } else {
      for (const issue of issues) {
        console.log(formatIssue(issue));
      }
    }
  }

  if (blockerCount > 0) process.exitCode = 1;
}

main();
