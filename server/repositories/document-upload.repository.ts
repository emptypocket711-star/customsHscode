import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentUploadInput } from "@/features/documents/schemas";

export const caseDocumentsBucket = "case-documents";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const allowedExcelExtensions = new Set([".xls", ".xlsx", ".csv"]);

export function sanitizeStorageFileName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^\w.\-]+/g, "-");
  return normalized.replace(/-+/g, "-").replace(/^-|-$/g, "") || "document";
}

export function calculateSha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function assertUploadableDocument(file: File) {
  if (!file.size) {
    throw new Error("업로드할 파일을 선택해 주세요.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("문서 파일은 10MB 이하만 업로드할 수 있습니다.");
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExcelExtension = [...allowedExcelExtensions].some((extension) => lowerName.endsWith(extension));

  if (file.type && !allowedMimeTypes.has(file.type) && !hasAllowedExcelExtension) {
    throw new Error("PDF, JPG, PNG, WEBP, XLS, XLSX, CSV 형식만 업로드할 수 있습니다.");
  }
}

export async function createDocumentUploadCase(
  supabase: SupabaseClient,
  input: DocumentUploadInput,
  file: File
) {
  assertUploadableDocument(file);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 문서를 업로드할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필이 연결된 사용자만 문서를 업로드할 수 있습니다.");
  }

  const { data: request, error: requestError } = await supabase
    .from("hs_search_requests")
    .insert({
      company_id: profile.company_id,
      created_by: user.id,
      direction: input.direction,
      search_type: "document",
      basis_date: input.basisDate,
      status: "pending_review"
    })
    .select("id")
    .single();

  if (requestError) throw new Error(requestError.message);

  const requestId = request.id as string;
  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = calculateSha256(buffer);
  const safeName = sanitizeStorageFileName(file.name);
  const storagePath = `${profile.company_id}/${requestId}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(caseDocumentsBucket)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data: document, error: documentError } = await supabase
    .from("case_documents")
    .insert({
      request_id: requestId,
      company_id: profile.company_id,
      uploaded_by: user.id,
      document_type: input.documentType,
      file_name: file.name,
      storage_bucket: caseDocumentsBucket,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
      checksum,
      status: "uploaded"
    })
    .select("id")
    .single();

  if (documentError) throw new Error(documentError.message);

  return {
    requestId,
    documentId: document.id as string,
    companyId: profile.company_id as string,
    createdBy: user.id,
    storageBucket: caseDocumentsBucket,
    storagePath,
    mimeType: file.type || null,
    fileName: file.name,
    checksum
  };
}
