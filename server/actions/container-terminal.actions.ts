"use server";

export type HjitContainerLookupState = {
  status: "idle" | "success" | "error";
  message?: string;
  containerNo?: string;
  terminalName?: string;
  sourceUrl?: string;
  html?: string;
  summary?: Array<{ label: string; value: string }>;
};

const hjitContainerInquiryUrl = "http://59.17.254.10:9130/esvc/inq/ContainerAction.do";

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

function sanitizeExternalHtml(html: string) {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");

  const injected = `
    <base href="http://59.17.254.10:9130/">
    <style>
      body { margin: 0; padding: 16px; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
      table { border-collapse: collapse; }
      td { font-size: 12px; line-height: 1.45; }
      input, select { border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 5px; color: #0f172a; background: #fff; }
      .left_bg, .left_top, .left_center, .left_end, .top_bg, .footer { display: none; }
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

  const body = new URLSearchParams({
    cmd: "ContainerInq",
    mode: "",
    nowPage: "1",
    contNo: containerNo,
    contPoint: ""
  });

  try {
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

    if (!response.ok) {
      return {
        status: "error",
        message: `한진인천컨테이너터미널 조회에 실패했습니다. (${response.status})`
      };
    }

    const html = decodeHtml(await response.arrayBuffer());
    const summary = extractHjitSummary(html);

    return {
      status: "success",
      message: summary.length ? "한진인천컨테이너터미널 조회 결과를 불러왔습니다." : "조회 결과 원문을 불러왔습니다. 원문 화면에서 상세 내용을 확인해 주세요.",
      containerNo,
      terminalName: "한진인천컨테이너터미널",
      sourceUrl: "http://59.17.254.10:9130/esvc/inq/ContainerAction.do?cmd=ContainerInqView",
      html: sanitizeExternalHtml(html),
      summary
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? `한진인천컨테이너터미널 연결에 실패했습니다. ${error.message}` : "한진인천컨테이너터미널 연결에 실패했습니다."
    };
  }
}
