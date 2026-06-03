export type ImportRequirementSummary = {
  note: string;
  summary: string;
};

export function importRequirementSummaryText(requirementCount: number): ImportRequirementSummary {
  if (requirementCount > 0) {
    return {
      summary: `${requirementCount.toLocaleString("ko-KR")}개 요건 가능성`,
      note: "해당 여부와 제출서류는 제품 상세자료 기준 검토가 필요합니다."
    };
  }

  return {
    summary: "세관장확인 조회 결과 없음",
    note: "통합공고, 개별법령, 표시·인증·유통규제 의무는 별도 확인이 필요할 수 있습니다."
  };
}
