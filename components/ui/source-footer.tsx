export function SourceFooter({
  sourceName = "-",
  sourceVersion = "-",
  basisDate,
  showVersion = true
}: {
  sourceName?: string;
  sourceVersion?: string;
  basisDate?: string;
  showVersion?: boolean;
}) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">
      <dl className={`grid gap-2 ${showVersion ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <div>
          <dt className="text-xs font-semibold text-slate-500">조회기준일</dt>
          <dd>{basisDate ?? "Asia/Seoul 오늘 기준"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">출처</dt>
          <dd>{sourceName}</dd>
        </div>
        {showVersion ? (
          <div>
            <dt className="text-xs font-semibold text-slate-500">버전</dt>
            <dd>{sourceVersion}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
