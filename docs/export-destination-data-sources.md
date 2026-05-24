# 수출상대국 HS/관세율/수입요건 데이터 소스 조사

작성일: 2026-05-23

## 목적

수출 모드에서 한국 HSK를 기준으로 상대국 수입 HS CODE, 관세율, 상대국 수입요건을 표시하기 위한 데이터 확보 방안을 정리한다.

## 원칙

- 관세율과 수입요건은 별도 데이터로 관리한다.
- 국가별 HS CODE는 6자리 이후 체계가 다르므로 한국 HSK 10자리와 직접 동일하다고 보지 않는다.
- 우선 한국 관세청 국가별 관세율표를 기반으로 상대국 HS/관세율을 표시한다.
- 상대국 수입요건은 공식 포털, 법령, 통제목록, 기관별 요건 DB를 별도 파이프라인으로 수집한다.
- 모든 행은 source_name, source_url, source_version, effective_from, retrieved_at, checksum을 가진다.

## 1차 국가별 확인

| 국가 | 상대국 HS/관세율 | 수입요건/규제 | 수집 난이도 | 우선순위 |
| --- | --- | --- | --- | --- |
| 미국 | USITC HTS REST/JSON 및 HTS Archive | FDA FD Flags, USDA/APHIS, CPSC, CBP ACE 관련 PGA flags | 중 | 높음 |
| EU/독일/프랑스 | TARIC, Access2Markets | TARIC measures, Access2Markets product requirements | 중-상 | 높음 |
| 영국 | GOV.UK Trade Tariff API | HMRC API의 import/export controls, measures, VAT | 낮음 | 높음 |
| 일본 | Japan Customs tariff schedule 다운로드 | Japan Customs Customs Answer, 식품/검역 등 부처별 자료 | 중 | 중 |
| 캐나다 | CBSA Customs Tariff 파일 | CFIA AIRS, Global Affairs import controls | 중 | 중 |
| 호주 | ABF Working Tariff | BICON tariff code search로 biosecurity import conditions | 중 | 중 |
| 방글라데시 | Bangladesh Customs Import Export Hub | 동일 Hub에서 HS별 required documents, compliances, duties and taxes 표시 | 낮음-중 | 높음 |
| 스리랑카 | Sri Lanka Customs tariff ZIP | Consolidated Import Control List PDF, SCL, standards list | 중 | 중 |
| 남아공 | SARS Tariff Book | SARS prohibited/restricted list, ITAC import control lines | 중 | 중 |
| 아랍에미리트 | Dubai Customs Integrated Customs Tariff, 관세청 국가별 관세율표 | Dubai Customs restricted goods, FTA VAT, TDRA, MOCCAE, MOHAP, MoIAT | 중 | 중 |
| 스위스 | BAZG, 관세청 국가별 관세율표 | BAZG import VAT, FSVO, Swissmedic, BAKOM | 중 | 중 |
| 노르웨이 | Tolletaten, 관세청 국가별 관세율표 | Tolletaten import guide, Mattilsynet, DMP, Nkom | 중 | 중 |
| 아이슬란드 | Skatturinn/Iceland Revenue and Customs, 관세청 국가별 관세율표 | MAST, Icelandic Medicines Agency, Fjarskiptastofa | 중 | 중 |
| 칠레 | Servicio Nacional de Aduanas, 관세청 국가별 관세율표 | SII IVA, SAG, ISP, SUBTEL | 중 | 중 |
| 콜롬비아 | DIAN Consulta Arancel Aduanas, 관세청 국가별 관세율표 | DIAN IVA, ICA, INVIMA, MinTIC/CRC | 중 | 중 |
| 코스타리카 | Hacienda ArancelNet/TICA, 관세청 국가별 관세율표 | Hacienda IVA, SENASA, Ministerio de Salud, SUTEL, MEIC | 중 | 중 |
| 파나마 | Autoridad Nacional de Aduanas Arancel Interactivo, 관세청 국가별 관세율표 | DGI ITBMS, APA, MIDA, MINSA, ASEP | 중 | 중 |
| 온두라스 | Administración Aduanera de Honduras, 관세청 국가별 관세율표 | SAR ISV, SENASA, ARSA, CONATEL | 중 | 중 |
| 니카라과 | Dirección General de Servicios Aduaneros, 관세청 국가별 관세율표 | DGI IVA, IPSA, MINSA, TELCOR | 중 | 중 |
| 엘살바도르 | Dirección General de Aduanas SAC, 관세청 국가별 관세율표 | Ministerio de Hacienda IVA, MAG, DNM, SIGET | 중 | 중 |
| 브라질 | Receita Federal NCM, 관세청 국가별 관세율표 | Receita Federal PIS/COFINS/IPI/ICMS, Siscomex, MAPA, ANVISA, ANATEL | 중 | 중 |
| 이스라엘 | Israel Tax Authority customs tariff, 관세청 국가별 관세율표 | Israel VAT, Ministry of Health, Ministry of Communications | 중 | 중 |
| 우즈베키스탄 | Uzbekistan customs tariff, 관세청 국가별 관세율표 | Uzbekistan VAT, Veterinary Committee, Uzpharmagency, Ministry of Digital Technologies | 중 | 중 |
| 페루 | SUNAT Aduanas, 관세청 국가별 관세율표 | SUNAT IGV, SENASA, DIGEMID, MTC | 중 | 중 |
| 인도 | DGFT ITC-HS Import Policy, ICEGATE/DGFT 자료 | DGFT import policy, BIS/FSSAI/Plant quarantine 등 분산 | 상 | 중 |
| 태국 | Thai Customs/TNTR AHTN 기반 tariff | TNTR/Thai Customs import controls, TISI 등 분산 | 상 | 중 |
| 인도네시아 | INSW/BTKI | INSW Indonesia National Trade Repository 요건 | 상 | 중 |
| 중국 | 관세청 국가별 관세율표 2025, 中华人民共和国进出口税则（2026）, GACC 세율조회 | GACC Single Window, 监管事项目录清单, CIQ/GB standards 등 분산 | 상 | 높음 |
| 베트남 | Vietnam Customs tariff 법령/관세표, 기존 관세청 국가별 관세율표 | 전문검사/수입허가 부처별 분산 | 상 | 중 |
| 멕시코 | LIGIE/SNICE tariff 자료, 기존 관세청 국가별 관세율표 | NOM, permisos previos 등 HS별 연결 필요 | 상 | 중 |
| 라오스 | AHTN 기반 관세표, 기존 관세청 국가별 관세율표 | 수입허가/검역 정보 분산 | 상 | 낮음 |
| 몽골 | 관세율법/관세청 자료, 기존 관세청 국가별 관세율표 | 수입허가/검역 정보 분산 | 상 | 낮음 |

## 구현 우선순위

### 1단계: 이미 가진 관세청 국가별 관세율표 확장

- 대상 테이블: `export_destination_tariff_rates`
- 현재 기능을 강화한다.
- 한국 HSK 10자리 조회 시 상대국 HS 후보를 20개 이상 표시한다.
- 6자리/4자리 조회에서도 국가별 상대국 HS 후보를 묶어서 보여준다.
- 국가별 HS가 정확히 6자리만 일치한 경우와 8~10자리까지 일치한 경우를 구분 표시한다.

### 2단계: 공식 API/구조화 데이터 우선 수집

우선 적용 국가:

1. 영국: HMRC Trade Tariff API
2. 미국: USITC HTS JSON + FDA FD Flags
3. 방글라데시: Import Export Hub
4. EU: TARIC/Access2Markets
5. 호주: BICON + ABF tariff

### 3단계: 상대국 수입요건 정규화 테이블 추가

추가 테이블:

```text
export_destination_import_requirements
  id
  country_code
  destination_hs_code
  requirement_type
  requirement_name
  agency
  legal_basis
  procedure_summary
  required_documents jsonb
  source_name
  source_url
  source_version
  effective_from
  effective_to
  published_at
  retrieved_at
  status
  checksum

export_destination_internal_taxes
  id
  country_code
  destination_hs_code
  tax_type
  tax_name
  rate_text
  basis
  notes
  source_name
  source_url
  source_version
  effective_from
  effective_to
  published_at
  retrieved_at
  status
  checksum

export_destination_data_sources
  id
  country_code
  data_category
  source_name
  source_url
  source_version
  access_method
  connector_status
  notes
  published_at
  retrieved_at
  status
  checksum
```

현재 `20260523060000_export_destination_import_data.sql` 마이그레이션으로 위 테이블을 추가했다.
`export_destination_data_sources_seed.sql`은 우선 수집 대상 출처를 레지스트리로 적재한다.

초기 레지스트리 대상:

- 중국: 관세청 국가별 관세율표 2025, 中华人民共和国进出口税则（2026）, GACC 세율조회, China Single Window/GACC public services, NMPA 화장품 등록·비안/라벨 규정, 중국 멸종위기종 수출입 관리 조례
- 영국: GOV.UK Trade Tariff API
- 미국: USITC HTS REST API
- 방글라데시: Bangladesh Customs Import Export Hub
- EU: TARIC / Access2Markets
- 호주: ABF Working Tariff / BICON
- 캐나다: CFIA AIRS
- 일본: Japan Customs Tariff Schedule 2026.04.01
- 인도: DGFT ITC(HS) Import Policy

## 중국 1차 상태

- 현재 조회 가능 데이터: `export_destination_tariff_rates`에 `CHN` 2025년 자료 25,243건 적재.
- 2026 공식 원문: `中华人民共和国进出口税则（2026）` PDF 확인 및 `data/external/china/china-import-export-tariff-2026.pdf`에 다운로드.
- 2026 중국 관세율 1차 매핑:
  - `scripts/generate_china_2026_tariff_seed.py`가 PDF 좌표 기반으로 수입세칙 표를 파싱한다.
  - `supabase/seed/generated/china_2026_import_tariff_seed.sql`에 `country_code='CHN'`, `tariff_year=2026`, `source_version='china-import-export-tariff-2026'` 기준 8,972건을 생성한다.
  - 중국 공식 2026 세칙의 수입 관세표는 8자리 세번 구조다. 10자리 신고상품번호는 별도 GACC 통관 파라미터/비전세목 첨부자료로 보강한다.
  - 로컬 DB에서는 2026년 기준 조회가 2026 세칙을 우선 사용하도록 기존 `customs-country-tariff-20251231:CHN` 행의 `effective_to`를 `2025-12-31`로 닫았다.
- 2026 내국세 1차 매핑:
  - `export_destination_internal_taxes`에 `china-import-export-tariff-2026` 현재 유효 HS 기준 수입 부가가치세 기본 13% 행을 적재.
  - 현재 로컬 커버리지 기준 `CHN`은 관세 8,972개 HS, 내국세 8,972개 HS, 수입요건 1,780건이다.
  - GACC 2026년 제15호의 9% 수입단계 부가가치세 비전세목 70개 상품번호를 9%로 우선 매핑.
  - GACC 2025년 제260호 첨부2의 항암/희귀병 의약품 48개 상품번호를 3%로 우선 매핑.
  - 같은 첨부2의 추가 VAT 특례 대상 8개, 소비세 정책 대상 5개는 세율을 임의 산정하지 않고 정책 대상 행으로 매핑.
  - 생성 스크립트: `scripts/generate_china_internal_tax_seed.py`
  - 생성 시드: `supabase/seed/generated/china_2026_import_internal_tax_seed.sql`
- 화면 표기: 상대국 HS/관세율 표와 상세 팝업에서 `자료연도`로 표시. 중국은 2026년 기준 조회 시 2026 세칙 행을 우선 표시한다.
- 공식 조회 후보:
  - 중국 해관총서 세율조회: `https://online.customs.gov.cn/ociswebserver/pages/jckspsl/index.html`
  - 중국 해관총서 “我要查” 서비스 목록: `https://online.customs.gov.cn/mySearch/`
  - 중국 재정부 2026 세칙 PDF: `https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/P020251231607833453633.pdf`
  - 중국 VAT 법/시행령 안내: `https://www.chinatax.gov.cn/eng/c101269/c5246628/content.html`
  - 재정부/세무총국 2026년 제9호 9% VAT 범위 공고: `https://www.mof.gov.cn/jrttts/202602/t20260203_3983174.htm`
  - 해관총서 2026년 제15호 9% 수입단계 VAT 비전세목 상품번호표: `http://www.customs.gov.cn/customs/2026-02/03/article_2026020318010783852.html`
  - 해관총서 2025년 제260호 첨부2 수입단계 VAT/소비세 정책 상품번호표: `http://www.customs.gov.cn/customs/2025-12/31/article_2025123118010783852.html`
- 다음 수집 과제:
  - 중국 공식 조회 화면의 요청 파라미터와 응답 구조 확인. 이 단계에서 10자리 통관상품번호, 잠정세율, 수입 VAT/소비세 상세를 보강한다.
  - 수입요건은 세율표 하나로 끝나지 않으므로 감독사항목록, 검사검역, 식품/화장품/전기전자 등 품목별 기관 자료를 별도로 연결.
  - 소비세는 품목 대상 코드와 세율표가 분리되어 있으므로, 전체 소비세 세율표를 별도 공식 원천에서 구조화한 뒤 `consumption_tax_policy` 행을 실제 세율 행으로 보강.
- 3304 화장품 수입요건 1차 매핑:
  - `export_destination_import_requirements`에 중국 `3304` 공통 요건 3건을 적재.
  - 공통 요건은 NMPA 화장품 등록/비안, 등록·비안 자료 제출, 중문 라벨 표시로 분리.
  - `export_destination_customs_codes`의 3304 계열 10자리 신고상품번호 중 `멸종` 성분 명칭이 있는 코드에는 멸종위기 야생동식물 성분 허가서 요건을 추가.
  - 생성 시드: `supabase/seed/generated/china_3304_cosmetics_import_requirements_seed.sql`
  - 공식 출처:
    - NMPA 화장품 등록·비안 규정: `https://english.nmpa.gov.cn/2022-06/30/c_961747.htm`
    - NMPA 등록·비안 자료 규칙: `https://english.nmpa.gov.cn/2021-03/04/c_661069.htm`
    - NMPA 화장품 라벨 관리: `https://english.nmpa.gov.cn/2021-06/03/c_644360.htm`
    - 중국 멸종위기 야생동식물 수출입 관리 조례: `https://www.gov.cn/gongbao/content/2019/content_5468888.htm`
- 멸종위기종 성분 수입요건 일반화:
  - `export_destination_customs_codes`의 전체 중국 10자리 신고상품번호 중 명칭에 `멸종` 조건이 있는 655개 코드에 멸종위기 야생동식물 성분 허가서 요건을 적재.
  - 생성 시드: `supabase/seed/generated/china_cites_import_requirements_seed.sql`
  - 공식 출처: `https://www.gov.cn/gongbao/content/2019/content_5468888.htm`
- 가공식품·음료 수입요건 1차 매핑:
  - 중국 2026 세칙 기준 HS 16, 19, 20, 21, 22류의 4자리 heading 34개에 공통 수입요건을 적재.
  - 수입식품 해외생산기업 등록은 기준일에 따라 248호령 또는 280호령이 조회되도록 effective date를 분리.
    - 248호령: `2022-01-01`부터 `2026-05-31`까지
    - 280호령: `2026-06-01`부터
  - 수입식품 안전관리·검사는 249호령 기준으로 `2022-01-01`부터 적용.
  - 생성 시드: `supabase/seed/generated/china_processed_food_import_requirements_seed.sql`
  - 공식 출처:
    - 248호령: `https://www.gov.cn/gongbao/content/2021/content_5616161.htm`
    - 280호령: `https://www.gov.cn/gongbao/2025/issue_12426/202511/content_7049741.html`
    - 249호령: `https://www.gov.cn/gongbao/content/2021/content_5621202.htm`
- 전기전자·조명 CCC 수입요건 1차 매핑:
  - 중국 2026 세칙 8자리 기준으로 CCC 가능성이 높은 114개 세번에 `중국 CCC 강제제품인증` 요건을 적재.
  - 대상 범위는 에어컨, 냉장·냉동고, 세탁기, 전원공급장치, 리튬이온축전지, 전열기기, TV/모니터, 스위치·차단기·소켓, 전선·케이블, 조명기기 일부다.
  - 생성 시드: `supabase/seed/generated/china_electrical_ccc_import_requirements_seed.sql`
  - 공식 출처: `https://www.samr.gov.cn/cms_files/filemanager/samr/www/samrnew/samrgkml/nsjg/rzjgs/202004/W020200428419284306124.pdf`
- 배터리·자동차부품·목재/식물 검역 수입요건 1차 매핑:
  - 중국 2026 세칙 기준 리튬이온 배터리·전원제품, 자동차·부품, 목재·목제품, 식물·종자·묘목 계열 HS4에 후보 요건을 적재.
  - 배터리는 SAMR 2023년 리튬이온전지·배터리팩 CCC 공고를 별도 출처로 둔다.
  - 자동차·부품은 CCC 카탈로그를 기준으로 안전부품, 타이어, 안전유리, 좌석 등 후보군을 표시한다.
  - 목재·목제품 및 식물류는 중국 동식물검역법과 GACC 검역 감독 안내를 기준으로 검역증명, 훈증/열처리, 수종/학명 자료 후보를 표시한다.
  - 생성 스크립트: `scripts/generate_china_additional_industrial_requirements_seed.py`
  - 생성 시드: `supabase/seed/generated/china_additional_industrial_import_requirements_seed.sql`
  - 공식 출처:
    - SAMR 리튬이온 배터리 CCC 공고: `https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/rzjgs/art/2023/art_ad15150414fe40d3807857910bff7118.html`
    - SAMR/CNCA CCC 카탈로그: `https://www.samr.gov.cn/cms_files/filemanager/samr/www/samrnew/samrgkml/nsjg/rzjgs/202004/W020200428419284306124.pdf`
    - GACC 동식물검역 감독 안내: `https://english.customs.gov.cn/inspection/html/animal.html`
    - 중국 동식물검역법: `https://www.npc.gov.cn/zgrdw/englishnpc/Law/2007-12/12/content_1383874.htm`
- 의약품·의료기기 수입요건 1차 매핑:
  - 중국 2026 세칙 기준 의약품성 세번 80개에 `중국 의약품 등록·수입 승인`과 `중국 수입 의약품 항구 신고` 요건을 적재.
  - `3005`, `3006` 일부 및 `9018~9022` 의료기기성 세번 67개에 `중국 의료기기 등록·비안` 요건을 적재.
  - 생성 시드: `supabase/seed/generated/china_pharma_medical_import_requirements_seed.sql`
  - 공식 출처:
    - NMPA 의약품 등록 규정: `https://english.nmpa.gov.cn/2022-06/30/c_785628.htm`
    - 중국 약품관리법 수입 항구 신고: `https://english.nmpa.gov.cn/2019-09/26/c_773012_2.htm`
    - NMPA 의료기기 등록·비안 규정: `https://english.nmpa.gov.cn/2024-06/05/c_1049323.htm`
- 화학제품 수입요건 1차 매핑:
  - 중국 2026 세칙 기준 `28/29/38`류 일부에 위험화학품, ODS/HFC, 농약, 폐기물 요건을 분리 적재.
  - 적재 건수:
    - 위험화학품 등록·검사: 52개 세번
    - 오존층파괴물질·HFC 수입허가: 28개 세번
    - 농약 등록·수입관리: 19개 세번
    - 폐기물 수입규제: 9개 세번
  - 생성 시드: `supabase/seed/generated/china_chemical_import_requirements_seed.sql`
  - 공식 출처:
    - 위험화학품 등록 시스템: `https://whpdj.mem.gov.cn/`
    - ODS/HFC 수입허가 목록: `https://fta.mofcom.gov.cn/english/mywj/mywj_301.pdf`
    - 농약관리: `http://www.moa.gov.cn/ztzl/nybrl/nygl/`
    - 고체폐기물 수입규제: `https://english.mee.gov.cn/`
- 섬유·의류 수입요건 1차 매핑:
  - 중국 2026 세칙 기준 61/62류 의류 287개 세번에 `중국 섬유제품 기본 안전기술규범`과 `중국 의류·섬유제품 표시사항` 요건을 적재.
  - 중국 10자리 신고상품번호 명칭에 어린이·유아 조건이 있는 6개 코드에 `중국 영유아·아동 섬유제품 안전기술규범` 요건을 적재.
  - 생성 시드: `supabase/seed/generated/china_textile_apparel_import_requirements_seed.sql`
  - 공식/표준 출처:
    - GB 18401: `https://www.codeofchina.com/standard/GB18401-2010.html`
    - GB 5296.4: `https://www.codeofchina.com/standard/GB5296.4-2012.html`
    - GB 31701: `https://www.chinesestandard.net/PDF.aspx/GB31701-2015`

## 영국 1차 상태

- 공식 API: GOV.UK Trade Tariff API `https://www.trade-tariff.service.gov.uk/uk/api`
- 생성 스크립트: `scripts/generate_uk_trade_tariff_seed.py`
- 생성 시드: `supabase/seed/generated/uk_trade_tariff_api_seed.sql`
- 현재 범위:
  - 선택한 한국 HS6 prefix를 영국 10자리 commodity endpoint로 펼친 뒤 영국 목적국 관세율, preference rate, VAT, import control measure를 적재한다.
  - 현재 로컬 적재 prefix는 `330410`, `330499`, `340130`, `420229`, `850760`, `440711`, `610910`, `190590`, `300490`, `901890`, `851650`, `852872`.
  - API VAT measure가 있는 품목은 HMRC 행을 우선 사용하고, 나머지 영국 관세 행은 GOV.UK VAT rates 기준 표준 VAT 20% 후보를 채운다.
  - 현재 로컬 커버리지 기준 `GBR`은 관세 21,861개 HS, 내국세 21,861개 HS, 수입통제 요건 76건이다.
  - commodity endpoint가 없는 6자리 prefix는 search/subheading endpoint에서 실제 declarable commodity 후보를 찾아 재호출한다.
  - 추가 코드는 `UK_TRADE_TARIFF_CODES=code1,code2` 환경변수로 지정한다.
- 적재 테이블:
  - `export_destination_tariff_rates`: third country duty와 tariff preference measure.
  - `export_destination_internal_taxes`: HMRC VAT measure와 GOV.UK standard VAT fallback.
  - `export_destination_import_requirements`: import control measure.
- 적용 방식:
  - `source_version='hmrc-trade-tariff-api-20260523'` 및 하위 `:vat`, `:import-controls` 버전으로 관리한다.
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_UK_TRADE_TARIFF_API=1` 기본값으로 함께 적용한다.
  - import control measure의 `measure_condition`을 읽어 문서코드, 조건 구분, action, CDS guidance를 `procedure_summary`와 `required_documents`에 반영한다.
  - 예: CITES measure는 `C400` CITES certificate와 `Y900` CITES 비대상 선언 조건을 상세에 함께 표시한다.
- 다음 보강:
  - 수출 조회에서 자주 등장하는 HS6 prefix 목록을 더 넓혀 commodity 후보를 확장 수집한다.
  - 상세 조건이 긴 경우 화면에서 조건/문서코드/신고안내를 접이식 섹션으로 분리한다.

## 일본 1차 상태

- 공식 관세표: `https://www.customs.go.jp/english/tariff/2026_04_01/index.htm`
- 공식 chapter HTML 예시: `https://www.customs.go.jp/english/tariff/2026_04_01/data/e_33.htm`
- 생성 스크립트: `scripts/generate_japan_customs_tariff_seed.py`
- 생성 시드: `supabase/seed/generated/japan_customs_tariff_seed.sql`
- 현재 버전: Japan Customs tariff schedule `2026-04-01`
- 현재 범위:
  - 1~97류 중 77류를 제외한 전체 chapter HTML을 파싱한다.
  - 생성 결과는 일본 9자리 통계부호 기준 9,651건이다.
  - `H.S.code`와 일본 통계 suffix를 결합해 `3304.10` + `000` -> `330410000` 형태로 저장한다.
  - General 세율은 `base_rate_text`로 저장하고, WTO/GSP/LDC/EPA 컬럼은 `agreement_rates`에 저장한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_japan_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/japan_import_data_seed.sql`
  - `export_destination_internal_taxes`에 일본 목적국 HS별 수입 소비세 9,643건을 적재한다.
  - Japan Customs 소비세 안내 기준으로 표준세율 10%, 음식료품 후보 8%를 구분한다.
  - 주세, 담배세 등 개별 품목세는 별도 공식 자료 확보 전까지 임의 산정하지 않는다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 일본 품목군별 수입요건 450건을 적재한다.
  - 식품위생법, 식물검역, 동물검역, 전기용품안전법 PSE, 약기법/의료기기, 화장품·의약외품, 화학물질, 소비제품 안전 후보를 HS4 기준으로 매핑한다.
  - HS만으로 대상 여부를 확정하지 않고, 상세 팝업에서 성분, 용도, 정격, 가공상태 등 확인 포인트를 표시한다.
- 화면 표시:
  - 수출 목적국을 일본으로 선택하면 일본 기준 HS/품명/관세율을 별도 결과로 표시한다.
  - 원산지가 한국이면 `Korea(RCEP)` 컬럼을 `RCEP(한국)`으로 표시한다.
  - 중국, 호주, CPTPP 대상국 등 다른 원산지를 선택하면 해당 일본 EPA/RCEP/CPTPP 컬럼만 좁혀 표시한다.
  - 상세 화면의 복사 버튼은 목적국 HS, 기본세율, 협정세율, 추가관세/AD-CVD 후보, 내국세, 수입요건을 복사한다.
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_JAPAN_CUSTOMS_TARIFF=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_JAPAN_CUSTOMS_TARIFF=1`을 지정한다.
  - 일본 내국세·수입요건은 `APPLY_JAPAN_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_JAPAN_IMPORT_DATA=1`을 지정한다.
  - 일부 chapter만 검증할 때는 `JAPAN_CUSTOMS_TARIFF_CHAPTERS=33,85`처럼 범위를 제한한다.
- 다음 보강:
  - 일본 주세, 담배세, 석유석탄세 등 개별 품목세는 별도 공식 세율표를 확보한 뒤 `export_destination_internal_taxes`에 분리 적재한다.
  - 수입요건은 실제 permit/inspection DB 또는 별표성 자료가 확보되면 HS4 후보 매핑에서 HS9/품목조건 매핑으로 좁힌다.
  - EU는 TARIC 또는 Access2Markets 구조화 접근 확인 후 다음 국가 커넥터로 진행한다.

## 미국 1차 상태

- 공식 HTS 사이트: `https://hts.usitc.gov/`
- 공식 REST base URL: `https://hts.usitc.gov/reststop`
- 공식 가이드: `https://www.usitc.gov/documents/hts_external_guide.pdf`
- 현재 버전: USITC HTS 화면 기준 `2026 HTS Revision 7`.
- 생성 스크립트: `scripts/generate_usitc_hts_seed.py`
- 생성 시드: `supabase/seed/generated/usitc_hts_seed.sql`
- 추가관세 생성 시드: `supabase/seed/generated/us_chapter99_additional_tariffs_seed.sql`
- 현재 범위:
  - 파일럿 heading은 `3004`, `3304`, `4202`, `7308`, `7616`, `8415`, `8507`, `8516`, `8528`, `8544`, `8708`, `9018`이다.
  - 추가 heading은 `USITC_HTS_PREFIXES=3304,4202` 환경변수로 지정한다.
  - 한국 HS 마스터의 HS4 전체를 기준으로 확장할 때는 `USITC_HTS_PREFIX_MODE=korea-hs4 python3 scripts/generate_usitc_hts_seed.py`를 사용한다.
  - 단계별 확장 검증은 `USITC_HTS_MAX_PREFIXES=50`으로 수집 개수를 제한하거나 `USITC_HTS_PREFIX_FILE=/path/to/prefixes.txt`로 대상 HS4 파일을 지정한다.
  - 수집 응답은 기본적으로 `data/cache/usitc/exportList`에 캐시한다. 캐시를 끄려면 `USITC_HTS_CACHE=0`을 지정한다.
  - 생성 결과를 임시 파일로 검증할 때는 `USITC_HTS_OUTPUT=/tmp/usitc.sql USITC_CHAPTER99_OUTPUT=/tmp/us_ch99.sql`처럼 출력 경로를 바꾼다.
- 매핑 방식:
  - `general`은 `base_rate_text`로 저장한다.
  - `special`은 `agreement_rates["Special / preferential duty"]`로 저장한다.
  - `other`는 `agreement_rates["Column 2 duty"]`로 저장한다.
  - HTS footnote의 `9903.xx.xx` Chapter 99 참조는 같은 USITC REST API에서 원문 행을 다시 조회해 `export_destination_additional_tariffs`에 별도 저장한다.
  - 예: `3304.10.0000`의 `9903.88.03` 참조는 `미국 추가관세 후보 9903.88.03 (중국산 Section 301): 기본세율 + 25%`로 표시한다.
  - `4202.29.2000`의 `9903.90.08` 참조처럼 세율이 `other` 칸에만 내려오는 러시아산 추가관세도 별도 행으로 저장한다.
  - `7308`, `8544`, `8507`, `8708` 등 추가 heading에서 `9903.88.02`, `9903.90.09`, `9903.91.01`, `9903.91.06` 등 추가 Chapter 99 후보를 포착한다.
  - `72/73/74/76`류로 수집된 8자리 이상 금속류에는 `9903.82.02` Section 232 금속 추가관세 후보를 조건부로 붙인다. 원산지 공통 후보이며, U.S. note 16, 금속 함량, 파생품 범위, `9903.82.01`, `9903.82.03` 등 예외 확인이 필요하다.
  - `condition_summary`는 사용자 화면용 한국어 조건 요약으로 저장하고, USITC 원문 조건은 `notes`에 남긴다.
  - `legal_basis`는 `HTS Chapter 99`와 원문에서 추출한 `U.S. note` 번호를 함께 저장한다.
  - 현재 생성 결과는 USITC 2026 Revision 7 기준 미국 관세율 26,118건, Chapter 99 추가관세 후보 13,146건이다.
  - 10자리 통계 suffix 행의 세율이 비어 있으면 가까운 상위 8자리 법정 subheading 세율을 상속한다.
- 화면 표시:
  - 미국 수출 목적국 조회에서는 USITC 2026 Revision 7 행을 우선 사용한다. 기존 관세청 국가별 관세율표 USA 행은 `2026-04-28`까지의 과거 스냅샷으로 닫는다.
  - 조회 화면에 원산지 콤보박스를 추가하고, Chapter 99/Section 301 후보는 협정세율과 분리해 `추가관세` 칸에 표시한다.
  - 추가관세 항목은 `조건부` 또는 `조건 확인` 배지로 표시하고, 클릭하면 Chapter 99 코드, 원산지, 세율, 한국어 조건 요약, 근거, USITC 원문 메모를 팝업으로 확인할 수 있다.
  - 원산지가 지정되면 원산지 조건이 맞는 추가관세와 공통 추가관세만 표시한다.
- AD/CVD 연결 후보:
  - CBP ACE ES-105 Active Case report: `https://www.cbp.gov/trade/priority-issues/adcvd/data`
  - CBP AD/CVD public case search: `https://trade.cbp.dhs.gov/ace/adcvd/adcvd-public/`
  - ACE CATAIR AD/CVD Case Information Query 문서: `https://www.cbp.gov/document/guidance/ace-catair-adcvd-case-information-query`
  - AD/CVD는 HTS 일반 관세가 아니며, HTS 번호는 편의상 참조값이고 실제 적용은 사건 범위(scope), 원산지, 생산자/수출자, Commerce/CBP 지시가 좌우한다.
  - 적재 대상 테이블은 `export_destination_trade_remedy_cases`이다. 목적국 HS, 원산지, 사건번호, 사건명, 생산자/수출자, 세율, scope 요약, 근거, 출처 버전을 분리해 저장한다.
  - 조회 화면에는 일반 추가관세와 별도인 `AD/CVD` 칸으로 표시한다. 데이터가 들어오면 HS/원산지 기준 후보 사건만 노출하고, 없는 경우 표시하지 않는다.
  - 2026-05-23 확인 시 data.gov의 `CBP Active Dumping and Active Countervailing (AD/CVD) Cases` 레코드는 메타데이터만 있고 다운로드 리소스가 노출되지 않는다. CBP 공개 검색 앱의 case endpoint는 세션/로그인 흐름이 필요하므로, 실제 대량 적재는 ACE ES-105 리포트 파일 확보 또는 공식 API 접근 확인 후 진행한다.
  - 파일을 확보하면 다음 명령으로 시드를 생성한다.
    - `python3 scripts/generate_us_adcvd_trade_remedy_seed.py /path/to/ACE_ES105.csv`
    - 기본 출력: `supabase/seed/generated/us_adcvd_trade_remedy_cases_seed.sql`
    - 지원 형식: CSV, XLSX
    - 자동 인식 컬럼: `Case Number`, `Tariff Number`, `ISO Country Code`, `Short Description`, `Rate`, `Company/Producer/Exporter`, `Scope`
  - `scripts/apply_lookup_seed_bundle.sh`는 `us_adcvd_trade_remedy_cases_seed.sql`이 존재하면 자동 적용하고 `us-cbp-adcvd-active-cases-*` source version을 publish한다.
- 다음 보강:
  - Section 232 금속계 추가관세는 현재 금속류 후보를 표시하는 1차 단계다. 다음 단계에서는 US Note 16, Annex, 금속 함량 조건을 별도 구조화해 과다 표시를 줄인다.
  - AD/CVD 원천 파일을 확보하면 `export_destination_trade_remedy_cases` 시드 생성기를 추가한다.
  - 원산지별 추가관세 적용 제외는 별도 구조화 테이블로 분리한다.
  - 전체 HTS는 heading 범위를 확장해서 단계적으로 수집한다.

## 미국 수입요건 1차 상태

- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_us_internal_tax_seed.py`
  - 생성 시드: `supabase/seed/generated/us_internal_tax_seed.sql`
  - `export_destination_internal_taxes`에 미국 HTS별 `수입 VAT 없음`, `주·지방 Sales/Use Tax 주별` 후보를 적재한다.
  - 주류, 담배류, 연료·석유제품, 차량·타이어, 총기·탄약류는 HS4 기준 `연방 Excise Tax 품목별` 후보를 추가한다.
  - 공식 출처:
    - USITC import tax FAQ: `https://www.usitc.gov/faq/question/what_kinds_taxes_and_fees_are_levied_imports_are.htm`
    - CBP taxes on imported goods: `https://www.help.cbp.gov/s/article/Article-1114?language=en_US`
    - IRS excise tax: `https://www.irs.gov/businesses/small-businesses-self-employed/excise-tax`
  - 실제 sales/use tax는 통관 단계 CBP 징수세가 아니며, 판매·사용 주와 거래 구조별로 달라지는 후속 계산 대상으로 둔다.
- 생성 시드: `supabase/seed/generated/us_import_requirements_seed.sql`
- 현재 범위:
  - `3004`: FDA 의약품 수입 심사
  - `3304`: FDA 화장품 수입요건
  - `9018`: FDA 의료기기 수입 심사
  - `851650`, `8528`: FDA 방사선 방출 전자제품 요건
  - `8516`, `8528`: FCC RF 장치 수입조건
  - `4202`: FWS 야생동식물·CITES 조건부 요건
  - `4202`, `8516`, `8528`: CPSC 소비자제품 안전·인증서 조건부 요건
- 공식 출처:
  - FDA Import Basics: `https://www.fda.gov/industry/import-basics`
  - FDA human drugs: `https://www.fda.gov/industry/importing-fda-regulated-products/importing-human-drugs`
  - FDA cosmetics registration/listing: `https://www.fda.gov/cosmetics/registration-listing-cosmetic-product-facilities-and-products`
  - FDA medical devices/radiation products: `https://www.fda.gov/medical-devices/importing-and-exporting-medical-devices/importing-medical-devices-and-radiation-emitting-electronic-products-us`
  - FDA radiation-emitting products: `https://www.fda.gov/industry/importing-fda-regulated-products/importing-radiation-emitting-electronic-products`
  - FCC 47 CFR 2.1204: `https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-2/subpart-K/section-2.1204`
  - FWS import/export requirements: `https://www.fws.gov/program/office-of-law-enforcement/information-importers-exporters`
  - CPSC imports: `https://www.cpsc.gov/Imports`

## EU 1차 상태

- 공식 TARIC 설명: `https://taxation-customs.ec.europa.eu/customs/calculation-customs-duties/customs-tariff/eu-customs-tariff-taric_en`
- Access2Markets: `https://trade.ec.europa.eu/access-to-markets/`
- VAT rates / TEDB 안내: `https://taxation-customs.ec.europa.eu/taxation/value-added-tax-vat/vat-rates_en`
- 현재 조회 가능 데이터:
  - `export_destination_tariff_rates`에 `EEC` 2025년 관세청 국가별 관세율표 기반 EU 공통 관세 44,073건 적재.
  - EU 27개 회원국 선택 시 해당 회원국 VAT 코드와 EU 공통 관세코드 `EEC` 자료를 함께 조회한다.
  - `ERGA OMNES`는 기본/제3국 관세로 표시하고, `한국협정세율`은 `한-EU FTA`로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_eu_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/eu_import_data_seed.sql`
  - EU 27개 회원국별 수입 VAT 표준세율 후보를 `EEC` 관세 HS 코드에 매핑한다.
  - `EEC` 대표 선택 시에는 `회원국별` 행만 표시하고, 독일·프랑스 등 회원국 선택 시에는 해당 회원국 표준세율 후보만 표시한다.
  - 감면세율 예외는 TEDB/회원국 품목조건을 구조화한 뒤 보강한다.
- 수입요건 1차 매핑:
  - `export_destination_import_requirements`에 `EEC` HS4 후보 요건 528건 적재.
  - 식품·사료, REACH/CLP, 화장품, CE/제품안전, 섬유·의류 표시 후보를 매핑한다.
  - HS만으로 확정하지 않고, 상세 팝업에 성분, 용도, 정격, 회원국, 라벨 언어 등 확인 포인트를 표시한다.
- 화면 확인 예시:
  - 독일 목적국, 한국 원산지, `330410` 조회 시 `3304.10-0000`, 기본/제3국 관세, `한-EU FTA`, `수입 VAT 19%`, `EU 화장품 규정 확인`, `EU REACH/CLP 화학물질 규제 확인`이 표시된다.
- 다음 보강:
  - 공식 TARIC DDS2/다운로드 또는 Access2Markets 구조화 응답을 확인해 EEC snapshot을 TARIC measure 원문 기반으로 교체한다.
  - 회원국별 감면 VAT, 면세, 소비세 예외를 품목조건 기준으로 추가한다.

## 목적국 커버리지 집계

- 마이그레이션: `supabase/migrations/20260524010000_export_destination_country_coverage.sql`
- 화면: 대시보드의 `목적국 데이터 커버리지`
- 집계 대상:
  - `export_destination_tariff_rates`
  - `export_destination_internal_taxes`
  - `export_destination_import_requirements`
  - `export_destination_additional_tariffs`
  - `export_destination_trade_remedy_cases`
  - `export_destination_data_sources`
- 날짜 기준:
  - 관세, 내국세, 수입요건, 추가관세, 무역구제는 `current_date` 기준 유효한 published 행만 집계한다.
  - 내국세 커버리지는 현재 유효 관세 HS와 직접 매칭되는 HS만 세어, 4자리 후보세목이나 만료 관세표 기반 행이 관세 커버리지보다 크게 보이지 않도록 한다.
  - 만료된 과거 관세표는 대시보드 커버리지에서 제외한다.
- 성능:
  - 실시간 view는 PostgREST timeout 가능성이 있어 materialized view로 관리한다.
  - `scripts/apply_lookup_seed_bundle.sh`는 seed publish 후 `refresh materialized view public.export_destination_country_coverage`를 실행한다.
- 코드 정규화:
  - 출처 레지스트리의 `US`, `GB`, `BD`, `IN`, `CAM`, `MYA`, `BRN`은 화면 대표 코드 `USA`, `GBR`, `BGD`, `IND`, `KHM`, `MMR`, `BRU`로 합산한다.

## 호주 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `AUS` 2025년 관세청 국가별 관세율표 기반 호주 관세 11,628건 적재.
  - 호주 목적국 선택 시 `AUS` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_australia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/australia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 호주 목적국 HS별 수입 GST 표준세율 후보 10%를 적재한다.
  - 공식 출처: ABF GST and other taxes `https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/gst-and-other-taxes`
  - GST-free, 저가물품, TRADEX, 와인세(WET), 고급자동차세(LCT)는 품목·거래조건별 예외로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 호주 HS4 후보 요건을 적재한다.
  - BICON 식품·농수산물, 식물·목재류, 동물·동물성 제품, AICIS 산업화학물질, TGA 치료제·의료기기 후보를 매핑한다.
  - 공식 출처:
    - BICON: `https://www.agriculture.gov.au/biosecurity-trade/import/online-services/bicon`
    - BICON permit 안내: `https://www.agriculture.gov.au/biosecurity-trade/import/online-services/bicon/bicon-permit`
    - AICIS: `https://www.industrialchemicals.gov.au/business/getting-started-registration-importing-and-manufacturing/basics-importing-and-manufacturing-chemicals`
    - TGA: `https://www.tga.gov.au/resources/resource/guidance/personal-importation-scheme`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_AUSTRALIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_AUSTRALIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - ABF Working Tariff 원문 파서를 작성해 관세청 국가별 관세율표 스냅샷을 호주 공식 관세표 원문으로 교체한다.
  - BICON case-level 조건을 구조화할 수 있으면 HS4 후보 매핑을 품목조건별 permit/inspection 조건으로 좁힌다.
  - WET/LCT 등 호주 개별 내국세는 별도 세율·대상 기준을 확보한 뒤 `export_destination_internal_taxes`에 분리 적재한다.

## 캐나다 1차 상태

- 공식 관세표: `https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html`
- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `CAN` 2025년 관세청 국가별 관세율표 기반 캐나다 관세 16,295건 적재.
  - 캐나다 목적국 선택 시 `CAN` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 원산지가 한국이면 `대한민국 세율`을 `한-캐나다 FTA`로 표시한다.
  - CPTPP, CUSMA/USMCA, CETA, 캐나다-영국 TCA 등 주요 협정 키도 원산지 선택에 맞춰 좁혀 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_canada_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/canada_import_data_seed.sql`
  - `export_destination_internal_taxes`에 캐나다 목적국 HS별 수입 GST 표준세율 후보 5%를 적재한다.
  - 공식 출처: CRA GST/HST on imports and exports `https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-imports-exports.html`
  - 비과세 수입, 영세율 물품, 참여주 HST의 주정부 부분, ITC 회수 가능성은 품목·거래조건별 예외로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 캐나다 HS4 후보 요건을 적재한다.
  - CFIA AIRS 식품·농수산물, 식물·목재류, 동물·동물성 제품, Health Canada 의약품·의료기기, Health Canada 화장품, Global Affairs 철강 수입통제, 섬유·의류 TPL 후보를 매핑한다.
  - 공식 출처:
    - CFIA AIRS: `https://inspection.canada.ca/en/importing-food-plants-animals/airs`
    - Health Canada commercial health products: `https://www.canada.ca/content/dam/hc-sc/documents/services/drugs-health-products/compliance-enforcement/importation-exportation/commercial-use-health-products-guidance/importing-and-exporting-health-products-for-commercial-use-gui-0117.pdf`
    - Health Canada cosmetics notification: `https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html`
    - Global Affairs steel controls: `https://www.international.gc.ca/trade-commerce/controls-controles/steel-acier/index.aspx?lang=eng`
    - Global Affairs textiles controls: `https://www.international.gc.ca/controls-controles/textiles/index.aspx?lang=eng`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_CANADA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_CANADA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - CBSA Customs Tariff 2026 HTML/PDF/Access 원문 파서를 작성해 관세청 국가별 관세율표 스냅샷을 캐나다 공식 관세표 원문으로 교체한다.
  - CFIA AIRS의 commodity/origin/destination/end-use 조건을 구조화할 수 있으면 HS4 후보 매핑을 실제 AIRS 조건으로 좁힌다.
  - Excise duty, excise tax, luxury tax 등 캐나다 개별 내국세는 별도 대상 기준을 확보한 뒤 분리 적재한다.

## 인도 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `IND` 2025년 관세청 국가별 관세율표 기반 인도 관세 15,604건 적재.
  - 인도 목적국 선택 시 `IND` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 원산지가 한국이면 `인도-대한민국 협정세율`을 `한-인도 CEPA`로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_india_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/india_import_data_seed.sql`
  - `export_destination_internal_taxes`에 인도 목적국 HS별 수입 IGST 표준세율 후보 18%를 적재한다.
  - 공식 출처: CBIC GST Goods and Services Rates `https://cbic-gst.gov.in/gst-goods-services-rates.html`
  - 실제 세액은 Basic Customs Duty, Social Welfare Surcharge, IGST, Compensation Cess, 감면·예외를 함께 계산해야 하므로 GST schedule 세부 매핑은 다음 단계로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 인도 HS4 후보 요건을 적재한다.
  - FSSAI 식품 수입통관, 식물검역, 동물검역, CDSCO 의약품·의료기기, CDSCO 화장품, BIS QCO/강제인증, DoT/WPC 무선기기, DGFT ITC(HS) 수입정책 후보를 매핑한다.
  - 공식 출처:
    - DGFT ITC(HS): `https://www.dgft.gov.in/CP/?opt=itchs-import-export`
    - FSSAI imports: `https://www.fssai.gov.in/cms/imports.php`
    - Plant Quarantine Management System: `https://pqms.cgg.gov.in/pqms-angular/home`
    - Animal Quarantine and Certification Services: `https://aqcsindia.gov.in/`
    - CDSCO import and registration: `https://cdsco.gov.in/opencms/opencms/en/Import-and-Registration/`
    - CDSCO cosmetics: `https://cdsco.gov.in/opencms/opencms/en/Cosmetics/`
    - BIS compulsory certification products: `https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en`
    - DoT import license: `https://deveservices.dot.gov.in/import-license`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_INDIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_INDIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - CBIC 공식 관세표 원문 파서를 작성해 관세청 국가별 관세율표 스냅샷을 인도 공식 관세표 원문으로 교체한다.
  - CBIC GST rate table을 HS별 IGST/Compensation Cess로 구조화해 현재 18% 후보를 품목별 세율로 좁힌다.
  - DGFT ITC(HS) 품목별 Free/Restricted/Prohibited/STE/Policy Condition을 구조화해 HS4 후보 매핑을 실제 품목 조건으로 교체한다.

## 베트남 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `VNM` 2025년 관세청 국가별 관세율표 기반 베트남 관세 15,799건 적재.
  - 베트남 목적국 선택 시 `VNM` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 베트남 데이터는 기본세율이 별도 컬럼이 아니라 `MFN 특혜세율`, `Normal Import` 키로 들어오므로 화면에서 `MFN`을 기본세율로 우선 표시한다.
  - 원산지가 한국이면 `VKFTA`, `AKFTA`, `RCEP_KOR`를 각각 `한-베트남 FTA`, `한-아세안 FTA`, `RCEP(한국)`으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_vietnam_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/vietnam_import_data_seed.sql`
  - `export_destination_internal_taxes`에 베트남 목적국 HS별 수입 VAT 표준세율 후보 10%를 적재한다.
  - 공식 출처: Vietnam Customs `https://www.customs.gov.vn/`
  - 품목별 0%, 5%, 비과세, 감면 또는 한시적 세율 조정 대상 여부는 별도 베트남 VAT 세부표 매핑으로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 베트남 HS4 후보 요건을 적재한다.
  - 수입식품 안전검사, 동식물검역·농림수산물 전문검사, 의약품·의료기기, 화장품 제품공표, 품질·적합성 전문검사, 정보통신·무선기기 인증, 국가싱글윈도우 전문검사 후보를 매핑한다.
  - 공식 출처:
    - Vietnam National Single Window: `https://vnsw.gov.vn/`
    - Imported food inspection: `https://nifc.gov.vn/en/imported-food-inspection`
    - MARD: `https://www.mard.gov.vn/`
    - Drug Administration of Vietnam: `https://dav.gov.vn/`
    - MOST: `https://www.most.gov.vn/`
    - MIC: `https://mic.gov.vn/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_VIETNAM_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_VIETNAM_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Vietnam Customs 공식 관세표 원문 파서를 작성해 관세청 국가별 관세율표 스냅샷을 공식 원문으로 교체한다.
  - 국가싱글윈도우/부처별 전문검사 목록을 HS별로 구조화해 HS4 후보 매핑을 실제 수입허가·검사 조건으로 좁힌다.
  - 베트남 VAT 세부표를 확보해 수입 VAT 10% 후보를 품목별 0%/5%/10%/비과세로 분리한다.

## 태국 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `THA` 2025년 관세청 국가별 관세율표 기반 태국 관세 17,162건 적재.
  - 태국 목적국 선택 시 `THA` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 원산지가 한국이면 `아세안-한국 협정세율`을 `한-아세안 FTA`, `RECP` 키를 `RCEP(한국)`으로 표시한다.
  - 데이터 원문에서 `Exempted`로 들어온 세율은 화면에서 `면제`로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_thailand_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/thailand_import_data_seed.sql`
  - `export_destination_internal_taxes`에 태국 목적국 HS별 수입 VAT 표준세율 후보 7%를 적재한다.
  - 공식 출처: Thailand Revenue Department VAT `https://www.rd.go.th/english/6043.html`
  - 면세, 감면, excise tax, 특정 내국세 또는 품목별 예외는 별도 세부표 매핑으로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 태국 HS4 후보 요건을 적재한다.
  - Thai FDA 식품, Thai FDA 의약품·의료기기, Thai FDA 화장품, TISI 강제표준, 식물검역, 동물검역, NBTC 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Thai FDA food importation: `https://en.fda.moph.go.th/entrepreneurs-food/food-importation-01`
    - Thai FDA medical device importer service: `https://en.fda.moph.go.th/our-services-new/our-services-manufacturer-importer-of-medical-devices`
    - TISI standard list: `https://www2.tisi.go.th/standard-list/en`
    - Department of Agriculture: `https://www.doa.go.th/`
    - Department of Livestock Development: `https://dld.go.th/`
    - NBTC: `https://www.nbtc.go.th/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_THAILAND_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_THAILAND_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Thai Customs 공식 관세표 원문 파서를 작성해 관세청 국가별 관세율표 스냅샷을 공식 원문으로 교체한다.
  - Thai FDA/TISI/NBTC/검역 품목 목록을 HS별로 구조화해 HS4 후보 매핑을 실제 허가·검사 조건으로 좁힌다.
  - 태국 excise tax 대상 품목을 확보해 VAT와 별도 내국세로 분리한다.

## 인도네시아 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `IDN` 2025년 관세청 국가별 관세율표 기반 인도네시아 관세 14,631건 적재.
  - 인도네시아 목적국 선택 시 `IDN` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 인도네시아 데이터는 기본세율이 별도 컬럼이 아니라 `기본세율 Import Duty` 키로 들어오므로 화면에서 이 값을 기본세율로 표시한다.
  - 원산지가 한국이면 `한-인도네시아-포괄적경제동반자협정 CEPA`, `아세안-한국 협정세율 AKFTA Import Duty`, `RCEP협정세율-대한민국 RCEP_KOREA`를 각각 `한-인도네시아 CEPA`, `한-아세안 FTA`, `RCEP(한국)`으로 표시한다. 원문 세율이 `MFN`인 RCEP 항목은 특혜세율로 따로 표시하지 않는다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_indonesia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/indonesia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 인도네시아 목적국 HS별 수입 VAT 후보 `11% 상당`을 적재한다.
  - 공식 출처: Direktorat Jenderal Pajak PPN 2025 guidance `https://www.pajak.go.id/id/siaran-pers/ppn-2025-kebijakan-baru-beban-pajak-tetap-ringan-untuk-masyarakat`
  - 일반 비사치품은 12% × 11/12 과세표준으로 기존 11% 수준의 세부담을 표시한다. 사치품, PPnBM, 면세, 감면, 특정 과세표준 또는 품목별 예외는 별도 세부표 매핑으로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 인도네시아 HS4 후보 요건을 적재한다.
  - BPOM 식품·의약품·의료기기·화장품, 검역, 할랄, SNI 강제표준, SDPPI 통신·무선기기, INSW Lartas 수입제한 후보를 매핑한다.
  - 공식 출처:
    - Indonesia National Single Window: `https://insw.go.id/`
    - BPOM e-BPOM import/export permit service: `https://exim.pom.go.id/`
    - Indonesian Quarantine Authority: `https://karantinaindonesia.go.id/`
    - BSN SNI process: `https://sispk-v2.bsn.go.id/artikel/index/read/alur-proses-sni`
    - BPJPH halal service: `https://bpjph.halal.go.id/`
    - SDPPI certification: `https://sertifikasi.postel.go.id/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_INDONESIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_INDONESIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Indonesia National Single Window 또는 세관 공식 HS별 관세·Lartas 데이터를 구조화해 관세청 국가별 관세율표 스냅샷을 공식 원문으로 교체한다.
  - BPOM/SNI/할랄/검역/SDPPI 대상 목록을 HS별로 구조화해 HS4 후보 매핑을 실제 허가·검사 조건으로 좁힌다.
  - PPnBM과 품목별 VAT 예외를 확보해 `11% 상당` 후보를 품목별 내국세로 분리한다.

## 멕시코 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `MEX` 2025년 관세청 국가별 관세율표 기반 멕시코 관세 21,002건 적재.
  - 멕시코 목적국 선택 시 `MEX` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 현재 관세청 스냅샷의 멕시코 행은 협정세율 컬럼이 비어 있으므로 기본 관세율만 표시한다. 한-멕시코 FTA는 현재 적용 가능한 협정세율로 만들지 않는다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_mexico_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/mexico_import_data_seed.sql`
  - `export_destination_internal_taxes`에 멕시코 목적국 HS별 수입 IVA 일반세율 후보 16%를 적재한다.
  - 공식 출처:
    - SAT IVA guidance: `https://wwwmatnp.sat.gob.mx/articulo/38511/criterio-9/iva/nv`
    - SAT import VAT query service: `https://www.gob.mx/tramites/ficha/consulta-sobre-el-iva-en-mercancias-de-importacion/SAT4473`
  - 0%, 면세, 북부/남부 국경지역 인센티브, 임시수입, IMMEX, 특정 품목 예외는 별도 세부표 매핑으로 남긴다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 멕시코 HS4 후보 요건을 적재한다.
  - COFEPRIS 식품·의약품·의료기기·화장품, SENASICA 동식물검역, NOM 강제표준, IFT 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - COFEPRIS import authorizations: `https://www.gob.mx/cofepris/acciones-y-programas/importaciones-69325`
    - Secretaria de Economia standards: `https://www.gob.mx/se/acciones-y-programas/standards`
    - PLATIICA standardization portal: `https://platiica.economia.gob.mx/estandarizacion/`
    - SENASICA: `https://www.gob.mx/senasica`
    - IFT: `https://www.ift.org.mx/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_MEXICO_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_MEXICO_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Mexico SNICE/SIAVI 또는 공식 세율 자료를 구조화해 관세청 국가별 관세율표 스냅샷을 공식 원문으로 교체한다.
  - NOM/COFEPRIS/SENASICA/IFT 대상 목록을 HS별로 구조화해 HS4 후보 매핑을 실제 허가·검사 조건으로 좁힌다.
  - IVA 0%/면세/IMMEX/국경지역 인센티브 조건을 확보해 `16%` 후보를 품목별·거래조건별로 분리한다.

## 방글라데시 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `BGD` 2025년 관세청 국가별 관세율표 기반 방글라데시 관세 8,547건 적재.
  - 방글라데시 목적국 선택 시 `BGD` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 현재 관세청 스냅샷의 방글라데시 행은 협정세율 컬럼이 비어 있으므로 기본 관세율만 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_bangladesh_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/bangladesh_import_data_seed.sql`
  - `export_destination_internal_taxes`에 방글라데시 목적국 HS별 수입 VAT 표준세율 후보 15%를 적재한다.
  - 공식 출처: National Board of Revenue VAT guidance `https://nbr.gov.bd/all-faq/eservices/taxefiling/e-services/vatcalculator/eng`
  - SD, RD, AT, AIT, exemption schedule, SRO 감면 또는 품목별 예외는 Bangladesh Customs Import Export Hub의 HS별 세금 구조화로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 방글라데시 HS4 후보 요건을 적재한다.
  - BFSA 식품수입, 동물검역, 식물검역, DGDA 의약품·의료기기, 화장품 라벨/수입정책, BSTI 강제표준, BTRC 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Bangladesh Customs Import Export Hub: `https://hub.bangladeshcustoms.gov.bd/`
    - BFSA import system: `https://import.bfsa.gov.bd/`
    - BFSA registration: `https://import.bfsa.gov.bd/register`
    - BSTI: `https://bsti.gov.bd/`
    - Bangladesh Trade Portal: `https://www.bangladeshtradeportal.gov.bd/`
    - Department of Livestock Services: `https://dls.gov.bd/`
    - Plant Quarantine Wing: `http://plantquarantine.gov.bd/`
    - DGDA: `https://dgda.gov.bd/`
    - BTRC: `https://btrc.gov.bd/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_BANGLADESH_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_BANGLADESH_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Bangladesh Customs Import Export Hub를 HS별로 파싱해 CD, SD, VAT, AIT, AT, RD와 제품별 요건을 10자리 수준으로 교체한다.
  - BSTI mandatory import list와 BFSA/DGDA/검역 대상 목록을 HS별로 구조화해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 라오스 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `LAO` 2025년 관세청 국가별 관세율표 기반 라오스 관세 14,450건 적재.
  - 라오스 목적국 선택 시 `LAO` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 라오스 행은 기본세율, APTA, RCEP, `협정세율` 컬럼을 포함한다. 한국 원산지 선택 시 `협정세율`은 한-아세안 FTA 후보, `RCEP`은 RCEP(한국), `APTA`는 아·태무역협정 후보로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_laos_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/laos_import_data_seed.sql`
  - `export_destination_internal_taxes`에 라오스 목적국 HS별 수입 VAT 표준세율 후보 10%를 적재한다.
  - 공식 출처: Lao PDR Trade Portal VAT rate notice `https://www.laotradeportal.gov.la/en-gb/site/display/589`
  - 면세, 감면, 소비세·특별세, 프로젝트 인센티브, 품목별 예외는 Lao Trade Portal 상품별 세금 구조화로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 라오스 HS4 후보 요건을 적재한다.
  - 식품 수입허가·위생확인, 동물검역, 식물검역, 의약품·의료기기, 화장품 라벨/등록, 기술표준, 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Lao PDR Trade Portal: `https://www.laotradeportal.gov.la/`
    - Commodity Search: `https://www.laotradeportal.gov.la/en-gb/site/listcommodity`
    - Imports guide: `https://www.laotradeportal.gov.la/en-gb/site/display/10`
    - Food and Drug Department: `https://fdd.gov.la/`
    - Department of Standardization and Metrology: `https://dsm.gov.la/`
    - Ministry of Agriculture and Forestry: `https://www.maf.gov.la/`
    - Ministry of Technology and Communications: `https://mpt.gov.la/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_LAOS_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_LAOS_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Lao Trade Portal Commodity Search를 HS별로 파싱해 관세율·내국세·요건을 10자리 수준으로 교체한다.
  - 수입허가, SPS, 기술요건, 금지·제한품목을 상품별 조치 목록으로 구조화해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 말레이시아 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `MYS` 2025년 관세청 국가별 관세율표 기반 말레이시아 관세 16,944건 적재.
  - 말레이시아 목적국 선택 시 `MYS` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 말레이시아 행은 기본세율, AKFTA, ATIGA, RCEP, SST/소비세 컬럼을 포함한다. 화면에서는 SST/소비세 컬럼을 협정세율에서 제외하고 내국세로 분리한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_malaysia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/malaysia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 말레이시아 목적국 HS별 `부가세율`을 `수입 SST(판매세)`, `소비세율`을 `수입 소비세` 후보로 적재한다.
  - 일반 VAT/GST는 별도 세목으로 부과하지 않으므로 모든 MYS 관세 HS에 `수입 VAT/GST 없음` 행을 추가하고, taxable goods 판매세와 소비세가 있는 품목은 별도 행으로 함께 표시한다.
  - 현재 로컬 커버리지 기준 `MYS`는 관세 16,943개 HS, 내국세 16,943개 HS, 수입요건 847건이다.
  - 공식 출처:
    - JKDM HS Explorer: `https://ezhs.customs.gov.my/`
    - mySST Sales Tax Orders: `https://mysst.customs.gov.my/assets/document/SST%20Orders/order/Order_BI.html`
  - SST 면세, 5%/10% 세율, 특정세율, 저가수입품, 자유지역·보세구역·면세승인 조건은 mySST 고시별 세부 파싱으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 말레이시아 HS4 후보 요건을 적재한다.
  - ePermit/PIA 수입허가, MAQIS 동식물 검역, NPRA 의약품·의료기기·화장품, SIRIM COA/기술표준, 전기제품 COA, SIRIM/MCMC 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - myTRADELINK ePermit: `https://www.mytradelink.gov.my/epermitinfo`
    - Dagang Net ePermit: `https://epermit.dagangnet.com.my/`
    - MAQIS: `https://www.maqis.gov.my/`
    - NPRA: `https://www.npra.gov.my/`
    - NPRA cosmetics FAQ: `https://www.npra.gov.my/index.php/my/frequently-asked-questions-faqs`
    - SIRIM QAS: `https://www.sirim-qas.com.my/`
    - Energy Commission: `https://www.st.gov.my/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_MALAYSIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_MALAYSIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - JKDM HS Explorer를 파싱해 관세율, SST, 소비세, import/export prohibition을 공식 원문 기준으로 교체한다.
  - myTRADELINK/ePermit의 permit issuing agency 목록과 품목별 AP/COA 요건을 구조화해 HS4 후보 매핑을 실제 HS별 요건으로 좁힌다.

## 필리핀 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `PHL` 2025년 관세청 국가별 관세율표 기반 필리핀 관세 14,768건 적재.
  - 필리핀 목적국 선택 시 `PHL` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 필리핀 행은 MFN, Korea-Philippines FTA, AKFTA, RCEP, ATIGA 컬럼을 포함한다. 화면에서는 `최혜국 MFN`을 기본세율로 표시하고 협정세율에는 한-필리핀 FTA, 한-아세안 FTA, RCEP, ATIGA만 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_philippines_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/philippines_import_data_seed.sql`
  - `export_destination_internal_taxes`에 필리핀 목적국 HS별 수입 VAT 표준세율 후보 12%를 적재한다.
  - 공식 출처:
    - Bureau of Customs import VAT guidance: `https://customs.gov.ph/importing-relief-goods/`
    - Philippine Tariff Finder: `https://finder.tariffcommission.gov.ph/`
  - VAT 면세, 영세율, 특수경제구역, excise tax, 품목별 예외는 별도 세부표 매핑으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 필리핀 HS4 후보 요건을 적재한다.
  - FDA 식품·의약품·의료기기·화장품, BAI 동물검역, BFAR 수산물, BPI 식물검역, BPS 강제표준, NTC 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - TradeNet Philippines: `https://tradenet.gov.ph/`
    - Philippines FDA: `https://www.fda.gov.ph/`
    - Bureau of Animal Industry: `https://www.bai.gov.ph/`
    - Bureau of Fisheries and Aquatic Resources: `https://www.bfar.da.gov.ph/`
    - Bureau of Plant Industry: `https://bpi.da.gov.ph/`
    - Bureau of Philippine Standards: `https://bps.dti.gov.ph/`
    - National Telecommunications Commission permit to import: `https://ntc.gov.ph/permit-to-import/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_PHILIPPINES_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_PHILIPPINES_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Philippine Tariff Finder를 연도별로 파싱해 2024-2028 MFN/FTA 세율을 공식 원문 기준으로 교체한다.
  - TradeNet, FDA, BAI, BFAR, BPI, BPS, NTC의 품목별 허가·검사 목록을 구조화해 HS4 후보 매핑을 실제 HS별 요건으로 좁힌다.

## 싱가포르 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `SGP` 2025년 관세청 국가별 관세율표 기반 싱가포르 관세 14,456건 적재.
  - 싱가포르 목적국 선택 시 `SGP` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 싱가포르 행은 대부분 기본세율 0%이며, 한국 원산지 선택 시 `한-싱가포르 협정세율`을 한-싱가포르 FTA 후보로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_singapore_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/singapore_import_data_seed.sql`
  - `export_destination_internal_taxes`에 싱가포르 목적국 HS별 수입 GST 표준세율 후보 9%를 적재한다.
  - 공식 출처:
    - Singapore Customs GST: `https://www.customs.gov.sg/businesses/valuation-duties-taxes-fees/goods-and-services-tax-gst/`
    - Singapore Customs import procedures: `https://www.customs.gov.sg/doing-business/import-operations/import-procedures/import-procedures-overview/`
  - GST relief, Free Trade Zone/warehouse, MES, IGDS, AISS, temporary import, exempt goods 조건은 별도 세부 매핑으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 싱가포르 HS4 후보 요건을 적재한다.
  - TradeNet 수입허가, SFA 식품, AVS 동물검역, NParks 식물검역, HSA 의약품·의료기기·화장품, 통제물품/기술요건, IMDA 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Singapore Customs import permit: `https://www.customs.gov.sg/businesses/importing-goods/import-procedures/apply-customs-import-permit`
    - TradeNet: `https://www.customs.gov.sg/doing-business/quick-links-for-traders/tradenet`
    - Singapore Food Agency: `https://www.sfa.gov.sg/`
    - AVS: `https://www.nparks.gov.sg/avs`
    - NParks: `https://www.nparks.gov.sg/`
    - HSA: `https://www.hsa.gov.sg/`
    - HSA cosmetic products: `https://www.hsa.gov.sg/cosmetic-products/`
    - IMDA TradeNet AHTN code list: `https://www.imda.gov.sg/regulations-and-licensing-listing/dealer-and-equipment-registration-framework/tradenet-list-of-ahtn-codes`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_SINGAPORE_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_SINGAPORE_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Singapore Customs/TradeNet의 HS/CA Product Code Search 결과를 구조화해 통제물품과 competent authority를 HS8 수준으로 교체한다.
  - dutiable goods, excise duty, GST relief/suspension schemes를 조건별 내국세 규칙으로 분리한다.

## 캄보디아 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `CAM` 2025년 관세청 국가별 관세율표 기반 캄보디아 관세 14,445건 적재.
  - 캄보디아 목적국 선택 시 `CAM` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 캄보디아 행은 기본세율, 한-캄보디아 FTA, AKFTA, RCEP, 부가세, 특별세 컬럼을 포함한다. 화면에서는 부가세/특별세를 협정세율에서 제외하고 내국세로 분리한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_cambodia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/cambodia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 캄보디아 목적국 HS별 `부가세`를 `수입 VAT`, `특별세`를 `수입 특별세` 후보로 적재한다.
  - 관세표에 부가세 컬럼 값이 없는 HS는 GDT VAT FAQ 기준 표준 VAT 10% 후보를 채워 `KHM` 관세 HS 14,445개와 내국세 HS 14,445개 커버리지를 맞춘다.
  - 공식 출처:
    - GDCE Cambodia: `https://customs.gov.kh/en`
    - GDT VAT FAQ: `https://www.tax.gov.kh/gdtwebsiteweb/en/faq`
  - VAT 면세, 투자 인센티브, 정부부담 VAT, 특별세 품목별 예외는 GDCE/GDT 세부 규정 파싱으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 캄보디아 HS4 후보 요건을 적재한다.
  - 식품 품질검사, 동식물 검역, 의약품·의료기기·화장품 수입증명, 기술표준·품질검사, 통신·무선기기 승인 후보를 매핑한다.
  - 공식 출처:
    - Cambodia National Trade Repository import guide: `https://cambodiantr.gov.kh/en/guide-to-trade/guide-to-import-export/`
    - Medicine/Cosmetics/Medical Equipment import certificate: `https://cambodiantr.gov.kh/en/procedure?title=application-for-import-certificate-for-medicine-cosmetics-medical-equipment`
    - MAFF Cambodia: `https://www.maff.gov.kh/`
    - MISTI Cambodia: `https://misti.gov.kh/`
    - TRC import approval: `https://trc.gov.kh/en/radiocom-telecom-equipment-import-approval/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_CAMBODIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_CAMBODIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - GDCE/NTR 품목 검색 결과를 구조화해 관세율, VAT, 특별세, import restriction을 공식 원문 기준으로 교체한다.
  - NTR 절차별 첨부서류·관할기관을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 미얀마 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `MYA` 2025년 관세청 국가별 관세율표 기반 미얀마 관세 15,208건 적재.
  - 미얀마 목적국 선택 시 `MYA` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 미얀마 행은 기본세율과 `협정세율` 컬럼을 포함한다. 한국 원산지 선택 시 `협정세율`은 한-아세안 FTA 후보로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_myanmar_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/myanmar_import_data_seed.sql`
  - `export_destination_internal_taxes`에 미얀마 목적국 HS별 수입 상업세 일반세율 후보 5%를 적재한다.
  - 공식 출처:
    - Myanmar Commercial Tax Law: `https://servicetrade.gov.mm/horizontal/law-detail/commercial-tax-law`
    - Myanmar Trade Portal import guide: `https://www.myanmartradeportal.gov.mm/en/guide-to-import`
  - 상업세 면세 47개 품목, 0/10/15/20/25% 스케줄, 특정상품세 대상은 품목별 세부표 매핑으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 미얀마 HS4 후보 요건을 적재한다.
  - FDA 식품·의약품·의료기기·화장품, 동물·수산 검역, 식물검역·종자허가, TradeNet 2.0 수입허가·기술요건, 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Myanmar Trade Portal guide to import: `https://www.myanmartradeportal.gov.mm/en/guide-to-import`
    - Myanmar Trade Portal commodity search: `https://myanmartradeportal.gov.mm/en/commodity-search`
    - Myanmar TradeNet 2.0: `https://www.myanmartradenet.com/`
    - MACCS import information: `https://www.maccs.gov.mm/Import`
    - FDA Myanmar: `https://www.fda.gov.mm/`
    - MOALI Myanmar: `https://www.moali.gov.mm/`
    - Ministry of Commerce Myanmar: `https://www.commerce.gov.mm/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_MYANMAR_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_MYANMAR_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Myanmar Trade Portal 상품검색 결과를 구조화해 authorization requirement, SPS/TBT, import licence를 HS10 수준으로 교체한다.
  - 상업세 면세·고율 스케줄과 특정상품세 대상 목록을 확보해 5% 후보를 품목별 실제 내국세로 좁힌다.

## 브루나이 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `BRU` 2025년 관세청 국가별 관세율표 기반 브루나이 관세를 적재해 사용한다.
  - 브루나이 목적국 선택 시 `BRU` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 브루나이 행은 기본세율, `협정세율`, RCEP 컬럼을 포함한다. 한국 원산지 선택 시 `협정세율`은 한-아세안 FTA, RCEP은 `RCEP(한국)` 후보로 표시한다.
- 내국세 1차 매핑:
  - `export_destination_internal_taxes`에 브루나이 목적국 HS별 `VAT/GST 없음` 행을 적재한다.
  - 공식 출처:
    - BDNSW customs import duty: `https://bdnsw.mofe.gov.bn/Pages/CustomsImportDuty.aspx`
  - 품목별 수입관세와 excise duty는 관세율표·소비세표 원문에서 별도 구조화가 필요하다.
- 수입요건 1차 매핑:
  - 생성 스크립트: `scripts/generate_brunei_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/brunei_import_data_seed.sql`
  - `export_destination_import_requirements`에 브루나이 HS4 후보 요건을 적재한다.
  - 식품·할랄, 동물·수산 검역, 식물검역·목재류, 의약품·의료기기, 화장품 통지, 제한·통제물품, AITI 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - BDNSW import procedures: `https://bdnsw.mofe.gov.bn/Pages/ImpExpProcedure.aspx`
    - BDNSW home: `https://bdnsw.mofe.gov.bn/Pages/Home.aspx`
    - Ministry of Health pharmacy services: `https://moh.gov.bn/services/pharmary-services/`
    - Ministry of Primary Resources and Tourism: `https://www.mprt.gov.bn/`
    - Ministry of Religious Affairs: `https://www.mora.gov.bn/`
    - AITI personal import permit: `https://www.aiti.gov.bn/permits/personal-import-permit/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_BRUNEI_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_BRUNEI_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - BDNSW/RCED의 통제물품·세율 자료를 구조화해 관세율과 수입허가를 공식 원문 기준으로 교체한다.
  - AITI, MOH, MPRT, MoRA의 품목별 허가 목록을 확보해 HS4 후보 매핑을 HS8/HS10 수준으로 좁힌다.

## 뉴질랜드 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `NZL` 2025년 관세청 국가별 관세율표 기반 뉴질랜드 관세 21,425건 적재.
  - 뉴질랜드 목적국 선택 시 `NZL` 코드 기준으로 상대국 HS/품명/관세율을 표시한다.
  - 관세청 스냅샷의 뉴질랜드 행은 기본세율, 한-뉴질랜드 FTA, RCEP 컬럼을 포함한다. 한국 원산지 선택 시 한-뉴질랜드 FTA와 `RCEP(한국)` 후보로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_new_zealand_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/new_zealand_import_data_seed.sql`
  - `export_destination_internal_taxes`에 뉴질랜드 목적국 HS별 수입 GST 표준세율 후보 15%를 적재한다.
  - 공식 출처:
    - NZ Customs duty and GST: `https://www.customs.govt.nz/personal/duty-and-gst/duty-and-allowances`
    - NZ Customs tariffs: `https://www.customs.govt.nz/business/tariffs/`
  - NZD 1,000 이하 물품, 해외공급자 GST, IETF/BSEL, 주류·담배 excise-equivalent duty는 거래조건별 보강 대상이다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 뉴질랜드 HS4 후보 요건을 적재한다.
  - MPI 식품안전·생물보안, 동식물 검역, Medsafe 의약품·의료기기, EPA 화장품·위험물질, Customs 금지·제한품, RSM 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Trade Single Window: `https://www.tsw.govt.nz/`
    - MPI general importing requirements: `https://www.mpi.govt.nz/import/importing-into-nz-how-it-works/general-importing-requirements`
    - MPI food safety clearance: `https://www.mpi.govt.nz/import/importing-food-and-beverages/food-safety-clearance-of-imported-food-2/food-safety-clearance-of-imported-food/`
    - MPI online import permit: `https://animalplantimportpermit.mpi.govt.nz/Home/Disclaimer`
    - Medsafe medical devices: `https://www.medsafe.govt.nz/regulatory/DevicesNew/4Importing.asp`
    - EPA cosmetics: `https://www.epa.govt.nz/everyday-environment/cosmetics/making-or-importing-cosmetics-and-toiletries/`
    - EPA hazardous substances: `https://www.epa.govt.nz/hazardous-substances/before-you-import-or-manufacture/`
    - RSM supplier compliance: `https://www.rsm.govt.nz/business-individuals/supplier-compliance`
    - NZ Customs prohibited/restricted imports: `https://www.customs.govt.nz/business/import/import-prohibited-and-restricted-imports/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_NEW_ZEALAND_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_NEW_ZEALAND_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - NZ Customs Working Tariff 원문을 구조화해 관세청 스냅샷을 공식 최신 원문 기준으로 교체한다.
  - MPI import health standards, EPA HSNO approval, RSM prohibited equipment를 HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 대만 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `TWN` 2025년 관세청 국가별 관세율표 기반 대만 관세 20,824건 적재.
  - 대만 목적국 선택 시 `TWN` 코드 기준으로 상대국 CCC/HS, 품명, 관세율을 표시한다.
  - 대만 스냅샷의 Column I은 WTO 국가 및 상호관계국 관세율로 기본 관세율에 표시한다.
  - Column II는 괄호 안 국가코드를 파싱해 원산지 선택 시 해당 국가의 협정·특혜세율만 표시한다. 한국 원산지는 Column II 대상이 아니므로 별도 FTA 후보를 표시하지 않는다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_taiwan_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/taiwan_import_data_seed.sql`
  - `export_destination_internal_taxes`에 대만 목적국 CCC/HS별 수입 영업세 표준세율 후보 5%를 적재한다.
  - 공식 출처:
    - Taiwan Customs tariff query: `https://portal.sw.nat.gov.tw/APGQO/GC411`
  - 화물세, 주세, 담배세, 면세·감면은 품목별 세부 매핑으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 대만 수입규정 코드 기반 요건을 적재한다.
  - `F01/F02/B01` 식품·식품관련 TFDA 검사, `C01/C02` BSMI 수입검사, `MW0` 중국대륙산 수입제한, `801/802/821/827` 보건제품 TFDA 후보는 10자리 품목 단위로 적재한다.
  - 화장품과 통신·무선기기는 HS4 후보 요건을 추가한다.
  - 공식 출처:
    - Taiwan CCC import regulations: `https://fbfh.trade.gov.tw/fh/ap/queryCCCRegFormf_e.do`
    - TFDA border inspection: `https://www.fda.gov.tw/TC/site.aspx?r=498607567&sid=2403`
    - TFDA medical device border inspection regulations: `https://www.fda.gov.tw/ENG/lawContent.aspx?cid=5063&id=3362`
    - Kaohsiung Customs health products: `https://web.customs.gov.tw/ekaohsiung/singlehtml/47162cfe8dc340c19aae0fa7758a7db3?cntId=596b8756c6714918aa786f2f773d9dc1`
    - BSMI Taiwan: `https://www.bsmi.gov.tw/wSite/ct?ctNode=9925&mp=3&xItem=109455`
    - NCC Taiwan: `https://www.ncc.gov.tw/English/news_detail.aspx?site_content_sn=69&sn_f=5342`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_TAIWAN_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_TAIWAN_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - 대만 단일창구 GC411/CCC 규정조회 결과를 직접 파싱해 관세율, 수입규정 코드, 세금특별조항을 공식 최신 원문으로 교체한다.
  - 수입규정 코드 전체 설명표를 확보해 `111`, `553`, `MP1` 등 기타 코드도 기관·절차별로 확장한다.

## 튀르키예 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `TUR` 2025년 관세청 국가별 관세율표 기반 튀르키예 관세 19,705건 적재.
  - 튀르키예 목적국 선택 시 `TUR` 코드 기준으로 상대국 GTIP/HS, 품명, 관세율을 표시한다.
  - 관세청 스냅샷의 `부가세율`은 내국세로 분리하고, `Industrial Products`, `Processed Agricultural Products`, `Agricultural Products`, `Fish and Fishery Products` 컬럼은 품목군별 관세율 후보로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_turkey_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/turkey_import_data_seed.sql`
  - `export_destination_internal_taxes`에 관세표의 `부가세율` 컬럼을 수입 VAT(KDV) 후보로 분리 적재한다.
  - 관세표에 부가세율 컬럼 값이 없는 HS는 표준 KDV 20% 후보를 채워 `TUR` 관세 HS 19,704개와 내국세 HS 19,704개 커버리지를 맞춘다.
  - 공식 출처:
    - Turkey customs guide taxes: `https://www.gumrukrehberi.gov.tr/sayfa/g%C3%BCmr%C3%BCk-vergileri-neye-g%C3%B6re-hesaplan%C4%B1r`
    - Turkey Ministry of Trade import regime: `https://ticaret.gov.tr/gumruk-islemleri/sikca-sorulan-sorular/english/import-regime`
  - 특별소비세(OTV), TRT bandrole, 추가재정의무, 면세·감면은 품목별 세부 매핑으로 보강한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 튀르키예 HS4 후보 요건을 적재한다.
  - 식품·농수산물, 동물·수산·축산 검역, 식물·목재 검역, TITCK 의약품·의료기기·화장품, TAREKS 제품안전 검사, BTK 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Ministry of Trade tariff guidance: `https://ticaret.gov.tr/gumruk-islemleri/sikca-sorulan-sorular/english/tariff`
    - Ministry of Trade product safety import inspections: `https://ticaret.gov.tr/urun-guvenligi/ithalatta-urun-guvenligi-denetimleri`
    - TITCK: `https://www.titck.gov.tr/`
    - Ministry of Agriculture and Forestry: `https://www.tarimorman.gov.tr/`
    - BTK: `https://www.btk.gov.tr/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_TURKEY_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_TURKEY_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - 튀르키예 TGTC/Resmi Gazete 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - TAREKS 연도별 communiqué와 TITCK/BTK/농림부 품목 목록을 HS12 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 사우디아라비아 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `SAU` 2025년 관세청 국가별 관세율표 기반 사우디아라비아 관세 18,400건 적재.
  - 사우디아라비아 목적국 선택 시 `SAU` 코드 기준으로 상대국 HS, 품명, 기본 관세율을 표시한다.
  - 현재 관세청 스냅샷에는 FTA·특혜세율 컬럼이 없어 기본 관세율 중심으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_saudi_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/saudi_import_data_seed.sql`
  - `export_destination_internal_taxes`에 사우디 수입 VAT 표준세율 15% 후보를 적재한다.
  - 공식 출처:
    - ZATCA VAT: `https://www.zatca.gov.sa/en/RulesRegulations/VAT/Pages/default1.aspx`
  - 영세율·면세, 선택적 소비세, 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 사우디 HS4 후보 요건을 적재한다.
  - SFDA 식품/동물성제품/화장품/의약품·의료기기, SABER 제품적합성, CST 통신·무선기기, 식물·목재 검역 후보를 매핑한다.
  - 공식 출처:
    - ZATCA customs tariff search: `https://zatca.gov.sa/en/eServices/Pages/eServices_220.aspx`
    - ZATCA import instructions: `https://www.zatca.gov.sa/en/RulesRegulations/Taxes/Pages/customs_bussiness/import_pages/Import-Instructions.aspx`
    - SFDA imported food: `https://sfda.gov.sa/en/imported-food`
    - SFDA FASEH: `https://www.sfda.gov.sa/en/eservices?keys=Faseh`
    - SASO SABER platform: `https://www.saso.gov.sa/en/mediacenter/news/Pages/saso_news_1178.aspx`
    - Communications, Space and Technology Commission: `https://www.cst.gov.sa/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_SAUDI_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_SAUDI_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - ZATCA 공식 tariff search를 직접 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - SABER/SALEEM 규제제품 목록, SFDA FASEH 품목 목록, CST 무선기기 기준을 HS12 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 남아프리카공화국 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `ZAF` 2025년 관세청 국가별 관세율표 기반 남아프리카공화국 관세 11,946건 적재.
  - 남아프리카공화국 목적국 선택 시 `ZAF` 코드 기준으로 상대국 HS, 품명, 기본 관세율을 표시한다.
  - EU/UK, EFTA, SADC, AfCFTA, MERCOSUR 특혜 컬럼은 원산지 선택값에 맞는 경우만 표시한다. 한국 원산지 선택 시 해당 특혜는 표시하지 않는다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_south_africa_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/south_africa_import_data_seed.sql`
  - `export_destination_internal_taxes`에 남아공 수입 VAT 표준세율 15% 후보를 적재한다.
  - 공식 출처:
    - SARS duties and taxes for importers: `https://www.sars.gov.za/customs-and-excise/duties-and-taxes/duties-and-taxes-for-importers/`
  - 면세, zero-rated goods, ad valorem excise, 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 남아공 HS4 후보 요건을 적재한다.
  - DALRRD 농식품·식물·동물검역, SAHPRA 의약품·의료기기, 화장품 안전·표시, NRCS 강제규격, ITAC 수입허가 후보를 매핑한다.
  - 공식 출처:
    - SARS tariff: `https://www.sars.gov.za/customs-and-excise/tariff/`
    - SARS prohibited/restricted goods: `https://www.sars.gov.za/customs-and-excise/prohibited-restricted-and-counterfeit-goods/`
    - ITAC import control: `https://itac.org.za/import-control/`
    - NRCS: `https://www.nrcs.org.za/`
    - SAHPRA medical product border control: `https://www.sahpra.org.za/importation-of-medical-products-border-control/`
    - Foodstuffs, Cosmetics and Disinfectants Act: `https://www.sahpra.org.za/document/foodstuffs-cosmetics-and-disinfectants-act-1972-act-no-54-of-1972-as-amended/`
    - Import animals and animal products: `https://www.gov.za/services/import/import-animals-and-animal-products`
    - DALRRD: `https://www.dlrrd.gov.za/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_SOUTH_AFRICA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_SOUTH_AFRICA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - SARS tariff book 원문을 직접 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - ITAC import control regulations, NRCS compulsory specifications, SAHPRA/DALRRD 품목 목록을 HS8/HS9 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 아랍에미리트 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `ARE` 2025년 관세청 국가별 관세율표 기반 아랍에미리트 관세 14,595건 적재.
  - 아랍에미리트 목적국 선택 시 `ARE` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 협정 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_uae_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/uae_import_data_seed.sql`
  - `export_destination_internal_taxes`에 UAE 수입 VAT 표준세율 5% 후보 14,595건을 적재한다.
  - 공식 출처:
    - UAE Federal Tax Authority VAT: `https://tax.gov.ae/en/taxes/vat.aspx`
    - UAE Federal Tax Authority taxable supply: `https://tax.gov.ae/en/content/what.is.a.taxable.supply.aspx`
  - 영세율·면세, 보세·일시수입, 거래조건별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 UAE HS4 후보 요건 745건을 적재한다.
  - 식품·농수산물, 동물·식물 검역, 의약품·의료기기, 화장품·퍼스널케어, 화학물질·위험물, 제품적합성, 통신·무선기기, 제한·금지물품 후보를 매핑한다.
  - 공식 출처:
    - Dubai Customs Integrated Customs Tariff: `https://www.dubaicustoms.gov.ae/en/CustomsInformation/Pages/IntegratedCustomsTariff.aspx`
    - Dubai Customs prohibited and restricted goods: `https://www.dubaicustoms.gov.ae/en/mobile/Pages/ProhibitedandRestrictedGoods.aspx`
    - TDRA type approval: `https://tdra.gov.ae/en/about/tdra-sectors/telecommunication/the-technology-development-affairs/type-approval`
    - TDRA equipment registration: `https://tdra.gov.ae/en/Services/equipment-registration`
    - Ministry of Climate Change and Environment: `https://moccae.gov.ae/`
    - Ministry of Health and Prevention: `https://mohap.gov.ae/`
    - Ministry of Industry and Advanced Technology: `https://moiat.gov.ae/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_UAE_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_UAE_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Dubai Customs 또는 UAE 연방 관세 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - MOCCAE, MOHAP, MoIAT, TDRA, Dubai Municipality 품목별 등록·허가 목록을 HS8/HS12 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 스위스 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `CHE` 2025년 관세청 국가별 관세율표 기반 스위스 관세 9,045건 적재.
  - 스위스 목적국 선택 시 `CHE` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 협정 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_switzerland_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/switzerland_import_data_seed.sql`
  - `export_destination_internal_taxes`에 스위스 수입 VAT 표준세율 8.1% 후보 9,045건을 적재한다.
  - 공식 출처:
    - BAZG import VAT on imported goods: `https://www.bazg.admin.ch/en/import-taxes-vat-on-imported-goods`
  - 필수품 2.6% 감면세율, 면세, 특별세와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 스위스 HS4 후보 요건 441건을 적재한다.
  - 식품·농산물·동물성 제품 검역, GMO, 의약품, 의료기기, 화장품·소비재, 화학물질, 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Federal Office for Customs and Border Security: `https://www.bazg.admin.ch/`
    - FSVO imports from third countries: `https://www.blv.admin.ch/blv/it/home/import-und-export/import/importe-aus-drittstaaten.html`
    - FSVO food and consumer goods imports: `https://www.blv.admin.ch/blv/de/home/import-und-export/import/importe-aus-der-eu/lebensmittel-und-gebrauchsgegenstaende.html`
    - FSVO GMO authorisation: `https://www.blv.admin.ch/blv/en/home/lebensmittel-und-ernaehrung/rechts-und-vollzugsgrundlagen/bewilligung-und-meldung/gentechnisch-veraenderte-organismen-gvo.html`
    - Swissmedic licensing: `https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/bewilligungen_zertifikate.html`
    - Swissmedic medical device import: `https://www.swissmedic.ch/swissmedic/en/home/medical-devices/market-access/dispensing---imports.html`
    - swissdamed: `https://www.swissmedic.ch/content/swissmedic/en/home/medizinprodukte/medizinprodukte-datenbank.html`
    - Federal Office of Communications: `https://www.bakom.admin.ch/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_SWITZERLAND_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_SWITZERLAND_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - BAZG 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - FSVO/Swissmedic/BAKOM 품목 목록을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 노르웨이 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `NOR` 2025년 관세청 국가별 관세율표 기반 노르웨이 관세 8,444개 HS 코드 적재.
  - 노르웨이 목적국 선택 시 `NOR` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 협정 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_norway_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/norway_import_data_seed.sql`
  - `export_destination_internal_taxes`에 노르웨이 수입 VAT 표준세율 25% 후보 8,444건을 적재한다.
  - 공식 출처:
    - Norwegian Customs calculation of Norwegian VAT: `https://www.toll.no/en/online-shopping/calculation-norwegian-vat`
    - Norwegian Customs import guide: `https://www.toll.no/en/corporate/import/import-guide-for-beginners`
  - 식품 15%, 면세, 특별세와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 노르웨이 HS4 후보 요건 455건을 적재한다.
  - 식품·농산물, 동물성 제품 국경검사, 의약품, 의료기기, 화장품·소독제, 화학물질, 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - NFSA commercial import of foodstuff: `https://www.mattilsynet.no/en/food-and-beverages/commercial-import-of-foodstuff-to-norway`
    - NFSA products of animal origin from third countries: `https://www.mattilsynet.no/en/food-and-beverages/commercial-import-of-foodstuff-to-norway/control-of-products-of-animal-origin-from-third-countries?noJS=true`
    - Norwegian Medical Products Agency medicines from abroad: `https://www.dmp.no/en/medicinesfromabroad`
    - Norwegian Medical Products Agency medical devices: `https://www.dmp.no/en/medical-devices/sale-import-and-distribution`
    - Norwegian Medical Products Agency disinfectants: `https://www.dmp.no/en/approval-of-medicines/disinfectans---approval-manufacturing-and-import`
    - Nkom import and sale of equipment: `https://nkom.no/frekvenser-og-elektronisk-utstyr/import`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_NORWAY_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_NORWAY_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Tolletaten 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - Mattilsynet/DMP/Nkom 품목 목록을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 아이슬란드 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `ISL` 2025년 관세청 국가별 관세율표 기반 아이슬란드 관세 10,356건 적재.
  - 아이슬란드 목적국 선택 시 `ISL` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 협정 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_iceland_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/iceland_import_data_seed.sql`
  - `export_destination_internal_taxes`에 아이슬란드 수입 VAT 표준세율 24% 후보 10,356건을 적재한다.
  - 공식 출처:
    - Skatturinn key rates and amounts 2026: `https://www.skatturinn.is/english/individuals/key-rates-and-amounts/2026/`
  - 감면세율 11%, 면세, 특별세와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 아이슬란드 HS4 후보 요건 442건을 적재한다.
  - 식품·농산물, 동물성 제품 국경검사, 식물검역, 의약품, 의료기기, 화장품·소비재, 화학물질, 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Iceland Revenue and Customs importing to Iceland: `https://www.skatturinn.is/english/companies/customs-matters/importing-to-iceland/`
    - MAST import of plants: `https://www.mast.is/en/import-export/import-of-plants`
    - MAST import of animal products: `https://www.mast.is/en/import-export/import-of-animal-products`
    - IMA medicines in luggage and postal shipments: `https://www.ima.is/licences/medicines-in-luggage-and-postal-shipments/`
    - IMA import and wholesale distribution licences: `https://www.ima.is/regulated_entities/wholesalers-and-distributors/licenses-for-import-and-wholesale-distribution-of-medicinal-products/`
    - IMA medical devices: `https://www.ima.is/medical-devices/about-medical-devices/`
    - IMA instructions for use: `https://www.ima.is/instructions-for-use/`
    - Icelandic Electronic Communications Office radio equipment licence: `https://www.fjarskiptastofa.is/library?itemid=1273e597-011a-40c9-a7da-7410a02bb231`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_ICELAND_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_ICELAND_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Skatturinn/Iceland Revenue and Customs 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - MAST/IMA/Fjarskiptastofa 품목 목록을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 칠레 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `CHL` 2025년 관세청 국가별 관세율표 기반 칠레 관세 12,244개 HS 코드 적재.
  - 칠레 목적국 선택 시 `CHL` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-칠레 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_chile_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/chile_import_data_seed.sql`
  - `export_destination_internal_taxes`에 칠레 수입 IVA 표준세율 19% 후보 12,244건을 적재한다.
  - 공식 출처:
    - Servicio de Impuestos Internos VAT: `https://www.sii.cl/vat/faq1_eng.html`
  - 면세, 특별세, 품목별 예외와 수입 단계 과세표준은 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 칠레 HS4 후보 요건 442건을 적재한다.
  - SAG 식품·농산물·동물성 제품 검역, ISP 의약품·의료기기·화장품, SUBTEL 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Servicio Nacional de Aduanas: `https://www.aduana.cl/`
    - SAG importaciones y tránsito: `https://www.sag.gob.cl/ambitos-de-accion/importaciones-y-transito`
    - SAG animal requirements: `https://www.sag.gob.cl/ambitos-de-accion/informacion-por-temas`
    - SAG animal import permit: `https://www.sag.gob.cl/ambitos-de-accion/permiso-de-importacion-pecuario`
    - ISP pharmaceutical sanitary registration: `https://www.ispch.gob.cl/anamed/medicamentos/registro-sanitario-de-productos-farmaceuticos/`
    - ISP medical device import: `https://www.ispch.gob.cl/andim/vigilancia-y-fiscalizacion/importacion/`
    - SUBTEL telecom equipment certification: `https://www.subtel.gob.cl/certificacion-de-equipos-de-telecomunicaciones/`
    - SUBTEL short-range equipment certification: `https://www.subtel.gob.cl/certificacion-de-equipos-de-alcance-reducido/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_CHILE_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_CHILE_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Servicio Nacional de Aduanas 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - SAG/ISP/SUBTEL 품목 목록을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 페루 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `PER` 2025년 관세청 국가별 관세율표 기반 페루 관세 11,546건 적재.
  - 페루 목적국 선택 시 `PER` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-페루 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_peru_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/peru_import_data_seed.sql`
  - `export_destination_internal_taxes`에 페루 수입 IGV 표준세율 18% 후보 11,546건을 적재한다.
  - 공식 출처:
    - SUNAT IGV: `https://emprender.sunat.gob.pe/principales-impuestos/impuesto-general-las-ventas-igv/impuesto-general-las-ventas`
    - SUNAT import payments: `https://www.sunat.gob.pe/orientacionaduanera/despsimpimportacion/pagos.html`
  - 면세·비과세, IGV percepción, 특별세와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 페루 HS4 후보 요건 442건을 적재한다.
  - SENASA 식품·농산물·동물성 제품 검역, DIGEMID 의약품·의료기기·화장품, MTC 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - SENASA VUCE procedures: `https://www.senasa.gob.pe/senasa/vuce/`
    - SENASA animal sanitary requirements: `https://www.senasa.gob.pe/senasacontigo/minagri-establece-requisitos-sanitarios-para-la-importacion-de-animales/`
    - DIGEMID: `https://www.digemid.minsa.gob.pe/`
    - MTC homologación de equipos: `https://www.portal.mtc.gob.pe/comunicaciones/control_supervision/homologacion_equipos/homologacion_equipos.html`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_PERU_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_PERU_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - SUNAT 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - SENASA/DIGEMID/MTC 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 콜롬비아 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `COL` 2025년 관세청 국가별 관세율표 기반 콜롬비아 관세 11,511건 적재.
  - 콜롬비아 목적국 선택 시 `COL` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-콜롬비아 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_colombia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/colombia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 콜롬비아 수입 IVA 표준세율 19% 후보 11,511건을 적재한다.
  - 공식 출처:
    - DIAN IVA general: `https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_903539_2022.htm`
    - DIAN importación: `https://www.dian.gov.co/aduanas/paginas/importacion.aspx`
  - 제외·면세, 5% 차등세율, 특별세와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 콜롬비아 HS4 후보 요건을 적재한다.
  - ICA 식품·농산물·동물성 제품 검역, INVIMA 의약품·의료기기·화장품·위생제품, MinTIC/CRC 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - DIAN Consulta Arancel Aduanas: `https://www.dian.gov.co/Transaccional/GuaServiciosLinea/Destinatarios_ConsultaAduanas.pdf`
    - ICA phytosanitary import requirements: `https://www.ica.gov.co/servicios_linea/sispap_principal/consultas/agricola/importacion/como-solicitar-un-documento-de-requisitos-fitosan`
    - ICA animal-origin import requirements: `https://www.ica.gov.co/importacion-y-exportacion/procedimientos-importacion/procedimiento-de-importacion-de-animales-producto/productos-y-subproductos-de-origen-animal-para-1`
    - INVIMA cosmetics: `https://www.invima.gov.co/cosmeticos-aseo-plaguicidas/cosmeticos`
    - INVIMA medical devices: `https://www.invima.gov.co/node/69`
    - MinTIC/CRC telecom homologation: `https://normograma.mintic.gov.co/mintic/compilacion/docs/resolucion_crc_4507_2014.htm`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_COLOMBIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_COLOMBIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - DIAN 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - ICA/INVIMA/MinTIC/CRC 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 코스타리카 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `CRI` 2025년 관세청 국가별 관세율표 기반 코스타리카 관세 17,315건 적재.
  - 코스타리카 목적국 선택 시 `CRI` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-중미 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_costa_rica_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/costa_rica_import_data_seed.sql`
  - `export_destination_internal_taxes`에 코스타리카 수입 IVA 표준세율 13% 후보 17,315건을 적재한다.
  - 공식 출처:
    - Ministerio de Hacienda Tarifas del IVA: `https://www.hacienda.go.cr/docs/TarifasdelIVA.pdf`
    - Ministerio de Hacienda ArancelNet: `https://serviciosnet.hacienda.go.cr/arancelnet/`
  - 감면세율 4%, 2%, 1%, 면세·비과세와 특정 품목 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 코스타리카 HS4 후보 요건을 적재한다.
  - SENASA 식품·농산물·동물성 제품 검역, Ministerio de Salud 의약품·의료기기·화장품·위생제품, SUTEL 통신·무선기기, MEIC 기술규정 후보를 매핑한다.
  - 공식 출처:
    - Dirección General de Aduanas TICA: `https://portaltica.hacienda.go.cr/TicaExterno/hdbaranc.aspx`
    - SENASA sanitary import requirements: `https://www.senasa.go.cr/informacion/Centro-de-informacion/informacion/sgc/dca/dca-pg-02-requisitos-sanitarios-para-importacion`
    - Ministerio de Salud medicine registration: `https://www.ministeriodesalud.go.cr/index.php?catid=34&id=160%3Aregistro-de-medicamentos&view=article`
    - Ministerio de Salud cosmetics registration: `https://www.ministeriodesalud.go.cr/index.php/biblioteca-de-archivos-left/documentos-ministerio-de-salud/ministerio-de-salud/tramites-1/empresariales/registro-de-cosmeticos?format=html`
    - SUTEL homologation: `https://sutel.go.cr/pagina/solicitud-homologacion`
    - MEIC CIOT: `https://www.meic.go.cr/tramites-y-servicios/reglatec/ciot/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_COSTA_RICA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_COSTA_RICA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Hacienda ArancelNet/TICA 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - SENASA/Ministerio de Salud/SUTEL/MEIC 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 파나마 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `PAN` 2025년 관세청 국가별 관세율표 기반 파나마 관세 14,130건 적재.
  - 파나마 목적국 선택 시 `PAN` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-중미 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_panama_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/panama_import_data_seed.sql`
  - `export_destination_internal_taxes`에 파나마 수입 ITBMS 표준세율 7% 후보 14,130건을 적재한다.
  - 공식 출처:
    - DGI ITBMS: `https://dgi.mef.gob.pa/itbms/Itbms`
    - ANA Arancel Interactivo: `https://aranceles.ana.gob.pa/assets/documentos_aduanas/manual/Manual%20Herramienta%20Arancel%20Interactivo_Dic2020_V1.pdf`
  - 주류 10%, 담배 15%, 의약품·식품·농산물 등 비과세·면세와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 파나마 HS4 후보 요건을 적재한다.
  - APA 식품수입 통지, MIDA 식물검역, MINSA 의약품·의료기기·화장품·위생제품, ASEP 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - ANA import context: `https://tramites.ana.gob.pa/w_cifras/`
    - APA food import procedures: `https://apa.gob.pa/en/nosotros/`
    - MIDA phytosanitary import requirements: `https://mida.gob.pa/direcciones/direccion-nacional-de-sanidad-vegetal/requisitos-fitosanitarios-para-importacion/`
    - Ministerio de Salud Panama: `https://www.minsa.gob.pa/`
    - ASEP homologation FAQ: `https://asep.gob.pa/direcciones/telecomunicaciones/guia-y-preguntas-frecuentes/preguntas-frecuentes-sobre-homologacion/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_PANAMA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_PANAMA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - ANA Arancel Interactivo 공식 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - APA/MIDA/MINSA/ASEP 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 온두라스 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `HND` 2025년 관세청 국가별 관세율표 기반 온두라스 관세 10,768건 적재.
  - 온두라스 목적국 선택 시 `HND` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-중미 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_honduras_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/honduras_import_data_seed.sql`
  - `export_destination_internal_taxes`에 온두라스 수입 ISV 표준세율 15% 후보 10,768건을 적재한다.
  - 공식 출처:
    - SAR ISV: `https://www.sar.gob.hn/impuesto-sobre-ventas-isv/`
    - Administración Aduanera clasificación arancelaria: `https://www.aduanas.gob.hn/seccion-clasificacion-arancelaria/`
  - 면세·비과세·차등세율과 특별세는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 온두라스 HS4 후보 요건을 적재한다.
  - SENASA 동물성 제품·검역, ARSA 식품·의약품·의료기기·화장품·위생제품, CONATEL 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - SENASA animal-origin import requirements: `https://senasa.gob.hn/rq-dia-001-requisitos-deimportacion-para-productos-de-origen-animal-a-honduras/`
    - SENASA LANAR: `https://senasa.gob.hn/laboratorio-nacional-de-analisis-de-residuos-lanar/`
    - ARSA food and beverage sanitary registration: `https://new.arsa.gob.hn/registros-sanitarios-alimentos-y-bebidas/`
    - ARSA pharmaceutical products: `https://arsa.gob.hn/productos-farmaceuticos/`
    - CONATEL homologation requirements: `https://www.conatel.gob.hn/doc/simplificacion/requisitos/15.%20REQUISITOS%20PARA%20SOLICITAR%20CERTIFICADO%20DE%20HOMOLOGACI%C3%93N%20DE%20EQUIPOS%20V.2.pdf`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_HONDURAS_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_HONDURAS_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Administración Aduanera 공식 tariff 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - SENASA/ARSA/CONATEL 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 니카라과 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `NIC` 2025년 관세청 국가별 관세율표 기반 니카라과 관세 11,735건 적재.
  - 니카라과 목적국 선택 시 `NIC` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-중미 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_nicaragua_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/nicaragua_import_data_seed.sql`
  - `export_destination_internal_taxes`에 니카라과 수입 IVA 표준세율 15% 후보 11,735건을 적재한다.
  - 공식 출처:
    - DGI IVA: `https://www.dgi.gob.ni/FAQ/impuesto_al_valor_agregado.htm`
    - DGA customs FAQ: `https://www.dga.gob.ni/preguntas01.cfm`
  - 면세·비과세·차등세율, ISC와 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 니카라과 HS4 후보 요건을 적재한다.
  - IPSA 동물성 제품·식물검역, MINSA 식품·의약품·의료기기·화장품·위생제품, TELCOR 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - IPSA requisitos: `https://www.ipsa.gob.ni/Requisitos`
    - IPSA animal quarantine: `https://www.ipsa.gob.ni/CUARENTENA-AGROPECUARIA/Dep-de-Cuarentena-Animal`
    - MINSA food registration: `https://www.minsa.gob.ni/index.php/aplicaciones-y-servicios/registro-sanitario-de-alimento`
    - MINSA pharmaceutical registration: `https://www.minsa.gob.ni/aplicaciones-y-servicios/registro-sanitario-de-productos-farmaceutico`
    - TELCOR homologation: `https://www.telcor.gob.ni/ufaq/que-requisitos-tecnicos-debe-cumplir-un-equipo-para-ser-homologado-por-telcor/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_NICARAGUA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_NICARAGUA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - DGA SAC 공식 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - IPSA/MINSA/TELCOR 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 엘살바도르 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `SLV` 2025년 관세청 국가별 관세율표 기반 엘살바도르 관세 10,766건 적재.
  - 엘살바도르 목적국 선택 시 `SLV` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-중미 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_el_salvador_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/el_salvador_import_data_seed.sql`
  - `export_destination_internal_taxes`에 엘살바도르 수입 IVA 표준세율 13% 후보 10,766건을 적재한다.
  - 공식 출처:
    - Ministerio de Hacienda IVA: `https://www.mh.gob.sv/servicios/mandamientos-de-ingreso-para-cancelar-el-impuesto-del-1-por-retencion-iva-a-domiciliados-y-el-13-por-iva-a-sujetos-excluidos-iva-a-terceros-no-domiciliados-e-iva-por-importacion-de-servicios-softwa/`
    - DGA Sistema Arancelario: `https://sitio.aduana.gob.sv/download/sistema-arancelario/`
  - 면세·비과세·차등세율과 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 엘살바도르 HS4 후보 요건을 적재한다.
  - MAG 동물성 제품·식물검역·CIEX 수입허가, DNM 의약품·의료기기·화장품·위생제품, SIGET 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - MAG animal and plant import authorizations: `https://www.mag.gob.sv/guia-para-autorizaciones-de-importacion-de-productos-y-subproductos-de-origen-animal-azi-y-vegetal-afi/`
    - MAG quarantine and veterinary registry: `https://www.mag.gob.sv/servicios/cuarentena-animal-y-registro-veterinario/`
    - DNM medical and pharmaceutical registrations: `https://expedientes.medicamentos.gob.sv/index.php/insumosMedicos/buscarInsumo`
    - DNM sanitary registration and health products: `https://www.medicamentos.gob.sv/`
    - SIGET telecommunications services: `https://www.siget.gob.sv/gerencias/telecomunicaciones/servicios-telecomunicaciones/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_EL_SALVADOR_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_EL_SALVADOR_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - DGA SAC 공식 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - MAG/DNM/SIGET 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 브라질 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `BRA` 2025년 관세청 국가별 관세율표 기반 브라질 관세 15,044건 적재.
  - 브라질 목적국 선택 시 `BRA` 코드 기준으로 상대국 HS/NCM, 품명, 기본 관세율과 MERCOSUR 등 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_brazil_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/brazil_import_data_seed.sql`
  - `export_destination_internal_taxes`에 브라질 수입 단계 내국세 후보를 적재한다.
    - PIS/PASEP-Importação 2.1% 후보
    - COFINS-Importação 9.65% 후보
    - IPI 품목별 확인 필요
    - ICMS 주별 확인 필요
  - 공식 출처:
    - Receita Federal PIS/COFINS importação: `https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/elaborar-uma-nova-solicitacao-de-di/preenchimento-da-di-1/formularios-de-dados-especificos-da-adicao/aba-tributos-1/campos-relativos-as-contribuicoes-pis-pasep-e-cofins`
    - Receita Federal IPI: `https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/ipi`
    - Receita Federal importação: `https://www.gov.br/receitafederal/pt-br/servicos/aduana/importacao`
  - 브라질은 단일 VAT 구조가 아니므로 사용자 화면에는 세목을 분리해 표시한다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 브라질 HS4/NCM4 후보 요건을 적재한다.
  - Siscomex LPCO/LI, MAPA/Vigiagro 동식물·농식품, ANVISA 의약품·의료기기·화장품·식품/위생제품, ANATEL 통신기기 후보를 매핑한다.
  - 공식 출처:
    - Siscomex tratamento administrativo: `https://www.gov.br/siscomex/pt-br/informacoes/tratamento-administrativos/tratamento-administrativo-na-importacao`
    - MAPA importação: `https://www.gov.br/agricultura/pt-br/internacional/portugues/importacao`
    - MAPA animal: `https://www.gov.br/agricultura/pt-br/internacional/portugues/importacao/animal`
    - ANVISA importação: `https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2024/anvisa-esclarece-sobre-tratamentos-administrativos-na-importacao-de-insumos`
    - ANATEL certificação de produtos: `https://www.gov.br/anatel/pt-br/regulado/certificacao-de-produtos`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_BRAZIL_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_BRAZIL_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Receita Federal/TIPI/NCM 공식 원문을 파싱해 IPI와 품목별 PIS/COFINS 예외를 NCM8 수준으로 좁힌다.
  - ICMS는 목적지 주 선택 UI와 주별 세율 테이블을 추가한 뒤 계산식에 연결한다.
  - Siscomex/MAPA/ANVISA/ANATEL 품목 목록을 HS8/NCM8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 이스라엘 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `ISR` 2025년 관세청 국가별 관세율표 기반 이스라엘 관세 12,916건 적재.
  - 이스라엘 목적국 선택 시 `ISR` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 한-이스라엘 FTA 후보를 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_israel_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/israel_import_data_seed.sql`
  - `export_destination_internal_taxes`에 이스라엘 수입 VAT 표준세율 18% 후보 12,916건을 적재한다.
  - 공식 출처:
    - Israel Tax Authority customs tariff and purchase tax: `https://www.gov.il/en/service/customs-tariff`
    - Israel VAT guidance: `https://www.gov.il/BlobFolder/policy/bileteral-forms-nursing-institutions/he/obligatory_deduction_LTCF_nepali.pdf`
  - 면세, purchase tax, 품목별 예외와 수입 단계 과세표준은 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 이스라엘 HS4 후보 요건을 적재한다.
  - Ministry of Health 식품·의약품·의료기기·화장품, Ministry of Communications 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Ministry of Health animal-derived food import permit: `https://www.gov.il/en/service/animal-derived-food-product-importation`
    - Ministry of Health plant-based food release: `https://www.gov.il/en/service/release-import-status-non-animal-derived-food-product`
    - Ministry of Health registered drug import permit: `https://www.gov.il/en/service/application-to-import-registered-drug-products`
    - Ministry of Health cosmetics data: `https://www.gov.il/en/service/cosmetics-health-data`
    - Ministry of Communications equipment import approval: `https://www.gov.il/en/service/approval_of_wireless_equipment_imported`
    - Ministry of Communications wireless type approval: `https://www.gov.il/en/service/request-type-approval-wireless-device-new`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_ISRAEL_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_ISRAEL_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Israel Tax Authority official tariff/purchase tax 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - Health/Communications 품목 목록을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 우즈베키스탄 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `UZB` 2025년 관세청 국가별 관세율표 기반 우즈베키스탄 관세를 적재한다.
  - 우즈베키스탄 목적국 선택 시 `UZB` 코드 기준으로 상대국 HS, 품명, 기본 관세율과 CIS 등 후보 세율을 표시한다.
  - 공식 원문 파서는 아직 없으며, 현재는 관세청 국가별 관세율표 스냅샷을 기준으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_uzbekistan_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/uzbekistan_import_data_seed.sql`
  - `export_destination_internal_taxes`에 우즈베키스탄 수입 VAT 표준세율 12% 후보를 적재한다.
  - 공식 출처:
    - Uzbekistan VAT guidance: `https://gov.uz/en/miit/sections/view/17619`
  - 면세, excise tax, 품목별 예외와 수입 단계 과세표준은 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 우즈베키스탄 HS4 후보 요건을 적재한다.
  - 수의검역·농식품·식물검역, 의약품·의료기기·화장품, 통신·무선기기 후보를 매핑한다.
  - 공식 출처:
    - Uzbekistan customs import rules: `https://gov.uz/en/advice/NaN/document/1894`
    - Veterinary import certificate: `https://gov.uz/ru/vetgov/sections/view/41101`
    - Uzpharmagency medicines and medical products: `https://gov.uz/en/uzpharmagency/pages/about/`
    - Medical device registration service: `https://my.gov.uz/ru/service/330`
    - MITC telecommunications equipment certification: `https://old.mitc.uz/en/pages/regulation/626`
    - Radio-electronic equipment import permit: `https://oldmy.gov.uz/en/service/922`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_UZBEKISTAN_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_UZBEKISTAN_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - Uzbekistan customs tariff official 원문을 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - 수의검역, Uzpharmagency, 통신장비 품목 목록을 HS8/HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 몽골 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `MNG` 2025년 관세청 국가별 관세율표 기반 몽골 관세 8,882건 적재.
  - 몽골 목적국 선택 시 `MNG` 코드 기준으로 상대국 HS, 품명, 기본 관세율을 표시한다.
  - APTA 특혜 컬럼은 APTA 회원국 원산지 선택 시에만 표시한다. 한국 원산지는 APTA 후보로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_mongolia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/mongolia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 몽골 수입 VAT 표준세율 10% 후보를 적재한다.
  - 공식/공공 출처:
    - Invest Mongolia taxation: `https://investmongolia.gov.mn/taxation/`
  - 특별소비세, 면세·영세율, 품목별 예외는 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 몽골 HS4 후보 요건을 적재한다.
  - 농식품·식물·동물검역, 의약품·의료기기, 화장품 표시·안전 후보를 매핑한다.
  - 공식 출처:
    - Mongolia customs tariff law: `https://www.wipo.int/wipolex/edocs/lexdocs/laws/en/mn/mn020en.html`
    - Mongolia customs law: `https://www.vertic.org/media/National%20Legislation/Mongolia/MN_Customs_Law.pdf`
    - Law of Mongolia on Medicines and Medical Devices: `https://legalinfo.mn/en/edtl/16760184774901`
    - Ministry of Food, Agriculture and Light Industry: `https://mofa.gov.mn/`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_MONGOLIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_MONGOLIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - 몽골 관세청/세관 공식 최신 tariff source를 직접 확보해 관세청 스냅샷을 최신 원문 기준으로 교체한다.
  - 식품·검역·의약품·의료기기 수입허가 목록을 HS8 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.

## 러시아 1차 상태

- 현재 조회 가능 관세율:
  - `export_destination_tariff_rates`에 `RUS` 2025년 관세청 국가별 관세율표 기반 러시아 관세 17,872건 적재.
  - 러시아 목적국 선택 시 `RUS` 코드 기준으로 상대국 HS, 품명, 기본 관세율을 표시한다.
  - 현재 관세청 스냅샷에는 협정·특혜세율 컬럼이 없어 기본 관세율 중심으로 표시한다.
- 내국세 1차 매핑:
  - 생성 스크립트: `scripts/generate_russia_import_data_seed.py`
  - 생성 시드: `supabase/seed/generated/russia_import_data_seed.sql`
  - `export_destination_internal_taxes`에 러시아 수입 VAT 후보를 적재한다.
    - 일반 후보: 22%
    - 일부 식품·의약품류 후보: 10%
  - 공식 출처:
    - Federal Tax Service Russia 2026 VAT changes: `https://www.nalog.gov.ru/new2026/`
  - 10% 대상 세부 목록, 면세, 소비세, 특례는 러시아 세법상 품목 조건별 보강 대상으로 둔다.
- 수입요건 1차 매핑:
  - 같은 생성 스크립트가 `export_destination_import_requirements`에 러시아 HS4 후보 요건을 적재한다.
  - EAEU 기술규정/EAC, Rospotrebnadzor 위생·소비자보호, Rosselkhoznadzor 동식물 검역, Roszdravnadzor 의료제품, 러시아 수입통제·제재·이중용도 후보를 매핑한다.
  - 공식 출처:
    - Federal Customs Service of Russia: `https://customs.gov.ru/`
    - Eurasian Economic Commission: `https://eec.eaeunion.org/en/`
    - EAEU technical regulations: `https://eec.eaeunion.org/en/comission/department/deptexreg/tr/`
    - Rospotrebnadzor: `https://www.rospotrebnadzor.ru/`
    - Rosselkhoznadzor: `https://fsvps.gov.ru/`
    - Roszdravnadzor medical products import: `https://roszdravnadzor.gov.ru/en/medproducts/import`
- 적용 방식:
  - `scripts/apply_lookup_seed_bundle.sh`에서 `APPLY_RUSSIA_IMPORT_DATA=1` 기본값으로 함께 적용한다.
  - 새 자료로 다시 생성할 때는 `GENERATE_RUSSIA_IMPORT_DATA=1`을 지정한다.
- 다음 보강:
  - EAEU common customs tariff와 러시아 FCS 원문을 직접 파싱해 관세청 스냅샷을 최신 공식 원문 기준으로 교체한다.
  - EAEU TR 목록, Rospotrebnadzor/Rosselkhoznadzor/Roszdravnadzor 품목 목록을 HS10 수준으로 연결해 HS4 후보 매핑을 실제 요건으로 좁힌다.
  - 러시아향 거래는 수입국 요건과 별도로 한국 수출통제·대러 제재·금융/물류 제한 스크리닝을 강화한다.

## 국가별 확장 절차

중국에서 검증한 확장 순서는 다른 국가에도 그대로 적용한다.

1. 출처 레지스트리 등록
   - `export_destination_data_sources_seed.sql`에 관세율, 내국세, 수입요건 출처를 각각 등록한다.
   - 공식 링크, 로컬 다운로드 경로, 접근 방식, 커넥터 상태를 notes에 남긴다.
2. 원문 파일 보관
   - `data/external/{country}/` 아래에 PDF/XLSX/CSV 원문을 저장한다.
   - 원문 파일은 `.gitignore` 대상이므로, 링크와 다운로드 방법은 문서와 seed notes에 남긴다.
3. 관세율 파서 작성
   - 국가별 공식 형식에 맞는 `scripts/generate_{country}_{year}_tariff_seed.py`를 만든다.
   - 출력은 `export_destination_tariff_rates`로 통일한다.
   - 기존 연도 데이터는 `effective_to`로 닫고 새 연도는 `effective_from` 기준으로 조회되게 한다.
4. 내국세 파서 작성
   - VAT/GST/소비세/부가세 감면을 `export_destination_internal_taxes`에 분리 적재한다.
   - 기본세율과 예외세율이 함께 있을 경우 예외세율이 더 구체적인 HS 코드로 조회되게 한다.
5. 수입요건 파서 작성
   - 세관 확인, 검사검역, 제품별 인증, 라벨링, 통관허가를 `export_destination_import_requirements`로 분리한다.
   - 같은 요건의 기관만 다른 경우 requirement를 중복 표시하지 않고 상세에서 기관 목록을 표시한다.
6. 검증
   - 대표 HS6/HS8/HS10 샘플을 정해 관세율, 내국세, 요건이 서로 같은 기준연도로 조회되는지 확인한다.
   - `npm run typecheck`, `npm run lint`, 관련 repository 테스트, `npm run build`를 통과시킨다.

### 4단계: 화면 표시

수출 모드 10자리 조회:

- 상대국 수입 HS/관세율
- 상대국 수입요건
- 상대국 HS 후보별 상세 팝업
- 데이터 미보유 국가는 “표시할 상대국 수입요건 데이터가 없습니다” 유지

## 메모

트레이드내비식 기능은 가능하지만, 공개 API 하나로 끝나는 구조가 아니다. 관세율은 비교적 구조화되어 있고, 수입요건은 국가별 부처·품목별 규정·통제목록이 분산되어 있다. 따라서 국가별 커넥터를 점진적으로 붙이는 방식이 현실적이다.
