# 조회 거버넌스 점검

점검일: 2026-05-25

## 적용 범위

이 문서는 HS CODE 직접 조회, 수입 진단, 해외 HS CODE/관세율 조회, 목적국 수입요건/내국세/추가관세/무역구제 조회에서 지켜야 할 운영 규칙을 정리한다.

핵심 원칙은 다음과 같다.

- 조회는 `basisDate`를 기준으로 한다.
- 법령/세율/요건/HS 데이터는 `status = published`만 사용자 화면에 노출한다.
- `effective_from <= basisDate` 및 `effective_to is null or effective_to >= basisDate` 조건을 같이 적용한다.
- 사용자가 입력한 품명은 GPT 정규화 결과의 HS4/HS6/HSK 후보를 우선 표시한다. 공식 HS/세율/요건 데이터는 후보 확정이 아니라 하위 세번 상세와 downstream 조회에만 사용한다.
- 관세청 HS부호검색 API018은 실시간 사용자 조회에 쓰지 않고, 월 1회 저장·중복 제거·검토 후 보조 데이터로만 사용한다.
- 민감한 사용자 데이터와 법령 데이터는 Supabase RLS 정책 아래 둔다.

## 현재 고정한 사항

- 메인 대시보드의 데이터 현황 카운트도 기준일 기준 `published` 데이터만 집계하도록 정리했다.
- `hs_master`, `tariff_rates`, `requirements`, 해외 목적국 데이터 조회 저장소는 기준일 필터를 유지한다.
- `server/repositories/lookup-governance.test.ts`에서 핵심 조회 저장소의 기준일 필터와 RLS 마이그레이션 선언을 파일 레벨로 감시한다.
- 검색 인덱스는 `20260524039000_lookup_performance_indexes.sql`에서 HS/세율/요건/품명 조회용으로 1차 반영되어 있다.
- 무거운 작업 분리는 `background_jobs` 기반으로 시작했고, 문서 추출 작업은 운영 플래그가 켜진 경우 백그라운드 작업으로 등록된다.
- `hs_favorites`, `hs_lookup_history`, `account_access_events`, `active_user_sessions`는 RLS 적용과 회사/개발자 범위 정책을 테스트로 감시한다.
- `account_access_events` insert는 service role만 수행하도록 후속 hardening migration을 적용했다.

## 예외 및 이유

- `export_destination_country_coverage`는 사용자별 법률 판정 결과가 아니라 국가별 적재 현황 집계용 materialized view다. 뷰 내부에서 현재일 기준 published 집계를 사용한다.
- `export_destination_data_sources`는 데이터 출처 카탈로그 성격이라 effective date 필드를 두지 않는다. 사용자에게 세율/요건 판정을 제공하는 테이블은 별도 기준일 필터를 적용한다.
- 파일 레벨 테스트는 쿼리 누락을 조기에 잡기 위한 가드다. 실제 DB 성능은 운영 Supabase에서 `EXPLAIN ANALYZE`와 쿼리 로그로 별도 확인해야 한다.

## 다음 점검 항목

- 운영 Supabase에서 주요 조회 쿼리의 실행 계획 확인
- route별 rate limit 수치 조정 및 사용자/회사 단위 quota 정책 확정
- GPT 정규화 캐시 hit/miss 로그를 서버 전용 로그로만 집계
- 사업자등록번호 상태조회 API는 런칭 후 별도 연동한다. 현재 가입 화면은 숫자 10자리 형식만 검증한다.
- 문서 업로드 재개 시 XLS 변환/OCR 작업을 전부 background job으로 분리
- 법령/세율 데이터 갱신 배치의 checksum 및 publish 승인 흐름 자동 점검
