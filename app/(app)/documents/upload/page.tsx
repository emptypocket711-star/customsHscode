import { PageHeading } from "@/components/page-heading";
import { DocumentUploadPanel } from "@/features/documents/document-upload-panel";

export default function DocumentUploadPage() {
  return (
    <>
      <PageHeading title="선적서류 업로드" description="Commercial Invoice, Packing List, B/L 또는 AWB, C/O, 제품 카탈로그와 스펙 문서를 비공개 버킷에 저장하는 흐름으로 확장합니다." />
      <DocumentUploadPanel />
    </>
  );
}
