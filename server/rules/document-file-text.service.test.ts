import { describe, expect, it } from "vitest";
import { documentFileTextInternals, extractUploadFileText } from "@/server/rules/document-file-text.service";

describe("extractUploadFileText", () => {
  it("extracts CSV text from csv uploads", async () => {
    const file = new File([
      "Description,Model,Qty,Unit,Unit Price,Amount\nSkin Care Cosmetics,SK-100,100,EA,USD 2.50,USD 250.00"
    ], "invoice.csv", {
      type: "text/csv"
    });

    const text = await extractUploadFileText(file);

    expect(text).toContain("Description,Model,Qty,Unit,Unit Price,Amount");
    expect(text).toContain("Skin Care Cosmetics,SK-100,100,EA,USD 2.50,USD 250.00");
  });

  it("serializes spreadsheet rows to CSV text", () => {
    const text = documentFileTextInternals.rowsToCsvText([
      ["Description", "Model", "Qty", "Unit", "Unit Price", "Amount"],
      ["Comma, Product", "CM-1", 1, "EA", "USD 1.00", "USD 1.00"],
      ["Skin Care Cosmetics", "SK-100", 100, "EA", "USD 2.50", "USD 250.00"]
    ]);

    expect(text).toContain("Description,Model,Qty,Unit,Unit Price,Amount");
    expect(text).toContain("\"Comma, Product\",CM-1,1,EA,USD 1.00,USD 1.00");
    expect(text).toContain("Skin Care Cosmetics,SK-100,100,EA,USD 2.50,USD 250.00");
  });

  it("returns null for non-spreadsheet uploads", async () => {
    const file = new File(["mock"], "invoice.pdf", { type: "application/pdf" });

    await expect(extractUploadFileText(file)).resolves.toBeNull();
  });
});
