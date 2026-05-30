import { describe, expect, it } from "vitest";
import { parseDelimitedInput, parseDelimitedText, rowsFromMatrix } from "./input-parser";

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

  it("detects practical Korean upload headers", () => {
    const result = parseDelimitedInput(`거래품명,비고,세번부호
기초화장품,인보이스 1번,3304.99-1000
플라스틱 캡,샘플 확인,3923.50-0000`);

    expect(result.columns.hsk.header).toBe("세번부호");
    expect(result.columns.product?.header).toBe("거래품명");
    expect(result.columns.memo?.header).toBe("비고");
    expect(result.rows).toEqual([
      { rowNumber: 2, hskCode: "3304.99-1000", productName: "기초화장품", memo: "인보이스 1번" },
      { rowNumber: 3, hskCode: "3923.50-0000", productName: "플라스틱 캡", memo: "샘플 확인" }
    ]);
  });

  it("detects English upload headers and keeps quoted CSV commas", () => {
    const result = parseDelimitedInput(`Description,Remarks,Commodity Code
"Lip balm, set","brand memo",3304.99-1000
"Keyboard, wireless","model A",8471.60-1020`);

    expect(result.columns.hsk.header).toBe("Commodity Code");
    expect(result.columns.product?.header).toBe("Description");
    expect(result.columns.memo?.header).toBe("Remarks");
    expect(result.rows).toEqual([
      { rowNumber: 2, hskCode: "3304.99-1000", productName: "Lip balm, set", memo: "brand memo" },
      { rowNumber: 3, hskCode: "8471.60-1020", productName: "Keyboard, wireless", memo: "model A" }
    ]);
  });

  it("keeps product-only rows for AI-assisted follow-up", () => {
    const rows = parseDelimitedText(`HS CODE\t품명\t비고
\t작업용 조끼\tHS 미정
3304.99-1000\t기초화장품\tHS 기재`);

    expect(rows).toEqual([
      { rowNumber: 2, hskCode: "", productName: "작업용 조끼", memo: "HS 미정" },
      { rowNumber: 3, hskCode: "3304.99-1000", productName: "기초화장품", memo: "HS 기재" }
    ]);
  });
});
