import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  PartnerVisibleDocumentNotice,
  ServiceRequestDocumentVisibilityGuide
} from "@/features/service-requests/service-request-document-visibility-guide";

describe("ServiceRequestDocumentVisibilityGuide", () => {
  it("renders freight-specific visibility guidance", () => {
    const html = renderToStaticMarkup(createElement(ServiceRequestDocumentVisibilityGuide, { kind: "freight" }));

    expect(html).toContain("공개 범위 선택 기준");
    expect(html).toContain("매칭된 포워더에게 공개");
    expect(html).toContain("선정된 포워더에게만 공개");
    expect(html).toContain("민감 서류 보호");
  });

  it("renders clearance-specific visibility guidance", () => {
    const html = renderToStaticMarkup(createElement(ServiceRequestDocumentVisibilityGuide, { kind: "clearance" }));

    expect(html).toContain("매칭된 관세사무소에게 공개");
    expect(html).toContain("선정된 관세사무소에게만 공개");
    expect(html).toContain("통관 수수료와 필요서류 산정");
  });

  it("explains partner-visible document filtering", () => {
    const freightHtml = renderToStaticMarkup(createElement(PartnerVisibleDocumentNotice, { kind: "freight" }));
    const clearanceHtml = renderToStaticMarkup(createElement(PartnerVisibleDocumentNotice, { kind: "clearance" }));

    expect(freightHtml).toContain("화주가 포워더에게 공개한 서류만 표시");
    expect(clearanceHtml).toContain("화주가 관세사무소에게 공개한 서류만 표시");
    expect(clearanceHtml).toContain("비공개 또는 운영자 전용 서류는 보이지 않");
  });
});
