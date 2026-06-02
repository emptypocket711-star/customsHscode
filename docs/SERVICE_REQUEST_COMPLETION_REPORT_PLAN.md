# Service Request Completion Report Plan

이 문서는 운송·통관 요청이 `completed` 상태가 된 뒤 결과 메타데이터, 정산 요약, 최종 보관 서류 묶음을 저장하고 보여주기 위한 모델 초안이다.

현재 구현은 `service_requests.status = completed`, 완료 audit event, 완료 후 feedback skeleton까지 있다. 아직 없는 것은 완료 결과 원장이다. `PostCompletionPlaceholder`가 안내하는 항목을 실제 데이터 모델로 바꾸는 다음 단계가 이 문서의 범위다.

상태 전이와 제출·확인·잠금 권한은 [SERVICE_REQUEST_COMPLETION_REPORT_TRANSITIONS.md](./SERVICE_REQUEST_COMPLETION_REPORT_TRANSITIONS.md)를 기준으로 구현한다.

PDF/프린트 미리보기 구조와 민감정보 제외 규칙은 [SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md](./SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md)를 기준으로 구현한다.

## Product Boundary

완료 리포트는 법적 확정 판정 도구가 아니라 플랫폼 거래 종료 기록이다.

- 운송 완료 리포트: 최종 운임·추가비용, 선적·도착 일정, B/L 또는 AWB 등 보관 서류 묶음
- 통관 완료 리포트: 신고번호, 수리일, 납부세액 요약, 신고필증·C/O·CI·PL 등 보관 서류 묶음
- 공통: requester와 선정 파트너가 서로 같은 완료 결과를 확인하고, 운영자는 분쟁·품질 관리를 위해 열람한다.

통관 리포트가 HS, FTA, 요건 내용을 포함할 때는 반드시 “예비 조회”와 “실제 신고 결과”를 분리한다. HSK 확정, FTA 적용, 요건 충족 여부를 플랫폼이 직접 확정한 것처럼 표시하지 않는다.

## MVP Tables

### `service_request_completion_reports`

요청 1건당 최대 1개의 완료 리포트 draft를 둔다.

- `id uuid primary key`
- `request_id uuid not null references service_requests(id)`
- `request_type service_request_type not null`
- `requester_company_id uuid not null references companies(id)`
- `selected_partner_company_id uuid not null references companies(id)`
- `status text not null check in ('draft', 'submitted', 'requester_acknowledged', 'partner_acknowledged', 'operator_reviewed', 'locked', 'voided')`
- `summary text`
- `currency text`
- `final_amount numeric`
- `settlement_items jsonb not null default '[]'::jsonb`
- `timeline_events jsonb not null default '[]'::jsonb`
- `clearance_result jsonb not null default '{}'::jsonb`
- `freight_result jsonb not null default '{}'::jsonb`
- `source_snapshot jsonb not null default '{}'::jsonb`
- `created_by uuid references auth.users(id)`
- `submitted_by uuid references auth.users(id)`
- `submitted_at timestamptz`
- `locked_by uuid references auth.users(id)`
- `locked_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

권장 unique:

- `(request_id)` where `status <> 'voided'`

`settlement_items`는 MVP에서 JSON으로 시작한다. 실제 정산/세금계산서/결제까지 확장하면 별도 정산 테이블로 분리한다.

`source_snapshot`에는 리포트 생성 시점의 요청 상태, 선택된 bid 요약, 선택된 파트너, 기준일, 조회 출처 요약을 저장한다. 선적서류 원문, invoice line item 원문, 주민번호·개인 연락처 같은 민감값은 넣지 않는다.

MVP 기본 snapshot 구조:

- `snapshot_version`: `completion-report-source-v1`
- `request`: request id, request type, request status, direction, basis date, source HS request id, lookup snapshot 존재 여부
- `selected_bid`: selected bid id, selected partner company id, bid type, bid status, selected at
- `lookup`: 요청 생성 시 사용한 `source_lookup_snapshot`
- `safety`: 법적 확정 아님, HS 확정 아님, 법률성 출력은 담당자 검토 필요

사용자가 추가 `sourceSnapshot` payload를 전달해도 서버가 위 기본 구조를 덮어써서 source-locked report 기준을 유지한다.

### `service_request_completion_report_documents`

기존 `service_request_documents`를 최종 리포트에 연결하는 매핑 테이블이다. 파일을 복제하지 않는다.

- `id uuid primary key`
- `completion_report_id uuid not null references service_request_completion_reports(id)`
- `request_document_id uuid not null references service_request_documents(id)`
- `document_role text not null`
- `required_for_archive boolean not null default false`
- `added_by uuid references auth.users(id)`
- `created_at timestamptz`

권장 unique:

- `(completion_report_id, request_document_id)`

`document_role` 예:

- 운송: `final_bl_or_awb`, `commercial_invoice`, `packing_list`, `freight_invoice`, `delivery_note`
- 통관: `import_declaration_certificate`, `tax_payment_receipt`, `commercial_invoice`, `packing_list`, `certificate_of_origin`, `product_spec`

## Type-Specific JSON Shape

### Freight Result

`freight_result` 최소 shape:

```json
{
  "carrier": "string",
  "blOrAwbNo": "string",
  "departureDate": "YYYY-MM-DD",
  "arrivalDate": "YYYY-MM-DD",
  "originPort": "string",
  "destinationPort": "string",
  "deliveryCompletedAt": "ISO datetime",
  "exceptions": ["string"]
}
```

### Clearance Result

`clearance_result` 최소 shape:

```json
{
  "declarationNo": "string",
  "acceptedAt": "YYYY-MM-DD",
  "releasedAt": "YYYY-MM-DD",
  "declaredHskCode": "string",
  "originCountryCode": "string",
  "ftaAgreementName": "string",
  "taxSummary": [
    { "label": "관세", "amount": 0, "currency": "KRW" }
  ],
  "cautions": ["string"]
}
```

`declaredHskCode`는 실제 신고 결과 메타데이터로 저장할 수 있지만, 화면에서는 “신고 결과 기준”으로 표시한다. 품명 AI 추천이나 예비 조회 결과와 혼동시키지 않는다.

## RLS And Mutation Rules

직접 `update` RLS는 열지 않고 RPC로만 상태 전환과 쓰기 처리를 한다.

읽기:

- 요청 회사 구성원: 자기 요청 완료 리포트 read
- 선정 파트너 회사 구성원: 자기 회사가 선정된 요청의 완료 리포트 read
- staff/admin/developer: 운영 목적 read
- 매칭만 된 미선정 파트너: read 불가

쓰기:

- `create_or_update_completion_report(p_request_id, p_payload jsonb)`:
  - `service_requests.status = 'completed'` 또는 `in_progress`에서만 허용 여부를 명확히 선택한다. MVP 권장은 `completed` 이후 생성이다.
  - requester, selected partner, staff/admin만 호출 가능
  - selected bid 존재와 selected partner 일치 검증
  - payload schema 검증
- `submit_completion_report(p_report_id)`:
  - draft만 submitted로 변경
  - audit event `service_request_completion_report_submitted`
- `acknowledge_completion_report(p_report_id)`:
  - requester/partner 각각 확인 상태 기록
  - 원문 메모는 audit metadata에 저장하지 않음
- `lock_completion_report(p_report_id)`:
  - 운영자 또는 양측 확인 후 잠금
  - 잠금 후 문서 매핑 수정 불가

Audit metadata에는 request id, report id, actor role, status transition, item counts만 저장한다. 파일명, 신고번호, invoice 원문, 비용 상세 원문은 audit에 넣지 않는다.

## Source And Legal Safety

완료 리포트는 다음을 분리해야 한다.

- 플랫폼 요청 출처: 요청 본문, 선택된 bid, 공개 문서 목록
- 외부/공식 근거 출처: HS/요건/FTA 조회 snapshot이 포함된 경우 `source_name`, `source_url`, `source_version`, `effective_from`, `effective_to`, `retrieved_at`, `checksum` 유지
- 실제 업무 결과: 신고번호, 수리일, B/L 번호, 정산 금액 등 파트너가 입력한 거래 결과

화면 문구:

- 사용 가능: “신고 결과 기준”, “업무 완료 기록”, “최종 보관 서류”, “추가 확인 필요”
- 피해야 함: “법적 확정”, “요건 없음 확정”, “FTA 적용 보장”, “HSK 확정”

통관 완료 리포트에 HSK·FTA·요건 내용이 보이면 담당자 검토 또는 실제 신고 결과 출처가 무엇인지 같이 표시한다.

## UI Entry Points

1. 요청자 상세 `completed` 영역
   - 완료 리포트 상태
   - 최종 정산 요약
   - 보관 서류 체크리스트
   - 양측 확인 상태
2. 선정 파트너 opportunity 상세 `completed` 영역
   - 리포트 작성 또는 보완 CTA
   - 제출 전 누락 서류 표시
3. 운영 상세
   - 리포트 미작성 완료 건
   - 리포트 제출 후 미확인 건
   - 잠금 전 민감 문서 공개 범위 점검

## Implementation Rails

1. P35.2 completion report migration 초안
   - table, indexes, RLS, RPC skeleton, governance tests
2. P35.3 repository/action layer
   - read model, schema validation, RPC wrappers, unit tests
3. P35.4 completed UI skeleton
   - 요청자/선정 파트너 상세의 리포트 상태 카드와 작성 CTA
4. P35.5 document archive mapping
   - 기존 `service_request_documents`를 최종 보관 역할로 연결
5. P35.6 operations visibility
   - 완료됐지만 리포트가 없는 요청, 제출됐지만 확인되지 않은 요청을 운영 통계에 추가
6. P36.1 completion report UI archive mapping
   - 상세 화면 완료 리포트 패널에서 기존 요청 서류를 최종 보관 역할로 연결
7. P36.2 submit/acknowledge transition plan
   - 초안, 제출, 양측 확인, 운영 검토, 잠금 상태 전이와 RPC 경계 정의
8. P36.3 submit UI skeleton
   - 상태별 CTA, 상대방 확인 필요, 운영 검토 필요, 잠금 후 수정 불가 안내
9. P38.2 completion report preview plan
   - PDF/프린트 확장 전 미리보기 read model, 출력 섹션, source lock, 안전 고지 정의

## Open Questions

- 완료 리포트 생성 시점을 `in_progress`부터 허용할지, `completed` 이후로 제한할지 정해야 한다. MVP는 `completed` 이후 제한이 단순하다.
- requester와 selected partner가 서로 다른 최종 금액을 주장할 때 별도 dispute 상태를 둘지 정해야 한다.
- 정산을 단순 기록으로 둘지, 결제/세금계산서 기능과 연결할지 런칭 후 결정한다.
- 통관 신고번호, B/L 번호 등 업무 식별값을 검색 인덱싱할지 여부는 개인정보·영업정보 노출 리스크를 보고 별도 결정한다.
