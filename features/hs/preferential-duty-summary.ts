export type PreferentialDutySummary = {
  note: string;
  summary: string;
};

type PreferentialDutySummaryInput = {
  countryCode: string;
  preferentialTariffText?: string;
};

export function preferentialDutySummaryText({
  countryCode,
  preferentialTariffText
}: PreferentialDutySummaryInput): PreferentialDutySummary {
  if (countryCode.trim().toUpperCase() === "ALL") {
    return {
      summary: "수입국·원산지 선택 후 확인",
      note: "FTA·특혜 세율은 원산지증명, 직접운송 등 협정 요건 검토가 필요합니다."
    };
  }

  if (preferentialTariffText) {
    return {
      summary: `요건 충족 시 ${preferentialTariffText}`,
      note: "표시 세율은 예비 안내이며 자동 적용 세율이 아닙니다."
    };
  }

  return {
    summary: "협정세율 표시 없음",
    note: "선택 국가 기준으로 연결된 FTA·특혜 세율 행이 없거나 추가 확인이 필요합니다."
  };
}
