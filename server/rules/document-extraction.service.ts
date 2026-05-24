import type { DocumentType, ExtractedLineItem } from "@/features/documents/mock-document-data";
import {
  sampleBillOfLadingText,
  sampleCommercialInvoiceText,
  samplePackingListText
} from "@/features/documents/sample-document-text";

export type Evidence = {
  field: string;
  value: string;
  sourceText: string;
  confidenceScore: number;
};

export type NormalizedShipmentDocument = {
  documentType: DocumentType;
  invoiceNo: string | null;
  blNo: string | null;
  seller: string | null;
  buyer: string | null;
  shipper: string | null;
  consignee: string | null;
  incoterms: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  placeOfDelivery: string | null;
  originCountry: string | null;
  destinationCountry: string | null;
  lineItems: ExtractedLineItem[];
  evidence: Evidence[];
  requiredCorrections: string[];
};

const fieldPatterns: Record<string, RegExp[]> = {
  invoiceNo: [
    /(?:invoice|commercial invoice|ci)\s*(?:no|number|#)[:.\s]+([A-Z0-9-]+)/i,
    /(?:invoice|commercial invoice)\s*[:.\s]+([A-Z0-9-]+)/i,
    /(?:송장번호|인보이스\s*번호|상업송장\s*번호)[:.\s]+([A-Z0-9-]+)/i
  ],
  blNo: [
    /(?:b\/l|bl|bill of lading)\s*(?:no|number|#)[:.\s]+([A-Z0-9-]+)/i,
    /(?:awb|air waybill)\s*(?:no|number|#)[:.\s]+([A-Z0-9-]+)/i,
    /(?:선하증권번호|항공화물운송장번호|운송장번호)[:.\s]+([A-Z0-9-]+)/i
  ],
  seller: [/(?:seller|exporter|supplier|manufacturer|판매자|수출자|공급자|제조자)[:.\s]+(.+)/i],
  buyer: [/(?:buyer|sold to|importer|bill to|구매자|수입자|매수인)[:.\s]+(.+)/i],
  shipper: [/(?:shipper|exporter|송하인|수출자)[:.\s]+(.+)/i],
  consignee: [/(?:consignee|ship to|notify party|수하인|수입자|착하통지처)[:.\s]+(.+)/i],
  incoterms: [/(?:incoterms|trade terms|terms of delivery|delivery terms|인코텀즈|인도조건|거래조건)[:.\s]+(.+)/i],
  portOfLoading: [/(?:port of loading|place of loading|loading port|pol|선적항|적재항)[:.\s]+(.+)/i],
  portOfDischarge: [/(?:port of discharge|discharge port|pod|양하항|도착항)[:.\s]+(.+)/i],
  placeOfDelivery: [/(?:place of delivery|final destination|delivery place|최종목적지|인도장소)[:.\s]+(.+)/i],
  originCountry: [/(?:country of origin|origin country|origin|coo|원산지|원산국)[:.\s]+([A-Za-z가-힣][A-Za-z가-힣 ]+|[A-Z]{2})/i],
  destinationCountry: [/(?:destination country|country of destination|final destination country|destination|목적국|도착국)[:.\s]+([A-Za-z가-힣][A-Za-z가-힣 ]+|[A-Z]{2})/i]
};

const countryAliases: Record<string, string> = {
  KOREA: "KR",
  "REPUBLIC OF KOREA": "KR",
  "SOUTH KOREA": "KR",
  CHINA: "CN",
  "PEOPLE'S REPUBLIC OF CHINA": "CN",
  JAPAN: "JP",
  "UNITED STATES": "US",
  USA: "US",
  GERMANY: "DE",
  VIETNAM: "VN",
  "VIET NAM": "VN",
  대한민국: "KR",
  한국: "KR",
  중국: "CN",
  일본: "JP",
  미국: "US",
  독일: "DE",
  베트남: "VN"
};

function normalizeExtractedValue(field: string, value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (field !== "originCountry" && field !== "destinationCountry") return trimmed;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  return countryAliases[upper] ?? trimmed;
}

function firstMatch(text: string, field: string): Evidence | null {
  const patterns = fieldPatterns[field] ?? [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return {
        field,
        value: normalizeExtractedValue(field, match[1]),
        sourceText: match[0].trim(),
        confidenceScore: 0.86
      };
    }
  }

  return null;
}

function detectDocumentType(text: string): DocumentType {
  const normalized = text.toLowerCase();
  if (normalized.includes("air waybill") || normalized.includes("awb no")) return "air_waybill";
  if (normalized.includes("certificate of origin")) return "certificate_of_origin";
  if (normalized.includes("bill of lading") || normalized.includes("b/l no")) return "bill_of_lading";
  if (normalized.includes("packing list")) return "packing_list";
  if (normalized.includes("commercial invoice") || normalized.includes("invoice no")) return "commercial_invoice";
  if (/description|commodity|item\s+description/i.test(normalized) && /qty|quantity/i.test(normalized) && /unit\s+price|amount/i.test(normalized)) {
    return "commercial_invoice";
  }
  return "spec_sheet";
}

function parseMoney(value: string | undefined) {
  if (!value) return { currency: null, amount: null };
  const match = value.match(/([A-Z]{3})?\s*([0-9.,]+)/i);
  return {
    currency: match?.[1]?.toUpperCase() ?? null,
    amount: match?.[2] ? Number(match[2].replace(/,/g, "")) : null
  };
}

type ParsedInvoiceLine = {
  productName: string;
  modelName: string | null;
  quantity: string | undefined;
  unit: string | undefined;
  unitPrice: string | undefined;
  totalAmount: string | undefined;
};

function parseDelimitedInvoiceLine(line: string): ParsedInvoiceLine | null {
  const columns = splitDelimitedLine(line);
  if (columns.length < 5) return null;

  const [productName, modelName, quantity, unit, unitPrice, totalAmount] = columns;
  return {
    productName: productName ?? "",
    modelName: modelName || null,
    quantity,
    unit,
    unitPrice,
    totalAmount
  };
}

function splitDelimitedLine(line: string) {
  if (line.includes("|")) return line.split("|").map((part) => part.trim()).filter(Boolean);
  if (line.includes("\t")) return line.split("\t").map((part) => part.trim()).filter(Boolean);
  if (!line.includes(",")) return [];

  const columns: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      if (current.trim()) columns.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) columns.push(current.trim());
  return columns;
}

function parseFixedWidthInvoiceLine(line: string): ParsedInvoiceLine | null {
  const match = line.match(/^(.+?)\s{2,}([A-Z0-9._/-]+)\s{2,}([0-9.,]+)\s+([A-Z]{1,8})\s{2,}((?:[A-Z]{3}\s*)?[0-9.,]+)\s{2,}((?:[A-Z]{3}\s*)?[0-9.,]+)$/i);
  if (!match) return null;

  return {
    productName: match[1]?.trim() ?? "",
    modelName: match[2]?.trim() ?? null,
    quantity: match[3],
    unit: match[4],
    unitPrice: match[5],
    totalAmount: match[6]
  };
}

function parseInvoiceLine(line: string) {
  if (/description|commodity|item\s+description|qty|quantity|unit\s+price|amount/i.test(line)) return null;
  return parseDelimitedInvoiceLine(line) ?? parseFixedWidthInvoiceLine(line);
}

function parseInvoiceLineItems(text: string, common: Pick<ExtractedLineItem, "originCountry" | "destinationCountry" | "incoterms">): ExtractedLineItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .map(parseInvoiceLine)
    .filter((item): item is ParsedInvoiceLine => Boolean(item))
    .map((item, index) => {
      const unitPriceMoney = parseMoney(item.unitPrice);
      const totalMoney = parseMoney(item.totalAmount);
      return {
        lineNo: index + 1,
        productName: item.productName || "품명 확인 필요",
        modelName: item.modelName,
        originCountry: common.originCountry,
        exportCountry: common.originCountry,
        shipmentCountry: common.originCountry,
        destinationCountry: common.destinationCountry,
        incoterms: common.incoterms,
        quantity: item.quantity ? Number(item.quantity.replace(/,/g, "")) : null,
        unit: item.unit || null,
        unitPrice: unitPriceMoney.amount,
        totalAmount: totalMoney.amount,
        currency: totalMoney.currency ?? unitPriceMoney.currency,
        confidenceScore: item.totalAmount ? 0.79 : 0.68,
        requiredCorrections: ["HSK 후보 선택 필요", "원문 근거 확인 필요"]
      };
    });
}

function parsePackingLineItems(text: string, common: Pick<ExtractedLineItem, "originCountry" | "destinationCountry" | "incoterms">): ExtractedLineItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("/") && !/item\s+description|model|cartons|net weight|gross weight/i.test(line))
    .map((line) => line.split("/").map((part) => part.trim()))
    .filter((columns) => columns.length >= 3)
    .map((columns, index) => {
      const [productName, modelName, packageCount] = columns;
      const packageMatch = packageCount?.match(/([0-9.,]+)\s*([A-Z]+)/i);

      return {
        lineNo: index + 1,
        productName: productName || "품명 확인 필요",
        modelName: modelName || null,
        originCountry: common.originCountry,
        exportCountry: common.originCountry,
        shipmentCountry: common.originCountry,
        destinationCountry: common.destinationCountry,
        incoterms: common.incoterms,
        quantity: packageMatch?.[1] ? Number(packageMatch[1].replace(/,/g, "")) : null,
        unit: packageMatch?.[2] ?? "CTNS",
        unitPrice: null,
        totalAmount: null,
        currency: null,
        confidenceScore: 0.7,
        requiredCorrections: ["Invoice 라인과 품명·모델 대조 필요", "순중량·총중량 확인 필요"]
      };
    });
}

function parsePackingCorrections(text: string): string[] {
  const corrections: string[] = [];
  if (/N\.W\.|Net Weight/i.test(text)) corrections.push("순중량 후보 추출됨: 포장단위별 중량 확인 필요");
  if (/G\.W\.|Gross Weight/i.test(text)) corrections.push("총중량 후보 추출됨: B/L 중량과 대조 필요");
  return corrections;
}

export function extractShipmentDocument(text: string): NormalizedShipmentDocument {
  const documentType = detectDocumentType(text);
  const evidence = Object.keys(fieldPatterns)
    .map((field) => firstMatch(text, field))
    .filter((item): item is Evidence => Boolean(item));
  const values = new Map(evidence.map((item) => [item.field, item.value]));
  const common = {
    originCountry: values.get("originCountry") ?? null,
    destinationCountry: values.get("destinationCountry") ?? null,
    incoterms: values.get("incoterms") ?? null
  };
  const lineItems = documentType === "commercial_invoice"
    ? parseInvoiceLineItems(text, common)
    : documentType === "packing_list"
      ? parsePackingLineItems(text, common)
      : [];
  const requiredCorrections = [
    ...(!values.get("originCountry") ? ["원산지 확인 필요"] : []),
    ...(!values.get("destinationCountry") ? ["목적국 확인 필요"] : []),
    ...(documentType === "packing_list" ? parsePackingCorrections(text) : []),
    ...(documentType === "bill_of_lading" && !values.get("blNo") ? ["B/L 번호 확인 필요"] : [])
  ];

  return {
    documentType,
    invoiceNo: values.get("invoiceNo") ?? null,
    blNo: values.get("blNo") ?? null,
    seller: values.get("seller") ?? null,
    buyer: values.get("buyer") ?? null,
    shipper: values.get("shipper") ?? null,
    consignee: values.get("consignee") ?? null,
    incoterms: values.get("incoterms") ?? null,
    portOfLoading: values.get("portOfLoading") ?? null,
    portOfDischarge: values.get("portOfDischarge") ?? null,
    placeOfDelivery: values.get("placeOfDelivery") ?? null,
    originCountry: values.get("originCountry") ?? null,
    destinationCountry: values.get("destinationCountry") ?? null,
    lineItems,
    evidence,
    requiredCorrections
  };
}

export function getSampleExtractionBundle() {
  return [
    extractShipmentDocument(sampleCommercialInvoiceText),
    extractShipmentDocument(samplePackingListText),
    extractShipmentDocument(sampleBillOfLadingText)
  ];
}

export const documentExtractionInternals = {
  detectDocumentType,
  parseInvoiceLineItems,
  parsePackingLineItems,
  parseMoney
};
