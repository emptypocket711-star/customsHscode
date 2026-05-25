import type { SupabaseClient } from "@supabase/supabase-js";

type CandidateRow = {
  id: string;
  request_id: string;
  hsk_code: string;
  hs6: string;
  confidence_score: number | string;
  reason: string;
  risk_notes: string;
  status: string;
};

type RequestRow = {
  id: string;
  company_id: string;
  direction: "import" | "export";
  input_product_name: string | null;
  origin_country: string | null;
  export_country: string | null;
  shipment_country: string | null;
  destination_country: string | null;
  basis_date: string;
};

type HsMasterRow = {
  hsk_code: string;
  hs6: string;
  korean_name: string;
  source_name: string;
  source_url: string;
  source_version: string;
  effective_from: string;
  effective_to: string | null;
  published_at: string | null;
  retrieved_at: string;
  checksum: string | null;
};

export function buildReportDraftJson(
  candidate: CandidateRow,
  request: RequestRow,
  hsRecord: HsMasterRow | null
) {
  const reportType = request.direction;
  const productName = request.input_product_name ?? hsRecord?.korean_name ?? "품명 확인 필요";
  const hskName = hsRecord?.korean_name ?? "HSK 품명 확인 필요";

  return {
    title: reportType === "import" ? "수입 예비진단 리포트" : "수출 예비진단 리포트",
    reportType,
    basisDate: request.basis_date,
    hskCode: candidate.hsk_code,
    hs6: candidate.hs6,
    productName,
    hskName,
    candidateId: candidate.id,
    countries: {
      originCountry: request.origin_country,
      exportCountry: request.export_country,
      shipmentCountry: request.shipment_country,
      destinationCountry: request.destination_country
    },
    sections: [
      {
        title: "HSK 후보 검토 결과",
        status: "담당자 검토 필요",
        items: [
          `선택 후보: ${candidate.hsk_code} / ${hskName}`,
          `후보 신뢰도: ${(Number(candidate.confidence_score) * 100).toFixed(0)}%`,
          candidate.reason,
          candidate.risk_notes
        ]
      },
      {
        title: reportType === "import" ? "수입 진단 후속 확인" : "수출 진단 후속 확인",
        status: "추가 확인 필요",
        items: reportType === "import"
          ? [
              "기본세율, WTO세율, FTA 협정세율은 기준일과 공식 source snapshot으로 재조회해야 합니다.",
              "세관장확인, 통합공고, 개별법령, 표시·인증·유통규제 가능성은 HSK 확정 후 재조회 필요합니다."
            ]
          : [
              "수출요건, 전략물자 예비 리스크, FTA C/O 발급 가능성은 HSK 확정 후 재조회 필요합니다.",
              "최종사용자, 최종용도, 제품 사양서, 원산지 증빙을 담당자 검토해야 합니다."
            ]
      }
    ],
    legalSafetyNotice:
      "본 리포트 초안은 공식 source snapshot과 deterministic rule engine 기반 예비진단입니다. 품목분류, 세율, 요건, FTA, 전략물자 여부는 담당자 검토 및 신고시점 확인이 필요합니다."
  };
}

function reportSummary(reportType: "import" | "export", hskCode: string) {
  if (reportType === "import") {
    return `${hskCode} 기준 수입 예비진단 초안입니다. 관세율, FTA, 수입요건은 담당자 검토 필요 상태입니다.`;
  }

  return `${hskCode} 기준 수출 예비진단 초안입니다. 수출요건, 전략물자 예비 리스크, FTA C/O는 담당자 검토 필요 상태입니다.`;
}

async function createSnapshot(
  supabase: SupabaseClient,
  input: {
    sourceType: string;
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    publishedAt: string | null;
    retrievedAt: string;
    checksum: string;
  }
) {
  const { data, error } = await supabase
    .from("legal_source_snapshots")
    .insert({
      source_type: input.sourceType,
      source_name: input.sourceName,
      source_url: input.sourceUrl,
      source_version: input.sourceVersion,
      effective_from: input.effectiveFrom,
      effective_to: input.effectiveTo,
      published_at: input.publishedAt,
      retrieved_at: input.retrievedAt,
      checksum: input.checksum,
      status: "published"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function createReportDraftForHsCandidate(
  supabase: SupabaseClient,
  candidateId: string,
  staffNote?: string | null
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인한 담당자만 리포트 초안을 생성할 수 있습니다.");

  const { data: candidateData, error: candidateError } = await supabase
    .from("hs_candidates")
    .select("id, request_id, hsk_code, hs6, confidence_score, reason, risk_notes, status")
    .eq("id", candidateId)
    .single();

  if (candidateError) throw new Error(candidateError.message);
  const candidate = candidateData as CandidateRow;
  if (candidate.status !== "staff_confirmed") {
    throw new Error("staff_confirmed 상태의 HS 후보만 리포트 초안을 생성할 수 있습니다.");
  }

  const { data: requestData, error: requestError } = await supabase
    .from("hs_search_requests")
    .select("id, company_id, direction, input_product_name, origin_country, export_country, shipment_country, destination_country, basis_date")
    .eq("id", candidate.request_id)
    .single();

  if (requestError) throw new Error(requestError.message);
  const request = requestData as RequestRow;

  const { data: hsData, error: hsError } = await supabase
    .from("hs_master")
    .select("hsk_code, hs6, korean_name, source_name, source_url, source_version, effective_from, effective_to, published_at, retrieved_at, checksum")
    .eq("hsk_code", candidate.hsk_code)
    .lte("effective_from", request.basis_date)
    .or(`effective_to.is.null,effective_to.gte.${request.basis_date}`)
    .eq("status", "published")
    .maybeSingle();

  if (hsError) throw new Error(hsError.message);
  const hsRecord = (hsData as HsMasterRow | null) ?? null;
  const reportJson = buildReportDraftJson(candidate, request, hsRecord);

  const { data: reportData, error: reportError } = await supabase
    .from("ai_reports")
    .insert({
      request_id: request.id,
      company_id: request.company_id,
      report_type: request.direction,
      basis_date: request.basis_date,
      status: "pending_review",
      report_json: reportJson,
      customer_summary: reportSummary(request.direction, candidate.hsk_code),
      staff_notes: staffNote ?? null,
      created_by: user.id
    })
    .select("id")
    .single();

  if (reportError) throw new Error(reportError.message);
  const reportId = reportData.id as string;

  const hsSnapshotId = hsRecord
    ? await createSnapshot(supabase, {
        sourceType: "hs_master",
        sourceName: hsRecord.source_name,
        sourceUrl: hsRecord.source_url,
        sourceVersion: hsRecord.source_version,
        effectiveFrom: hsRecord.effective_from,
        effectiveTo: hsRecord.effective_to,
        publishedAt: hsRecord.published_at,
        retrievedAt: hsRecord.retrieved_at,
        checksum: hsRecord.checksum ?? `hs-master-${candidate.hsk_code}-${request.basis_date}`
      })
    : null;
  const ruleSnapshotId = await createSnapshot(supabase, {
    sourceType: "rule_engine",
    sourceName: "HS FINDER deterministic report draft rules",
    sourceUrl: "internal://rules/report-draft",
    sourceVersion: "report-draft-v0",
    effectiveFrom: request.basis_date,
    effectiveTo: null,
    publishedAt: new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    checksum: `report-draft-v0-${request.basis_date}`
  });

  const lockRows = [
    ...(hsSnapshotId
      ? [{
          report_id: reportId,
          source_snapshot_id: hsSnapshotId,
          source_name: hsRecord!.source_name,
          source_url: hsRecord!.source_url,
          source_version: hsRecord!.source_version,
          lock_reason: "hs_candidate_report_generation"
        }]
      : []),
    {
      report_id: reportId,
      source_snapshot_id: ruleSnapshotId,
      source_name: "HS FINDER deterministic report draft rules",
      source_url: "internal://rules/report-draft",
      source_version: "report-draft-v0",
      lock_reason: "rule_engine_report_generation"
    }
  ];

  const { error: lockError } = await supabase.from("report_source_locks").insert(lockRows);
  if (lockError) throw new Error(lockError.message);

  return {
    reportId,
    sourceLockCount: lockRows.length
  };
}
