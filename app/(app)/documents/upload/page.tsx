import { PageHeading } from "@/components/page-heading";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DocumentUploadPanel } from "@/features/documents/document-upload-panel";
import { requireDeveloperRole } from "@/server/auth/role-guard";

export default async function DocumentUploadPage() {
  const guard = await requireDeveloperRole();

  if (!guard.allowed) {
    return (
      <>
        <PageHeading
          title="선적서류 업로드"
          description="문서 업로드와 자동 추출은 운영 worker와 파일 변환 환경이 준비된 뒤 제공됩니다."
        />
        <Card>
          <CardHeader
            title="문서 업로드 준비 중"
            description="현재는 HS CODE 조회, 품명 검색, 해외 HS CODE 조회, 예상 납세액 계산 기능을 먼저 제공합니다."
          />
          <CardBody>
            <p className="text-sm leading-6 text-slate-600">
              인보이스, 패킹리스트, B/L·AWB 자동 추출은 private storage, XLS 변환, OCR, background job 구성이 완료된 뒤 사용자 화면에 공개합니다.
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeading title="선적서류 업로드" description="Commercial Invoice, Packing List, B/L 또는 AWB, C/O, 제품 카탈로그와 스펙 문서를 비공개 버킷에 저장하는 흐름으로 확장합니다." />
      <DocumentUploadPanel />
    </>
  );
}
