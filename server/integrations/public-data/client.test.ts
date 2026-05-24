import { describe, expect, it } from "vitest";
import {
  buildPublicDataUrl,
  checksumText,
  redactServiceKey
} from "@/server/integrations/public-data/client";

describe("public data api client helpers", () => {
  it("builds a url with service key and query params", () => {
    const url = buildPublicDataUrl({
      endpointUrl: "https://apis.data.go.kr/example/service",
      serviceKey: "test-key",
      params: {
        pageNo: 1,
        numOfRows: 100,
        empty: ""
      }
    });

    expect(url.toString()).toBe("https://apis.data.go.kr/example/service?serviceKey=test-key&pageNo=1&numOfRows=100");
  });

  it("calculates a checksum for raw snapshots", () => {
    expect(checksumText("<response />")).toBe("13c01c6aec93c7c2f50f50cf084bcc15709895c544c62639c29570a3e68ad2cf");
  });

  it("redacts service keys before displaying source urls", () => {
    const url = buildPublicDataUrl({
      endpointUrl: "https://apis.data.go.kr/example/service",
      serviceKey: "secret",
      params: { pageNo: 1 }
    });

    expect(redactServiceKey(url)).toBe("https://apis.data.go.kr/example/service?serviceKey=%5Bredacted%5D&pageNo=1");
  });

  it("supports customs OpenAPI crkyCn key names", () => {
    const url = buildPublicDataUrl({
      endpointUrl: "https://unipass.customs.go.kr:38010/ext/rest/ccctLworCdQry/retrieveCcctLworCd",
      serviceKey: "secret",
      serviceKeyParamName: "crkyCn",
      params: { hsSgn: "3307902000", imexTp: "2" }
    });

    expect(url.searchParams.get("crkyCn")).toBe("secret");
    expect(redactServiceKey(url)).toContain("crkyCn=%5Bredacted%5D");
  });
});
