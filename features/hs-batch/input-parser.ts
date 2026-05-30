import type { HsBatchInputRow } from "./schemas";

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_\-./()]/g, "");
}

function detectColumnIndex(headers: string[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  return headers.findIndex((header) => normalizedCandidates.some((candidate) => normalizeHeader(header).includes(candidate)));
}

export function rowsFromMatrix(matrix: unknown[][]): HsBatchInputRow[] {
  const rows = matrix
    .map((row) => row.map(cellText))
    .filter((row) => row.some(Boolean));

  if (!rows.length) return [];

  const firstRow = rows[0];
  const hsHeaderIndex = detectColumnIndex(firstRow, ["hs code", "hscode", "hsk", "세번", "세번부호", "품목번호", "hs코드"]);
  const hasHeader = hsHeaderIndex >= 0;
  const headers = hasHeader ? firstRow : [];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const hskIndex = hasHeader ? hsHeaderIndex : 0;
  const productIndex = hasHeader ? detectColumnIndex(headers, ["품명", "description", "product", "item", "goods", "name"]) : 1;
  const memoIndex = hasHeader ? detectColumnIndex(headers, ["비고", "memo", "remark", "note"]) : 2;

  return dataRows.map((row, index) => ({
    rowNumber: hasHeader ? index + 2 : index + 1,
    hskCode: cellText(row[hskIndex]),
    productName: productIndex >= 0 ? cellText(row[productIndex]) : "",
    memo: memoIndex >= 0 ? cellText(row[memoIndex]) : ""
  })).filter((row) => row.hskCode);
}

export function parseDelimitedText(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const separator = lines.some((line) => line.includes("\t")) ? "\t" : ",";
  return rowsFromMatrix(lines.map((line) => line.split(separator).map((cell) => cell.trim().replace(/^"|"$/g, ""))));
}
