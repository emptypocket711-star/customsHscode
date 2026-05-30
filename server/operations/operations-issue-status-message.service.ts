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

export function buildOperationsIssueStatusNextStep(status: string | undefined) {
  if (status === "resolved") {
    return "후속 확인: 원인 드릴다운과 최근 발생 시각을 다시 확인해 재발 여부를 모니터링합니다.";
  }

  if (status === "ignored") {
    return "후속 확인: 제외 근거가 충분한지 확인하고 동일 이슈가 다시 열리면 담당자를 지정합니다.";
  }

  if (status === "open") {
    return "후속 확인: 담당자와 메모를 기준으로 차단/장기 미해결 빠른 필터에서 우선순위를 다시 확인합니다.";
  }

  return "후속 확인: 운영 점검 화면에서 처리 결과와 상태 변경 이력을 다시 확인합니다.";
}
