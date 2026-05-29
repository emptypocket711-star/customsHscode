import { NextResponse } from "next/server";
import { requireAuthenticatedApiRoute } from "@/server/auth/api-route-auth";
import { externalIntegrationErrorResponse } from "@/server/services/external-integration-error";

function normalizeContainerNo(value: string | null) {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type TerminalCode = "hjit" | "snct" | "ifpc" | "ict" | "bnct" | "pctc" | "pnct";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedApiRoute(request, {
    scope: "external-terminal-helper",
    limit: Number(process.env.TERMINAL_HELPER_RATE_LIMIT_PER_MINUTE || 30),
    windowMs: 60_000
  });
  if (!auth.allowed) {
    return externalIntegrationErrorResponse({
      code: auth.status === 429 ? "rate_limited" : "auth_required",
      level: auth.status === 429 ? "temporary" : "input",
      message: auth.message,
      retryable: auth.status === 429,
      status: auth.status
    });
  }

  const url = new URL(request.url);
  const containerNo = normalizeContainerNo(url.searchParams.get("containerNo"));
  const requestedTerminal = url.searchParams.get("terminal");
  const terminal: TerminalCode = requestedTerminal === "snct" || requestedTerminal === "ifpc" || requestedTerminal === "ict" || requestedTerminal === "bnct" || requestedTerminal === "pctc" || requestedTerminal === "pnct"
    ? requestedTerminal
    : "hjit";

  if (!/^[A-Z]{4}[0-9]{7}$/.test(containerNo)) {
    return externalIntegrationErrorResponse({
      code: "invalid_container_no",
      level: "input",
      message: "컨테이너 번호 형식이 올바르지 않습니다.",
      retryable: false,
      status: 400
    });
  }

  const safeContainerNo = escapeHtml(containerNo);
  const terminalLabel = terminal === "ict"
    ? "인천컨테이너터미널"
    : terminal === "bnct"
    ? "BNCT"
    : terminal === "pctc"
    ? "평택컨테이너터미널"
    : terminal === "pnct"
    ? "평택동방아이포트"
    : terminal === "ifpc"
    ? "인천항국제페리부두"
    : terminal === "snct"
      ? "선광신컨테이너터미널"
      : "한진인천컨테이너터미널";
  const actionUrl = terminal === "ict"
    ? "https://service.psa-ict.co.kr/webpage/general/contInfo.jsp"
    : terminal === "bnct"
    ? "https://info.bnctkorea.com/esvc/cntr/cntrSrch"
    : terminal === "pctc"
    ? `http://www.pctc21.com/esvc/cntr/info2?cntrNo=${safeContainerNo}`
    : terminal === "pnct"
    ? `http://www.pnct.co.kr/infoservice/jsp/main/mainPage_SteveTime.jsp?cntrNo=${safeContainerNo}`
    : terminal === "ifpc"
    ? "https://www.ifpc.co.kr/INFO/infoservice/index.html?gv_empno=cntr_info"
    : terminal === "snct"
      ? "https://snct.sun-kwang.co.kr/infoservice/webpage/opt/ContainerInfo.jsp"
      : "http://59.17.254.10:9130/esvc/inq/ContainerAction.do";
  const hiddenFields = terminal === "ifpc" || terminal === "bnct" || terminal === "pctc" || terminal === "pnct"
    ? ""
    : terminal === "ict"
      ? `
          <input type="hidden" name="isSearch" value="Y">
          <input type="hidden" name="page" value="1">
          <input type="hidden" name="URI" value="/webpage/general/contInfo.jsp">
          <input type="hidden" name="contNo" value="${safeContainerNo}">
        `
    : terminal === "snct"
      ? `
          <input type="hidden" name="isSearch" value="Y">
          <input type="hidden" name="page" value="1">
          <input type="hidden" name="URI" value="/infoservice/webpage/opt/ContainerInfo.jsp">
          <input type="hidden" name="INPUT_PSN" value="">
          <input type="hidden" name="cntrNo" value="${safeContainerNo}">
        `
      : `
          <input type="hidden" name="cmd" value="ContainerInq">
          <input type="hidden" name="mode" value="">
          <input type="hidden" name="nowPage" value="1">
          <input type="hidden" name="contNo" value="${safeContainerNo}">
          <input type="hidden" name="contPoint" value="">
        `;
  const method = terminal === "ifpc" || terminal === "bnct" || terminal === "pctc" || terminal === "pnct" ? "get" : "post";
  const submitScript = terminal === "ifpc" || terminal === "bnct" || terminal === "pctc" || terminal === "pnct"
    ? "window.location.href = document.getElementById(\"lookupForm\").action;"
    : "document.getElementById(\"lookupForm\").submit();";
  const guideText = terminal === "ifpc" || terminal === "bnct"
    ? `원문 화면이 열리면 컨테이너 번호 ${safeContainerNo}를 입력해 조회해 주세요.`
    : terminal === "pnct"
      ? `평택동방아이포트 양하예정시간 조회 화면을 컨테이너 번호 ${safeContainerNo}로 엽니다.`
    : terminal === "pctc"
      ? `컨테이너 번호 ${safeContainerNo}가 URL에 입력된 상태로 원문 화면을 엽니다.`
      : `컨테이너 번호 ${safeContainerNo}를 입력한 상태로 조회 요청을 전송합니다.`;
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>${terminalLabel} 조회 이동</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
      main { width: min(480px, calc(100vw - 32px)); border: 1px solid #dbe3ef; border-radius: 12px; background: white; padding: 24px; box-shadow: 0 18px 50px rgb(15 23 42 / 12%); }
      h1 { margin: 0; font-size: 18px; }
      p { margin: 10px 0 0; color: #475569; font-size: 14px; line-height: 1.6; }
      button { margin-top: 18px; min-height: 40px; border: 0; border-radius: 8px; background: #1d4ed8; color: white; padding: 0 16px; font-weight: 700; cursor: pointer; }
    </style>
  </head>
  <body>
    <main>
      <h1>${terminalLabel} 조회 화면으로 이동합니다.</h1>
      <p>${guideText}</p>
      <form id="lookupForm" method="${method}" action="${actionUrl}">
        ${hiddenFields}
        <button type="submit">조회 화면 열기</button>
      </form>
    </main>
    <script>
      window.setTimeout(function () {
        ${submitScript}
      }, 250);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
