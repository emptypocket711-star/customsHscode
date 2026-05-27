export const cargoWatchStatusOptions = [
  { value: "manifest_submitted", label: "적하목록 제출" },
  { value: "arrival_report", label: "입항보고" },
  { value: "unloading_accepted", label: "하선신고 수리" },
  { value: "cy_inbound", label: "CY 반입" },
  { value: "cfs_inbound", label: "CFS 반입" },
  { value: "inbound", label: "반입" },
  { value: "import_declaration", label: "수입신고" },
  { value: "import_accepted", label: "수입신고수리" },
  { value: "released", label: "반출완료" }
] as const;

export function cargoWatchStatusDisplay(value: string) {
  return cargoWatchStatusOptions.find((option) => option.value === value || option.label === value)?.label ?? value;
}
