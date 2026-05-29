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
import type { DutyEstimatorDictionary } from "@/lib/i18n";
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

export function DutyEstimatorPanel({ dictionary }: { dictionary: DutyEstimatorDictionary }) {
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
    `HS CODE: ${hskCodeError ? dictionary.copy.hskNeedsTenDigits : hskCode}`,
    `${dictionary.form.basisDate}: ${basisDate}`,
    countryCode && countryCode !== "ALL" ? `${dictionary.copy.importCountryFilter}: ${countryCode}` : null,
    `${dictionary.copy.goodsAmount}: ${currency} ${goodsAmount || "0"}`,
    `${dictionary.copy.exchangeRate}: ${currency === "KRW" ? "1" : exchangeRate}`,
    exchangeRateState.status === "success" && exchangeRateState.effectiveFrom ? `${dictionary.copy.exchangeRateDate}: ${exchangeRateState.effectiveFrom}` : null,
    exchangeRateState.status === "success" && exchangeRateState.sourceSnapshotId ? `${dictionary.copy.exchangeRateSnapshot}: ${exchangeRateState.sourceSnapshotId}` : null,
    `${dictionary.copy.taxableValue}: ${formatMoney(result.taxableValueKrw)}`,
    `${dictionary.copy.appliedDutyRate}: ${result.appliedDutyRate}%`,
    preferentialRateLabel ? `${dictionary.copy.ftaCandidate}: ${preferentialRateLabel}` : null,
    `${dictionary.copy.customsDuty}: ${formatMoney(result.customsDutyKrw)}`,
    `${dictionary.copy.otherInternalTax}: ${formatMoney(result.otherInternalTaxKrw)}`,
    ...result.otherInternalTaxItems.map((item) => `- ${item.name} ${item.rate}% (${taxBaseLabel(item.baseType)} 기준): ${formatMoney(item.amountKrw)}`),
    `${dictionary.copy.vatBase}: ${formatMoney(result.vatBaseKrw)}`,
    `${dictionary.copy.vat}: ${formatMoney(result.vatKrw)}`,
    `${dictionary.copy.totalTax}: ${formatMoney(result.totalTaxKrw)}`
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
          title={dictionary.page.title}
          description={dictionary.page.panelDescription}
          action={<Badge tone="info">{dictionary.page.badge}</Badge>}
        />
        <CardBody>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
            <div className="grid min-w-0 gap-5">
              <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-start">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.hskCode}
                  <input
                    aria-invalid={Boolean(hskCodeError)}
                    className={`focus-ring rounded-md border px-3 py-2 ${hskCodeError ? "border-red-300 bg-red-50" : "border-slate-300"}`}
                    onChange={(event) => setHskCode(event.target.value)}
                    placeholder="예: 3401.30-0000"
                    type="text"
                    value={hskCode}
                  />
                  {hskCodeError ? <span className="text-xs font-semibold text-red-700">{hskCodeError}</span> : null}
                  <span className="text-xs text-slate-500">{dictionary.form.hskHint}</span>
                </label>
                {hskCodeError ? (
                  <button
                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 self-end rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
                    disabled
                    type="button"
                  >
                    <Search aria-hidden="true" size={17} />
                    {dictionary.form.hskLookup}
                  </button>
                ) : (
                  <Link className="focus-ring inline-flex items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={lookupHref}>
                    <Search aria-hidden="true" size={17} />
                    {dictionary.form.hskLookup}
                  </Link>
                )}
                </div>

                <label className="grid max-w-xs gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.basisDate}
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
                  <h3 className="text-sm font-semibold text-slate-950">{dictionary.form.taxableSectionTitle}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{dictionary.form.taxableSectionDescription}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[140px_minmax(0,1fr)]">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  {dictionary.form.currency}
                  <select className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2" onChange={(event) => setCurrency(event.target.value as (typeof currencyOptions)[number])} value={currency}>
                    {currencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <NumericField label={dictionary.form.goodsAmount} onChange={setGoodsAmount} suffix={currency} value={goodsAmount} />
                </div>

                <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 lg:grid-cols-[minmax(180px,260px)_1fr] lg:items-end">
                    <NumericField disabled={currency === "KRW"} label={dictionary.form.exchangeRate} onChange={setExchangeRate} suffix="KRW" value={currency === "KRW" ? "1" : exchangeRate} />
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
                      {exchangeRatePending ? "..." : currency === "KRW" ? dictionary.form.applyKrwOne : dictionary.form.applyCurrentRate}
                    </button>
                    <button
                      className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={exchangeRatePending || currency === "KRW"}
                      name="rateMode"
                      type="submit"
                      value="next"
                    >
                      {dictionary.form.applyNextWeekRate}
                    </button>
                    {exchangeRateState.status !== "idle" ? (
                      <span className={`flex min-w-0 flex-wrap items-center gap-2 text-xs leading-5 ${exchangeRateState.status === "success" ? "text-blue-700" : "text-amber-700"}`}>
                        <span>{exchangeRateState.message}</span>
                        {exchangeRateState.externalError ? (
                          <Badge tone={exchangeRateState.externalError.retryable ? "warning" : "neutral"}>
                            {exchangeRateState.externalError.retryable ? "재시도 가능" : "확인 필요"}
                          </Badge>
                        ) : null}
                      </span>
                    ) : null}
                  </form>
                  </div>
                  {exchangeRateState.diagnostic ? (
                    <dl className="grid gap-1 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950 sm:grid-cols-[6rem_1fr]">
                      <dt className="font-semibold">진단</dt>
                      <dd>{exchangeRateState.diagnostic.category}</dd>
                      <dt className="font-semibold">endpoint</dt>
                      <dd>{exchangeRateState.diagnostic.endpoint}</dd>
                      <dt className="font-semibold">detail</dt>
                      <dd className="break-all">{exchangeRateState.diagnostic.detail}</dd>
                    </dl>
                  ) : null}
                  {exchangeRateState.status === "success" && exchangeRateState.effectiveFrom ? (
                    <p className="text-xs text-slate-500">{dictionary.copy.exchangeRateDate} {exchangeRateState.effectiveFrom}</p>
                  ) : null}
                  {exchangeRateState.status === "success" && exchangeRateState.sourceSnapshotId ? (
                    <p className="text-xs text-slate-500">{dictionary.copy.exchangeRateSnapshot} {exchangeRateState.sourceSnapshotId}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <NumericField label={dictionary.form.freight} onChange={setFreightKrw} suffix="KRW" value={freightKrw} />
                  <NumericField label={dictionary.form.insurance} onChange={setInsuranceKrw} suffix="KRW" value={insuranceKrw} />
                </div>
              </section>

              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">{dictionary.form.rateSectionTitle}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{dictionary.form.rateSectionDescription}</p>
                </div>
                {countryCode !== "ALL" || preferentialRateLabel ? (
                  <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                    {countryCode !== "ALL" ? <span className="font-semibold">{dictionary.copy.importCountryFilter} {countryCode}</span> : null}
                    {preferentialRateLabel ? <span className="block">{dictionary.copy.ftaCandidate}: {preferentialRateLabel}</span> : null}
                    <span className="block text-blue-700">{dictionary.form.ftaHelp}</span>
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <NumericField label={dictionary.form.dutyRate} onChange={setDutyRate} suffix="%" value={dutyRate} />
                  <NumericField label={dictionary.form.ftaRate} onChange={setPreferentialRate} placeholder="선택" suffix="%" value={preferentialRate} />
                  <NumericField label={dictionary.form.otherInternalTaxRate} onChange={setOtherInternalTaxRate} suffix="%" value={otherInternalTaxRate} />
                  <NumericField label={dictionary.form.vatRate} onChange={setVatRate} suffix="%" value={vatRate} />
                </div>

                {initialInternalTaxItems.length ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-700">{dictionary.form.internalTaxItems}</span>
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
                  {dictionary.form.preferentialRateCheckbox}
                </label>
              </section>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 xl:sticky xl:top-5">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-blue-700 text-white">
                  <Calculator aria-hidden="true" size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{dictionary.result.resultTitle}</p>
                  <p className="text-xs text-slate-500">{dictionary.result.wonBasis}</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">{dictionary.result.taxableValue}</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.taxableValueKrw)}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">{dictionary.result.appliedDutyRate}</dt><dd className="text-right font-semibold text-slate-950">{result.appliedDutyRate}%</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">{dictionary.result.customsDuty}</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.customsDutyKrw)}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">{dictionary.result.otherInternalTax}</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.otherInternalTaxKrw)}</dd></div>
                {result.otherInternalTaxItems.map((item) => (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 pl-3 text-xs" key={`${item.name}-${item.rate}`}>
                    <dt className="min-w-0 text-slate-500">{item.name} {item.rate}% ({taxBaseLabel(item.baseType)})</dt>
                    <dd className="text-right font-semibold text-slate-700">{formatMoney(item.amountKrw)}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">{dictionary.result.vatBase}</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.vatBaseKrw)}</dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><dt className="text-slate-600">{dictionary.result.vat}</dt><dd className="text-right font-semibold text-slate-950">{formatMoney(result.vatKrw)}</dd></div>
                <div className="mt-2 border-t border-slate-200 pt-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <dt className="font-semibold text-slate-950">{dictionary.result.estimatedTotal}</dt>
                    <dd className="text-right text-lg font-semibold text-blue-700">{formatMoney(result.totalTaxKrw)}</dd>
                  </div>
                </div>
              </dl>

              {hskCodeError ? (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {dictionary.result.copyDisabled}
                </p>
              ) : null}

              <button
                className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={Boolean(hskCodeError)}
                onClick={copyResult}
                type="button"
              >
                <Clipboard aria-hidden="true" size={17} />
                {copied ? dictionary.copy.copied : dictionary.copy.copyResult}
              </button>
            </aside>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={dictionary.autoInput.cardTitle} description={dictionary.autoInput.description} />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              [dictionary.autoInput.exchangeTitle, dictionary.autoInput.exchangeBody],
              [dictionary.autoInput.dutyRateTitle, dictionary.autoInput.dutyRateBody],
              [dictionary.autoInput.internalTaxTitle, dictionary.autoInput.internalTaxBody]
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
