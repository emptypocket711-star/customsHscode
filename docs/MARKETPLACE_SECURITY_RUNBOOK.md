# Marketplace Security Runbook

이 문서는 marketplace 요청, 입찰, 알림, 회사 역할, 운영 화면에서 직접 호출 우회나 RLS 오류가 의심될 때의 대응 순서다.

## Incident Intake

먼저 아래 정보만 남긴다. 비밀번호, session cookie, service-role key, invoice 원문, 주민등록번호, 전체 사업자 서류는 기록하지 않는다.

- 발견 시각
- 발견 경로
- 사용자 이메일 일부 또는 profile id
- 회사 id
- request id, bid id, match id, document id
- 기대한 권한
- 실제로 보인 화면 또는 RPC 결과
- 재현 가능 여부

## Immediate Triage

1. 현재 배포와 DB 상태를 확인한다.

```bash
vercel env run -e preview -- npm run health:db
vercel env run -e preview -- npm run smoke:marketplace-schema
```

2. 직접 호출 우회가 의심되면 Preview DB negative suite를 실행한다.

```bash
E2E_TEST_PASSWORD='...' \
vercel env run -e preview -- sh -c 'E2E_ALLOW_REMOTE_MARKETPLACE_TRANSACTION=true node scripts/seed_marketplace_transaction_fixture.mjs && E2E_ALLOW_REMOTE_MARKETPLACE_RLS_NEGATIVE=true npm run smoke:marketplace-rls-negative'
```

3. 운영 화면 접근 문제가 의심되면 operations guard를 실행한다.

```bash
vercel env run -e preview -- npm run smoke:operations:guard -- https://your-preview-url.vercel.app
```

4. 브라우저 거래 흐름까지 의심되면 staging suite 또는 관련 단일 E2E를 실행한다.

```bash
vercel env run -e preview -- npm run smoke:staging:suite -- https://your-preview-url.vercel.app
```

## Classification

| Symptom | Class | First check |
| --- | --- | --- |
| 사용자가 타 회사 요청을 읽음 | RLS read boundary | `smoke:marketplace-rls-negative` |
| 사용자가 공개 요청 상태나 견적 상태를 직접 변경 | RPC-only state transition | audit log, RLS negative suite |
| 포워더가 통관 의뢰에 운송 견적을 제출 | partner type boundary | bid RPC negative checks |
| 일반 사용자가 developer role 또는 company admin으로 상승 | profile privilege boundary | profile self-update negative check |
| developer RPC가 일반 actor id로 성공 | role review boundary | role review actor check |
| 알림이 opt-out 또는 digest 정책과 다르게 발송 | notification policy | notification worker rehearsal |
| 운영 화면이 일반 계정에 노출 | operations route guard | `smoke:operations:guard` |
| migration 적용 후 table/function 누락 | schema drift | `health:db`, preview migration runbook |

## Containment

- 데이터는 삭제하지 않는다. 증거 보존이 우선이다.
- 회사 단위 위험이면 운영 화면 또는 후속 migration/RPC로 `verification_status`를 `suspended` 또는 `blocked` 상태로 전환한다.
- 계정 탈취가 의심되면 Supabase Auth에서 해당 사용자 세션을 회수하고 비밀번호 재설정을 요구한다.
- service-role key, Vercel bypass secret, job worker secret이 노출됐을 가능성이 있으면 즉시 rotate한다.
- 잘못된 RLS/policy/function은 직접 rollback하지 않고 후속 migration으로 수정한다.
- 사용자에게는 법적 확정 표현을 쓰지 않는다. 필요한 경우 `예비진단`, `추가 확인 필요`, `담당자 검토 필요` 문구를 사용한다.

## Evidence Queries

필요한 최소 id만 조회한다. 문서 원문, invoice 전체 내용, API key는 조회하거나 로그로 남기지 않는다.

```sql
select id, actor_id, company_id, action, created_at
from public.audit_logs
where created_at >= now() - interval '24 hours'
order by created_at desc
limit 100;
```

```sql
select id, requester_company_id, request_type, status, visibility, published_at
from public.service_requests
where id = '<request-id>';
```

```sql
select id, request_id, partner_company_id, interest_status, notification_status, created_at
from public.service_request_partner_matches
where request_id = '<request-id>'
order by created_at desc;
```

```sql
select id, request_id, bidder_company_id, bid_type, status, submitted_at
from public.service_bids
where request_id = '<request-id>'
order by created_at desc;
```

## Fix Path

1. 실패한 경계를 `docs/PLATFORM_RLS_TEST_MATRIX.md`의 항목에 매핑한다.
2. 재현이 가능한 negative test를 먼저 추가한다.
3. 필요한 경우 migration으로 RLS, trigger, RPC guard를 수정한다.
4. `docs/PREVIEW_MIGRATION_RUNBOOK.md` 순서로 Preview DB에 dry-run 후 적용한다.
5. `health:db`, `smoke:marketplace-schema`, `smoke:marketplace-rls-negative`를 실행한다.
6. 화면 영향이 있으면 관련 browser E2E 또는 `smoke:staging:suite`를 실행한다.
7. WORK_LOG에 원인, 수정, 검증 명령, 남은 위험을 남긴다.

## Do Not Do

- 사용자 세션 쿠키, 비밀번호, service-role key를 로그나 문서에 남기지 않는다.
- invoice 원문, 첨부 파일명 전체, 개인식별정보를 issue 본문에 붙이지 않는다.
- Supabase migration을 직접 rollback하지 않는다.
- 실패 원인을 확인하기 전 RLS를 임시로 끄지 않는다.
- AI 답변으로 법적 확정 또는 HS 확정을 공지하지 않는다.
