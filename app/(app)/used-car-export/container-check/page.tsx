import { PageHeading } from "@/components/page-heading";
import { HjitContainerCheckPanel } from "@/features/used-car-export/hjit-container-check-panel";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";

export default function UsedCarExportContainerCheckPage() {
  return (
    <div className="grid gap-5">
      <PageHeading
        title="컨테이너 반입 확인"
        description="컨테이너 번호로 터미널 반입 정보를 조회하고 원문 화면을 팝업으로 확인합니다."
      />
      <UsedCarExportTabs />
      <HjitContainerCheckPanel />
    </div>
  );
}
