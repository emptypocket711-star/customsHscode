import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const outputDir = "tmp/pnct-probe";
const targetUrl = "http://www.pnct.co.kr/infoservice/index.html";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function interestingUrl(url) {
  return /\.(do|xfdl|js|xml)(\?|$)/i.test(url) || /container|cntr|C006|menu|infoservice/i.test(url);
}

async function safeScreenshot(page, name) {
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true }).catch(() => {});
}

async function clickText(page, text, timeout = 5000) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: "visible", timeout });
  await locator.click({ timeout });
  return true;
}

async function clickByCoordinate(page, x, y, label) {
  await page.mouse.click(x, y);
  console.log(`clicked coordinate ${label}: ${x},${y}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  userAgent: "Mozilla/5.0 HS Finder PNCT terminal probe"
});

const requests = [];
const responses = [];

page.on("request", (request) => {
  const url = request.url();
  if (interestingUrl(url)) {
    requests.push({
      method: request.method(),
      url,
      postData: request.postData() ?? ""
    });
  }
});

page.on("response", async (response) => {
  const url = response.url();
  if (!interestingUrl(url)) return;
  let bodyPreview = "";
  try {
    const text = await response.text();
    bodyPreview = text.slice(0, 1200);
  } catch {
    bodyPreview = "";
  }
  responses.push({
    status: response.status(),
    url,
    contentType: response.headers()["content-type"] ?? "",
    bodyPreview
  });
});

await mkdir(outputDir, { recursive: true });

try {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(3000);
  await safeScreenshot(page, "01-loaded-3s");

  await sleep(3000);
  await safeScreenshot(page, "02-loaded-6s");

  await clickByCoordinate(page, 952, 126, "notice close");
  await sleep(1200);
  await safeScreenshot(page, "03-notice-closed");

  const bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  await writeFile(`${outputDir}/body-text.txt`, bodyText);

  try {
    await clickText(page, "컨테이너", 4000);
    await sleep(3000);
    await safeScreenshot(page, "04-click-container-text");
  } catch {
    await clickByCoordinate(page, 840, 68, "top container button");
    await sleep(3000);
    await safeScreenshot(page, "04-click-container-coordinate");
  }

  for (const text of ["컨테이너 조회", "컨테이너정보", "컨테이너 정보", "Container"]) {
    try {
      await clickText(page, text, 2500);
      await sleep(3000);
      await safeScreenshot(page, `05-click-${text.replace(/\s+/g, "-")}`);
      break;
    } catch {
      // Try the next visible label.
    }
  }

  await clickByCoordinate(page, 70, 370, "left menu candidate 1");
  await sleep(2500);
  await safeScreenshot(page, "06-left-menu-candidate-1");

  await clickByCoordinate(page, 70, 405, "left menu candidate 2");
  await sleep(2500);
  await safeScreenshot(page, "07-left-menu-candidate-2");

  await sleep(5000);
  await safeScreenshot(page, "08-final");
} finally {
  await writeFile(`${outputDir}/requests.json`, JSON.stringify(requests, null, 2));
  await writeFile(`${outputDir}/responses.json`, JSON.stringify(responses, null, 2));
  await browser.close();
}

console.log(`PNCT probe complete. Requests: ${requests.length}, responses: ${responses.length}`);
console.log(`Output: ${outputDir}`);
