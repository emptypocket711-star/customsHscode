import { describe, expect, it } from "vitest";
import { parseDelimitedText, rowsFromMatrix } from "./input-parser";

describe("HS batch input parser", () => {
  it("keeps duplicate HS codes as separate rows in the uploaded order", () => {
    const rows = parseDelimitedText(`HS CODE\t품명\t비고
3304.99-1000\t기초화장품\t첫 번째
3304.99-1000\t기초화장품 세트\t두 번째
3923.50-0000\t플라스틱 캡\t세 번째`);

    expect(rows).toEqual([
      { rowNumber: 2, hskCode: "3304.99-1000", productName: "기초화장품", memo: "첫 번째" },
      { rowNumber: 3, hskCode: "3304.99-1000", productName: "기초화장품 세트", memo: "두 번째" },
      { rowNumber: 4, hskCode: "3923.50-0000", productName: "플라스틱 캡", memo: "세 번째" }
    ]);
  });

  it("treats the first column as HS code when no header exists", () => {
    const rows = rowsFromMatrix([
      ["8507.60-1000", "리튬이온 배터리"],
      ["8471.60-1020", "키보드"]
    ]);

    expect(rows.map((row) => [row.rowNumber, row.hskCode, row.productName])).toEqual([
      [1, "8507.60-1000", "리튬이온 배터리"],
      [2, "8471.60-1020", "키보드"]
    ]);
  });
});
