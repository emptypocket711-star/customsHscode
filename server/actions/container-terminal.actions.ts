"use server";

export type HjitContainerLookupState = {
  status: "idle" | "success" | "error";
  message?: string;
  notice?: string;
  containerNo?: string;
  terminalName?: string;
  sourceUrl?: string;
  html?: string;
  summary?: Array<{ label: string; value: string }>;
  trackingRows?: EtransTrackingRow[];
};

type TerminalCode = "hjit" | "snct";

type TerminalLookupResult = {
  terminalCode: TerminalCode;
  terminalName: string;
  html: string;
  summary: Array<{ label: string; value: string }>;
  hasResult: boolean;
};

const hjitContainerInquiryUrl = "http://59.17.254.10:9130/esvc/inq/ContainerAction.do";
const snctContainerInquiryUrl = "https://snct.sun-kwang.co.kr/infoservice/webpage/opt/ContainerInfo.jsp";
const etransTrackingUrl = "https://etrans.klnet.co.kr/main/searchTracking.do";

export type EtransTrackingRow = {
  carCode: string;
  statusTime: string;
  terminalName: string;
  containerNo: string;
  terminalCode: string;
  containerStatus: string;
  statusDate: string;
  statusName: string;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContainerNo(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function decodeHtml(buffer: ArrayBuffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

function decodeEucKrHtml(buffer: ArrayBuffer) {
  return new TextDecoder("euc-kr").decode(buffer);
}

function sanitizeExternalHtml(html: string, baseHref: string) {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");

  const injected = `
    <base href="${baseHref}">
    <style>
      body { margin: 0; padding: 16px; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
      table { border-collapse: collapse; }
      td { font-size: 12px; line-height: 1.45; }
      input, select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 5px; color: #0f172a; background: #fff; }
      .left_bg, .left_top, .left_center, .left_end, .top_bg, .footer, #left_menu, .leftMenu { display: none; }
      .ser_cen2 { background: #fff; }
      img { max-width: 100%; }
    </style>
  `;

  if (withoutScripts.includes("</head>")) {
    return withoutScripts.replace("</head>", `${injected}</head>`);
  }

  return `${injected}${withoutScripts}`;
}

function htmlText(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractInputValueAfterLabel(html: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedLabel}[\\s\\S]*?<input[^>]*value="([^"]*)"`, "i");
  return htmlText(html.match(pattern)?.[1] ?? "");
}

function extractHjitSummary(html: string) {
  const rows = [
    ["Full/Empty", extractInputValueAfterLabel(html, "Full/Empty")],
    ["ISO", extractInputValueAfterLabel(html, "ISO")],
    ["Operator", extractInputValueAfterLabel(html, "Operator")],
    ["Vessel", extractInputValueAfterLabel(html, "Vessel")],
    ["Voyage", extractInputValueAfterLabel(html, "Voyage")],
    ["Terminal In", extractInputValueAfterLabel(html, "Terminal In")],
    ["Stacking", extractInputValueAfterLabel(html, "Stacking")],
    ["Truck Out", extractInputValueAfterLabel(html, "Truck Out")],
    ["Terminal Out", extractInputValueAfterLabel(html, "Terminal Out")]
  ];

  return rows
    .map(([label, value]) => ({ label, value }))
    .filter((row) => row.value && row.value !== "&nbsp;" && row.value !== "-");
}

function extractTextAfterCellLabel(html: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<td[^>]*>\\s*${escapedLabel}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i");
  return htmlText((html.match(pattern)?.[1] ?? "").replace(/<[^>]+>/g, " "));
}

function extractSunKwangSummary(html: string) {
  const rows = [
    ["모선항차", extractTextAfterCellLabel(html, "모선항차")],
    ["양하/적하항", extractTextAfterCellLabel(html, "양하/적하항")],
    ["X-Ray 검색", extractTextAfterCellLabel(html, "X-Ray 검색")],
    ["반입(양하)일시", extractTextAfterCellLabel(html, "반입(양하)일시")],
    ["반출(적하)일시", extractTextAfterCellLabel(html, "반출(적하)일시")]
  ];

  return rows
    .map(([label, value]) => ({ label, value }))
    .filter((row) => row.value && row.value !== "-");
}

function hasSunKwangResult(html: string) {
  return html.includes("goosl_tableHistory") && !html.includes("컨테이너에 대한 자료가 없습니다.");
}

type EtransTrackingApiRow = {
  CAR_CODE?: string;
  STATUS_TM?: string;
  TERMINAL_NAME?: string;
  CNTR_NO?: string;
  OUTGATE_CY?: string;
  CNTR_STATUS?: string;
  STATUS_DT?: string;
  STATUS_NM?: string;
};

type EtransTrackingApiResponse = {
  dma_tracking?: EtransTrackingApiRow[];
  rsMsg?: {
    message?: string;
    statusCode?: string;
  };
};

function mapEtransTrackingRow(row: EtransTrackingApiRow): EtransTrackingRow {
  return {
    carCode: row.CAR_CODE ?? "",
    statusTime: row.STATUS_TM ?? "",
    terminalName: row.TERMINAL_NAME ?? "",
    containerNo: row.CNTR_NO ?? "",
    terminalCode: row.OUTGATE_CY ?? "",
    containerStatus: row.CNTR_STATUS ?? "",
    statusDate: row.STATUS_DT ?? "",
    statusName: row.STATUS_NM ?? ""
  };
}

async function lookupEtransTracking(containerNo: string) {
  const response = await fetch(etransTrackingUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "user-agent": "HS Finder eTrans tracking lookup"
    },
    body: JSON.stringify({
      dma_search: {
        KLNET_ID: "",
        SEARCH_DATA: containerNo,
        NOTICE_CNT: ""
      }
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) return [];

  const json = await response.json() as EtransTrackingApiResponse;
  if (json.rsMsg?.statusCode && json.rsMsg.statusCode !== "S") return [];
  return (json.dma_tracking ?? []).map(mapEtransTrackingRow);
}

function topTrackingNotice(row?: EtransTrackingRow) {
  if (!row) return undefined;
  return row.statusName.includes("반출") ? "아직 최종 반입지에 반입이 되지 않았습니다. 참고해주세요." : undefined;
}

function noEtransResultNotice(rows: EtransTrackingRow[]) {
  return rows.length ? undefined : "eTrans 운송현황에서 조회 결과가 없습니다. 입력한 컨테이너 번호가 틀렸거나 이미 선적된 컨테이너일 수 있습니다.";
}

function preferredTerminalOrder(row?: EtransTrackingRow): TerminalCode[] {
  const terminalName = row?.terminalName ?? "";
  const terminalCode = row?.terminalCode.toUpperCase() ?? "";

  if (terminalName.includes("선광") || terminalCode.includes("SNCT")) return ["snct", "hjit"];
  if (terminalName.includes("한진") || terminalCode.includes("HJIT")) return ["hjit", "snct"];
  return ["hjit", "snct"];
}

async function lookupHjitTerminal(containerNo: string): Promise<TerminalLookupResult> {
  const body = new URLSearchParams({
    cmd: "ContainerInq",
    mode: "",
    nowPage: "1",
    contNo: containerNo,
    contPoint: ""
  });

  const response = await fetch(hjitContainerInquiryUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "HS Finder container terminal lookup"
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`한진인천컨테이너터미널 조회에 실패했습니다. (${response.status})`);

  const html = decodeHtml(await response.arrayBuffer());
  const summary = extractHjitSummary(html);

  return {
    terminalCode: "hjit",
    terminalName: "한진인천컨테이너터미널",
    html: sanitizeExternalHtml(html, "http://59.17.254.10:9130/"),
    summary,
    hasResult: summary.length > 0
  };
}

async function lookupSunKwangTerminal(containerNo: string): Promise<TerminalLookupResult> {
  const body = new URLSearchParams({
    isSearch: "Y",
    page: "1",
    URI: "/infoservice/webpage/opt/ContainerInfo.jsp",
    INPUT_PSN: "",
    cntrNo: containerNo
  });

  const response = await fetch(snctContainerInquiryUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "HS Finder container terminal lookup"
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`선광신컨테이너터미널 조회에 실패했습니다. (${response.status})`);

  const html = decodeEucKrHtml(await response.arrayBuffer());
  const summary = extractSunKwangSummary(html);

  return {
    terminalCode: "snct",
    terminalName: "선광신컨테이너터미널",
    html: sanitizeExternalHtml(html, "https://snct.sun-kwang.co.kr/"),
    summary,
    hasResult: hasSunKwangResult(html)
  };
}

async function lookupKnownTerminals(containerNo: string, order: TerminalCode[]) {
  const errors: string[] = [];

  for (const terminal of order) {
    try {
      const result = terminal === "snct"
        ? await lookupSunKwangTerminal(containerNo)
        : await lookupHjitTerminal(containerNo);

      if (result.hasResult) return result;
      errors.push(`${result.terminalName}: 조회 결과 없음`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${terminal} 조회 실패`);
    }
  }

  throw new Error(errors.join(" / ") || "터미널 조회 결과가 없습니다.");
}

export async function lookupHjitContainerAction(
  _previousState: HjitContainerLookupState,
  formData: FormData
): Promise<HjitContainerLookupState> {
  const containerNo = normalizeContainerNo(stringValue(formData, "containerNo"));

  if (!containerNo) {
    return { status: "error", message: "컨테이너 번호를 입력해 주세요." };
  }

  if (!/^[A-Z]{4}[0-9]{7}$/.test(containerNo)) {
    return { status: "error", message: "컨테이너 번호는 영문 4자리와 숫자 7자리 형식으로 입력해 주세요." };
  }

  let trackingRows: EtransTrackingRow[] = [];
  try {
    trackingRows = await lookupEtransTracking(containerNo);
  } catch {
    trackingRows = [];
  }

  const topTrackingRow = trackingRows[0];
  const notice = topTrackingNotice(topTrackingRow) ?? noEtransResultNotice(trackingRows);
  const terminalOrder = preferredTerminalOrder(topTrackingRow);

  try {
    const terminalResult = await lookupKnownTerminals(containerNo, terminalOrder);

    return {
      status: "success",
      message: `${terminalResult.terminalName} 조회 결과를 불러왔습니다.`,
      notice,
      containerNo,
      terminalName: terminalResult.terminalName,
      sourceUrl: `/api/external/hjit-container?terminal=${terminalResult.terminalCode}&containerNo=${encodeURIComponent(containerNo)}`,
      html: terminalResult.html,
      summary: terminalResult.summary,
      trackingRows
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? `한진인천컨테이너터미널 연결에 실패했습니다. ${error.message}` : "한진인천컨테이너터미널 연결에 실패했습니다."
    };
  }
}
