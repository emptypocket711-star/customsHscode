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
  });
});
