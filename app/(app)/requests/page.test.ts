import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RequestsPage from "@/app/(app)/requests/page";

describe("requests page", () => {
  it("keeps freight and clearance request entrypoints visible", () => {
    const html = renderToStaticMarkup(createElement(RequestsPage));

    expect(html).toContain("요청 시작");
    expect(html).toContain("운송 견적 요청");
    expect(html).toContain("통관 의뢰 요청");
    expect(html).toContain("먼저 준비");
    expect(html).toContain("이후 결과");
    expect(html).toContain("/requests/freight");
    expect(html).toContain("/requests/clearance");
    expect(html).toContain("이미 저장한 요청 확인");
    expect(html).toContain("내 운송 요청");
    expect(html).toContain("내 통관 의뢰");
    expect(html).toContain("/requests/freight?workspace=requester");
    expect(html).toContain("/requests/clearance?workspace=requester");
  });
});
