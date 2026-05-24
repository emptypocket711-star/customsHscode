import { readSheet } from "read-excel-file/node";

const spreadsheetMimeTypes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

function isSpreadsheetFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return spreadsheetMimeTypes.has(file.type) || lowerName.endsWith(".csv") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx");
}

function isCsvFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return file.type === "text/csv" || file.type === "application/csv" || lowerName.endsWith(".csv");
}

function isXlsxFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || lowerName.endsWith(".xlsx");
}

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function rowsToCsvText(rows: unknown[][]) {
  return rows
    .filter((row) => row.some((cell) => cell != null && String(cell).trim() !== ""))
    .map((row) => row.map(csvEscape).join(","))
    .join("\n")
    .trim();
}

export async function extractUploadFileText(file: File) {
  if (!isSpreadsheetFile(file)) return null;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (isCsvFile(file)) {
    const text = buffer.toString("utf8").trim();
    return text || null;
  }

  if (!isXlsxFile(file)) {
    return null;
  }

  const rows = await readSheet(buffer);
  const text = rowsToCsvText(rows);
  return text || null;
}

export const documentFileTextInternals = {
  isSpreadsheetFile,
  isCsvFile,
  isXlsxFile,
  rowsToCsvText
};
