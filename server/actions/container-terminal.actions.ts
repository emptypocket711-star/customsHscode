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

type TerminalCode = "hjit" | "snct" | "ifpc";

type TerminalLookupResult = {
  terminalCode: TerminalCode;
  terminalName: string;
  html: string;
  summary: Array<{ label: string; value: string }>;
  hasResult: boolean;
};

const hjitContainerInquiryUrl = "http://59.17.254.10:9130/esvc/inq/ContainerAction.do";
const snctContainerInquiryUrl = "https://snct.sun-kwang.co.kr/infoservice/webpage/opt/ContainerInfo.jsp";
const ifpcContainerInquiryUrl = "https://www.ifpc.co.kr/INFO/infoservice/index.html?gv_empno=cntr_info";
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

function escapeMarkup(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  if (terminalName.includes("인천신국제여객") || terminalCode.includes("IFPC")) return ["ifpc", "hjit", "snct"];
  if (terminalName.includes("선광") || terminalCode.includes("SNCT")) return ["snct", "hjit", "ifpc"];
  if (terminalName.includes("한진") || terminalCode.includes("HJIT")) return ["hjit", "snct", "ifpc"];
  return ["hjit", "snct", "ifpc"];
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

function buildIfpcHtml(containerNo: string, row?: EtransTrackingRow) {
  const safeContainerNo = escapeMarkup(containerNo);
  const statusDate = escapeMarkup(row?.statusDate ?? "-");
  const statusTime = escapeMarkup(row?.statusTime ?? "-");
  const statusName = escapeMarkup(row?.statusName ?? "-");
  const terminalName = escapeMarkup(row?.terminalName || "인천신국제여객터미널");
  const terminalCode = escapeMarkup(row?.terminalCode || "IFPC");

  return `
    <base href="https://www.ifpc.co.kr/">
    <style>
      body { margin: 0; padding: 18px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
      .panel { border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; padding: 18px; box-shadow: 0 12px 35px rgb(15 23 42 / 8%); }
      h1 { margin: 0 0 10px; font-size: 18px; }
      p { margin: 6px 0; font-size: 13px; line-height: 1.6; color: #475569; }
      dl { display: grid; grid-template-columns: 140px 1fr; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 14px; }
      dt, dd { margin: 0; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      dt { background: #f1f5f9; font-weight: 700; color: #475569; }
      dd { background: #fff; font-weight: 700; color: #0f172a; }
      dt:last-of-type, dd:last-of-type { border-bottom: 0; }
      a { display: inline-flex; margin-top: 14px; min-height: 36px; align-items: center; border-radius: 8px; background: #1d4ed8; color: #fff; padding: 0 12px; font-weight: 700; text-decoration: none; font-size: 13px; }
    </style>
    <div class="panel">
      <h1>${terminalName} 컨테이너 조회</h1>
      <p>인천항국제페리부두 원문 화면은 Nexacro 기반이라 현재는 eTrans 최신 이력으로 최종 반입지를 식별해 표시합니다.</p>
      <p>원문 확인이 필요하면 아래 버튼으로 터미널 조회 화면을 열어 컨테이너 번호를 입력해 주세요.</p>
      <dl>
        <dt>컨테이너 번호</dt><dd>${safeContainerNo}</dd>
        <dt>터미널</dt><dd>${terminalName}</dd>
        <dt>터미널 코드</dt><dd>${terminalCode}</dd>
        <dt>최신 상태</dt><dd>${statusName}</dd>
        <dt>상태 일시</dt><dd>${statusDate} ${statusTime}</dd>
      </dl>
      <a href="${ifpcContainerInquiryUrl}" target="_blank" rel="noreferrer">인천항국제페리부두 원문 열기</a>
    </div>
  `;
}

function lookupIfpcTerminal(containerNo: string, row?: EtransTrackingRow): TerminalLookupResult {
  const isIfpcRow = Boolean(row && (
    row.terminalName.includes("인천신국제여객") ||
    row.terminalCode.toUpperCase().includes("IFPC")
  ));
  const summary = [
    ["최신 상태", row?.statusName ?? ""],
    ["상태 일시", [row?.statusDate, row?.statusTime].filter(Boolean).join(" ")],
    ["터미널", row?.terminalName ?? "인천신국제여객터미널"],
    ["터미널 코드", row?.terminalCode ?? "IFPC"]
  ]
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value);

  return {
    terminalCode: "ifpc",
    terminalName: "인천항국제페리부두",
    html: buildIfpcHtml(containerNo, row),
    summary,
    hasResult: isIfpcRow
  };
}

async function lookupKnownTerminals(containerNo: string, order: TerminalCode[], topTrackingRow?: EtransTrackingRow) {
  const errors: string[] = [];

  for (const terminal of order) {
    try {
      const result = terminal === "ifpc"
        ? lookupIfpcTerminal(containerNo, topTrackingRow)
        : terminal === "snct"
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
    const terminalResult = await lookupKnownTerminals(containerNo, terminalOrder, topTrackingRow);

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
      notice,
      trackingRows,
      message: error instanceof Error ? `터미널 조회에 실패했습니다. ${error.message}` : "터미널 조회에 실패했습니다."
    };
  }
}
