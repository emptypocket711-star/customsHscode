import type { HsBatchInputRow } from "./schemas";

type DetectedColumn = {
  header: string;
  index: number;
};

export type HsBatchParseResult = {
  columns: {
    hasHeader: boolean;
    hsk: DetectedColumn;
    product?: DetectedColumn;
    memo?: DetectedColumn;
  };
  rows: HsBatchInputRow[];
};

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_\-./()[\]{}:]/g, "");
}

function detectColumnIndex(headers: string[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  return headers.findIndex((header) => normalizedCandidates.some((candidate) => normalizeHeader(header).includes(candidate)));
}

function detectedColumn(headers: string[], index: number, fallback: string): DetectedColumn {
  return {
    header: index >= 0 ? cellText(headers[index]) || fallback : fallback,
    index
  };
}

export function parseMatrix(matrix: unknown[][]): HsBatchParseResult {
  const rows = matrix
    .map((row) => row.map(cellText))
    .filter((row) => row.some(Boolean));

  if (!rows.length) {
    return {
      columns: {
        hasHeader: false,
        hsk: { header: "첫 번째 컬럼", index: 0 }
      },
      rows: []
    };
  }

  const firstRow = rows[0];
  const hsHeaderIndex = detectColumnIndex(firstRow, [
    "hs code",
    "hscode",
    "hsk",
    "hs",
    "hs no",
    "hsno",
    "hs number",
    "tariff code",
    "tariffcode",
    "commodity code",
    "commoditycode",
    "customs code",
    "customscode",
    "세번",
    "세번부호",
    "세번번호",
    "품목번호",
    "품목분류번호",
    "hs코드",
    "hs부호",
    "hscode",
    "hskcode",
    "hsk부호"
  ]);
  const hasHeader = hsHeaderIndex >= 0;
  const headers = hasHeader ? firstRow : [];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const hskIndex = hasHeader ? hsHeaderIndex : 0;
  const productIndex = hasHeader ? detectColumnIndex(headers, [
    "품명",
    "거래품명",
    "신고품명",
    "제품명",
    "물품명",
    "상품명",
    "명세",
    "description",
    "desc",
    "product",
    "product name",
    "productname",
    "item",
    "item name",
    "itemname",
    "goods",
    "goods name",
    "goodsname",
    "name",
    "model"
  ]) : 1;
  const memoIndex = hasHeader ? detectColumnIndex(headers, [
    "비고",
    "메모",
    "참고",
    "확인사항",
    "remark",
    "remarks",
    "memo",
    "note",
    "notes",
    "comment",
    "comments"
  ]) : 2;

  const parsedRows = dataRows.map((row, index) => ({
    rowNumber: hasHeader ? index + 2 : index + 1,
    hskCode: cellText(row[hskIndex]),
    productName: productIndex >= 0 ? cellText(row[productIndex]) : "",
    memo: memoIndex >= 0 ? cellText(row[memoIndex]) : ""
  })).filter((row) => row.hskCode || row.productName);

  return {
    columns: {
      hasHeader,
      hsk: detectedColumn(headers, hskIndex, hasHeader ? "HS CODE" : "첫 번째 컬럼"),
      product: productIndex >= 0 ? detectedColumn(headers, productIndex, hasHeader ? "품명" : "두 번째 컬럼") : undefined,
      memo: memoIndex >= 0 ? detectedColumn(headers, memoIndex, hasHeader ? "비고" : "세 번째 컬럼") : undefined
    },
    rows: parsedRows
  };
}

export function rowsFromMatrix(matrix: unknown[][]): HsBatchInputRow[] {
  return parseMatrix(matrix).rows;
}

function splitDelimitedLine(line: string, separator: string) {
  if (separator === "\t") {
    return line.split("\t").map((cell) => cell.trim().replace(/^"|"$/g, ""));
  }

  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (character === "\"") {
      quoted = !quoted;
      continue;
    }
    if (character === separator && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  cells.push(current.trim());
  return cells;
}

export function parseDelimitedInput(value: string): HsBatchParseResult {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());
  const separator = lines.some((line) => line.includes("\t")) ? "\t" : ",";
  return parseMatrix(lines.map((line) => splitDelimitedLine(line, separator)));
}

export function parseDelimitedText(value: string) {
  return parseDelimitedInput(value).rows;
}
