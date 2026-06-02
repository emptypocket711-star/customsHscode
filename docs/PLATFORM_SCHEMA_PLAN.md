# Platform Schema Plan

이 문서는 HS FINDER를 단순 조회 도구에서 수출입 화주, 해외 거래처, 포워더, 관세사를 연결하는 marketplace 플랫폼으로 전환하기 위한 DB/RLS 설계 초안이다.

현재 단계에서는 설계 고정용 문서이며, migration은 별도 작업에서 작성한다.

## Current Structure

현재 계정/회사 구조:

- `profiles`
  - `role`: `client`, `customs_staff`, `admin`, `developer`
  - `account_type`: `personal`, `company`
  - `company_role`: `admin`, `member`
  - `company_id`
  - `allowed_ip_count`
  - `onboarding_completed_at`
- `companies`
  - `name`
  - `business_no`
  - `type`
  - `business_types`: `customs_broker`, `forwarder`, `exporter`, `importer`
- 회원가입 UI
  - 현재는 개인회원/기업회원 2분기
  - 기업회원에서 업무 유형을 복수 선택
- 문서 업로드
  - `case_documents`가 `hs_search_requests`에 직접 연결됨
  - private bucket `case-documents`
  - storage path는 `company_id/...` 기반
- 주요 RLS 패턴
  - 회사 사용자는 `company_id = current_company_id()`
  - staff/admin/developer는 광범위 접근
  - published 법령/관세/요건 데이터는 authenticated 사용자에게 공개

## Current Gaps For Marketplace

현재 구조만으로는 아래 흐름을 안전하게 표현하기 어렵다.

1. 포워더/관세사가 다른 회사의 견적 요청을 조건부로 열람
2. 요청 생성 전후로 문서 열람 범위가 달라지는 상태
3. 업체 검증 상태와 증빙 서류 승인
4. 해외 업체의 국가별 사업자 검증 보류/수동 승인
5. 운송 견적과 통관 의뢰를 하나의 요청 흐름으로 비교
6. 입찰 가능 업체 매칭과 알림 피로도 제어
7. 최저가만이 아닌 검증 상태, 응답속도, 전문분야, 리드타임 비교

따라서 `profiles.role`은 앱 권한용으로 유지하고, marketplace 역할과 검증 상태는 `companies` 중심으로 확장하는 것이 안전하다.

## Design Decision

권장 방향:

- `user_role`은 그대로 둔다.
  - 앱 권한: `client`, `customs_staff`, `admin`, `developer`
- marketplace 역할은 회사 단위로 관리한다.
  - 한 회사가 수입자이면서 포워더일 수 있기 때문이다.
- `business_types`는 유지하되, 구조화된 서비스 프로필과 검증 상태를 추가한다.
- 운송 견적과 통관 의뢰는 공통 `service_requests`와 공통 `service_bids`를 두고, 상세 필드는 type별 detail table로 분리한다.
- 문서는 기존 `case_documents`를 즉시 변경하지 않고, 새 marketplace 문서 테이블을 둔다.
  - 기존 HS/문서진단 기능과 marketplace 요청 문서의 권한이 다르기 때문이다.

## Proposed Enums

```sql
create type marketplace_party_type as enum (
  'domestic_shipper',
  'foreign_shipper',
  'forwarder',
  'customs_broker',
  'support_partner'
);

create type company_verification_status as enum (
  'unverified',
  'email_verified',
  'documents_submitted',
  'operator_approved',
  'trade_history',
  'recommended_partner',
  'suspended',
  'blocked'
);

create type service_request_type as enum (
  'freight',
  'clearance'
);

create type service_request_status as enum (
  'draft',
  'open',
  'bids_received',
  'partner_selected',
  'in_progress',
  'completed',
  'cancelled',
  'expired',
  'hidden'
);

create type service_bid_status as enum (
  'draft',
  'submitted',
  'withdrawn',
  'shortlisted',
  'selected',
  'rejected',
  'expired',
  'hidden'
);
```

## Company And Verification Extensions

### `companies` add columns

- `country_code text`
- `website_url text`
- `contact_name text`
- `contact_phone text`
- `contact_email text`
- `verification_status company_verification_status not null default 'unverified'`
- `verified_at timestamptz`
- `verified_by uuid references auth.users(id)`
- `suspended_at timestamptz`
- `blocked_at timestamptz`
- `trust_score integer not null default 0`

### `company_party_types`

한 회사가 여러 역할을 가질 수 있게 별도 테이블로 둔다.

- `id uuid primary key`
- `company_id uuid references companies(id)`
- `party_type marketplace_party_type`
- `is_primary boolean`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz`

unique:

- `(company_id, party_type)`

초기 migration은 기존 `companies.business_types`를 아래처럼 backfill한다.

- `importer`, `exporter` -> `domestic_shipper`
- `forwarder` -> `forwarder`
- `customs_broker` -> `customs_broker`

RLS:

- 회사 구성원은 자기 회사 역할만 select
- 역할 변경은 사용자 직접 write가 아니라 운영자 승인 또는 service-role 서버 액션으로 처리
- developer/admin은 전체 관리

### `company_verification_documents`

업체 검증용 증빙 문서.

- `id uuid primary key`
- `company_id uuid references companies(id)`
- `uploaded_by uuid references auth.users(id)`
- `document_type text`
- `file_name text`
- `storage_bucket text default 'company-verification-documents'`
- `storage_path text`
- `status text check in ('submitted', 'approved', 'rejected')`
- `review_note text`
- `reviewed_by uuid references auth.users(id)`
- `reviewed_at timestamptz`
- `created_at timestamptz`

RLS:

- 회사 구성원은 자기 회사 증빙만 insert/select
- developer/admin은 전체 select/update
- 일반 marketplace 파트너에게 증빙 파일 원문은 노출하지 않음

## Partner Preferences

### `partner_service_preferences`

포워더/관세사무소가 어떤 요청을 받고 싶은지 저장한다.

- `id uuid primary key`
- `company_id uuid references companies(id)`
- `service_type service_request_type`
- `directions text[]` import/export
- `origin_country_codes text[]`
- `destination_country_codes text[]`
- `transport_modes text[]`
- `cargo_tags text[]`
- `ports text[]`
- `urgent_available boolean`
- `notification_enabled boolean`
- `digest_enabled boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

RLS:

- 해당 회사 관리자만 CRUD
- developer/admin 전체 관리

## Service Requests

### `service_requests`

운송 견적과 통관 의뢰의 공통 요청 본문.

- `id uuid primary key`
- `request_type service_request_type`
- `requester_company_id uuid references companies(id)`
- `created_by uuid references auth.users(id)`
- `direction request_direction`
- `status service_request_status`
- `title text`
- `product_summary text`
- `hsk_code text`
- `hs6 text`
- `origin_country_code text`
- `export_country_code text`
- `shipment_country_code text`
- `destination_country_code text`
- `incoterms text`
- `deadline_at timestamptz`
- `preferred_start_date date`
- `preferred_arrival_date date`
- `visibility text check in ('matched_partners', 'invited_only', 'private')`
- `source_hs_request_id uuid references hs_search_requests(id)`
- `source_lookup_snapshot jsonb`
- `missing_information jsonb not null default '[]'::jsonb`
- `internal_note text`
- `created_at timestamptz`
- `updated_at timestamptz`
- `published_at timestamptz`
- `expired_at timestamptz`

`source_lookup_snapshot`에는 사용자에게 보여준 HS/관세/요건 요약을 저장한다. 단, 확정 표현을 넣지 않고 예비 조회/추가 확인 필요 문구를 유지한다.

### `freight_request_details`

- `request_id uuid primary key references service_requests(id)`
- `transport_mode text`
- `load_type text` FCL/LCL/air/express/unknown
- `origin_place text`
- `destination_place text`
- `origin_port text`
- `destination_port text`
- `package_count numeric`
- `package_unit text`
- `gross_weight numeric`
- `weight_unit text`
- `cbm numeric`
- `container_type text`
- `hazardous boolean`
- `temperature_controlled boolean`
- `used_car boolean`
- `vehicle_vin text`

### `clearance_request_details`

- `request_id uuid primary key references service_requests(id)`
- `hs_code_known boolean`
- `fta_preference_requested boolean`
- `requirements_check_needed boolean`
- `urgent boolean`
- `estimated_declaration_count integer`
- `product_material text`
- `product_usage text`
- `model_name text`
- `required_review_points jsonb not null default '[]'::jsonb`

## Request Documents

### `service_request_documents`

Marketplace 요청에 붙는 문서. 기존 `case_documents`와 분리한다.

- `id uuid primary key`
- `request_id uuid references service_requests(id)`
- `requester_company_id uuid references companies(id)`
- `uploaded_by uuid references auth.users(id)`
- `document_type document_type`
- `file_name text`
- `storage_bucket text default 'service-request-documents'`
- `storage_path text`
- `mime_type text`
- `file_size bigint`
- `checksum text`
- `visibility text check in ('requester_only', 'matched_partner_after_interest', 'selected_partner', 'operator_only')`
- `created_at timestamptz`

초기 MVP 권장:

- 요청 목록에서는 문서 원문 미노출
- 파트너가 상세 진입/관심 표시 후 제한 열람
- 선정된 파트너는 전체 열람
- 운영자는 신고/검증 목적 열람
- storage path는 최소 `{company_id}/{request_id}/...` 형식을 사용하고, 업로드 정책은 회사 prefix와 요청 소유권을 함께 확인

## Partner Visibility

### `service_request_partner_matches`

요청 생성 시 조건에 맞는 업체를 계산해 저장한다. 알림과 RLS에서 모두 사용한다.

- `id uuid primary key`
- `request_id uuid references service_requests(id)`
- `partner_company_id uuid references companies(id)`
- `matched_by text`
- `match_reason jsonb`
- `notification_status text`
- `notified_at timestamptz`
- `interest_status text check in ('none', 'viewed', 'interested', 'declined')`
- `created_at timestamptz`

RLS:

- 요청 회사는 자기 요청의 match 목록 select
- 파트너 회사는 자기 회사 match row만 select하고 관심 상태는 RPC로만 변경
- developer/admin 전체 관리

## Service Bids

### `service_bids`

운송 견적과 통관 견적의 공통 입찰.

- `id uuid primary key`
- `request_id uuid references service_requests(id)`
- `bidder_company_id uuid references companies(id)`
- `created_by uuid references auth.users(id)`
- `bid_type service_request_type`
- `status service_bid_status`
- `currency text`
- `total_amount numeric`
- `included_costs jsonb not null default '[]'::jsonb`
- `excluded_costs jsonb not null default '[]'::jsonb`
- `valid_until date`
- `lead_time_days integer`
- `message text`
- `quote_file_document_id uuid references service_request_documents(id)`
- `created_at timestamptz`
- `updated_at timestamptz`
- `submitted_at timestamptz`
- `selected_at timestamptz`

unique:

- `(request_id, bidder_company_id)` for active non-hidden bid

### `freight_bid_details`

- `bid_id uuid primary key references service_bids(id)`
- `freight_rate_amount numeric`
- `local_charge_amount numeric`
- `surcharge_amount numeric`
- `transit_time_days integer`
- `free_time_note text`
- `carrier_note text`

### `clearance_bid_details`

- `bid_id uuid primary key references service_bids(id)`
- `brokerage_fee_amount numeric`
- `review_available boolean`
- `additional_documents_required jsonb not null default '[]'::jsonb`
- `risk_note text`
- `expected_clearance_days integer`

## Questions And Messages

### `service_request_questions`

견적 전 보완 질문. 채팅 전체를 처음부터 만들지 않고, 요청별 질문/답변 구조로 시작한다.

- `id uuid primary key`
- `request_id uuid references service_requests(id)`
- `bidder_company_id uuid references companies(id)`
- `asked_by uuid references auth.users(id)`
- `question text`
- `answer text`
- `answered_by uuid references auth.users(id)`
- `answered_at timestamptz`
- `created_at timestamptz`

RLS:

- 요청 회사와 질문한 파트너 회사만 select

## Completion Reports

선정 이후 완료 리포트와 최종 보관 서류 묶음은 별도 계획 문서 [SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md](./SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md)를 기준으로 구현한다.

초기 원칙:

- `service_requests.status = completed` 자체와 완료 리포트 원장을 분리한다.
- 기존 `service_request_documents` 파일을 복제하지 않고 완료 리포트 문서 매핑 테이블로 연결한다.
- 요청 회사, 선정 파트너, staff/admin만 읽고, 미선정 파트너는 읽지 못한다.
- 직접 update RLS 대신 RPC-only mutation으로 생성, 제출, 확인, 잠금을 처리한다.
- 요청 회사는 answer update
- 파트너 회사는 question insert

## RLS Matrix

| Resource | Requester company | Matched partner | Bidder partner | Selected partner | Other partner | Developer/Admin |
| --- | --- | --- | --- | --- | --- | --- |
| `service_requests` draft | CRUD own | none | none | none | none | all |
| `service_requests` open | read/update own | read matched summary | read if bid exists | read selected | none | all |
| `freight_request_details` | CRUD own | read matched | read if bid exists | read selected | none | all |
| `clearance_request_details` | CRUD own | read matched | read if bid exists | read selected | none | all |
| `service_request_documents` requester_only | CRUD own | none | none | none | none | all |
| `service_request_documents` matched | CRUD own | read after interest | read | read | none | all |
| `service_bids` | read bids for own request | insert/update own bid | CRUD own bid | read own selected bid | none | all |
| `service_request_partner_matches` | read own request matches | read own match, update interest through RPC | read own match | read own match | none | all |
| `service_request_questions` | read own request questions, answer through RPC | ask/read own questions | ask/read own questions | ask/read own questions | none | all |

## RLS Helper Functions

Recommended helper functions:

```sql
public.current_company_id()
public.current_user_role()
public.is_staff_or_admin()
public.is_company_admin()

public.company_has_party_type(company_id uuid, party_type marketplace_party_type)
public.current_company_has_party_type(party_type marketplace_party_type)
public.is_company_verified_for_marketplace(company_id uuid)
public.can_read_service_request(request_id uuid)
public.can_read_service_request_document(document_id uuid)
public.can_bid_on_service_request(request_id uuid)
public.set_service_request_partner_interest(match_id uuid, interest_status text)
public.answer_service_request_question(question_id uuid, answer text)
```

Avoid embedding long repeated `exists (...)` logic in every policy once marketplace rules become complex.

## Recommended Build Order

1. Add company marketplace role and verification schema.
2. Add partner preferences.
3. Add `service_requests`, detail tables, partner match table, and bid tables.
4. Add request document table and private storage bucket.
5. Add RLS helper functions and policies.
6. Add RPCs for constrained workflow mutations:
   - `select_service_bid(p_bid_id)` before exposing bid comparison UI.
   - `set_service_request_partner_interest(p_match_id, p_interest_status)` before exposing partner opportunity actions.
   - `answer_service_request_question(p_question_id, p_answer)` before exposing Q&A answers.
7. Add repository tests for RLS assumptions where possible.
8. Build UI in this order:
   - request creation draft
   - shipper request list
   - partner opportunity list
   - bid submit
   - shipper bid comparison
   - operator verification screen

## Open Questions

1. 해외 업체도 처음부터 문서 원문을 볼 수 있게 할지, 국내 파트너만 허용할지.
2. 포워더와 관세사무소가 같은 회사일 때 운송/통관 동시 입찰을 허용할지.
3. 견적 요청 공개 시간을 기본 24시간으로 할지 48시간으로 할지.
4. 입찰 수를 화주에게 실시간으로 보여줄지, 마감 후 비교하게 할지.
5. 문서 열람을 관심 표시 직후 허용할지, 운영자 승인된 파트너만 허용할지.
6. 통관 의뢰는 관세사무소 `operator_approved` 이상만 입찰 가능하게 할지.

## Non-Negotiable Safety Rules

- HS, 관세율, 요건, FTA 결과는 확정 표현을 쓰지 않는다.
- marketplace 요청에 붙는 HS/요건 정보도 `예비 조회`, `가능성 있음`, `추가 확인 필요` 문구를 유지한다.
- 문서 원문, invoice 내용, 업체 증빙 원문은 client log에 남기지 않는다.
- 업체 검증 문서는 일반 파트너에게 노출하지 않는다.
- 요청 문서는 RLS와 private bucket path를 동시에 제한한다.
