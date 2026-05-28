"use client";

import { Calculator, Clipboard, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { calculateDutyEstimate, parseNumericInput, type DutyEstimateInternalTaxItem, type DutyEstimateTaxBaseType } from "@/features/duty-estimator/calculation";
import { dutyEstimatorHskCodeError, normalizeDutyEstimatorHskCode } from "@/features/duty-estimator/hsk-validation";
import { lookupExchangeRateAction, type ExchangeRateLookupState } from "@/server/actions/exchange-rate.actions";

const currencyOptions = ["USD", "EUR", "JPY", "CNY", "KRW"] as const;
const numberFormatter = new Intl.NumberFormat("ko-KR");
const initialExchangeRateState: ExchangeRateLookupState = { status: "idle" };

function formatMoney(value: number) {
  return `${numberFormatter.format(Math.round(value))}원`;
}

function taxBaseLabel(baseType: DutyEstimateTaxBaseType) {
  if (baseType === "customs_duty") return "관세";
  if (baseType === "taxable_value_plus_customs_duty") return "과세가격+관세";
  if (baseType === "previous_internal_tax_total") return "앞선 내국세";
  if (baseType === "taxable_value_plus_customs_duty_plus_previous_internal_tax") return "과세가격+관세+앞선 내국세";
  return "과세가격";
}

function NumericField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <div className="flex rounded-md border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-blue-600">
        <input
          className="min-w-0 flex-1 rounded-l-md px-3 py-2 text-slate-950 outline-none disabled:bg-slate-100 disabled:text-slate-500"
          disabled={disabled}
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {suffix ? <span className="grid shrink-0 place-items-center border-l border-slate-200 px-3 text-xs font-semibold text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function parseInternalTaxItemsParam(value: string | null): DutyEstimateInternalTaxItem[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map<DutyEstimateInternalTaxItem | null>((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const name = typeof record.name === "string" ? record.name.trim() : "";
        const rate = typeof record.rate === "number" ? record.rate : Number(record.rate);
        const baseType = typeof record.baseType === "string" && [
          "taxable_value",
          "customs_duty",
          "taxable_value_plus_customs_duty",
          "previous_internal_tax_total",
          "taxable_value_plus_customs_duty_plus_previous_internal_tax"
        ].includes(record.baseType)
          ? record.baseType as DutyEstimateTaxBaseType
          : undefined;

        return name && Number.isFinite(rate) && rate > 0 ? { name, rate, baseType } : null;
      })
      .filter((item): item is DutyEstimateInternalTaxItem => item !== null);
  } catch {
    return [];
  }
}

export function DutyEstimatorPanel() {
  const searchParams = useSearchParams();
  const initialInternalTaxItems = useMemo(() => parseInternalTaxItemsParam(searchParams.get("internalTaxItems")), [searchParams]);
  const initialCurrency = currencyOptions.includes(searchParams.get("currency") as (typeof currencyOptions)[number])
    ? searchParams.get("currency") as (typeof currencyOptions)[number]
    : "USD";
  const [hskCode, setHskCode] = useState(searchParams.get("hskCode") ?? "");
  const [basisDate, setBasisDate] = useState(searchParams.get("basisDate") ?? new Date().toISOString().slice(0, 10));
  const countryCode = (searchParams.get("countryCode") ?? "ALL").toUpperCase();
  const preferentialRateLabel = searchParams.get("preferentialRateLabel") ?? "";
  const [currency, setCurrency] = useState<(typeof currencyOptions)[number]>(initialCurrency);
  const [goodsAmount, setGoodsAmount] = useState(searchParams.get("goodsAmount") ?? "1000");
  const [exchangeRate, setExchangeRate] = useState(searchParams.get("exchangeRate") ?? "1350");
  const [freightKrw, setFreightKrw] = useState(searchParams.get("freightKrw") ?? "0");
  const [insuranceKrw, setInsuranceKrw] = useState(searchParams.get("insuranceKrw") ?? "0");
  const [dutyRate, setDutyRate] = useState(searchParams.get("dutyRate") ?? "8");
  const [preferentialRate, setPreferentialRate] = useState(searchParams.get("preferentialRate") ?? "");
  const [usePreferentialRate, setUsePreferentialRate] = useState(searchParams.get("usePreferentialRate") === "true");
  const [otherInternalTaxRate, setOtherInternalTaxRate] = useState(searchParams.get("otherInternalTaxRate") ?? "0");
  const [vatRate, setVatRate] = useState(searchParams.get("vatRate") ?? "10");
  const [copied, setCopied] = useState(false);
  const [exchangeRatePending, setExchangeRatePending] = useState(false);
  const [exchangeRateState, setExchangeRateState] = useState<ExchangeRateLookupState>(initialExchangeRateState);
  const normalizedHskCode = normalizeDutyEstimatorHskCode(hskCode);
  const hskCodeError = dutyEstimatorHskCodeError(hskCode);

  const result = useMemo(() => calculateDutyEstimate({
    goodsAmount: currency === "KRW" ? parseNumericInput(goodsAmount) : parseNumericInput(goodsAmount),
    exchangeRate: currency === "KRW" ? 1 : parseNumericInput(exchangeRate),
    freightKrw: parseNumericInput(freightKrw),
    insuranceKrw: parseNumericInput(insuranceKrw),
    dutyRate: parseNumericInput(dutyRate),
    preferentialRate: preferentialRate.trim() ? parseNumericInput(preferentialRate) : null,
    usePreferentialRate,
    otherInternalTaxRate: parseNumericInput(otherInternalTaxRate),
    otherInternalTaxItems: initialInternalTaxItems,
    vatRate: parseNumericInput(vatRate)
  }), [currency, dutyRate, exchangeRate, freightKrw, goodsAmount, initialInternalTaxItems, insuranceKrw, otherInternalTaxRate, preferentialRate, usePreferentialRate, vatRate]);

  const lookupHref = `/hs/direct?${new URLSearchParams({
    query: normalizedHskCode,
    direction: "import",
    destinationCountry: countryCode || "ALL",
    basisDate
  }).toString()}`;

  const copyText = [
    `HS CODE: ${hskCodeError ? "10자리 확인 필요" : hskCode}`,
    `조회기준일: ${basisDate}`,
    countryCode && countryCode !== "ALL" ? `수입 국가/협정 필터: ${countryCode}` : null,
    `물품가격: ${currency} ${goodsAmount || "0"}`,
    `관세환율: ${currency === "KRW" ? "1" : exchangeRate}`,
    exchangeRateState.status === "success" && exchangeRateState.effectiveFrom ? `관세환율 적용일: ${exchangeRateState.effectiveFrom}` : null,
    exchangeRateState.status === "success" && exchangeRateState.sourceSnapshotId ? `관세환율 스냅샷: ${exchangeRateState.sourceSnapshotId}` : null,
    `과세가격: ${formatMoney(result.taxableValueKrw)}`,
    `적용 관세율: ${result.appliedDutyRate}%`,
    preferentialRateLabel ? `FTA/협정 후보: ${preferentialRateLabel}` : null,
    `관세: ${formatMoney(result.customsDutyKrw)}`,
    `기타 내국세: ${formatMoney(result.otherInternalTaxKrw)}`,
    ...result.otherInternalTaxItems.map((item) => `- ${item.name} ${item.rate}% (${taxBaseLabel(item.baseType)} 기준): ${formatMoney(item.amountKrw)}`),
    `부가세 과세표준: ${formatMoney(result.vatBaseKrw)}`,
    `부가세: ${formatMoney(result.vatKrw)}`,
    `예상 납세액: ${formatMoney(result.totalTaxKrw)}`
  ].filter(Boolean).join("\n");

  async function copyResult() {
    if (hskCodeError) return;

    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleExchangeRateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExchangeRatePending(true);

    try {
      const nextState = await lookupExchangeRateAction(exchangeRateState, new FormData(event.currentTarget));
      setExchangeRateState(nextState);
      if (nextState.status === "success" && nextState.rate) {
        setExchangeRate(nextState.rate);
      }
    } finally {
      setExchangeRatePending(false);
      window.dispatchEvent(new CustomEvent("hsfinder:navigation-progress-done"));
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="예상 납세액 계산"
          description="물품가격, 관세환율, 운임·보험료, 관세율, 내국세율을 입력해 예상 납세액을 계산합니다. HS 조회에서 넘어온 값은 자동으로 채워집니다."
          action={<Badge tone="info">예상 계산</Badge>}
        />
        <CardBody>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
            <div className="grid min-w-0 gap-5">
              <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-start">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  HS CODE
                  <input
                    aria-invalid={Boolean(hskCodeError)}
                    className={`focus-ring rounded-md border px-3 py-2 ${hskCodeError ? "border-red-300 bg-red-50" : "border-slate-300"}`}
                    onChange={(event) => setHskCode(event.target.value)}
                    placeholder="예: 3401.30-0000"
                    type="text"
                    value={hskCode}
                  />
                  {hskCodeError ? <span className="text-xs font-semibold text-red-700">{hskCodeError}</span> : null}
                  <span className="text-xs text-slate-500">예: 3401.30-0000 또는 3401300000</span>
                </label>
                {hskCodeError ? (
                  <button
                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 self-end rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
                    disabled
                    type="button"
                  >
                    <Search aria-hidden="true" size={17} />
                    HS 조회
                  </button>
                ) : (
                  <Link className="focus-ring inline-flex items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={lookupHref}>
                    <Search aria-hidden="true" size={17} />
                    HS 조회
                  </Link>
                )}
                </div>

                <label className="grid max-w-xs gap-1 text-sm font-medium text-slate-700">
                  조회기준일
                  <input
                    className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950"
                    onChange={(event) => setBasisDate(event.target.value)}
                    type="date"
                    value={basisDate}
                  />
                </label>
              </section>

              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">과세가격 입력</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">외화 물품가격은 관세환율을 곱해 원화 과세가격에 반영합니다.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[140px_minmax(0,1fr)]">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  통화
                  <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" onChange={(event) => setCurrency(event.target.value as (typeof currencyOptions)[number])} value={currency}>
                    {currencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <NumericField label="물품가격" onChange={setGoodsAmount} suffix={currency} value={goodsAmount} />
                </div>

                <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 lg:grid-cols-[minmax(180px,260px)_1fr] lg:items-end">
                    <NumericField disabled={currency === "KRW"} label="관세환율" onChange={setExchangeRate} suffix="KRW" value={currency === "KRW" ? "1" : exchangeRate} />
                    <form className="grid gap-2 sm:grid-cols-[auto_auto_1fr] sm:items-center" onSubmit={handleExchangeRateSubmit}>
                    <input name="currencyCode" type="hidden" value={currency} />
                    <input name="applyStartDate" type="hidden" value={basisDate} />
                    <input name="direction" type="hidden" value="import" />
                    <button
                      className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={exchangeRatePending}
                      name="rateMode"
                      type="submit"
                      value="current"
                    >
                      {exchangeRatePending ? "조회 중" : currency === "KRW" ? "원화 1 적용" : "저장 환율 적용"}
                    </button>
                    <button
                      className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={exchangeRatePending || currency === "KRW"}
                      name="rateMode"
                      type="submit"
                      value="next"
                    >
                      차주 환율 적용
                    </button>
                    {exchangeRateState.status !== "idle" ? (
                      <span className={`min-w-0 text-xs leading-5 ${exchangeRateState.status === "success" ? "text-blue-700" : "text-amber-700"}`}>
                        {exchangeRateState.message}
                      </span>
                    ) : null}
                  </form>
                  </div>
                  {exchangeRateState.status === "success" && exchangeRateState.effectiveFrom ? (
                    <p className="text-xs text-slate-500">관세환율 적용일 {exchangeRateState.effectiveFrom}</p>
                  ) : null}
                  {exchangeRateState.status === "success" && exchangeRateState.sourceSnapshotId ? (
                    <p className="text-xs text-slate-500">스냅샷 {exchangeRateState.sourceSnapshotId}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <NumericField label="운임" onChange={setFreightKrw} suffix="KRW" value={freightKrw} />
                  <NumericField label="보험료" onChange={setInsuranceKrw} suffix="KRW" value={insuranceKrw} />
                </div>
              </section>

              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">세율 입력</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">HS 조회에서 넘어온 값이 있으면 초기값으로 사용하고, 실제 조건에 맞게 조정합니다.</p>
                </div>
                {countryCode !== "ALL" || preferentialRateLabel ? (
                  <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                    {countryCode !== "ALL" ? <span className="font-semibold">국가/협정 필터 {countryCode}</span> : null}
                    {preferentialRateLabel ? <span className="block">FTA/협정 후보: {preferentialRateLabel}</span> : null}
                    <span className="block text-blue-700">FTA 적용 여부는 원산지증명, 직접운송, 협정 요건 확인 후 선택해 주세요.</span>
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <NumericField label="기본 관세율" onChange={setDutyRate} suffix="%" value={dutyRate} />
                  <NumericField label="FTA/협정 관세율" onChange={setPreferentialRate} placeholder="선택" suffix="%" value={preferentialRate} />
                  <NumericField label="기타 내국세율 합계" onChange={setOtherInternalTaxRate} suffix="%" value={otherInternalTaxRate} />
                  <NumericField label="부가세율" onChange={setVatRate} suffix="%" value={vatRate} />
                </div>

                {initialInternalTaxItems.length ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-700">세목별 초기값</span>
                    <span className="mt-1 block">
                      {initialInternalTaxItems.map((item) => `${item.name} ${item.rate}%${item.baseType ? ` (${taxBaseLabel(item.baseType)} 기준)` : ""}`).join(" / ")}
                    </span>
                  </div>
                ) : null}

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    checked={usePreferentialRate}
                    className="size-4 rounded border-slate-300"
                    onChange={(event) => setUsePreferentialRate(event.target.checked)}
                    type="checkbox"
                  />
                  FTA/협정 관세율 적용
                </label>
              </section>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 xl:sticky xl:top-5">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-blue-700 text-white">
                  <Calculator aria-hidden="true" size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">계산 결과</p>
                  <p className="text-xs text-slate-500">원화 기준</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">과세가격</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.taxableValueKrw)}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">적용 관세율</dt><dd className="text-right font-semibold text-slate-950">{result.appliedDutyRate}%</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">관세</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.customsDutyKrw)}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">기타 내국세</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.otherInternalTaxKrw)}</dd></div>
                {result.otherInternalTaxItems.map((item) => (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 pl-3 text-xs" key={`${item.name}-${item.rate}`}>
                    <dt className="min-w-0 text-slate-500">{item.name} {item.rate}% ({taxBaseLabel(item.baseType)})</dt>
                    <dd className="text-right font-semibold text-slate-700">{formatMoney(item.amountKrw)}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">부가세 과세표준</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.vatBaseKrw)}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">부가세</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.vatKrw)}</dd></div>
                <div className="mt-2 border-t border-slate-200 pt-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <dt className="font-semibold text-slate-950">예상 납세액</dt>
                    <dd className="text-right text-lg font-semibold text-blue-700">{formatMoney(result.totalTaxKrw)}</dd>
                  </div>
                </div>
              </dl>

              {hskCodeError ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  HS CODE 10자리를 입력하면 계산 결과를 복사할 수 있습니다.
                </p>
              ) : null}

              <button
                className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={Boolean(hskCodeError)}
                onClick={copyResult}
                type="button"
              >
                <Clipboard aria-hidden="true" size={17} />
                {copied ? "복사됨" : "계산 결과 복사"}
              </button>
            </aside>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="자동 입력 범위" description="HS 조회 결과와 관세청 관세환율 API로 채울 수 있는 항목은 자동 입력하고, 과세가격 구성 항목은 사용자가 조정합니다." />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["관세환율", "API012 관세환율정보조회로 기준일·수입 구분별 환율을 조회합니다."],
              ["관세율", "통합 조회에서 넘어온 기본 관세율과 FTA/협정 관세율 후보를 초기값으로 사용합니다."],
              ["내국세", "현재는 테스트 법령룰과 통계부호 매칭값을 초기값으로 사용하고, 실제 매핑 자료 입수 후 대체합니다."]
            ].map(([title, body]) => (
              <div className="rounded-md border border-slate-200 p-4" key={title}>
                <p className="font-semibold text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
