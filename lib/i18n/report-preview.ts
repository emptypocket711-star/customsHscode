import { defaultLocale, type AppLocale } from "./locales";

export type ReportPreviewDictionary = {
  approval: {
    approved: string;
    draft: string;
    pendingReview: string;
    published: string;
    reviewedAt: string;
    reviewer: string;
    unassigned: string;
    unreviewed: string;
  };
  labels: {
    autoPreliminary: string;
    basisDate: string;
    generatedAt: string;
    import: string;
    export: string;
    requestId: string;
  };
  page: {
    description: string;
    title: string;
  };
  sections: {
    disclaimer: string;
    pdfDescription: string;
    pdfTitle: string;
    sourceLocksDescription: string;
    sourceLocksTitle: string;
    staffNotes: string;
  };
};

const dictionaries = {
  "ko-KR": {
    approval: {
      approved: "담당자 승인",
      draft: "초안",
      pendingReview: "담당자 검토 필요",
      published: "고객 게시",
      reviewedAt: "승인시각",
      reviewer: "승인자",
      unassigned: "미지정",
      unreviewed: "검토 전"
    },
    labels: {
      autoPreliminary: "자동 예비진단 / 담당자 검토 전",
      basisDate: "조회기준일",
      generatedAt: "생성일시",
      import: "수입",
      export: "수출",
      requestId: "요청 ID"
    },
    page: {
      description: "보고서 생성 시점의 source snapshot과 rule version을 잠그고, 담당자 검토 상태를 고객 표시와 분리합니다.",
      title: "리포트 미리보기"
    },
    sections: {
      disclaimer: "고지사항",
      pdfDescription: "PDF 라이브러리 도입 전 단계입니다. 현재는 브라우저 인쇄용 레이아웃만 제공합니다.",
      pdfTitle: "PDF 출력",
      sourceLocksDescription: "보고서 생성 시점의 원천 snapshot과 rule version입니다.",
      sourceLocksTitle: "Source Locks",
      staffNotes: "담당자 메모"
    }
  },
  "en-US": {
    approval: {
      approved: "Staff approved",
      draft: "Draft",
      pendingReview: "Staff review needed",
      published: "Published to customer",
      reviewedAt: "Reviewed at",
      reviewer: "Reviewer",
      unassigned: "Unassigned",
      unreviewed: "Not reviewed"
    },
    labels: {
      autoPreliminary: "Automated preliminary diagnosis / before staff review",
      basisDate: "Basis date",
      generatedAt: "Generated at",
      import: "Import",
      export: "Export",
      requestId: "Request ID"
    },
    page: {
      description: "Locks source snapshots and rule versions at report generation time, while separating staff review status from customer-facing output.",
      title: "Report Preview"
    },
    sections: {
      disclaimer: "Notice",
      pdfDescription: "PDF library integration is not enabled yet. This page currently provides a browser print layout only.",
      pdfTitle: "PDF output",
      sourceLocksDescription: "Source snapshots and rule versions at the time this report was generated.",
      sourceLocksTitle: "Source Locks",
      staffNotes: "Staff notes"
    }
  },
  "zh-CN": {
    approval: {
      approved: "负责人已批准",
      draft: "草稿",
      pendingReview: "需要负责人审核",
      published: "已发布给客户",
      reviewedAt: "审核时间",
      reviewer: "审核人",
      unassigned: "未指定",
      unreviewed: "审核前"
    },
    labels: {
      autoPreliminary: "自动初步诊断 / 负责人审核前",
      basisDate: "查询基准日",
      generatedAt: "生成时间",
      import: "进口",
      export: "出口",
      requestId: "请求ID"
    },
    page: {
      description: "在报告生成时锁定来源快照和规则版本，并将负责人审核状态与客户显示内容分离。",
      title: "报告预览"
    },
    sections: {
      disclaimer: "告知事项",
      pdfDescription: "PDF库尚未接入。目前仅提供浏览器打印用版式。",
      pdfTitle: "PDF输出",
      sourceLocksDescription: "报告生成时的来源快照和规则版本。",
      sourceLocksTitle: "Source Locks",
      staffNotes: "负责人备注"
    }
  }
} satisfies Record<AppLocale, ReportPreviewDictionary>;

export function getReportPreviewDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
