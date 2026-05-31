import { diagnoseExport } from "@/server/rules/export-diagnosis.service";
import { diagnoseImport } from "@/server/rules/import-diagnosis.service";
import { mockSourceLocks, type MockReport } from "@/features/reports/mock-report-data";

const disclaimer =
  "본 리포트는 업로드된 서류와 조회기준일 현재 수집·검토된 공식 데이터 및 내부 룰을 기반으로 한 AI 예비진단 자료입니다. 품목분류, 관세율, FTA 협정관세 적용, 원산지 충족 여부, 수출입요건 해당 여부, 전략물자 해당 여부는 신고시점의 법령, 세관 심사, 관계기관 확인 및 상세 자료 확인에 따라 달라질 수 있습니다.";

export function generateMockReport(reportType: "import" | "export" = "import"): MockReport {
  if (reportType === "export") {
    const diagnosis = diagnoseExport({
      hskCode: "8507.60-1000",
      basisDate: "2026-05-21",
      destinationCountry: "DE",
      finalUser: "독일 유통사",
      productUse: "전기자전거 교체용"
    });

    if (!diagnosis) {
      throw new Error("mock export diagnosis is unavailable");
    }

    return {
      id: "report-export-mock-001",
      requestId: "request-export-mock-001",
      companyName: "샘플무역 주식회사",
      reportType: "export",
      title: "수출 예비진단 리포트",
      basisDate: diagnosis.basisDate,
      generatedAt: "2026-05-21T11:00:00+09:00",
      hskCode: diagnosis.hskCode,
      hs6: diagnosis.hs6,
      productName: diagnosis.productName,
      customerSummary: "리튬이온 축전지 수출 건은 수출요건, 전략물자 예비 리스크, FTA C/O 발급 가능성에 대한 상세 자료 확인이 필요합니다.",
      sections: [
        {
          title: "수출요건",
          status: "가능성 있음",
          items: diagnosis.requirements.map((item) => `${item.name}: ${item.procedureSummary}`)
        },
        {
          title: "전략물자 예비 리스크",
          status: "내부 확인 필요",
          items: diagnosis.exportControls.map((item) => `${item.keyword}: ${item.specCondition}`)
        },
        {
          title: "FTA C/O 및 원산지증빙",
          status: "추가 확인 필요",
          items: diagnosis.ftaCoOptions.map((item) => `${item.agreementName}: ${item.coIssuePossibility}`)
        },
        {
          title: "바이어 제출서류",
          status: "예비진단",
          items: diagnosis.buyerDocumentList
        }
      ],
      sourceLocks: mockSourceLocks.filter((lock) => lock.id !== "lock-import-rules-001"),
      approval: {
        status: "pending_review",
        reviewerName: null,
        reviewedAt: null,
        staffNotes: ["최종사용자와 최종용도 확인 필요", "전략물자 자가판정 또는 전문판정 검토 필요"]
      },
      disclaimer
    };
  }

  const diagnosis = diagnoseImport({
    hskCode: "3304.99-1000",
    basisDate: "2026-05-21",
    originCountry: "CN",
    exportCountry: "CN",
    shipmentCountry: "CN",
    manufacturingCountry: "CN",
    destinationCountry: "KR"
  });

  if (!diagnosis) {
    throw new Error("mock import diagnosis is unavailable");
  }

  return {
    id: "report-import-mock-001",
    requestId: "request-import-mock-001",
    companyName: "샘플무역 주식회사",
    reportType: "import",
    title: "수입 예비진단 리포트",
    basisDate: diagnosis.basisDate,
    generatedAt: "2026-05-21T11:00:00+09:00",
    hskCode: diagnosis.hskCode,
    hs6: diagnosis.hs6,
    productName: diagnosis.productName,
    customerSummary: "기초화장용 제품류 수입 건은 관세율, 한-중 FTA C/O, 화장품 수입요건 가능성에 대한 상세 자료 확인이 필요합니다.",
    sections: [
      {
        title: "관세율",
        status: "예비진단",
        items: diagnosis.tariffs.map((item) => `${item.label}: ${item.rateText}`)
      },
      {
        title: "FTA / C/O",
        status: "추가 확인 필요",
        items: diagnosis.ftaOptions.map((item) => `${item.agreementName}: 협정세율 ${item.preferentialRateText}, ${item.originRule}`)
      },
      {
        title: "수입요건",
        status: "가능성 있음",
        items: diagnosis.requirements.map((item) => `${item.name}: ${item.procedureSummary}`)
      },
      {
        title: "고객 요청자료",
        status: "내부 확인 필요",
        items: diagnosis.requirements.flatMap((item) => item.playbook?.requiredDocuments ?? ["추가 확인 필요"])
      }
    ],
    sourceLocks: mockSourceLocks.filter((lock) => lock.id !== "lock-export-rules-001"),
    approval: {
      status: "pending_review",
      reviewerName: null,
      reviewedAt: null,
      staffNotes: ["화장품법 관련 표시사항 검토 필요", "C/O 직접운송 증빙 확인 필요"]
    },
    disclaimer
  };
}

export const reportServiceInternals = {
  disclaimer
};
