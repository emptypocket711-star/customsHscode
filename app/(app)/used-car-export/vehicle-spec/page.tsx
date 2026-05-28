import { PageHeading } from "@/components/page-heading";
import { UsedCarExportTabs } from "@/features/used-car-export/used-car-export-tabs";
import { VehicleSpecLookupPanel } from "@/features/vehicle-spec/vehicle-spec-lookup-panel";

export default function UsedCarExportVehicleSpecPage() {
  return (
    <div className="grid gap-5">
      <PageHeading
        title="제원정보 조회"
        description="제원관리번호로 자동차 제원 정보를 조회합니다. 조회 결과는 CyberTS 원문 화면과 함께 확인할 수 있습니다."
      />
      <UsedCarExportTabs />
      <VehicleSpecLookupPanel />
    </div>
  );
}
