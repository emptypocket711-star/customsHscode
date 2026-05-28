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

type TerminalCode = "hjit" | "snct" | "ifpc" | "ict" | "bnct" | "pctc" | "pnct";

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
const ictContainerInquiryUrl = "https://service.psa-ict.co.kr/webpage/general/contInfo.jsp";
const bnctContainerInquiryUrl = "https://info.bnctkorea.com/esvc/cntr/cntrSrch/search";
const pctcContainerInquiryUrl = "http://www.pctc21.com/esvc/cntr/info2/data";
const pnctContainerInquiryUrl = "http://www.pnct.co.kr/infoservice/jsp/main/mainPage_SteveTime.jsp";
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

function extractLegacyTerminalCellLabel(html: string, label: string, occurrence = 0) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const values: string[] = [];

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((cell) => htmlText(cell[1].replace(/<[^>]+>/g, " ")));
    const index = cells.findIndex((cell) => cell.includes(label));
    if (index >= 0 && cells[index + 1]) values.push(cells[index + 1]);
  }

  return values[occurrence] ?? "";
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

function extractIctSummary(html: string) {
  const rows = [
    ["F/M", extractLegacyTerminalCellLabel(html, "F/M")],
    ["ISO", extractLegacyTerminalCellLabel(html, "ISO")],
    ["적하 모선", extractLegacyTerminalCellLabel(html, "모선", 1)],
    ["적하 항차", extractLegacyTerminalCellLabel(html, "항차", 1)],
    ["터미널 반입 시간", extractLegacyTerminalCellLabel(html, "터미널 반입 시간")],
    ["터미널 반출 시간", extractLegacyTerminalCellLabel(html, "터미널 반출 시간")]
  ];

  return rows
    .map(([label, value]) => ({ label, value }))
    .filter((row) => row.value && row.value !== "-");
}

function hasIctResult(html: string, containerNo: string) {
  return html.includes(containerNo) && html.includes("일반 정보") && !html.includes("자료가 없습니다");
}

function recordValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function buildJsonTerminalHtml({
  title,
  containerNo,
  rows,
  note,
  sourceUrl
}: {
  title: string;
  containerNo: string;
  rows: Array<{ label: string; value: string }>;
  note?: string;
  sourceUrl?: string;
}) {
  const safeTitle = escapeMarkup(title);
  const safeContainerNo = escapeMarkup(containerNo);
  const rowMarkup = rows.length
    ? rows.map((row) => `<dt>${escapeMarkup(row.label)}</dt><dd>${escapeMarkup(row.value)}</dd>`).join("")
    : `<dt>조회 결과</dt><dd>표시할 상세 항목이 없습니다.</dd>`;
  const noteMarkup = note ? `<p>${escapeMarkup(note)}</p>` : "";
  const sourceMarkup = sourceUrl ? `<a href="${escapeMarkup(sourceUrl)}" target="_blank" rel="noreferrer">원문 화면 열기</a>` : "";

  return `
    <style>
      body { margin: 0; padding: 18px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
      .panel { border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; padding: 18px; box-shadow: 0 12px 35px rgb(15 23 42 / 8%); }
      h1 { margin: 0 0 10px; font-size: 18px; }
      p { margin: 6px 0; font-size: 13px; line-height: 1.6; color: #475569; }
      dl { display: grid; grid-template-columns: 150px 1fr; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 14px; }
      dt, dd { margin: 0; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      dt { background: #f1f5f9; font-weight: 700; color: #475569; }
      dd { background: #fff; font-weight: 700; color: #0f172a; }
      dt:last-of-type, dd:last-of-type { border-bottom: 0; }
      a { display: inline-flex; margin-top: 14px; min-height: 36px; align-items: center; border-radius: 8px; background: #1d4ed8; color: #fff; padding: 0 12px; font-weight: 700; text-decoration: none; font-size: 13px; }
    </style>
    <div class="panel">
      <h1>${safeTitle}</h1>
      <p>컨테이너 번호 ${safeContainerNo}의 터미널 조회 결과입니다.</p>
      ${noteMarkup}
      <dl>${rowMarkup}</dl>
      ${sourceMarkup}
    </div>
  `;
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

  if (
    terminalName.includes("평택동방아이포트") ||
    terminalName.includes("평택항신컨테이너") ||
    terminalCode.includes("PNCT")
  ) {
    return ["pnct", "pctc", "hjit", "snct", "ict", "ifpc", "bnct"];
  }
  if (terminalName.includes("BNCT") || terminalName.includes("부산신항컨테이너터미널") || terminalCode.includes("BNCT")) {
    return ["bnct", "hjit", "snct", "ict", "ifpc", "pctc", "pnct"];
  }
  if (terminalName.includes("평택컨테이너") || terminalCode.includes("PCTC")) {
    return ["pctc", "pnct", "hjit", "snct", "ict", "ifpc", "bnct"];
  }
  if (terminalName.includes("인천컨테이너터미널") || terminalCode.includes("ICT")) return ["ict", "hjit", "snct", "ifpc", "bnct", "pctc", "pnct"];
  if (terminalName.includes("인천신국제여객") || terminalCode.includes("IFPC")) return ["ifpc", "hjit", "snct", "ict", "bnct", "pctc", "pnct"];
  if (terminalName.includes("선광") || terminalCode.includes("SNCT")) return ["snct", "hjit", "ict", "ifpc", "bnct", "pctc", "pnct"];
  if (terminalName.includes("한진") || terminalCode.includes("HJIT")) return ["hjit", "snct", "ict", "ifpc", "bnct", "pctc", "pnct"];
  return ["hjit", "snct", "ict", "ifpc", "bnct", "pctc", "pnct"];
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

async function lookupIctTerminal(containerNo: string): Promise<TerminalLookupResult> {
  const body = new URLSearchParams({
    isSearch: "Y",
    page: "1",
    URI: "/webpage/general/contInfo.jsp",
    contNo: containerNo
  });

  const response = await fetch(ictContainerInquiryUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "HS Finder container terminal lookup"
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`인천컨테이너터미널 조회에 실패했습니다. (${response.status})`);

  const html = decodeEucKrHtml(await response.arrayBuffer());
  const summary = extractIctSummary(html);

  return {
    terminalCode: "ict",
    terminalName: "인천컨테이너터미널",
    html: sanitizeExternalHtml(html, "https://service.psa-ict.co.kr/"),
    summary,
    hasResult: hasIctResult(html, containerNo)
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

type BnctContainerResponse = {
  cntrInfo?: Array<Record<string, unknown>>;
};

async function lookupBnctTerminal(containerNo: string): Promise<TerminalLookupResult> {
  const url = new URL(bnctContainerInquiryUrl);
  url.searchParams.set("CNTR_NO", containerNo);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "HS Finder container terminal lookup"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`BNCT 조회에 실패했습니다. (${response.status})`);

  const json = await response.json() as BnctContainerResponse;
  const info = json.cntrInfo?.find((item) => recordValue(item, ["CNTR_NO"]).toUpperCase() === containerNo)
    ?? json.cntrInfo?.[0];
  const summary = [
    ["상태", recordValue(info, ["STS_NM", "CNL_DESC", "STS"])],
    ["F/M", recordValue(info, ["CNTR_FOE_NM", "CNTR_FOE"])],
    ["Size/Type", [recordValue(info, ["CNTR_SIZ"]), recordValue(info, ["CNTR_TYP"])].filter(Boolean).join("/") || recordValue(info, ["ISO_SIZ_TYP"])],
    ["Operator", recordValue(info, ["CNTR_OPR", "ACT_OPR"])],
    ["Vessel/Voyage", recordValue(info, ["VVD", "IN_VVD", "OUT_VVD"])],
    ["Terminal In", recordValue(info, ["TML_IN_DTE", "TRK_IN_DTE", "YARD_STACK_DTE"])],
    ["Terminal Out", recordValue(info, ["TML_OUT_DTE"])],
    ["Yard 위치", recordValue(info, ["YLOC", "VLOC"])],
    ["검사", recordValue(info, ["CNTR_INSP_NM", "CNTR_INSP"])]
  ]
    .map(([label, value]) => ({ label, value }))
    .filter((row) => row.value && row.value !== "-");

  return {
    terminalCode: "bnct",
    terminalName: "BNCT",
    html: buildJsonTerminalHtml({
      title: "BNCT 컨테이너 조회",
      containerNo,
      rows: summary,
      sourceUrl: "https://info.bnctkorea.com/esvc/cntr/cntrSrch"
    }),
    summary,
    hasResult: Boolean(info && recordValue(info, ["CNTR_NO"]))
  };
}

type PctcContainerResponse = {
  info?: Record<string, unknown>;
};

async function lookupPctcTerminal(containerNo: string): Promise<TerminalLookupResult> {
  const url = new URL(pctcContainerInquiryUrl);
  url.searchParams.set("cntrNo", containerNo);
  url.searchParams.set("vesselVoyage", "");
  url.searchParams.set("CNTR_UID", "");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "HS Finder container terminal lookup"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`평택컨테이너터미널 조회에 실패했습니다. (${response.status})`);

  const json = await response.json() as PctcContainerResponse;
  const info = json.info;
  const summary = [
    ["상태", recordValue(info, ["CNTR_STATE_NM", "CNTR_STATE", "STS_NM", "STATUS"])],
    ["F/M", recordValue(info, ["CNTR_FM", "CNTR_FOE_NM", "CNTR_FOE", "FE"])],
    ["Size/Type", recordValue(info, ["CNTR_SIZ_TYP", "SZTP", "ISO", "ISO_SIZ_TYP"])],
    ["Operator", recordValue(info, ["PTNR_CODE", "CNTR_OPR", "OPR"])],
    ["Vessel/Voyage", [recordValue(info, ["VSL_NM", "VSL_NAME"]), recordValue(info, ["VOYAGE", "VOY_NO", "VVD"])].filter(Boolean).join(" / ")],
    ["Terminal In", recordValue(info, ["TML_IN_DTE", "IN_DT", "GATE_IN_DTE", "CY_IN_DT"])],
    ["Terminal Out", recordValue(info, ["TML_OUT_DTE", "OUT_DT", "GATE_OUT_DTE", "CY_OUT_DT"])],
    ["Yard 위치", recordValue(info, ["YARD_POS", "YLOC", "VLOC", "STACK_POS"])],
    ["검사", recordValue(info, ["INSP_YN", "CNTR_INSP_NM", "CNTR_INSP"])]
  ]
    .map(([label, value]) => ({ label, value }))
    .filter((row) => row.value && row.value !== "-");

  return {
    terminalCode: "pctc",
    terminalName: "평택컨테이너터미널",
    html: buildJsonTerminalHtml({
      title: "평택컨테이너터미널 컨테이너 조회",
      containerNo,
      rows: summary,
      note: "평택컨테이너터미널은 원문 화면이 cntrNo 파라미터를 지원하므로 원사이트 열기 시 입력한 컨테이너 번호로 조회 화면이 열립니다.",
      sourceUrl: `http://www.pctc21.com/esvc/cntr/info2?cntrNo=${encodeURIComponent(containerNo)}`
    }),
    summary,
    hasResult: Boolean(info && (recordValue(info, ["CNTR_NO", "cntrNo"]) || summary.length > 0))
  };
}

function extractPnctSummary(html: string) {
  const cells = [...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((cell) => htmlText(cell[1].replace(/<[^>]+>/g, " ")))
    .filter(Boolean);
  const missingMessage = cells.find((cell) => cell.includes("찾을 수 없습니다"));
  if (missingMessage) return [{ label: "조회 결과", value: missingMessage }];

  return cells.slice(0, 12).map((value, index) => ({
    label: index === 0 ? "조회 결과" : `항목 ${index + 1}`,
    value
  }));
}

async function lookupPnctTerminal(containerNo: string): Promise<TerminalLookupResult> {
  const url = new URL(pnctContainerInquiryUrl);
  url.searchParams.set("cntrNo", containerNo);

  const response = await fetch(url, {
    headers: {
      "user-agent": "HS Finder container terminal lookup"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`평택동방아이포트 조회에 실패했습니다. (${response.status})`);

  const html = decodeEucKrHtml(await response.arrayBuffer());
  const summary = extractPnctSummary(html);
  const hasResult = summary.length > 0 && !summary.some((row) => row.value.includes("찾을 수 없습니다"));

  return {
    terminalCode: "pnct",
    terminalName: "평택동방아이포트",
    html: sanitizeExternalHtml(html, "http://www.pnct.co.kr/infoservice/"),
    summary,
    hasResult
  };
}

async function lookupKnownTerminals(containerNo: string, order: TerminalCode[], topTrackingRow?: EtransTrackingRow) {
  const errors: string[] = [];

  for (const terminal of order) {
    try {
      let result: TerminalLookupResult;
      if (terminal === "ifpc") {
        result = lookupIfpcTerminal(containerNo, topTrackingRow);
      } else if (terminal === "bnct") {
        result = await lookupBnctTerminal(containerNo);
      } else if (terminal === "pctc") {
        result = await lookupPctcTerminal(containerNo);
      } else if (terminal === "pnct") {
        result = await lookupPnctTerminal(containerNo);
      } else if (terminal === "snct") {
        result = await lookupSunKwangTerminal(containerNo);
      } else if (terminal === "ict") {
        result = await lookupIctTerminal(containerNo);
      } else {
        result = await lookupHjitTerminal(containerNo);
      }

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
