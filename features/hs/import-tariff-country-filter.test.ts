import { describe, expect, it } from "vitest";
import { DEFAULT_VISIBLE_IMPORT_TARIFF_ROWS, visibleImportTariffRows } from "./import-tariff-country-filter";

describe("visibleImportTariffRows", () => {
  const rows = Array.from({ length: DEFAULT_VISIBLE_IMPORT_TARIFF_ROWS + 3 }, (_, index) => index + 1);

  it("shows only the default leading rows before expansion", () => {
    expect(visibleImportTariffRows(rows, false)).toEqual(rows.slice(0, DEFAULT_VISIBLE_IMPORT_TARIFF_ROWS));
  });

  it("keeps all rows when expanded", () => {
    expect(visibleImportTariffRows(rows, true)).toEqual(rows);
  });
});
