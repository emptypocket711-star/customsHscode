# Roadmap

운영 작업 기록은 [WORK_LOG.md](./WORK_LOG.md), 주요 제품·기술 결정은 [DECISIONS.md](./DECISIONS.md)에 별도로 남긴다.

## 진행 보고 규칙

앞으로 작업 완료 보고에는 항상 아래 두 항목을 함께 표시한다.

- 완료된 작업: 이번 턴에서 실제 반영, 검증, 커밋, 배포 확인까지 끝난 항목
- 다음 작업: 아직 남은 항목 중 우선순위가 높은 작업

## Current Phase Status

현재 제품은 단순 MVP 부트스트랩 단계를 지나, 제한 공개 테스트와 운영 안정화 사이에 있다.

## Platform MVP Rebaseline

제품 방향은 단순 HS CODE 안내 사이트가 아니라, 수출입 화주·해외 거래처·포워더·관세사를 이어주는 무역 실무 연결 플랫폼으로 재정의한다.

기존 HS CODE 조회, 품명 AI 검색, 관세율/요건 조회, 중고차 수출, 무역뉴스는 제거하지 않는다. 다만 핵심 목적은 정보 제공 자체가 아니라 견적 요청, 통관 의뢰, 파트너 매칭을 시작하게 만드는 신뢰 도구로 둔다.

### MVP Goal

1차 MVP는 아래 가설을 검증한다.

- 화주는 선적서류와 기본 정보를 올려 운송 견적 또는 통관 의뢰를 요청할 수 있다.
- 포워더와 관세사무소는 조건에 맞는 요청을 확인하고 견적을 제출할 수 있다.
- 화주는 받은 견적을 비교하고 업체를 선택할 수 있다.
- HS/품명/요건 조회 결과는 요청서를 더 정확하게 만드는 보조 데이터로 연결된다.
- 해외 수출자/수입자도 회사 정보와 증빙 서류를 제출해 한국 포워더/관세사무소와 연결될 수 있다.

### Rebased Phase Plan

| Phase | 상태 | 목표 | 핵심 산출물 |
| --- | --- | --- | --- |
| Platform Phase 0. 방향 전환 고정 | 진행 | HS 도구 중심에서 연결 플랫폼 중심으로 제품 문서와 IA 재정리 | PRODUCT_SPEC, ROADMAP, DECISIONS 갱신 |
| Platform Phase 1. 회원 유형·검증 기반 | 예정 | 화주, 포워더, 관세사무소, 해외 업체를 계정 구조에서 명확히 분리 | account type, company profile, verification status, 증빙 업로드 |
| Platform Phase 2. 운송 견적 요청 MVP | 예정 | 화주가 서류와 운송 조건을 올리고 포워더에게 견적을 받을 수 있게 함 | quote request, attachment, deadline, forwarder bid, shipper comparison |
| Platform Phase 3. 통관 의뢰 요청 MVP | 예정 | 화주가 통관 의뢰를 올리고 관세사무소가 수수료와 조건을 제안 | clearance request, broker bid, 추가서류 요청, 리드타임 |
| Platform Phase 4. 알림·관심 조건 | 예정 | 전체 알림 남발 없이 조건에 맞는 업체에게만 요청 노출·알림 | partner preferences, notification policy, reminder rules |
| Platform Phase 5. 조회 도구와 요청 연결 | 진행 | HS/품명/관세/요건/중고차 도구에서 견적·의뢰 요청으로 전환 | “이 품목으로 견적 요청”, “통관 의뢰 요청”, 조회 결과 첨부 |
| Platform Phase 6. 거래 신뢰·운영 관리 | 예정 | 최저가 경쟁만 막고 검증, 응답속도, 전문분야, 거래 이력 기반 비교 제공 | verification badges, response metrics, admin approval, abuse handling |

### Platform Execution Rail

플랫폼 전환 작업은 큰 Phase만 보고 움직이지 않는다. 아래의 작은 레일을 순서대로 완료하고, 각 레일은 코드 반영과 검증 기준을 함께 만족해야 완료로 본다.

| Rail | 상태 | 이전 작업과의 차이 | 완료 조건 | 검증 |
| --- | --- | --- | --- | --- |
| P0.1 제품 방향 고정 | 완료 | 기존 HS 조회 SaaS 문서를 연결 플랫폼 문서로 재정의 | PRODUCT_SPEC, ROADMAP, DECISIONS에 플랫폼 목적 반영 | 문서 용어 검색 |
| P0.2 플랫폼 DB/RLS 초안 | 로컬 진행 | 제품 문서가 아니라 실제 marketplace schema, RLS, RPC 경계 정의 | schema plan, RLS matrix, migration 초안 작성 | typecheck, lint, tests, Supabase local lint |
| P0.3 구현 레일 세분화 | 완료 | schema 초안 다음에 무엇을 만들지 작업 단위로 쪼갬 | 이 실행 레일 유지, 다음 작업 선택 기준 명확화 | ROADMAP 확인 |
| P1.1 회사 역할 모델 연결 | 완료 | DB 초안을 앱의 가입/프로필 흐름에 연결 | 회사별 marketplace 역할 조회/저장 repository, 서버 액션 | 단위 테스트, RLS 테스트 |
| P1.2 검증 상태와 증빙 업로드 | 완료 | 역할 선택을 넘어 운영자 승인 전후 상태를 관리 | verification status, 증빙 업로드, 운영자 검토 큐 | private bucket/RLS 검증 |
| P1.3 파트너 관심 조건 | 완료 | 가입 정보가 아니라 업체가 받고 싶은 요청 조건을 저장 | partner preferences CRUD, 회사 관리자 제한 | repository/RLS 테스트 |
| P2.1 운송 요청 draft 생성 | 완료 | 업체 기반에서 실제 화주 요청 데이터 생성으로 이동 | freight request draft server action, detail 저장 | typecheck, unit, RLS |
| P2.2 운송 요청 공개와 매칭 | 완료 | 저장된 요청을 조건에 맞는 포워더에게 노출 | request publish, partner match 생성, deadline | RLS, 상태 전이 테스트 |
| P2.3 포워더 견적 제출 | 완료 | 요청 조회에서 파트너 bid 생성으로 이동 | freight bid submit, 견적 조건 입력 | RLS, 상태 전이 테스트 |
| P2.4 화주 견적 비교·선택 | 완료 | 견적 제출 후 화주가 선택하는 거래 전환 지점 | bid comparison UI, `select_service_bid` 호출 | typecheck, lint, unit, build, Supabase lint, 로컬 route 확인 |
| P2.5 요청 서류 첨부·공개 범위 | 완료 | 견적 선택이 아니라 화주가 견적 요청에 CI/PL/B/L 등 문서를 붙이고 공개 범위를 제어 | request document upload UI, private storage metadata, visibility rule | RLS, storage policy, unit, build, 로컬 route 확인 |
| P2.6 요청 질문·답변 | 완료 | 문서 첨부가 아니라 파트너가 요청에 대해 질문하고 화주가 답변하는 협의 흐름 | question list, ask/answer actions, RPC-only mutation | RLS, unit, build, 로컬 route 확인 |
| P2.7 운송 요청 UX/UI 정리 | 완료 | 기능 추가가 아니라 완성된 운송 요청 페이지를 사용자 관점에서 정리 | role-separated sections, flow guidance, compact cards, mobile polish | UX reviewer, lint, build |
| P3.1 통관 의뢰 draft 생성 | 완료 | 운송 요청과 같은 공통 모델을 통관 업무로 확장 | clearance request detail, HS 있음/없음, FTA 희망 | typecheck, lint, unit, build, Supabase lint, 로컬 route 확인 |
| P3.2 관세사무소 견적 제출 | 완료 | 포워더 bid가 아니라 관세사무소 수수료/서류요청 bid | clearance publish, broker match, clearance bid detail, 추가서류, 리드타임 | security/UX reviewer, typecheck, lint, unit, build, Supabase lint, 로컬 route 확인 |
| P4.1 알림 정책 skeleton | 완료 | 요청 노출과 별개로 알림 피로도를 제어 | 알림 대상 계산, 1회 알림, 마감 전 리마인드 조건 | unit, typecheck, lint, build |
| P4.2 알림 delivery claim 저장소 | 완료 | 알림 대상 계산이 아니라 실제 발송 전 중복 claim/sent/failed 상태 저장 | marketplace notification deliveries, delivery key, service-role RLS | security reviewer, unit, governance, typecheck, lint, build, Supabase lint |
| P4.3 알림 claim RPC 원천 검증 | 완료 | repository claim이 아니라 DB에서 match/request/partner 정합성과 상태를 검증 | claim RPC, transition guard, retry rule | governance, typecheck, lint, build, Supabase lint |
| P4.4 알림 worker skeleton | 완료 | 저장소/RPC가 아니라 실제 target 계산 후 claim까지 연결 | marketplace notification worker, dry-run route | unit, typecheck, lint, build, route env guard |
| P5.1 조회 결과에서 요청 생성 | 완료 | 기존 HS/품명 도구를 플랫폼 요청 시작점으로 연결 | “운송 초안”, “통관 초안”, 조회 결과 prefill | UX reviewer, typecheck, lint, unit, build, route 확인 |
| P5.2 요청 초안의 조회 출처 표시 | 완료 | 요청 시작 버튼이 아니라 초안 화면에서 조회 출처와 예비값 의미를 명확히 표시 | 조회 품명/예비 코드/기준일 출처 패널, FTA 국가역할 주의 | UX reviewer, typecheck, lint, unit, build, route 확인 |
| P6.1 운영자 검증·차단 화면 | 완료 | 개발자 운영 통계가 아니라 marketplace 운영 관리 | 업체 승인, 추천, 숨김/정지, 차단, audit RPC | security reviewer, governance, typecheck, lint, unit, build, route 확인 |
| P6.2 운영 화면 단순화 | 완료 | 상태 변경 기능이 아니라 대표/운영자가 적은 정보로 판단하는 화면 정리 | 우선순위, 상태 필터, 위험 요약, 빈도 낮은 정보 접기 | typecheck, lint, unit, build, route 확인 |
| P7.1 역할별 대시보드 진입 정리 | 완료 | 운영 관리가 아니라 로그인 후 사용자 역할별 다음 행동 안내 | 화주 요청 시작, 포워더 입찰, 관세사 입찰, 회사 검증 상태 | typecheck, lint, unit, build, route 확인 |
| P7.2 대시보드 요청 현황 요약 | 완료 | 진입 버튼이 아니라 실제 요청/입찰 상태를 홈에서 요약 | 내 요청 진행중, 견적 도착, 입찰 가능 건수 | typecheck, lint, unit, build, route 확인 |
| P8.1 회사 설정에서 플랫폼 역할 관리 정리 | 완료 | 대시보드가 아니라 회사 설정에서 역할·검증·관심조건을 한 흐름으로 정리 | 역할 배지, 검증 상태, 파트너 조건 CTA | typecheck, lint, unit, build, route 확인 |
| P8.2 회사 역할 신청/변경 UX | 완료 | 상태 요약이 아니라 회사가 원하는 플랫폼 역할을 신청·변경하는 흐름 | 화주/포워더/관세사/해외파트너 역할 요청, 승인 전 권한 미부여 | RLS/security review, typecheck, lint, unit, build |
| P8.3 운영자 역할 신청 검토 큐 | 완료 | 회사가 신청한 역할을 운영자가 승인·반려하고 실제 party type에 반영하는 흐름 | 역할 신청 목록, 승인/반려, audit, 권한 반영 RPC | RLS/security review, typecheck, lint, unit, build |
| P8.4 운영 화면 정보 구조 정리 | 완료 | 검증 증빙, 역할 신청, 업체 상태, 사용자 목록이 한 페이지에 많아진 문제 정리 | 오늘 먼저 볼 일, 처리 우선순위, 사용자 상세 기본 접힘 | UX review, typecheck, lint, build, route 확인 |
| P9.1 해외 파트너 가입·검증 안내 정리 | 완료 | 해외 수출입 파트너가 가입할 때 무엇을 증빙하고 어떻게 연결되는지 명확히 안내 | 해외 파트너 가입 유형, 한국 사업자번호 선택 입력, 승인 전 권한 미부여 | UX review, typecheck, lint, unit, build |
| P9.2 해외 파트너 요청 진입 CTA | 완료 | 가입 안내가 아니라 해외 파트너가 한국 포워더·관세사 연결 요청으로 이동하는 진입점 | 해외 파트너용 요청 시작 카드, 한국 통관/운송 연결 안내 | UX review, typecheck, lint, build, route 확인 |
| P9.3 해외 파트너 문구 다국어 준비 | 완료 | 한국어 화면 CTA가 아니라 영어 사용자에게 최소 안내가 가능한 copy 기반 정리 | 해외 파트너 안내 문구 dictionary, 검증 보류 문구 | i18n review, typecheck, lint, build |
| P10.1 요청 생성 페이지의 해외 파트너 prefill 정리 | 완료 | CTA 문구가 아니라 실제 요청 draft 페이지에서 KR 도착/수입 방향 prefill을 안정화 | freight/clearance query prefill, query alias 정규화 | unit, typecheck, route 확인 |
| P10.2 해외 파트너용 요청 초안 안내 | 완료 | query prefill이 아니라 draft 페이지에서 해외 파트너가 어떤 값을 보완해야 하는지 안내 | KR 목적국 안내, 출발국 입력, 통관/운송 보완 문구 | UX review, typecheck |
| P10.3 요청 초안 필수값·빈 상태 정리 | 완료 | 해외 파트너 안내 문구가 아니라 실제 draft 작성 중 빠진 필수값과 저장 전 보완 포인트를 명확히 표시 | 운송/통관 draft 필수값 요약, 비어있는 문서·품목 안내, 저장 실패 복구 문구 | UX review, typecheck, lint, unit |
| P10.4 통관 의뢰 서류 첨부 parity | 완료 | 초안 작성 안내가 아니라 통관 의뢰에도 CI/PL/사양서 등 요청 서류를 붙이고 공개 범위를 관리 | clearance document upload, private storage metadata, 관세사 공개 범위 | RLS/security review, typecheck, lint, unit, build |
| P10.5 통관 견적 비교·선택 | 완료 | 통관 의뢰 서류 첨부가 아니라 관세사무소가 제출한 견적을 화주가 비교하고 하나를 선택 | clearance bid list, 수수료/리드타임/요청서류 비교, select bid | RLS/security review, typecheck, lint, unit, build |
| P10.6 통관 의뢰 질문·답변 parity | 완료 | 통관 견적 선택이 아니라 견적 전 관세사무소 질문과 화주 답변 협의 흐름 | clearance request questions, broker ask, requester answer, unread next action | RLS/security review, typecheck, lint, unit, build |
| P10.7 플랫폼 요청 운영 통계 정리 | 완료 | 요청 작성/입찰 기능이 아니라 대표가 운영 상태를 보고 다음 개선을 맡길 수 있는 관리 지표 | request funnel counts, unanswered questions, bids waiting, stale drafts | typecheck, lint, unit, build |
| P10.8 요청 업무 UI 밀도 정리 | 완료 | 운영 통계가 아니라 운송/통관 요청 화면이 너무 길어진 문제를 줄이고 섹션 우선순위를 정리 | compact request cards, collapsible secondary forms, next-action-first layout | UX review, typecheck, lint, build |
| P11.1 요청 상세 페이지 분리 | 완료 | 한 화면 UI 밀도 정리가 아니라 요청 목록과 상세 작업 공간을 분리해 장기적으로 화면 복잡도를 낮춤 | `/requests/{type}/{id}`, list/detail separation, direct next-action links | UX review, typecheck, lint, unit, build |
| P11.2 요청 상세 direct action anchor | 완료 | 상세 페이지 생성이 아니라 미답변 질문, 서류 첨부, 견적 비교 같은 다음 작업 위치로 바로 이동 | section anchors, next-action links, status-driven focus | UX review, typecheck, lint, build |
| P11.3 목록 화면 compact mode | 완료 | 상세 anchor가 아니라 목록 화면은 초안 생성과 요약만 남기고 상세 작업은 상세 페이지로 이동 | hide heavy sections on list, summary rows, detail-first workflow | UX review, typecheck, lint, unit, build |
| P11.4 파트너 기회 화면 작업 분리 | 완료 | 화주 요청 목록 compact가 아니라 포워더/관세사 입찰 가능 건도 목록과 상세 작업을 분리 | partner opportunity detail routes, compact opportunity rows, bid-first workflow | UX review, typecheck, lint, unit, build, route 확인 |
| P11.5 대시보드/운영 화면 상세 연결 | 완료 | 상세 화면 추가가 아니라 홈·운영 통계에서 바로 처리할 요청 상세로 진입 | dashboard workspace deep links, requester/partner shortcuts, protected route check | UX review, typecheck, lint, unit, build |
| P12.1 운영 통계 액션 가이드 보강 | 완료 | 화면 진입 링크가 아니라 대표/운영자가 통계를 보고 나에게 바로 수정 요청할 수 있게 해석과 샘플을 제공 | actionable metrics, sample request ids, suggested fix prompt | self-review, typecheck, lint, unit, build, route 확인 |
| P12.2 운영 샘플 상세 검토 화면 | 완료 | 샘플 ID 표시가 아니라 운영자가 고객 회사 소유권과 별개로 요청 원문을 검토할 수 있는 staff-only 상세 화면 | developer-only request detail, read-only metadata, no file download/state mutation | RLS/security self-review, typecheck, lint, unit, build, route 확인 |
| P12.3 운영 상세에서 개선 요청 문구 자동화 | 완료 | 상세 검토 화면이 아니라 요청 상태/질문/견적 상황을 기반으로 나에게 줄 수정 요청 문장을 생성 | copy-ready improvement prompts, issue category labels, no sensitive document contents | typecheck, lint, unit, build, route 확인 |
| P13.1 선정 이후 후속 안내 정리 | 완료 | 운영자 개선 문구가 아니라 화주가 업체 선정 후 다음 업무를 놓치지 않게 안내 | selected request next steps, selected bid summary, document handoff guidance | UX review, typecheck, lint, unit, build, route 확인 |
| P13.2 선정된 파트너 후속 안내 | 완료 | 화주 후속 안내가 아니라 선정된 포워더/관세사무소가 다음 처리 업무를 확인 | selected partner opportunity banner, handoff checklist, no legal certainty | UX review, typecheck, lint, unit, build, route 확인 |
| P13.3 거래 후속 상태 모델 계획 | 완료 | 안내 UI가 아니라 선정 이후 `in_progress`, `completed` 같은 거래 상태를 안전하게 추가할 DB/RLS 계획 | lifecycle state plan, transition RPC outline, audit events | docs, RLS/security review |
| P13.4 거래 후속 상태 RPC skeleton | 완료 | 상태 계획 문서가 아니라 실제 로컬 migration RPC, repository, server action, 버튼 skeleton 연결 | start/complete RPC, action schemas, selected/in-progress UI buttons | RLS/security review, typecheck, lint, unit, build |
| P13.5 후속 상태 운영 관찰성 | 완료 | 상태 전환 버튼이 아니라 진행중/완료 요청을 운영자가 보고 병목을 찾는 화면 | operations funnel update, lifecycle counts, stale in-progress samples | typecheck, lint, unit, build, route 확인 |
| P13.6 완료 이후 피드백 골격 | 완료 | 운영 통계가 아니라 완료된 거래의 신뢰 지표를 쌓을 최소 피드백 모델 | completed-request feedback schema, RPC-only insert, requester/partner UI skeleton | RLS/security review, typecheck, lint, unit, build |
| P14.1 파트너 신뢰 지표 조회 | 완료 | 피드백 저장이 아니라 완료 거래 기반 평점·응답 품질을 파트너 비교에 활용 | partner feedback aggregate repository, bid card trust summary | typecheck, lint, unit, build |
| P14.2 견적 비교 기준 정리 | 완료 | 신뢰 지표 표시가 아니라 화주가 가격·리드타임·후기·조건을 함께 비교하게 하는 UI | comparison guidance, bid sort cues, low-review warning | UX review, typecheck, lint, build |
| P14.3 파트너 검증 배지 노출 | 완료 | 비교 기준 안내가 아니라 견적 제출 업체의 검증/추천 상태를 비교 정보로 표시 | partner verification summary, recommended badge, no hidden/suspended exposure | RLS/security review, typecheck, lint, unit, build |
| P14.4 선정 전 확인 체크리스트 | 완료 | 검증/후기 배지 표시가 아니라 화주가 업체 선정 전 조건 누락을 확인하게 하는 UX | pre-select checklist, missing documents/conditions warning, selection copy | UX review, typecheck, lint, build |
| P14.5 완료 피드백 제출 상태 표시 | 완료 | 선정 전 체크리스트가 아니라 완료 후 내가 이미 피드백을 남겼는지 구분하는 UX | own feedback read summary, duplicate prevention copy, completed state polish | typecheck, lint, unit, build |
| P15.1 대시보드 거래 흐름 요약 보강 | 완료 | 요청 화면 세부 UX가 아니라 홈에서 요청·입찰·진행·완료 상태를 한눈에 보는 요약 | dashboard lifecycle counts, next-action grouping, completed feedback reminder | typecheck, lint, unit, build, route 확인 |
| P15.2 대시보드 다음 행동 우선순위 CTA | 완료 | 상태 숫자 요약이 아니라 사용자가 홈에서 바로 처리할 다음 행동을 우선순위로 제시 | role-aware next action cards, request/bid/progress/feedback CTA ordering | UX self-review, typecheck, lint, unit, build, route 확인 |
| P15.3 대시보드 역할별 빈 상태 정리 | 완료 | 다음 행동 카드가 아니라 요청·입찰 데이터가 없는 사용자에게 역할별 시작 경로와 검증 보류 이유를 안내 | empty-state copy, verification-gated CTA, partner role guidance | UX self-review, typecheck, lint, unit, build, route 확인 |
| P16.1 대표용 운영 홈 우선순위 정리 | 완료 | 사용자 대시보드가 아니라 대표/운영자가 운영 화면에서 무엇을 먼저 고쳐달라고 해야 하는지 보는 큐 | owner action queue, severity grouping, copy-ready fix request | UX self-review, typecheck, lint, unit, build, route 확인 |
| P16.2 운영 개선 요청 복사 UX | 완료 | 우선순위 큐 표시가 아니라 대표가 나에게 바로 붙여넣을 수 있는 수정 요청 문장을 복사 가능한 형태로 정리 | copy-ready prompt blocks, no sensitive contents, operations sample links | UX self-review, typecheck, lint, unit, build, route 확인 |
| P16.3 운영 요청 상세 민감정보 노출 점검 | 완료 | 복사용 요청 문장이 아니라 운영 샘플 상세 화면에서 민감 원문 없이 개선 판단이 가능한지 점검 | redacted detail layout, sensitive-field guard, sample prompt consistency | security/UX self-review, typecheck, lint, unit, build, route 확인 |
| P16.4 운영 상세 민감 데이터 조회 축소 | 완료 | 화면 표시 숨김이 아니라 repository 단계에서 운영 상세가 원문성 필드를 덜 가져오도록 축소 | minimized select columns, prompt tests, no filename/message/product text fetch | security self-review, typecheck, lint, unit, build, route 확인 |
| P16.5 운영 상세 redaction 회귀 테스트 | 완료 | 민감 데이터 조회 축소 구현이 아니라 이후 수정에서 원문성 컬럼 select가 되살아나지 않도록 테스트로 고정 | select allowlist test, redaction regression guard, operations prompt safety | unit, typecheck, lint, build, route 확인 |
| P17.1 요청 목록 성능·쿼리 경계 점검 | 완료 | 운영 화면 보안 보강이 아니라 화주/파트너 요청 목록이 커졌을 때 느려지지 않도록 조회 범위와 limit를 점검 | list query audit, count limits, index notes, no behavior regression | backend self-review, typecheck, lint, unit, build, route 확인 |
| P17.2 요청 목록 limit·index 회귀 테스트 | 완료 | 쿼리 limit 구현이 아니라 목록 조회가 무제한으로 되돌아가지 않도록 테스트와 문서로 고정 | repository limit tests, migration index assertions, operations note | unit, typecheck, lint, build, route 확인 |
| P17.3 요청 목록 index 보강 검토 | 완료 | repository limit 회귀 테스트가 아니라 실제 DB index가 목록/상세/입찰 흐름을 충분히 받치는지 migration 초안을 점검 | index coverage audit, missing index migration notes, Supabase lint | backend/security self-review, typecheck, lint, unit, supabase lint, build, route 확인 |
| P18.1 요청 상세 데이터 로딩 중복 점검 | 완료 | DB index 보강이 아니라 요청 상세/목록 페이지가 같은 문서·질문·견적 데이터를 중복 fetch하지 않도록 서버 데이터 조립을 점검 | duplicate fetch audit, page loader consolidation notes, no UX regression | backend self-review, typecheck, lint, unit, build, route 확인 |
| P18.2 요청 목록 데이터 조립 헬퍼 분리 | 완료 | 단순 병렬 로딩이 아니라 운송/통관 목록 페이지의 reduce/grouping 반복을 공통 헬퍼로 줄임 | grouping helper, page loader cleanup, no behavior regression | typecheck, lint, unit, build, route 확인 |
| P18.3 요청 상세 next-focus 계산 헬퍼 분리 | 완료 | 목록 데이터 조립이 아니라 운송/통관 상세 페이지의 다음 작업 계산 반복을 공통화 | next focus helper, requester detail cleanup, no UX regression | typecheck, lint, unit, build, route 확인 |
| P18.4 next-focus 헬퍼 단위 테스트 | 완료 | 상세 페이지 리팩터링이 아니라 미답변 질문, 견적 도착, 서류 없음, 초안 공개, 견적 대기 우선순위를 테스트로 고정 | next focus priority tests, regression guard | unit, typecheck, lint, build, route 확인 |
| P19.1 파트너 opportunity 상세 next-focus 헬퍼 분리 | 완료 | 요청자 상세 우선순위가 아니라 파트너 입찰 상세의 질문 확인·견적 제출 우선순위를 공통화 | partner next focus helper, freight/clearance opportunity cleanup | typecheck, lint, unit, build, route 확인 |
| P19.2 파트너 opportunity 상세 피드백 조회 필요성 점검 | 완료 | next-focus 계산이 아니라 파트너 입찰 상세에서 완료 피드백 조회가 실제로 필요한지 줄일 수 있는지 점검 | feedback fetch audit, selected/completed gating, no UX regression | typecheck, lint, unit, build, route 확인 |
| P19.3 파트너 opportunity 목록 feedback 조회 범위 점검 | 완료 | 상세 페이지 fetch gating이 아니라 목록 화면에서 완료 피드백 조회 대상 ID를 줄일 수 있는지 점검 | list feedback gating, completed-only lookup, no UX regression | typecheck, lint, unit, build, route 확인 |
| P20.1 요청 목록 feedback 조회 helper 적용 범위 검토 | 완료 | 완료 ID gating이 아니라 요청자/파트너/상세 페이지별 feedback helper 사용을 일관화 | feedback helper audit, detail page consistency, no regression | typecheck, lint, unit, build, route 확인 |
| P20.2 피드백 조회 gating 회귀 테스트 보강 | 완료 | 상세 페이지 적용이 아니라 완료 전 요청에는 feedback 조회가 필요 없다는 규칙을 테스트/문서로 고정 | feedback gating tests, completed-only rule | unit, typecheck, lint, build, route 확인 |
| P21.1 작업 레일 상태 점검·다음 우선순위 재정렬 | 완료 | 기능 구현이 아니라 지금까지의 플랫폼 레일을 기준으로 남은 병목과 다음 작업 묶음을 재정렬 | roadmap cleanup, next rails, local-only summary | docs review |
| P21.2 요청 상세 feedback map 변환 일관화 | 완료 | 피드백 조회 조건 테스트가 아니라 조회한 feedback Map을 페이지마다 다르게 변환하는 반복을 제거 | requester/partner detail helper usage, no behavior regression | typecheck, lint, unit, build, route 확인 |
| P21.3 요청 상세 loader 중복 패턴 정리 | 완료 | feedback map 변환이 아니라 운송/통관 상세에서 문서·질문·견적·피드백 조립 순서를 더 명확한 loader 단위로 정리 | shared loader outline or helper, page cleanup | typecheck, lint, unit, build, route 확인 |
| P22.1 알림 발송 adapter 경계 분리 | 완료 | 요청 상세 성능 정리가 아니라 알림 worker가 실제 이메일/앱 알림으로 확장될 수 있게 발송 interface와 dry-run 경계를 분리 | notification sender adapter, dry-run safety, no duplicate send | unit, typecheck, lint, build |
| P23.1 운영 통계와 거래 신뢰지표 연결 | 완료 | 알림 worker가 아니라 대표 운영 화면에서 완료 거래·후기·응답 품질 병목을 바로 개선 요청으로 연결 | operations trust metrics, copy-ready fix prompt | UX self-review, typecheck, lint, unit, build, route 확인 |
| P23.2 운영 신뢰지표 UX 문구 점검 | 완료 | 신뢰지표 집계가 아니라 대표가 낮은 후기/미피드백 수치를 보고 무엇을 맡길지 더 쉽게 이해하도록 문구와 우선순위 표시를 다듬음 | owner-facing trust metric copy, no sensitive comments | UX self-review, typecheck, lint, build, route 확인 |
| P24.1 사용자 요청 시작 흐름 재점검 | 완료 | 운영자 통계가 아니라 실제 화주/해외 파트너가 운송·통관 요청을 시작할 때 막히는 필수값, 빈 상태, CTA 흐름을 다시 점검 | requester start flow audit, compact fixes | UX self-review, typecheck, lint, build, route 확인 |
| P24.2 요청 시작 화면 접근성·모바일 밀도 점검 | 완료 | 시작 흐름 안내 추가가 아니라 모바일 폭에서 폼, 흐름 패널, 빈 상태가 과하게 길어지거나 버튼이 묻히지 않는지 점검 | compact mobile copy, route smoke | UX self-review, typecheck, lint, build, route 확인 |
| P25.1 파트너 입찰 시작 흐름 재점검 | 완료 | 화주 요청 시작이 아니라 포워더/관세사무소가 매칭 요청을 보고 질문·견적 제출로 들어가는 파트너 시작 흐름을 점검 | partner bid flow audit, opportunity CTA polish | UX self-review, typecheck, lint, build, route 확인 |
| P25.2 파트너 입찰 상세 CTA 점검 | 완료 | 입찰 목록 흐름 안내가 아니라 상세 입찰 화면에서 질문·견적 제출 anchor와 다음 작업 CTA가 충분히 명확한지 점검 | partner detail CTA polish | UX self-review, typecheck, lint, build, route 확인 |
| P26.1 요청 상세 화주 CTA 재점검 | 완료 | 파트너 입찰 상세가 아니라 화주가 요청 상세에서 서류·질문·견적·공개 작업을 놓치지 않는지 점검 | requester detail CTA polish | UX self-review, typecheck, lint, build, route 확인 |
| P27.1 플랫폼 UI 흐름 중복 컴포넌트 점검 | 완료 | 개별 화면 CTA 추가가 아니라 새로 생긴 흐름 패널들이 과하게 반복되거나 공통화할 수 있는지 점검 | flow panel consolidation audit | typecheck, lint, build |
| P28.1 로컬 변경 묶음 최종 점검 | 완료 | 새 기능 구현이 아니라 지금까지 이어서 수정한 플랫폼 레일의 변경 파일, 검증 결과, 남은 리스크를 정리 | local diff audit, validation summary, next queue | typecheck, lint, test/build status review |
| P29.1 플랫폼 레일 다음 기능 후보 정리 | 완료 | 최종 점검이 아니라 다음에 실제로 구현할 기능 후보를 운영/요청/알림/거래 완료 기준으로 다시 우선순위화 | next implementation queue | docs review |
| P29.2 거래 완료 이후 리포트/정산 placeholder 점검 | 완료 | 다음 후보 정리가 아니라 선정 후 진행중·완료 상태에서 사용자가 기대하는 리포트/정산 안내의 최소 placeholder를 점검 | post-completion placeholder audit | UX self-review, typecheck, lint, build |
| P30.1 알림 sender 실제 주입 전 운영 조건 점검 | 완료 | 리포트/정산 placeholder가 아니라 P22.1 sender interface를 실제 route에 주입하기 전 운영 설정, throttle, dry-run 확인 조건을 점검 | notification send readiness audit | unit, typecheck, lint, build |
| P30.2 알림 provider adapter skeleton | 완료 | 발송 readiness 차단이 아니라 실제 provider 구현을 나중에 끼울 수 있는 adapter 파일 구조와 no-op 테스트 경계를 만든다 | notification provider skeleton | unit, typecheck, lint, build |
| P30.3 internal dry-run sender route 연결 검토 | 완료 | provider skeleton이 아니라 `internal_dry_run` provider를 route에 연결해 sent/failed transition까지 리허설할지 판단하고 안전하게 연결한다 | dry-run sender route integration | unit, typecheck, lint, build, route 확인 |
| P31.1 알림 운영 리허설 문서화 | 완료 | route 연결이 아니라 운영자가 어떤 env와 query로 dry-run/sender 리허설을 해야 하는지 문서화한다 | notification runbook | docs review |
| P32.1 선정 이후 서류 handoff 개선 | 완료 | 알림 운영 문서가 아니라 업체 선정 후 어떤 서류를 선정 파트너에게 공개해야 하는지 화면 안내를 보강한다 | selected partner document handoff | UX self-review, typecheck, lint, build |
| P32.2 파트너 측 선정 이후 handoff 안내 보강 | 완료 | 화주 측 서류 handoff가 아니라 선정된 포워더/관세사무소가 어떤 서류와 조건을 확인해야 하는지 파트너 화면 안내를 보강한다 | selected partner side handoff | UX self-review, typecheck, lint, build |
| P33.1 전체 플랫폼 변경 최종 재검증 | 완료 | handoff UI 추가가 아니라 이번 연속 작업 전체의 테스트, 빌드, route, 문서 상태를 다시 묶어서 확인한다 | full local validation | typecheck, lint, test, build, route 확인 |
| P34.1 다음 플랫폼 레일 재정렬 | 완료 | 최종 재검증이 아니라 다음 코드 작업 후보를 운영/알림/거래완료/해외파트너 축으로 다시 정리한다 | next rail planning | docs review |
| P34.2 해외 파트너 온보딩 보강 | 완료 | 플랫폼 레일 재정렬이 아니라 해외 수출입자가 한국 포워더·관세사무소 연결 요청을 시작하기 전 검증/서류/언어 기대치를 더 명확히 안내한다 | overseas partner onboarding copy | UX self-review, typecheck, lint, build |
| P35.1 거래 완료 리포트 실제 모델 초안 | 완료 | 해외 파트너 안내가 아니라 선정 이후 완료 거래의 결과 메타데이터와 최종 보관 서류 묶음을 설계한다 | completion report model plan | docs, RLS/security self-review |
| P35.2 completion report migration 초안 | 완료 | 완료 리포트 모델 문서가 아니라 실제 로컬 migration table, RLS, RPC skeleton을 작성한다 | completion report schema skeleton | governance, Supabase lint, typecheck |
| P35.3 completion report repository/action layer | 완료 | DB/RLS skeleton이 아니라 앱 코드에서 완료 리포트를 읽고 저장하는 repository, action, schema 경계를 만든다 | completion report server layer | unit, typecheck, lint, build |
| P35.4 completed UI skeleton | 완료 | 서버 저장 경계가 아니라 요청자/선정 파트너 상세의 완료 상태 영역에서 완료 리포트 상태와 작성 CTA를 보여준다 | completed report UI skeleton | UX self-review, typecheck, lint, build |
| P35.5 completion report document archive mapping | 완료 | 완료 리포트 상태 카드가 아니라 기존 요청 서류를 최종 보관 역할로 연결하는 문서 매핑 경계를 만든다 | completion report document mapping | RLS/security self-review, unit, typecheck |
| P35.6 operations completion report visibility | 완료 | 문서 매핑 경계가 아니라 운영 화면에서 완료됐지만 리포트가 없거나 확인이 안 된 요청을 볼 수 있게 한다 | completion report operations signals | unit, typecheck, lint, build |
| P36.1 completion report UI archive mapping | 완료 | 운영 지표가 아니라 완료 리포트 화면에서 기존 요청 서류를 최종 보관 역할로 선택·연결하는 UI를 만든다 | completion report document UI | UX self-review, unit, typecheck, lint, build |
| P36.2 completion report submit/acknowledge 상태 전이 계획 | 완료 | 서류 연결 UI가 아니라 초안 리포트를 제출·확인·잠금으로 넘기는 승인 경계를 설계한다 | submit/ack/lock transition plan | docs, RLS/security self-review |
| P36.3 completion report submit UI skeleton | 완료 | 상태 전이 계획이 아니라 완료 리포트 패널에서 제출·확인 CTA와 잠금 전 경고를 표시한다 | submit/ack UI skeleton | UX self-review, unit, typecheck, lint, build |
| P36.4 completion report transition RPC | 완료 | UI skeleton이 아니라 제출·확인·운영 검토·잠금 RPC와 governance tests를 추가한다 | submit/ack/review/lock RPC | RLS/security self-review, governance, Supabase lint |
| P36.5 completion report transition actions | 완료 | RPC가 아니라 앱 서버 schema/repository/action을 추가해 UI와 상태 전이를 연결한다 | transition action layer | unit, typecheck, lint, build |
| P37.1 operations completion report transition visibility | 완료 | 사용자 상세의 상태 전이가 아니라 운영 화면에서 제출됨·확인됨·운영검토 필요·잠금 대기 리포트를 우선순위로 볼 수 있게 한다 | completion report transition operations queue | UX self-review, unit, typecheck, lint, build |
| P37.2 operations request detail completion report section | 완료 | 운영 통계 숫자가 아니라 운영 상세 화면에서 해당 요청의 완료 리포트 상태와 보관 서류 매핑을 민감정보 없이 확인하게 한다 | operations detail completion report summary | security/UX self-review, unit, typecheck, lint, build |
| P38.1 completion report source snapshot summary | 완료 | 운영 상세 표시가 아니라 완료 리포트에 요청/선정견적/조회 snapshot 출처 요약을 더 구조화해 source-locked report 기반을 만든다 | completion report source summary | security self-review, unit, typecheck, lint, build |
| P38.2 completion report print/export preview plan | 완료 | source snapshot 저장 구조가 아니라 완료 리포트를 나중에 PDF/프린트 리포트로 만들기 위한 미리보기 정보 구조를 설계한다 | completion report preview plan | docs, UX/security self-review |
| P38.3 completion report preview read model | 완료 | 미리보기 계획이 아니라 완료 리포트 row와 source snapshot을 안전한 preview 모델로 변환하는 pure helper를 만든다 | completion report preview helper | unit, typecheck, lint, build |
| P38.4 completion report preview UI route skeleton | 완료 | preview helper가 아니라 완료 리포트를 프린트 가능한 화면으로 보여주는 route skeleton을 만든다 | completion report preview UI | UX/security self-review, unit, typecheck, lint, build |
| P38.5 operations completion report preview link | 완료 | 사용자 요청 상세 preview가 아니라 운영 상세에서도 민감정보 없는 완료 리포트 preview로 이동하는 링크를 추가한다 | operations preview link | UX/security self-review, typecheck, lint, build |
| P38.6 completion report preview print polish | 완료 | 운영 상세 링크가 아니라 preview 화면 자체의 프린트/모바일 레이아웃과 잠금 상태 안내를 다듬는다 | preview print polish | UX/security self-review, typecheck, lint, build |
| P39.1 completion report archive role labels | 완료 | preview 레이아웃이 아니라 `final_bl_or_awb` 같은 내부 보관 서류 role을 사용자용 한글 라벨로 변환한다 | archive role labels | unit, UX self-review, typecheck, lint, build |
| P39.2 operations archive role labels | 완료 | 사용자 preview가 아니라 운영 상세의 완료 리포트 보관 서류 매핑도 같은 한글 라벨을 사용하게 한다 | operations archive role labels | UX/security self-review, typecheck, lint, build |
| P40.1 completion report source lock labels | 완료 | 보관 서류 라벨이 아니라 출처 잠금 영역의 source metadata를 운영자/사용자 모두 이해하기 쉬운 한국어 필드명으로 정리한다 | source lock labels | UX/security self-review, typecheck, lint, build |
| P40.2 completion report source lock tests | 완료 | 출처 잠금 표시 UI가 아니라 `source_locks`와 `sources` 배열을 preview helper가 안정적으로 해석하는 테스트를 보강한다 | source lock helper tests | unit, typecheck, lint, build |
| P41.1 completion report read model coverage review | 완료 | source lock 테스트가 아니라 완료 리포트 preview/read model에서 아직 노출 누락된 필드와 숨겨야 할 필드를 점검한다 | read model coverage review | docs, security/UX self-review |
| P41.2 completion report source snapshot coverage | 완료 | read model 점검 문서가 아니라 `published_at`, snapshot version, request status를 실제 preview read model과 UI에 반영한다 | source snapshot coverage | unit, typecheck, lint, build |
| P41.3 completion report preview route data self-review | 완료 | read model 필드 추가가 아니라 preview route에서 실제 전달하는 data mapping이 새 read model 필드와 맞는지 점검한다 | preview route mapping review | typecheck, lint, build, route 확인 |
| P42.1 completion report preview UI browser check | 완료 | route mapping 공통화가 아니라 로컬 브라우저에서 preview route 접근 보호와 화면 렌더링 경로를 확인한다 | preview browser check | local browser, route 확인 |
| P42.2 completion report preview auth fixture plan | 완료 | 비로그인 보호 확인이 아니라 실제 로그인/권한 fixture로 preview 본문 렌더링을 자동 검증하는 방법을 정리한다 | preview auth fixture plan | docs, test plan |
| P42.3 completion report local seed helper plan | 완료 | 권한 fixture 계획이 아니라 preview e2e에 필요한 최소 local seed helper 구조를 설계한다 | preview seed helper plan | docs, test plan |
| P42.4 completion report e2e fixture implementation | 진행 | seed helper 계획이 아니라 실제 테스트 fixture 파일과 role별 storage state 준비 코드를 만든다 | preview e2e fixture | unit/e2e setup review, typecheck, lint |
| P42.5 completion report seed runner | 완료 | fixture 데이터 원장이 아니라 service-role Supabase local seed runner를 만들어 실제 DB에 테스트 데이터를 넣는다 | preview seed runner | unit, typecheck, lint, build, local guard |
| P42.6 completion report storage state script | 완료 | DB seed runner가 아니라 seeded role 계정으로 로그인해 Playwright storage state를 생성하는 스크립트를 만든다 | preview storage state | typecheck, lint, build, guarded script |
| P42.7 completion report preview e2e script | 완료 | storage state 생성이 아니라 생성된 role별 세션으로 preview 본문/권한/민감정보 미노출을 검증하는 e2e script를 만든다 | preview e2e script | typecheck, lint, build, guarded script |
| P42.8 completion report e2e local runbook | 완료 | e2e script가 아니라 seed/auth/e2e 실행 순서와 필요한 env를 문서화한다 | preview e2e runbook | docs |
| P42.9 completion report e2e script self-review | 완료 | runbook이 아니라 seed/auth/e2e 스크립트의 위험한 production 실행 가능성과 민감정보 검증 누락을 자체 리뷰한다 | preview e2e self-review | security/QA self-review, docs |
| P42.10 completion report e2e assertion matrix | 완료 | 자체 리뷰 문서가 아니라 requester/partner/developer 권한 조합과 freight/clearance 양쪽을 e2e assertion에 모두 추가한다 | preview e2e matrix | typecheck, lint, build, guarded script |
| P43.1 completion report local e2e readiness check | 완료 | assertion matrix 확장이 아니라 현재 로컬 환경에서 seed/auth/e2e를 실제로 실행할 수 있는 env와 Supabase 상태를 점검한다 | local e2e readiness script, no secret output | ready script, typecheck, lint, build |
| P43.2 completion report local e2e execution gate | 완료 | readiness 점검 스크립트가 아니라 실제 seed/auth/e2e 실행을 시도하고 막히는 조건을 좁힌다 | local-only seed/auth/e2e runner | no production DB, no secret output |
| P43.3 completion report e2e env duplication review | 완료 | 단일 실행 명령 추가가 아니라 e2e 관련 스크립트들의 local/env guard 중복과 누락을 리뷰한다 | shared env helper for e2e scripts | ready/local safe fail, typecheck, lint, build |
| P43.4 completion report e2e env helper tests | 완료 | helper 분리가 아니라 env parsing/local URL 판정을 테스트로 고정한다 | env helper unit tests | vitest, typecheck, lint, build |
| P44.1 completion report fixture module reuse in seed | 완료 | env helper 테스트가 아니라 seed script의 inline fixture 중복을 existing fixture module과 맞춘다 | shared fixture module for seed and tests | fixture tests, seed safe fail, typecheck, lint, build |
| P44.2 completion report e2e fixture id reuse in auth/e2e | 완료 | seed fixture 중복 제거가 아니라 auth/e2e 스크립트의 이메일과 요청 ID도 같은 fixture 원본을 보게 한다 | auth/e2e fixture reuse | safe fail, vitest, typecheck, lint, build |
| P44.3 completion report e2e fixture documentation sync | 완료 | auth/e2e fixture reuse가 아니라 runbook과 fixture 테스트가 실제 matrix를 빠뜨리지 않게 문서화한다 | fixture access matrix, e2e matrix loop, runbook sync | docs check, tests, typecheck, lint, build |
| P45.1 completion report preview UI browser review | 완료 | e2e fixture 정합성이 아니라 실제 로컬 브라우저에서 preview/login 흐름의 화면 상태를 확인한다 | unauth preview browser redirect review | Playwright, local route |
| P45.2 completion report authenticated browser review unblock plan | 완료 | 비로그인 redirect 확인이 아니라 local Supabase/storage state 준비 후 본문 화면을 브라우저로 볼 수 있게 막힌 조건을 정리한다 | authenticated browser review unblock doc | readiness output |
| P46.1 completion report preview print/source UX review | 완료 | 인증 브라우저 unblock 문서가 아니라 현재 구현된 preview 문서 화면의 인쇄/source/safety UI를 코드 기준으로 다시 점검한다 | source URL retained in print preview | unit, typecheck, lint, build |
| P46.2 completion report preview unsafe source URL regression | 완료 | 인쇄 source URL 보강이 아니라 unsafe source URL이 preview 링크/텍스트로 노출되지 않는 규칙을 테스트로 고정한다 | source URL safety helper | unit, typecheck, lint, build |
| P47.1 completion report preview mobile unauth review | 완료 | source URL 안전성 테스트가 아니라 모바일 폭에서도 비로그인 preview 접근이 본문을 노출하지 않는지 확인한다 | mobile unauth browser review | Playwright screenshot |
| P47.2 completion report preview authenticated mobile body review | 완료 | 모바일 비로그인 redirect가 아니라 storage state 준비 후 실제 완료 리포트 본문 모바일 레이아웃을 확인한다 | authenticated mobile body review | Playwright mobile screenshots, overflow check |
| P48.1 completion report preview route kind guard | 완료 | 모바일 브라우저 확인이 아니라 route kind와 report request type이 어긋난 preview 접근을 차단한다 | route/report type guard | unit, typecheck, lint, build |
| P48.2 completion report preview route guard e2e assertion | 완료 | route guard helper가 아니라 잘못된 kind URL이 본문을 노출하지 않는지 e2e assertion에 추가한다 | mismatched kind e2e check | guarded e2e, typecheck, lint, build |
| P49.1 completion report preview repository ordering review | 완료 | route guard e2e assertion이 아니라 request별 여러 report가 있을 때 최신 non-voided report 선택 기준을 점검한다 | keep first ordered report per request | repository unit, typecheck, lint, build |
| P49.2 completion report preview single-request selection helper | 완료 | record 변환 기준이 아니라 preview page가 단일 request의 report를 명시적으로 고르는 helper를 사용하게 한다 | single request report selection helper | unit, typecheck, lint, build |
| P50.1 completion report repository schema fallback review | 완료 | report 선택 기준이 아니라 schemaReady false일 때 사용자/운영자 화면이 어떻게 보이는지 점검한다 | schema fallback user-safe UI | typecheck, lint, build |
| P50.2 completion report schema fallback copy extraction | 완료 | fallback UI 추가가 아니라 fallback 문구를 helper로 분리해 테스트 가능하게 만든다 | fallback copy helper | unit, typecheck, lint, build |
| P51.1 completion report final self-review | 완료 | fallback copy 테스트가 아니라 완료 리포트 preview/e2e/readiness 변경 전체를 자체 리뷰하고 남은 위험을 정리한다 | final self-review doc | rg, targeted tests, typecheck, lint, build |
| P52.1 platform request completion report next-area selection | 완료 | 완료 리포트 preview 자체 리뷰가 아니라 다음으로 이어갈 플랫폼 요청 영역을 정한다 | marketplace notification send readiness selected | roadmap/code review |
| P52.2 marketplace notification supported provider readiness | 완료 | 다음 영역 선정이 아니라 send readiness가 provider 존재뿐 아니라 지원 provider인지도 검증하게 한다 | supported provider readiness | unit, typecheck, lint, build |
| P52.3 marketplace notification readiness route consistency | 완료 | readiness helper 수정이 아니라 route 응답과 runbook이 unsupported provider 실패를 일관되게 설명하는지 맞춘다 | route/runbook consistency | docs check |
| P53.1 marketplace notification provider union centralization | 완료 | runbook 정합성이 아니라 supported provider 목록과 provider factory의 문자열 중복을 줄인다 | provider allowlist centralization | unit, typecheck, lint, build |
| P53.2 marketplace notification send provider docs sync | 완료 | provider allowlist 중앙화가 아니라 runbook의 provider 목록을 코드 allowlist 기준과 맞춘다 | provider docs sync | docs check |
| P54.1 marketplace notification worker result clarity | 완료 | provider 문서 정리가 아니라 worker 결과가 claim-only와 sent를 운영자가 혼동하지 않게 필드 의미를 점검한다 | claimedWithoutSenderCount | unit, docs, typecheck, lint, build |
| P54.2 marketplace notification worker result route smoke | 완료 | worker result 필드 추가가 아니라 route 응답에서 새 필드가 깨지지 않는지 smoke 기준을 정리한다 | worker result field docs | docs check |
| P55.1 marketplace notification worker send failure review | 완료 | 결과 필드 문서화가 아니라 sender 실패 시 실패 기록과 count가 정확한지 테스트한다 | send failure coverage | unit, typecheck, lint, build |
| P55.2 marketplace notification failure runbook sync | 완료 | sender 실패 테스트가 아니라 provider 실패 시 운영자가 볼 상태와 retryable_failed 의미를 문서화한다 | failure runbook sync | docs check |
| P56.1 marketplace notification final self-review | 완료 | 실패 runbook 문서화가 아니라 알림 readiness/provider/worker 변경 전체를 자체 리뷰한다 | notification self-review | rg, tests, typecheck, lint, build |
| P57.1 platform marketplace next-area selection | 완료 | 알림 자체 리뷰가 아니라 다음 플랫폼 MVP 병목 영역을 다시 선택한다 | in-app notification inbox selected | code review |
| P57.2 marketplace notification partner read RLS | 완료 | 다음 병목 선정이 아니라 파트너가 자기 회사 알림만 읽을 수 있게 RLS를 추가한다 | partner notification select policy | rg, Supabase lint |
| P57.3 marketplace notification inbox repository | 완료 | RLS 추가가 아니라 파트너/운영자가 읽을 알림 목록 read model을 만든다 | notification inbox repository | unit, typecheck |
| P57.4 marketplace notification inbox UI surface | 완료 | 서버 read model이 아니라 파트너가 대시보드에서 인앱 알림을 실제로 확인하게 한다 | partner notification inbox surface | unit, browser, typecheck |
| P57.5 marketplace notification read-state design | 완료 | 알림 노출이 아니라 사용자가 본 알림과 아직 확인하지 않은 알림을 구분할 수 있는 read-state 기준을 정한다 | notification read-state plan/schema decision | schema review, docs |
| P57.6 marketplace notification read action UI | 완료 | 읽음 상태 저장 기준이 아니라 사용자가 대시보드에서 알림을 읽음 처리할 수 있게 한다 | notification read server action and UI | unit, browser, typecheck |
| P57.7 marketplace notification authenticated e2e fixture | 완료 | 읽음 버튼 연결이 아니라 로컬 Supabase에서 인증된 파트너 세션으로 알림 표시/읽음 처리까지 브라우저 검증할 수 있게 한다 | notification dashboard e2e fixture | readiness, e2e script |
| P58.1 marketplace notification final self-review | 완료 | 인증 E2E 준비가 아니라 P57 전체 inbox/read-state/read-action 변경을 보안·UX·운영 관점에서 자체 리뷰한다 | notification inbox self-review | rg, targeted tests, docs |
| P59.1 platform next-area selection | 완료 | 알림 inbox 자체 리뷰가 아니라 다음 플랫폼 MVP 병목을 다시 선택한다 | operations users owner-mode selected | roadmap/code review |
| P59.2 operations users owner-mode priority surface | 완료 | 다음 병목 선정이 아니라 사용자 관리 화면 상단에 대표가 먼저 볼 우선순위와 안전한 개선 요청 문구를 배치한다 | owner-mode user ops priority surface | UX review, typecheck, browser |
| P59.3 operations users detail density review | 완료 | 상단 우선순위 표면이 아니라 펼쳐진 사용자 상세 내부에서 위험 작업과 평소 확인 정보를 더 분리한다 | user detail density and risk grouping | UX review, unit, typecheck |
| P59.4 operations users self-review | 완료 | 사용자 상세 내부 UX 정리가 아니라 P59 운영 사용자 관리 화면 변경 전체를 자체 리뷰한다 | operations users self-review | rg, targeted tests, docs |
| P60.1 platform next-area selection | 완료 | 운영 사용자 관리 화면 자체 리뷰가 아니라 다음 플랫폼 MVP 병목을 다시 선택한다 | marketplace request transaction e2e selected | roadmap/code review |
| P60.2 marketplace request transaction e2e readiness | 완료 | 다음 병목 선정이 아니라 화주 요청→파트너 입찰→화주 선정 흐름을 로컬에서 검증할 준비 상태를 점검한다 | transaction e2e readiness script | guarded safe fail, no secrets |
| P60.3 marketplace request transaction e2e script skeleton | 완료 | readiness 점검이 아니라 준비된 role storage state로 운송/통관 거래 화면을 검증하는 guarded E2E skeleton을 만든다 | transaction e2e script skeleton | local guard, safe fail |
| P60.4 marketplace transaction e2e fixture plan | 완료 | E2E skeleton이 아니라 skeleton이 실제로 통과할 수 있는 local seed/auth fixture 구조를 설계한다 | transaction seed/auth fixture plan | docs, fixture contract |
| P60.5 marketplace transaction fixture module | 완료 | fixture plan 문서가 아니라 seed/e2e/readiness가 공유할 fixture 상수 모듈과 테스트를 만든다 | transaction fixture constants | unit, typecheck |
| P60.6 marketplace transaction seed runner skeleton | 완료 | fixture 상수가 아니라 이 상수를 local Supabase에 넣는 guarded seed runner 골격을 만든다 | transaction seed runner skeleton | local guard, safe fail |
| P60.7 marketplace transaction seed upsert implementation | 완료 | seed runner 골격이 아니라 실제 local Supabase에 사용자/회사/역할/요청/입찰 fixture를 upsert한다 | transaction seed upserts | local guard, safe fail, fixture test |
| P60.8 marketplace transaction auth state script | 완료 | DB fixture upsert가 아니라 seeded requester/forwarder/broker 계정으로 로그인 storage state를 생성한다 | transaction auth storage states | local guard, safe fail, browser auth |
| P60.9 marketplace transaction local runbook | 완료 | auth state 생성 스크립트가 아니라 seed/auth/e2e 실행 순서와 막힘 조건을 운영 가능한 문서로 고정한다 | transaction local runbook | docs, readiness command sync |
| P60.10 marketplace transaction E2E assertion tightening | 완료 | runbook이 아니라 requester 상세과 partner opportunity 화면에서 견적 비교/제출 관련 문구를 더 구체적으로 검증한다 | tighter transaction e2e assertions | guarded e2e safe fail, typecheck |
| P60.11 marketplace transaction E2E harness self-review | 완료 | assertion 강화가 아니라 seed/auth/readiness/e2e harness 전체의 보안·QA 위험을 자체 리뷰한다 | transaction e2e self-review | rg, docs, targeted checks |
| P61.1 marketplace transaction local runner | 완료 | 자체 리뷰가 아니라 local preflight가 통과할 때 seed/auth/e2e를 한 명령으로 순차 실행하는 runner를 만든다 | transaction local runner | guarded safe fail, no secrets |
| P61.2 marketplace transaction harness final verification | 완료 | local runner가 아니라 P60-P61 harness 변경 전체를 type/lint/build와 safe-fail 실행으로 최종 검증한다 | transaction harness final verification | typecheck, lint, build, safe fails |
| P62.1 marketplace transaction mutation E2E plan | 완료 | harness 최종 검증이 아니라 UI에서 파트너 입찰 제출과 화주 선정까지 실제 mutation E2E로 확장할 계획을 세운다 | mutation e2e plan | docs, RPC/RLS risk review |
| P62.2 marketplace transaction mutation fixture contract | 완료 | mutation 계획이 아니라 반복 실행 가능한 별도 mutation request/bid fixture 상수와 env 계약을 추가한다 | mutation fixture constants | unit, typecheck |
| P62.3 marketplace transaction mutation seed support | 완료 | mutation fixture 상수가 아니라 seed runner가 open 상태의 mutation 요청과 매칭을 별도 fixture로 준비하게 한다 | mutation seed support | safe fail, unit, typecheck |
| P62.4 marketplace transaction mutation E2E skeleton | 완료 | mutation seed가 아니라 seeded mutation 요청으로 파트너 견적 제출과 화주 선택을 시도하는 guarded E2E skeleton을 만든다 | mutation e2e skeleton | node check, safe fail |
| P62.5 marketplace transaction mutation harness verification | 완료 | mutation E2E skeleton이 아니라 seed/static/mutation/local runner 전체를 최종 검증하고 문서 위험을 갱신한다 | mutation harness verification | typecheck, lint, build, safe fail |
| P63.1 local Supabase positive-run unblock check | 완료 | mutation harness 코드가 아니라 현재 머신에서 local Supabase positive E2E 실행을 막는 실제 조건을 확인한다 | local positive-run blockers | supabase status, env check |
| P63.2 marketplace transaction seed schema preflight | 완료 | local positive-run 실패 분석이 아니라 seed가 schema 미적용 상태를 더 명확히 안내하게 한다 | seed schema preflight | safe fail, typecheck |
| P63.3 marketplace transaction final build after preflight | 완료 | schema preflight가 아니라 최종 lint/build와 next-env 복구까지 확인한다 | final verification | lint, build |
| P64.1 local migration application decision | 완료 | 코드 검증이 아니라 positive E2E를 위해 local Supabase에 marketplace migration을 적용할지 사용자가 나중에 판단할 수 있게 정리한다 | local migration decision | docs |
| P64.2 next platform work selection | 완료 | local migration 판단 문서가 아니라 DB 적용 없이 이어갈 다음 플랫폼 작업을 다시 고른다 | local login review smoke selected | roadmap review |
| P64.3 local login review smoke | 완료 | 다음 작업 선정이 아니라 로컬 서버가 테스트 계정 로그인을 실제로 통과하는지 재확인하는 도구를 만든다 | local login smoke script, review runbook | browser smoke, node check, typecheck, lint |
| P64.4 marketplace role visibility blocker review | 완료 | 로그인 smoke가 아니라 marketplace schema 미적용 상태에서 역할별 화면 확인이 어디까지 가능한지 정리한다 | role visibility blocker notes, schema smoke | code review, safe-fail smoke, typecheck, lint |
| P64.5 local review positive-path decision | 완료 | 역할별 화면 blocker 확인이 아니라 positive path를 local Supabase migration으로 열지 결정한다 | local review gate | user-approved DB action only |
| P65.1 marketplace schema fallback UX | 완료 | local migration 적용 결정이 아니라 schema 미준비 상태에서 사용자가 계정 문제로 오해하지 않게 화면 문구를 정리한다 | dashboard/request fallback copy | UX review, typecheck, lint, browser, build |
| P65.2 operations schema fallback UX | 완료 | 사용자 요청 화면 문구가 아니라 운영자 전용 요청 통계/상세 화면의 schema 미준비 안내를 정리한다 | operations/settings fallback copy | UX review, typecheck, lint, browser, build |
| P65.3 local review status snapshot | 완료 | fallback 문구 정리가 아니라 사용자가 돌아와 바로 볼 수 있게 현재 로컬 서버/로그인/스키마 상태를 한 문서와 명령으로 요약한다 | local review status command, docs | smoke commands, typecheck, lint, docs |
| P65.4 next non-DB platform work selection | 완료 | 로컬 검토 상태 요약이 아니라 DB 적용 없이 이어갈 다음 플랫폼 작업을 고른다 | all-role local review smoke selected | roadmap review |
| P65.5 all-role local review smoke | 완료 | 상태 요약 명령 생성이 아니라 화주·포워더·관세사 세 테스트 계정 전체를 같은 명령에서 확인한다 | review status all-role login smoke | smoke, typecheck, lint |
| P65.6 local review browser route bundle | 완료 | 로그인 검증 범위 확대가 아니라 사용자가 실제로 볼 주요 화면 묶음을 브라우저로 점검한다 | local route bundle smoke | browser, typecheck, lint |
| P65.7 local review final verification | 완료 | route bundle 추가가 아니라 로그인/status/routes/schema 문서와 스크립트 전체를 최종 검증한다 | local review verification bundle | node check, smoke, typecheck, lint, build |
| P66.1 next non-DB platform work selection | 완료 | 로컬 리뷰 unblock 검증이 아니라 DB 적용 없이 이어갈 다음 제품 작업을 고른다 | display-only role intent selected | roadmap review |
| P66.2 display-only role intent visibility | 완료 | schema fallback 문구가 아니라 가입 시 선택한 역할을 승인 권한과 분리해 화면에 표시한다 | role intent badges, no permission grant | unit, browser, typecheck, lint, build |
| P66.3 local review route all-role intent assertion | 완료 | 역할 의도 배지 표시가 아니라 로컬 route 검증이 포워더/관세사 의도 배지를 회귀 테스트하게 한다 | route smoke role intent assertions | browser, typecheck, lint |
| P66.4 role intent visibility final verification | 완료 | route smoke 확장이 아니라 역할 의도 표시 변경 전체를 최종 검증한다 | final verification | unit, smoke, typecheck, lint, build |
| P67.1 next non-DB platform work selection | 완료 | 역할 의도 표시 검증이 아니라 DB 적용 없이 이어갈 다음 제품 작업을 고른다 | dashboard role-aware actions selected | roadmap review |
| P67.2 dashboard role-aware action cards | 완료 | 역할 의도 배지 표시가 아니라 대시보드 시작 카드를 화주/포워더/관세사 역할에 맞게 줄인다 | role-aware dashboard actions | browser, typecheck, lint |
| P67.3 dashboard role-aware action route assertion | 완료 | 카드 노출 로직이 아니라 route smoke에서 역할별 카드 노출/미노출을 회귀 검증한다 | route smoke role-aware action assertions | browser, typecheck, lint |
| P67.4 dashboard role-aware action final verification | 완료 | route smoke assertion이 아니라 대시보드 역할별 카드 변경 전체를 최종 검증한다 | final verification | unit, smoke, typecheck, lint, build |
| P68.1 next non-DB platform work selection | 완료 | 대시보드 역할별 카드 최종 검증이 아니라 DB 적용 없이 이어갈 다음 제품 작업을 고른다 | marketplace notification local rehearsal selected | roadmap review |
| P68.2 marketplace notification local rehearsal | 완료 | 인박스 읽음 처리가 아니라 운영자가 worker route의 target 계산, send 차단, claim-only 동작을 로컬에서 확인한다 | notification rehearsal script | node check, rehearsal, unit, typecheck, lint |
| P68.3 operator visibility simplification | 완료 | 알림 worker 리허설이 아니라 대표/운영자가 다음 조치만 빠르게 보도록 운영 화면 노이즈를 줄인다 | primary metrics, collapsed diagnostics | unit, browser, typecheck, lint |
| P68.4 partner action conversion review | 완료 | 운영자 관리 화면 단순화가 아니라 파트너가 알림을 본 뒤 입찰 상세로 이동하고 행동할 수 있는지 점검한다 | notification-to-opportunity E2E | readiness, e2e, typecheck, lint |
| P68.5 next platform rail selection | 완료 | 파트너 알림 행동 전환 검증이 아니라 다음으로 이어갈 플랫폼 MVP 병목을 다시 고른다 | requester dashboard action conversion selected | roadmap/code review |
| P69.1 requester dashboard action conversion review | 완료 | 파트너 알림에서 입찰 상세로 이동하는 검증이 아니라 화주가 대시보드 다음 행동에서 요청 상세와 견적 비교 CTA로 이동하는지 점검한다 | requester dashboard direct detail links | unit, browser, e2e, typecheck, lint |
| P69.2 requester detail bid-focus review | 완료 | 대시보드가 상세로 바로 가는 링크가 아니라 상세 도착 후 견적 비교·선정 영역이 충분히 빨리 보이는지 점검한다 | request-bids anchor E2E | e2e, node check |
| P69.3 post-selection completion flow review | 완료 | 상세 견적 앵커 검증이 아니라 업체 선정 후 진행중·완료·피드백 전환이 실제 사용 흐름에서 막히지 않는지 점검한다 | mutation E2E lifecycle extension | local runner, node check |
| P69.4 post-completion report handoff review | 완료 | 완료/피드백 전환 검증이 아니라 완료 이후 리포트·정산·보관 서류 안내가 실제 다음 행동으로 충분한지 점검한다 | completion report handoff UX | local runner, typecheck, lint |
| P69.5 transaction flow final self-review | 완료 | 완료 리포트 안내 보강이 아니라 P69 대시보드→상세→선정→완료→피드백→리포트 흐름 전체를 자체 리뷰한다 | mutation plan docs sync | docs, local runner |
| P70.1 next platform rail selection | 완료 | 거래 흐름 자체 리뷰가 아니라 다음으로 이어갈 플랫폼 MVP 병목을 다시 고른다 | operations completion-report visibility selected | roadmap/code review |
| P70.2 operations completion handoff visibility | 완료 | 사용자 거래 완료 흐름이 아니라 운영자가 완료 리포트·피드백 누락 병목을 바로 확인하고 상세로 들어갈 수 있는지 점검한다 | operations completion handoff review | browser, typecheck, lint |
| P70.3 operations sensitive-field regression guard | 완료 | 운영 상세 표시 보강이 아니라 완료/피드백 조회가 코멘트·금액·원문 같은 민감 필드를 다시 가져오지 못하게 테스트로 고정한다 | repository select guard | unit, typecheck, lint |
| P70.4 operations bottleneck action rail | 완료 | 운영 상세의 단건 확인이 아니라 운영 통계 화면에서 완료 리포트·피드백·오래 진행중 병목을 바로 다음 행동으로 고르는 흐름을 정리한다 | operations dashboard action review | browser, unit, typecheck, lint |
| P70.5 operations bottleneck priority refinement | 완료 | 운영 통계 화면 링크 노출이 아니라 서버 요약이 완료 리포트·피드백 병목을 올바른 순서로 샘플링하는지 보강한다 | operations summary priority tests | unit, typecheck, lint |
| P71.1 requester transaction status clarity | 완료 | 운영자 병목 관리가 아니라 화주 대시보드와 상세에서 선정·진행·완료 상태의 다음 행동 문구가 충분히 명확한지 보강한다 | requester status UX review | browser, unit, typecheck, lint |
| P71.2 partner transaction status clarity | 완료 | 화주 상세 상태 안내가 아니라 포워더·관세사 입찰 상세에서 선정 이후 다음 행동과 완료 리포트·피드백 위치를 명확히 한다 | partner status UX review | browser, unit, typecheck, lint |
| P71.3 request list next-action label consistency | 완료 | 상세 상단 바로가기가 아니라 운송·통관 요청 목록 카드의 다음 작업 라벨이 선정·진행·완료 상태를 일관되게 설명하는지 보강한다 | request list label review | browser, typecheck, lint |
| P71.4 clearance list status browser review | 완료 | 운송 목록 검증이 아니라 통관 요청 목록에서도 선정·진행·완료 다음 작업 라벨이 실제 화면에서 어색하지 않은지 확인한다 | clearance list browser review | browser |
| P72.1 marketplace completion document gap review | 완료 | 거래 상태 라벨 정리가 아니라 완료 리포트의 최종 보관 서류 누락 안내가 화주와 파트너 양쪽에서 충분히 행동 가능하게 보이는지 점검한다 | completion document gap UX | browser, typecheck, lint |
| P72.2 completion draft CTA placement review | 완료 | 보관 서류 누락 문구가 아니라 완료 리포트 초안 작성 CTA가 완료 직후 화면에서 충분히 찾기 쉬운지 점검한다 | completion draft CTA UX | browser, typecheck, lint |
| P72.3 completion workflow disabled guidance | 완료 | 초안 CTA 배치가 아니라 제출·확인 단계 카드의 비활성 버튼 문구가 왜 대기인지 충분히 설명하는지 보강한다 | completion workflow disabled copy | unit, browser, typecheck, lint |
| P72.4 feedback submitted state clarity | 완료 | 완료 리포트 단계 문구가 아니라 완료 후 피드백이 이미 제출된 상태에서 사용자가 다음 행동을 혼동하지 않는지 점검한다 | feedback submitted UX | browser, typecheck, lint |
| P72.5 completion handoff docs sync | 완료 | 피드백 제출 상태 UI가 아니라 P72 완료 리포트·보관 서류·피드백 UX 개선사항을 거래 E2E 문서에 반영한다 | completion handoff docs sync | docs, diff check |
| P73.1 dashboard completion next-action review | 완료 | 완료 상세 handoff가 아니라 대시보드의 다음 행동 카드가 완료 리포트·피드백 누락 거래를 바로 상세로 연결하는지 점검한다 | dashboard completion action UX | browser, unit, typecheck, lint |
| P73.2 dashboard completion metric visibility | 완료 | 대시보드 다음 행동 링크가 아니라 완료 리포트 대기 수를 하단 지표에서도 바로 볼 수 있게 정리한다 | dashboard completion metric UX | browser, unit, typecheck, lint |
| P73.3 dashboard operations metric alignment | 완료 | 대시보드 지표 추가가 아니라 사용자 대시보드의 리포트 대기 의미가 운영 통계의 완료 리포트 없음과 어떻게 다른지 정리한다 | dashboard metric alignment docs | docs, diff check |
| P74.1 partner dashboard completion handoff review | 완료 | 화주 대시보드 완료 지표가 아니라 파트너 대시보드에서 선정 후 완료/리포트 관련 다음 행동이 누락되지 않는지 점검한다 | partner dashboard handoff UX | browser, unit, typecheck, lint |
| P74.2 partner dashboard metric wording | 완료 | 파트너 다음 행동 카드가 아니라 하단 지표에서 입찰 가능 수와 선정 후 파트너 업무 수가 혼동되지 않게 정리한다 | partner metric wording UX | browser, typecheck, lint |
| P74.3 partner dashboard metric semantics docs | 완료 | 파트너 대시보드 지표 추가가 아니라 파트너 업무와 입찰 가능 지표의 차이를 E2E 문서 기준에 남긴다 | partner metric semantics docs | docs, diff check |
| P75.1 marketplace final route smoke after dashboard changes | 완료 | 대시보드 문서 정리가 아니라 화주·포워더·관세사 주요 route가 이번 변경 뒤에도 깨지지 않는지 한 번에 점검한다 | role route smoke | browser, typecheck, lint |
| P75.2 marketplace dashboard-change final log | 완료 | route smoke가 아니라 이번 대시보드/완료 handoff 변경 묶음의 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P76.1 next marketplace rail selection | 완료 | 작업 로그 정리가 아니라 다음으로 이어갈 marketplace MVP 병목을 다시 고른다 | request publish readiness rail selected | roadmap/code review |
| P76.2 freight request publish readiness review | 완료 | 완료/대시보드 handoff가 아니라 화주가 운송 초안을 공개 요청으로 전환하기 전 누락값과 다음 위치를 바로 이해하는지 보강한다 | freight draft-to-publish UX | browser, typecheck, lint |
| P76.3 clearance request publish readiness review | 완료 | 운송 공개 전환이 아니라 통관 의뢰 초안에서도 관세사무소 공개 필수값과 다음 행동이 같은 기준으로 보이는지 점검한다 | clearance draft-to-publish UX | browser, typecheck, lint |
| P76.4 publish readiness e2e criteria docs | 완료 | 통관 UI 보강이 아니라 운송·통관 공개 전환 기준과 브라우저 검증 항목을 E2E 문서에 고정한다 | publish readiness docs sync | docs, diff check |
| P76.5 publish readiness route smoke | 완료 | 공개 준비 기준 문서화가 아니라 변경 후 화주·포워더·관세사 주요 요청 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P76.6 publish readiness work log sync | 완료 | route smoke가 아니라 공개 준비 UX와 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P77.1 next marketplace rail selection | 완료 | 공개 준비 작업 로그가 아니라 다음으로 이어갈 marketplace MVP 병목을 다시 고른다 | bid comparison and selection rail selected | roadmap/code review |
| P77.2 freight bid comparison badges | 완료 | 공개 전 필수값 안내가 아니라 견적 도착 후 화주가 운송 견적의 최저가·최단 일정·후기 여부를 카드에서 바로 구분하게 한다 | freight bid comparison UX | browser, typecheck, lint |
| P77.3 clearance bid comparison badges | 완료 | 운송 견적 비교 배지가 아니라 통관 견적에서도 총액·통관일수·검토 가능성을 같은 기준으로 보이게 한다 | clearance bid comparison UX | browser, typecheck, lint |
| P77.4 bid comparison e2e criteria docs | 완료 | 통관 견적 비교 배지가 아니라 운송·통관 견적 비교 배지 기준을 E2E 문서에 고정한다 | bid comparison docs sync | docs, diff check |
| P77.5 bid comparison route smoke | 완료 | 견적 비교 기준 문서화가 아니라 비교 배지 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P77.6 bid comparison work log sync | 완료 | route smoke가 아니라 견적 비교/선정 UX와 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P78.1 next marketplace rail selection | 완료 | 견적 비교 작업 로그가 아니라 다음으로 이어갈 marketplace MVP 병목을 다시 고른다 | overseas partner onboarding rail selected | roadmap/code review |
| P78.2 overseas signup notice clarity | 완료 | 견적 비교/선정 UX가 아니라 해외 파트너가 사업자번호 없이 가입할 때 검증자료와 제한 기능을 바로 이해하게 한다 | overseas signup UX | typecheck, lint |
| P78.3 overseas role request clarity | 완료 | 회원가입 안내가 아니라 회사 설정 역할 신청 화면에서 해외 파트너 검증 기준과 보류 가능성을 더 분명히 안내한다 | overseas role request UX | browser, typecheck, lint |
| P78.4 overseas onboarding route smoke | 완료 | 역할 신청 안내 보강이 아니라 온보딩/설정 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P78.5 overseas onboarding work log sync | 완료 | route smoke가 아니라 해외 파트너 온보딩 안내 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P79.1 next marketplace rail selection | 완료 | 해외 파트너 온보딩 작업 로그가 아니라 다음으로 이어갈 marketplace MVP 병목을 다시 고른다 | partner preference notification rail selected | roadmap/code review |
| P79.2 partner preference notification clarity | 완료 | 해외 파트너 온보딩이 아니라 포워더·관세사무소가 어떤 조건과 알림 기준으로 요청을 받을지 설정 화면에서 바로 이해하게 한다 | partner preference UX | browser, typecheck, lint |
| P79.3 partner preference route smoke | 완료 | 관심 조건 안내 보강이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P79.4 partner preference work log sync | 완료 | route smoke가 아니라 파트너 관심 조건/알림 안내 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P80.1 next marketplace rail selection | 완료 | 파트너 관심 조건 작업 로그가 아니라 다음으로 이어갈 marketplace MVP 병목을 다시 고른다 | owner operations triage rail selected | roadmap/code review |
| P80.2 owner operations priority owner cues | 완료 | 파트너 관심 조건/알림이 아니라 대표가 운영 우선순위 큐에서 담당 주체와 우선 이유를 바로 이해하게 한다 | operations priority UX | unit, browser, typecheck, lint |
| P80.3 operations sample detail action cues | 완료 | 운영 통계 큐가 아니라 운영 샘플 상세 화면에서 개선 요청 문구와 다음 확인 위치가 충분히 명확한지 점검한다 | operations detail UX | browser, typecheck, lint |
| P80.4 operations route smoke | 완료 | 운영 상세 안내 보강이 아니라 변경 후 화주·파트너·운영 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P80.5 owner operations work log sync | 완료 | route smoke가 아니라 대표 운영 큐/상세 안내 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P81.1 next marketplace rail selection | 완료 | 대표 운영 큐 작업 로그가 아니라 다음으로 이어갈 marketplace MVP 병목을 다시 고른다 | document visibility handoff rail selected | roadmap/code review |
| P81.2 requester document visibility guidance | 완료 | 운영 큐가 아니라 화주가 운송/통관 서류 공개 범위를 선택할 때 파트너 노출 기준과 민감서류 보관 기준을 바로 이해하게 한다 | document visibility UX | unit, browser, typecheck, lint |
| P81.3 partner visible document notice | 완료 | 화주 업로드 기준 안내가 아니라 포워더·관세사무소가 현재 보이는 서류가 공개 허용된 서류만이라는 점을 이해하게 한다 | partner document UX | unit, browser, typecheck, lint |
| P81.4 document visibility route smoke | 완료 | 파트너 안내 보강이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P81.5 document visibility work log sync | 완료 | route smoke가 아니라 서류 공개 범위 handoff 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P82.1 completion report model selection | 완료 | 서류 공개 범위 안내가 아니라 거래 완료 후 결과 메타데이터와 최종 보관 서류 모델을 시작할지 검토한다 | existing completion report model confirmed | schema/doc review |
| P82.2 completion report primary next action | 완료 | 완료 리포트 모델 검토가 아니라 과밀한 완료 리포트 패널에서 현재 대표 행동을 먼저 보여준다 | completion report UX | unit, browser, typecheck, lint |
| P82.3 completion report route smoke | 완료 | 대표 행동 요약 보강이 아니라 변경 후 marketplace 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P82.4 completion report work log sync | 완료 | route smoke가 아니라 완료 리포트 대표 행동 요약 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P83.1 operations density selection | 완료 | 완료 리포트 상세가 아니라 대표/운영자 화면의 우선순위 카드 밀도와 다음 행동 이해도를 다시 점검한다 | owner action density selected | UX/code review |
| P83.2 owner queue single primary action | 완료 | 담당/이유 표시가 아니라 대표 우선순위 큐에서 1순위만 기본 노출하고 다음 후보는 접어둔다 | operations density UX | unit, browser, typecheck, lint |
| P83.3 operations density route smoke | 완료 | 우선순위 큐 밀도 조정이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P83.4 operations density work log sync | 완료 | route smoke가 아니라 운영 우선순위 큐 밀도 조정과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P84.1 operations detail handoff selection | 완료 | 운영 목록 밀도 조정이 아니라 복사한 개선 요청이 운영 상세의 실제 확인 위치로 이어지는 흐름을 다시 점검한다 | handoff action strip selected | UX/code review |
| P84.2 operations detail handoff action strip | 완료 | 운영 목록 1순위 노출이 아니라 운영 상세에서 확인 위치, 복사, 작업 전달 순서를 한 번에 보이게 한다 | operations detail UX | browser, typecheck, lint |
| P84.3 operations detail route smoke | 완료 | 상세 handoff 표시가 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P84.4 operations detail work log sync | 완료 | route smoke가 아니라 운영 상세 handoff 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P85.1 requester next-action selection | 완료 | 운영 상세 handoff가 아니라 화주 요청 상세에서 사용자가 다음 행동을 바로 찾는지 다시 점검한다 | requester publish anchor gap selected | UX/code review |
| P85.2 requester publish next-action anchor | 완료 | 기존 다음 작업 바로가기 표시가 아니라 운송/통관 초안 공개 CTA가 실제 공개 form anchor로 이동하게 한다 | requester next-action UX | unit, browser, typecheck, lint |
| P85.3 requester next-action route smoke | 완료 | 공개 anchor 보강이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P85.4 requester next-action work log sync | 완료 | route smoke가 아니라 화주 상세 next-action anchor 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P86.1 partner next-action selection | 완료 | 화주 상세 next-action이 아니라 포워더·관세사무소 opportunity 상세의 다음 행동 바로가기를 다시 점검한다 | partner next-focus test gap selected | UX/code review |
| P86.2 partner next-focus regression tests | 완료 | 파트너 상세 UI 추가가 아니라 질문 확인, 견적 제출, 완료 처리 우선순위를 테스트로 고정한다 | partner next-action tests | unit, browser, typecheck, lint |
| P86.3 partner next-action route smoke | 완료 | 파트너 next-focus 테스트가 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P86.4 partner next-action work log sync | 완료 | route smoke가 아니라 파트너 next-focus 테스트 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P87.1 partner bid form guidance selection | 완료 | 파트너 next-action이 아니라 포워더·관세사무소 견적 제출 form의 입력 전 안내와 안전 문구를 점검한다 | freight bid guidance gap selected | UX/code review |
| P87.2 freight bid form guidance | 완료 | 통관 견적 안전 문구가 아니라 포워더 운송 견적 form에도 입력 전 확인 안내와 제안 성격 문구를 추가한다 | freight bid form UX | browser, typecheck, lint |
| P87.3 partner bid form route smoke | 완료 | 운송 견적 form 안내 보강이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P87.4 partner bid form work log sync | 완료 | route smoke가 아니라 포워더 운송 견적 form 안내 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P88.1 completion feedback CTA selection | 완료 | 파트너 견적 form이 아니라 완료 후 화주/파트너 피드백 CTA가 적절한지 점검한다 | trust metric context selected | UX/code review |
| P88.2 feedback trust metric context | 완료 | 피드백 입력 form 추가가 아니라 제출한 평점이 파트너 신뢰 지표에 쓰인다는 맥락을 명확히 한다 | feedback CTA UX | browser, typecheck, lint |
| P88.3 feedback CTA route smoke | 완료 | 피드백 문구 보강이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P88.4 feedback CTA work log sync | 완료 | route smoke가 아니라 피드백 신뢰 지표 맥락 보강과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P89.1 operations prompt quality selection | 완료 | 완료 후 사용자 피드백 CTA가 아니라 운영자가 복사하는 개선 요청 문구의 길이와 명확성을 점검한다 | copy prompt metric trim selected | UX/code review |
| P89.2 operations copy prompt core metrics | 완료 | 운영 통계 화면 표시가 아니라 복사되는 개선 요청문에는 핵심 지표만 포함하게 줄인다 | operations prompt UX | unit, browser, typecheck, lint |
| P89.3 operations prompt route smoke | 완료 | 복사용 문구 축약이 아니라 변경 후 화주·포워더·관세사 주요 route가 계속 정상 렌더링되는지 확인한다 | role route smoke | browser, typecheck, lint |
| P89.4 operations prompt work log sync | 완료 | route smoke가 아니라 복사용 운영 개선 요청문 축약과 검증 결과를 작업 로그에 남긴다 | work log sync | docs, diff check |
| P90.1 marketplace duplicate guidance selection | 완료 | 복사용 운영 요청문이 아니라 marketplace 거래 화면 안에서 반복 안내가 과한 곳을 다시 점검한다 | detail flow panel duplicate selected | UX/code review |
| P90.2 request detail duplicate flow panels | 완료 | 중복 안내 선택이 아니라 화주·파트너 상세에서 상단 다음 작업 바로가기와 반복되는 상세 흐름 패널을 걷어낸다 | detail density trim | browser, typecheck, lint |
| P90.3 requester detail flow dead code cleanup | 완료 | 화면 패널 제거가 아니라 더 이상 쓰이지 않는 화주 상세 전용 흐름 컴포넌트를 정리한다 | unused component cleanup | typecheck, lint |
| P91.1 marketplace start guidance scope review | 완료 | 상세 화면 중복 제거가 아니라 요청 시작·목록 화면의 안내 패널이 실제 시작 흐름에만 남아 있는지 점검한다 | clearance requester misplaced partner flow selected | UX/code review |
| P91.2 clearance list guidance workspace alignment | 완료 | 안내 범위 점검이 아니라 통관 화주 목록에 잘못 보이던 관세사무소 입찰 흐름 패널을 관세사 workspace로 옮긴다 | workspace-specific guidance | browser, typecheck, lint |
| P92.1 marketplace compact row action density review | 완료 | 시작·목록 안내 위치가 아니라 요청 row 안의 카드/버튼/상태 문구가 너무 많은지 점검한다 | clearance row action layout selected | UX/code review |
| P92.2 clearance row action layout alignment | 완료 | row 밀도 점검이 아니라 통관 row의 상세 작업 버튼을 상태 badge와 분리해 운송 row 구조와 맞춘다 | requester row action layout | browser, typecheck, lint |
| P93.1 selected partner next-step density review | 완료 | row 상단 버튼 구조가 아니라 선정 후 다음 업무 카드가 너무 많은 문장을 펼쳐 보이는지 점검한다 | compact selected next-step card selected | UX/code review |
| P93.2 compact selected next-step summary | 완료 | 선정 후 카드 점검이 아니라 목록 row에서는 상세 3단계 카드를 요약 문구로 줄이고 상세 화면에서만 전체 안내를 유지한다 | compact selected summary | browser, typecheck, lint |
| P94.1 compact completion report density review | 완료 | 선정 후 다음 업무 카드가 아니라 완료 상태 row의 완료 리포트 패널이 목록에서 과하게 펼쳐지는지 점검한다 | compact completion report panel selected | UX/code review |
| P94.2 compact completion report summary | 완료 | 완료 리포트 점검이 아니라 목록 row에서는 전체 리포트/피드백 패널 대신 상세 작업 안내 요약만 보여준다 | compact completion summary | browser, typecheck, lint |
| P95.1 partner compact opportunity density review | 완료 | 화주 완료 row 요약이 아니라 파트너 입찰 가능 목록의 compact opportunity row가 필요한 정보만 보여주는지 점검한다 | freight compact status copy selected | UX/code review |
| P95.2 freight opportunity compact status copy | 완료 | 파트너 목록 점검이 아니라 운송 compact row도 진행중/완료 상태를 선정 후 업무 안내로 묶어 통관과 맞춘다 | partner compact copy alignment | browser, typecheck, lint |
| P96.1 marketplace status copy consistency review | 완료 | 파트너 compact row 단일 조건 수정이 아니라 운송·통관 요청/입찰 상태 문구 전반의 불일치를 점검한다 | selected-or-later progress gap selected | UX/code review |
| P96.2 request progress selected-or-later state | 완료 | 상태 문구 점검이 아니라 진행중/완료 요청도 이미 선정 단계가 끝난 것으로 progress를 표시하게 맞춘다 | progress state consistency | browser, typecheck, lint |
| P97.1 request progress helper consolidation review | 완료 | progress 상태 보정이 아니라 운송·통관 progress 단계 계산을 공통 helper로 합칠 가치가 있는지 점검한다 | selected-or-later helper selected | code review |
| P97.2 selected-or-later status helper | 완료 | progress 렌더링 공통화가 아니라 선정 이후 상태 판단만 공통 helper로 분리한다 | service request status helper | browser, typecheck, lint |
| P98.1 marketplace status counts consolidation review | 완료 | 선정 이후 상태 helper가 아니라 운송·통관 요청 상태 count 계산 중복을 공통화할 가치가 있는지 점검한다 | identical status count helper selected | code review |
| P98.2 service request status count helper | 완료 | count 중복 점검이 아니라 동일한 요청 상태 count 계산을 공통 helper로 분리한다 | service request count helper | browser, typecheck, lint |
| P99.1 marketplace label helper consolidation review | 완료 | 상태 count helper가 아니라 status/visibility/bid label 함수 중 공통화 가능한 것과 역할별 문구 차이가 있는 것을 구분한다 | shared document and bid labels selected | code review |
| P99.2 shared service request document and bid labels | 완료 | label helper 검토가 아니라 동일한 문서 유형·입찰 상태 label/tone만 공통화하고 역할별 공개 범위 문구는 유지한다 | shared label helpers | browser, typecheck, lint |
| P100.1 marketplace refactor boundary review | 완료 | label helper 공통화가 아니라 marketplace 패널 리팩터링을 더 진행할지, 다음 기능 작업으로 전환할지 경계 점검한다 | stop broad refactor, switch to feature work | code/UX review |
| P101.1 marketplace next feature selection | 완료 | 리팩터링 경계 점검이 아니라 플랫폼 MVP에서 다음 기능 작업 후보를 다시 고른다 | requester post-publish visibility selected | product/UX review |
| P101.2 requester match notification summary | 완료 | 기능 후보 선정이 아니라 화주가 공개 후 파트너 노출 수와 알림 상태를 요청 row에서 상시 확인하게 한다 | requester match summary | browser, typecheck, lint |
| P102.1 requester match summary test coverage | 완료 | UI 표시가 아니라 match summary read model과 panel의 회귀 테스트를 보강한다 | match summary tests | unit, typecheck, lint |
| P103.1 requester match summary UX follow-up review | 예정 | 테스트 보강이 아니라 노출 0건일 때 화주가 다음 행동을 바로 찾는지 점검한다 | zero-match UX review | UX/browser review |

#### P34 다음 코드 작업 후보

1. 해외 파트너 온보딩 보강
   - 해외 업체는 한국 사업자번호 없이 가입할 수 있으므로 검증, 서류, 국가 역할, 언어 기대치를 더 분명히 안내해야 한다.
   - 이미 요청 시작 prefill은 있으므로 새 schema보다 화면 안내와 빈 상태 보강이 우선이다.
2. 거래 완료 리포트 실제 모델 초안
   - placeholder는 들어갔지만 실제 신고/운송 결과 메타데이터와 최종 보관 서류 묶음 모델은 아직 없다.
   - DB/RLS 작업이므로 별도 migration 계획과 security review가 필요하다.
3. 알림 internal dry-run 운영 리허설
   - route와 provider skeleton은 준비됐다.
   - 실제 production env 설정 전 로컬/service role 기반 리허설 스크립트를 만들 수 있다.
4. 운영 화면 카드 밀도 재점검
   - 운영 통계, 신뢰지표, 개선 요청 문구가 많아졌다.
   - 대표가 “봐도 모르는” 상태가 되지 않게 우선순위 카드 수를 줄이는 작업이 필요할 수 있다.

#### P29 다음 구현 후보

1. 거래 완료 이후 리포트/정산 placeholder
   - 지금은 완료와 피드백 골격은 있으나 정산, 리포트, 문서 handoff가 실제 기능으로 이어지기 전 안내가 약하다.
   - 기능을 완성하지 않더라도 사용자가 “다음에 무엇이 붙을지” 이해할 placeholder가 필요하다.
2. 알림 sender 실제 adapter 준비
   - P22.1에서 sender interface는 만들었지만 route에는 아직 실제 sender를 주입하지 않았다.
   - 메일/앱 알림을 바로 켜기 전 운영 설정, throttle, dry-run 로그 확인이 필요하다.
3. 운영 화면 실사용 점검
   - 운영 통계와 신뢰지표는 연결됐지만 실제 대표 계정으로 봤을 때 너무 많은 카드가 보이면 다시 접거나 우선순위를 줄여야 한다.
4. 요청 상세 서류 handoff 개선
   - 서류 업로드와 공개 범위는 있으나 선정 이후 파트너에게 어떤 서류를 넘겨야 하는지 안내가 더 필요할 수 있다.
5. 해외 파트너 온보딩 보강
   - 해외 가입과 요청 시작은 가능하지만 검증 기준, 언어, 한국 파트너 연결 기대치 안내는 더 세분화할 수 있다.

#### P21 우선순위 재정렬 메모

- P17~P20에서 요청 목록 limit, index, 중복 fetch, next-focus, feedback 조회 조건은 1차로 고정했다.
- 다음 병목은 새 기능 추가보다 상세 페이지 내부의 데이터 조립 반복이다. 같은 변환이 여러 route에 남아 있으면 이후 알림, 후기, 상태 전환이 붙을 때 누락 위험이 커진다.
- P21.2는 이미 만든 helper를 상세 페이지까지 적용하는 작은 코드 정리다. 직전 P20.2가 "언제 조회할지"를 고정했다면, P21.2는 "조회한 값을 어떤 모양으로 넘길지"를 일관화한다.
- P21.3은 route별 loader 책임을 더 분명히 하는 작업이다. P21.2보다 범위가 크므로 작은 변환 정리 후 진행한다.
- P22.1은 실제 발송 기능을 노출하는 작업이 아니라, 기존 dry-run worker가 나중에 이메일/앱 알림 adapter를 안전하게 끼울 수 있게 경계를 분리하는 작업이다.
- P23.1은 운영자가 통계를 보고 개발자에게 무엇을 고쳐달라고 해야 하는지 더 잘 알게 하는 레일이다. 기능 제거 없이 신뢰지표와 운영 개선 요청을 연결한다.

작업 선택 규칙:

1. 현재 rail의 완료 조건과 검증이 끝나면 사용자 승인 대기 없이 다음 rail로 이동한다.
2. UI 작업이면 로컬 서버를 띄우고 브라우저로 확인한다.
3. DB/RLS 작업은 사용자가 명시하기 전까지 로컬 파일만 작성하고 migration 적용은 보류한다.
4. 완료 보고에는 방금 끝낸 rail, 다음 rail, 이전 작업과의 차이를 함께 적는다.
5. 코드 작업 중 권한, RLS, Auth, Storage, 결제, GPT 사용자 노출, HS/FTA/요건 법적 리스크, DB migration, 큰 UI 흐름이 포함되면 리뷰어 에이전트 검토를 붙인다.
6. 리뷰어 검토가 붙은 작업은 리뷰 결과 반영 후 관련 테스트와 rail 단위 전체 검증을 다시 수행한다.

### Platform MVP Scope

반드시 포함:

1. 가입 단계에서 역할 선택
   - 수출/수입 화주
   - 포워더
   - 관세사무소
   - 해외 수입자/수출자
2. 회사 프로필과 검증 상태
   - 미검증
   - 이메일 인증
   - 서류 제출
   - 운영자 승인
   - 거래 이력 있음
3. 운송 견적 요청
   - 임시저장, 견적 모집중, 견적 도착, 업체 선정됨, 진행중, 완료, 취소, 만료
   - 서류 업로드
   - 마감 시간
   - 포워더 입찰
4. 통관 의뢰 요청
   - 서류 업로드
   - HS CODE 있음/없음
   - 관세사무소 입찰
   - 필요 추가서류와 예상 리드타임
5. 화주 견적 비교
   - 가격
   - 응답 속도
   - 견적 유효기간
   - 검증 상태
   - 전문 분야
6. 운영자 승인·숨김·차단
   - 업체 검증
   - 부적절 요청 숨김
   - 신고/차단

MVP에서 제외:

1. 국가별 해외 사업자번호 실시간 검증
2. 자동 결제·에스크로
3. 성공 수수료 정산 자동화
4. 모든 국가 언어 완성
5. 관세사 유료 HS 확정 검토 공개 노출
6. 최저가 자동 추천 단독 노출

### Role-Based Core Journeys

#### Journey P-A. 화주 운송 견적 요청

화주가 수출/수입 구분, 출발지, 도착지, 운송 방식, Incoterms, 품명, 포장 수량, 중량, CBM, 희망 일정, 서류를 입력하고 견적 모집을 시작한다. 포워더는 조건에 맞는 요청을 보고 견적을 제출한다.

#### Journey P-B. 화주 통관 의뢰 요청

화주가 수입/수출 통관 의뢰, 서류, HS CODE 여부, FTA 희망 여부, 요건 확인 필요 여부를 입력한다. 관세사무소는 통관 수수료, 검토 가능 여부, 필요 추가서류, 예상 리드타임을 제출한다.

#### Journey P-C. 포워더 입찰

포워더는 관심 조건에 맞는 운송 요청 목록을 확인하고, 상세 서류를 본 뒤 견적 단가, 견적서, 유효기간, 리드타임을 제출한다.

#### Journey P-D. 관세사무소 입찰

관세사무소는 통관 의뢰 목록을 확인하고, HS/요건/FTA 확인 필요 여부를 바탕으로 통관 수수료와 필요한 보완자료를 제시한다.

#### Journey P-E. 해외 업체 연결

해외 수출자/수입자는 국가, 회사 정보, 담당자, 웹사이트, 회사등록증 등 증빙을 제출한다. 운영자 승인 전에는 미검증 상태로 표시하고, 한국 포워더/관세사무소 연결은 제한된 범위에서 시작한다.

### Notification Direction

- 새 요청 생성 시 조건에 맞는 포워더/관세사무소에게 1회 알림
- 요청 마감 전 리마인드는 관심 조건이 맞고 아직 입찰하지 않은 업체에게 제한적으로 발송
- 요청 수정 알림은 이미 관심 표시 또는 입찰한 업체에게 우선 발송
- 업체별 관심 조건을 저장한다.
- 알림 피로도가 높아지면 즉시 digest 방식으로 전환한다.

### Existing Feature Repositioning

| 기존 기능 | 새 역할 |
| --- | --- |
| HS CODE 직접조회 | 요청서에 HS/관세/요건 근거를 붙이는 보조 도구 |
| 품명 AI 검색 | 화주가 품명을 몰라도 요청서를 시작하게 하는 진입 도구 |
| 수입/수출 진단 | 관세사무소 의뢰 전 보완자료를 정리하는 준비 도구 |
| 서류 업로드/OCR | 견적 요청과 통관 의뢰 자동작성의 핵심 입력 |
| 중고차 수출 | 중고차 수출 운송·통관 요청으로 연결되는 전문 업무 도구 |
| 무역뉴스 | 트래픽/신뢰 보조 콘텐츠, 기능 제거 금지 |
| 운영 통계 | 대표가 개발 수정 요청을 만들 수 있는 운영 보조 도구 |

### Immediate Next Work

1. PRODUCT_SPEC, ROADMAP, DECISIONS에 플랫폼 전환을 고정한다.
2. 가입/프로필 데이터 모델을 새 역할 기준으로 재검토한다.
3. 운송 견적 요청과 포워더 입찰의 최소 DB schema/RLS를 설계한다.
4. 통관 의뢰 요청과 관세사무소 입찰 schema를 운송 견적과 공통 구조로 설계한다.
5. 기존 대시보드 IA를 “조회 도구”보다 “내 요청/받은 견적/입찰 가능 요청” 중심으로 바꾼다.

| Phase | 상태 | 목표 | 핵심 산출물 |
| --- | --- | --- | --- |
| Phase A. 조회 핵심 제품화 | 완료 | HS/품명/국가 기준 조회를 실제 사용 가능한 수준으로 정리 | 통합 조회, 씨엘형 HS 네비게이터, 관세율 정렬, 수입요건, 복사 안내문 |
| Phase B. 계정·운영 기반 | 완료 | 로그인, 회원가입, 개발자 운영 메뉴, 공지, 사용자 관리 구축 | Supabase Auth, 개인/기업회원 흐름, 개발자 전용 운영 화면, 공지 팝업 |
| Phase C. 외부 연동 실험 | 진행 | 관세청, KOTRA, CY/CFS, 자동차 제원, 터미널 조회 등 실무 보조 연동 검증 | API001 relay, API012 캐시, 적하목록 감시, 중고차 수출 도구, 무역뉴스 |
| Phase D. 운영 안정화 | 진행 | 공개 테스트 중 서버 오류, 누락 migration, 느린 route, 비용 폭증을 줄임 | rate limit, health check, production smoke, 운영 DB schema check |
| Phase E. 품명 AI 고도화 | 진행 | GPT를 단순 후보 생성기가 아니라 분류 인터뷰어로 사용 | 단일 후보/보완질문/다의어 분기, 다국어 품명 처리, 캐시와 telemetry |
| Phase F. 실무 생산성 기능 | 진행 | 관세사무원·포워더의 반복 답변과 일괄 확인 업무를 줄임 | 일괄 조회, 엑셀 출력, 복사 안내문, 적하목록 일괄 감시, 고객사별 품목 |
| Phase G. 해외 수출자·수입자 확장 | 예정 | 해외에서 한국으로 수출하려는 사용자와 국내 수입자에게 직접 쓸 수 있는 화면 제공 | 영어/중국어 화면, 한국 수입요건 안내, 예상 관부가세, FTA/원산지 체크 |
| Phase H. 유료화·확장 운영 | 예정 | 유료화 전에 사용량 제한, 요금제, 데이터 품질 운영을 정리 | 요금제, 사용량 제한, 기능별 사용량, 운영 로그, 장애 알림 |

## Next Phase Plan

### Phase D-1. 운영 신뢰도 고정

목표: 테스트 사용자가 늘어도 “페이지가 안 열린다”, “작업 중이 멈춘다”, “환경변수/DB 누락으로 기능이 죽는다”를 줄인다.

완료된 항목:

- route rate limit 추가
- production smoke test 추가
- 테스트 계정 로그인 기반 production smoke 지원
- runtime environment health check 추가
- production schema health check 추가
- 보호 페이지 proxy login guard 추가
- 외부 연동 오류 응답 표준화 1차
- 적하목록/관세환율 외부 API 실패 진단 표시
- 터미널별 컨테이너 조회 실패 시도 결과 표시
- 운영 점검 화면에 조회 품질 일자별 요약 추가
- 조회 품질 로그의 route별 실패율과 평균/최대 응답시간 표시
- 반입계 출력 실패 원인 코드 세분화
- 운영 점검 화면에 background job 대기/실패 상태 표시
- 운영 점검 화면에 외부 연동별 준비 상태와 호출 경로 표시
- 반입계 출력 실패 코드별 사용자 재시도 안내 표시

앞으로 할 항목:

1. Vercel/cron 실행 실패를 개발자 공지 또는 운영 알림으로 노출
2. 반입계 출력 실패 원인 코드를 운영 화면에서 통계화
3. route별 rate limit 초과 이벤트를 운영 화면에 표시

### Phase E-1. 품명 AI 검색 품질 고정

목표: 품명 검색에서 결과 없음이 잦거나 엉뚱한 후보가 나오는 문제를 구조적으로 줄인다.

완료된 항목:

- GPT 우선 후보 생성
- 단일 고확신 후보와 보완질문형 응답 분리
- 다국어/오타/제품명 입력 대응 보강
- 공식 품명 DB 대조 의존도 축소
- GPT 호출 실패, 후보 수준, 최종 후보 품질 telemetry 보강
- 운영 점검 화면에서 GPT 단계와 후보 품질 표시
- GPT가 HS4/HS6 예비 방향만 준 경우 결과 없음 화면에 예비 조회 링크 표시
- 한글 상품명과 제품코드형 입력의 GPT 예비 후보 회귀 테스트 추가
- 복사 안내문 언어와 짧은/상세 분량 선택 UI 보강
- 복사 안내문에 예비 안내, 재확인 문구, 다국어 보완 요청 항목 1차 반영

앞으로 할 항목:

1. 실제 사용자 검색 실패 케이스를 운영 화면에서 케이스별 drill-down으로 확인
2. “제품명/브랜드명/모델명만 입력” 시 웹 근거 또는 보완질문 분기 정확도 추가 개선
3. GPT 응답이 HS6만 줄 때 하위 HSK 선택 UI를 더 명확하게 분리
4. 복사 안내문 문구를 실사용 피드백 기준으로 계속 다듬기

### Phase C-1. 외부 연동의 운영 가능성 정리

목표: 외부 사이트나 공공 API가 불안정해도 사용자에게 실패 이유와 대체 행동을 명확히 보여준다.

완료된 항목:

- API001 관세청 relay 구성
- API012 관세환율 DB 캐시 구조
- 터미널별 컨테이너 조회와 반입계 이미지 출력
- 자동차 제원정보 조회
- KOTRA 무역뉴스 기반
- 외부 터미널 helper/반입계 출력 오류 JSON 표준화
- 컨테이너 조회 실패 시 터미널별 시도 결과 표시
- KOTRA/WTO/정부 뉴스 국가 필터 영문명·약칭 매칭 보강
- API key와 endpoint 설정 상태를 운영 화면에서 기능 단위로 구분
- 반입계 출력 실패 원인별 재시도 안내 개선
- 무역 뉴스 비한글 원문 카드에 출처 기반 짧은 안내와 원문 발췌 표시

앞으로 할 항목:

1. 터미널 반입계 출력 실패 원인별 통계
2. API001/API012 정기 job 실패 이력을 운영 화면에 노출
3. 뉴스 원문 자동 번역/요약은 비용·저작권 검토 후 별도 기능으로 분리

### Phase F-1. 실무 생산성 기능

목표: 사용자가 돈을 낼 이유가 되는 반복 업무 절감 기능을 만든다.

완료된 항목:

- HS CODE 10자리 필수 일괄 조회 1차 화면 추가
- XLSX/CSV 업로드와 탭/쉼표 붙여넣기 입력 지원
- 중복 HS CODE를 합치지 않고 입력 행 순서 그대로 결과 출력
- 수입국가 필터 기준 관세율, FTA, 수입요건, 원산지표시 요약 출력
- 실제 `.xlsx` 결과 파일 다운로드
- 화면 결과를 전체/완료/보완 필요/오류 탭으로 분리
- `.xlsx` 파일에 보완 필요 시트를 별도 생성

앞으로 할 항목:

1. 일괄조회 결과에 품명 AI 보완질문과 HS6 하위 선택 UI 연결
2. 일괄조회 대량 처리용 background job 전환
3. 일괄조회 결과 파일을 업체 답변용 양식으로 개선
4. 조회 결과 복사 안내문 고도화
   - 짧은 안내문: 관세율, 수입요건, 필요 서류 유무 중심
   - 상세 안내문: 보완 필요 정보, 예비 HS 방향, FTA/내국세/요건 주의사항 포함
   - 수출자 안내용 영문·중문 문구 선택
   - 현재 1차 UI와 실무형 문구 반영 완료, 문구 품질은 테스트 피드백으로 계속 보정
5. 적하목록 일괄 감시
   - 여러 BL 일괄 등록
   - 반입, 검사대상, 수입신고수리, 반출 등 상태별 안내 문구
   - 목표 상태 도달 또는 최종 상태 도달 시 1회 발송 후 자동 종료
6. 고객사별 품목 관리
   - 회사별 자주 쓰는 HS CODE
   - 최근 조회, 즐겨찾기, 내부 메모
   - 고객별 반복 품목 리스트
7. 문서 업로드 OCR/XLS 변환 worker 분리
   - Commercial Invoice, Packing List, B/L, C/O, 카탈로그/스펙 추출
   - 추출 품목별 HS 후보와 보완 질문 연결
8. 보고서/문의 답변 출력
   - 고객 문의 답변용 복사문
   - 내부 검토 메모
   - 출력/저장 가능한 요약 보고서

### Phase G-1. 해외 수출자·국내 수입자 직접 사용 화면

목표: 관세사무소 내부 사용자를 넘어, 해외 수출자와 국내 수입자가 스스로 한국 수입 정보를 확인하고 문의 준비를 할 수 있게 한다.

앞으로 할 항목:

1. 해외 수출자용 한국 수입 조회 화면
   - 영어/중국어 UI
   - product name, material, use, model 입력
   - Korea import duty, VAT, import requirements, documents required 표시
   - 한국 수입자에게 전달할 summary 생성
2. 국내 수입자용 예상 관부가세 계산 완성
   - 외화/원화 물품값
   - 운임/보험료
   - 관세환율, 차주 환율
   - 관세, 부가세, 내국세
   - FTA 세율 선택
3. 수입요건 실무 플레이북
   - 요건명, 기관, 근거 법령
   - 필요한 기본 서류
   - 사전 준비 여부
   - 업체에 요청할 문구
4. FTA/원산지 검토 보조
   - 원산지, 선적국, 수출자 국가, 제조국, 판매자 국가 분리
   - FTA 가능성, C/O 방식, 직접운송, 증빙자료 안내
   - 확정 표현 없이 예비 검토/추가 확인 필요 구조 유지

### Phase H-1. 유료화·확장 운영

목표: 공개 테스트 이후 사용자가 늘어도 비용, 품질, 권한, 장애 대응을 통제한다.

앞으로 할 항목:

1. 사용자별 사용량 제한
   - 품명 AI 검색
   - 적하목록 감시
   - 일괄 조회
   - 반입계 출력
2. 요금제 설계
   - 개인회원
   - 기업회원
   - 관세사무소/포워딩용 다중 사용자
   - 개발자/관리자 권한
   - HS 확정 요청, 담당자 검토 크레딧, 검토 유료화는 협업 관세사무소와 가격 정책이 정해질 때까지 고객 화면에서 숨김
3. 운영 로그 기반 품질 개선
   - 무결과 검색어
   - GPT 실패 로그
   - 많이 검색한 품명
   - API 실패율
   - 느린 route
   - 기능별 사용량
4. 데이터 갱신 운영
   - 관세청 API018/관세율/통계부호 월별 갱신
   - KOTRA 뉴스 정기 수집
   - API012 관세환율 금요일 정기 캐시
   - legal/source snapshot checksum 관리

## Phase 0 — Project Bootstrap

- Next.js project
- Tailwind/shadcn
- Supabase client/server setup
- app shell
- auth placeholder
- route groups

## Phase 1 — Schema and RLS

- core schema
- roles
- companies
- hs requests
- candidates
- reports
- legal source snapshots
- audit logs
- RLS policies

## Phase 2 — HS Direct Lookup

- input form
- HSK candidate display
- mock HS data seed
- basis date UI
- source footer

## Phase 3 — Product Name HS Recommendation

- product info form
- candidate generator abstraction
- mock heuristic generator
- required questions
- staff select/reject/confirm

## Phase 4 — Import Diagnosis

- tariff result placeholder
- FTA placeholder
- import requirement placeholder
- requirement playbook placeholder
- customer request template

## Phase 5 — Export Diagnosis

- export requirement placeholder
- export-control preliminary screen
- FTA C/O for export
- buyer document list

## Phase 6 — Legal Update Engine

- snapshot upload/import
- checksum
- diff events
- review dashboard
- publish/reject
- impacted report marking

## Phase 7 — Document Upload

- private storage
- document metadata
- extracted line items
- manual correction UI
- connect to HS recommendation

## Phase 8 — Report Output

- report preview
- source locks
- staff approval
- PDF download

## Phase 9 — Billing

- plans
- case limits
- report credits
- paid report checkout

## Phase 10 — AI-Assisted Clarification

- provider adapter for GPT/Gemini behind a server-only interface
- product-name ambiguity detector
- invoice and packing-list extraction assist for varied formats
- AI-generated missing-information questions
- GPT product-name normalization returns provisional HS4/HS6/HSK lookup hints first, then official HS/tariff/requirement data is used for detail expansion and downstream checks
- invoice HS code conflict check against product description
- redacted prompt/audit logging without confidential document contents
- staff-review handoff remains dormant until a review partner and pricing policy exist

## Launch Backlog

1. Improve dashboard and direct lookup density for daily broker/forwarder use.
   - Done: HS batch lookup now preserves invoice row order, separates result statuses, exports XLSX, includes row-level customer guidance text in both the UI copy button and downloaded file, supports copying the currently filtered guidance rows at once, and provides a downloadable upload template.
2. Expand destination-country HS, tariff, internal tax, requirement datasets beyond the current priority countries.
3. Replace temporary internal-tax law rules with official HS-mapped internal-tax data once received.
4. Keep document upload hidden from ordinary users until OCR/XLS conversion workers are deployed.
5. Add production observability for lookup latency, AI timeout count, cache hit rate, and rate-limit events.
6. Add source-publish cache invalidation and scheduled monthly Customs API018 ingestion.
7. Load-test `/hs/direct`, `/hs/overseas`, `/dashboard`, and login flows before wider launch.
