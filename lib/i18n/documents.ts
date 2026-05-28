import { defaultLocale, type AppLocale } from "./locales";

export type DocumentsDictionary = {
  upload: {
    description: string;
    developerDescription: string;
    notReadyBody: string;
    notReadyDescription: string;
    notReadyTitle: string;
    title: string;
  };
};

const dictionaries = {
  "ko-KR": {
    upload: {
      description: "문서 업로드와 자동 추출은 운영 worker와 파일 변환 환경이 준비된 뒤 제공됩니다.",
      developerDescription: "Commercial Invoice, Packing List, B/L 또는 AWB, C/O, 제품 카탈로그와 스펙 문서를 비공개 버킷에 저장하는 흐름으로 확장합니다.",
      notReadyBody: "인보이스, 패킹리스트, B/L·AWB 자동 추출은 private storage, XLS 변환, OCR, background job 구성이 완료된 뒤 사용자 화면에 공개합니다.",
      notReadyDescription: "현재는 HS CODE 조회, 품명 검색, 해외 HS CODE 조회, 예상 납세액 산출 기능을 먼저 제공합니다.",
      notReadyTitle: "문서 업로드 준비 중",
      title: "선적서류 업로드"
    }
  },
  "en-US": {
    upload: {
      description: "Document upload and automated extraction will be provided after the production worker and file conversion environment are ready.",
      developerDescription: "Extends the workflow to store Commercial Invoice, Packing List, B/L or AWB, C/O, product catalog, and specification documents in a private bucket.",
      notReadyBody: "Automated extraction for invoices, packing lists, and B/L or AWB documents will be opened to users after private storage, XLS conversion, OCR, and background jobs are ready.",
      notReadyDescription: "For now, HS code lookup, product-name search, overseas HS lookup, and preliminary duty estimation are provided first.",
      notReadyTitle: "Document upload is being prepared",
      title: "Shipping Document Upload"
    }
  },
  "zh-CN": {
    upload: {
      description: "文档上传和自动提取将在生产worker和文件转换环境准备完成后提供。",
      developerDescription: "将Commercial Invoice、Packing List、B/L或AWB、C/O、产品目录和规格文档保存到私有bucket的流程。",
      notReadyBody: "发票、装箱单、B/L·AWB自动提取将在private storage、XLS转换、OCR和后台任务配置完成后开放给用户。",
      notReadyDescription: "目前优先提供HS CODE查询、品名搜索、海外HS查询和预估税额测算功能。",
      notReadyTitle: "文档上传准备中",
      title: "装运文件上传"
    }
  }
} satisfies Record<AppLocale, DocumentsDictionary>;

export function getDocumentsDictionary(locale: AppLocale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
