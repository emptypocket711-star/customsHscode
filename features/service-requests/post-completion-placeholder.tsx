const completionCopy = {
  clearance: {
    note: "통관 완료 이후에는 신고·납부 결과, 최종 정산, 보관 서류 묶음을 리포트로 연결할 예정입니다.",
    steps: [
      "신고번호, 납부세액, 수리일 같은 완료 메타데이터",
      "관세사무소 정산 금액과 추가 비용 확인",
      "CI, PL, C/O, 신고필증 등 최종 보관 서류 묶음"
    ],
    title: "통관 완료 후 연결 예정"
  },
  freight: {
    note: "운송 완료 이후에는 최종 운임 정산, 선적·도착 이력, 보관 서류 묶음을 리포트로 연결할 예정입니다.",
    steps: [
      "최종 운임, 로컬비, 추가 비용 정산 내역",
      "선적일, 도착일, 운송 상태 이력",
      "B/L 또는 AWB, CI, PL 등 최종 보관 서류 묶음"
    ],
    title: "운송 완료 후 연결 예정"
  }
} as const;

export function PostCompletionPlaceholder({
  kind
}: {
  kind: keyof typeof completionCopy;
}) {
  const copy = completionCopy[kind];

  return (
    <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
      <p className="text-sm font-semibold text-slate-950">{copy.title}</p>
      <p className="text-xs leading-5 text-slate-600">{copy.note}</p>
      <div className="grid gap-2 md:grid-cols-3">
        {copy.steps.map((step) => (
          <p className="rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600" key={step}>
            {step}
          </p>
        ))}
      </div>
    </div>
  );
}
