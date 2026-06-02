# Platform RLS Test Matrix

이 문서는 `20260531012000_platform_marketplace_schema.sql` 초안의 RLS 기대 동작을 검증하기 위한 테스트 계획이다.

현재 단계에서는 테스트 설계 문서이며, 실제 Supabase migration 적용 후 SQL/RPC 테스트로 전환한다.

## Test Actors

| Actor | Company role | Marketplace role | Verification | Purpose |
| --- | --- | --- | --- | --- |
| `shipper_owner` | requester company admin | `domestic_shipper` | `operator_approved` | 운송/통관 요청 생성자 |
| `shipper_member` | requester company member | `domestic_shipper` | `operator_approved` | 같은 회사 구성원 |
| `forwarder_verified` | partner company admin | `forwarder` | `operator_approved` | 운송 견적 입찰 가능 업체 |
| `forwarder_unverified` | partner company admin | `forwarder` | `documents_submitted` | 요청은 match되어도 입찰 차단 |
| `broker_verified` | partner company admin | `customs_broker` | `operator_approved` | 통관 의뢰 입찰 가능 업체 |
| `other_forwarder` | unrelated company admin | `forwarder` | `operator_approved` | match되지 않은 타 업체 |
| `developer` | internal admin | `developer` role | n/a | 전체 운영 확인 |

## Seed Scenario

1. `shipper_owner`가 freight `service_request`를 `draft`로 생성한다.
2. freight detail과 request document를 추가한다.
3. 요청을 `open`으로 바꾼다.
4. `service_request_partner_matches`에 `forwarder_verified`와 `forwarder_unverified`를 추가한다.
5. `other_forwarder`는 match row가 없다.
6. `forwarder_verified`가 interest를 `viewed` 또는 `interested`로 바꾼다.
7. `forwarder_verified`가 bid를 제출한다.
8. `broker_verified`에 대해서는 별도 clearance request를 생성해 같은 흐름을 반복한다.

## Service Request Access

| Case | Expected |
| --- | --- |
| requester company reads own draft request | allowed |
| requester company updates own draft request | allowed |
| requester company updates open request | allowed for requester-authored fields only in app layer |
| matched verified forwarder reads open freight request | allowed |
| matched unverified forwarder reads open freight request summary | allowed |
| unmatched forwarder reads request | denied |
| verified broker reads freight request without match | denied |
| developer reads any request | allowed |

Note:

- RLS can allow requester update on open request, but server actions must restrict which fields can change after bids arrive.
- Partner read access depends on `service_request_partner_matches`, not only party type.

## Bid Access

| Case | Expected |
| --- | --- |
| verified matched forwarder inserts freight bid | allowed |
| unverified matched forwarder inserts freight bid | denied |
| verified unmatched forwarder inserts freight bid | denied |
| verified broker inserts freight bid | denied |
| verified broker inserts clearance bid on matched clearance request | allowed |
| bidder reads own bid | allowed |
| requester reads bids for own request | allowed |
| other partner reads bid | denied |
| bidder updates own draft/submitted bid | allowed |
| bidder changes own submitted bid to `selected` directly | denied by app/repository tests; selection must use RPC |
| requester updates bidder-authored price fields | denied; selection must use RPC |
| developer manages bids | allowed |

Important design point:

- Bid selection should be implemented with a dedicated `select_service_bid(p_bid_id)` SECURITY DEFINER RPC.
- That RPC should:
  - verify requester owns the request
  - set selected bid to `selected`
  - set other submitted bids to `rejected`
  - set request status to `partner_selected`
  - write an audit log
  - avoid modifying bidder-authored amount, currency, included/excluded costs, message, and lead time
- Partner interest changes should use `set_service_request_partner_interest(p_match_id, p_interest_status)`.
  Direct partner updates must not mutate `match_reason`, `notification_status`, or `notified_at`.
- Requester answers should use `answer_service_request_question(p_question_id, p_answer)`.
  Direct requester updates must not mutate `question`, `asked_by`, or `bidder_company_id`.

## Document Access

| Case | Expected |
| --- | --- |
| requester reads own request documents | allowed |
| matched partner reads `requester_only` document | denied |
| matched partner reads `matched_partner_after_interest` before interest | denied |
| matched partner reads `matched_partner_after_interest` after viewed/interested | allowed |
| selected partner reads `selected_partner` document | allowed |
| unselected partner reads `selected_partner` document | denied |
| unrelated company reads any request document | denied |
| developer reads any request document | allowed |
| partner reads company verification documents | denied |
| company reads own verification documents | allowed |

Storage expectations:

- `company-verification-documents` path first segment must be `company_id`.
- `service-request-documents` path first segment must be `requester_company_id`.
- Metadata RLS and storage object RLS must both pass.

## Partner Match Access

| Case | Expected |
| --- | --- |
| requester reads matches for own request | allowed |
| matched partner reads own match row | allowed |
| matched partner updates own `interest_status` through RPC | allowed |
| matched partner directly updates `match_reason` or notification fields | denied |
| matched partner changes another partner match | denied |
| unrelated company reads match list | denied |
| developer manages matches | allowed |

## Questions Access

| Case | Expected |
| --- | --- |
| matched verified partner asks question on request | allowed |
| unmatched partner asks question | denied |
| requester reads questions for own request | allowed |
| requester answers question through RPC | allowed |
| requester directly updates question text or bidder company | denied |
| other partner reads question | denied |
| developer reads questions | allowed |

## Verification And Role Access

| Case | Expected |
| --- | --- |
| company admin creates own `company_party_types` row | allowed |
| company member creates own party type row | denied |
| company uploads own verification document | allowed |
| company edits verification approval status | denied |
| developer approves verification document | allowed |
| unverified partner receives match but cannot bid | allowed read, denied bid |
| blocked company reads marketplace opportunities | denied by DB helper even if RLS match exists |

Partner preferences:

- 회사 관리자만 관심 조건을 등록/수정한다.
- 일반 구성원은 파트너 기회 목록을 볼 수 있더라도 회사 전체 알림 조건을 바꾸지 못한다.

## Repository Test Targets

When implementing repositories, add tests for:

1. `can_bid_on_service_request`
   - verified matched forwarder true
   - unverified matched forwarder false
   - verified unmatched forwarder false
   - wrong party type false
2. request listing query
   - requester sees own requests
   - partner sees matched requests only
3. document listing query
   - visibility rules by interest/selected state
4. bid mutation
   - bidder can draft/submit/withdraw own bid
   - requester cannot mutate bidder terms
   - selection only through RPC/service action
5. partner preferences
   - only own company admin can manage preferences
   - developer can audit all

## Manual Review Checklist Before Applying Migration

1. Confirm whether `service_requests`/`service_bids` common model is still preferred over separate freight/clearance top-level tables.
2. Confirm whether unverified but matched partners can read request summary.
3. Confirm when documents become visible to partners.
4. Confirm default quote window: 24 hours or 48 hours.
5. Confirm whether matched but unverified partners can read document summaries.
6. Add repository tests around `select_service_bid` before exposing shipper comparison UI.
7. Add repository tests around partner interest and Q&A answer RPCs before exposing partner opportunity actions.
