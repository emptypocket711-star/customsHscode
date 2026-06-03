# Public Access And Auth Gate Plan

작성일: 2026-06-03

## Product Decision

HS FINDER는 모든 화면을 먼저 로그인으로 막지 않는다.

기본 조회 기능은 비로그인 상태에서도 사용 가능하게 열고, 회원 정보나 회사 권한이 필요한 액션을 누르는 순간 로그인과 권한 확인을 요구한다.

이 변경의 목적은 사용자가 HS FINDER의 핵심 가치를 먼저 경험한 뒤, 저장·요청·입찰·문서·리포트 같은 실무 기능에서 자연스럽게 가입하게 만드는 것이다.

## Public Without Login

아래 기능은 비로그인 조회를 허용한다.

- HS CODE 10자리 직접 조회
- 품명 AI 검색
- HS 네비게이터
- 적하목록 또는 컨테이너 조회
- 무역뉴스
- 중고차 수출 기본 도구
- 관세/부가세 간단 계산기
- 공개 안내/랜딩 성격의 페이지

비로그인 공개 기능도 abuse 방지를 위해 rate limit과 비용 제한을 둔다. 특히 GPT 기반 품명 검색은 IP 또는 익명 세션 기준으로 횟수 제한을 둔다.

## Login Required Actions

아래 기능은 로그인 후에만 허용한다.

- 운송 견적 요청 생성, 저장, 공개
- 통관 의뢰 요청 생성, 저장, 공개
- 포워더 또는 관세사무소 입찰
- HS CODE 즐겨찾기
- 검색 이력 저장
- 문서 업로드와 문서 진단
- 리포트 저장, 출력, 공유
- 회사 정보, 멤버, 역할 신청
- 운영자/developer 화면
- staff review, legal-risk review, source-locked report approval

비로그인 사용자가 위 액션을 누르면 즉시 전체 페이지를 막지 말고 다음 안내를 띄운다.

```text
이 기능은 로그인이 필요합니다. 로그인 후 다시 이용해 주세요.
```

확인 또는 로그인 버튼을 누르면 `/login?next=<원래_주소>`로 이동한다.

## Route Policy

middleware 또는 route guard는 공개 route와 보호 route를 분리한다.

공개 route 후보:

- `/`
- `/hs/direct`
- `/hs/product-recommendation`
- `/hs/overseas`
- `/cargo`
- `/used-car-export`
- `/used-car-export/container-check`
- `/used-car-export/vehicle-spec`
- `/vehicle-spec`
- `/trade-news`
- `/duty-estimator`
- `/legal-updates`

보호 route 후보:

- `/dashboard`
- `/requests`
- `/requests/freight`
- `/requests/clearance`
- `/documents`
- `/reports`
- `/settings`
- `/operations`
- `/staff`
- `/billing`

주의: route가 공개여도 페이지 안의 저장, 요청, 입찰, 문서, 리포트 액션은 서버에서 다시 로그인과 권한을 확인해야 한다.

## API And Server Action Policy

화면만 공개하고 API를 그대로 열면 안 된다.

공개 API 또는 server action:

- 읽기 전용 HS 검색
- 품명 후보 추천
- 공개 HS/요건 snapshot 조회
- 적하목록/컨테이너 조회
- 공개 뉴스 조회

보호 API 또는 server action:

- 사용자별 저장 데이터 쓰기
- 즐겨찾기 쓰기
- 견적 요청/입찰 mutation
- 문서 업로드
- 리포트 저장
- 회사/멤버 mutation
- 운영자 조회와 mutation

모든 보호 mutation은 client auth 상태가 아니라 server-side session, company_id, role, RLS 결과를 기준으로 막는다.

## Implementation Steps

1. 현재 middleware/proxy login guard가 막는 route 목록을 조사한다.
2. 공개 route allowlist와 보호 route prefix를 코드에 분리한다.
3. 공개 조회 페이지에서 로그인 없을 때도 loading/empty/error 상태가 정상 렌더링되게 한다.
4. 회원 전용 버튼은 `requireAuthAction` 성격의 공통 helper 또는 component로 묶는다.
5. 비로그인 사용자가 보호 액션을 누르면 안내 후 `/login?next=...`로 이동한다.
6. 로그인 후 `next` 주소로 복귀하는지 확인한다.
7. 서버 action/API에서 공개 읽기와 보호 mutation의 auth check를 재점검한다.
8. GPT 품명 검색 등 비용 있는 공개 기능에 rate limit을 적용한다.
9. Playwright smoke에 비로그인 공개 조회와 보호 액션 login redirect를 추가한다.

## Acceptance Criteria

- 비로그인 사용자가 HS CODE 직접 조회 화면에 접근할 수 있다.
- 비로그인 사용자가 품명 AI 검색 화면에 접근할 수 있다.
- 비로그인 사용자가 적하목록/컨테이너 조회 화면에 접근할 수 있다.
- 비로그인 사용자가 운송 견적 요청 저장 또는 공개를 누르면 로그인 안내를 본다.
- 비로그인 사용자가 즐겨찾기를 누르면 로그인 안내를 본다.
- 로그인 후 `next` 주소로 돌아온다.
- 보호 route인 `/requests`, `/settings`, `/operations`, `/staff`는 비로그인 직접 접근 시 로그인으로 이동한다.
- 서버 mutation은 비로그인 직접 호출을 차단한다.
- RLS는 기존 marketplace 권한 경계를 유지한다.
- 공개 GPT 조회에는 rate limit 또는 비용 보호 장치가 있다.

## Non Goals

- marketplace 입찰 기능을 비로그인으로 여는 것
- 문서 업로드를 비로그인으로 여는 것
- 운영자 화면을 비로그인으로 여는 것
- 법령/HS/FTA/요건 결과를 확정 표현으로 바꾸는 것
- 유료 HS 확정 검토 기능을 다시 노출하는 것
