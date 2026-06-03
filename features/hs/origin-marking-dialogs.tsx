"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { originMarkingSummaryText } from "@/features/hs/origin-marking-summary";

type OriginMarkingInfo = {
  isTarget: boolean;
  matchedPattern: string;
  patternType: string;
  conditionText: string | null;
  targetSourceName: string;
  targetSourceUrl: string;
  targetSourceVersion: string;
  method: {
    matchedPattern: string;
    itemName: string;
    methodSummary: string;
    note: string | null;
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
  } | null;
  methods: Array<{
    matchedPattern: string;
    itemName: string;
    methodSummary: string;
    note: string | null;
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
  }>;
} | null;

type PresentOriginMarkingInfo = NonNullable<OriginMarkingInfo>;

type OriginMarkingLinksProps = {
  originMarking: OriginMarkingInfo;
  hskCode: string;
  itemName: string;
};

type OriginMarkingDialogProps = {
  originMarking: PresentOriginMarkingInfo;
  hskCode: string;
  itemName: string;
};

function displayPattern(pattern: string) {
  if (pattern.length === 6) return `${pattern.slice(0, 4)}.${pattern.slice(4, 6)}`;
  if (pattern.length === 10) return `${pattern.slice(0, 4)}.${pattern.slice(4, 6)}-${pattern.slice(6, 10)}`;
  return pattern;
}

function formatOriginText(value?: string | null) {
  if (!value?.trim()) return "-";

  return value
    .replaceAll("원산지표시", "원산지 표시")
    .replaceAll("소매용최소포장", "소매용 최소포장")
    .replaceAll("포장상자", "포장상자")
    .replaceAll("현품에", "현품에 ")
    .replaceAll("용기등", "용기 등")
    .replaceAll("자루,용기", "자루, 용기")
    .replaceAll(",", ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function DialogShell({
  children,
  title,
  trigger,
  triggerClassName
}: {
  children: ReactNode;
  title: string;
  trigger: string;
  triggerClassName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className={triggerClassName} onClick={() => dialogRef.current?.showModal()} type="button">
        {trigger}
      </button>
      <dialog className="w-[min(900px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45" ref={dialogRef}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}

function SourceLine({ sourceName, sourceUrl }: { sourceName: string; sourceUrl: string }) {
  return (
    <p className="text-xs text-slate-500">
      기준 자료:{" "}
      <a className="font-medium text-blue-700 underline-offset-2 hover:underline" href={sourceUrl} rel="noreferrer" target="_blank">
        {sourceName}
      </a>
    </p>
  );
}

function LawLinks() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <a
        className="rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-blue-700 underline-offset-2 hover:underline"
        href="https://www.law.go.kr/법령/대외무역법"
        rel="noreferrer"
        target="_blank"
      >
        대외무역법
      </a>
      <a
        className="rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-blue-700 underline-offset-2 hover:underline"
        href="https://www.law.go.kr/행정규칙/대외무역관리규정"
        rel="noreferrer"
        target="_blank"
      >
        대외무역관리규정
      </a>
      <a
        className="rounded border border-slate-200 bg-white px-2 py-1 font-semibold text-blue-700 underline-offset-2 hover:underline"
        href="https://www.law.go.kr/행정규칙/원산지제도운영에관한고시"
        rel="noreferrer"
        target="_blank"
      >
        원산지제도 운영에 관한 고시
      </a>
    </div>
  );
}

function OriginMarkingTargetDialog({ originMarking, hskCode, itemName }: OriginMarkingDialogProps) {
  const summary = originMarkingSummaryText(true);

  return (
    <DialogShell
      title="원산지표시대상"
      trigger={summary.summary}
      triggerClassName="focus-ring rounded text-left font-semibold text-red-600 underline-offset-2 hover:underline"
    >
      <div className="max-h-[78vh] overflow-auto p-4 text-sm">
        <div className="grid gap-4">
          <dl className="grid grid-cols-[130px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">조회 품목</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{itemName}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">HS CODE</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono">{displayPattern(hskCode)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">매칭 기준</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{displayPattern(originMarking.matchedPattern)} 기준</dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">조건</dt>
            <dd className="px-3 py-2">{originMarking.conditionText ?? "별도 조건 없음"}</dd>
          </dl>

          <section className="rounded-md border border-slate-200">
            <h3 className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">표시대상 판단 시 확인할 내용</h3>
            <div className="grid gap-3 p-3 leading-6 text-slate-700">
              <p>해당 HS는 원산지표시대상물품 별표에 포함된 코드입니다. 실제 표시 의무는 물품의 상태, 포장 형태, 판매 형태, 예외 규정에 따라 달라질 수 있습니다.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>소매용 최소포장에 표시가 허용되는 물품인지 확인합니다.</li>
                <li>현품 표시가 원칙인 물품은 물품 자체, 라벨, 각인, 인쇄 등 탈락·훼손 우려가 적은 방식으로 표시합니다.</li>
                <li>최종 구매자가 쉽게 식별할 수 있는 위치와 크기로 원산지를 표시해야 합니다.</li>
                <li>세트물품, 단순 조립품, 부분품 등은 물품별 고시와 예외 규정을 함께 확인합니다.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-md border border-slate-200">
            <h3 className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">근거 법령</h3>
            <div className="grid gap-3 p-3 leading-6 text-slate-700">
              <p>원산지표시 의무와 표시방법은 대외무역법, 대외무역관리규정, 원산지제도 운영에 관한 고시를 함께 확인합니다.</p>
              <LawLinks />
            </div>
          </section>

          <SourceLine sourceName={originMarking.targetSourceName} sourceUrl={originMarking.targetSourceUrl} />
        </div>
      </div>
    </DialogShell>
  );
}

function OriginMarkingMethodDialog({ originMarking, itemName }: OriginMarkingDialogProps) {
  const method = originMarking.method;
  const methods = originMarking.methods.length ? originMarking.methods : method ? [method] : [];

  return (
    <DialogShell
      title="원산지 표시방법"
      trigger="[표시방법]"
      triggerClassName="focus-ring rounded text-left font-semibold text-emerald-700 underline-offset-2 hover:underline"
    >
      <div className="max-h-[78vh] overflow-auto p-4 text-sm">
        <div className="grid gap-4">
          <table className="w-full border-collapse overflow-hidden rounded-md border border-slate-200 text-left">
            <thead className="bg-blue-700 text-xs font-semibold text-white">
              <tr>
                <th className="px-3 py-2">HS</th>
                <th className="px-3 py-2">품명</th>
                <th className="px-3 py-2">표시방법</th>
                <th className="px-3 py-2">비고</th>
              </tr>
            </thead>
            <tbody>
              {methods.length ? (
                methods.map((row, index) => (
                  <tr className="border-t border-slate-200" key={`${row.matchedPattern}-${row.itemName}-${index}`}>
                    <td className="whitespace-nowrap px-3 py-2 font-mono">{displayPattern(row.matchedPattern)}</td>
                    <td className="px-3 py-2">{formatOriginText(row.itemName)}</td>
                    <td className="px-3 py-2 leading-6">{formatOriginText(row.methodSummary)}</td>
                    <td className="px-3 py-2 leading-6">{formatOriginText(row.note)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-200">
                  <td className="whitespace-nowrap px-3 py-2 font-mono">{displayPattern(originMarking.matchedPattern)}</td>
                  <td className="px-3 py-2">{formatOriginText(itemName)}</td>
                  <td className="px-3 py-2 leading-6">개별 표시방법 데이터가 없는 품목입니다. 아래 일반원칙에 따라 현품, 포장, 최소포장 등 적정 표시방법을 확인합니다.</td>
                  <td className="px-3 py-2 leading-6">-</td>
                </tr>
              )}
            </tbody>
          </table>

          <section className="rounded-md border border-slate-200">
            <h3 className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">일반원칙</h3>
            <div className="grid gap-3 p-3 leading-6 text-slate-700">
              <p>별표에 직접 기재되지 않은 물품이라도 같은 HS세번에 해당하고 게재 물품과 유사하면 그 물품에 준하여 표시방법을 검토합니다.</p>
              <p>표시방법이 특정되지 않은 원산지표시 대상물품은 물품 특성, 포장 형태, 소비자 식별 가능성, 표시의 견고성에 맞는 방법을 선택합니다.</p>
              <p>소매용 최소포장 표시가 허용되는 경우에도 수입 후 포장 제거 또는 재포장 가능성이 있으면 현품 표시 필요성을 함께 확인합니다.</p>
            </div>
          </section>

          <section className="rounded-md border border-slate-200">
            <h3 className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">근거 법령</h3>
            <div className="grid gap-3 p-3 leading-6 text-slate-700">
              <p>물품별 표시방법은 원산지제도 운영에 관한 고시의 표시방법 체계를 기준으로 확인합니다.</p>
              <LawLinks />
            </div>
          </section>

          <SourceLine
            sourceName={method?.sourceName ?? originMarking.targetSourceName}
            sourceUrl={method?.sourceUrl ?? originMarking.targetSourceUrl}
          />
        </div>
      </div>
    </DialogShell>
  );
}

export function OriginMarkingLinks({ originMarking, hskCode, itemName }: OriginMarkingLinksProps) {
  if (!originMarking?.isTarget) {
    const summary = originMarkingSummaryText(false);

    return (
      <span className="grid gap-1">
        <span className="text-sm font-semibold text-slate-700">{summary.summary}</span>
        <span className="text-xs leading-5 text-slate-500">{summary.note}</span>
      </span>
    );
  }

  const summary = originMarkingSummaryText(true);

  return (
    <span className="grid gap-1">
      <span className="inline-flex flex-wrap items-center gap-2">
      <OriginMarkingTargetDialog hskCode={hskCode} itemName={itemName} originMarking={originMarking} />
      <OriginMarkingMethodDialog hskCode={hskCode} itemName={itemName} originMarking={originMarking} />
      </span>
      <span className="text-xs leading-5 text-slate-500">{summary.note}</span>
    </span>
  );
}
