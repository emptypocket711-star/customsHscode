import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyVerificationUploadInput } from "@/features/company-verification/schemas";
import { sanitizeStorageFileName } from "@/server/repositories/document-upload.repository";

export const companyVerificationDocumentsBucket = "company-verification-documents";

const allowedVerificationMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export function calculateVerificationDocumentSha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function createCompanyVerificationStoragePath(input: {
  companyId: string;
  documentId: string;
  fileName: string;
}) {
  return `${input.companyId}/${input.documentId}/${randomUUID()}-${sanitizeStorageFileName(input.fileName)}`;
}

export function assertUploadableVerificationDocument(file: File) {
  if (!file.size) {
    throw new Error("업로드할 증빙 파일을 선택해 주세요.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("증빙 파일은 10MB 이하만 업로드할 수 있습니다.");
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].some((extension) =>
    lowerName.endsWith(extension)
  );

  if (file.type && !allowedVerificationMimeTypes.has(file.type) && !hasAllowedExtension) {
    throw new Error("증빙 파일은 PDF, JPG, PNG, WEBP 형식만 업로드할 수 있습니다.");
  }
}

export async function uploadCompanyVerificationDocument(
  supabase: SupabaseClient,
  input: CompanyVerificationUploadInput,
  file: File
) {
  assertUploadableVerificationDocument(file);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인 후 회사 증빙을 업로드할 수 있습니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id,company_role,account_type")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("회사 프로필이 연결된 사용자만 증빙을 업로드할 수 있습니다.");
  }

  if (profile.account_type !== "company" || profile.company_role !== "admin") {
    throw new Error("회사 관리자만 회사 검증 증빙을 업로드할 수 있습니다.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = calculateVerificationDocumentSha256(buffer);
  const documentId = randomUUID();
  const storagePath = createCompanyVerificationStoragePath({
    companyId: String(profile.company_id),
    documentId,
    fileName: file.name
  });

  const { data: document, error: documentError } = await supabase
    .from("company_verification_documents")
    .insert({
      id: documentId,
      company_id: profile.company_id,
      uploaded_by: user.id,
      document_type: input.documentType,
      file_name: file.name,
      storage_bucket: companyVerificationDocumentsBucket,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
      checksum,
      status: "submitted"
    })
    .select("id")
    .single();

  if (documentError) throw new Error(documentError.message);

  const { error: uploadError } = await supabase.storage
    .from(companyVerificationDocumentsBucket)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    const { error: objectCleanupError } = await supabase.storage
      .from(companyVerificationDocumentsBucket)
      .remove([storagePath]);

    const { error: cleanupError } = await supabase
      .from("company_verification_documents")
      .delete()
      .eq("id", documentId);

    if (objectCleanupError || cleanupError) {
      const cleanupMessages = [objectCleanupError?.message, cleanupError?.message].filter(Boolean).join("; ");
      throw new Error(`증빙 파일 업로드 실패 후 정리에 실패했습니다: ${cleanupMessages}`);
    }

    throw new Error(uploadError.message);
  }

  return {
    checksum,
    companyId: profile.company_id as string,
    documentId: document.id as string,
    documentType: input.documentType,
    fileName: file.name,
    mimeType: file.type || null,
    storageBucket: companyVerificationDocumentsBucket,
    storagePath,
    uploadedBy: user.id
  };
}
