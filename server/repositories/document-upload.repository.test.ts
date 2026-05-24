import { describe, expect, it } from "vitest";
import {
  assertUploadableDocument,
  calculateSha256,
  sanitizeStorageFileName
} from "@/server/repositories/document-upload.repository";

describe("document upload repository helpers", () => {
  it("sanitizes storage file names", () => {
    expect(sanitizeStorageFileName("Commercial Invoice 2026/05.pdf")).toBe("Commercial-Invoice-2026-05.pdf");
  });

  it("calculates deterministic sha256 checksums", () => {
    expect(calculateSha256(Buffer.from("sample"))).toBe("af2bdbe1aa9b6ec1e2ade1d694f41fc71a831d0268e9891562113d8a62add1bf");
  });

  it("allows Excel invoice uploads", () => {
    const file = new File(["mock"], "invoice.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    expect(() => assertUploadableDocument(file)).not.toThrow();
  });

  it("allows legacy xls uploads even when browser mime is generic", () => {
    const file = new File(["mock"], "invoice.xls", {
      type: "application/octet-stream"
    });

    expect(() => assertUploadableDocument(file)).not.toThrow();
  });

  it("rejects unsupported document uploads", () => {
    const file = new File(["mock"], "invoice.exe", {
      type: "application/octet-stream"
    });

    expect(() => assertUploadableDocument(file)).toThrow("PDF, JPG, PNG, WEBP, XLS, XLSX, CSV 형식만 업로드할 수 있습니다.");
  });
});
