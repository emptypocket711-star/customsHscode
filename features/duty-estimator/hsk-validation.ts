export function normalizeDutyEstimatorHskCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function dutyEstimatorHskCodeError(value: string) {
  const normalized = normalizeDutyEstimatorHskCode(value);

  if (!normalized) {
    return "예상 납세액 계산에는 HS CODE 10자리를 입력해 주세요.";
  }

  if (normalized.length !== 10) {
    return "예상 납세액 계산은 HS CODE 10자리 기준으로만 가능합니다.";
  }

  return null;
}
