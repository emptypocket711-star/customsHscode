"use client";

import { FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatHsCode } from "@/lib/hs-code";
import type { ExportDestinationImportRequirementItem } from "@/server/repositories/export-destination-import-data.repository";

type DestinationImportRequirementDialogProps = {
  requirement: ExportDestinationImportRequirementItem;
};

function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}

function requirementTypeLabel(type: string) {
  const labels: Record<string, string> = {
    cites_endangered_species_permit: "멸종위기종",
    compulsory_product_certification: "제품인증",
    cosmetics_dossier: "화장품",
    cosmetics_labeling: "표시사항",
    cosmetics_registration_notification: "화장품",
    drug_import_port_filing: "의약품",
    drug_registration_approval: "의약품",
    hazardous_chemical_registration_inspection: "화학제품",
    import_food_safety_inspection: "식품",
    infant_children_textile_safety: "아동섬유",
    medical_device_registration_filing: "의료기기",
    overseas_food_producer_registration: "식품",
    ozone_depleting_substance_import_license: "환경규제",
    pesticide_registration_import: "농약",
    solid_waste_import_control: "폐기물",
    textile_apparel_labeling: "표시사항",
    textile_general_safety: "섬유제품"
  };

  return labels[type] ?? type;
}

function splitProcedureSummary(value?: string | null) {
  const summary = value?.trim();
  if (!summary) return { lead: "-", conditions: [] as string[] };

  const [lead, conditionText] = summary.split("조건:");
  return {
    lead: lead.trim() || "-",
    conditions: conditionText?.split("|").map((item) => item.trim()).filter(Boolean) ?? []
  };
}

function splitDocumentName(value: string) {
  const match = value.match(/^([A-Z0-9]{3,4}):\s*(.+)$/);
  return match ? { code: match[1], label: match[2] } : { code: null, label: value };
}

export function DestinationImportRequirementDialog({ requirement }: DestinationImportRequirementDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const procedure = splitProcedureSummary(requirement.procedureSummary);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  return (
    <>
      <button
        className="focus-ring inline-flex items-center gap-1 rounded text-left font-semibold text-blue-700 underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
        type="button"
      >
        <FileText aria-hidden="true" size={14} />
        {requirement.requirementName}
      </button>
      {open ? <dialog
        className="w-[min(780px,calc(100vw-32px))] rounded-lg border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/45"
        onCancel={() => setOpen(false)}
        ref={dialogRef}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">{requirementTypeLabel(requirement.requirementType)}</div>
            <h2 className="text-sm font-semibold text-slate-950">{requirement.requirementName}</h2>
          </div>
          <button
            aria-label="닫기"
            className="focus-ring grid size-8 place-items-center rounded-md text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="grid gap-4 p-4 text-sm">
          <dl className="grid grid-cols-[130px_1fr] overflow-hidden rounded-md border border-slate-200">
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">적용 HS</dt>
            <dd className="border-b border-slate-200 px-3 py-2 font-mono font-semibold">{formatHsCode(requirement.destinationHsCode)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">기관</dt>
            <dd className="border-b border-slate-200 px-3 py-2">{displayValue(requirement.agency)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">근거</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">{displayValue(requirement.legalBasis)}</dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">내용</dt>
            <dd className="border-b border-slate-200 px-3 py-2 leading-6">
              <div>{procedure.lead}</div>
              {procedure.conditions.length ? (
                <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3" open>
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">조건 및 신고 안내</summary>
                  <ul className="mt-2 grid gap-2">
                    {procedure.conditions.map((condition) => (
                      <li className="rounded bg-white px-2 py-1.5 text-xs leading-5 text-slate-700" key={condition}>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </dd>
            <dt className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-600">필요서류</dt>
            <dd className="border-b border-slate-200 px-3 py-2">
              {requirement.requiredDocuments.length ? (
                <ul className="grid gap-1">
                  {requirement.requiredDocuments.map((documentName) => {
                    const document = splitDocumentName(documentName);

                    return (
                    <li className="flex gap-2 leading-6 text-slate-800" key={documentName}>
                      {document.code ? (
                        <span className="h-fit rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
                          {document.code}
                        </span>
                      ) : null}
                      <span>{document.label}</span>
                    </li>
                    );
                  })}
                </ul>
              ) : (
                "-"
              )}
            </dd>
            <dt className="bg-slate-50 px-3 py-2 font-semibold text-slate-600">비고</dt>
            <dd className="px-3 py-2 leading-6">{displayValue(requirement.notes)}</dd>
          </dl>
        </div>
      </dialog> : null}
    </>
  );
}
