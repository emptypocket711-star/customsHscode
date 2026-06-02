#!/usr/bin/env node

import { access } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import {
  completionReportPreviewAccessMatrix,
  completionReportPreviewFixture as fixture
} from "../tests/fixtures/completion-report-preview.fixture.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3100";
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 120000);
const stateDir = process.env.E2E_STORAGE_STATE_DIR || "tmp/e2e-auth";

const freightRequestId = fixture.freightRequestId;
const clearanceRequestId = fixture.clearanceRequestId;

const stateFiles = {
  developer: path.join(stateDir, "completion-preview-developer.json"),
  requester: path.join(stateDir, "completion-preview-requester.json"),
  selectedPartner: path.join(stateDir, "completion-preview-selected-partner.json"),
  unmatchedPartner: path.join(stateDir, "completion-preview-unmatched-partner.json")
};

function assert(condition, message, details = {}) {
  if (condition) return;

  const error = new Error(message);
  error.details = details;
  throw error;
}

function assertLocalBaseUrl(value) {
  const url = new URL(value);
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
  assert(isLocal, `local base URL에서만 completion preview e2e를 실행할 수 있습니다. current=${url.origin}`);
}

function previewUrl(kind, requestId) {
  return new URL(`/requests/${kind}/${requestId}/completion-report/preview`, baseUrl).toString();
}

async function assertStorageStatesExist() {
  for (const [role, statePath] of Object.entries(stateFiles)) {
    try {
      await access(statePath);
    } catch {
      throw new Error(`${role} storage state가 없습니다: ${statePath}. 먼저 npm run e2e:completion-preview:auth를 실행하세요.`);
    }
  }
}

async function pageTextFor(browser, role, url) {
  const context = await browser.newContext({ storageState: stateFiles[role] });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
    return {
      text: await page.locator("body").innerText({ timeout: timeoutMs }),
      url: page.url()
    };
  } finally {
    await context.close();
  }
}

async function assertPreviewVisible(browser, role, kind, requestId, expectedTitle, expectedDocumentRole) {
  const result = await pageTextFor(browser, role, previewUrl(kind, requestId));

  assert(result.text.includes(expectedTitle), `${role}에게 preview title이 보이지 않습니다.`, { currentUrl: result.url });
  assert(result.text.includes("출처 snapshot 버전 completion-report-source-v1"), `${role}에게 source snapshot version이 보이지 않습니다.`);
  assert(result.text.includes("요청 상태 snapshot 완료"), `${role}에게 request status snapshot이 보이지 않습니다.`);
  assert(result.text.includes("공표시각 2026-05-31T00:00:00.000Z"), `${role}에게 published_at이 보이지 않습니다.`);
  assert(result.text.includes(expectedDocumentRole), `${role}에게 보관 서류 한글 라벨이 보이지 않습니다.`);
  assert(result.text.includes("담당자 검토 없이 법적 확정"), `${role}에게 안전 고지가 보이지 않습니다.`);

  for (const forbidden of ["fileName", "question", "answer", "message", "download", "다운로드", "TEST-FREIGHT-FILE-NOT-DISPLAYED", "TEST-CLEARANCE-FILE-NOT-DISPLAYED"]) {
    assert(!result.text.includes(forbidden), `${role} preview에 민감/원문성 토큰이 표시됩니다.`, { forbidden });
  }
}

async function assertPreviewHidden(browser, role, kind, requestId) {
  const result = await pageTextFor(browser, role, previewUrl(kind, requestId));
  assert(!result.text.includes("완료 리포트 미리보기"), `${role}에게 preview 본문이 노출됩니다.`, { currentUrl: result.url });
}

async function assertMismatchedKindHidden(browser, role) {
  const freightRouteWithClearanceId = await pageTextFor(browser, role, previewUrl("freight", clearanceRequestId));
  assert(
    !freightRouteWithClearanceId.text.includes("완료 리포트 미리보기"),
    `${role}에게 freight route + clearance request preview 본문이 노출됩니다.`,
    { currentUrl: freightRouteWithClearanceId.url }
  );

  const clearanceRouteWithFreightId = await pageTextFor(browser, role, previewUrl("clearance", freightRequestId));
  assert(
    !clearanceRouteWithFreightId.text.includes("완료 리포트 미리보기"),
    `${role}에게 clearance route + freight request preview 본문이 노출됩니다.`,
    { currentUrl: clearanceRouteWithFreightId.url }
  );
}

async function assertUnauthenticatedRedirect(browser, kind, requestId) {
  const page = await browser.newPage();
  try {
    await page.goto(previewUrl(kind, requestId), { waitUntil: "networkidle", timeout: timeoutMs });
    const body = await page.locator("body").innerText({ timeout: timeoutMs });
    assert(page.url().includes("/login"), "비로그인 preview 접근이 login으로 이동하지 않았습니다.", { currentUrl: page.url() });
    assert(body.includes("로그인"), "비로그인 preview 접근 후 로그인 화면이 표시되지 않았습니다.");
  } finally {
    await page.close();
  }
}

function requestIdFor(kind) {
  return kind === "freight" ? freightRequestId : clearanceRequestId;
}

function expectedTitleFor(kind) {
  return kind === "freight" ? "운송 완료 리포트 미리보기" : "통관 완료 리포트 미리보기";
}

function expectedDocumentRoleFor(kind) {
  return kind === "freight" ? "최종 B/L 또는 AWB" : "수입신고필증";
}

async function main() {
  assertLocalBaseUrl(baseUrl);
  await assertStorageStatesExist();

  const browser = await chromium.launch({ headless: true });

  try {
    await assertUnauthenticatedRedirect(browser, "freight", freightRequestId);
    await assertUnauthenticatedRedirect(browser, "clearance", clearanceRequestId);
    for (const expectation of completionReportPreviewAccessMatrix) {
      for (const kind of expectation.kinds) {
        const requestId = requestIdFor(kind);
        if (expectation.visible) {
          await assertPreviewVisible(
            browser,
            expectation.role,
            kind,
            requestId,
            expectedTitleFor(kind),
            expectedDocumentRoleFor(kind)
          );
        } else {
          await assertPreviewHidden(browser, expectation.role, kind, requestId);
        }
      }
    }

    await assertMismatchedKindHidden(browser, "developer");

    console.log("Completion report preview E2E");
    console.log(`baseUrl=${baseUrl}`);
    console.log("result=ok");
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("Completion report preview E2E");
  console.error(`baseUrl=${baseUrl}`);
  console.error(`result=fail message=${error instanceof Error ? error.message : "Unknown error"}`);
  if (error instanceof Error && "details" in error) {
    console.error(`details=${JSON.stringify(error.details)}`);
  }
  process.exitCode = 1;
}
