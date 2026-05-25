export type BusinessRegistrationStatus = {
  configured: boolean;
  validFormat: boolean;
  active?: boolean;
  businessNo: string;
  message: string;
  rawStatus?: string;
};

function normalizeBusinessNo(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function endpointUrl() {
  return process.env.BUSINESS_REGISTRATION_STATUS_API_URL || "https://api.odcloud.kr/api/nts-businessman/v1/status";
}

function serviceKey() {
  return process.env.BUSINESS_REGISTRATION_STATUS_SERVICE_KEY || process.env.PUBLIC_DATA_SERVICE_KEY || "";
}

export function hasBusinessRegistrationStatusEnv() {
  return Boolean(serviceKey());
}

export async function checkBusinessRegistrationStatus(value: string): Promise<BusinessRegistrationStatus> {
  const businessNo = normalizeBusinessNo(value);

  if (businessNo.length !== 10) {
    return {
      businessNo,
      configured: hasBusinessRegistrationStatusEnv(),
      validFormat: false,
      message: "사업자등록번호 10자리를 입력해 주세요."
    };
  }

  if (!hasBusinessRegistrationStatusEnv()) {
    return {
      businessNo,
      configured: false,
      validFormat: true,
      message: "사업자등록번호 형식은 유효합니다. 운영용 사업자 상태 API 키를 등록하면 휴·폐업 여부까지 확인합니다."
    };
  }

  const url = new URL(endpointUrl());
  url.searchParams.set("serviceKey", serviceKey());

  const response = await fetch(url, {
    body: JSON.stringify({ b_no: [businessNo] }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.BUSINESS_REGISTRATION_STATUS_TIMEOUT_MS || 5000))
  });

  if (!response.ok) {
    throw new Error(`사업자 상태 조회 실패: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json() as {
    data?: Array<{
      b_no?: string;
      b_stt?: string;
      b_stt_cd?: string;
      tax_type?: string;
    }>;
  };
  const item = payload.data?.[0];
  const statusCode = item?.b_stt_cd ?? "";
  const statusText = item?.b_stt ?? "";
  const taxType = item?.tax_type ?? "";
  const active = statusCode === "01" || statusText.includes("계속");

  return {
    active,
    businessNo,
    configured: true,
    rawStatus: [statusText, taxType].filter(Boolean).join(" / "),
    validFormat: true,
    message: active
      ? `사업자등록번호 상태를 확인했습니다. ${[statusText, taxType].filter(Boolean).join(" / ")}`
      : `사업자 상태 확인이 필요합니다. ${[statusText, taxType].filter(Boolean).join(" / ") || "응답 상태값 없음"}`
  };
}
