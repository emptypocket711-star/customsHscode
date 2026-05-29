import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createSupabaseServiceRoleClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase/service-role";

type SchemaHealthStatus = "ok" | "warn" | "blocker";

type SchemaIssue = {
  file: string;
  message: string;
  objectName: string;
  severity: "blocker" | "warn";
  type: "missing_table" | "missing_column" | "missing_function" | "rls_disabled" | "rpc_unavailable";
};

type ExpectedSchema = {
  columns: Map<string, Map<string, string>>;
  functions: Map<string, string>;
  rlsTables: Map<string, string>;
  tables: Map<string, string>;
};

type SnapshotPayload = {
  columns?: Array<{ column?: string; table?: string }>;
  functions?: string[];
  tables?: Array<{ rlsEnabled?: boolean; table?: string }>;
};

export type SchemaHealthReport = {
  checkedAt: string;
  issues: SchemaIssue[];
  status: SchemaHealthStatus;
  summary: {
    actualFunctions: number;
    actualTables: number;
    blockerCount: number;
    expectedColumns: number;
    expectedFunctions: number;
    expectedTables: number;
    warnCount: number;
  };
};

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

function normalizeIdentifier(identifier: string) {
  return identifier.trim().replace(/^public\./i, "").replace(/^"|"$/g, "").toLowerCase();
}

function stripSqlComments(sql: string) {
  return sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitTopLevel(input: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];

    if (char === "'" && previous !== "\\" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === "\"" && previous !== "\\" && !inSingleQuote) {
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

function firstIdentifier(definition: string) {
  const match = definition.trim().match(/^"([^"]+)"|^([a-zA-Z_][a-zA-Z0-9_]*)/);
  return match ? normalizeIdentifier(match[1] ?? match[2]) : null;
}

function isColumnDefinition(definition: string) {
  return !/^(constraint|primary\s+key|foreign\s+key|unique|check|exclude)\b/i.test(definition.trim());
}

function addExpectedColumn(expectedColumns: ExpectedSchema["columns"], tableName: string, columnName: string, fileName: string) {
  const table = normalizeIdentifier(tableName);
  const column = normalizeIdentifier(columnName);
  if (!expectedColumns.has(table)) expectedColumns.set(table, new Map());
  if (!expectedColumns.get(table)?.has(column)) {
    expectedColumns.get(table)?.set(column, fileName);
  }
}

function parseExpectedSchema(): ExpectedSchema {
  const expected: ExpectedSchema = {
    columns: new Map(),
    functions: new Map(),
    rlsTables: new Map(),
    tables: new Map()
  };

  if (!existsSync(migrationsDir)) return expected;

  const files = readdirSync(migrationsDir).filter((fileName) => fileName.endsWith(".sql")).sort();

  for (const fileName of files) {
    const sql = stripSqlComments(readFileSync(path.join(migrationsDir, fileName), "utf8"));

    for (const match of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?((?:public\.)?"?[a-zA-Z0-9_]+"?)\s*\(([\s\S]*?)\);/gi)) {
      const table = normalizeIdentifier(match[1]);
      expected.tables.set(table, expected.tables.get(table) ?? fileName);

      for (const definition of splitTopLevel(match[2])) {
        if (!isColumnDefinition(definition)) continue;
        const column = firstIdentifier(definition);
        if (column) addExpectedColumn(expected.columns, table, column, fileName);
      }
    }

    for (const match of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?((?:public\.)?"?[a-zA-Z0-9_]+"?)\s+([\s\S]*?);/gi)) {
      const table = normalizeIdentifier(match[1]);
      const body = match[2];

      if (/enable\s+row\s+level\s+security/i.test(body)) {
        expected.rlsTables.set(table, expected.rlsTables.get(table) ?? fileName);
      }

      for (const definition of splitTopLevel(body)) {
        const column = definition.match(/add\s+column\s+(?:if\s+not\s+exists\s+)?("?[a-zA-Z_][a-zA-Z0-9_]*"?)/i);
        if (column) addExpectedColumn(expected.columns, table, column[1], fileName);
      }
    }

    for (const match of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?("?[_a-zA-Z][a-zA-Z0-9_]*"?)/gi)) {
      expected.functions.set(normalizeIdentifier(match[1]), fileName);
    }

    for (const match of sql.matchAll(/drop\s+function\s+if\s+exists\s+(?:public\.)?("?[_a-zA-Z][a-zA-Z0-9_]*"?)/gi)) {
      expected.functions.delete(normalizeIdentifier(match[1]));
    }
  }

  return expected;
}

function expectedColumnCount(columns: ExpectedSchema["columns"]) {
  return [...columns.values()].reduce((sum, tableColumns) => sum + tableColumns.size, 0);
}

function issue(input: Omit<SchemaIssue, "severity"> & { severity?: SchemaIssue["severity"] }): SchemaIssue {
  return {
    severity: input.severity ?? "blocker",
    ...input
  };
}

export async function getProductionSchemaHealthReport(): Promise<SchemaHealthReport> {
  const expected = parseExpectedSchema();
  const checkedAt = new Date().toISOString();
  const issues: SchemaIssue[] = [];

  if (!hasSupabaseServiceRoleEnv()) {
    return {
      checkedAt,
      issues: [
        issue({
          file: "environment",
          message: "SUPABASE_SERVICE_ROLE_KEY가 없어 운영 DB 스키마를 조회할 수 없습니다.",
          objectName: "SUPABASE_SERVICE_ROLE_KEY",
          type: "rpc_unavailable"
        })
      ],
      status: "blocker",
      summary: {
        actualFunctions: 0,
        actualTables: 0,
        blockerCount: 1,
        expectedColumns: expectedColumnCount(expected.columns),
        expectedFunctions: expected.functions.size,
        expectedTables: expected.tables.size,
        warnCount: 0
      }
    };
  }

  const { data, error } = await createSupabaseServiceRoleClient()
    .rpc("get_schema_health_snapshot")
    .single<SnapshotPayload>();

  if (error || !data) {
    return {
      checkedAt,
      issues: [
        issue({
          file: "supabase/migrations/20260529003000_schema_health_snapshot_rpc.sql",
          message: error?.message ?? "스키마 점검 RPC 응답이 없습니다.",
          objectName: "get_schema_health_snapshot",
          type: "rpc_unavailable"
        })
      ],
      status: "blocker",
      summary: {
        actualFunctions: 0,
        actualTables: 0,
        blockerCount: 1,
        expectedColumns: expectedColumnCount(expected.columns),
        expectedFunctions: expected.functions.size,
        expectedTables: expected.tables.size,
        warnCount: 0
      }
    };
  }

  const actualTables = new Map((data.tables ?? [])
    .filter((row): row is { rlsEnabled: boolean; table: string } => typeof row.table === "string")
    .map((row) => [normalizeIdentifier(row.table), Boolean(row.rlsEnabled)]));
  const actualColumns = new Map<string, Set<string>>();
  for (const row of data.columns ?? []) {
    if (typeof row.table !== "string" || typeof row.column !== "string") continue;
    const table = normalizeIdentifier(row.table);
    if (!actualColumns.has(table)) actualColumns.set(table, new Set());
    actualColumns.get(table)?.add(normalizeIdentifier(row.column));
  }
  const actualFunctions = new Set((data.functions ?? []).map(normalizeIdentifier));

  for (const [table, file] of expected.tables.entries()) {
    if (!actualTables.has(table)) {
      issues.push(issue({
        file,
        message: "운영 DB에 필요한 테이블이 없습니다.",
        objectName: table,
        type: "missing_table"
      }));
    }
  }

  for (const [table, columns] of expected.columns.entries()) {
    const tableColumns = actualColumns.get(table);
    if (!tableColumns) continue;

    for (const [column, file] of columns.entries()) {
      if (!tableColumns.has(column)) {
        issues.push(issue({
          file,
          message: "운영 DB에 필요한 컬럼이 없습니다.",
          objectName: `${table}.${column}`,
          type: "missing_column"
        }));
      }
    }
  }

  for (const [functionName, file] of expected.functions.entries()) {
    if (!actualFunctions.has(functionName)) {
      issues.push(issue({
        file,
        message: "운영 DB에 필요한 RPC/function이 없습니다.",
        objectName: functionName,
        type: "missing_function"
      }));
    }
  }

  for (const [table, file] of expected.rlsTables.entries()) {
    if (actualTables.has(table) && !actualTables.get(table)) {
      issues.push(issue({
        file,
        message: "RLS가 활성화되어야 하는 테이블에서 RLS가 꺼져 있습니다.",
        objectName: table,
        severity: "warn",
        type: "rls_disabled"
      }));
    }
  }

  const blockerCount = issues.filter((item) => item.severity === "blocker").length;
  const warnCount = issues.filter((item) => item.severity === "warn").length;

  return {
    checkedAt,
    issues,
    status: blockerCount > 0 ? "blocker" : warnCount > 0 ? "warn" : "ok",
    summary: {
      actualFunctions: actualFunctions.size,
      actualTables: actualTables.size,
      blockerCount,
      expectedColumns: expectedColumnCount(expected.columns),
      expectedFunctions: expected.functions.size,
      expectedTables: expected.tables.size,
      warnCount
    }
  };
}
