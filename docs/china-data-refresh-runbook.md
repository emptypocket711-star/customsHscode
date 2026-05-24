# 중국 수입국 데이터 갱신 런북

작성일: 2026-05-23

## 목적

수출 모드에서 중국 목적국 조회에 쓰는 상대국 HS, 관세율, 내국세, 수입요건 데이터를 다음 연도에도 같은 방식으로 갱신하기 위한 절차다.

## 현재 데이터 범위

중국 데이터는 다음 테이블에 적재한다.

- `export_destination_tariff_rates`
- `export_destination_customs_codes`
- `export_destination_internal_taxes`
- `export_destination_import_requirements`
- `export_destination_data_sources`

현재 기준 주요 source version:

- `china-import-export-tariff-2026`
- `china-customs-declaration-codes-2026:*`
- `china-import-internal-tax-2026:*`
- `china-cosmetics-import-requirements-2026`
- `china-cites-import-requirements-2026`
- `china-processed-food-import-requirements-2026:*`
- `china-electrical-ccc-import-requirements-2026`
- `china-pharma-medical-import-requirements-2026:*`
- `china-chemical-import-requirements-2026:*`
- `china-textile-apparel-import-requirements-2026`

## 원문 보관 위치

원문 파일은 git에 올리지 않고 `data/external/china/`에 보관한다.

현재 보관 파일:

- `china-import-export-tariff-2026.pdf`
- `china-2026-import-vat-consumption-tax-partial-goods.xlsx`
- `china-2026-import-vat-9pct-non-full-tariff-items.pdf`

`.gitignore`에 `data/external/`이 포함되어 있으므로 다운로드 링크와 절차는 문서에 남긴다.

## 공식 출처

### 관세율

- 중국 재정부 2026 세칙 PDF  
  `https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/P020251231607833453633.pdf`
- 중국 해관총서 세율조회  
  `https://online.customs.gov.cn/ociswebserver/pages/jckspsl/index.html`

### 내국세

- 중국 VAT 법/시행령 안내  
  `https://www.chinatax.gov.cn/eng/c101269/c5246628/content.html`
- 재정부/세무총국 2026년 제9호 9% VAT 범위 공고  
  `https://www.mof.gov.cn/jrttts/202602/t20260203_3983174.htm`
- 해관총서 2026년 제15호 9% 수입단계 VAT 비전세목 상품번호표  
  `http://www.customs.gov.cn/customs/2026-02/03/article_2026020318010783852.html`
- 해관총서 2025년 제260호 첨부2 수입단계 VAT/소비세 정책 상품번호표  
  `http://www.customs.gov.cn/customs/2025-12/31/article_2025123118010783852.html`

### 수입요건

- NMPA 화장품 등록·비안  
  `https://english.nmpa.gov.cn/2022-06/30/c_961747.htm`
- NMPA 화장품 등록·비안 자료  
  `https://english.nmpa.gov.cn/2021-03/04/c_661069.htm`
- NMPA 화장품 라벨  
  `https://english.nmpa.gov.cn/2021-06/03/c_644360.htm`
- 중국 멸종위기 야생동식물 수출입 관리 조례  
  `https://www.gov.cn/gongbao/content/2019/content_5468888.htm`
- GACC 248호령 수입식품 해외생산기업 등록  
  `https://www.gov.cn/gongbao/content/2021/content_5616161.htm`
- GACC 280호령 수입식품 해외생산기업 등록  
  `https://www.gov.cn/gongbao/2025/issue_12426/202511/content_7049741.html`
- GACC 249호령 수입식품 안전관리  
  `https://www.gov.cn/gongbao/content/2021/content_5621202.htm`
- SAMR/CNCA CCC 대상 목록  
  `https://www.samr.gov.cn/cms_files/filemanager/samr/www/samrnew/samrgkml/nsjg/rzjgs/202004/W020200428419284306124.pdf`
- NMPA 의약품 등록  
  `https://english.nmpa.gov.cn/2022-06/30/c_785628.htm`
- 중국 약품관리법 수입 항구 신고  
  `https://english.nmpa.gov.cn/2019-09/26/c_773012_2.htm`
- NMPA 의료기기 등록·비안  
  `https://english.nmpa.gov.cn/2024-06/05/c_1049323.htm`
- 위험화학품 등록 시스템  
  `https://whpdj.mem.gov.cn/`
- ODS/HFC 수입허가 목록  
  `https://fta.mofcom.gov.cn/english/mywj/mywj_301.pdf`
- 농약관리  
  `http://www.moa.gov.cn/ztzl/nybrl/nygl/`
- 고체폐기물 수입규제  
  `https://english.mee.gov.cn/`
- GB 18401 섬유제품 기본 안전기술규범  
  `https://www.codeofchina.com/standard/GB18401-2010.html`
- GB 5296.4 의류·섬유제품 표시사항  
  `https://www.codeofchina.com/standard/GB5296.4-2012.html`
- GB 31701 영유아·아동 섬유제품 안전기술규범  
  `https://www.chinesestandard.net/PDF.aspx/GB31701-2015`

## 갱신 순서

1. 새 연도 중국 세칙 PDF를 `data/external/china/`에 저장한다.
2. `scripts/generate_china_2026_tariff_seed.py`를 새 연도 파일명과 source version에 맞게 복제 또는 수정한다.
3. 새 관세율 seed를 생성한다.
4. 10자리 신고상품번호 보강 원천을 확인한다.
   - 한국 관세청 국가별 관세율표의 중국 10자리 후보
   - GACC 비전세목 첨부자료
   - 세율조회/통관 파라미터 자료
5. `scripts/generate_china_2026_customs_codes_seed.py`를 새 연도 기준으로 갱신한다.
6. VAT, 소비세, 특례세율 자료를 다운로드하고 `scripts/generate_china_internal_tax_seed.py`를 갱신한다.
7. 품목군별 수입요건 seed를 점검한다.
   - 법령이나 표준이 바뀐 경우 `source_version`, `effective_from`, `effective_to`, `source_url`을 갱신한다.
   - 기준일 전환이 있는 경우 구버전과 신버전을 동시에 적재하고 effective date로 분기한다.
8. `supabase/seed/generated/export_destination_data_sources_seed.sql`의 출처 레지스트리를 갱신한다.
9. 로컬 DB에 적용한다.

```bash
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  scripts/apply_lookup_seed_bundle.sh
```

## 검증 쿼리

대표 품목 샘플:

- 화장품: `33049900`, `3304990021`
- 식품: `19059000`, `2202100010`
- 전기전자: `84151010`, `85076000`, `85165000`, `85287212`, `85366900`
- 의약품/의료기기: `30049090`, `30024100`, `30059010`, `90189030`, `90215000`
- 화학제품: `28054000`, `38089210`, `38253000`, `38275100`
- 의류: `61091000`, `62052000`, `6110200010`, `6209300000`

```sql
select destination_hs_code, requirement_name, source_version, effective_from, effective_to
from public.export_destination_import_requirements
where country_code = 'CHN'
  and destination_hs_code in ('33049900', '38275100', '61091000')
  and status = 'published'
order by destination_hs_code, requirement_name;
```

```sql
select destination_hs_code, base_rate_text, agreement_rates, tariff_year, source_version
from public.export_destination_tariff_rates
where country_code = 'CHN'
  and destination_hs_code in ('33049900', '85076000')
  and status = 'published';
```

```sql
select destination_hs_code, tax_name, rate_text, source_version
from public.export_destination_internal_taxes
where country_code = 'CHN'
  and destination_hs_code in ('33049900', '85076000')
  and status = 'published';
```

## 완료 전 체크

```bash
npm run test -- server/repositories/export-destination-tariff.repository.test.ts server/repositories/export-destination-import-data.repository.test.ts
npm run typecheck
npm run lint
npm run build
```

## 주의점

- 중국 공식 관세표는 8자리 기준이고, 통관 신고상품번호는 별도 10자리 체계다.
- 한국 HSK 10자리와 중국 10자리는 직접 일치한다고 보면 안 된다. 조회는 한국 코드의 HS6를 기준으로 중국 후보를 보여주고, 중국 10자리 후보 클릭 시 해당 중국 기준 상세를 보여준다.
- 내국세는 기본 VAT와 예외 VAT, 소비세 정책대상이 분리된다. 세율이 확인되지 않은 소비세 정책대상은 임의 계산하지 않는다.
- 수입요건은 HS만으로 확정되지 않는 경우가 많다. 제품 용도, 성분, 정격, 연령대, 라벨 표시, 제조공정 등 품목 조건을 notes와 상세 팝업에 남긴다.
