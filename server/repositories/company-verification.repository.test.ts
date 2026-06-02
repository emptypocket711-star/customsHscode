import { describe, expect, it } from "vitest";
import {
  assertUploadableVerificationDocument,
  calculateVerificationDocumentSha256,
  companyVerificationDocumentsBucket,
  createCompanyVerificationStoragePath,
  uploadCompanyVerificationDocument
} from "@/server/repositories/company-verification.repository";

describe("company verification repository helpers", () => {
  it("uses the private company verification documents bucket", () => {
    expect(companyVerificationDocumentsBucket).toBe("company-verification-documents");
  });

  it("builds storage paths with company id and document id segments", () => {
    const path = createCompanyVerificationStoragePath({
      companyId: "00000000-0000-0000-0000-000000000001",
      documentId: "00000000-0000-0000-0000-000000000002",
      fileName: "사업자 등록증 2026/05.pdf"
    });

    expect(path).toMatch(
      /^00000000-0000-0000-0000-000000000001\/00000000-0000-0000-0000-000000000002\/[0-9a-f-]+-2026-05\.pdf$/
    );
  });

  it("calculates deterministic verification document checksums", () => {
    expect(calculateVerificationDocumentSha256(Buffer.from("verification"))).toBe(
      "4183b7793fd28ba47ea9e79e7697f2915da218567e6657a158b51bd14bce91cd"
    );
  });

  it("allows PDF and image verification documents", () => {
    expect(() =>
      assertUploadableVerificationDocument(new File(["mock"], "license.pdf", { type: "application/pdf" }))
    ).not.toThrow();
    expect(() =>
      assertUploadableVerificationDocument(new File(["mock"], "license.png", { type: "image/png" }))
    ).not.toThrow();
  });

  it("rejects spreadsheets for verification documents", () => {
    expect(() =>
      assertUploadableVerificationDocument(
        new File(["mock"], "license.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      )
    ).toThrow("증빙 파일은 PDF, JPG, PNG, WEBP 형식만 업로드할 수 있습니다.");
  });

  it("cleans up verification metadata and storage object when storage upload fails", async () => {
    const removedPaths: string[] = [];
    const deletedIds: string[] = [];
    const insertedRows: Array<Record<string, unknown>> = [];

    const supabase = {
      auth: {
        getUser: async () => ({
          data: {
            user: { id: "11111111-1111-4111-8111-111111111111" }
          }
        })
      },
      from(table: string) {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    account_type: "company",
                    company_id: "22222222-2222-4222-8222-222222222222",
                    company_role: "admin"
                  },
                  error: null
                })
              })
            })
          };
        }

        if (table === "company_verification_documents") {
          return {
            insert(row: Record<string, unknown>) {
              insertedRows.push(row);
              return {
                select: () => ({
                  single: async () => ({ data: { id: row.id }, error: null })
                })
              };
            },
            delete: () => ({
              eq: (_column: string, id: string) => {
                deletedIds.push(id);
                return Promise.resolve({ error: null });
              }
            })
          };
        }

        throw new Error(`unexpected table ${table}`);
      },
      storage: {
        from: (bucket: string) => {
          expect(bucket).toBe(companyVerificationDocumentsBucket);
          return {
            upload: async () => ({
              error: { message: "storage upload failed" }
            }),
            remove: async (paths: string[]) => {
              removedPaths.push(...paths);
              return { error: null };
            }
          };
        }
      }
    };

    await expect(
      uploadCompanyVerificationDocument(
        supabase as never,
        { documentType: "business_registration", note: undefined },
        new File(["mock"], "license.pdf", { type: "application/pdf" })
      )
    ).rejects.toThrow("storage upload failed");

    expect(insertedRows).toHaveLength(1);
    expect(removedPaths).toEqual([insertedRows[0]?.storage_path]);
    expect(deletedIds).toEqual([insertedRows[0]?.id]);
  });
});
