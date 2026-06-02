export type CompletionReportKind = "clearance" | "freight";

export const completionReportArchiveGuide = {
  clearance: {
    amountLabel: "최종 통관·정산 금액",
    documents: "신고필증, 납부영수증, CI, PL, C/O, 제품 사양서",
    title: "통관 완료 리포트"
  },
  freight: {
    amountLabel: "최종 운임·로컬비 합계",
    documents: "B/L 또는 AWB, 운임 청구서, CI, PL, 인도 확인 자료",
    title: "운송 완료 리포트"
  }
} as const satisfies Record<CompletionReportKind, {
  amountLabel: string;
  documents: string;
  title: string;
}>;

export const completionReportDocumentRoleOptions = {
  clearance: [
    ["import_declaration_certificate", "수입신고필증"],
    ["tax_payment_receipt", "납부영수증"],
    ["commercial_invoice", "Commercial Invoice"],
    ["packing_list", "Packing List"],
    ["certificate_of_origin", "원산지증명서"],
    ["product_spec", "제품 사양서"]
  ],
  freight: [
    ["final_bl_or_awb", "최종 B/L 또는 AWB"],
    ["commercial_invoice", "Commercial Invoice"],
    ["packing_list", "Packing List"],
    ["freight_invoice", "운임 청구서"],
    ["delivery_note", "인도 확인 자료"]
  ]
} as const satisfies Record<CompletionReportKind, ReadonlyArray<readonly [string, string]>>;

export function completionReportDocumentRoleLabel(kind: CompletionReportKind, role: string) {
  return completionReportDocumentRoleOptions[kind].find(([value]) => value === role)?.[1] ?? role;
}
