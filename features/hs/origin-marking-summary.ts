export type OriginMarkingSummary = {
  note: string;
  summary: string;
};

export function originMarkingSummaryText(isTarget: boolean): OriginMarkingSummary {
  if (isTarget) {
    return {
      summary: "표시대상 조회됨(Y)",
      note: "표시방법과 예외는 물품 상태, 포장, 거래조건 기준으로 확인이 필요합니다."
    };
  }

  return {
    summary: "표시대상 조회 결과 없음",
    note: "개별법령, 거래조건, 재포장 여부에 따라 별도 표시·증빙 의무가 있을 수 있습니다."
  };
}
