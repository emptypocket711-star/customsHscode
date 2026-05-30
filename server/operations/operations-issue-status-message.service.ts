export function operationsIssueStatusActionLabel(status: string | undefined) {
  if (status === "resolved") return "해결 처리";
  if (status === "ignored") return "제외 처리";
  if (status === "open") return "다시 열기";
  return "상태 변경";
}

function hasFinalConsonant(value: string) {
  const lastChar = value.trim().charAt(value.trim().length - 1);
  const codePoint = lastChar.charCodeAt(0);
  if (codePoint < 0xac00 || codePoint > 0xd7a3) return false;
  return (codePoint - 0xac00) % 28 > 0;
}

function objectParticle(value: string) {
  return hasFinalConsonant(value) ? "을" : "를";
}

export function buildOperationsIssueStatusSuccessMessage(status: string | undefined) {
  return `운영 이슈 ${operationsIssueStatusActionLabel(status)} 결과를 저장했습니다.`;
}

export function buildOperationsIssueStatusErrorMessage(status: string | undefined, reason: string) {
  const actionLabel = operationsIssueStatusActionLabel(status);
  return `운영 이슈 ${actionLabel}${objectParticle(actionLabel)} 저장하지 못했습니다. ${reason}`;
}
