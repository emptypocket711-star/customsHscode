# Product Spec — HS FINDER

## One-line Definition

수출입 화주, 해외 거래처, 포워더, 관세사를 연결해 운송 견적과 통관 의뢰를 주고받게 하고, HS CODE·관세율·수입요건·서류진단 기능으로 요청 품질과 거래 신뢰도를 높이는 무역 실무 플랫폼.

HS CODE 조회, 품명 AI 검색, 관세율/요건 조회, 중고차 수출 도구, 무역뉴스는 독립 목적이 아니라 견적 요청, 통관 의뢰, 파트너 매칭을 시작하게 만드는 부가 능력이다.

## Target Users

1. 국내 수입업체
2. 국내 수출업체
3. 해외 수출자/수입자
4. 포워더/물류사
5. 관세사무소
6. 제조업체 무역팀
7. 해외구매대행/쇼핑몰 셀러
8. 향후 확장 파트너: 창고, 내륙운송, 인증·검사·보험·원산지 지원 업체

## Paid Value

Users pay for reducing:
- 포워더/관세사 탐색 시간
- 견적 비교와 회신 왕복
- 선적서류 전달 누락
- 업체별 응답 품질 편차
- 통관 지연
- 요건 미비
- FTA 적용 누락
- HS 오분류 리스크
- 고객-관세사무소 자료 왕복
- 수출 전략물자 리스크
- C/O 발급 준비 누락

## Platform MVP Positioning

The MVP should prove that HS FINDER can generate and route real trade-service requests, not only answer lookup questions.

### Account Types

1. 수출/수입 화주
2. 포워더
3. 관세사무소
4. 해외 수입자/수출자

Initial verification is tiered:

- 이메일 인증
- 회사명, 국가, 담당자, 연락처, 웹사이트 입력
- 사업자등록증, 회사등록증, 관세사 등록증, 포워더 등록증 등 증빙 업로드
- 운영자 수동 승인
- 거래 이력 기반 신뢰 등급

국가별 사업자번호 실시간 검증은 MVP 범위에서 제외한다. 중국, 미국, EU 등 해외 업체는 처음에는 서류 제출과 운영자 승인 중심으로 검증한다.

### Freight Quote Request

화주 또는 해외 거래처가 선적서류와 기본 운송 조건을 올리고 운송 견적을 요청한다.

필수 입력:

- 수출/수입 구분
- 출발국, 출발지, 도착국, 도착지
- 운송 방식: 해상 FCL/LCL, 항공, 특송, 미정
- Incoterms
- 품명 요약
- 포장 수량, 중량, CBM
- 희망 출항/도착일 또는 마감일
- Commercial Invoice, Packing List, B/L 또는 AWB, C/O, 제품 카탈로그 등 첨부

상태:

- 임시저장
- 견적 모집중
- 견적 도착
- 업체 선정됨
- 진행중
- 완료
- 취소
- 만료

### Forwarder Bid Flow

포워더는 조건에 맞는 견적 요청 목록을 보고 입찰한다.

목록 판단 정보:

- 수출/수입
- 출발국/도착국
- 운송 방식
- 품목 요약
- 예상 중량/CBM/수량
- 서류 첨부 여부
- 견적 마감 시간
- 현재 입찰 수
- 화주 검증 상태

상세 화면:

- 요청 상세와 첨부 서류 확인
- 질의 또는 보완 요청
- 견적 단가 입력
- 견적서 또는 청구서 업로드
- 견적 유효기간
- 예상 리드타임

### Customs Clearance Request

화주가 통관 의뢰 요청을 생성하면 관세사무소가 통관 수수료와 검토 가능 여부를 입찰한다.

필수 판단 정보:

- 수입/수출
- HS CODE 있음/없음
- 품명, 용도, 재질, 모델
- 서류 첨부 여부
- 예상 신고 건수
- 수입요건 또는 수출요건 확인 필요 여부
- FTA 적용 희망 여부
- 긴급 여부

관세사무소 입찰:

- 통관 수수료
- 검토 가능 여부
- 필요 추가서류
- 예상 리드타임
- 견적서 업로드
- 메모

### Notification Policy

전체 업체에게 매번 알림을 보내지 않는다.

- 새 요청 생성 시 조건에 맞는 업체에게 1회 알림
- 마감 전 리마인드는 관심 조건이 맞고 아직 입찰하지 않은 업체에게 제한적으로 발송
- 요청 수정 알림은 이미 관심 표시 또는 입찰한 업체에게 우선 발송
- 포워더/관세사무소는 관심 조건을 설정할 수 있어야 한다.

관심 조건 예:

- 수입/수출
- 국가
- 항공/해상/FCL/LCL/특송
- 품목군
- 중고차
- 항만/공항
- 긴급 건 가능 여부

### Marketplace Principle

최저가 입찰만 강조하지 않는다. 가격 경쟁만 만들면 포워더와 관세사무소가 이탈할 수 있다.

화주 비교 화면은 다음 기준을 함께 보여준다.

- 가격
- 응답 속도
- 검증 상태
- 전문 분야
- 견적 유효기간
- 예상 리드타임
- 서류 보완 요청 품질
- 플랫폼 거래 이력

## Entry Modes

### 1. Quote and Clearance Request

User uploads documents or enters shipment information, then creates a freight quote request or customs clearance request.

This is the primary product path.

### 2. Integrated HS/Product Lookup

User enters HS4, HS6, HSK10, or product name in one search box.

Lookup behavior:
- HS4 input shows matching HS6 groups and lower HSK rows.
- HS6 input shows all matching HSK rows under that HS6.
- HSK10 input shows the selected item detail, same-HS6 rows, tariff rates, standard names, and requirements.
- Product-name input shows matching HSK/HS6 rows with neutral match information.
- HSK and HS6 values are clickable and preserve import/export mode, country, and basis date.
- Import mode prioritizes Korean tariff and import requirement information.
- Export mode prioritizes selected destination-country tariff information.

### 2. Shipping Document Upload

User uploads documents and app extracts data.

## Customer-Facing Lookup Output

The customer-facing integrated lookup screen is informational and self-service. It should not present staff review workflow, advisory wording, or source-reference explanations as the primary UX.

- HS confirmation requests, paid staff review credits, and review monetization are dormant internal capabilities until a customs-office review partner and pricing policy are defined.
- HS6/HSK hierarchy
- Korean and English item names
- quantity and weight units
- basic tariff
- WTO tariff
- FTA/agreement rates when available
- standard product names and required specs
- customs-confirmation import requirements
- selected destination-country tariff rates for export mode
- basis date and compact source/version metadata

Lookup screens should provide contextual actions:

- 이 품목으로 운송 견적 요청
- 이 품목으로 통관 의뢰 요청
- 이 조회 결과를 요청서에 첨부
- 서류를 업로드해 요청서 자동 작성

## Import Diagnosis Output

- HSK candidate or selected HSK
- 품명 / 표준품명 / 필수규격
- 기본세율
- WTO 협정세율
- FTA 협정세율
- C/O 발급 가능성
- C/O 발급방식
- 원산지결정기준
- 직접운송 요건
- 세관장확인 수입요건
- 통합공고/개별법령 주의
- 요건 취득방법
- 고객 요청자료
- 담당자 검토 포인트
- 출처 및 조회기준일

## Export Diagnosis Output

- HSK candidate or selected HSK
- 수출신고 품명·규격 가이드
- 세관장확인 수출요건
- 통합공고/개별법령 수출요건
- 전략물자 예비 리스크
- 자가판정/전문판정 안내
- 수출허가/상황허가 가능성
- FTA C/O 발급 가능성
- 원산지증빙자료
- 상대국 수입세율 조회 메모
- 바이어 제출서류
- 출처 및 조회기준일

## Report Disclaimer

본 리포트는 업로드된 서류와 조회기준일 현재 수집·검토된 공식 데이터 및 내부 룰을 기반으로 한 AI 예비진단 자료입니다. 품목분류, 관세율, FTA 협정관세 적용, 원산지 충족 여부, 수출입요건 해당 여부, 전략물자 해당 여부는 신고시점의 법령, 세관 심사, 관계기관 확인 및 담당자 검토에 따라 달라질 수 있습니다.
