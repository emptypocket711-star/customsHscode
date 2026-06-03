# Work Log

이 문서는 HS FINDER 개발 중 실제로 수행한 작업, 검증 결과, 커밋을 날짜별로 남긴다.

## 2026-06-03

### request schema fallback role settings CTA

- 이전 작업은 P196 초안 저장 오류 CTA가 역할 신청 섹션으로 바로 이동하게 한 것이고, 이번 작업은 P197 오류 action까지 도달하지 못하는 스키마 미준비 fallback 상태에서도 이동 경로를 제공한 작업이다.
- 운송 견적 요청 화면의 초안 작성, 내 요청 목록, 입찰 가능 요청 fallback 안내에 `회사 역할 신청 확인` CTA를 추가했다.
- 통관 의뢰 요청 화면의 초안 작성, 내 요청 목록, 입찰 가능 요청 fallback 안내에도 같은 CTA를 추가했다.
- CTA는 모두 `/settings/members#platform-role-request`로 이동한다.
- staging에서 운송/통관 요청 화면에 CTA가 각각 표시되고 href가 같은 anchor를 가리키는지 확인했다.
- visible CTA 클릭 시 회사 설정의 `플랫폼 역할 신청` 섹션으로 이동하고 hash가 `#platform-role-request`로 유지되는지 확인했다.
- 최신 staging preview는 `https://customs-hscode-pk354dy5g-koo-apps.vercel.app`다.
- 다음 작업은 P198 요청 화면 fallback CTA 중복/밀도 점검이다. 이번 P197이 스키마 미준비 상태의 이동 경로 추가라면, P198은 같은 CTA가 한 화면에 여러 번 보일 때 과하게 반복되지 않는지 UX 밀도를 정리하는 작업이다.

검증:

- `npx vitest run features/service-requests/request-draft-readiness.test.ts features/company-verification/company-role-request-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `rg -n "회사 역할 신청 확인|settings/members#platform-role-request" features/service-requests/freight-request-draft-panel.tsx features/service-requests/clearance-request-draft-panel.tsx -S`
- Playwright staging browser: `/requests/freight`, `/requests/clearance` fallback CTA 표시, href, 클릭 후 `/settings/members#platform-role-request` 이동 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-pk354dy5g-koo-apps.vercel.app`: 9/9 통과

### draft error role request anchor

- 이전 작업은 P195 회사 설정 역할 신청 패널 안의 비활성 이유 문구를 구분한 것이고, 이번 작업은 P196 요청 초안 저장 오류 CTA가 회사 설정 상단이 아니라 역할 신청 섹션으로 바로 이동하게 하는 작업이다.
- `CompanyRoleRequestPanel` 카드에 `platform-role-request` anchor id를 추가했다.
- 운송/통관 초안 저장 오류의 `회사 설정 확인` 링크를 `/settings/members#platform-role-request`로 변경했다.
- staging에서 `/settings/members#platform-role-request`로 직접 진입해 hash와 역할 신청 heading, anchor DOM을 확인했다.
- staging 요청 화면은 현재 플랫폼 요청 스키마 fallback 상태라 실제 server action 오류 CTA까지는 도달하지 못했다. 대신 두 draft panel의 href는 source grep으로 확인했고, 대상 anchor는 최신 preview에서 브라우저로 확인했다.
- 최신 staging preview는 `https://customs-hscode-1x6idw83x-koo-apps.vercel.app`다.
- 다음 작업은 P197 요청 스키마 미준비 fallback CTA 점검이다. 이번 P196이 오류 발생 후 CTA의 이동 위치라면, P197은 오류 action까지 가지 못하는 스키마 미준비 상태에서도 사용자가 회사 설정/역할 신청으로 이동할 길이 있는지 보는 작업이다.

검증:

- `npx vitest run features/company-verification/company-role-request-panel.test.ts features/service-requests/request-draft-readiness.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `rg -n "settings/members#platform-role-request|platform-role-request" features/service-requests features/company-verification -S`
- Playwright staging browser: `/settings/members#platform-role-request` hash, anchor, 역할 신청 heading 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-1x6idw83x-koo-apps.vercel.app`: 9/9 통과

### role request disabled reason copy

- 이전 작업은 P194 요청 초안 저장 실패 상태에서 회사 설정으로 이동하는 CTA를 추가한 것이고, 이번 작업은 P195 회사 설정으로 이동한 뒤 역할 신청이 비활성일 때 원인을 이해할 수 있게 하는 작업이다.
- `CompanyRoleRequestPanel`의 비활성 안내를 원인별 helper로 분리했다.
- 역할 신청 데이터가 준비되지 않은 경우와 회사 관리자가 아닌 경우를 서로 다른 문구로 안내하도록 정리했다.
- 상단 스키마 준비 중 안내와 하단 비활성 사유 문구가 같은 방향으로 설명되도록 맞췄다.
- helper 단위 테스트를 추가해 스키마 미준비, 회사 관리자 아님, 신청 가능 상태를 고정했다.
- staging에서 회사 설정 화면을 열어 역할 신청 패널, 상단/하단 스키마 안내, 기존 짧은 문구 제거를 확인했다.
- 최신 staging preview는 `https://customs-hscode-cwi1v7czf-koo-apps.vercel.app`다.
- 다음 작업은 P196 회사 설정 직접 anchor 이동이다. 이번 P195가 역할 신청 패널 안의 비활성 이유 설명이라면, P196은 요청 초안 오류 CTA가 회사 설정 상단이 아니라 역할 신청 섹션으로 바로 이동하게 하는 작업이다.

검증:

- `npx vitest run features/company-verification/company-role-request-panel.test.ts features/company-verification/company-role-request-schemas.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 회사 설정 역할 신청 패널의 상단/하단 스키마 안내 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-cwi1v7czf-koo-apps.vercel.app`: 9/9 통과

### draft save error settings CTA

- 이전 작업은 P193 회사 설정의 화주 역할/회사 정보 진입 UX 점검이고, 이번 작업은 P194 요청 초안 저장 실패 상태의 직접 이동 CTA 보강이다.
- 운송/통관 초안 저장 오류 메시지 박스에 `회사 설정 확인` 링크를 추가했다.
- 오류 메시지가 회사 설정에서 화주 역할과 회사 정보를 확인하라고 안내할 때, 사용자가 바로 `/settings/members`로 이동할 수 있게 했다.
- staging에서 운송 초안 저장 실패 상태를 만들고 `회사 설정 확인` 링크가 보이는지, 클릭 시 회사 설정 화면으로 이동하는지 확인했다.
- 최신 staging preview는 `https://customs-hscode-gd4bhpbc9-koo-apps.vercel.app`다.
- 다음 작업은 P195 회사 설정 역할 신청 폼의 비활성 상태 안내 점검이다. 이번 P194가 오류 CTA라면, P195는 이동 후 역할 신청이 비활성일 때 사용자가 왜 막혔고 무엇을 해야 하는지 이해할 수 있는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 운송 초안 저장 실패, `회사 설정 확인` CTA 표시 및 `/settings/members` 이동 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-gd4bhpbc9-koo-apps.vercel.app`: 9/9 통과

### company settings role guidance

- 이전 작업은 P192 초안 저장 액션 성공/실패 메시지 점검이고, 이번 작업은 P193 회사 설정의 화주 역할/회사 정보 진입 UX 점검이다.
- 회사 설정 상단 설명에 회사 정보, 화주·포워더·관세사무소 역할 신청, 검증 상태와 제출 증빙을 관리한다는 내용을 추가했다.
- 플랫폼 참여 상태의 다음 작업 문구에 국내 수출입 화주 또는 해외 수출입 파트너 역할 신청/승인 상태 확인을 먼저 안내하도록 보강했다.
- staging에서 회사 설정 화면을 열어 상단 설명, 다음 작업 문구, 플랫폼 역할 신청 heading, 국내 수출입 화주 선택지가 보이는지 확인했다.
- 첫 검증은 `플랫폼 역할 신청` 텍스트가 여러 곳에 있어 strict mode가 걸렸고, heading 기준으로 선택자를 좁혀 재검증했다.
- 최신 staging preview는 `https://customs-hscode-6696eo8ct-koo-apps.vercel.app`다.
- 다음 작업은 P194 회사 설정에서 저장 실패 후 이동할 수 있는 직접 링크/CTA 점검이다. 이번 P193이 화면 문구라면, P194는 요청 저장 실패 메시지나 초안 화면에서 회사 설정으로 바로 이동할 수 있는 경로가 충분한지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 회사 설정 상단 설명, 다음 작업, 역할 신청 heading, 국내 수출입 화주 선택지 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-6696eo8ct-koo-apps.vercel.app`: 9/9 통과

### request draft save messages

- 이전 작업은 P191 요청 초안 저장 전 준비도 패널 문구 정리이고, 이번 작업은 P192 초안 저장 액션 성공/실패 메시지 점검이다.
- 운송/통관 초안 저장 성공 메시지에 `아래 내 요청 목록에서 상세 화면으로 들어가 서류 첨부와 ... 공개를 진행` 문구를 추가했다.
- 운송/통관 초안 저장 실패 메시지에 `회사 설정에서 화주 역할과 회사 정보를 확인` 문구를 추가해 사용자가 다음 확인 위치를 알 수 있게 했다.
- staging에서 운송 초안 저장을 실제로 시도했지만 테스트 계정/플랫폼 데이터 조건상 회사 프로필 오류로 막혔다. 따라서 성공 메시지는 소스와 build로 검증했고, 실패 메시지는 브라우저에서 새 문구가 표시되는지 직접 확인했다.
- 최신 staging preview는 `https://customs-hscode-nsv2k7tbt-koo-apps.vercel.app`다.
- 다음 작업은 P193 회사 설정의 화주 역할/회사 정보 진입 UX 점검이다. 이번 P192가 저장 실패 메시지라면, P193은 사용자가 그 메시지를 보고 실제로 회사 설정에서 무엇을 확인할 수 있는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 운송 초안 저장 실패 메시지 새 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-nsv2k7tbt-koo-apps.vercel.app`: 9/9 통과

### request draft readiness copy

- 이전 작업은 P190 HS/품명 조회 결과에서 요청 초안으로 넘어가는 CTA 회귀 검증이고, 이번 작업은 P191 요청 초안 저장 전 준비도 패널 문구 정리다.
- `초안 저장 필수값`, `보완 추천`, `저장 가능` 문구를 `초안 저장에 필요한 값`, `저장 필수`, `견적 판단 정보`, `초안 저장 가능`으로 바꿔 사용자 입장에서 해야 할 일을 더 명확히 했다.
- `지금 필요한 값`도 `초안 저장 전 필요한 값`으로 바꿔 저장 전 필수값과 공개/견적 판단 보완값을 구분했다.
- staging에서 운송 초안과 통관 초안 prefill URL을 열어 새 문구가 보이는지 확인했다.
- 첫 검증은 금지어를 `저장 가능`으로 너무 넓게 잡아 `초안 저장 가능`까지 걸렸고, 이후 이전 문구인 `초안 저장 필수값이 채워졌습니다.`, `보완 추천`만 금지하도록 조정해 통과했다.
- 최신 staging preview는 `https://customs-hscode-iv057uicw-koo-apps.vercel.app`다.
- 다음 작업은 P192 요청 초안 저장 액션의 성공/오류 메시지 점검이다. 이번 P191이 저장 전 준비도 패널이라면, P192는 실제 저장 버튼을 눌렀을 때 사용자가 다음 행동을 알 수 있는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 운송/통관 초안 준비도 패널 새 문구와 이전 문구 미노출 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-iv057uicw-koo-apps.vercel.app`: 9/9 통과

### marketplace prefill provisional flow regression

- 이전 작업은 P189 품명 후보 상세조회 진입 배너 문구 점검이고, 이번 작업은 P190 HS/품명 조회 결과에서 요청 초안으로 넘어가는 CTA 회귀 검증이다.
- 코드상 요청 초안에는 이미 `HS 조회 결과에서 시작한 요청 초안입니다.`, `예비값`, `HSK 확정 및 법령·요건 적용 여부는 담당자 검토가 필요합니다.` 패널이 있었다.
- staging에서 품명 `사탕` 결과의 `이 후보로 운송 초안 만들기`, `이 후보로 통관 초안 만들기` 링크를 실제로 열어 두 요청 초안 모두 예비값 패널이 표시되는지 확인했다.
- 운송 초안과 통관 초안 모두 `hskCode`, `hs6`, `productName`, `basisDate`가 prefill로 전달되지만 확정값 문구 없이 예비진단 참고값으로 안내되는 것을 확인했다.
- 별도 코드 수정은 필요하지 않았다.
- 최신 staging preview는 `https://customs-hscode-egw756g7t-koo-apps.vercel.app`다.
- 다음 작업은 P191 요청 초안 저장 전 준비도 패널의 문구 회귀 점검이다. 이번 P190이 조회 결과 prefill 패널이라면, P191은 사용자가 실제 초안 저장 전 보는 필수값/보완값 안내가 너무 개발자스럽거나 확정적으로 보이지 않는지 보는 작업이다.

검증:

- Playwright staging browser: 품명 `사탕`에서 운송/통관 초안 CTA 이동, 예비값 패널과 담당자 검토 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-egw756g7t-koo-apps.vercel.app`: 9/9 통과

### product search detail source banner

- 이전 작업은 P188 품명 AI 결과 복사문 점수 보강이고, 이번 작업은 P189 품명 후보 상세조회 진입 배너 문구 점검이다.
- 품명 후보를 눌러 10자리 상세조회로 들어갔을 때 상단 배너가 `품명검색에서 선택한 HS CODE입니다.`, `추천된 HS CODE`라고 표시되어 확정 분류처럼 보일 수 있었다.
- 배너 제목을 `품명검색에서 선택한 우선 검토 후보입니다.`로 바꾸고, 본문을 `후보 코드 기준의 예비 조회 결과`라고 명확히 했다.
- staging에서 품명 `사탕` 결과의 `이 후보로 상세 조회` 링크를 실제로 클릭해 `source=product_search` URL로 이동하고, 새 배너 문구가 표시되는지 확인했다.
- 기존 문구 `품명검색에서 선택한 HS CODE입니다.`, `추천된 HS CODE를 상세 조회`가 화면에 남지 않았는지 확인했다.
- 최신 staging preview는 `https://customs-hscode-egw756g7t-koo-apps.vercel.app`다.
- 다음 작업은 P190 HS/품명 조회에서 요청 초안으로 넘어가는 CTA 문구 회귀 점검이다. 이번 P189가 상세조회 출처 배너라면, P190은 `운송 초안`, `통관 초안`으로 넘어갈 때 예비 HSK가 확정값처럼 전달되지 않는지 보는 작업이다.

검증:

- `rg -n "추천된 HS CODE|품명검색에서 선택한 HS CODE|상세 조회하고 있습니다|확정값|확정 HS" features/hs/hs-direct-lookup-panel.tsx -S`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 품명 `사탕` 후보 상세조회 진입 후 출처 배너 문구와 이전 문구 미노출 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-egw756g7t-koo-apps.vercel.app`: 9/9 통과

### product candidate clipboard score

- 이전 작업은 P187 품명 AI 결과 화면 전체 문구 회귀 점검이고, 이번 작업은 P188 품명 AI 결과 복사문 점수 보강이다.
- 화면에는 `점수 N점`이 보였지만 복사문에는 후보별 GPT 점수가 빠져 있어, 외부 전달 시 후보 비교 근거가 약했다.
- 한국어/영어/중국어 복사문 라벨에 GPT 점수 항목을 추가하고, 후보별 `confidenceScore`를 `GPT 점수 : N점` 형식으로 넣었다.
- staging에서 품명 `사탕` 결과의 클립보드 복사문을 직접 읽어 `GPT 점수 : N점`, 예비 안내, 수입요건 섹션이 포함되는지 확인했다.
- 복사문에 `가장 유력`, `가장 가까운 코드`, `확정 HS`, `확정값` 같은 위험 표현이 남지 않았는지 확인했다.
- 최신 staging preview는 `https://customs-hscode-29ky5h9n6-koo-apps.vercel.app`다.
- 다음 작업은 P189 품명 AI 상세조회 진입 배너 문구 점검이다. 이번 P188이 복사문이라면, P189는 후보를 눌러 10자리 상세조회로 들어간 뒤 상단 출처/예비값 배너가 확정 분류처럼 보이지 않는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser clipboard: 품명 `사탕` 복사문에 `GPT 점수 : N점`, 예비 안내, 수입요건 섹션 포함 및 위험 표현 미포함 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-29ky5h9n6-koo-apps.vercel.app`: 9/9 통과

### product classification flow copy regression

- 이전 작업은 P186 질문별 답변 영역 하단 재조회 버튼 보강이고, 이번 작업은 P187 품명 AI 결과 화면 전체 문구 회귀 점검이다.
- AI 분류 흐름 요약의 `가장 유력`, `가장 가까운 코드` 표현을 `우선 검토`, `우선 검토 후보`로 바꿨다.
- staging에서 품명 `사탕` 결과 화면을 확인해 `우선 검토 후보`, `점수 N점`, `보완사항 입력`, `이 후보로 상세 조회`가 함께 보이는지 확인했다.
- 처음에는 `사탕`이 단일 후보가 아니라 보완 필요 상태로 나와 `우선 검토할 HS 후보입니다` 조건이 맞지 않았고, 비교 후보가 없을 때 `GPT 점수순...` 문구도 없었다. 이후 검증 기준을 후보 수 변동에 맞춰 점수 배지와 핵심 흐름 확인으로 조정했다.
- 예전 문구 `가장 유력`, `가장 가까운 코드`, `이 코드로 조회`, `추가 보완 없이 조회 가능한 코드입니다.`가 화면에 남지 않았는지 확인했다.
- 최신 staging preview는 `https://customs-hscode-crob1vm89-koo-apps.vercel.app`다.
- 다음 작업은 P188 품명 AI 복사문/클립보드 회귀 점검이다. 이번 P187이 화면에 보이는 결과 문구라면, P188은 사용자가 복사해서 외부에 전달하는 텍스트가 같은 안전 표현을 유지하는지 보는 작업이다.

검증:

- `rg -n "가장 유력|가장 가까운 코드|가장 가까운 HS CODE|이 코드로 조회|추가 보완 없이|예비 후보" features/hs/hs-direct-lookup-panel.tsx features/hs/product-supplement-research-form.tsx lib/i18n/hs-direct.ts -S`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 품명 `사탕` 결과 화면의 후보, 점수, 보완사항, 상세조회 링크, AI 흐름 요약 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-crob1vm89-koo-apps.vercel.app`: 9/9 통과

### product supplement question rerun action

- 이전 작업은 P185 품명 AI 간단 보완사항 재조회 흐름 검증이고, 이번 작업은 P186 질문별 답변 영역 하단 재조회 버튼 보강이다.
- 접힌 `질문별로 답변하기` 영역 안에서 답변을 입력한 뒤 다시 상단 버튼으로 이동하지 않아도 재조회할 수 있게 하단 버튼을 추가했다.
- 버튼 스타일과 비활성/활성 조건은 기존 `보완사항 적용하여 재조회` 버튼과 동일하게 유지했다.
- staging에서 품명 `사탕` 결과 화면의 질문별 답변 영역을 열고, 답변 전에는 하단 버튼이 비활성이고 답변 입력 후 활성화되는지 확인했다.
- 하단 버튼 클릭 후 URL에 `보완정보`가 반영되고, 결과 화면에 `이번 재조회에 반영된 보완사항`과 질문 답변이 표시되는 것을 확인했다.
- 최신 staging preview는 `https://customs-hscode-dj46hl6gw-koo-apps.vercel.app`다.
- 다음 작업은 P187 품명 AI 결과 화면 전체 회귀 점검이다. 이번 P186이 질문별 답변 버튼 UI라면, P187은 후보 카드, 점수, 보완 질문, 재조회, 상세 조회 진입을 한 흐름으로 다시 확인하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 품명 `사탕` 질문별 답변 하단 버튼 비활성/활성, 재조회 URL, 반영된 보완사항 표시 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-dj46hl6gw-koo-apps.vercel.app`: 9/9 통과

### product supplement rerun flow

- 이전 작업은 P184 품명 AI 결과 카드 문구 개선이고, 이번 작업은 P185 품명 AI 보완사항 입력 후 재조회 흐름 검증이다.
- staging에서 품명 `사탕` 결과 화면의 `보완사항 입력` 영역을 열고, 버튼이 초기에는 비활성 상태인지 확인했다.
- 간단 보완사항에 `코코아 미함유, 소매포장된 설탕 과자입니다.`를 입력하자 버튼이 활성화되고, 클릭 후 URL에 `보완정보`가 반영되는지 확인했다.
- 재조회 결과 화면에 `이번 재조회에 반영된 보완사항`과 입력 답변이 표시되는 것을 확인했다.
- 최신 staging preview는 `https://customs-hscode-2do527uqr-koo-apps.vercel.app`다.
- 다음 작업은 P186 보완 질문별 답변 UI 점검이다. 이번 P185가 간단 보완사항 재조회 흐름이라면, P186은 접힌 `질문별로 답변하기` UI의 모바일/접근성/버튼 활성화 흐름을 보는 작업이다.

검증:

- Playwright staging browser: 품명 `사탕` 보완사항 입력, 버튼 활성화, 재조회 URL, 반영된 보완사항 표시 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-2do527uqr-koo-apps.vercel.app`: 9/9 통과

### product candidate result copy

- 이전 작업은 P183 HS 직접조회 안전 문구 체계 회귀 점검이고, 이번 작업은 P184 품명 AI 결과 카드 문구 개선이다.
- `가장 가까운 HS CODE`를 `우선 검토 후보`로 바꿔 AI 결과가 확정 HS처럼 보이지 않게 했다.
- `이 코드로 조회`를 `이 후보로 상세 조회`로 바꾸고, `추가 보완 없이 조회 가능한 코드입니다.`를 `현재 정보로 상세 조회 가능한 후보입니다.`로 조정했다.
- 비교 후보 설명도 `GPT 점수순으로 함께 확인할 코드`에서 `GPT 점수순으로 함께 검토할 후보`로 낮췄다.
- 최신 staging preview는 `https://customs-hscode-3sdrkbb0g-koo-apps.vercel.app`다.
- 다음 작업은 P185 품명 AI 보완질문/재조회 입력 흐름 회귀 점검이다. 이번 P184가 후보 카드 문구라면, P185는 보완질문 답변 입력과 재조회 버튼 흐름이 실제로 작동하는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: 품명 `사탕` 결과 화면에서 `우선 검토 후보`, `이 후보로 상세 조회` 확인 및 이전 문구 미노출 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-3sdrkbb0g-koo-apps.vercel.app`: 9/9 통과

### HS direct safety copy regression

- 이전 작업은 P182 요건 후보가 있는 복사 안내문 개선이고, 이번 작업은 P183 HS 직접조회 안전 문구 체계 회귀 점검이다.
- 최신 staging에서 `3304.99-1000`, `1704.90-9000`, `6109.10-1000`을 대상으로 상단 FTA/특혜 카드, 수입요건 카드, 원산지표시 기본정보, 짧은/상세 복사문을 묶어 확인했다.
- `ALL` 상태의 FTA 문구, 중국 선택 시 FTA 조건부 문구, 요건 후보/빈 결과 문구, 원산지표시 문구, FTA/요건/원산지 복사문 주의 문구가 일관되게 렌더링되는 것을 확인했다.
- 소스 검색에서 HS 화면 쪽 `요건 없음`, `보장`, `confirmed`, `guaranteed` 같은 위험 단정 문구가 남아 있지 않은지 확인했다. 남은 `확정` 문구는 `확정 아님`, `예비값`, `staff_confirmed` 내부 상태 등 허용 맥락이다.
- 최신 staging preview는 `https://customs-hscode-lch0o2qhm-koo-apps.vercel.app`다.
- 다음 작업은 P184 품명 AI 결과 화면 안전 문구/복사문 회귀 점검이다. 이번 P183이 HS 직접조회 상세 화면의 묶음 회귀라면, P184는 품명 검색 결과 화면의 후보/점수/보완질문/상세조회 진입 문구가 같은 원칙을 지키는지 보는 작업이다.

검증:

- `rg -n "확정|보장|요건 없음|requirements absent|definitely applicable|guaranteed|confirmed" features/hs lib/i18n/hs-direct.ts server/rules server/repositories -S`
- Playwright staging browser regression: `3304.99-1000`, `1704.90-9000?destinationCountry=CHN`, `6109.10-1000` 화면 및 클립보드 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-lch0o2qhm-koo-apps.vercel.app`: 9/9 통과

### requirement candidate copy text

- 이전 작업은 P181 복사 안내문의 수입요건 빈 결과 문구 개선이고, 이번 작업은 P182 요건 후보가 있는 복사 안내문 개선이다.
- 요건 후보가 있을 때도 짧은 복사문, 상세 복사문, 품명 후보 복사문, 목적국 복사문에 `수입요건 해당 여부와 제출서류는 제품 상세자료 확인 후 검토가 필요합니다.` 문구가 함께 들어가게 했다.
- 기존 상세 복사문에서만 보이던 검토 문구를 짧은 복사문에도 유지해 후보 목록이 확정 요건처럼 전달되지 않게 했다.
- 최신 staging preview는 `https://customs-hscode-73okemyvc-koo-apps.vercel.app`다.
- 다음 작업은 P183 HS 직접조회 안전 문구 체계 회귀 점검이다. 이번 P182가 요건 후보 복사문 개별 수정이라면, P183은 상단 카드·기본정보·복사문이 같은 표현 원칙을 지키는지 묶어서 확인하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser clipboard: `3304.99-1000` 짧은/상세 복사문에 수입요건 후보와 `제품 상세자료 확인 후 검토` 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-73okemyvc-koo-apps.vercel.app`: 9/9 통과

### requirement empty copy text

- 이전 작업은 P180 상세 복사 안내문의 FTA 세율 문구 개선이고, 이번 작업은 P181 복사 안내문의 수입요건 빈 결과 문구 개선이다.
- 빈 수입요건 문구를 `세관장확인대상 수입요건은 조회되지 않았습니다.`에서 `세관장확인 조회 결과 없음`으로 바꿨다.
- 짧은 복사문, 상세 복사문, 품명 후보 복사문, 목적국 복사문에서 세관장확인 빈 결과가 나올 때 통합공고·개별법령·표시·인증·유통규제 주의 문구가 항상 함께 들어가게 했다.
- 최신 staging preview는 `https://customs-hscode-mgj4yhxva-koo-apps.vercel.app`다.
- 다음 작업은 P182 수입요건 후보가 있는 복사 안내문 점검이다. 이번 P181이 빈 결과 문구라면, P182는 요건 후보가 있을 때도 해당 여부와 제출서류가 상세자료 기준 검토라는 문구가 짧은/상세 복사문에 균형 있게 들어가는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser clipboard: `6109.10-1000` 짧은/상세 복사문에 `세관장확인 조회 결과 없음`, `통합공고, 개별법령, 표시·인증·유통규제` 주의 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-mgj4yhxva-koo-apps.vercel.app`: 9/9 통과

### FTA copy text

- 이전 작업은 P179 복사 안내문 상세 버전의 원산지표시 문구 개선이고, 이번 작업은 P180 상세 복사 안내문의 FTA 세율 문구 개선이다.
- 상세 복사문에서 FTA 세율 행 바로 아래에 `FTA 세율은 자동 적용이 아니며 원산지증명, 직접운송, 협정 요건 충족 여부를 함께 확인해야 합니다.` 문구를 추가했다.
- 품명 후보 상세 복사문에서도 같은 문구가 들어가게 했다.
- 영어/중국어 상세 복사문도 같은 의미로 보강했다.
- 최신 staging preview는 `https://customs-hscode-a8aas9g4o-koo-apps.vercel.app`다.
- 다음 작업은 P181 HS 직접조회 복사 안내문의 수입요건 빈 결과 문구 점검이다. 이번 P180이 FTA 복사문이라면, P181은 복사문에서 세관장확인 빈 결과가 요건 부재처럼 전달되지 않는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser clipboard: `1704.90-9000`, 수입국 `CHN` 상세 복사문에 `FTA 관세율`, `FTA 세율은 자동 적용이 아니며 원산지증명, 직접운송, 협정 요건 충족 여부` 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-a8aas9g4o-koo-apps.vercel.app`: 9/9 통과

### origin marking copy text

- 이전 작업은 P178 HS 직접조회 기본정보의 `원산지 표시` 행 문구 개선이고, 이번 작업은 P179 복사 안내문 상세 버전의 원산지표시 문구 개선이다.
- 상세 복사문에서 원산지표시 대상 문구를 `원산지표시대상(Y)`에서 `표시대상 조회됨(Y)`으로 바꿨다.
- 상세 복사문에 `표시방법과 예외는 물품 상태, 포장, 거래조건 기준으로 확인이 필요합니다.` 문구를 추가했다.
- 영어/중국어 상세 복사문도 같은 의미로 보강했다.
- 최신 staging preview는 `https://customs-hscode-h8m1p8wov-koo-apps.vercel.app`다.
- 다음 작업은 P180 HS 직접조회 복사 안내문에서 `FTA 관세율` 문구가 자동 적용처럼 보이지 않는지 점검하는 작업이다. 이번 P179가 원산지표시 복사문이라면, P180은 FTA/특혜 세율 복사문이다.

검증:

- `npx vitest run features/hs/origin-marking-summary.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser clipboard: `3304.99-1000` 상세 복사문에 `원산지 표시`, `표시대상 조회됨(Y)`, `표시방법과 예외는 물품 상태, 포장, 거래조건 기준` 문구 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-h8m1p8wov-koo-apps.vercel.app`: 9/9 통과

### origin marking summary copy

- 이전 작업은 P177 상단 `수입요건` 요약 카드 문구 개선이고, 이번 작업은 P178 HS 직접조회 기본정보의 `원산지 표시` 행 문구 개선이다.
- 원산지표시 대상 행의 버튼 문구를 `원산지표시대상(Y)`에서 `표시대상 조회됨(Y)`으로 바꾸고, 표시방법·예외는 물품 상태, 포장, 거래조건 기준 확인이 필요하다는 보조 문구를 붙였다.
- 원산지표시 비대상 또는 데이터 없음 상태는 `-` 대신 `표시대상 조회 결과 없음`과 개별법령·거래조건·재포장 여부에 따른 별도 표시·증빙 의무 가능성 문구를 표시하게 했다.
- staging의 주요 HS 상세 데이터는 원산지표시 대상 케이스가 넓게 붙어 있어 실제 비대상 화면 케이스는 찾지 못했다. 비대상 문구는 단위 테스트로 검증했다.
- 최신 staging preview는 `https://customs-hscode-pwjaiypxb-koo-apps.vercel.app`다.
- 다음 작업은 P179 HS 직접조회 복사 안내문의 원산지표시 문구 점검이다. 이번 P178이 화면 기본정보 행의 표시 문구라면, P179는 사용자가 복사해서 고객에게 보내는 짧은/상세 안내문에 같은 안전 문구가 적절히 들어가는지 보는 작업이다.

검증:

- `npx vitest run features/hs/origin-marking-summary.test.ts features/hs/import-requirement-summary.test.ts features/hs/preferential-duty-summary.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: `3304.99-1000`에서 `표시대상 조회됨(Y)`, `표시방법과 예외는 물품 상태, 포장, 거래조건 기준` 안내 확인
- Playwright staging browser: 여러 HS 코드에서 비대상 케이스 탐색했으나 현재 staging 데이터는 대상 케이스만 확인됨
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-pwjaiypxb-koo-apps.vercel.app`: 9/9 통과

### import requirement summary copy

- 이전 작업은 P176 HS 직접조회 상단 `FTA/특혜 세율` 요약 카드 문구 개선이고, 이번 작업은 P177 상단 `수입요건` 요약 카드 문구 개선이다.
- 요건 후보가 있을 때는 `N개 요건 가능성`과 함께 제출서류·해당 여부는 제품 상세자료 기준 검토가 필요하다는 문구를 붙였다.
- 요건 후보가 없을 때는 `세관장확인 조회 없음` 대신 `세관장확인 조회 결과 없음`을 사용하고, 통합공고·개별법령·표시·인증·유통규제는 별도 확인이 필요할 수 있다는 문구를 상단 카드에도 표시했다.
- staging 데이터 기준 `3304.99-1000`은 요건 후보 케이스, `6109.10-1000`은 빈 세관장확인 결과 케이스로 확인했다.
- 최신 staging preview는 `https://customs-hscode-22er1z7vn-koo-apps.vercel.app`다.
- 다음 작업은 P178 HS 직접조회 원산지표시 요약/상세 문구 점검이다. 이번 P177이 `수입요건` 카드의 빈 결과 안전 문구라면, P178은 원산지표시 대상 여부가 확정 판정처럼 보이지 않는지 보는 작업이다.

검증:

- `npx vitest run features/hs/import-requirement-summary.test.ts features/hs/preferential-duty-summary.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: `3304.99-1000`에서 `N개 요건 가능성`, `제품 상세자료 기준 검토` 안내 확인
- Playwright staging browser: `6109.10-1000`에서 `세관장확인 조회 결과 없음`, `통합공고, 개별법령, 표시·인증·유통규제` 안내 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-22er1z7vn-koo-apps.vercel.app`: 9/9 통과

### preferential duty summary copy

- 이전 작업은 P175 수입국 필터 안내 의미 보강이고, 이번 작업은 P176 HS 직접조회 상단 `FTA/특혜 세율` 요약 카드 문구 개선이다.
- `ALL` 상태의 상단 카드 문구를 `수입국 선택 시 확인`에서 `수입국·원산지 선택 후 확인`으로 바꿔 원산지와 협정 요건 맥락을 함께 보이게 했다.
- 특정 국가에서 FTA 세율이 표시될 때 `요건 충족 시 ...`로 출력해 자동 적용 세율처럼 보이지 않게 했다.
- 표시할 FTA 행이 없을 때는 `표시 가능한 FTA 없음` 대신 `협정세율 표시 없음`을 사용해 FTA 부재를 단정하지 않게 했다.
- 최신 staging preview는 `https://customs-hscode-752wv1ip0-koo-apps.vercel.app`다.
- 다음 작업은 P177 HS 직접조회 상단 수입요건 요약 카드 문구 점검이다. 이번 P176이 `FTA/특혜 세율` 카드의 조건부 표현을 다룬 작업이라면, P177은 `수입요건` 카드의 `세관장확인 조회 없음` 문구가 “요건이 없다”처럼 오해되지 않는지 보는 작업이다.

검증:

- `npx vitest run features/hs/preferential-duty-summary.test.ts features/hs/import-tariff-country-filter.test.ts features/hs/import-tariff-display.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: `ALL` 상태에서 `수입국·원산지 선택 후 확인`, `원산지증명`, `협정 요건` 안내 확인
- Playwright staging browser: 중국 선택 후 `요건 충족 시 한-중 FTA 관세율 0%`, `자동 적용 세율이 아닙니다` 안내 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-752wv1ip0-koo-apps.vercel.app`: 9/9 통과

### import tariff country filter guidance

- 이전 작업은 P174 세율표 라벨 품질 개선이고, 이번 작업은 P175 수입국 필터 안내 의미 보강이다.
- `ALL` 상태는 이 HSK에 등록된 세율 후보를 함께 보여주는 참고 화면이라는 문구를 추가했다.
- 특정 국가 선택 시 해당 국가와 연결된 협정·특혜 세율만 표시하며 FTA 세율은 자동 적용이 아니라 원산지증명과 협정 요건 확인이 필요하다는 문구를 표시하게 했다.
- 국가 필터 선택 후 안내 문구가 `중국 (CHN) 기준...`으로 바뀌고 세율표가 주요 3건으로 줄어드는 것을 staging 브라우저에서 확인했다.
- 최신 staging preview는 `https://customs-hscode-5b6mju7pz-koo-apps.vercel.app`다.
- 다음 작업은 P176 HS 직접조회 상단 요약 카드의 FTA/특혜 세율 문구 점검이다. 이번 P175가 세율표 필터 영역의 설명이라면, P176은 상단 10자리 요약 카드에서 `수입국 선택 시 확인`, 특정 국가 세율 표시가 사용자를 덜 헷갈리게 하는지 보는 작업이다.

검증:

- `npx vitest run features/hs/import-tariff-country-filter.test.ts features/hs/import-tariff-display.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: `ALL` 상태에서 `세율 후보`, `원산지증명` 안내 확인
- Playwright staging browser: 중국 선택 후 `중국 (CHN) 기준`, `자동 적용이 아니며` 안내 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-5b6mju7pz-koo-apps.vercel.app`: 9/9 통과

### import tariff label clarity

- 이전 작업은 P171 HS 직접조회 상세 세율표 밀도 개선이고, 이번 작업은 P174 세율표 라벨 품질 개선이다.
- `관세율구분 R`, `관세율구분 U`, `관세율구분 FEF1`처럼 DB 원시 코드 fallback이 화면에 남는 문제를 확인했다.
- `R`은 `최빈개발도상국 특혜관세`, `U`는 `북한산 관세율`로 표시되게 보강했다.
- `FEF` 계열은 `한-EFTA FTA 관세율`로 표시되게 하고 스위스, 노르웨이, 아이슬란드, 리히텐슈타인 alias를 추가했다.
- 최신 staging preview는 `https://customs-hscode-6zb049hlk-koo-apps.vercel.app`다.
- 다음 작업은 P175 HS 직접조회 수입국 필터 기본값/안내 점검이다. 이번 P174가 세율 행 이름을 읽기 쉽게 만든 작업이라면, P175는 `ALL` 상태와 특정 수입국 선택 시 사용자가 FTA/특혜 세율 의미를 혼동하지 않는지 점검하는 작업이다.

검증:

- `npx vitest run features/hs/import-tariff-display.test.ts features/hs/import-tariff-country-filter.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: `1704.90-9000`에서 `최빈개발도상국 특혜관세`, `한-EFTA FTA 관세율`, `북한산 관세율` 확인
- Playwright staging browser: `관세율구분 R`, `관세율구분 FEF1` 미노출 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-6zb049hlk-koo-apps.vercel.app`: 9/9 통과

### hs direct detail density review

- 이전 작업은 P173 staging 인증 스모크이고, 이번 작업은 원래 대기 중이던 P171 HS 10자리 직접조회 상세 화면 밀도 점검이다.
- staging에서 `3304.99-1000`, `1704.90-9000` 직접조회 화면을 확인했고, 10자리 요약은 상단에 잘 보이지만 `세율 적용순서`가 모든 FTA/특혜 세율 행을 기본으로 펼쳐 화면을 과하게 차지하는 것을 확인했다.
- 네비게이터 들여쓰기나 색상 구조는 다시 건드리지 않고, `ImportTariffCountryFilter`에서 세율표 기본 노출을 주요 8건으로 제한했다.
- 나머지 세율은 `나머지 N건 펼치기` 버튼으로 볼 수 있게 해 데이터는 유지하고 기본 화면 밀도만 낮췄다.
- 국가 필터를 바꾸면 펼침 상태를 초기화해 새 국가의 주요 세율부터 보이게 했다.
- 최신 staging preview는 `https://customs-hscode-l86odu24x-koo-apps.vercel.app`다.
- 다음 작업은 P174 HS 직접조회 상세의 관세율 행 라벨 품질 점검이다. 이번 P171이 세율표 노출량을 줄인 작업이라면, P174는 `관세율구분 R`, `관세율구분 FEF1`처럼 사용자에게 의미가 약한 라벨을 더 읽기 쉬운 한글명으로 보완하는 작업이다.

검증:

- `npx vitest run features/hs/import-tariff-country-filter.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Playwright staging browser: `3304.99-1000`, `1704.90-9000`에서 `주요 8건 먼저 표시`, `나머지 N건 펼치기` 확인
- Playwright staging browser: 펼치기 후 `전체 32건 표시`, `주요 세율만 보기` 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true npm run smoke:production -- https://customs-hscode-l86odu24x-koo-apps.vercel.app`: 9/9 통과

### staging authenticated smoke

- 이전 작업은 P172 staging 개발 기준 생성이고, 이번 작업은 staging 보호 우회 후 실제 테스트 계정 로그인과 보호 화면 본문을 검증한 P173이다.
- Vercel Deployment Protection bypass secret을 헤더로 넣어 staging `/login` 접근을 확인했다.
- 로컬 테스트 계정 파일의 화주, 포워더, 관세사 계정이 staging에서도 `/dashboard` 로그인에 성공하는지 브라우저로 확인했다. 비밀번호와 bypass secret은 출력하지 않았다.
- 화주 계정으로 인증 스모크를 실행해 대시보드, HS 직접조회, 품명 AI 조회, 해외 HS, 납세 예상, 화물, 중고차 수출, 컨테이너 조회, 무역뉴스 본문 마커를 확인했다.
- 15초 timeout에서는 해외 HS 조회가 cold start/데이터 조립으로 1회 timeout됐고, 30초 timeout에서는 9/9 통과했다.
- `scripts/smoke_production_routes.mjs` 기본 timeout을 30초로 조정하고, 배포 런북에 timeout 기준을 문서화했다.
- 다음 작업은 P171 HS 직접조회 상세 밀도 점검 재개다. 이번 P173이 staging 인증 검증 기반을 만든 작업이라면, 다음은 원래 대기 중이던 HS 10자리 직접조회 화면 자체의 간략 정보와 네비게이터 밀도 품질을 staging 기준으로 확인하는 작업이다.

검증:

- Playwright staging login check: forwarder, customs_broker, shipper `/dashboard` 진입
- `VERCEL_AUTOMATION_BYPASS_SECRET=... SMOKE_REQUIRE_AUTHENTICATED=true SMOKE_TIMEOUT_MS=30000 npm run smoke:production -- https://customs-hscode-hwkza5kxy-koo-apps.vercel.app`: 9/9 통과
- `npm run typecheck`
- `npm run lint`

### staging development baseline

- 이전 작업은 P170 품명 후보 상세 진입 회귀 검증이고, 이번 작업은 로컬 DB/인증 상태에 흔들리지 않도록 staging 개발 기준을 만든 P172다.
- `staging/platform-dev` 브랜치를 만들고 원격에 push했다.
- GitHub push protection이 로컬 Supabase key hardcode를 막아서, 로컬 개발 스크립트의 hardcode 키를 제거하고 `LOCAL_SUPABASE_ANON_KEY`, `LOCAL_SUPABASE_SERVICE_ROLE_KEY` 환경변수 필수 입력 방식으로 바꿨다.
- push 대상 히스토리에서 `sb_secret_...`, `sb_publishable_...` 패턴을 제거한 뒤 다시 push했다.
- Vercel preview 배포를 만들었고 최신 staging URL은 `https://customs-hscode-hwkza5kxy-koo-apps.vercel.app`다.
- preview 배포는 READY까지 완료됐고, Vercel Deployment Protection bypass secret 적용 후 비로그인 스모크가 통과했다.
- `scripts/smoke_production_routes.mjs`에 `VERCEL_AUTOMATION_BYPASS_SECRET` 또는 `VERCEL_PROTECTION_BYPASS_SECRET` 기반 `x-vercel-protection-bypass` 헤더 지원을 추가했다.
- `docs/DEPLOYMENT_RUNBOOK.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`에 staging/preview 검증 기준을 반영했다.
- 다음 작업은 P173 staging 인증 스모크다. 이번 P172가 staging 배포와 비로그인 보호 흐름을 검증한 작업이라면, P173은 staging에 로그인 가능한 테스트 계정으로 대시보드, 품명검색, HS 직접조회 본문까지 확인하는 작업이다.

검증:

- `node --check scripts/run_local_dev.mjs`
- `node --check scripts/run_product_supplement_e2e_local.mjs`
- `node --check scripts/smoke_production_routes.mjs`
- `npm run typecheck`
- `npm run lint`
- `vercel deploy --yes`: preview READY
- `npm run smoke:production -- https://customs-hscode-hwkza5kxy-koo-apps.vercel.app`: Vercel Deployment Protection `401` 확인
- `VERCEL_AUTOMATION_BYPASS_SECRET=... npm run smoke:production -- https://customs-hscode-hwkza5kxy-koo-apps.vercel.app`: login 200, protected route login guard 307, total 10/10 통과

### product candidate detail handoff regression

- 이전 작업은 P169 로컬 품명 보완 E2E runner 안정화이고, 이번 작업은 품명 검색 10자리 후보를 눌러 직접조회로 이동할 때 검색 맥락이 유지되는지 확인한 P170이다.
- 브라우저에서 `사탕` 품명검색 결과의 `이 코드로 조회`를 클릭해 `/hs/direct?...&source=product_search&sourceProductName=사탕&sourceCandidateRank=1`로 이동하는지 확인했다.
- 상세 화면에서 품명, 후보 순위, 조회기준일, 간략 정보가 유지되는지 확인했다.
- 상세 배너 문구를 `품명검색에서 선택한 AI 추천 HS CODE입니다.`에서 `품명검색에서 선택한 HS CODE입니다.`로 바꿔 AI가 확정한 듯한 표현을 줄였다.
- 다음 작업은 P171 HS 직접조회 상세 표시 밀도 점검이다. 이번 P170이 품명 후보에서 상세조회로 넘어가는 handoff라면, P171은 10자리 직접조회 화면 자체의 간략 정보와 네비게이터 표시가 사용자에게 과밀하지 않은지 확인하는 작업이다.

검증:

- Playwright storage-state check: `사탕` 품명검색 -> `이 코드로 조회` 클릭 -> source banner, product name, basis date, brief info 확인
- `npm run typecheck`
- `npm run lint`

### local product supplement e2e runner

- 이전 작업은 P168 로컬 dev 서버 실행 환경 분리이고, 이번 작업은 품명 보완 E2E가 로컬 서버·storage state·local Supabase를 일관되게 사용하도록 감싼 P169다.
- `scripts/run_product_supplement_e2e_local.mjs`를 추가해 로컬 base URL, local Supabase health, storage state 존재를 먼저 확인한 뒤 `e2e_product_supplement_flow.mjs`를 실행하게 했다.
- `npm run e2e:product-supplement:local`을 추가했다.
- storage state host와 맞도록 기본 E2E base URL은 `http://127.0.0.1:3100`으로 고정했다.
- runner 출력에는 base URL origin, Supabase origin, storage state 경로만 남기고 secret 값은 출력하지 않는다.
- 다음 작업은 P170 품명 후보 상세 진입 회귀 검증이다. 이번 P169가 E2E 실행 경로 안정화라면, P170은 품명 검색 10자리 후보를 누른 뒤 직접조회 화면에서 source/basis date/간략정보가 유지되는지 보는 작업이다.

검증:

- `node --check scripts/run_product_supplement_e2e_local.mjs`
- `npm run e2e:product-supplement:local`
- `npm run typecheck`
- `npm run lint`

### local dev environment split

- 이전 작업은 P167 품명 AI 검색의 HSK 10자리 후보 품질 보강이고, 이번 작업은 로컬 브라우저 검증이 원격 `.env.local` 설정에 흔들리지 않도록 개발 서버 실행 환경을 분리한 P168이다.
- `scripts/run_local_dev.mjs`를 추가해 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `DATABASE_URL`, Supabase local key, `AI_PROVIDER`를 로컬 기본값으로 고정해 Next dev 서버를 띄울 수 있게 했다.
- `npm run dev:local`과 `npm run dev:local:env`를 추가했다.
- `dev:local:env`는 base URL, Supabase origin, DB host, AI provider만 출력하고 secret 값은 출력하지 않는다.
- 기본은 `AI_PROVIDER=mock`이라 UI/E2E route 확인이 빠르고, 실제 GPT 품명 흐름이 필요하면 `LOCAL_AI_PROVIDER=openai`로 전환할 수 있게 문서화했다.
- `.env.local` 파일 자체는 수정하지 않았고, 원격 푸시나 배포도 하지 않았다.
- 다음 작업은 P169 로컬 E2E 실행 경로 일관화다. 이번 P168이 서버 실행 환경 분리라면, P169는 기존 E2E/리뷰 스크립트가 이 로컬 환경을 더 안정적으로 사용하도록 연결·문서화하는 작업이다.

검증:

- `npm run dev:local:env`
- `node --check scripts/run_local_dev.mjs`
- `npm run typecheck`
- `npm run lint`

### product name search HSK10 expansion

- 이전 작업은 운영/대시보드/거래 상태 화면 회귀 검증이고, 이번 작업은 품명 AI 검색에서 GPT가 넓은 HS4/HS6만 주는 경우에도 사용자 화면에는 HSK 10자리 후보를 먼저 보여주도록 보강한 것이다.
- 사탕·캔디·설탕과자 문맥에서 GPT 응답이 `1704`처럼 넓게 들어와도 `1704.90-2090` 계열의 한국 HSK 10자리 확장 힌트를 보존하도록 AI 정규화 후처리를 수정했다.
- `hs_master` seed 또는 원격 DB에 해당 1704 하위 행이 비어 있어도 후보 카드에 HSK 10자리 명칭을 표시할 수 있도록 1704 계열 공식 HSK 확장 fallback을 추가했다.
- 캐시 버전을 올려 기존 `사탕 -> 1704` 결과가 메모리/lookup cache에 남아 화면에 계속 표시되는 문제를 방지했다.
- 품명 보완 재조회 E2E가 로컬 storage state를 사용할 수 있게 해 로그인 계정 타임아웃과 검색 UX 검증을 분리했다.
- 브라우저에서 `사탕` 검색 결과가 상단 후보 카드에 HSK 10자리로 표시되고, 보완사항 입력/재조회 CTA와 `AI 분류 흐름 요약` 순서가 유지되는 것을 확인했다.
- 다음 작업은 P168 로컬 개발 서버 환경 고정 점검이다. 이번 P167이 품명 검색 결과 품질 보강이라면, P168은 `.env.local`의 원격 Supabase/OpenAI 설정 때문에 로컬 검증이 느려지거나 흔들리지 않도록 실행 환경을 분리하는 작업이다.

검증:

- `npx vitest run server/rules/hs-candidate.service.test.ts server/ai/clarification.service.test.ts`
- `E2E_BASE_URL=http://127.0.0.1:3100 E2E_STORAGE_STATE=tmp/e2e-auth/local-developer.json E2E_TIMEOUT_MS=180000 node scripts/e2e_product_supplement_flow.mjs`
- Playwright storage-state check: `/hs/direct?query=사탕&direction=import&destinationCountry=CN&basisDate=2026-05-30`
- `npm run typecheck`
- `npm run lint`

### marketplace document visibility handoff

- 이전 작업은 P80 대표 운영 큐와 상세 개선 요청 안내이고, 이번 작업은 P81 화주·파트너 서류 공개 범위 handoff 보강이다.
- `ServiceRequestDocumentVisibilityGuide`를 추가해 화주가 운송/통관 요청 서류를 첨부할 때 `나와 운영자만`, `매칭된 파트너에게 공개`, `선정된 파트너에게만 공개`, `운영자만`의 선택 기준을 바로 볼 수 있게 했다.
- 운송 요청 상세에는 포워더 기준 공개 문구를, 통관 의뢰 상세에는 관세사무소 기준 공개 문구를 적용했다.
- `PartnerVisibleDocumentNotice`를 추가해 포워더·관세사무소 opportunity 상세의 `공개된 요청 서류` 목록이 현재 파트너에게 공개 허용된 서류만 표시한다는 점을 명확히 했다.
- 민감 서류 보호 안내만 추가했고, 서류 조회 권한, storage bucket, RLS, DB schema는 변경하지 않았다.
- 로컬 파일만 수정했고 원격 푸시, 배포, DB migration 적용은 하지 않았다.
- 다음 작업은 P82 거래 완료 리포트/보관 서류 모델 초안 검토다. 이번 P81이 요청 진행 중 서류 공개 범위 안내라면, P82는 거래 완료 후 결과 메타데이터와 최종 보관 서류 묶음의 데이터 구조를 정리하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-document-visibility-guide.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright requester check: `/requests/freight/75000000-0000-4000-8000-000000000001#request-documents`, `/requests/clearance/75000000-0000-4000-8000-000000000002#request-documents`
- Playwright partner check: `/requests/freight/opportunities/75000000-0000-4000-8000-000000000001#request-documents`, `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000002#request-documents`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### completion report primary next action

- 이전 작업은 P81 서류 공개 범위 handoff이고, 이번 작업은 P82 완료 리포트 패널에서 사용자가 현재 해야 할 일을 먼저 보게 하는 UX 보강이다.
- P82.1에서 완료 리포트 모델을 새로 시작할 필요가 있는지 확인했고, 기존 migration/RPC/RLS/repository/UI/preview가 이미 구현된 상태라 중복 모델링 대신 화면 과밀도 개선으로 방향을 바꿨다.
- `selectCurrentCompletionReportWorkflowStep`를 추가해 완료 리포트 5단계 중 현재 대표 행동을 하나만 선택한다.
- 완료 리포트 패널 상단의 `완료 후 다음 행동` 안내가 일반 설명 대신 `현재 할 일: ...`과 필요한 차단 사유를 먼저 표시하게 했다.
- 기존 단계별 CTA, 제출·확인·운영 검토·잠금 버튼, source/safety 문구, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P83 운영 화면 카드 밀도 재점검이다. 이번 P82가 완료 리포트 상세의 다음 행동 요약이라면, P83은 대표/운영자 화면에서 우선순위 카드가 과하게 많은지 줄이는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-workflow.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright requester check: `/requests/freight/00000000-0000-4000-8000-000000000101#completion-report-summary`, `/requests/clearance/00000000-0000-4000-8000-000000000201#completion-report-summary`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### owner operations density refinement

- 이전 작업은 P82 완료 리포트 대표 행동 요약이고, 이번 작업은 P83 대표/운영자 화면의 우선순위 큐 밀도를 줄이는 UX 보강이다.
- 기존 대표 우선순위 큐는 최대 3개 병목을 모두 카드로 펼쳤지만, 대표가 첫 작업만 바로 이해하도록 1순위 카드만 기본 노출하게 했다.
- 2~3순위는 `다음 후보 ...개 보기` details 안으로 옮겨 필요할 때만 펼치게 했다.
- 기존 담당 주체, 우선 이유, 복사용 운영 개선 요청문, 상세 진단 지표, 운영 샘플 링크는 유지했다.
- 권한/RLS, 운영 통계 집계, 민감정보 노출 범위, DB schema는 변경하지 않았다.
- 다음 작업은 P84 운영 상세 또는 요청 상세에서 대표가 복사한 개선 요청을 실제 작업으로 연결하는 흐름을 더 줄일지 점검하는 것이다. 이번 P83이 운영 목록 밀도 조정이라면, P84는 상세 화면에서 복사 후 확인 위치까지 이어지는 흐름 점검이다.

검증:

- `npx vitest run features/operations/platform-request-operations-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/users#platform-request-operations`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### operations detail handoff action strip

- 이전 작업은 P83 운영 우선순위 큐 밀도 조정이고, 이번 작업은 P84 운영 상세에서 복사한 개선 요청을 실제 작업 전달로 이어주는 handoff 보강이다.
- 운영 상세 개선 요청 카드에 `확인 위치 -> 요청 문장 복사 -> 개발 작업으로 전달` 순서를 1-2-3 형태로 추가했다.
- 기존 민감정보 제외 안내, 확인 위치 anchor, 복사 버튼, 개선 요청 pre 문구는 유지했다.
- 권한/RLS, 운영 상세 조회 repository, 원문 비노출 정책, DB schema는 변경하지 않았다.
- 다음 작업은 P85 marketplace 거래 흐름에서 사용자가 요청 작성 이후 “다음 행동”을 더 쉽게 찾는지 다시 점검하는 것이다. 이번 P84가 운영자 상세 handoff라면, P85는 실제 화주/파트너 거래 화면의 다음 행동 가시성 점검이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/requests/75000000-0000-4000-8000-000000000001`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### requester next-action publish anchor

- 이전 작업은 P84 운영 상세 handoff이고, 이번 작업은 P85 화주 요청 상세의 다음 작업 바로가기 연결을 점검한 UX 보강이다.
- 화주 상세에는 이미 `다음 작업 바로가기`가 있으므로 새 안내를 중복 추가하지 않았다.
- 대신 운송 상세도 초안+서류 있음 상태에서 `공개 설정` next-focus가 `#request-publish`로 이동하도록 `publishAnchor`를 전달했다.
- 운송/통관 요청 row의 공개 form에 `id="request-publish"`를 붙여 상단 바로가기가 실제 공개 CTA 위치로 이동하게 했다.
- 서류, 질문, 견적 anchor와 기존 상세 작업 흐름은 유지했다.
- 권한/RLS, 요청 공개 action, DB schema는 변경하지 않았다.
- 다음 작업은 P86 파트너 opportunity 상세에서 파트너가 질문/견적/진행 시작 중 다음 행동을 바로 찾는지 점검하는 것이다. 이번 P85가 화주 상세 next-action이라면, P86은 포워더·관세사무소 opportunity 상세 next-action이다.

검증:

- `npx vitest run server/repositories/service-request-list-view.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright requester check: `/requests/freight/75000000-0000-4000-8000-000000000001`, `/requests/clearance/75000000-0000-4000-8000-000000000002`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### partner next-focus regression coverage

- 이전 작업은 P85 화주 상세 next-action anchor이고, 이번 작업은 P86 포워더·관세사무소 opportunity 상세의 다음 행동 우선순위 점검이다.
- 파트너 opportunity 상세에는 이미 `다음 작업 바로가기`가 있으므로 새 UI를 중복 추가하지 않았다.
- 대신 `buildPartnerOpportunityNextFocus` 테스트를 보강해 질문 확인, 기본 견적 제출, 진행중 완료 처리 우선순위를 고정했다.
- 포워더/관세사무소 opportunity 상세에서 서류, 질문, 견적 anchor가 실제 DOM에 존재하는지 브라우저로 확인했다.
- 권한/RLS, 견적 제출 action, 질문 등록 action, DB schema는 변경하지 않았다.
- 다음 작업은 P87 파트너 견적 제출 전 안내와 필수 확인 흐름이 과하지 않은지 점검하는 것이다. 이번 P86이 next-action anchor 검증이라면, P87은 견적 제출 form 자체의 입력 전 안내와 안전 문구 점검이다.

검증:

- `npx vitest run server/repositories/service-request-list-view.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright partner check: `/requests/freight/opportunities/75000000-0000-4000-8000-000000000001`, `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000002`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### freight bid form guidance

- 이전 작업은 P86 파트너 opportunity next-focus 테스트 보강이고, 이번 작업은 P87 포워더 운송 견적 제출 form의 입력 전 안내 보강이다.
- 통관 견적 form에는 예비 견적과 담당자 검토 문구가 이미 있었지만, 운송 견적 form은 바로 입력칸부터 시작했다.
- 포워더 운송 견적 제출 영역에 총액, 포함·제외 비용, 유효기한, 리드타임, 위험물·온도관리·중고차 특수 조건 확인 안내를 추가했다.
- 제출 버튼 옆에 운송 가능 여부 보장 확정서가 아니라 화주 비교용 조건 제안이라는 문구를 추가했다.
- 견적 제출 action, schema, RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P88 완료 후 피드백 CTA가 화주/파트너 양쪽에서 과하지 않고 실제 신뢰 데이터 축적에 도움이 되는지 점검하는 것이다. 이번 P87이 견적 제출 전 안내라면, P88은 완료 후 피드백 제출 안내다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright forwarder check: `/requests/freight/opportunities/75000000-0000-4000-8000-000000000001#opportunity-bid`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### feedback trust metric context

- 이전 작업은 P87 포워더 운송 견적 form 안내 보강이고, 이번 작업은 P88 완료 후 피드백 CTA의 맥락 보강이다.
- 피드백 form은 이미 최소 입력과 민감정보 제외 안내가 있었으므로 새 입력 항목을 추가하지 않았다.
- 대신 사용자가 남긴 평점이 다음 견적 비교에서 파트너 신뢰 지표로 활용된다는 문구를 추가했다.
- 기존 company별 1회 제출 제한, 민감정보 제외 안내, 제출 action, RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P89 운영 통계/복사용 개선 요청 문구가 실제 개발 작업으로 넘기기에 충분히 짧고 명확한지 다시 점검하는 것이다. 이번 P88이 완료 후 사용자 피드백 CTA라면, P89는 운영자가 보는 개선 요청 문구 품질이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester check: `/requests/clearance/00000000-0000-4000-8000-000000000201#request-completion`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### operations copy prompt core metrics

- 이전 작업은 P88 완료 후 피드백 CTA 맥락 보강이고, 이번 작업은 P89 운영자가 복사하는 개선 요청 문구의 길이와 명확성 점검이다.
- 화면의 상세 진단 지표는 유지하되, 복사용 개선 요청문에는 핵심 지표만 포함하게 줄였다.
- 복사용 문구의 `운영 지표` 섹션을 `핵심 지표`로 바꾸고 전체 요청, 진행 요청, 선정 후 진행, 완료, 완료 리포트 없음, 완료 후 피드백 없음만 남겼다.
- 완료 리포트 세부 상태, 잠금 완료, 미답변 질문, 견적 없는 공개 같은 상세 지표는 화면의 접힌 진단 영역에서만 확인한다.
- 운영 통계 집계, 권한/RLS, 민감정보 제외 문구, DB schema는 변경하지 않았다.
- 다음 작업은 P90 전체 marketplace 거래 화면의 중복 안내와 접힌 영역을 다시 훑어 과하게 반복되는 안내를 줄이는 것이다. 이번 P89가 복사용 운영 요청문 축약이라면, P90은 실제 화면 내 반복 안내 정리다.

검증:

- `npx vitest run features/operations/platform-request-operations-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/users#platform-request-operations`, 상세 진단 영역 펼침 후 `핵심 지표:` 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### marketplace detail duplicate guidance trim

- 이전 작업은 P89 운영자가 복사하는 개선 요청문 축약이고, 이번 작업은 P90 실제 marketplace 거래 상세 화면의 반복 안내 정리다.
- 화주 운송/통관 상세와 포워더/관세사무소 opportunity 상세에는 이미 `다음 작업 바로가기`가 있어 서류, 질문, 견적, 공개 위치로 바로 이동할 수 있다.
- 해당 상단 바로가기와 같은 일을 다시 설명하던 상세 작업 흐름 패널을 상세 화면 4곳에서 제거했다.
- 요청 시작/목록 영역에서 아직 필요한 파트너 작업 흐름 패널은 유지했다.
- 더 이상 쓰이지 않는 화주 상세 전용 `RequesterDetailFlowPanel` 파일을 제거했다.
- 권한/RLS, 견적 제출, 질문 답변, 공개 action, DB schema는 변경하지 않았다.
- 다음 작업은 P91 요청 시작·목록 화면의 안내 패널 범위 점검이다. 이번 P90이 상세 화면 반복 안내 제거라면, P91은 시작/목록 화면에 남은 안내가 실제 시작 흐름에 필요한지 확인하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright detail check: 화주 운송/통관 상세와 포워더/관세사무소 opportunity 상세에서 `다음 작업 바로가기` 유지, 상세 흐름 패널 제목 미노출 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### marketplace start guidance workspace alignment

- 이전 작업은 P90 상세 화면 반복 안내 제거이고, 이번 작업은 P91 요청 시작·목록 화면에 남은 안내 패널의 역할별 위치 점검이다.
- 운송 화면은 화주 workspace에 운송 입찰 흐름이 노출되지 않고, 포워더 workspace에만 `운송 입찰 작업 흐름`이 노출되는 상태라 유지했다.
- 통관 화면은 화주 workspace의 `내 통관 의뢰 요청` 카드 안에 관세사무소용 `통관 입찰 작업 흐름`이 잘못 노출되고 있었다.
- 해당 패널을 화주 목록에서 제거하고, 관세사 workspace의 `입찰 가능 통관 의뢰` 카드로 옮겼다.
- 요청 시작 흐름, 초안 저장 form, 견적 제출 action, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P92 요청 row 안의 카드/버튼/상태 문구 밀도 점검이다. 이번 P91이 안내 패널의 역할별 위치 수정이라면, P92는 각 요청 row 내부에서 실제 행동 버튼과 상태 문구가 과하게 반복되는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright list check: 통관 화주 목록에서 `통관 입찰 작업 흐름` 미노출, 관세사 목록에서 노출 확인
- Playwright list check: 운송 화주 목록에서 `운송 입찰 작업 흐름` 미노출, 포워더 목록에서 노출 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### marketplace clearance row action layout

- 이전 작업은 P91 안내 패널의 역할별 위치 수정이고, 이번 작업은 P92 요청 row 내부의 버튼/상태 문구 밀도 점검이다.
- 운송 화주 row는 제목·상태 badge와 `상세 작업` 버튼이 좌우로 분리되어 있었다.
- 통관 화주 row는 `상세 작업` 버튼이 상태 badge들과 같은 줄에 섞여 있어 row를 훑을 때 행동 버튼과 상태 정보가 분리되지 않았다.
- 통관 row 상단을 운송 row와 같은 `본문 + 우측 상세 작업 버튼` 구조로 맞췄다.
- 제목은 긴 경우 truncate되도록 하고, 목적국/HSK/신고 예상 건수는 제목 아래 보조 정보로 유지했다.
- 권한/RLS, 상세 링크 대상, 공개 action, DB schema는 변경하지 않았다.
- 다음 작업은 P93 선정 후 다음 업무 카드 밀도 점검이다. 이번 P92가 row 상단의 행동 버튼 구조라면, P93은 파트너 선정 이후 안내 카드가 너무 많은 문장을 펼쳐 보이는지 확인하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester check: `/requests/clearance?workspace=requester`에서 `상세 작업` 링크 유지, 관세사 입찰 흐름 미노출 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### compact selected next-step summary

- 이전 작업은 P92 통관 row 상단의 행동 버튼 구조 정리이고, 이번 작업은 P93 선정 후 다음 업무 카드의 목록 row 과밀도 점검이다.
- `포워더 선정 후 다음 업무`, `관세사무소 선정 후 다음 업무` 카드는 상세 화면에서 필요한 3단계 안내와 선정 파트너 전용 서류 handoff를 보여준다.
- 같은 카드가 compact 목록 row에도 펼쳐질 수 있어, 목록에서는 한 줄 요약만 보이게 줄였다.
- 상세 화면에서는 `compact=false`이므로 기존 상세 3단계 안내와 선정 파트너 전용 서류 안내를 유지한다.
- 완료 리포트 패널은 아직 목록 row에 크게 펼쳐지는 상태라 다음 P94에서 별도 정리 대상으로 잡았다.
- 권한/RLS, lifecycle action, 완료 리포트 action, DB schema는 변경하지 않았다.
- 다음 작업은 P94 완료 리포트 목록 row 과밀도 정리다. 이번 P93이 선정 후 다음 업무 카드라면, P94는 완료 리포트 패널 자체가 목록에서 과하게 펼쳐지는 문제를 줄이는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester list check: 운송/통관 목록에서 선정 후 다음 업무 상세 카드 제목 미노출 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### compact completion report summary

- 이전 작업은 P93 선정 후 다음 업무 카드의 목록 row 요약이고, 이번 작업은 P94 완료 상태 row의 완료 리포트 패널 과밀도 정리다.
- 완료된 운송/통관 요청 row는 compact 목록에서도 완료 리포트, 보관 서류, 피드백 form 전체를 펼쳐 보이고 있었다.
- 목록 row에서는 `완료 리포트, 보관 서류, 거래 피드백은 상세 작업에서 확인합니다.` 요약만 표시하게 했다.
- 상세 화면과 partner opportunity 상세에서는 기존 완료 리포트 패널과 피드백 form을 유지한다.
- 완료 리포트 action, 피드백 action, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P95 파트너 입찰 가능 목록 row 밀도 점검이다. 이번 P94가 화주 완료 row의 리포트 패널 요약이라면, P95는 포워더·관세사무소가 보는 입찰 가능 목록 row의 compact 정보량을 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester list check: 운송/통관 목록에서 완료 리포트 전체 제목 미노출, 완료 요약 문구 노출 확인
- Playwright requester detail smoke: 운송/통관 상세 route 렌더링 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### partner compact opportunity status copy

- 이전 작업은 P94 화주 완료 row의 완료 리포트 요약이고, 이번 작업은 P95 파트너 입찰 가능 목록 row의 상태별 안내 문구 정합성 점검이다.
- 통관 compact opportunity row는 `partner_selected`, `in_progress`, `completed` 상태를 모두 선정 후 업무 안내로 묶고 있었다.
- 운송 compact opportunity row는 `partner_selected`만 선정 후 업무로 판단해, 진행중/완료 상태에서도 조건 확인·질문 등록·견적 제출 안내처럼 보일 수 있었다.
- 운송 compact opportunity row도 진행중/완료 상태를 선정 후 업무 안내로 묶어 통관과 맞췄다.
- 견적 제출 form, lifecycle action, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P96 marketplace 상태 문구 전반의 정합성 점검이다. 이번 P95가 운송 compact row의 단일 상태 조건이라면, P96은 운송·통관 요청/입찰 상태 문구 전체를 훑는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright partner list check: 포워더/관세사무소 목록 route 렌더링 및 `입찰 작업` 링크 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### request progress selected-or-later state

- 이전 작업은 P95 운송 compact opportunity row의 상태별 안내 문구 정합성이고, 이번 작업은 P96 운송·통관 요청 progress 단계의 상태 정합성 점검이다.
- 진행중/완료 상태는 이미 파트너 선정 이후 단계인데, 요청 progress의 `선정` 단계는 `partner_selected` 상태에서만 완료로 표시될 수 있었다.
- 운송/통관 파일에 `isSelectedOrLaterStatus` helper를 추가해 `partner_selected`, `in_progress`, `completed`를 모두 선정 이후 상태로 판단하게 했다.
- 통관 progress의 `견적` 단계도 진행중/완료 상태에서 완료로 이어지게 맞췄다.
- 상태 라벨, lifecycle action, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P97 progress 단계 계산 공통화 검토다. 이번 P96이 상태 판단 보정이라면, P97은 운송·통관 progress 계산 중복을 공통 helper로 합칠 가치가 있는지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester list check: 운송/통관 목록 렌더링 및 완료 row 요약 유지 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### selected-or-later status helper

- 이전 작업은 P96 진행중/완료 요청도 선정 이후 progress로 표시하는 상태 보정이고, 이번 작업은 P97 progress 관련 중복 공통화 검토다.
- 운송/통관 progress 렌더링은 스타일과 입력값이 달라 한 번에 합치면 UI 회귀 위험이 있어 유지했다.
- 대신 `partner_selected`, `in_progress`, `completed`를 선정 이후 상태로 판단하는 `isSelectedOrLaterStatus`만 `service-request-status.ts`로 분리했다.
- 운송/통관 요청 row는 같은 helper를 사용해 progress의 선정 단계와 통관 견적 단계 판단을 유지한다.
- UI copy, lifecycle action, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P98 상태 count 계산 중복 점검이다. 이번 P97이 상태 판단 helper라면, P98은 운송·통관 상단 summary count 계산이 같은 패턴으로 반복되는지 확인하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright role list check: 화주/포워더/관세사무소 목록 route 렌더링 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### service request status count helper

- 이전 작업은 P97 선정 이후 상태 판단 helper 공통화이고, 이번 작업은 P98 운송·통관 상단 summary count 계산 중복 점검이다.
- 운송/통관 `requestStatusCounts` 함수는 요청 status별 count와 opportunity count를 계산하는 구조가 완전히 동일했다.
- `countServiceRequestStatuses`를 `service-request-status.ts`에 추가하고 운송/통관 패널이 같은 helper를 사용하게 했다.
- 화면에 표시되는 `초안`, `공개중`, `견적 도착`, `선정 완료`, `진행중`, `입찰 가능` 라벨과 순서는 유지했다.
- repository query, 권한/RLS, DB schema는 변경하지 않았다.
- 다음 작업은 P99 label helper 공통화 가능성 점검이다. 이번 P98이 숫자 계산 helper라면, P99는 status/visibility/bid label 함수가 역할별 문구 차이를 보존하면서 공통화 가능한지 보는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester list check: 운송/통관 summary count 라벨 유지 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### shared service request document and bid labels

- 이전 작업은 P98 요청 상태 count 계산 helper 공통화이고, 이번 작업은 P99 marketplace label helper 공통화 가능성 점검이다.
- 운송/통관의 문서 유형 label과 입찰 상태 label/tone은 완전히 동일해 `service-request-status.ts`로 공통화했다.
- 포워더/관세사무소 명칭이 들어가는 공개 범위 label과 요청 status label은 사용자 문구 차이를 보존하기 위해 각 패널에 유지했다.
- 운송 상세 fixture에는 첨부 서류가 없어 문서명 자체는 확인하지 못했지만, 공개 범위 문구와 상세 route 렌더링은 확인했다.
- 통관 상세에서는 `Commercial Invoice`와 `매칭된 관세사무소에게 공개` 문구 유지를 확인했다.
- 권한/RLS, DB schema, 화면 표시 순서는 변경하지 않았다.
- 다음 작업은 P100 marketplace 리팩터링 경계 점검이다. 이번 P99가 label helper 공통화라면, P100은 리팩터링을 더 이어갈지 기능 작업으로 전환할지 판단하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester detail check: 운송/통관 상세 route 렌더링과 역할별 공개 범위 문구 유지 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### marketplace refactor boundary review

- 이전 작업은 P99 동일한 문서 유형·입찰 상태 label helper 공통화이고, 이번 작업은 P100 marketplace 패널 리팩터링 경계 점검이다.
- 운송/통관 패널은 여전히 각각 1,300줄대라 크지만, 남은 중복 함수는 역할별 문구, 입력 필드, 견적 비교 기준, 서류 공개 문구 차이가 크다.
- `visibilityLabel`, `statusLabel`, `nextActionLabel`, pre-select checklist, bid comparison guide는 공통화하면 포워더/관세사무소 문구 차이나 법적 안전 문구가 흐려질 위험이 있다.
- 현재 단계에서는 broad refactor를 멈추고 다음 기능 작업으로 전환하는 것이 더 안전하다.
- 다음 작업은 P101 marketplace 다음 기능 후보 선정이다. 이번 P100이 리팩터링 경계 판단이라면, P101은 플랫폼 MVP에서 다음으로 실제 기능을 보강할 영역을 고르는 작업이다.

검증:

- `wc -l features/service-requests/freight-request-draft-panel.tsx features/service-requests/clearance-request-draft-panel.tsx features/service-requests/service-request-status.ts`
- `rg "function .*Label|function .*Tone|function .*Progress|function .*LifecycleControls|function .*Question|function .*Bid|function .*NextSteps|function missing.*FieldLabels|function readFormValues" features/service-requests/freight-request-draft-panel.tsx features/service-requests/clearance-request-draft-panel.tsx -n`
- 코드 변경 없음: 경계 판단과 문서 기록만 수행

### requester match notification summary

- 이전 작업은 P100 marketplace 리팩터링 경계 판단이고, 이번 작업은 P101 플랫폼 MVP 다음 기능 후보 선정과 구현이다.
- 다음 기능 후보는 새 DB 없이 바로 효과가 나는 `화주 공개 후 가시성`으로 잡았다.
- `service_request_partner_matches`를 request별로 집계하는 `listServiceRequestMatchSummaries` read helper를 추가했다.
- 운송/통관 화주 요청 row에 `파트너 노출·알림 상태` 요약을 추가해 노출된 파트너 수, 알림 대기/발송/스킵/실패 수를 상시 표시한다.
- 공개 성공 직후 일회성 메시지에만 있던 matched count를 목록/상세 row에서도 계속 볼 수 있게 했다.
- 파트너 opportunity UI에는 표시하지 않고, 타입 상속을 위해 empty summary만 넣었다.
- DB schema, RLS, 알림 worker, 실제 발송 정책은 변경하지 않았다.
- 다음 작업은 P102 match summary 테스트 보강이다. 이번 P101이 화면과 read model 추가라면, P102는 집계 helper와 panel의 회귀 테스트를 추가하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright requester check: 운송/통관 화주 목록과 상세 route에서 `파트너 노출·알림 상태` 또는 상세 route 렌더링 확인
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### requester match summary test coverage

- 이전 작업은 P101 화주 요청 row의 파트너 노출·알림 상태 표시이고, 이번 작업은 P102 해당 read model과 panel의 회귀 테스트 보강이다.
- `listServiceRequestMatchSummaries`가 request별 매칭 수와 pending/sent/skipped/failed 알림 상태를 집계하는지 테스트했다.
- marketplace match schema가 없는 환경에서는 empty summary를 반환하는 fallback을 테스트했다.
- `ServiceRequestMatchSummaryPanel`이 draft 상태에서는 렌더링되지 않고, 공개 이후에는 노출/알림 count를 렌더링하는지 테스트했다.
- 코드 동작 변경 없이 테스트와 문서만 추가했다.
- 다음 작업은 P103 zero-match UX 점검이다. 이번 P102가 테스트 보강이라면, P103은 노출 0건일 때 화주가 관심조건 확장 또는 운영 점검 요청으로 이어질 수 있는지 보는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-match-summary.repository.test.ts features/service-requests/service-request-match-summary-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### requester match summary zero-match guidance

- 이전 작업은 P102 match summary read model과 panel의 회귀 테스트 보강이고, 이번 작업은 P103 노출 0건 상태의 요청자 UX 보강이다.
- `ServiceRequestMatchSummaryPanel`에 요청 종류(`freight`, `clearance`)를 전달해 노출 0건 안내를 운송/통관 맥락에 맞게 나눴다.
- 노출 0건이면 amber 경고 패널과 `운영 점검 필요` badge를 표시한다.
- 운송 요청은 출발·도착 국가, 운송 방식, 위험물·온도관리·중고차 조건을 점검 포인트로 안내한다.
- 통관 의뢰는 목적국, HS/FTA/요건 확인 범위, 긴급 여부를 점검 포인트로 안내한다.
- DB schema, RLS, 알림 worker, 실제 매칭 계산 로직은 변경하지 않았다.
- 다음 작업은 P104 zero-match operations handoff review다. 이번 P103이 화주에게 0건 상태를 설명하는 작업이라면, P104는 운영자가 그런 요청을 찾아 매칭 조건을 점검할 수 있는 흐름을 보는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-match-summary-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### zero-match operations handoff review

- 이전 작업은 P103 화주 화면에서 노출 0건 상태를 이해시키는 UX 보강이고, 이번 작업은 P104 운영자가 노출 0건 요청을 발견하고 점검할 수 있게 하는 운영 handoff다.
- `PlatformRequestOperationsSummary`에 `openWithoutMatches`를 추가했다.
- 매칭 테이블을 읽을 수 있을 때만 공개 요청의 파트너 노출 0건을 계산한다. 매칭 테이블이 없는 환경에서는 기존 `견적 없는 공개` 흐름을 유지해 0건으로 오판하지 않는다.
- 운영 우선순위 큐와 상세 진단 지표에 `노출 0건`을 추가했다.
- 운영 상세에 `파트너 노출·알림 운영 요약` 섹션을 추가해 노출 수, 알림 대기/발송/스킵/실패 수를 표시한다.
- 운영 상세의 복사용 개선 요청 문구도 `match_condition`으로 분리해 `견적 없음`과 `노출 0건`을 구분한다.
- 파트너 회사명, 연락처, 견적 원문은 운영 상세의 매칭 요약에 표시하지 않는다.
- DB schema, RLS, 알림 worker, 실제 매칭 계산 RPC는 변경하지 않았다.
- 다음 작업은 P105 marketplace match condition next review다. 이번 P104가 운영자가 0건 요청을 발견하는 흐름이라면, P105는 실제 매칭 조건 계산과 파트너 관심 조건 저장값 품질을 점검하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts features/operations/platform-request-operations-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`
- Playwright developer check: `/operations/users#platform-request-operations`에서 운영 패널 렌더링 확인
- Playwright developer check: 운영 상세에서 `파트너 노출·알림 운영 요약`과 민감정보 미노출 안내 확인

### marketplace match condition next review

- 이전 작업은 P104 운영자가 노출 0건 요청을 발견하는 화면이고, 이번 작업은 P105 실제 publish 매칭 조건이 그 0건 흐름과 맞는지 점검한 작업이다.
- 기존 `publish_freight_request`, `publish_clearance_request`는 매칭 0건이면 예외를 던져 요청 공개 자체를 막고 있었다.
- 이는 P103/P104의 `노출 0건` 안내와 운영 점검 큐가 도달할 수 없는 상태라서 방향이 맞지 않았다.
- 매칭 0건이어도 요청은 `open`으로 공개하고, `matched_count: 0`을 반환·감사 로그에 남기도록 migration 함수 조건을 수정했다.
- requester 화면은 공개 후 `노출 0곳`을 보여주고, operations 화면은 `openWithoutMatches`로 운영 점검 대상을 잡는다.
- `v_cargo_tags` 초기화는 `array[]::text[]`로 명시해 fresh migration 기준 타입 warning을 줄였다.
- 실제 파트너 매칭 조건 자체는 변경하지 않았다. 방향, 국가, 운송 방식, 항구, 화물 태그, 긴급 가능 여부 기준은 유지했다.
- 다음 작업은 P106 operations RPC lint blocker review다. 이번 P105가 0건 공개 허용으로 제품 흐름을 맞춘 작업이라면, P106은 Supabase local lint에서 드러난 운영 RPC 모호 컬럼 오류와 local DB 함수 갱신 상태를 정리하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-marketplace-governance.test.ts server/repositories/platform-operations.repository.test.ts features/operations/platform-request-operations-panel.test.ts features/service-requests/service-request-match-summary-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `npx supabase db lint --local`: 현재 local DB에 이미 적용된 예전 `publish_freight_request` warning과 기존 `update_company_marketplace_status`, `review_company_party_type_request` 모호 컬럼 오류가 남아 있어 P106으로 분리

### operations RPC lint blocker review

- 이전 작업은 P105 매칭 0건 공개 허용이고, 이번 작업은 P106 Supabase local lint에서 드러난 운영 RPC 품질 문제를 정리한 작업이다.
- `update_company_marketplace_status`에서 `RETURNS TABLE` 출력 컬럼과 `companies` 컬럼이 겹쳐 `verified_at`, `verified_by`, `suspended_at`, `blocked_at` 참조가 모호했다.
- `companies` update에 alias를 주고 `else company.verified_at`처럼 기존 컬럼 참조를 명확히 했다.
- `review_company_party_type_request`의 `on conflict (company_id, party_type)`가 PL/pgSQL에서 모호하게 잡혀, `company_party_types_company_id_party_type_key` constraint를 명시하고 `on conflict on constraint`를 사용하도록 바꿨다.
- P105에서 수정한 `publish_freight_request`의 `v_cargo_tags` 초기화도 local DB에 재적용했다.
- destructive reset 없이 수정한 함수 3개만 local Postgres에 재적용했다.
- 다음 작업은 P107 partner preference match diagnostics review다. 이번 P106이 DB 함수 lint 품질 정리라면, P107은 파트너 관심 조건 UI가 매칭 0건을 줄일 만큼 충분히 안내하는지 보는 작업이다.

검증:

- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `npx supabase db lint --local`: `No schema errors found`

### partner preference match diagnostics review

- 이전 작업은 P106 운영 RPC lint blocker 정리이고, 이번 작업은 P107 파트너 관심 조건 UI와 저장값 정규화가 매칭 0건을 줄일 수 있는지 보강한 작업이다.
- 파트너 관심 조건 schema에서 국가 코드는 ISO 2자리 대문자로 정규화하고, 잘못된 국가 필터는 저장 전에 막는다.
- 항구·공항·지역 값은 대문자로 정규화한다.
- 화물 태그는 소문자로 정규화한다.
- 파트너 관심 조건 화면에 `매칭 범위 진단 기준` 안내를 추가했다.
- 운송 조건은 국가, 운송 방식, 항구, 화물 태그가 모두 매칭 조건에 사용됨을 안내한다.
- 화물 태그 예시는 실제 요청 태그로 생성되는 `used_car`, `hazardous`, `temperature_controlled`만 노출하도록 바꿨다.
- 통관 조건은 긴급 건 대응 가능 여부가 긴급 통관 의뢰 매칭에 영향을 준다는 점을 안내한다.
- 다음 작업은 P108 marketplace zero-match end-to-end review다. 이번 P107이 파트너 관심 조건 저장 전 안내라면, P108은 화주 공개 후 0건 상태가 요청자·운영자 화면까지 이어지는지 E2E 관점으로 확인하는 작업이다.

검증:

- `npx vitest run features/partner-preferences/schemas.test.ts features/partner-preferences/partner-preferences-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`
- Playwright forwarder check: `/settings/members`에서 운송 매칭 진단 문구 확인
- Playwright broker check: `/settings/members`에서 통관 긴급 매칭 진단 문구 확인

### marketplace zero-match end-to-end review

- 이전 작업은 P107 파트너 관심 조건 저장 전 안내와 정규화이고, 이번 작업은 P108 화주 공개 후 노출 0건 상태가 요청자·운영자 화면까지 이어지는지 E2E fixture로 확인한 작업이다.
- marketplace transaction fixture에 `zeroMatch` 운송 요청 ID와 env export를 추가했다.
- seed runner가 `open` 상태이지만 `service_request_partner_matches`가 없는 zero-match 운송 요청을 local Supabase에 넣도록 확장했다.
- readiness runner가 `E2E_MARKETPLACE_ZERO_MATCH_FREIGHT_REQUEST_ID`도 확인한다.
- local runner가 zero-match env 값을 자동 주입한다.
- marketplace transaction E2E가 요청자 zero-match 상세에서 `파트너 노출·알림 상태`, `조건에 맞는 포워더 0곳`, `운영 점검 필요`를 확인한다.
- developer storage state가 있으면 운영 상세에서 `파트너 노출·알림 운영 요약`, `노출 0곳`, 매칭 조건 점검 안내도 확인한다.
- 기존 정상 거래 E2E와 mutation E2E는 그대로 유지했다.
- 다음 작업은 P109 marketplace post-E2E next bottleneck review다. 이번 P108이 zero-match E2E 검증이라면, P109는 거래 E2E 통과 후 남은 MVP 병목을 다시 고르는 작업이다.

검증:

- `node --check tests/fixtures/marketplace-transaction.fixture.mjs && node --check scripts/seed_marketplace_transaction_fixture.mjs && node --check scripts/e2e_marketplace_transaction_flow.mjs && node --check scripts/check_marketplace_transaction_e2e_readiness.mjs && node --check scripts/run_marketplace_transaction_e2e_local.mjs`
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- local-only env override로 `npm run e2e:marketplace-transaction:local`: seed, auth, readiness, static E2E, mutation E2E 모두 `result=ok`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`

### marketplace post-E2E next bottleneck review

- 이전 작업은 P108 화주 공개 후 노출 0건 상태가 요청자·운영자 화면까지 이어지는지 E2E fixture로 확인한 작업이고, 이번 작업은 P109 로컬 거래 E2E 통과 후 남은 MVP 병목을 다시 고르는 작업이다.
- `docs/ROADMAP.md` 상단 Rebased Phase Plan이 세부 실행 레일 완료 상태와 맞지 않아 실제 상태로 갱신했다.
- Platform Phase 0, 1, 2, 3, 5는 완료로, Phase 4는 로컬 완료로, Phase 6은 진행으로 재정리했다.
- local marketplace transaction E2E가 요청 생성, 공개, 입찰, 선정, zero-match 확인까지 통과했으므로 다음 병목은 `완료 리포트 실무화`로 정했다.
- P110은 완료 거래에서 실제 신고/운송 결과, 최종 금액, 최종 보관 서류, 담당자 메모를 어디까지 받을지 범위를 정하는 작업으로 잡았다.
- 이 작업은 새 E2E를 추가하는 P108과 다르다. P109는 검증이 끝난 거래 흐름 다음에 어떤 실무 공백을 먼저 막을지 제품/데이터 관점에서 기준선을 다시 잡는 작업이다.
- production 알림 provider 연결, 해외 파트너 온보딩 정교화, 운영 화면 최종 단순화는 후순위 후보로 남겼다.
- 다음 작업은 P110 completion report practicalization scope review다. 이번 P109가 다음 병목 선정이라면, P110은 실제 완료 리포트 모델과 UI 범위를 코드/데이터 기준으로 점검하는 작업이다.

검증:

- `rg -n "Platform Phase 0|P109.1|P110.1|완료 리포트 실무화|completion report practicalization" docs/ROADMAP.md docs/WORK_LOG.md`
- `git diff --check`

### completion report practicalization scope review

- 이전 작업은 P109 로컬 거래 E2E 통과 후 다음 병목을 완료 리포트 실무화로 정한 작업이고, 이번 작업은 P110 완료 리포트의 실제 입력 범위와 코드 적용 지점을 점검하고 보강한 작업이다.
- 완료 리포트는 새로 만들 대상이 아니라 기존 DB/RPC/RLS/repository/UI/preview가 이미 운송 결과, 통관 결과, 정산 항목, 보관 서류, 출처 snapshot을 받을 수 있는 상태였다.
- 실제 공백은 저장 모델이 아니라 초안 작성 화면이었다. 기존 화면은 통화, 최종 금액, 완료 요약만 입력할 수 있어 `settlement_items`, `freight_result`, `clearance_result`가 실무적으로 비어 있었다.
- `saveServiceRequestCompletionReportAction`이 flat form field를 받아 `settlementItems`, `freightResult`, `clearanceResult` JSON payload로 조립하게 했다.
- 완료 리포트 패널에 공통 정산 항목 입력을 추가했다.
- 운송 완료 리포트에는 선사/운송사, B/L 또는 AWB, 출발일, 도착일, 출발항, 도착항, 특이사항 입력을 추가했다.
- 통관 완료 리포트에는 신고번호, 신고 결과 HSK, 원산지, FTA, 신고일, 수리일, 세액 요약, 주의사항 입력을 추가했다.
- 기존 보관 서류 연결, 제출, 확인, 운영 검토, 잠금 흐름은 유지했다.
- 이번 P110은 P109처럼 다음 병목을 고르는 문서 작업이 아니다. 실제 완료 리포트 화면에서 실무 필드를 입력할 수 있게 한 UI/action 보강이다.
- 다음 작업은 P111 completion report mutation E2E coverage다. 이번 P110이 실무 입력 필드 노출이라면, P111은 입력값 저장 후 preview 반영까지 자동 검증하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts features/service-requests/service-request-completion-report-preview.test.ts features/service-requests/service-request-completion-report-workflow.test.ts server/repositories/service-request-completion-report.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run review:local-routes`: shipper, forwarder, customs_broker 주요 route `result=ready`
- local-only env override로 `npm run e2e:completion-preview:local`: seed, auth, preview E2E `result=ok`
- Playwright requester detail check: 운송/통관 완료 리포트 수정 폼에서 정산 항목, 운송 결과, 통관 결과 입력 영역 표시 확인

### completion report mutation E2E coverage

- 이전 작업은 P110 완료 리포트 실무 입력 필드 노출이고, 이번 작업은 P111 입력한 완료 리포트 값이 저장 후 preview에 반영되는지 자동 검증하는 작업이다.
- completion preview fixture에 별도 draft 운송 완료 리포트 요청, 선정 견적, 요청 서류, 완료 리포트, 보관 서류 매핑을 추가했다.
- 기존 locked 운송 preview와 operator reviewed 통관 preview fixture는 유지했다.
- completion preview E2E가 요청자 계정으로 draft 운송 완료 리포트 상세에 진입해 정산 항목, 운송사, B/L 또는 AWB, 출발일, 도착일, 출발항, 도착항, 특이사항을 입력한다.
- 저장 성공 메시지를 확인한 뒤 preview 페이지로 이동해 입력값이 실제 보관 리포트 미리보기에 반영되는지 확인한다.
- 비로그인 redirect, 요청자/선정 파트너/운영자 preview 접근, 미선정 파트너 차단, route/request type mismatch 차단 검증은 유지했다.
- 이번 P111은 P110처럼 입력 필드를 만드는 작업이 아니다. 실제 저장 mutation과 preview 반영을 local E2E로 고정한 작업이다.
- 다음 작업은 P112 completion report non-draft edit guard UX다. 이번 P111이 저장값 반영 자동검증이라면, P112는 제출·운영검토·잠금 리포트에서 수정 폼이 열려 저장 실패로 이어지는 UX/권한 불일치를 정리하는 작업이다.

검증:

- `node --check scripts/seed_completion_report_preview_fixture.mjs && node --check scripts/e2e_completion_report_preview_flow.mjs && node --check tests/fixtures/completion-report-preview.fixture.mjs`
- `npx vitest run tests/fixtures/completion-report-preview.fixture.test.ts`
- `npm run typecheck`
- `npm run lint`
- local-only env override로 `npm run e2e:completion-preview:local`: seed, auth, preview 접근 권한, draft 저장 mutation, preview 반영 모두 `result=ok`

### completion report non-draft edit guard UX

- 이전 작업은 P111 완료 리포트 저장값이 preview에 반영되는지 자동 검증한 작업이고, 이번 작업은 P112 draft가 아닌 완료 리포트의 수정 UI와 실제 RPC 권한을 맞춘 작업이다.
- 기존 DB/RPC는 `draft`가 아닌 리포트 저장을 막고 있었지만, 화면은 locked/operator reviewed 상태에서도 `완료 리포트 초안 수정` 폼을 열 수 있었다.
- `currentStatus`가 없거나 `draft`일 때만 완료 리포트 초안 작성/수정 폼을 표시하도록 했다.
- `submitted`, `requester_acknowledged`, `partner_acknowledged`, `operator_reviewed`, `locked` 상태에서는 `완료 리포트 수정 잠금` 안내를 표시한다.
- 보관 서류 연결, 상태 전환, preview 링크, 안전 문구는 유지했다.
- 이번 P112는 P111처럼 저장 mutation을 늘리는 작업이 아니다. 사용자가 저장할 수 없는 상태에서 폼을 보고 실패하는 UX/권한 불일치를 줄이는 작업이다.
- 다음 작업은 P113 notification provider readiness review다. 이번 P112가 완료 리포트 UX/권한 정리라면, P113은 완료 리포트 축을 잠시 닫고 실제 알림 provider 운영 연결 전 준비 상태를 점검하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-workflow.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright requester detail check: locked 운송/운영검토 통관은 수정 잠금 안내 표시, draft 운송은 수정 폼 표시 확인
- local-only env override로 `npm run e2e:completion-preview:local`: preview 접근 권한, draft 저장 mutation, preview 반영 모두 `result=ok`

### notification provider readiness review

- 이전 작업은 P112 완료 리포트 non-draft 수정 잠금 UX이고, 이번 작업은 P113 실제 marketplace 알림 provider 운영 연결 전에 현재 준비 상태와 다음 병목을 다시 점검한 작업이다.
- marketplace notification worker, claim RPC, delivery 저장소, 실패 기록, retryable failed, inbox, read action은 이미 있다.
- provider allowlist는 현재 `internal_dry_run`만 허용한다.
- `send=1`은 `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED`와 `MARKETPLACE_NOTIFICATIONS_PROVIDER`가 준비되지 않으면 route에서 차단된다.
- unsupported provider는 readiness에서 `MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported.`로 차단된다.
- Resend 기반 `sendTransactionalEmail`, `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` env는 운영 이슈 알림과 적하목록 알림에서 이미 쓰는 경로가 있다.
- 실제 병목은 email provider 함수 자체가 아니라 marketplace target의 `partnerCompanyId`에서 어느 사용자 이메일로 보낼지 안전하게 고르는 recipient resolver다.
- 이번 P113은 완료 리포트 후속 작업이 아니다. 알림 provider 운영 연결 전 recipient/metadata/실패 경계를 다시 고르는 작업이다.
- 다음 작업은 P114 marketplace notification recipient resolver다. 이번 P113이 다음 병목 선정이라면, P114는 파트너 회사의 active 사용자 중 알림 수신 후보를 고르는 read helper와 단위 테스트를 만드는 작업이다.

검증:

- `server/jobs/marketplace-notification-provider.ts` 코드 리뷰
- `server/jobs/marketplace-notification-send-readiness.ts` 코드 리뷰
- `server/jobs/marketplace-notification-worker.service.ts` 코드 리뷰
- `app/api/jobs/marketplace-notifications/route.ts` 코드 리뷰
- `docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md`와 `docs/MARKETPLACE_NOTIFICATION_SELF_REVIEW.md` 문서 리뷰
- `rg -n "sendTransactionalEmail|RESEND_API_KEY|NOTIFICATION_FROM_EMAIL|MARKETPLACE_NOTIFICATIONS_PROVIDER|internal_dry_run" server docs app`

### marketplace notification recipient resolver

- 이전 작업은 P113 marketplace 알림 provider 운영 연결 전 준비 상태 점검이고, 이번 작업은 P114 파트너 회사의 알림 수신 대상 사용자를 안전하게 고르는 read helper를 만든 작업이다.
- `server/jobs/marketplace-notification-recipients.ts`를 추가했다.
- recipient 후보는 `profiles`에서 partner company ID가 일치하고, `role = client`, `onboarding_completed_at is not null`, email 존재 조건을 만족하는 사용자만 조회한다.
- 코드 필터에서도 회사 ID, client role, onboarding 완료, 이메일 형식을 다시 확인한다.
- 회사 관리자(`company_role = admin`)를 우선 정렬하고, member는 그 다음으로 둔다.
- developer, 다른 회사 사용자, onboarding 미완료 사용자, 형식이 깨진 이메일은 제외하는 테스트를 추가했다.
- helper는 email을 반환하지만 delivery metadata에는 저장하지 않는다.
- 이번 P114는 P113처럼 준비 상태를 고르는 문서 작업이 아니다. 실제 provider 연결 전에 받을 사람 후보를 안전하게 읽는 코드 경계다.
- 다음 작업은 P115 marketplace transactional email provider skeleton이다. 이번 P114가 받을 사람을 고르는 read helper라면, P115는 이 helper를 사용해 Resend 기반 transactional email sender skeleton을 marketplace notification worker에 연결하는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-recipients.test.ts server/jobs/marketplace-notification-provider.test.ts server/jobs/marketplace-notification-send-readiness.test.ts`
- `npm run typecheck`
- `npm run lint`

### marketplace transactional email provider skeleton

- 이전 작업은 P114 파트너 회사 알림 수신자 resolver이고, 이번 작업은 P115 그 resolver를 사용해 marketplace notification `transactional_email` provider skeleton을 연결한 작업이다.
- provider allowlist에 `transactional_email`을 추가했다.
- `transactional_email` provider는 Supabase client가 주입된 경우에만 sender를 만든다.
- sender는 P114 recipient resolver로 partner company의 onboarding 완료 client profile 중 관리자 우선 수신자 1명을 찾는다.
- 수신자가 없으면 `recipient_missing` 오류를 던지고, delivery 실패 정규화는 `provider_recipient_missing`으로 저장되게 했다.
- `sendTransactionalEmail`을 사용해 Resend 기반 transactional email을 보낸다.
- 메일 본문은 요청 유형, 알림 유형, 알림 사유, 대시보드 확인 안내만 담고 요청 ID, 서류명, 질문/답변 원문, 견적 금액, 개인정보는 넣지 않는다.
- `transactional_email` readiness는 `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`까지 요구한다.
- worker route는 service-role Supabase client를 provider와 worker에 함께 전달한다.
- `MARKETPLACE_NOTIFICATION_RUNBOOK.md`의 지원 provider와 env 설명을 `transactional_email` 기준으로 갱신했다.
- 이번 P115는 P114처럼 받을 사람을 고르는 read helper가 아니다. 실제 sender provider skeleton을 route/worker 경계에 연결하는 작업이다.
- 다음 작업은 P116 marketplace transactional email provider self-review다. 이번 P115가 provider skeleton 구현이라면, P116은 실제 운영 전 민감정보, recipient missing, readiness, runbook 차단 조건을 다시 검증하는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-provider.test.ts server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-recipients.test.ts server/jobs/marketplace-notification-worker.service.test.ts server/repositories/marketplace-notification-deliveries.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- local-only env override로 `npm run ops:marketplace-notifications:rehearse-local`: dry-run, send 차단, claim-only `result=ok`

### marketplace transactional email provider self-review

- 이전 작업은 P115 marketplace `transactional_email` provider skeleton 구현이고, 이번 작업은 P116 실제 운영 전 민감정보, recipient missing, readiness, runbook 차단 조건을 자체 리뷰한 작업이다.
- `MARKETPLACE_NOTIFICATION_EMAIL_PROVIDER_SELF_REVIEW.md`를 추가했다.
- 수신자 없음은 provider 호출 전 `recipient_missing`으로 중단되고 delivery 실패 정규화는 `provider_recipient_missing`으로 저장되는 것을 확인했다.
- readiness가 send flag, provider, Resend key, 발신자 env를 모두 요구하는 것을 확인했다.
- 메일 본문은 요청 유형, 알림 유형, 알림 사유, 대시보드 확인 안내만 포함한다.
- 요청 ID, 서류명, 질문/답변 원문, 견적 금액, invoice text, 사업자번호, 전화번호, API key를 메일 본문이나 delivery metadata에 넣지 않는 기준을 문서화했다.
- local rehearsal에서 dry-run, send 차단, claim-only 동작이 유지되는 것을 P115 검증 결과로 확인했다.
- 남은 위험은 production email send rehearsal 미실행, 다중 수신자 fanout 미구현, 사용자별 알림 수신 설정/거부 정책 미구현, branded email template 미구현이다.
- 이번 P116은 P115처럼 provider 코드를 추가한 작업이 아니다. 운영 전 안전 기준과 남은 위험을 문서로 고정한 자체 리뷰다.
- 다음 작업은 P117 marketplace notification preference and unsubscribe planning이다. 이번 P116이 provider 안전 리뷰라면, P117은 실제 운영 전 파트너 사용자별 알림 수신 설정과 거부 기준을 어떻게 둘지 정하는 작업이다.

검증:

- `rg -n "requestId|request_id|fileName|file_name|question|answer|amount|total_amount|invoice|personal|phone|business_no|email" server/jobs/marketplace-notification-provider.ts server/jobs/marketplace-notification-recipients.ts server/jobs/marketplace-notification-provider.test.ts docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md`
- `rg -n "transactional_email|provider_recipient_missing|RESEND_API_KEY|NOTIFICATION_FROM_EMAIL|recipient_missing|claimedWithoutSenderCount|sendReadiness" server/jobs server/repositories docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md app/api/jobs/marketplace-notifications/route.ts`
- `git diff --check`

### marketplace notification preference and unsubscribe planning

- 이전 작업은 P116 marketplace `transactional_email` provider 안전 리뷰이고, 이번 작업은 P117 실제 운영 전 파트너 사용자별 알림 수신 설정과 거부 기준을 정한 작업이다.
- `MARKETPLACE_NOTIFICATION_PREFERENCES_PLAN.md`를 추가했다.
- marketplace opportunity email은 사용자별 opt-in으로 운영하기로 결정했다.
- 인앱 알림은 파트너 회사 매칭의 기본 운영 표면으로 유지하고, 외부 email은 명시적으로 동의한 사용자에게만 보낸다.
- preference row가 없으면 email 수신 거부로 본다.
- `partner_preferences.notification_enabled`는 회사 단위 매칭/노출 preference이며 사용자 email 동의로 쓰지 않는 기준을 문서화했다.
- MVP에서는 공개 unsubscribe 링크를 만들지 않고, 로그인한 설정 화면에서 수신 설정을 바꾸게 한다.
- 공개 unsubscribe token, audit event, abuse handling, 다중 수신자 fanout, digest, branded template은 후속 작업으로 미뤘다.
- 이번 P117은 P116처럼 provider 코드와 readiness를 점검한 작업이 아니다. 실제 email 운영 전에 “누구에게 보내도 되는가”를 정한 제품/보안 정책 작업이다.
- 다음 작업은 P118 marketplace email notification preference schema다. 이번 P117이 수신 설정 정책을 고정한 문서 작업이라면, P118은 실제 migration/RLS/repository/resolver gate를 추가해 `transactional_email` 수신자가 명시적 opt-in 사용자로 제한되게 만드는 작업이다.

검증:

- `rg -n "P117.1|P118.1|email opt-in|notification preference|수신 설정|수신 거부|unsubscribe|partner_preferences.notification_enabled|MARKETPLACE_NOTIFICATION_PREFERENCES_PLAN" docs/ROADMAP.md docs/WORK_LOG.md docs/MARKETPLACE_NOTIFICATION_PREFERENCES_PLAN.md`
- `git diff --check`

### marketplace email notification preference schema

- 이전 작업은 P117 사용자별 수신 설정과 거부 기준을 정한 문서 작업이고, 이번 작업은 P118 실제 schema/RLS/resolver gate를 추가한 코드 작업이다.
- `marketplace_notification_preferences` migration을 추가했다.
- channel은 `email`, notification kind는 `initial`, `deadline_reminder`로 제한했다.
- `enabled` 기본값은 `false`로 두어 preference row가 없으면 email 미동의로 처리한다.
- RLS는 사용자가 자기 preference row만 읽고 쓰게 하고, staff read와 service-role job access를 분리했다.
- `partner_preferences.notification_enabled`는 회사 단위 매칭/노출 preference로 유지하고, 사용자 email 동의와 섞지 않았다.
- `transactional_email` provider가 notification kind별 email opt-in을 요구하도록 recipient resolver 호출을 바꿨다.
- resolver는 profiles 후보를 먼저 넉넉히 조회한 뒤 preference enabled row로 필터링하고 최종 limit을 적용한다.
- PostgreSQL policy 이름 63바이트 truncation notice를 발견해 짧은 policy 이름과 drop guard로 정리했다.
- 이번 P118은 P117처럼 정책 문서화가 아니다. 실제 production email skeleton에서 수신자가 명시적 opt-in 사용자로 제한되도록 강제한 작업이다.
- 다음 작업은 P119 marketplace email notification settings UI다. 이번 P118이 DB/RLS/resolver gate라면, P119는 사용자가 로그인 상태에서 실제로 `initial`, `deadline_reminder` email 수신 설정을 켜고 끄는 서버 액션과 설정 화면을 붙이는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-recipients.test.ts server/jobs/marketplace-notification-provider.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/migrations/20260603001000_marketplace_notification_preferences.sql`
- `supabase db lint --local`

### marketplace email notification settings UI

- 이전 작업은 P118 email opt-in schema/RLS/resolver gate이고, 이번 작업은 P119 사용자가 로그인 상태에서 실제 email 수신 설정을 켜고 끄는 UI/서버 액션 작업이다.
- `marketplace-notification-preferences.repository`를 추가해 로그인 사용자의 `initial`, `deadline_reminder` email preference를 조회·저장한다.
- preference row가 없으면 email 미수신으로 표시한다.
- `updateMarketplaceEmailNotificationPreferencesAction`을 추가해 로그인 사용자가 자기 preference row만 upsert한다.
- `/settings/members`에 `내 이메일 알림 수신 설정` 카드를 추가했다.
- 새 카드는 `파트너 관심 조건`과 분리되어 회사 단위 매칭 preference와 사용자 email opt-in을 혼동하지 않게 했다.
- 화면에 인앱 알림은 계속 표시되고, email은 직접 켠 항목만 발송된다는 문구를 넣었다.
- 포워더 테스트 계정 storage state로 `/settings/members`를 브라우저 확인했고, `이메일 수신 설정 저장` 후 성공 문구가 표시되는 것을 확인했다.
- 이번 P119는 P118처럼 schema와 resolver gate를 만든 작업이 아니다. 실제 사용자가 opt-in 상태를 바꿀 수 있게 만든 설정 UI 작업이다.
- 다음 작업은 P120 marketplace email opt-in rehearsal이다. 이번 P119가 설정 UI라면, P120은 실제 notification worker/provider rehearsal에서 opt-in row가 수신자 선택을 제어하는지 운영 실행 관점으로 확인하는 작업이다.

검증:

- `npx vitest run server/repositories/marketplace-notification-preferences.repository.test.ts server/actions/marketplace-notification-preferences.actions.test.ts features/marketplace-notification-preferences/marketplace-email-notification-preferences-panel.test.ts server/jobs/marketplace-notification-recipients.test.ts server/jobs/marketplace-notification-provider.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright forwarder check: `/settings/members`, email preference card render and save success

### marketplace email opt-in rehearsal

- 이전 작업은 P119 사용자가 email 수신 설정을 켜고 끄는 UI/서버 액션이고, 이번 작업은 P120 실제 운영 rehearsal에서 opt-in preference가 수신자 선택을 제어하는지 확인하는 작업이다.
- `rehearse_marketplace_email_opt_in_local.mjs`를 추가했다.
- `ops:marketplace-notifications:email-opt-in-local` npm script를 추가했다.
- 스크립트는 로컬 Supabase와 로컬 Next.js origin만 허용한다.
- fixture 상수 id가 아니라 실제 로컬 profile id를 email로 조회해 preference row를 정리·seed한다.
- seed 전에는 forwarder initial 수신자가 없어야 함을 확인한다.
- seed 후에는 forwarder `initial` opt-in, broker `deadline_reminder` opt-in만 수신자 후보가 되는지 확인한다.
- `send=1` route는 production send readiness가 꺼진 상태에서 계속 400으로 차단되는지 확인한다.
- 기존 `ops:marketplace-notifications:rehearse-local`도 dry-run, blocked send, claim-only 흐름이 유지되는지 재확인했다.
- runbook의 `transactional_email` 설명을 사용자별 email opt-in 기준으로 갱신했다.
- 이번 P120은 P119처럼 설정 UI를 만든 작업이 아니다. 실제 운영 rehearsal에서 opt-in row가 수신자 선택에 반영되는지 확인한 작업이다.
- 다음 작업은 P121 marketplace notification fanout decision이다. 이번 P120이 opt-in 수신자 선택 검증이라면, P121은 한 회사에 opt-in 사용자가 여러 명일 때 1명 관리자 우선으로 보낼지 다중 수신자 fanout으로 보낼지 결정하는 작업이다.

검증:

- `node --check scripts/rehearse_marketplace_email_opt_in_local.mjs`
- `npm run ops:marketplace-notifications:email-opt-in-local`
- `npm run ops:marketplace-notifications:rehearse-local`

### marketplace notification fanout decision

- 이전 작업은 P120 email opt-in row가 실제 rehearsal에서 수신자 선택을 제어하는지 확인한 작업이고, 이번 작업은 P121 한 회사의 여러 opt-in 사용자에게 외부 이메일을 모두 보낼지 결정한 정책 작업이다.
- MVP에서는 외부 이메일 다중 fanout을 열지 않기로 결정했다.
- `transactional_email` provider는 opt-in 사용자 중 관리자 우선 1명 수신자 구조를 유지한다.
- 현재 delivery 상태는 회사 단위라 사용자별 email delivery/read 상태를 추적하지 않는다.
- 여러 사용자가 같은 요청 이메일을 받으면 중복 견적 확인, 중복 질문, 내부 담당 혼선이 생길 수 있다고 판단했다.
- 공개 unsubscribe, audit, abuse handling이 아직 없으므로 수신자 수를 늘리지 않는다.
- 팀 전체 공유 표면은 외부 email이 아니라 대시보드 인앱 알림으로 유지한다.
- `MARKETPLACE_NOTIFICATION_PREFERENCES_PLAN.md`에 fanout 보류 기준과 재검토 조건을 추가했다.
- 이번 P121은 P120처럼 로컬 rehearsal을 추가한 작업이 아니다. 실제 발송 범위를 1명으로 유지할지 다중 수신자로 넓힐지 결정한 제품/보안 정책 작업이다.
- 다음 작업은 P122 marketplace production email rehearsal gate다. 이번 P121이 fanout 정책 결정이라면, P122는 실제 Resend provider를 통제된 테스트 수신함으로 리허설할 수 있는 운영/보안 조건을 정하는 작업이다.

검증:

- `rg -n "Fanout Decision|P121.1|P122.1|single-recipient|다중 fanout|관리자 우선 1명" docs/MARKETPLACE_NOTIFICATION_PREFERENCES_PLAN.md docs/ROADMAP.md docs/WORK_LOG.md`
- `git diff --check`

### marketplace production email rehearsal gate

- 이전 작업은 P121 다중 수신자 fanout을 열지 않기로 한 정책 결정이고, 이번 작업은 P122 실제 `transactional_email` provider 리허설을 어떤 조건에서 허용할지 정한 운영/보안 gate 작업이다.
- `MARKETPLACE_PRODUCTION_EMAIL_REHEARSAL_GATE.md`를 추가했다.
- 현재 결정은 실제 provider 리허설 보류다.
- 발신 도메인 인증, 인증된 `NOTIFICATION_FROM_EMAIL`, secret 비노출, rehearsal window send flag, 통제된 테스트 수신함, synthetic 요청, worker secret, 발송 후 send flag 비활성화를 필수 gate로 정했다.
- 실제 고객 수신자, 미인증 발신 도메인, real invoice/document/customer data, 공개 unsubscribe 미설계 상태에서는 provider rehearsal을 금지했다.
- runbook에서 실제 provider 리허설은 gate 문서의 모든 조건이 충족될 때까지 실행하지 않는다고 명시했다.
- 이번 P122는 P121처럼 fanout 범위를 정한 작업이 아니다. 실제 외부 provider 발송 리허설의 운영 허용 조건을 정한 작업이다.
- 다음 작업은 P123 marketplace email provider final readiness review다. 이번 P122가 production rehearsal gate라면, P123은 P113-P122 email provider 준비 작업 전체를 다시 훑고 남은 병목을 정리하는 작업이다.

검증:

- `rg -n "MARKETPLACE_PRODUCTION_EMAIL_REHEARSAL_GATE|P122.1|P123.1|production email rehearsal|실제 provider 리허설|MARKETPLACE_NOTIFICATIONS_SEND_ENABLED" docs/MARKETPLACE_PRODUCTION_EMAIL_REHEARSAL_GATE.md docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md docs/ROADMAP.md docs/WORK_LOG.md`
- `git diff --check`

### marketplace email provider final readiness review

- 이전 작업은 P122 실제 `transactional_email` provider 리허설 gate를 정한 작업이고, 이번 작업은 P123 P113-P122 email provider 준비 상태 전체를 최종 리뷰한 작업이다.
- `MARKETPLACE_EMAIL_PROVIDER_FINAL_READINESS_REVIEW.md`를 추가했다.
- provider readiness, recipient resolver, `transactional_email` skeleton, readiness guard가 준비된 상태라고 정리했다.
- 사용자별 email opt-in schema/RLS/repository/action/UI가 준비된 상태라고 정리했다.
- resolver가 notification kind별 opt-in을 요구하고, local opt-in rehearsal과 기존 worker rehearsal이 통과한 것을 정리했다.
- MVP에서는 다중 fanout을 보류하고 관리자 우선 1명 발송을 유지한다고 정리했다.
- 실제 provider rehearsal은 gate 조건이 충족될 때까지 보류한다고 정리했다.
- 남은 위험은 sender-domain production rehearsal 미실행, 공개 unsubscribe 미구현, per-user email delivery 미구현, branded template 미구현, provider failure/notification fatigue telemetry 부족으로 정리했다.
- 이번 P123은 P122처럼 실제 provider 리허설 조건을 정한 작업이 아니다. email provider 준비 흐름을 닫고 다음 병목을 다시 선택한 리뷰 작업이다.
- 다음 작업은 P124 marketplace no-response notification operations selection이다. 이번 P123이 email provider 준비 상태를 닫는 리뷰라면, P124는 알림 이후에도 응답 없는 파트너를 운영자가 어떻게 발견하고 조치할지 다음 병목을 정하는 작업이다.

검증:

- `rg -n "P123.1|P124.1|MARKETPLACE_EMAIL_PROVIDER_FINAL_READINESS_REVIEW|Remaining Risks|no-response" docs/MARKETPLACE_EMAIL_PROVIDER_FINAL_READINESS_REVIEW.md docs/ROADMAP.md docs/WORK_LOG.md`
- `git diff --check`

### marketplace no-response notification operations metric

- 이전 작업은 P123 email provider 준비 상태를 닫는 최종 리뷰이고, 이번 작업은 P124 알림 후에도 응답 없는 파트너를 운영자가 발견할 수 있게 운영 요약 지표를 추가한 작업이다.
- `PlatformRequestOperationsSummary`에 `notifiedWithoutBids`를 추가했다.
- open 상태, active bid 없음, match summary의 `sentNotificationCount > 0`인 요청을 알림 후 무응답으로 계산한다.
- 파트너 노출이 0건인 요청은 계속 `노출 0건`으로 먼저 분리한다.
- 운영 우선순위 큐에 `알림 후 무응답` 항목을 추가했다.
- 복사용 운영 개선 요청문에 `알림 후 무응답` 핵심 지표를 추가했다.
- 상세 진단 지표에 `알림 전달 후에도 견적이 없는 공개 요청`을 추가했다.
- 운영 화면 details를 펼쳐 `/operations/users#platform-request-operations`에서 새 지표가 렌더링되는지 브라우저로 확인했다.
- 이번 P124는 P123처럼 email provider 준비 상태를 리뷰한 작업이 아니다. 알림 이후 실제 파트너 응답이 없는 운영 병목을 화면 지표로 분리한 코드 작업이다.
- 다음 작업은 P125 marketplace no-response operations detail handoff다. 이번 P124가 운영 요약 지표라면, P125는 무응답 샘플 상세 페이지에서 운영자가 어떤 확인 위치와 개선 요청문을 보게 할지 연결하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts features/operations/platform-request-operations-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/users#platform-request-operations`, details 펼침 후 `알림 후 무응답` 렌더 확인

### marketplace no-response operations detail handoff

- 이전 작업은 P124 운영 요약 패널에 `알림 후 무응답` 지표를 추가한 작업이고, 이번 작업은 P125 개별 요청 상세 화면에서 같은 병목을 운영 개선 프롬프트와 확인 위치로 연결한 작업이다.
- `PlatformRequestOperationsImprovementPrompt`에 `notification_no_response` category를 추가했다.
- open 상태, active bid 없음, `sentNotificationCount > 0`인 요청은 `알림 후 파트너 무응답 개선` 프롬프트를 표시한다.
- zero-match 요청은 계속 `파트너 노출 0건 매칭 조건 개선` 프롬프트가 먼저 나오도록 순서를 유지했다.
- 프롬프트에는 알림 발송/대기/실패 수만 포함하고, 요청 제목·품목 설명·서류 파일명·견적 원문은 포함하지 않는다.
- 상세 화면의 `notification_no_response` 바로가기는 `#request-matches`의 `파트너 노출 상태 확인`으로 연결했다.
- 브라우저 검증에서는 공개/무입찰 샘플 요청에 sent 매칭 row를 임시로 추가해 프롬프트 렌더를 확인한 뒤 즉시 삭제했다.
- reviewer agent는 현재 thread agent limit 때문에 새로 생성하지 못해, 이번 단계는 직접 코드 리뷰와 자동 검증으로 대체했다.
- 다음 작업은 P126 marketplace partner opportunity response clue다. 이번 P125가 운영자 상세 화면의 개선 프롬프트 연결이라면, P126은 파트너 opportunity 화면에서 응답 판단 단서를 보강하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`

### marketplace bid revision policy boundary

- 이전 작업은 운영 개선 프롬프트에 견적 수정·철회 MVP 정책을 포함한 P145.1이고, 이번 작업은 나중에 기능을 열 때 필요한 RPC/RLS/audit 경계를 문서화한 P146.1이다.
- `docs/MARKETPLACE_BID_REVISION_POLICY.md`를 추가했다.
- 현재 MVP에서는 파트너 직접 견적 수정·철회 기능을 열지 않고, 중복 제출 차단과 제출 상태 표시, 운영 확인 필요 문구까지만 둔다는 결정을 명시했다.
- 기존 안전장치로 active bid unique index, `submit_freight_bid`, `submit_clearance_bid` 중복 제출 차단, 직접 table write 미제공을 정리했다.
- 나중에 수정 기능을 열 때 필요한 상태 조건, audit log, 화주 알림, 최근 수정일 표시 기준을 적었다.
- 나중에 철회 기능을 열 때 필요한 상태 조건, 철회 사유, 화주·운영 표시 기준을 적었다.
- 직접 `service_bids` update/delete 정책을 열지 않는 금지 사항을 명시했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `rg -n "withdraw|철회|수정|service_bids|견적 수정|견적 철회" docs supabase/migrations server/repositories`
- `git diff -- docs/MARKETPLACE_BID_REVISION_POLICY.md docs/ROADMAP.md docs/WORK_LOG.md`

### selected transaction start CTA clarity

- 이전 작업은 견적 수정·철회 기능을 나중에 열 때 필요한 정책 경계를 문서화한 P146.1이고, 이번 작업은 업체 선정 후 실제 진행 시작 CTA의 확인 문구를 보강한 P147.1이다.
- 운송 요청의 `partner_selected` 상태에서 진행 시작 버튼 주변에 선적 일정, 비용 포함 범위, 선정 파트너 전용 서류 공개 범위 확인 문구를 추가했다.
- 운송 파트너 화면에는 화주와 선적 가능 일정, 비용 포함 범위, 필요 서류 전달 방식을 확인한 뒤 진행 시작하도록 표시했다.
- 통관 요청의 `partner_selected` 상태에서도 신고 일정, 필요서류, HS/FTA/요건 검토 범위를 확인한 뒤 진행 시작하도록 표시했다.
- 진행 시작 RPC와 상태 전이는 변경하지 않았다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 로컬 fixture `75000000-0000-4000-8000-000000000101`, `75000000-0000-4000-8000-000000000102`를 임시로 `partner_selected`로 변경
- Playwright 화주 계정으로 운송·통관 상세의 `선정 후 진행 시작 확인` 문구 확인
- Playwright 포워더 계정으로 운송 opportunity의 선정 후 확인 문구 확인
- Playwright 관세사무소 계정으로 통관 opportunity의 선정 후 확인 문구 확인
- 검증 후 두 fixture 상태를 원래 `open`으로 원복 확인

### in-progress completion CTA clarity

- 이전 작업은 업체 선정 후 진행 시작 CTA를 보강한 P147.1이고, 이번 작업은 진행 중 요청을 완료 처리하기 전 확인 문구를 보강한 P148.1이다.
- 운송 `in_progress` 상태의 완료 처리 form에 운송 완료 여부, 최종 보관 서류, 정산 요약에 남길 민감정보 제외 메모를 확인하라는 문구를 추가했다.
- 통관 `in_progress` 상태의 완료 처리 form에는 신고 완료 여부, 최종 보관 서류, HS/FTA/요건 검토 결과를 민감정보 없이 요약할 준비가 되었는지 확인하라는 문구를 추가했다.
- 완료 처리 RPC와 상태 전이는 변경하지 않았다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 로컬 fixture `75000000-0000-4000-8000-000000000101`, `75000000-0000-4000-8000-000000000102`를 임시로 `in_progress`로 변경
- Playwright 화주 계정으로 운송·통관 상세의 `완료 처리 전 확인` 문구 확인
- 검증 후 두 fixture 상태를 원래 `open`으로 원복 확인

### completed transaction follow-up order

- 이전 작업은 진행 중 요청을 완료 처리하기 전 확인 문구를 보강한 P148.1이고, 이번 작업은 이미 완료된 요청에서 완료 리포트·보관 서류·피드백 확인 순서를 상단에 표시한 P149.1이다.
- 운송 완료 상태 화면에 `운송 요청 완료 후 확인 순서`를 추가했다.
- 운송 완료 후 확인 순서는 완료 리포트 상태, 최종 보관 서류 연결, 거래 품질 피드백 순서로 표시한다.
- 통관 완료 상태 화면에 `통관 의뢰 완료 후 확인 순서`를 추가했다.
- 통관 완료 후 확인 순서는 신고 결과와 예비 조회 출처 구분, 최종 보관 서류 연결, 거래 품질 피드백 순서로 표시한다.
- 완료 리포트 저장, 보관 서류 연결, 피드백 제출 동작은 변경하지 않았다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright 화주 계정으로 완료 운송 요청 `/requests/freight/00000000-0000-4000-8000-000000000101#request-completion` 확인
- Playwright 화주 계정으로 완료 통관 의뢰 `/requests/clearance/00000000-0000-4000-8000-000000000201#request-completion` 확인
- Playwright developer check: `/operations/requests/75000000-0000-4000-8000-000000000201`, 임시 sent match 기반 `알림 후 파트너 무응답 개선` 렌더 확인

### marketplace partner opportunity response clue

- 이전 작업은 P125 운영자 상세 화면에서 무응답 샘플을 개선 프롬프트로 연결한 작업이고, 이번 작업은 P126 파트너 opportunity 상세에서 응답 전 판단 단서를 보여주는 작업이다.
- `buildPartnerOpportunityResponseClues` 헬퍼를 추가했다.
- open/bids_received 상태에서는 검토 상태, 질문 상태, 공개 서류 수를 파트너에게 보여준다.
- `interestStatus`가 `viewed`, `interested`, `declined`, `none`일 때 표시 문구와 배지 tone을 분리했다.
- selected/in_progress/completed 상태에서는 일반 견적 단서 대신 선정 후속 또는 완료 단서만 표시한다.
- `PartnerOpportunityResponseClues` 컴포넌트를 추가하고 운송/통관 opportunity 상세에 연결했다.
- 새 DB 조회나 migration 없이 이미 조회한 opportunity row, 서류 수, 질문 수만 사용했다.
- 다음 작업은 P127 marketplace no-response cause segmentation이다. 이번 P126이 파트너 화면의 응답 판단 단서라면, P127은 운영 요약에서 무응답 원인을 질문/서류/관심상태 기준으로 더 세분화하는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-list-view.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright developer check: 포워더 계정 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000101`, 관세사 계정 `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000102`에서 `응답 판단 단서` 렌더 확인

### marketplace no-response cause segmentation

- 이전 작업은 P126 파트너 opportunity 상세에서 응답 판단 단서를 보여준 작업이고, 이번 작업은 P127 운영 요약에서 알림 후 무응답 원인을 질문/서류/관심상태 기준으로 세분화한 작업이다.
- `PlatformRequestOperationsSummary`에 `notifiedWithoutBidsWithUnansweredQuestions`, `notifiedWithoutBidsWithoutDocuments`, `notifiedWithoutBidsPartnerActivity`, `notifiedWithoutBidsPartnerUnseen`을 추가했다.
- `service_request_partner_matches.interest_status`를 운영 요약 집계에 포함해 열람, 관심, 보류, 미확인 상태를 구분한다.
- `service_request_documents`의 request id만 집계해 공개 서류가 없는 no-response 요청을 계산한다.
- 대표 우선순위 큐의 `알림 후 무응답` detail에 질문/서류/파트너 활동/미열람 추정 카운트를 표시했다.
- 복사용 운영 개선 요청문과 상세 진단 지표에도 no-response 원인 단서를 추가했다.
- 브라우저 검증에서는 공개/무입찰 샘플에 sent 매칭 row를 임시로 추가하고 상세 진단 details를 열어 `무응답·서류 없음`, `무응답·미열람 추정` 렌더를 확인한 뒤 삭제했다.
- 다음 작업은 P128 marketplace no-response detail cause prompt다. 이번 P127이 운영 요약 화면의 원인 지표라면, P128은 개별 요청 상세의 개선 프롬프트에도 같은 원인 단서를 포함하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts features/operations/platform-request-operations-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/users#platform-request-operations`, 임시 sent match 기반 상세 진단 details 열기 후 no-response 원인 단서 렌더 확인

### marketplace no-response detail cause prompt

- 이전 작업은 P127 운영 요약에서 무응답 원인 지표를 세분화한 작업이고, 이번 작업은 P128 개별 요청 상세의 개선 프롬프트에 같은 원인 단서를 포함한 작업이다.
- `알림 후 파트너 무응답 개선` 프롬프트에 `공개 서류 없음` 여부를 추가했다.
- 프롬프트에 `파트너 열람·관심·보류 수`와 `미열람 추정 파트너 수`를 추가했다.
- 미열람 추정은 파트너 노출 수에서 열람/관심/보류 상태를 남긴 파트너 수를 뺀 값으로 계산한다.
- 요청 제목, 품목 설명, 서류 파일명, 질문·답변 원문, 견적 금액·메시지는 계속 프롬프트에 포함하지 않는다.
- 브라우저 검증에서는 공개/무입찰 샘플에 sent 매칭 row를 임시로 추가해 상세 프롬프트의 원인 단서 렌더를 확인한 뒤 삭제했다.
- 다음 작업은 P129 marketplace operations match interest detail이다. 이번 P128이 복사 프롬프트의 원인 단서라면, P129는 요청 상세의 파트너 노출·알림 요약 카드 자체에 열람/관심/보류/미확인 카운트를 보여주는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/requests/75000000-0000-4000-8000-000000000201`, 임시 sent match 기반 no-response 상세 프롬프트 원인 단서 렌더 확인

### marketplace operations match interest detail

- 이전 작업은 P128 개별 요청 상세의 복사 프롬프트에 무응답 원인 단서를 넣은 작업이고, 이번 작업은 P129 운영 상세 카드 자체에 파트너 관심 상태 카운트를 표시한 작업이다.
- `파트너 노출·알림 운영 요약` 카드에 `열람`, `관심`, `보류`, `미확인` 카운트를 추가했다.
- 파트너 회사명, 연락처, 견적 원문은 계속 표시하지 않는다.
- 브라우저 검증에서는 공개/무입찰 샘플에 `interest_status=interested` 매칭 row를 임시로 추가해 `관심 1건` 렌더를 확인한 뒤 삭제했다.
- 다음 작업은 P130 marketplace opportunity viewed tracking이다. 이번 P129가 운영 상세 화면의 관심 상태 표시라면, P130은 파트너가 opportunity 상세을 열었을 때 미확인 매칭을 열람 상태로 자동 기록하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright developer check: `/operations/requests/75000000-0000-4000-8000-000000000201`, 임시 interested match 기반 `열람/관심/보류/미확인` 렌더 확인

### marketplace opportunity viewed tracking

- 이전 작업은 P129 운영 상세 화면에 열람/관심/보류/미확인 카운트를 표시한 작업이고, 이번 작업은 P130 파트너 opportunity 상세 진입 시 미확인 매칭을 열람 상태로 기록하는 작업이다.
- `markServiceRequestPartnerMatchViewed` helper를 추가했다.
- 기존 `set_service_request_partner_interest` RPC를 사용하고, 현재 상태가 `none`일 때만 `viewed`로 전환한다.
- 이미 `viewed`, `interested`, `declined` 상태이면 RPC를 호출하지 않아 상태를 낮추지 않는다.
- 운송 opportunity 상세과 통관 opportunity 상세 모두 viewed tracking을 적용했다.
- 브라우저/RLS 검증에서는 포워더 테스트 계정으로 실제 opportunity 상세에 진입한 뒤 service role 조회로 match 상태가 `viewed`로 변경됐는지 확인하고 임시 row를 삭제했다.
- 다음 작업은 P131 marketplace opportunity decline action이다. 이번 P130이 자동 열람 기록이라면, P131은 파트너가 참여 보류를 명시해서 리마인드 대상과 운영 지표에서 구분되게 하는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-partner-match.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright/RLS check: 포워더 계정 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000201`, 임시 `none` match가 `viewed`로 변경되는지 DB 확인

### marketplace opportunity decline action

- 이전 작업은 P130 파트너 opportunity 상세 진입 시 미확인 매칭을 자동으로 열람 상태로 기록한 작업이고, 이번 작업은 P131 파트너가 참여 보류를 명시할 수 있게 한 작업이다.
- `setServiceRequestPartnerMatchInterest` helper를 추가해 기존 `set_service_request_partner_interest` RPC로 `declined` 상태를 저장한다.
- `declineServiceRequestPartnerMatchAction` 서버 액션을 추가했다.
- Next server action 파일은 async function만 export해야 하므로 action state 타입/초기값은 별도 feature 파일로 분리했다.
- `PartnerOpportunityInterestActions` 컴포넌트를 추가해 현재 참여 상태와 `참여 보류` 버튼을 표시했다.
- 운송 opportunity 상세과 통관 opportunity 상세 모두 참여 상태 컴포넌트를 연결했다.
- 최초 브라우저 검증에서 server action 파일의 non-async export 때문에 500이 발생했고, action state 분리 후 재검증에서 통과했다.
- 브라우저/RLS 검증에서는 포워더 테스트 계정으로 실제 버튼을 클릭한 뒤 service role 조회로 match 상태가 `declined`로 변경됐는지 확인하고 임시 row를 삭제했다.
- 다음 작업은 P132 marketplace declined opportunity list clarity다. 이번 P131이 상세 화면에서 보류 상태를 저장하는 작업이라면, P132는 목록과 요약에서 보류된 요청을 일반 견적 대기와 구분하는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-partner-match.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright/RLS check: 포워더 계정 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000201`, `참여 보류` 클릭 후 임시 match가 `declined`로 변경되는지 DB 확인

### marketplace declined opportunity list clarity

- 이전 작업은 P131 상세 화면에서 `참여 보류` 상태를 저장하는 액션이고, 이번 작업은 P132 목록 row와 요약 문구에서 보류 상태를 일반 견적 대기와 구분하는 작업이다.
- `serviceRequestPartnerInterestStatusLabel`과 `serviceRequestPartnerInterestStatusTone` helper를 추가했다.
- 운송 opportunity row에 `미확인`, `검토중`, `관심 표시`, `참여 보류` 배지를 표시한다.
- 통관 opportunity row에도 같은 참여 상태 배지를 표시한다.
- compact 목록 문구에서 `declined` 상태이면 `참여 보류로 저장된 요청입니다` 안내를 보여준다.
- 브라우저 검증에서는 포워더 목록에서 `입찰 가능 요청` 탭을 연 뒤 임시 declined match의 보류 배지와 안내 문구가 렌더되는지 확인했다.
- 다음 작업은 P133 marketplace declined reminder regression이다. 이번 P132가 목록 표시 작업이라면, P133은 참여 보류 상태가 알림 리마인드 정책과 worker rehearsal에서 제외되는지 회귀 검증을 보강하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-status.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright check: 포워더 계정 `/requests/freight`, `입찰 가능 요청` 탭에서 임시 declined match의 `참여 보류` 배지와 안내 문구 렌더 확인

### marketplace declined reminder regression

- 이전 작업은 P132 목록에서 참여 보류 상태를 명확히 보여준 작업이고, 이번 작업은 P133 참여 보류 상태가 알림 리마인드 정책과 worker 경로에서 제외되는지 검증을 보강한 작업이다.
- `marketplace-notification-worker.service.test.ts`에 declined match dry-run 회귀 테스트를 추가했다.
- `interest_status=declined`, `notification_status=sent`, 마감 3시간 전이어도 `reminderTargetCount=0`, `targetCount=0`이 되는지 확인한다.
- declined match에 대해 claim RPC가 호출되지 않는지도 확인한다.
- notification policy test와 worker test를 함께 실행했다.
- 로컬 notification rehearsal은 원격 Supabase URL 안전장치로 1차 차단됐고, `SUPABASE_URL=http://127.0.0.1:54321`와 로컬 service role key를 명시해 재실행 후 통과했다.
- 다음 작업은 P134 marketplace declined re-entry review다. 이번 P133이 보류 상태의 알림 제외 검증이라면, P134는 보류 후 다시 참여할 수 있는 복귀 UX가 필요한지 검토하는 작업이다.

검증:

- `npx vitest run server/notifications/marketplace-notification-policy.test.ts server/jobs/marketplace-notification-worker.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... npm run ops:marketplace-notifications:rehearse-local`

### marketplace declined re-entry review

- 이전 작업은 P133 참여 보류 상태가 알림 리마인드에서 제외되는지 검증한 작업이고, 이번 작업은 P134 보류 후 다시 참여할 수 있는 복귀 UX 범위를 정한 작업이다.
- 보류된 opportunity는 목록에 계속 남긴다.
- 상세에서는 현재 상태를 `참여 보류`로 표시한다.
- 파트너가 `다시 검토`를 누르면 `declined -> viewed`로 복귀한다.
- 바로 `interested`로 바꾸지 않고, 질문 또는 견적 제출은 이후 행동으로 둔다.
- 즉시 email 리마인드 재발송, decline reason 수집, 화주에게 보류 파트너 표시 등은 MVP에서 제외한다.
- 결정 문서는 `MARKETPLACE_DECLINED_REENTRY_REVIEW.md`에 정리했다.
- 다음 작업은 P135 marketplace declined re-entry action이다. 이번 P134가 복귀 UX 범위 결정이라면, P135는 `다시 검토` 액션을 실제로 구현하는 작업이다.

검증:

- Product/UX review only. Code execution 없음.

### marketplace declined re-entry action

- 이전 작업은 P134 보류 후 복귀 UX 범위를 결정한 작업이고, 이번 작업은 P135 파트너 상세에서 `다시 검토` 액션을 구현한 작업이다.
- `reviewAgainServiceRequestPartnerMatchAction` 서버 액션을 추가했다.
- `다시 검토`는 기존 `set_service_request_partner_interest` RPC로 `declined -> viewed`를 저장한다.
- `PartnerOpportunityInterestActions`는 보류 상태에서는 `다시 검토`, 그 외 공개/견적도착 상태에서는 `참여 보류`를 보여준다.
- 브라우저/RLS 검증에서는 포워더 테스트 계정으로 `다시 검토`를 클릭한 뒤 service role 조회로 match 상태가 `viewed`로 변경됐는지 확인하고 임시 row를 삭제했다.
- 다음 작업은 P136 marketplace interest operations regression이다. 이번 P135가 파트너 상세 액션 구현이라면, P136은 viewed/declined 전환이 운영 상세 관심상태 카운트에 반영되는지 회귀 검증하는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-partner-match.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright/RLS check: 포워더 계정 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000201`, `다시 검토` 클릭 후 임시 match가 `viewed`로 변경되는지 DB 확인

### marketplace interest operations regression

- 이전 작업은 P135 파트너 상세에서 `다시 검토` 액션을 구현한 작업이고, 이번 작업은 P136 파트너 관심상태 전환이 운영 상세 카운트에 반영되는지 검증한 작업이다.
- 임시 match를 `none`으로 생성한 뒤 포워더 계정으로 opportunity 상세에 진입해 자동 `viewed` 기록을 발생시켰다.
- 운영자 요청 상세에서 `열람 1건`, `보류 0건`을 확인했다.
- 포워더 계정에서 `참여 보류`를 클릭한 뒤 운영자 요청 상세를 새로고침해 `열람 0건`, `보류 1건`을 확인했다.
- 검증 후 임시 match row를 삭제했다.
- 다음 작업은 P137 marketplace post-interest-flow bottleneck review다. 이번 P136이 관심상태 회귀 검증이라면, P137은 no-response/interest flow 이후 남은 marketplace MVP 병목을 다시 고르는 리뷰 작업이다.

검증:

- Playwright/RLS check: 포워더 계정 상세 + 운영자 요청 상세 동시 확인, `viewed -> declined` 운영 카운트 반영 확인

## 2026-06-02

### local login review smoke

- 이전 작업은 P64.2 next platform work selection이고, 이번 작업은 로컬 서버가 테스트 계정 로그인을 실제로 통과하는지 재확인하는 P64.3이다.
- 기존 로컬 서버 프로세스가 `.env.local`의 Supabase 설정을 읽지 못해 로그인 화면에서 `Supabase 환경 변수가 없어 로그인할 수 없습니다.`가 표시되는 문제를 재현했다.
- `next dev`를 `http://127.0.0.1:3100`에서 재시작했고, 브라우저 자동화로 `shipper.test@hsfinder.co.kr` 계정이 `/dashboard`에 진입하는 것을 확인했다.
- `smoke_local_login.mjs`를 추가해 같은 문제를 나중에 명령 한 번으로 재확인할 수 있게 했다.
- `smoke:local-login` npm script와 `LOCAL_LOGIN_REVIEW_RUNBOOK.md`를 추가했다.
- 원격 DB에는 쓰지 않았고, DB migration 적용도 하지 않았다.
- 다음 작업은 P64.4 marketplace role visibility blocker review이다. 이번 P64.3이 로그인 가능 여부 검증이라면, P64.4는 marketplace schema 미적용 상태에서 역할별 화면을 어디까지 확인할 수 있는지 정리하는 작업이다.

검증:

- `node --check scripts/smoke_local_login.mjs`
- `npm run smoke:local-login`
- `npm run typecheck`
- `npm run lint`
- Playwright login smoke: `shipper.test@hsfinder.co.kr` -> `/dashboard`

### marketplace role visibility blocker review

- 이전 작업은 P64.3 local login review smoke이고, 이번 작업은 로그인 이후 역할별 marketplace 화면이 왜 제한될 수 있는지 확인하는 P64.4다.
- 세 테스트 계정 모두 로컬 서버에서 `/dashboard` 로그인에 성공했다.
- 원격 Supabase에는 기본 로그인 테이블은 있으나 marketplace migration의 핵심 컬럼/테이블이 준비되지 않아 역할별 입찰 positive path가 제한됨을 확인했다.
- auth metadata로 포워더·관세사 권한을 우회 부여하지 않는 기준을 문서화했다.
- `check_marketplace_schema_visibility.mjs`와 `smoke:marketplace-schema`를 추가해 현재 DB가 marketplace 화면 확인 가능한 상태인지 명령으로 확인할 수 있게 했다.
- 원격 DB에는 쓰지 않았고, DB migration 적용도 하지 않았다.
- 다음 작업은 P64.5 local review positive-path decision이다. 이번 P64.4가 blocker 확인이라면, P64.5는 local Supabase에 marketplace migration을 적용해 positive path를 열지 결정하는 작업이다.

검증:

- `node --check scripts/check_marketplace_schema_visibility.mjs`
- `LOCAL_LOGIN_SMOKE_ALL=1 npm run smoke:local-login`
- `npm run smoke:marketplace-schema`: 원격 marketplace schema 미적용 상태를 안전 실패로 확인
- `npm run typecheck`
- `npm run lint`

### local review positive path decision

- 이전 작업은 P64.4 marketplace role visibility blocker review이고, 이번 작업은 positive path를 local Supabase migration으로 열지 결정하는 P64.5다.
- 세 테스트 계정 로그인은 복구됐지만, marketplace 요청/입찰 positive path는 marketplace migration이 적용된 DB가 있어야 한다.
- 사용자 명시 승인 전에는 local Supabase에도 migration을 적용하지 않는 기존 기준을 유지한다.
- `LOCAL_REVIEW_POSITIVE_PATH_DECISION.md`를 추가했다.
- 다음 작업은 P65.1 marketplace schema fallback UX이다. 이번 P64.5가 DB 적용 여부 결정이라면, P65.1은 schema 미준비 상태에서 화면이 계정 문제처럼 보이지 않게 문구와 안내를 다듬는 작업이다.

검증:

- decision 문서 작성

### marketplace schema fallback UX

- 이전 작업은 P64.5 local review positive-path decision이고, 이번 작업은 schema 미준비 상태에서 사용자가 계정 문제로 오해하지 않게 화면 문구를 정리하는 P65.1이다.
- 대시보드, 운송 요청, 통관 의뢰, 요청 상세, 입찰 상세의 fallback 문구를 “로그인은 정상 / 플랫폼 요청·입찰 데이터 준비 중” 기준으로 바꿨다.
- 일반 사용자 화면에서는 “데이터베이스 미적용” 표현을 줄이고, 계정 문제가 아니라 현재 환경의 플랫폼 요청 기능 준비 상태임을 설명한다.
- 로컬 브라우저에서 `shipper.test@hsfinder.co.kr`로 `/dashboard`, `/requests/freight`, `/requests/clearance` 화면의 새 안내 문구 렌더링을 확인했다.
- 원격 DB에는 쓰지 않았고, DB migration 적용도 하지 않았다.
- 다음 작업은 P65.2 operations schema fallback UX이다. 이번 P65.1이 사용자 요청 화면 문구라면, P65.2는 운영자 전용 요청 통계/상세 화면의 schema 미준비 안내를 정리하는 작업이다.

검증:

- Playwright browser check: `/dashboard`, `/requests/freight`, `/requests/clearance`
- `npm run typecheck`
- `npm run lint`
- `npm run smoke:local-login`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

### operations schema fallback UX

- 이전 작업은 P65.1 marketplace schema fallback UX이고, 이번 작업은 운영자·설정 화면의 schema 미준비 안내를 정리하는 P65.2다.
- 운영 요청 통계, 운영 요청 상세, 회사 검증 제출, 역할 신청, 파트너 관심 조건, 역할 신청 검토, 업체 상태 관리, 회사 검증 검토 화면의 fallback 문구를 계정 문제가 아닌 현재 환경의 데이터 준비 상태로 설명하게 바꿨다.
- `settings/members`를 로컬 브라우저에서 확인해 “로그인 문제는 아니며” 안내가 보이고 기존 “데이터베이스가 아직 적용” 문구가 사라진 것을 확인했다.
- 기술 점검용 `operations/health`와 배포 문서의 DB 스키마 표현은 운영 진단 용도이므로 유지했다.
- 원격 DB에는 쓰지 않았고, DB migration 적용도 하지 않았다.
- 다음 작업은 P65.3 local review status snapshot이다. 이번 P65.2가 화면 문구 정리라면, P65.3은 사용자가 돌아와 바로 볼 수 있게 로컬 서버/로그인/스키마 상태를 한 번에 요약하는 작업이다.

검증:

- Playwright browser check: `/settings/members`
- `npm run typecheck`
- `npm run lint`
- `npm run smoke:local-login`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

### local review status snapshot

- 이전 작업은 P65.2 operations schema fallback UX이고, 이번 작업은 사용자가 돌아와 바로 볼 수 있게 현재 로컬 서버/로그인/schema 상태를 요약하는 P65.3이다.
- `local_review_status.mjs`를 추가했다.
- `review:local-status` npm script를 추가했다.
- `LOCAL_REVIEW_STATUS.md`에 로컬 서버 URL, 테스트 계정, 확인 가능한 범위와 제한 범위를 정리했다.
- schema smoke는 실패해도 전체 상태 스냅샷에서는 `marketplacePositivePath=blocked`로 해석하며, 로그인 smoke 실패만 전체 실패로 처리한다.
- 다음 작업은 P65.4 next non-DB platform work selection이다. 이번 P65.3이 현 상태 확인 명령이라면, P65.4는 DB 적용 없이 이어갈 다음 플랫폼 작업을 고르는 작업이다.

검증:

- `node --check scripts/local_review_status.mjs`
- `npm run review:local-status`: `localLogin=ready`, `marketplacePositivePath=blocked`
- `npm run typecheck`
- `npm run lint`

### all-role local review smoke

- 이전 작업은 P65.4 next non-DB platform work selection이고, 이번 작업은 로컬 리뷰 상태 명령이 화주·포워더·관세사 세 테스트 계정 로그인을 모두 확인하게 하는 P65.5다.
- `review:local-status` 내부 로그인 smoke에 `LOCAL_LOGIN_SMOKE_ALL=1`을 주입했다.
- `LOCAL_REVIEW_STATUS.md`에 세 테스트 계정 전체 확인 기준을 반영했다.
- 다음 작업은 P65.6 local review browser route bundle이다. 이번 P65.5가 로그인 검증 범위 확대라면, P65.6은 사용자가 실제로 볼 주요 route 묶음을 브라우저로 한 번에 점검하는 작업이다.

검증:

- `npm run review:local-status`: 세 계정 모두 로그인 ready, marketplace positive path blocked
- `npm run typecheck`
- `npm run lint`

### local review browser route bundle

- 이전 작업은 P65.5 all-role local review smoke이고, 이번 작업은 사용자가 실제로 볼 주요 route 묶음을 브라우저로 점검하는 P65.6이다.
- `local_review_routes.mjs`를 추가했다.
- `review:local-routes` npm script를 추가했다.
- `/dashboard`, `/requests/freight`, `/requests/clearance`, `/settings/members`, `/hs/direct`를 화주 테스트 계정 세션으로 확인하게 했다.
- Supabase env 오류 문구와 예전 “데이터베이스가 아직 적용” 문구가 본문에 남으면 실패하도록 했다.
- 다음 작업은 P65.7 local review final verification이다. 이번 P65.6이 route bundle smoke라면, P65.7은 로그인/route/status/schema 문서와 스크립트 전체를 최종 검증하는 작업이다.

검증:

- `node --check scripts/local_review_routes.mjs`
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`

### local review final verification

- 이전 작업은 P65.6 local review browser route bundle이고, 이번 작업은 로그인/status/routes/schema 문서와 스크립트 전체를 최종 검증하는 P65.7이다.
- 검증 대상은 `smoke_local_login`, `check_marketplace_schema_visibility`, `local_review_status`, `local_review_routes` 스크립트와 관련 npm 명령이다.
- 다음 작업은 P66.1 next non-DB platform work selection이다. 이번 P65.7이 로컬 리뷰 unblock 최종 검증이라면, P66.1은 DB 적용 없이 이어갈 다음 제품 작업을 다시 고르는 작업이다.

검증:

- `node --check scripts/smoke_local_login.mjs && node --check scripts/check_marketplace_schema_visibility.mjs && node --check scripts/local_review_status.mjs && node --check scripts/local_review_routes.mjs`
- `npm run review:local-status`: 세 계정 로그인 ready, marketplace positive path blocked
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

### next non-DB platform work selection

- 이전 작업은 P65.7 local review final verification이고, 이번 작업은 DB 적용 없이 이어갈 다음 제품 작업을 고르는 P66.1이다.
- marketplace positive path는 DB migration 없이는 여전히 막혀 있으므로, 테스트 계정이 포워더/관세사인데 화면에는 역할 미설정처럼 보이는 혼동을 먼저 줄이기로 했다.
- 다음 작업은 P66.2 display-only role intent visibility이다. 이번 P66.1이 작업 선정이라면, P66.2는 실제 화면에 가입 시 선택한 역할을 승인 권한과 분리해 표시하는 작업이다.

검증:

- ROADMAP 검토

### display-only role intent visibility

- 이전 작업은 P66.1 next non-DB platform work selection이고, 이번 작업은 가입 시 선택한 역할을 승인 권한과 분리해 화면에 표시하는 P66.2다.
- `intended_marketplace_role` 또는 가입 `business_types` metadata를 display-only role intent로 읽는 helper를 추가했다.
- 기존 `mapSignupBusinessTypesToMarketplacePartyTypes`는 그대로 고영향 파트너 역할 자동 부여를 하지 않게 유지했다.
- 대시보드와 회사 설정의 플랫폼 역할 영역에서 승인된 `company_party_types`가 없으면 `승인 역할 없음`과 `가입 선택: 포워더/관세사/국내 수출입 화주`를 분리 표시한다.
- 포워더 테스트 계정으로 `/dashboard`, `/settings/members`에서 `가입 선택: 포워더`가 표시되는 것을 브라우저로 확인했다.
- 원격 DB에는 쓰지 않았고, DB migration 적용도 하지 않았다.
- 다음 작업은 P66.3 local review route all-role intent assertion이다. 이번 P66.2가 역할 의도 배지 표시라면, P66.3은 route smoke가 포워더/관세사 의도 배지까지 회귀 테스트하게 하는 작업이다.

검증:

- `npx vitest run server/repositories/company-marketplace.repository.test.ts`
- Playwright browser check: forwarder `/dashboard`, `/settings/members`
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

### local review route all-role intent assertion

- 이전 작업은 P66.2 display-only role intent visibility이고, 이번 작업은 로컬 route smoke가 포워더/관세사 역할 의도 배지를 회귀 테스트하게 하는 P66.3이다.
- `local_review_routes.mjs`가 화주 계정뿐 아니라 포워더, 관세사무소 계정으로도 로그인한다.
- 포워더 `/dashboard`, `/settings/members`에서 `가입 선택: 포워더`를 확인한다.
- 관세사무소 `/dashboard`, `/settings/members`에서 `가입 선택: 관세사`를 확인한다.
- `LOCAL_REVIEW_STATUS.md`에 route bundle 확인 범위를 업데이트했다.
- 다음 작업은 P66.4 role intent visibility final verification이다. 이번 P66.3이 route smoke 확장이라면, P66.4는 역할 의도 표시 변경 전체를 최종 검증하는 작업이다.

검증:

- `node --check scripts/local_review_routes.mjs`
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`

### role intent visibility final verification

- 이전 작업은 P66.3 local review route all-role intent assertion이고, 이번 작업은 역할 의도 표시 변경 전체를 최종 검증하는 P66.4다.
- display-only role intent helper, 대시보드 표시, 회사 설정 표시, all-role route smoke를 묶어서 재검증했다.
- `review:local-status`는 세 계정 로그인 ready와 marketplace positive path blocked를 계속 정확히 요약한다.
- `review:local-routes`는 화주 기본 화면과 포워더/관세사 역할 의도 배지를 모두 확인한다.
- 원격 DB에는 쓰지 않았고, DB migration 적용도 하지 않았다.
- 다음 작업은 P67.1 next non-DB platform work selection이다. 이번 P66.4가 역할 의도 표시 최종 검증이라면, P67.1은 DB 적용 없이 이어갈 다음 제품 작업을 다시 고르는 작업이다.

검증:

- `npx vitest run server/repositories/company-marketplace.repository.test.ts`
- `npm run review:local-status`
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

### dashboard role-aware action cards

- 이전 작업은 P67.1 next non-DB platform work selection이고, 이번 작업은 대시보드 시작 카드를 역할에 맞게 줄이는 P67.2다.
- 화주 또는 역할 미설정 계정에는 운송 견적 요청과 통관 의뢰 요청을 중심으로 표시한다.
- 포워더 역할 의도 또는 승인 역할이 있으면 포워더 입찰 확인 카드를 표시한다.
- 관세사무소 역할 의도 또는 승인 역할이 있으면 관세사 입찰 확인 카드를 표시한다.
- 권한 부여는 여전히 하지 않고, 표시용 role intent와 승인 role을 합쳐 대시보드 카드 노출에만 사용한다.
- 다음 작업은 P67.3 dashboard role-aware action route assertion이다. 이번 P67.2가 카드 노출 로직이라면, P67.3은 브라우저 route smoke에서 역할별 카드가 맞는지 회귀 검증하는 작업이다.

검증:

- Playwright browser check: shipper/forwarder/customs_broker `/dashboard`

### dashboard role-aware action route assertion

- 이전 작업은 P67.2 dashboard role-aware action cards이고, 이번 작업은 route smoke에서 역할별 카드 노출/미노출을 회귀 검증하는 P67.3이다.
- `local_review_routes.mjs`에 `forbiddenText` 검증을 추가했다.
- 화주 대시보드에 포워더/관세사 입찰 카드가 섞이면 실패한다.
- 포워더 대시보드에 관세사 입찰 카드가 섞이면 실패한다.
- 관세사무소 대시보드에 포워더 입찰 카드가 섞이면 실패한다.
- 다음 작업은 P67.4 dashboard role-aware action final verification이다. 이번 P67.3이 route smoke assertion이라면, P67.4는 대시보드 역할별 카드 변경 전체를 최종 검증하는 작업이다.

검증:

- `node --check scripts/local_review_routes.mjs`
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`

### dashboard role-aware action final verification

- 이전 작업은 P67.3 dashboard role-aware action route assertion이고, 이번 작업은 대시보드 역할별 카드 변경 전체를 최종 검증하는 P67.4다.
- 검증 대상은 display-only role intent, role-aware dashboard action cards, all-role local route smoke다.
- 다음 작업은 P68.1 next non-DB platform work selection이다. 이번 P67.4가 대시보드 역할별 카드 최종 검증이라면, P68.1은 DB 적용 없이 이어갈 다음 제품 작업을 다시 고르는 작업이다.

검증:

- `npx vitest run server/repositories/company-marketplace.repository.test.ts`
- `npm run review:local-status`
- `npm run review:local-routes`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

## 2026-06-01

### local migration application decision

- 이전 작업은 final lint/build 검증인 P63.3이고, 이번 작업은 positive E2E를 위해 local Supabase에 marketplace migration을 적용할지 판단 기준을 정리한 P64.1이다.
- `LOCAL_MARKETPLACE_MIGRATION_DECISION.md`를 추가했다.
- 현재 local Supabase는 실행 중이지만 marketplace migration이 적용되지 않아 positive E2E seed가 막힌다는 점을 정리했다.
- local migration 적용 명령과, 적용하지 않고 safe-fail 검증만 유지하는 선택지를 분리했다.
- 사용자 명시 요청 전에는 Codex가 local DB migration을 적용하지 않는다는 기준을 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P64.2 next platform work selection이다. 이번 P64.1이 local migration 판단 문서라면, P64.2는 DB 적용 없이 이어갈 다음 플랫폼 작업을 다시 고르는 작업이다.

검증:

- local migration decision 문서 작성 및 ROADMAP/WORK_LOG 연결

### marketplace transaction final build after preflight

- 이전 작업은 seed schema preflight를 추가한 P63.2이고, 이번 작업은 최종 lint/build와 `next-env.d.ts` 복구까지 확인한 P63.3이다.
- `npm run lint`를 통과했다.
- `npm run build`를 통과했다.
- Next build가 자동 변경한 `next-env.d.ts` route import는 프로젝트 기준에 맞게 dev route import로 되돌렸다.
- positive E2E는 local Supabase marketplace schema 미적용 때문에 아직 실행하지 못한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P64.1 local migration application decision이다. 이번 P63.3이 코드 검증이라면, P64.1은 positive E2E를 위해 local Supabase에 marketplace migration을 적용할지 사용자가 나중에 판단할 수 있게 정리하는 작업이다.

검증:

- `npm run lint`
- `npm run build`
- `next-env.d.ts` 자동 변경 복구

### marketplace transaction seed schema preflight

- 이전 작업은 local positive E2E 실행을 막는 실제 조건을 확인한 P63.1이고, 이번 작업은 seed가 schema 미적용 상태를 더 명확히 안내하게 한 P63.2다.
- `seed_marketplace_transaction_fixture.mjs`에 marketplace schema preflight를 추가했다.
- seed가 회사 확장 컬럼, party type, partner preference, service request, service bid 테이블을 먼저 확인한다.
- local Supabase에 platform marketplace migration이 적용되지 않은 경우 DB upsert 전에 명확한 안내 메시지로 실패한다.
- local-only env override로 runner를 다시 실행해 `companies.contact_email` 누락이 낮은 수준 upsert 오류가 아니라 schema 준비 필요 메시지로 표시되는 것을 확인했다.
- 원격 DB에는 쓰지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P63.3 marketplace transaction final build after preflight이다. 이번 P63.2가 schema preflight라면, P63.3은 최종 lint/build와 next-env 복구까지 확인하는 작업이다.

검증:

- `node --check scripts/seed_marketplace_transaction_fixture.mjs`
- local-only env override로 `npm run e2e:marketplace-transaction:local`: local schema 미적용을 명확히 안내하며 seed 전 실패
- `npm run typecheck`

### local Supabase positive-run unblock check

- 이전 작업은 mutation harness 최종 검증인 P62.5이고, 이번 작업은 현재 머신에서 local Supabase positive E2E 실행을 막는 실제 조건을 확인한 P63.1이다.
- `npx supabase status` 기준 local Supabase는 실행 중이다.
- `.env.local`은 여전히 원격 Supabase origin을 가리키고 있고 `E2E_TEST_PASSWORD`는 없다.
- 파일을 바꾸지 않고 명령 환경에만 local Supabase URL, local service role key, 임시 E2E password를 주입해 `e2e:marketplace-transaction:local`을 실행했다.
- 원격 DB에는 쓰지 않았다.
- local runner는 seed 단계에서 local DB schema가 최신 marketplace migration 상태가 아니라 실패했다.
- 실제 실패 메시지: `companies` schema cache에 `contact_email` column이 없었다.
- 다음 작업은 P63.2 marketplace transaction seed schema preflight이다. 이번 P63.1이 실패 조건 확인이라면, P63.2는 seed가 schema 미적용 상태를 더 명확히 안내하게 하는 작업이다.

검증:

- `npx supabase status`
- `.env.local` origin/password presence check
- local-only env override로 `npm run e2e:marketplace-transaction:local` 실행: local seed 단계에서 schema 미적용으로 실패

### marketplace transaction mutation harness verification

- 이전 작업은 mutation E2E skeleton을 추가한 P62.4이고, 이번 작업은 seed/static/mutation/local runner 전체를 검증하고 문서 위험을 갱신한 P62.5다.
- runbook에 one-command local runner가 static rendering E2E와 mutation E2E를 모두 실행한다고 반영했다.
- self-review에 mutation E2E 스크립트와 local runner를 scope로 추가했다.
- self-review의 “mutation flow 미구현” 리스크를 “mutation positive path 미실행” 리스크로 갱신했다.
- 현재 환경에서는 local Supabase와 storage state가 없어 mutation positive path는 실행하지 못했고, safe-fail 경로만 검증했다.
- Next build가 자동 변경한 `next-env.d.ts` route import는 프로젝트 기준에 맞게 dev route import로 되돌렸다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P63.1 local Supabase positive-run unblock check이다. 이번 P62.5가 mutation harness 코드 검증이라면, P63.1은 현재 머신에서 local Supabase positive E2E 실행을 막는 실제 조건을 확인하는 작업이다.

검증:

- `node --check scripts/check_marketplace_transaction_e2e_readiness.mjs && node --check scripts/seed_marketplace_transaction_fixture.mjs && node --check scripts/create_marketplace_transaction_storage_states.mjs && node --check scripts/e2e_marketplace_transaction_flow.mjs && node --check scripts/e2e_marketplace_transaction_mutation_flow.mjs && node --check scripts/run_marketplace_transaction_e2e_local.mjs`
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- `npm run e2e:marketplace-transaction:mutation`: storage state 없음 상태에서 안전 실패
- `npm run e2e:marketplace-transaction:local`: 원격 Supabase origin과 E2E password 누락으로 seed 전 안전 실패
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace transaction mutation E2E skeleton

- 이전 작업은 mutation 요청과 매칭을 seed runner에 연결한 P62.3이고, 이번 작업은 seeded mutation 요청으로 파트너 견적 제출과 화주 선택을 시도하는 guarded E2E skeleton을 만든 P62.4다.
- `e2e_marketplace_transaction_mutation_flow.mjs`를 추가했다.
- `e2e:marketplace-transaction:mutation` 스크립트를 추가했다.
- local runner가 static rendering E2E 뒤에 mutation E2E를 실행하도록 연결했다.
- mutation E2E는 forwarder가 운송 견적을 제출하고 requester가 해당 견적을 선택한 뒤 selected partner 안내를 확인하는 흐름을 포함한다.
- mutation E2E는 broker가 통관 견적을 제출하고 requester가 해당 견적을 선택한 뒤 selected partner 안내를 확인하는 흐름을 포함한다.
- 현재 storage state가 없어 브라우저 mutation 전에 안전 실패한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P62.5 marketplace transaction mutation harness verification이다. 이번 P62.4가 mutation E2E skeleton이라면, P62.5는 seed/static/mutation/local runner 전체를 최종 검증하고 문서 위험을 갱신하는 작업이다.

검증:

- `node --check scripts/e2e_marketplace_transaction_mutation_flow.mjs && node --check scripts/run_marketplace_transaction_e2e_local.mjs`
- `npm run e2e:marketplace-transaction:mutation`: storage state 없음 상태에서 안전 실패
- `npm run typecheck`
- `npm run lint`

### marketplace transaction mutation seed support

- 이전 작업은 mutation 전용 fixture 상수와 env 계약을 추가한 P62.2이고, 이번 작업은 seed runner가 open 상태의 mutation 요청과 매칭을 준비하게 한 P62.3이다.
- seed cleanup 대상에 mutation 운송/통관 request ID를 포함했다.
- static fixture는 기존처럼 `bids_received` 요청과 제출된 bid를 seed한다.
- mutation fixture는 `open` 상태 요청, 요청 상세, partner match까지만 seed하고 bid는 seed하지 않는다.
- seed 출력에 static fixture env export와 mutation fixture env export를 함께 표시한다.
- local runner도 mutation fixture env 값을 내부 주입하게 했다.
- 현재 `.env.local`은 원격 Supabase origin이라 DB 쓰기 전 안전 실패한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P62.4 marketplace transaction mutation E2E skeleton이다. 이번 P62.3이 mutation seed 준비라면, P62.4는 seeded mutation 요청으로 파트너 견적 제출과 화주 선택을 시도하는 guarded E2E skeleton을 만드는 작업이다.

검증:

- `node --check scripts/seed_marketplace_transaction_fixture.mjs && node --check scripts/run_marketplace_transaction_e2e_local.mjs`
- `npm run e2e:marketplace-transaction:seed`: 원격 Supabase origin에서 DB 쓰기 전 안전 실패
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- `npm run typecheck`

### marketplace transaction mutation fixture contract

- 이전 작업은 mutation E2E 계획을 세운 P62.1이고, 이번 작업은 반복 실행 가능한 mutation 전용 fixture 상수와 env 계약을 추가한 P62.2다.
- `marketplaceTransactionFixture.mutation`에 운송/통관 mutation request ID와 bid ID를 추가했다.
- static rendering fixture와 mutation fixture가 같은 ID를 쓰지 않도록 분리했다.
- `E2E_MARKETPLACE_MUTATION_*` env key와 `marketplaceTransactionMutationEnvExports` helper를 추가했다.
- fixture 테스트에서 static/mutation ID 중복이 없는지 확인한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P62.3 marketplace transaction mutation seed support이다. 이번 P62.2가 mutation fixture 상수라면, P62.3은 seed runner가 open 상태의 mutation 요청과 매칭을 별도 fixture로 준비하게 하는 작업이다.

검증:

- `node --check tests/fixtures/marketplace-transaction.fixture.mjs`
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- `npm run typecheck`

### marketplace transaction mutation E2E plan

- 이전 작업은 marketplace transaction harness 전체를 최종 검증한 P61.2이고, 이번 작업은 실제 UI mutation E2E 확장 계획을 세운 P62.1이다.
- `MARKETPLACE_TRANSACTION_MUTATION_E2E_PLAN.md`를 추가했다.
- 기존 static rendering fixture와 별도로 mutation 전용 request/bid fixture를 두는 방향으로 잡았다.
- mutation E2E는 open 요청을 seed하고, 파트너가 브라우저로 견적을 제출하고, 화주가 브라우저로 견적을 선택하는 흐름으로 정의했다.
- RLS/safety 체크 포인트로 audited RPC, non-matched partner 차단, requester 소유권, secret 미출력, 실제 문서 미사용을 명시했다.
- 문서 업로드/다운로드 검증은 별도 storage privacy 범위로 분리하고 이번 mutation E2E에서는 제외했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P62.2 marketplace transaction mutation fixture contract이다. 이번 P62.1이 mutation E2E 계획이라면, P62.2는 반복 실행 가능한 별도 mutation request/bid fixture 상수와 env 계약을 추가하는 작업이다.

검증:

- mutation E2E 계획 문서 작성 및 ROADMAP/WORK_LOG 연결

### marketplace transaction harness final verification

- 이전 작업은 seed/auth/e2e를 한 명령으로 순차 실행하는 P61.1이고, 이번 작업은 P60-P61 harness 변경 전체를 최종 검증한 P61.2다.
- marketplace transaction readiness, seed, auth-state, e2e, local runner 스크립트 문법을 모두 확인했다.
- seed, auth-state, readiness, local runner, e2e가 현재 원격 Supabase/fixture 누락 환경에서 안전 실패하는지 확인했다.
- fixture 단위 테스트, typecheck, lint, build를 통과했다.
- Next build가 자동 변경한 `next-env.d.ts` route import는 프로젝트 기준에 맞게 dev route import로 되돌렸다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P62.1 marketplace transaction mutation E2E plan이다. 이번 P61.2가 harness 검증이라면, P62.1은 실제 UI에서 파트너 입찰 제출과 화주 선정까지 mutation E2E로 확장할 계획을 세우는 작업이다.

검증:

- `node --check scripts/check_marketplace_transaction_e2e_readiness.mjs && node --check scripts/seed_marketplace_transaction_fixture.mjs && node --check scripts/create_marketplace_transaction_storage_states.mjs && node --check scripts/e2e_marketplace_transaction_flow.mjs && node --check scripts/run_marketplace_transaction_e2e_local.mjs`
- `npm run e2e:marketplace-transaction:seed`: 원격 Supabase origin에서 DB 쓰기 전 안전 실패
- `npm run e2e:marketplace-transaction:auth`: 원격 Supabase origin에서 브라우저 로그인 전 안전 실패
- `npm run e2e:marketplace-transaction:local`: 원격 Supabase origin과 E2E password 누락으로 seed 전 안전 실패
- `npm run e2e:marketplace-transaction:ready`: 원격 Supabase origin, E2E password, fixture env, storage state 누락으로 안전 실패
- `npm run e2e:marketplace-transaction`: fixture env 누락으로 안전 실패
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace transaction local runner

- 이전 작업은 marketplace transaction E2E harness 자체 리뷰인 P60.11이고, 이번 작업은 local preflight가 통과할 때 seed/auth/e2e를 한 명령으로 순차 실행하는 P61.1이다.
- `run_marketplace_transaction_e2e_local.mjs`를 추가했다.
- `e2e:marketplace-transaction:local` 스크립트를 추가했다.
- runner는 local Next.js, local Supabase, service-role key, E2E password, `/login`, Supabase auth health를 먼저 확인한다.
- fixture request/bid env 값은 runner가 synthetic fixture 상수에서 내부 주입한다.
- preflight가 통과할 때만 seed, auth state 생성, readiness, E2E를 순서대로 실행한다.
- 현재 `.env.local`은 원격 Supabase origin이고 `E2E_TEST_PASSWORD`가 없어 seed 전 안전 실패한다.
- secret 값은 출력하지 않는다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P61.2 marketplace transaction harness final verification이다. 이번 P61.1이 실행기 추가라면, P61.2는 P60-P61 harness 변경 전체를 type/lint/build와 safe-fail 실행으로 최종 검증하는 작업이다.

검증:

- `node --check scripts/run_marketplace_transaction_e2e_local.mjs`
- `npm run e2e:marketplace-transaction:local`: 원격 Supabase origin과 E2E password 누락으로 seed 전 안전 실패
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`

### marketplace transaction E2E harness self-review

- 이전 작업은 marketplace transaction E2E assertion을 강화한 P60.10이고, 이번 작업은 seed/auth/readiness/e2e harness 전체를 보안·QA 관점에서 자체 리뷰한 P60.11이다.
- `MARKETPLACE_TRANSACTION_E2E_SELF_REVIEW.md`를 추가했다.
- 원격 Supabase write/login 차단, secret 미출력, synthetic fixture, 민감 문서/질문/답변/메시지 미검증 원칙을 확인했다.
- 현재 환경에서는 local Supabase/storage state가 없어 positive authenticated E2E를 실행하지 못하는 점을 accepted risk로 남겼다.
- E2E가 아직 UI mutation으로 신규 입찰 제출/선정을 하지 않는 점을 다음 단계 리스크로 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P61.1 marketplace transaction local runner이다. 이번 P60.11이 자체 리뷰라면, P61.1은 local preflight가 통과할 때 seed/auth/e2e를 한 명령으로 순차 실행하는 runner를 만드는 작업이다.

검증:

- `rg -n "SUPABASE_SERVICE_ROLE_KEY|E2E_TEST_PASSWORD|storageState|storage state|service_role|secretValues|local Supabase|remote Supabase|document|fileName|message|invoice|Commercial Invoice|법적|확정|legalCertainty|confirmed|guaranteed|definitely" scripts/*marketplace_transaction* scripts/check_marketplace_transaction_e2e_readiness.mjs tests/fixtures/marketplace-transaction.fixture.* docs/MARKETPLACE_TRANSACTION_E2E* docs/ROADMAP.md docs/WORK_LOG.md`

### marketplace transaction E2E assertion tightening

- 이전 작업은 seed/auth/e2e 실행 순서를 문서화한 P60.9이고, 이번 작업은 실제 E2E assertion을 더 구체화한 P60.10이다.
- requester 운송 상세는 fixture 제목, 받은 견적, 견적 비교 기준, 포워더 선정 문구를 확인한다.
- requester 통관 상세는 fixture 제목, 받은 견적, 견적 비교 기준, 관세사무소 선정 문구를 확인한다.
- forwarder opportunity는 fixture 제목, 총 견적 금액, 견적 메모, 견적 제출 문구를 확인한다.
- broker opportunity는 fixture 제목, 관세사무소 예비 견적 제출, 총 견적 금액, 예비 통관 견적 제출 문구를 확인한다.
- 현재 local fixture env와 storage state가 없어 성공 E2E 본문은 실행하지 못했고, fixture env 누락 상태에서 안전 실패하는 것을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.11 marketplace transaction E2E harness self-review이다. 이번 P60.10이 E2E assertion 강화라면, P60.11은 seed/auth/readiness/e2e harness 전체를 보안·QA 관점에서 자체 리뷰하는 작업이다.

검증:

- `node --check scripts/e2e_marketplace_transaction_flow.mjs`
- `npm run e2e:marketplace-transaction`: fixture env 누락으로 안전 실패
- `npm run typecheck`
- `npm run lint`

### marketplace transaction local runbook

- 이전 작업은 requester, forwarder, broker 로그인 storage state를 만드는 P60.8이고, 이번 작업은 seed/auth/e2e 실행 순서와 막힘 조건을 문서로 고정한 P60.9다.
- `MARKETPLACE_TRANSACTION_E2E_RUNBOOK.md`를 추가했다.
- local Next.js, local Supabase, service-role key, E2E password, fixture env export, storage state 파일 준비 순서를 정리했다.
- 원격 Supabase origin, password 누락, fixture env 누락, storage state 누락, local 서버 중단 시 기대되는 안전 실패를 명시했다.
- 현재 E2E 범위가 권한/접근/페이지 도달 검증이고, UI를 통한 신규 입찰 제출이나 선택은 다음 강화 단계로 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.10 marketplace transaction E2E assertion tightening이다. 이번 P60.9가 실행 문서라면, P60.10은 E2E assertion이 단순 페이지 도달을 넘어 견적 비교/제출 문구를 더 구체적으로 확인하게 만드는 작업이다.

검증:

- `rg -n "e2e:marketplace-transaction|E2E_MARKETPLACE|storage state|remote Supabase|local Supabase" docs/MARKETPLACE_TRANSACTION_E2E_RUNBOOK.md scripts/check_marketplace_transaction_e2e_readiness.mjs docs/ROADMAP.md docs/WORK_LOG.md`

### marketplace transaction auth state script

- 이전 작업은 marketplace transaction DB fixture를 upsert하는 P60.7이고, 이번 작업은 seeded requester, forwarder, broker 계정으로 로그인 storage state를 만드는 P60.8이다.
- `create_marketplace_transaction_storage_states.mjs`를 추가했다.
- `e2e:marketplace-transaction:auth` 스크립트를 추가했다.
- storage state는 Git 추적 대상이 아닌 `tmp/e2e-auth/`에 role별 fixture 파일명으로 저장한다.
- local Next.js base URL뿐 아니라 `.env.local` Supabase origin도 local인지 확인해, 로컬 앱이 원격 Supabase로 로그인하지 못하게 막았다.
- 비밀번호와 session cookie는 출력하지 않는다.
- marketplace transaction readiness 안내를 seed/auth 명령 기준으로 갱신했다.
- 현재 `.env.local`은 원격 Supabase origin이라 브라우저 로그인 전에 안전 실패한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.9 marketplace transaction local runbook이다. 이번 P60.8이 로그인 storage state 생성 스크립트라면, P60.9는 seed/auth/e2e 실행 순서와 막힘 조건을 운영 가능한 문서로 고정하는 작업이다.

검증:

- `node --check scripts/create_marketplace_transaction_storage_states.mjs`
- `npm run e2e:marketplace-transaction:auth`: 원격 Supabase origin에서 브라우저 로그인 전 안전 실패
- `npm run e2e:marketplace-transaction:ready`: 원격 Supabase origin, E2E password, fixture env, storage state 누락으로 안전 실패하며 seed/auth 명령 안내 확인

### marketplace transaction seed upsert implementation

- 이전 작업은 marketplace transaction seed runner 골격을 만든 P60.6이고, 이번 작업은 그 골격을 실제 local Supabase fixture upsert 스크립트로 완성한 P60.7이다.
- `seed_marketplace_transaction_fixture.mjs`가 local Supabase origin, service role key, E2E test password를 확인한 뒤에만 DB 쓰기를 수행한다.
- requester, forwarder, broker auth user를 생성/업데이트하고 같은 계정의 profile, company, party type, partner preference를 맞춘다.
- 운송 요청, 통관 의뢰, 요청 상세, partner match, 운송/통관 bid, bid detail을 synthetic fixture ID로 재실행 가능하게 upsert한다.
- 기존 fixture 요청 ID가 있으면 service request 삭제 cascade로 관련 거래 데이터를 정리한 뒤 다시 넣는다.
- source snapshot에는 `legalCertainty: false`를 남겨 E2E fixture가 법적 확정 결과처럼 보이지 않게 했다.
- 현재 `.env.local`은 원격 Supabase origin이라 DB 쓰기 전에 안전 실패한다.
- secret 값은 출력하지 않고, 출력은 non-secret fixture env export 힌트로 제한했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.8 marketplace transaction auth state script이다. 이번 P60.7이 DB fixture upsert라면, P60.8은 seeded requester/forwarder/broker 계정으로 로그인해 Playwright storage state를 만드는 작업이다.

검증:

- `node --check scripts/seed_marketplace_transaction_fixture.mjs`
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- `npm run e2e:marketplace-transaction:seed`: 원격 Supabase origin에서 DB 쓰기 전 안전 실패
- `npm run typecheck`
- `npm run lint`

### marketplace transaction seed runner skeleton

- 이전 작업은 marketplace transaction fixture 상수 모듈을 만든 P60.5이고, 이번 작업은 이 상수를 local Supabase에 넣는 guarded seed runner 골격을 만든 P60.6이다.
- `seed_marketplace_transaction_fixture.mjs`를 추가했다.
- `e2e:marketplace-transaction:seed` 스크립트를 추가했다.
- seed runner는 local Supabase origin, service role key, E2E test password를 확인한 뒤에만 다음 단계로 진행한다.
- 현재는 DB upsert 구현 전 skeleton이라, local guard 통과 후에도 fixture 사용자/회사/env export를 출력하고 다음 구현 단계로 중단하도록 했다.
- 현재 `.env.local`은 원격 Supabase origin이라 DB 쓰기 전에 안전 실패한다.
- secret 값은 출력하지 않는다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.7 marketplace transaction seed upsert implementation이다. 이번 P60.6이 seed runner 골격이라면, P60.7은 실제 local Supabase에 사용자/회사/역할/요청/입찰 fixture를 upsert하는 작업이다.

검증:

- `node --check scripts/seed_marketplace_transaction_fixture.mjs`
- `npm run e2e:marketplace-transaction:seed`: 원격 Supabase origin에서 DB 쓰기 전 안전 실패

### marketplace transaction fixture module

- 이전 작업은 marketplace transaction E2E fixture plan을 작성한 P60.4이고, 이번 작업은 seed/e2e/readiness가 공유할 fixture 상수 모듈과 테스트를 만든 P60.5다.
- `tests/fixtures/marketplace-transaction.fixture.mjs`를 추가했다.
- TypeScript wrapper와 `.d.mts` 타입 선언을 추가했다.
- requester, forwarder, broker 사용자/회사, 운송/통관 request/bid ID, storage state 파일명, env key를 한 원본으로 정의했다.
- `marketplaceTransactionEnvExports`로 readiness에 넣을 env export 힌트를 만들 수 있게 했다.
- fixture가 synthetic `E2E` 데이터이고 원문성 민감 토큰을 포함하지 않는지 테스트했다.
- transaction readiness와 E2E skeleton이 이 fixture 모듈을 참조하도록 연결했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.6 marketplace transaction seed runner skeleton이다. 이번 P60.5가 fixture 상수라면, P60.6은 이 상수를 local Supabase에 넣는 guarded seed runner 골격을 만드는 작업이다.

검증:

- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts`
- `node --check scripts/check_marketplace_transaction_e2e_readiness.mjs`
- `node --check scripts/e2e_marketplace_transaction_flow.mjs`
- `npm run e2e:marketplace-transaction:ready`: 원격 Supabase origin, fixture env, storage state 누락으로 안전 실패
- `npm run e2e:marketplace-transaction`: fixture env 누락으로 안전 실패

### marketplace transaction e2e fixture plan

- 이전 작업은 marketplace transaction E2E skeleton을 만든 P60.3이고, 이번 작업은 skeleton이 실제로 통과할 수 있는 local seed/auth fixture 구조를 설계한 P60.4다.
- `MARKETPLACE_TRANSACTION_E2E_FIXTURE_PLAN.md`를 추가했다.
- requester, forwarder, broker role별 storage state와 회사/역할/검증 상태를 정의했다.
- 운송/통관 request/bid fixture env 계약을 정의했다.
- 원격 Supabase 거부, secret 미출력, 실제 서류 미사용, synthetic 데이터 사용을 guardrail로 정리했다.
- E2E assertion 범위를 비로그인 보호, requester 상세 접근, partner opportunity 접근, 견적 비교/제출 문구 확인으로 정했다.
- 다음 구현 단계로 local seed runner와 auth-state script를 분리해 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.5 marketplace transaction fixture module이다. 이번 P60.4가 fixture plan 문서라면, P60.5는 seed/e2e/readiness가 공유할 fixture 상수 모듈과 테스트를 만드는 작업이다.

검증:

- fixture plan 문서 작성 및 ROADMAP/WORK_LOG 연결

### marketplace request transaction e2e script skeleton

- 이전 작업은 marketplace transaction E2E readiness를 만든 P60.2이고, 이번 작업은 준비된 role storage state로 운송/통관 거래 화면을 검증하는 guarded E2E skeleton을 만든 P60.3이다.
- `e2e_marketplace_transaction_flow.mjs`를 추가했다.
- E2E는 local base URL에서만 실행된다.
- requester, forwarder, broker storage state가 준비되어 있어야 한다.
- 운송/통관 request ID와 bid ID env가 준비되어 있어야 한다.
- 비로그인 요청 상세 접근은 `/login`으로 이동해야 한다.
- requester는 운송/통관 요청 상세에 접근 가능해야 하고, partner는 각 opportunity 상세에 접근 가능해야 한다.
- 현재 로컬 fixture env가 없으므로 실행 시 fixture env 누락으로 안전 실패한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.4 marketplace transaction e2e fixture plan이다. 이번 P60.3이 E2E skeleton이라면, P60.4는 이 skeleton이 실제로 통과할 수 있는 local seed/auth fixture 구조를 설계하는 작업이다.

검증:

- `node --check scripts/e2e_marketplace_transaction_flow.mjs`
- `npm run e2e:marketplace-transaction`: fixture env 누락으로 안전 실패

### marketplace request transaction e2e readiness

- 이전 작업은 core transaction E2E를 다음 병목으로 선택한 P60.1이고, 이번 작업은 화주 요청→파트너 입찰→화주 선정 흐름을 로컬에서 검증할 준비 상태를 점검하는 P60.2다.
- `check_marketplace_transaction_e2e_readiness.mjs`를 추가했다.
- readiness는 local Next.js, local Supabase, service-role key, E2E test password, role별 storage state, 운송/통관 request/bid fixture ID를 확인한다.
- role별 storage state 기준은 requester, forwarder, broker로 잡았다.
- 원격 Supabase origin에서는 safe-fail한다.
- secret 값은 출력하지 않는다.
- 아직 실제 거래 흐름 E2E script는 추가하지 않았고, P60.3에서 추가할 대상으로 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.3 marketplace request transaction e2e script skeleton이다. 이번 P60.2가 준비 상태 점검이라면, P60.3은 준비된 role storage state로 운송/통관 요청 상세, 파트너 입찰, 화주 선정 화면을 확인하는 guarded E2E skeleton을 만드는 작업이다.

검증:

- `node --check scripts/check_marketplace_transaction_e2e_readiness.mjs`
- `npm run e2e:marketplace-transaction:ready`: 원격 Supabase origin, E2E password, fixture env, storage state 누락으로 안전 실패

### platform next-area selection

- 이전 작업은 운영 사용자 관리 화면 변경 전체를 자체 리뷰한 P59.4이고, 이번 작업은 다음 플랫폼 MVP 병목을 다시 선택한 P60.1이다.
- 품명 검색 E2E와 완료 리포트/알림 E2E 준비는 있지만, 플랫폼 MVP 핵심 거래 흐름 E2E는 아직 없다.
- 다음 병목은 화주 요청 생성, 공개, 파트너 입찰, 화주 선정까지 이어지는 core transaction flow를 로컬에서 자동 검증할 수 없는 문제로 정했다.
- 운송과 통관 흐름을 모두 포함해야 하지만, 우선 fixture/readiness/e2e 골격을 만들어 원격 Supabase에서는 안전 실패하게 하는 것이 선행이다.
- 다음 구현 영역을 marketplace request transaction E2E readiness로 정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.2 marketplace request transaction e2e readiness다. 이번 P60.1이 다음 병목 선정이라면, P60.2는 로컬 Supabase와 role별 storage state, request/bid fixture ID 준비 여부를 점검하는 guarded readiness를 만드는 작업이다.

검증:

- `rg -n "e2e|storage state|freight request|clearance request|submit_freight_bid|publish_freight|select_service_bid|request flow" scripts tests docs app features server`
- `scripts/e2e_product_supplement_flow.mjs` 리뷰
- `rg -n "P60|authenticated e2e|요청.*E2E|marketplace.*E2E|fixture" docs/ROADMAP.md docs/WORK_LOG.md docs/*.md`

### operations users self-review

- 이전 작업은 사용자 상세 내부의 위험 신호와 평소 확인 정보를 분리한 P59.3이고, 이번 작업은 P59 운영 사용자 관리 화면 변경 전체를 자체 리뷰한 P59.4다.
- `OPERATIONS_USERS_SELF_REVIEW.md`를 추가했다.
- 대표 판단 기준, 나에게 요청할 문구, 사용자 상세 큐, 위험 작업 접힘 유지, 기존 기능 보존을 fixed 항목으로 정리했다.
- `/operations/users`의 `requireDeveloperRole` 유지, 기존 developer-only server action 유지, 테스트 로그인/삭제의 위험 작업 접힘 유지, DELETE 확인 유지 여부를 security 항목으로 정리했다.
- 인증된 developer 브라우저 본문 검증이 아직 storage state 부재로 제한된 점을 remaining risk로 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P60.1 platform next-area selection이다. 이번 P59.4가 운영 사용자 관리 화면 자체 리뷰라면, P60.1은 다시 다음 플랫폼 MVP 병목을 선택하는 작업이다.

검증:

- `rg -n "대표 판단 기준|나에게 요청할 문구|상세에서 먼저 볼 것|테스트·위험 작업|사용자 삭제|테스트 로그인|DELETE|generateManagedUserTestLoginLinkAction|deleteManagedUserAction" features/operations app/'(app)'/operations/users/page.tsx docs/WORK_LOG.md docs/ROADMAP.md`
- `rg -n "operations-users|user-management|developer|requireDeveloperRole|/operations/users" app features server docs`
- `npx vitest run features/operations/operations-users-priority-panel.test.ts features/operations/user-management-panel.test.ts`

### operations users detail density review

- 이전 작업은 사용자 관리 화면 상단의 대표용 우선순위 표면을 추가한 P59.2이고, 이번 작업은 펼쳐진 사용자 상세 내부에서 위험 신호와 평소 확인 정보를 더 분리한 P59.3이다.
- 사용자 상세 상단에 `상세에서 먼저 볼 것` 큐를 추가했다.
- 가입 추가정보 미완료, 허용 IP 초과, 운영 권한, 로그인 이력 없음, 회사명 누락을 우선 신호로 표시한다.
- 평범한 완료 사용자는 `평소 확인만 필요`로 표시해 과도한 위험감을 줄인다.
- 기존 기본정보 수정, 최근 접속 이력, 테스트 로그인, 삭제 기능은 제거하지 않았다.
- `buildManagedUserDetailCues` helper와 단위 테스트를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P59.4 operations users self-review다. 이번 P59.3이 사용자 상세 내부 UX 정리라면, P59.4는 P59 운영 사용자 관리 화면 변경 전체를 자체 리뷰하는 작업이다.

검증:

- `npx vitest run features/operations/user-management-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### operations users owner-mode priority surface

- 이전 작업은 다음 병목을 운영 사용자 관리 화면으로 정한 P59.1이고, 이번 작업은 사용자 관리 화면 상단에 대표가 먼저 볼 우선순위와 안전한 개선 요청 문구를 배치한 P59.2다.
- `OperationsUsersPriorityPanel`에 `대표 판단 기준` 영역을 추가했다.
- 역할 신청, 검증 증빙, 상태 이상 업체, 가입 미완료 사용자 순서로 대표가 나에게 요청할 수 있는 문구를 생성한다.
- 기존 사용자 생성, 수정, 삭제, 테스트 로그인 링크 기능은 제거하지 않았다.
- `buildOperationsUsersOwnerPrompt` helper를 추가하고 우선순위 회귀 테스트를 붙였다.
- 개발자 인증 storage state가 없어 브라우저 본문 검증은 제한됐고, 비인증 접근은 `/login`으로 이동해 운영 화면 본문이 노출되지 않음을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P59.3 operations users detail density review다. 이번 P59.2가 상단 우선순위 표면이라면, P59.3은 펼쳐진 사용자 상세 내부에서 위험 작업과 평소 확인 정보를 더 분리하는 작업이다.

검증:

- `npx vitest run features/operations/operations-users-priority-panel.test.ts`
- `npm run typecheck`
- `node -e "... playwright ... /operations/users ..."`: 비인증 상태에서 `/login`으로 이동
- `npm run lint`
- `npm run build`

### platform next-area selection

- 이전 작업은 marketplace notification inbox/read-state/read-action 변경을 자체 리뷰한 P58.1이고, 이번 작업은 다음 플랫폼 MVP 병목을 다시 선택한 P59.1이다.
- 플랫폼 거래 흐름, 파트너 알림, 읽음 처리, 완료 리포트 preview 기반은 1차로 이어졌다.
- 인증된 알림 E2E는 로컬 fixture가 필요하므로 현재 즉시 진행 가능한 기능 병목은 아니다.
- 다음 병목은 대표/운영자가 관리 화면을 보고 무엇을 확인하고 무엇을 나에게 맡겨야 하는지 이해하기 어려운 문제로 정했다.
- 특히 `/operations/users`는 사용자, 회사, 세션, 생성/수정/삭제/테스트 로그인 링크 기능이 한 화면에 모여 있어 대표가 보기 어렵다.
- 다음 구현 영역을 operations users owner-mode simplification으로 정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P59.2 operations users owner-mode priority surface다. 이번 P59.1이 다음 병목 선정이라면, P59.2는 실제 사용자 관리 화면 상단에 대표가 먼저 볼 우선순위와 안전한 개선 요청 문구를 배치하는 작업이다.

검증:

- `docs/ROADMAP.md` Platform Execution Rail 리뷰
- `rg -n "admin|관리|operations|대시보드|partner|verification|company|role|onboarding|fixture|remaining risk|다음 작업|P59" docs features app server`
- `rg --files app/'(app)' features server | rg '(operations|company|verification|members|partner-preferences|marketplace)'`

### marketplace notification final self-review

- 이전 작업은 인증된 파트너 세션으로 알림 표시/읽음 처리를 검증할 수 있게 한 P57.7이고, 이번 작업은 P57 전체 변경을 보안·UX·운영 관점에서 자체 리뷰한 P58.1이다.
- `MARKETPLACE_NOTIFICATION_INBOX_SELF_REVIEW.md`를 추가했다.
- 파트너 read RLS, dashboard read model, read-state RPC, dashboard read action, E2E readiness를 리뷰 범위로 정리했다.
- 민감정보 미조회, 직접 update 차단, RPC ownership check, audit log 기록을 fixed/security 항목으로 정리했다.
- 링크와 읽음 버튼 분리, 미확인 건수, 읽음 상태, empty state를 UX 항목으로 정리했다.
- 원격 Supabase readiness safe-fail과 로컬 fixture 미준비를 operations/remaining risk로 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P59.1 platform next-area selection이다. 이번 P58.1이 알림 inbox 묶음 자체 리뷰라면, P59.1은 다음 플랫폼 MVP 병목을 다시 고르는 작업이다.

검증:

- `rg -n "invoice|file_name|fileName|question|answer|message|metadata|document|download|personal|amount|total_amount|deliveryId|read_at|read_by|marketplace_notification_delivery_read" features/dashboard server/actions server/repositories/marketplace-notification-deliveries.repository.ts scripts/*marketplace_notification* supabase/migrations/20260531012000_platform_marketplace_schema.sql`
- `rg -n "partner reads own marketplace notification deliveries|mark_marketplace_notification_delivery_read|service role manages marketplace notification deliveries|grant update on public.marketplace_notification_deliveries|marketplace_notification_deliveries_unread_partner_idx" supabase/migrations/20260531012000_platform_marketplace_schema.sql server/repositories/platform-marketplace-governance.test.ts`

### marketplace notification authenticated e2e fixture

- 이전 작업은 대시보드 읽음 처리 버튼을 연결한 P57.6이고, 이번 작업은 인증된 파트너 세션으로 알림 표시/읽음 처리를 브라우저 자동 검증할 수 있게 한 P57.7이다.
- `e2e:marketplace-notification:ready` 스크립트를 추가했다.
- readiness는 local Next.js, local Supabase, service-role key, fixture request id, fixture delivery id, 파트너 storage state를 확인한다.
- `e2e:marketplace-notification` 스크립트를 추가했다.
- E2E는 파트너 storage state로 `/dashboard`에 접근해 파트너 알림 패널, 읽음 처리 버튼, 읽음 처리 후 상태 표시를 확인한다.
- 원격 Supabase에서 실수로 fixture/e2e를 실행하지 않도록 local origin guard를 넣었다.
- readiness 출력에는 secret 값을 표시하지 않는다.
- 현재 `.env.local`은 원격 Supabase origin이라 readiness는 안전하게 실패하는 상태가 맞다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P58.1 marketplace notification final self-review다. 이번 P57.7이 인증 브라우저 검증 준비라면, P58.1은 P57 전체 알림 inbox/read-state/read-action 변경을 보안·UX·운영 관점에서 자체 리뷰하는 작업이다.

검증:

- `node --check scripts/check_marketplace_notification_e2e_readiness.mjs`
- `node --check scripts/e2e_marketplace_notification_dashboard.mjs`
- `npm run e2e:marketplace-notification:ready`: 원격 Supabase origin, fixture env, storage state 누락으로 안전 실패

### marketplace notification read action UI

- 이전 작업은 알림 read-state 기준을 만든 P57.5이고, 이번 작업은 사용자가 대시보드에서 알림을 읽음 처리할 수 있게 한 P57.6이다.
- `markMarketplaceNotificationReadAction` 서버 액션을 추가했다.
- 서버 액션은 현재 Supabase 세션으로 `mark_marketplace_notification_delivery_read` RPC를 호출하고 `/dashboard`를 revalidate한다.
- FormData parser를 별도 helper로 분리해 서버 액션 export 규칙과 테스트 가능성을 분리했다.
- 대시보드 파트너 알림 항목을 상세 보기 링크와 읽음 처리 버튼으로 나눴다.
- 읽음 처리 버튼은 미확인 알림에만 보이고, 이미 읽은 알림은 `읽음` 상태로 표시한다.
- 인증된 대시보드 본문 브라우저 검증은 로컬 로그인 storage state가 없어 제한됐고, 비인증 상태에서는 `/login`으로 이동해 알림/읽음 버튼이 노출되지 않음을 확인했다.
- 새 migration 파일은 만들지 않았고, P57.5에서 수정한 marketplace migration 초안의 RPC를 사용한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.7 marketplace notification authenticated e2e fixture다. 이번 P57.6이 실제 읽음 버튼 연결이라면, P57.7은 로컬 Supabase에서 인증된 파트너 세션으로 알림 표시/읽음 처리까지 브라우저 자동 검증할 수 있는 fixture를 준비하는 작업이다.

검증:

- `npx vitest run server/actions/marketplace-notification.actions.test.ts server/repositories/marketplace-notification-deliveries.repository.test.ts features/dashboard/marketplace-notification-inbox.test.ts`
- `npm run typecheck`
- `npm run lint`
- `node -e "... playwright mobile ... /dashboard ..."`: 비인증 상태에서 `/login`으로 이동하고 알림/읽음 버튼은 노출되지 않음
- `npm run build`

### marketplace notification read-state design

- 이전 작업은 파트너가 대시보드에서 인앱 알림을 확인하게 한 P57.4이고, 이번 작업은 사용자가 본 알림과 아직 확인하지 않은 알림을 구분할 read-state 기준을 만든 P57.5다.
- `marketplace_notification_deliveries`에 `read_at`, `read_by` 초안을 추가했다.
- 인앱 알림 미확인 목록 조회를 받을 수 있도록 `marketplace_notification_deliveries_unread_partner_idx` 초안을 추가했다.
- 직접 update RLS를 열지 않고 `mark_marketplace_notification_delivery_read` RPC로만 읽음 처리하도록 했다.
- 읽음 RPC는 로그인 사용자, 현재 회사, `in_app` 채널, `claimed/sent` 상태, 자기 회사 delivery만 허용한다.
- 읽음 처리는 `audit_logs`에 `marketplace_notification_delivery_read`로 남긴다.
- repository에 `markMarketplaceNotificationDeliveryRead` wrapper와 `readAt` 매핑을 추가했다.
- 대시보드 알림 패널은 `readAt` 기준으로 미확인 건수와 확인 완료 상태를 표시한다.
- migration 초안만 수정했고 DB에는 적용하지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.6 marketplace notification read action UI다. 이번 P57.5가 읽음 상태 저장 기준이라면, P57.6은 대시보드에서 사용자가 알림을 읽음 처리할 수 있는 서버 액션과 버튼을 붙이는 작업이다.

검증:

- `npx vitest run server/repositories/marketplace-notification-deliveries.repository.test.ts server/repositories/platform-marketplace-governance.test.ts features/dashboard/marketplace-notification-inbox.test.ts`
- `npx supabase db lint --local`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace notification inbox UI surface

- 이전 작업은 파트너/운영자가 읽을 알림 목록 read model을 만든 P57.3이고, 이번 작업은 파트너가 대시보드에서 인앱 알림을 실제로 확인하게 한 P57.4다.
- 대시보드에서 `listMarketplaceNotificationInbox`를 호출해 최근 인앱 알림 5건을 로드한다.
- `DashboardMarketplaceEntry`의 다음 행동 영역 옆에 `파트너 알림` 패널을 추가했다.
- 알림 패널은 요청명, 요청 유형, 알림 종류, 알림 상태, 요청 상태, 마감일만 표시한다.
- 서류, 질문/답변, bid 상세, metadata, 송장 내용은 노출하지 않는다.
- 운송 알림은 `/requests/freight/opportunities/:requestId`, 통관 알림은 `/requests/clearance/opportunities/:requestId`로 이동한다.
- dashboard helper를 분리해 링크/라벨 규칙을 테스트 가능하게 만들었다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.5 marketplace notification read-state design이다. 이번 P57.4가 알림 노출이라면, P57.5는 사용자가 본 알림과 아직 확인하지 않은 알림을 구분할 수 있는 read-state 설계/스키마 여부를 정하는 작업이다.

검증:

- `npx vitest run features/dashboard/marketplace-notification-inbox.test.ts server/repositories/marketplace-notification-deliveries.repository.test.ts`
- `npm run typecheck`
- `node -e "... playwright ... /dashboard ..."`: 비인증 상태에서 `/login`으로 이동하고 대시보드 알림 본문은 노출되지 않음
- `npm run lint`
- `npm run build`

### marketplace notification inbox repository

- 이전 작업은 파트너가 자기 회사 알림만 읽을 수 있게 RLS를 추가한 P57.2이고, 이번 작업은 파트너/운영자가 읽을 알림 목록 read model을 만든 P57.3이다.
- `listMarketplaceNotificationInbox`를 추가했다.
- 조회 대상은 `channel = in_app`, `status in (claimed, sent)` 알림으로 제한했다.
- 요청 상세/서류/메시지/metadata가 아니라 목록 표시용 `title`, `request_type`, `status`, `deadline_at`만 join해 반환한다.
- 반환 타입은 UI가 바로 쓰기 쉬운 camelCase `MarketplaceNotificationInboxItem`으로 분리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.4 marketplace notification inbox UI surface다. 이번 P57.3이 서버 read model이라면, P57.4는 대시보드/파트너 화면에서 이 알림을 실제로 볼 수 있게 노출하는 작업이다.

검증:

- `npx vitest run server/repositories/marketplace-notification-deliveries.repository.test.ts`

### platform marketplace next-area selection

- 이전 작업은 marketplace notification self-review인 P56.1이고, 이번 작업은 다음 플랫폼 MVP 병목을 고른 P57.1이다.
- worker가 delivery를 claim해도 사용자가 앱 안에서 알림을 보는 inbox UI/read model이 아직 없다는 점을 확인했다.
- 다음 구현 영역을 marketplace notification inbox로 정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.2 marketplace notification partner read RLS다. 이번 P57.1이 다음 병목 선정이라면, P57.2는 파트너가 자기 회사 알림만 읽을 수 있게 RLS를 추가하는 작업이다.

검증:

- `rg -n "marketplace_notification_deliveries|notification|알림" app features server docs`
- `server/repositories/marketplace-notification-deliveries.repository.ts` 코드 리뷰
- `supabase/migrations/20260531012000_platform_marketplace_schema.sql` RLS 리뷰

### marketplace notification partner read RLS

- 이전 작업은 알림 inbox를 다음 병목으로 선정한 P57.1이고, 이번 작업은 파트너가 자기 회사 알림만 읽을 수 있게 RLS를 추가한 P57.2다.
- `marketplace_notification_deliveries`에 `partner reads own marketplace notification deliveries` select policy를 추가했다.
- 조건은 `partner_company_id = public.current_company_id()`로 제한했다.
- staff read policy와 service role manage policy는 유지했다.
- migration 초안만 수정했고 DB에는 적용하지 않았다.
- 새 별도 migration 파일은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.3 marketplace notification inbox repository다. 이번 P57.2가 RLS 추가라면, P57.3은 파트너/운영자가 읽을 알림 목록 read model을 만드는 작업이다.

검증:

- `rg -n "partner reads own marketplace notification deliveries|staff reads marketplace notification deliveries|service role manages marketplace notification deliveries|partner_company_id = public.current_company_id" supabase/migrations/20260531012000_platform_marketplace_schema.sql`
- `npx supabase db lint --local`

### marketplace notification final self-review

- 이전 작업은 provider 실패 상태 의미를 runbook에 반영한 P55.2이고, 이번 작업은 marketplace notification readiness/provider/worker 변경 전체를 자체 리뷰한 P56.1이다.
- `MARKETPLACE_NOTIFICATION_SELF_REVIEW.md`를 추가했다.
- unsupported provider readiness, claim-only/sent 혼동, sender failure coverage를 fixed 항목으로 정리했다.
- provider allowlist, `internal_dry_run` no external delivery, metadata sanitizer, provider error normalization을 safety check로 정리했다.
- 실제 외부 provider 미연결, protected job route의 infra error 반환, production job 미실행을 remaining risk로 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P57.1 platform marketplace next-area selection이다. 이번 P56.1이 알림 자체 리뷰라면, P57.1은 다음 플랫폼 MVP 병목 영역을 다시 선택하는 작업이다.

검증:

- `rg -n "sent|claimedWithoutSenderCount|internal_dry_run|not supported|retryable_failed|provider_" server/jobs/marketplace-notification* server/repositories/marketplace-notification-deliveries.repository.ts docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md`
- `rg -n "file_name|fileName|question|answer|message|personal|invoice|amount|total_amount" server/jobs/marketplace-notification* server/notifications/marketplace-notification-policy.ts server/repositories/marketplace-notification-deliveries.repository.ts docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md`
- `npx vitest run server/jobs/marketplace-notification-worker.service.test.ts server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-provider.test.ts server/repositories/marketplace-notification-deliveries.repository.test.ts server/notifications/marketplace-notification-policy.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace notification failure runbook sync

- 이전 작업은 sender 실패 시 실패 기록과 count를 테스트한 P55.1이고, 이번 작업은 provider 실패 상태 의미를 runbook에 반영한 P55.2다.
- runbook에 `실패 상태 해석` 섹션을 추가했다.
- sender 실패는 기본적으로 `retryable_failed`로 기록된다고 명시했다.
- provider 오류 원문은 저장하지 않고 정규화된 provider error code로 저장한다고 명시했다.
- `failedSendCount`가 증가한 실행을 외부 발송 성공으로 안내하면 안 된다고 명시했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P56.1 marketplace notification final self-review다. 이번 P55.2가 실패 runbook 문서화라면, P56.1은 알림 readiness/provider/worker 변경 전체를 자체 리뷰하는 작업이다.

검증:

- `rg -n "retryable_failed|provider_timeout|provider_rate_limited|provider_auth_error|provider_send_failed|failedSendCount" docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md server/repositories/marketplace-notification-deliveries.repository.ts server/jobs/marketplace-notification-worker.service.test.ts`

### marketplace notification worker send failure review

- 이전 작업은 worker 결과 필드 해석을 runbook에 정리한 P54.2이고, 이번 작업은 sender 실패 시 실패 기록과 count를 테스트한 P55.1이다.
- sender가 throw하면 `failedSendCount`가 1 증가하는지 확인했다.
- sender 실패 시 `sentCount`는 증가하지 않는다.
- sender가 있었기 때문에 `claimedWithoutSenderCount`도 증가하지 않는다.
- delivery update가 `retryable_failed` 상태와 정규화된 `provider_timeout` error message로 호출되는지 확인했다.
- raw provider error message를 그대로 저장하지 않는 기존 안전 동작을 테스트로 고정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P55.2 marketplace notification failure runbook sync다. 이번 P55.1이 sender 실패 테스트라면, P55.2는 provider 실패 시 운영자가 볼 상태와 retryable_failed 의미를 문서화하는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-worker.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace notification worker result route smoke

- 이전 작업은 worker 결과에 `claimedWithoutSenderCount`를 추가한 P54.1이고, 이번 작업은 route 응답 결과 필드 해석을 runbook에 정리한 P54.2다.
- API route는 worker result를 그대로 JSON으로 반환하므로 별도 코드 변경은 하지 않았다.
- runbook에 `결과 필드 해석` 표를 추가했다.
- `claimedWithoutSenderCount`는 sender 없이 claim만 된 건수이며 외부 발송 완료가 아니라고 명시했다.
- `sentCount`, `failedSendCount`, `skippedDuplicateCount`의 의미를 함께 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P55.1 marketplace notification worker send failure review다. 이번 P54.2가 결과 필드 문서화라면, P55.1은 sender 실패 시 실패 기록과 count가 정확한지 테스트하는 작업이다.

검증:

- `rg -n "claimedWithoutSenderCount|sentCount|failedSendCount|skippedDuplicateCount|결과 필드 해석" docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md server/jobs/marketplace-notification-worker.service.ts server/jobs/marketplace-notification-worker.service.test.ts`

### marketplace notification worker result clarity

- 이전 작업은 runbook provider 목록을 코드 allowlist 기준과 맞춘 P53.2이고, 이번 작업은 worker 결과에서 claim-only와 sent를 구분한 P54.1이다.
- `MarketplaceNotificationWorkerResult`에 `claimedWithoutSenderCount`를 추가했다.
- sender 없이 delivery claim만 된 건은 `claimedWithoutSenderCount`에 집계한다.
- sender가 있고 sent 처리까지 완료된 건은 기존처럼 `sentCount`에 집계하며 `claimedWithoutSenderCount`는 증가하지 않는다.
- dry-run에서는 `claimedWithoutSenderCount`가 0이다.
- runbook에 sender 없이 claim된 건은 외부 발송 완료가 아니라고 명시했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P54.2 marketplace notification worker result route smoke다. 이번 P54.1이 worker result 필드 추가라면, P54.2는 route 응답에서 새 필드가 깨지지 않는지 smoke 기준을 정리하는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-worker.service.test.ts server/jobs/marketplace-notification-send-readiness.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace notification send provider docs sync

- 이전 작업은 provider allowlist를 코드에서 중앙화한 P53.1이고, 이번 작업은 runbook provider 목록을 코드 allowlist 기준과 맞춘 P53.2다.
- runbook에 `지원 provider` 섹션을 추가했다.
- 현재 지원 provider는 `internal_dry_run`뿐이라고 명시했다.
- `internal_dry_run`은 외부 발송이 없고 delivery claim 후 provider id 기록만 확인하는 리허설이라고 명시했다.
- 그 외 provider 값은 발송 준비 완료로 보지 않는다고 명시했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P54.1 marketplace notification worker result clarity다. 이번 P53.2가 provider 문서 정리라면, P54.1은 worker 결과가 claim-only와 sent를 운영자가 혼동하지 않게 필드 의미를 점검하는 작업이다.

검증:

- `rg -n "지원 provider|internal_dry_run|외부 발송 여부|지원하지 않는다|MARKETPLACE_NOTIFICATIONS_PROVIDER" docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md server/jobs/marketplace-notification-provider.ts`

### marketplace notification provider union centralization

- 이전 작업은 unsupported provider runbook 설명을 맞춘 P52.3이고, 이번 작업은 지원 provider 문자열 중복을 줄인 P53.1이다.
- `marketplaceNotificationProviderNames` allowlist를 provider module에서 export하도록 했다.
- `MarketplaceNotificationProviderName` 타입은 allowlist에서 파생되도록 했다.
- send readiness는 별도 문자열 배열을 갖지 않고 provider allowlist를 사용한다.
- provider 테스트에서 allowlist가 `internal_dry_run`만 포함하는지 확인한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P53.2 marketplace notification send provider docs sync다. 이번 P53.1이 provider allowlist 중앙화라면, P53.2는 runbook의 provider 목록을 코드 allowlist 기준과 맞추는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-provider.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### marketplace notification readiness route consistency

- 이전 작업은 send readiness가 지원 provider인지 검증하게 한 P52.2이고, 이번 작업은 route 응답과 runbook의 unsupported provider 설명을 맞춘 P52.3이다.
- `MARKETPLACE_NOTIFICATIONS_PROVIDER=email` 같은 unsupported provider도 `Marketplace notification sending is not ready.` 응답 안의 readiness reason으로 차단된다고 runbook에 명시했다.
- 예상 reason `MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported.`를 runbook에 추가했다.
- `internal_dry_run` 리허설 경로가 외부 발송이 아니라는 기존 주의 문구는 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P53.1 marketplace notification provider union centralization이다. 이번 P52.3이 runbook 정합성이라면, P53.1은 supported provider 목록과 provider factory의 문자열 중복을 줄이는 작업이다.

검증:

- `rg -n "not supported|Marketplace notification sending is not ready|internal_dry_run|MARKETPLACE_NOTIFICATIONS_PROVIDER" docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-send-readiness.ts`

### marketplace notification supported provider readiness

- 이전 작업은 완료 리포트 이후 다음 영역을 marketplace notification send readiness로 정한 P52.1이고, 이번 작업은 readiness가 지원 provider인지까지 검증하게 한 P52.2다.
- `MARKETPLACE_NOTIFICATIONS_PROVIDER`가 설정되어 있어도 지원하지 않는 값이면 ready=false가 되도록 했다.
- 현재 지원 provider는 `internal_dry_run`뿐이다.
- `MARKETPLACE_NOTIFICATIONS_PROVIDER=email` 같은 값은 `MARKETPLACE_NOTIFICATIONS_PROVIDER is not supported.` reason을 반환한다.
- 관련 단위 테스트를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P52.3 marketplace notification readiness route consistency다. 이번 P52.2가 readiness helper 수정이라면, P52.3은 route 응답과 runbook이 unsupported provider 실패를 일관되게 설명하는지 맞추는 작업이다.

검증:

- `npx vitest run server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-provider.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### platform request completion report next-area selection

- 이전 작업은 완료 리포트 preview/e2e/readiness 묶음을 자체 리뷰한 P51.1이고, 이번 작업은 다음으로 이어갈 플랫폼 요청 영역을 정한 P52.1이다.
- 플랫폼 MVP에서 요청 공개 후 파트너가 알림을 받는 흐름이 다음 병목이라고 판단했다.
- marketplace notification worker, provider, send readiness, runbook을 확인했다.
- 현재 실제 외부 이메일/문자/푸시 provider는 연결하지 않고 `internal_dry_run` 리허설 경로만 있다.
- send readiness가 provider 문자열 존재만 확인하고 지원 provider인지까지는 readiness 단계에서 검증하지 않는 점을 다음 작업으로 잡았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P52.2 marketplace notification supported provider readiness다. 이번 P52.1이 다음 영역 선정이라면, P52.2는 send readiness가 provider 존재뿐 아니라 지원 provider인지도 검증하게 하는 작업이다.

검증:

- `server/jobs/marketplace-notification-worker.service.ts` 코드 리뷰
- `server/jobs/marketplace-notification-provider.ts` 코드 리뷰
- `server/jobs/marketplace-notification-send-readiness.ts` 코드 리뷰
- `docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md` 문서 리뷰

### completion report final self-review

- 이전 작업은 fallback copy를 helper로 분리하고 테스트한 P50.2이고, 이번 작업은 완료 리포트 preview/e2e/readiness 변경 전체를 자체 리뷰한 P51.1이다.
- `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_FINAL_SELF_REVIEW.md`를 추가했다.
- route kind/report type mismatch, latest report selection overwrite, printed source URL 누락, schema fallback silent failure를 fixed 항목으로 정리했다.
- authenticated browser body review가 local Supabase/storage state 부재로 막힌 점을 accepted risk로 정리했다.
- source/version/date metadata, safety notice, 민감정보 미노출, local-only seed/e2e guard를 safety check로 정리했다.
- 현재 작업 트리에 local-only platform 변경과 untracked 파일이 많고, 커밋/푸시/DB migration 적용/배포는 하지 않았음을 명시했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P52.1 platform request completion report next-area selection이다. 이번 P51.1이 완료 리포트 preview 자체 리뷰라면, P52.1은 다음으로 이어갈 플랫폼 요청 영역을 정하는 작업이다.

검증:

- `rg -n "guaranteed|confirmed|definitely|확정|보장|요건 없음|requirements absent|download|다운로드|fileName|question|answer|message" features/service-requests scripts tests/fixtures docs/SERVICE_REQUEST_COMPLETION_REPORT*`
- `rg -n "localhost|127\\.0\\.0\\.1|SUPABASE_SERVICE_ROLE_KEY|secretValues=not-printed|service role|production|remote|원격" scripts/*completion* docs/SERVICE_REQUEST_COMPLETION_REPORT*`
- `git status --short`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report schema fallback copy extraction

- 이전 작업은 schemaReady false일 때 사용자용 fallback UI를 추가한 P50.1이고, 이번 작업은 그 fallback 문구를 helper로 분리해 테스트 가능하게 만든 P50.2다.
- `completionReportPreviewUnavailableCopy` helper를 추가했다.
- preview page는 fallback 문구를 helper에서 가져오도록 수정했다.
- fallback copy 테스트에서 `schema`, `table`, `SQL`, `DB` 같은 내부 단어가 사용자 문구에 들어가지 않는지 확인한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P51.1 completion report final self-review다. 이번 P50.2가 fallback copy 테스트라면, P51.1은 완료 리포트 preview/e2e/readiness 변경 전체를 자체 리뷰하고 남은 위험을 정리하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-fallback-copy.test.ts features/service-requests/service-request-completion-report-preview-route.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report repository schema fallback review

- 이전 작업은 preview page가 단일 request의 report를 명시적으로 선택하게 한 P49.2이고, 이번 작업은 schemaReady false일 때 화면이 조용히 404가 되지 않게 한 P50.1이다.
- 완료 리포트 저장소 또는 보관 서류 연결 정보를 확인할 수 없을 때 사용자용 안내 화면을 렌더링한다.
- 내부 DB 오류명이나 schema 이름은 사용자에게 직접 노출하지 않는다.
- 문구는 잠시 후 재시도와 운영자에게 완료 리포트 미리보기 상태 확인 요청으로 제한했다.
- report table schemaReady false와 document mapping schemaReady false를 모두 처리한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P50.2 completion report schema fallback copy extraction이다. 이번 P50.1이 fallback UI 추가라면, P50.2는 fallback 문구를 helper로 분리해 테스트 가능하게 만드는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview single-request selection helper

- 이전 작업은 request별 여러 report를 record로 바꿀 때 최신순 첫 report를 유지하게 한 P49.1이고, 이번 작업은 preview page가 단일 request의 report 선택 기준을 helper로 명시하게 한 P49.2다.
- `selectCompletionReportForRequest` helper를 추가했다.
- preview page는 더 이상 `reports.items[0]`을 직접 쓰지 않고 requestId 기준 helper를 사용한다.
- helper는 `serviceRequestCompletionReportListToRecord`와 같은 기준을 사용해 최신순 첫 report를 선택한다.
- 없는 requestId는 `undefined`를 반환하도록 테스트했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P50.1 completion report repository schema fallback review다. 이번 P49.2가 report 선택 기준이라면, P50.1은 schemaReady false일 때 사용자/운영자 화면이 어떻게 보이는지 점검하는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-completion-report.repository.test.ts features/service-requests/service-request-completion-report-preview-route.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview repository ordering review

- 이전 작업은 mismatched kind URL을 e2e assertion에 추가한 P48.2이고, 이번 작업은 request별 여러 완료 리포트가 있을 때 최신 non-voided report 선택 기준을 점검한 P49.1이다.
- `listOwnCompletionReportsForRequests`는 `updated_at desc`로 정렬해 최신 리포트를 먼저 가져온다.
- `serviceRequestCompletionReportListToRecord`가 같은 requestId를 만났을 때 뒤의 오래된 리포트로 덮어쓸 수 있는 문제를 수정했다.
- 이제 record 변환 시 첫 리포트를 유지하고 이후 같은 requestId는 무시한다.
- 해당 동작을 repository 단위 테스트로 고정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P49.2 completion report preview single-request selection helper다. 이번 P49.1이 record 변환 기준이라면, P49.2는 preview page가 단일 request의 report를 명시적으로 고르는 helper를 사용하게 하는 작업이다.

검증:

- `npx vitest run server/repositories/service-request-completion-report.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview route guard e2e assertion

- 이전 작업은 route kind와 report request type mismatch를 helper로 차단한 P48.1이고, 이번 작업은 같은 규칙을 e2e assertion에 추가한 P48.2다.
- `scripts/e2e_completion_report_preview_flow.mjs`에 mismatched kind assertion을 추가했다.
- developer 세션 기준으로 freight route + clearance request id, clearance route + freight request id 조합에서 preview 본문이 노출되지 않아야 한다.
- 현재 storage state가 없으므로 본문 e2e는 실행하지 못했고, storage state 없음 상태에서 안전 실패하는 것을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P49.1 completion report preview repository ordering review다. 이번 P48.2가 route guard e2e assertion이라면, P49.1은 request별 여러 report가 있을 때 최신 non-voided report 선택 기준을 점검하는 작업이다.

검증:

- `npm run e2e:completion-preview` storage state 없음 상태에서 안전 중단 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview route kind guard

- 이전 작업은 모바일 비로그인 preview 접근을 브라우저로 확인한 P47.1이고, 이번 작업은 route kind와 report request type이 어긋난 preview 접근을 차단한 P48.1이다.
- `canShowCompletionReportPreviewForRoute` helper를 추가했다.
- preview page에서 report가 없거나, voided이거나, route kind와 report request type이 다르면 `notFound()` 처리하도록 했다.
- `/requests/freight/{clearanceRequestId}/completion-report/preview` 같은 잘못된 kind URL이 route kind 기준으로 잘못 렌더링되는 것을 막았다.
- route guard 단위 테스트를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P48.2 completion report preview route guard e2e assertion이다. 이번 P48.1이 route guard helper라면, P48.2는 잘못된 kind URL이 본문을 노출하지 않는지 e2e assertion에 추가하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview-route.test.ts features/service-requests/service-request-completion-report-source-url.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview mobile unauth review

- 이전 작업은 unsafe source URL 노출 방지 테스트를 추가한 P46.2이고, 이번 작업은 모바일 폭에서 비로그인 preview 접근 흐름을 확인한 P47.1이다.
- Playwright viewport `390x844`에서 freight completion preview URL에 접근했다.
- 모바일 폭에서도 `/login`으로 이동하는 것을 확인했다.
- 로그인 문구가 표시되는 것을 확인했다.
- preview 본문인 `완료 리포트 미리보기`가 비로그인 모바일 화면에 표시되지 않는 것을 확인했다.
- screenshot을 `tmp/browser-review/completion-preview-mobile-login-redirect.png`에 저장했다.
- 실제 완료 리포트 본문 모바일 레이아웃은 local Supabase/storage state 준비 후 확인해야 하므로 P47.2로 분리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P47.2 completion report preview authenticated mobile body review다. 이번 P47.1이 모바일 비로그인 redirect라면, P47.2는 storage state 준비 후 실제 완료 리포트 본문 모바일 레이아웃을 확인하는 작업이다.

검증:

- Playwright mobile local browser check: freight preview 비로그인 접근 시 `/login` 이동, login text 표시, preview 본문 미노출 확인

### completion report preview unsafe source URL regression

- 이전 작업은 인쇄본에도 공식 출처 URL이 남게 한 P46.1이고, 이번 작업은 unsafe source URL이 preview 링크/텍스트로 노출되지 않는 규칙을 테스트로 고정한 P46.2다.
- `service-request-completion-report-source-url.ts`를 추가했다.
- preview document의 source URL 판정을 `safeCompletionReportSourceHref` helper로 분리했다.
- `http://`, `https://` source URL은 허용한다.
- `javascript:`, `data:`, 상대 경로, 빈 값은 `null`로 처리해 링크와 print URL 텍스트에 노출되지 않도록 했다.
- `service-request-completion-report-source-url.test.ts`를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P47.1 completion report preview mobile layout review다. 이번 P46.2가 source URL 안전성 테스트라면, P47.1은 preview 문서가 모바일 폭에서 ID/source/checksum 텍스트를 깨지 않게 표시되는지 확인하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-source-url.test.ts features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview print/source UX review

- 이전 작업은 인증 후 브라우저 리뷰를 막는 조건을 정리한 P45.2이고, 이번 작업은 현재 preview 문서의 print/source/safety UI를 코드 기준으로 다시 점검한 P46.1이다.
- print 모드에서는 `출처 열기` 버튼이 숨겨지지만 공식 출처 URL 텍스트도 남지 않는 문제를 확인했다.
- source lock metadata 영역에 `출처 URL` 행을 추가해 인쇄본에도 공식 출처 URL이 남도록 수정했다.
- `http://` 또는 `https://`가 아닌 source URL은 기존처럼 링크로 만들지 않고 `-`로 표시한다.
- safety notice와 source snapshot version, published_at, checksum 표시는 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P46.2 completion report preview unsafe source URL regression이다. 이번 P46.1이 인쇄 source URL 보강이라면, P46.2는 unsafe source URL이 preview 링크/텍스트로 노출되지 않는 규칙을 테스트로 고정하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview.test.ts features/service-requests/service-request-completion-report-labels.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report authenticated browser review unblock plan

- 이전 작업은 비로그인 preview 접근을 로컬 브라우저로 확인한 P45.1이고, 이번 작업은 로그인 후 본문 preview 화면 확인을 막는 조건을 정리한 P45.2다.
- `SERVICE_REQUEST_COMPLETION_REPORT_AUTHENTICATED_BROWSER_REVIEW_UNBLOCK.md`를 추가했다.
- 현재 readiness 결과상 `.env.local`이 원격 Supabase origin을 가리키는 점을 기록했다.
- `E2E_TEST_PASSWORD`와 role별 storage state가 없는 점을 기록했다.
- local Supabase, local service role key, 테스트 비밀번호, Next.js 서버 준비 조건을 정리했다.
- 준비 후 실행 순서를 ready, seed, auth, e2e로 정리했다.
- 로그인 후 브라우저 리뷰 범위를 requester, selected partner, developer, unmatched partner × freight/clearance로 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P46.1 completion report preview print/source UX review다. 이번 P45.2가 인증 브라우저 unblock 문서라면, P46.1은 현재 구현된 preview 문서 화면의 인쇄/source/safety UI를 코드 기준으로 다시 점검하는 작업이다.

검증:

- `npm run e2e:completion-preview:ready` local Supabase URL, E2E_TEST_PASSWORD, storage state 없음 상태에서 안전 실패 확인

### completion report preview UI browser review

- 이전 작업은 e2e fixture와 runbook의 권한 matrix를 맞춘 P44.3이고, 이번 작업은 실제 로컬 브라우저에서 preview URL의 비로그인 접근 흐름을 확인한 P45.1이다.
- Playwright로 freight preview URL과 clearance preview URL에 비로그인 상태로 접근했다.
- 두 URL 모두 `http://localhost:3100/login`으로 이동했다.
- 로그인 화면의 `로그인` 문구가 표시되는 것을 확인했다.
- preview 본문인 `완료 리포트 미리보기`가 비로그인 상태에서 표시되지 않는 것을 확인했다.
- screenshot을 `tmp/browser-review/completion-preview-freight-login-redirect.png`, `tmp/browser-review/completion-preview-clearance-login-redirect.png`에 저장했다.
- 현재 local Supabase/storage state가 준비되지 않아 로그인 후 본문 preview 화면은 아직 브라우저로 확인하지 못했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P45.2 completion report authenticated browser review unblock plan이다. 이번 P45.1이 비로그인 redirect 확인이라면, P45.2는 local Supabase/storage state 준비 후 본문 화면을 브라우저로 볼 수 있게 막힌 조건을 정리하는 작업이다.

검증:

- Playwright local browser check: freight/clearance preview 비로그인 접근 시 `/login` 이동, login text 표시, preview 본문 미노출 확인

### completion report e2e fixture documentation sync

- 이전 작업은 auth/e2e 스크립트가 공통 fixture의 이메일과 요청 ID를 쓰게 한 P44.2이고, 이번 작업은 실제 권한 matrix를 fixture, e2e, runbook에 같이 반영한 P44.3이다.
- `completionReportPreviewAccessMatrix`를 fixture에 추가했다.
- fixture 테스트에서 requester, selectedPartner, developer, unmatchedPartner가 freight/clearance 양쪽에 대해 어떤 접근 결과를 가져야 하는지 확인한다.
- `scripts/e2e_completion_report_preview_flow.mjs`는 하드코딩된 role별 assertion 대신 fixture access matrix를 순회하도록 수정했다.
- runbook의 검증 범위를 requester/selected partner/developer/mismatched partner × 운송/통관 기준으로 갱신했다.
- 현재 storage state가 없으므로 본문 e2e는 실행하지 못했고, storage state 없음 상태에서 안전 실패하는 것을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P45.1 completion report preview UI browser review다. 이번 P44.3이 e2e fixture 정합성이라면, P45.1은 실제 로컬 브라우저에서 preview/login 흐름의 화면 상태를 확인하는 작업이다.

검증:

- `npx vitest run tests/fixtures/completion-report-preview.fixture.test.ts`
- `npm run e2e:completion-preview` storage state 없음 상태에서 안전 중단 확인
- `rg -n "요청자는 운송/통관|선정 파트너는 운송/통관|developer는 운송/통관|미선정 파트너는 운송/통관" docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e fixture id reuse in auth/e2e

- 이전 작업은 seed script가 공통 fixture를 사용하게 한 P44.1이고, 이번 작업은 auth storage 생성 스크립트와 e2e 본문 스크립트도 같은 fixture 원본을 보게 한 P44.2다.
- `scripts/create_completion_report_preview_storage_states.mjs`의 role별 이메일을 `completionReportPreviewFixture`에서 가져오도록 수정했다.
- `scripts/e2e_completion_report_preview_flow.mjs`의 freight/clearance request id를 `completionReportPreviewFixture`에서 가져오도록 수정했다.
- auth script는 현재 `E2E_TEST_PASSWORD` 없음 상태에서 안전하게 중단하는 것을 확인했다.
- e2e script는 현재 storage state 없음 상태에서 auth script를 먼저 실행하라고 안내하는 것을 확인했다.
- fixture 테스트는 계속 통과한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P44.3 completion report e2e fixture documentation sync다. 이번 P44.2가 auth/e2e fixture 원본 통일이라면, P44.3은 runbook과 fixture 테스트가 실제 권한 matrix를 빠뜨리지 않게 문서화하는 작업이다.

검증:

- `npm run e2e:completion-preview:auth` E2E_TEST_PASSWORD 없음 상태에서 안전 중단 확인
- `npm run e2e:completion-preview` storage state 없음 상태에서 안전 중단 확인
- `npx vitest run tests/fixtures/completion-report-preview.fixture.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report fixture module reuse in seed

- 이전 작업은 e2e env helper 테스트를 추가한 P43.4이고, 이번 작업은 seed script와 테스트 fixture가 같은 ID/이메일/source snapshot 원본을 쓰게 만든 P44.1이다.
- `tests/fixtures/completion-report-preview.fixture.mjs`를 추가해 completion preview fixture runtime constants를 분리했다.
- `tests/fixtures/completion-report-preview.fixture.d.mts`를 추가해 TS 테스트에서 `.mjs` fixture를 타입 안전하게 가져오도록 했다.
- `tests/fixtures/completion-report-preview.fixture.ts`는 `.mjs` fixture를 re-export하는 얇은 wrapper로 바꿨다.
- `scripts/seed_completion_report_preview_fixture.mjs`는 fixture, companies, users, source snapshot builder를 공통 fixture에서 가져오도록 수정했다.
- seed script의 source snapshot과 fixture test의 source snapshot이 같은 builder를 사용하게 됐다.
- 원격 Supabase URL에서는 seed가 실행 전 중단하는 local-only guard가 유지되는 것을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P44.2 completion report e2e fixture id reuse in auth/e2e다. 이번 P44.1이 seed fixture 중복 제거라면, P44.2는 auth/e2e 스크립트의 이메일과 요청 ID도 같은 fixture 원본을 보게 하는 작업이다.

검증:

- `npx vitest run tests/fixtures/completion-report-preview.fixture.test.ts`
- `SUPABASE_URL=https://example.supabase.co SUPABASE_SERVICE_ROLE_KEY=test-service-role E2E_TEST_PASSWORD=test-password npm run e2e:completion-preview:seed` 원격 Supabase URL에서 안전 중단 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e env helper tests

- 이전 작업은 e2e env/local guard를 공통 helper로 분리한 P43.3이고, 이번 작업은 그 helper의 핵심 동작을 테스트로 고정한 P43.4다.
- `scripts/completion_preview_e2e_env.test.mjs`를 추가했다.
- `.env.local` parsing에서 주석, quote wrapper, 빈 값, invalid line 처리를 확인한다.
- local URL 판정이 `localhost`, `127.0.0.1`만 허용하는지 확인한다.
- diagnostic output용 origin이 query/token을 제거하고 origin만 반환하는지 확인한다.
- process env가 `.env.local`보다 우선하는지 확인한다.
- file env, process env, explicit override 병합 순서를 확인한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P44.1 completion report fixture module reuse in seed다. 이번 P43.4가 env helper 테스트라면, P44.1은 seed script의 inline fixture와 기존 fixture module 중복을 줄이는 작업이다.

검증:

- `npx vitest run scripts/completion_preview_e2e_env.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e env duplication review

- 이전 작업은 seed, auth, e2e를 한 번에 실행하는 local runner를 추가한 P43.2이고, 이번 작업은 readiness와 local runner의 env/local guard 중복을 줄인 P43.3이다.
- `scripts/completion_preview_e2e_env.mjs`를 추가했다.
- `.env.local` parsing, env 병합, local URL 판정, origin 출력, timeout fetch helper를 공통 모듈로 이동했다.
- `scripts/check_completion_preview_e2e_readiness.mjs`가 공통 helper를 사용하도록 수정했다.
- `scripts/run_completion_preview_e2e_local.mjs`가 공통 helper를 사용하도록 수정했다.
- 리팩터 후에도 현재 원격 Supabase URL과 E2E_TEST_PASSWORD 없음 상태에서 seed 전 안전 중단이 유지되는 것을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P43.4 completion report e2e env helper tests다. 이번 P43.3이 helper 분리라면, P43.4는 env parsing/local URL 판정을 테스트로 고정하는 작업이다.

검증:

- `npm run e2e:completion-preview:ready` local Supabase URL, E2E_TEST_PASSWORD, storage state 없음 상태에서 안전 실패 확인
- `npm run e2e:completion-preview:local` 원격 Supabase URL과 E2E_TEST_PASSWORD 없음 상태에서 seed 전 안전 중단 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report local e2e execution gate

- 이전 작업은 e2e 실행 준비 상태를 점검하는 P43.1이고, 이번 작업은 실제 seed, auth, e2e를 한 번에 실행하되 local 조건을 통과하지 못하면 seed 전에 중단하는 P43.2다.
- `scripts/run_completion_preview_e2e_local.mjs`를 추가했다.
- `package.json`에 `e2e:completion-preview:local` 스크립트를 추가했다.
- local runner는 `.env.local`과 process env를 병합하되 process env를 우선한다.
- local runner는 `E2E_BASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_TEST_PASSWORD`, local `/login`, local Supabase auth health를 preflight로 확인한다.
- preflight가 통과할 때만 seed, storage state 생성, preview e2e를 순서대로 실행한다.
- 현재 `.env.local`은 원격 Supabase origin을 가리키므로 seed를 실행하지 않고 안전하게 중단하는 것을 확인했다.
- 비밀번호와 service role key 값은 출력하지 않는다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P43.3 completion report e2e env duplication review다. 이번 P43.2가 단일 실행 명령 추가라면, P43.3은 e2e 관련 스크립트들의 local/env guard 중복과 누락을 자체 리뷰하는 작업이다.

검증:

- `npm run e2e:completion-preview:local` 원격 Supabase URL과 E2E_TEST_PASSWORD 없음 상태에서 seed 전 안전 중단 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report local e2e readiness check

- 이전 작업은 e2e assertion matrix를 확장한 P42.10이고, 이번 작업은 현재 로컬 환경이 그 e2e를 실제로 실행할 준비가 되었는지 점검하는 P43.1이다.
- `scripts/check_completion_preview_e2e_readiness.mjs`를 추가했다.
- `package.json`에 `e2e:completion-preview:ready` 스크립트를 추가했다.
- readiness script는 `.env.local`, local base URL, local Supabase URL, service role key 존재 여부, 테스트 비밀번호 존재 여부, local `/login`, local Supabase auth health, role별 storage state 파일을 확인한다.
- 비밀번호와 service role key 값은 출력하지 않고 존재 여부만 표시한다.
- `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md`에 readiness check를 실행 순서 0번으로 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P43.2 completion report local e2e execution gate다. 이번 P43.1이 준비 상태 점검 도구라면, P43.2는 실제 seed/auth/e2e 실행을 시도하고 막히는 조건을 좁히는 작업이다.

검증:

- `npm run e2e:completion-preview:ready` local Supabase URL, E2E_TEST_PASSWORD, storage state 없음 상태에서 안전 실패 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e assertion matrix

- 이전 작업은 seed/auth/e2e 스크립트를 자체 리뷰한 P42.9이고, 이번 작업은 그 리뷰에서 나온 권한/요청유형 matrix를 실제 e2e assertion에 반영한 P42.10이다.
- 비로그인 사용자가 freight preview와 clearance preview 모두에서 `/login`으로 이동하는지 확인하도록 확장했다.
- requester가 freight preview와 clearance preview 모두를 볼 수 있는지 확인하도록 확장했다.
- selected partner가 freight preview와 clearance preview 모두를 볼 수 있는지 확인하도록 확장했다.
- developer가 freight preview와 clearance preview 모두를 볼 수 있는지 확인하도록 확장했다.
- unmatched partner가 freight preview와 clearance preview 모두에서 본문을 볼 수 없는지 확인하도록 확장했다.
- 기존 source snapshot, published_at, 보관 서류 라벨, 안전 고지, 민감정보 미노출 assertion은 유지했다.
- 현재 local storage state가 없으므로 실제 본문 e2e는 실행하지 못했고, storage state 없음 상태에서 명확히 실패하는 것만 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P43.1 completion report local e2e readiness check다. 이번 P42.10이 e2e assertion matrix 확장이라면, P43.1은 현재 로컬 환경에서 seed/auth/e2e를 실제로 실행할 수 있는 env와 Supabase 상태를 점검하는 작업이다.

검증:

- `node scripts/e2e_completion_report_preview_flow.mjs` storage state 없음 상태에서 안내 실패 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e script self-review

- 이전 작업은 seed/auth/e2e 실행 순서를 문서화한 P42.8이고, 이번 작업은 seed/auth/e2e 스크립트 자체를 보안/QA 관점에서 리뷰한 P42.9다.
- `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_SELF_REVIEW.md`를 추가했다.
- 기존 테스트 사용자가 있으면 seed script가 password를 갱신하지 않아 storage state 생성이 실패할 수 있는 문제를 확인했다.
- `scripts/seed_completion_report_preview_fixture.mjs`에서 기존 user도 `auth.admin.updateUserById`로 password, email confirmation, metadata를 갱신하도록 수정했다.
- e2e negative assertion에 영문 `download`만 있고 한글 `다운로드`가 없는 문제를 확인했다.
- `scripts/e2e_completion_report_preview_flow.mjs` forbidden token에 `다운로드`를 추가했다.
- local-only service role seed guard는 유지했다.
- 남은 gap으로 requester/selected partner/developer 각각 freight/clearance 양쪽 preview를 모두 확인하지 않는 점을 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.10 completion report e2e assertion matrix다. 이번 P42.9가 자체 리뷰라면, P42.10은 그 리뷰에서 나온 권한/요청유형 matrix를 실제 e2e assertion에 반영하는 작업이다.

검증:

- `node scripts/e2e_completion_report_preview_flow.mjs` storage state 없음 상태에서 안내 실패 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e local runbook

- 이전 작업은 role별 세션으로 preview 본문/권한/민감정보 미노출을 검증하는 P42.7 e2e script이고, 이번 작업은 seed/auth/e2e 실행 순서를 문서화한 P42.8이다.
- `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md`를 추가했다.
- local Supabase와 local Next.js 서버 전제 조건을 정리했다.
- `e2e:completion-preview:seed`, `e2e:completion-preview:auth`, `e2e:completion-preview` 실행 순서를 정리했다.
- 생성되는 storage state 파일 경로를 정리했다.
- e2e가 확인하는 권한, 본문, source snapshot, 민감정보 미노출 assertion을 문서화했다.
- production smoke와 섞지 않는다는 제한을 명시했다.
- 새 코드, repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.9 completion report e2e script self-review다. 이번 P42.8이 실행 문서라면, P42.9는 seed/auth/e2e 스크립트가 production에서 실수로 실행될 위험과 검증 누락을 자체 리뷰하는 작업이다.

검증:

- `rg -n "e2e:completion-preview|SUPABASE_SERVICE_ROLE_KEY|E2E_TEST_PASSWORD|tmp/e2e-auth|production|localhost" docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_E2E_RUNBOOK.md docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_AUTH_FIXTURE_PLAN.md docs/ROADMAP.md docs/WORK_LOG.md`

### completion report preview e2e script

- 이전 작업은 seeded role 계정으로 Playwright storage state를 만드는 P42.6이고, 이번 작업은 role별 세션으로 preview 본문/권한/민감정보 미노출을 검증하는 P42.7이다.
- `scripts/e2e_completion_report_preview_flow.mjs`를 추가했다.
- `package.json`에 `e2e:completion-preview` 스크립트를 추가했다.
- e2e는 local base URL에서만 실행된다.
- requester와 selected partner는 freight preview 본문을 볼 수 있어야 한다.
- developer는 clearance preview 본문을 볼 수 있어야 한다.
- unmatched partner는 preview 본문을 볼 수 없어야 한다.
- 비로그인 사용자는 `/login`으로 이동해야 한다.
- 본문 검증은 title, source snapshot version, request status snapshot, published_at, 보관 서류 한글 라벨, 안전 고지를 확인한다.
- negative assertion으로 `fileName`, `question`, `answer`, `message`, `download`, 테스트 파일명이 표시되지 않는지 확인한다.
- 현재 local storage state가 없으므로 실제 본문 e2e는 실행하지 못했고, storage state 없음 상태에서 명확히 실패하는 것만 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.8 completion report e2e local runbook이다. 이번 P42.7이 e2e script라면, P42.8은 seed/auth/e2e 실행 순서와 필요한 env를 문서화하는 작업이다.

검증:

- `node scripts/e2e_completion_report_preview_flow.mjs` storage state 없음 상태에서 안내 실패 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report storage state script

- 이전 작업은 local Supabase에 preview fixture를 넣는 P42.5 seed runner이고, 이번 작업은 seeded role 계정으로 로그인해 Playwright storage state를 만드는 P42.6이다.
- `scripts/create_completion_report_preview_storage_states.mjs`를 추가했다.
- `package.json`에 `e2e:completion-preview:auth` 스크립트를 추가했다.
- storage state는 Git 추적 대상이 아닌 `tmp/e2e-auth/`에 저장한다.
- requester, selected partner, unmatched partner, developer 4개 role의 storage state를 생성하도록 했다.
- `E2E_BASE_URL`은 기본 `http://localhost:3100`이고 localhost/127.0.0.1에서만 실행된다.
- `E2E_TEST_PASSWORD`가 없으면 실행을 중단한다.
- env 없음 상태에서 안전하게 실패하는 것을 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.7 completion report preview e2e script다. 이번 P42.6이 role별 storage state 생성이라면, P42.7은 생성된 세션으로 preview 본문/권한/민감정보 미노출을 검증하는 e2e script 작업이다.

검증:

- `node scripts/create_completion_report_preview_storage_states.mjs` env 없음 상태에서 안전 실패 확인
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report seed runner

- 이전 작업은 preview e2e fixture 데이터 원장을 만든 P42.4이고, 이번 작업은 local Supabase에 fixture를 넣는 guarded seed runner를 만든 P42.5다.
- `scripts/seed_completion_report_preview_fixture.mjs`를 추가했다.
- `package.json`에 `e2e:completion-preview:seed` 스크립트를 추가했다.
- seed runner는 `SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_URL`이 `localhost` 또는 `127.0.0.1`일 때만 실행된다.
- `SUPABASE_SERVICE_ROLE_KEY`와 `E2E_TEST_PASSWORD`가 없으면 실행을 중단한다.
- auth admin API로 requester, selected partner, unmatched partner, developer 테스트 사용자를 준비한다.
- 테스트 회사, profile, completed freight/clearance request, selected bid, request document metadata, completion report, completion report document mapping을 upsert한다.
- source snapshot에는 `snapshot_version`, `request_status`, `published_at`, safety flags를 포함한다.
- 실제 local DB seed는 env가 없어 실행하지 않았고, env 없음 상태에서 안전하게 실패하는지만 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.6 completion report storage state script다. 이번 P42.5가 DB seed runner라면, P42.6은 seeded role 계정으로 로그인해 Playwright storage state를 만드는 스크립트 작업이다.

검증:

- `node scripts/seed_completion_report_preview_fixture.mjs` env 없음 상태에서 안전 실패 확인
- `npx vitest run tests/fixtures/completion-report-preview.fixture.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report e2e fixture implementation

- 이전 작업은 preview e2e에 필요한 local seed helper 구조를 설계한 P42.3이고, 이번 작업은 실제 fixture 데이터 원장과 단위 테스트를 만든 P42.4 1차 구현이다.
- `tests/fixtures/completion-report-preview.fixture.ts`를 추가했다.
- requester, selected partner, unmatched partner, developer role의 테스트 회사와 사용자 fixture를 정의했다.
- completed freight/clearance request fixture를 정의했다.
- locked/operator reviewed completion report fixture를 정의했다.
- `buildCompletionReportPreviewSourceSnapshot` helper로 `snapshot_version`, `request_status`, `published_at`, safety flags가 있는 source snapshot을 만든다.
- `tests/fixtures/completion-report-preview.fixture.test.ts`를 추가했다.
- fixture 테스트는 role 구성, source snapshot 필수 metadata, completed request 연결, 민감 raw term 미포함을 검증한다.
- 아직 실제 Supabase DB에 seed를 insert하는 runner와 Playwright storage state는 만들지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.5 completion report seed runner다. 이번 P42.4 1차가 fixture 데이터 원장이라면, P42.5는 이 fixture를 service-role local Supabase에 넣는 guarded seed runner 작업이다.

검증:

- `npx vitest run tests/fixtures/completion-report-preview.fixture.test.ts`
- `npm run typecheck`
- `npm run lint`

### completion report local seed helper plan

- 이전 작업은 preview 본문 검증을 위한 권한 fixture 계획을 정리한 P42.2이고, 이번 작업은 그 fixture를 실제로 만들기 위한 local seed helper 구조를 설계한 P42.3이다.
- `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_SEED_HELPER_PLAN.md`를 추가했다.
- requester, selected partner, unmatched partner, developer 사용자와 회사 seed 구성을 정리했다.
- completed freight/clearance request, selected bid, locked/submitted completion report, document mapping, source snapshot seed 구성을 정의했다.
- e2e fixture 반환 contract를 `freightRequestId`, `clearanceRequestId`, role별 email 중심으로 정리했다.
- source snapshot fixture에 `snapshot_version`, `request_status`, `published_at`, safety flags를 포함했다.
- 요청자/선정 파트너/미선정 파트너/비로그인 negative assertion을 정리했다.
- 새 코드, repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.4 completion report e2e fixture implementation이다. 이번 P42.3이 seed helper 계획이라면, P42.4는 실제 테스트 fixture 파일과 role별 storage state 준비 코드를 만드는 작업이다.

검증:

- `rg -n "CompletionReportPreviewFixture|source snapshot|unmatched|P42\\.4|published_at|selected partner" docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_SEED_HELPER_PLAN.md docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_AUTH_FIXTURE_PLAN.md docs/ROADMAP.md docs/WORK_LOG.md`

### completion report preview auth fixture plan

- 이전 작업은 로컬 브라우저에서 비로그인 preview route 보호를 확인한 P42.1이고, 이번 작업은 로그인/권한 fixture로 preview 본문을 자동 검증하는 계획을 정리한 P42.2다.
- `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_AUTH_FIXTURE_PLAN.md`를 추가했다.
- 요청자 회사 구성원, 선정 파트너, 미선정 파트너, 운영자/developer, 비로그인 사용자별 기대 동작을 정리했다.
- preview e2e에 필요한 최소 seed 데이터를 정의했다.
- source snapshot fixture에 `snapshot_version`, `request.request_status`, `published_at`을 포함하도록 명시했다.
- 파일명, 질문·답변 원문, 견적 메시지 원문, 다운로드 링크가 표시되지 않아야 한다는 negative assertion을 정리했다.
- 다음 구현 우선순위를 P42.3 local seed helper 설계, P42.4 Playwright storage state, P42.5 preview route e2e로 잡았다.
- 새 코드, repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.3 completion report local seed helper plan이다. 이번 P42.2가 권한 fixture 계획이라면, P42.3은 e2e를 실제로 가능하게 할 최소 local seed helper 구조를 설계하는 작업이다.

검증:

- `rg -n "requester|selected partner|source snapshot|fileName|P42\\.3|미선정 파트너|다운로드 링크" docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_AUTH_FIXTURE_PLAN.md docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md docs/ROADMAP.md docs/WORK_LOG.md`

### completion report preview UI browser check

- 이전 작업은 freight/clearance preview route의 data mapping을 공통화한 P41.3이고, 이번 작업은 로컬 브라우저와 route 응답으로 preview 접근 보호를 확인한 P42.1이다.
- 로컬 브라우저에서 `/requests/freight/test-request-id/completion-report/preview`를 열었다.
- 로컬 브라우저에서 `/requests/clearance/test-request-id/completion-report/preview`를 열었다.
- 비로그인 상태에서 preview route가 로그인 화면으로 이동하는 것을 응답 HTML의 `로그인`, `이메일`, `HS FINDER` 문구로 확인했다.
- 사용자 인증 fixture가 없는 상태이므로 실제 완료 리포트 본문 렌더링은 자동 확인하지 못했다.
- 새 코드, repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.2 completion report preview auth fixture plan이다. 이번 P42.1이 비로그인 보호 확인이라면, P42.2는 로그인/권한 fixture로 preview 본문까지 자동 확인하는 방법을 정리하는 작업이다.

검증:

- `open http://localhost:3100/requests/freight/test-request-id/completion-report/preview`
- `open http://localhost:3100/requests/clearance/test-request-id/completion-report/preview`
- `curl -L -s http://localhost:3100/requests/freight/test-request-id/completion-report/preview | rg -n "로그인|login|이메일|HS FINDER" -i | head -n 20`

### completion report preview route data self-review

- 이전 작업은 preview read model에 source snapshot 필드를 추가한 P41.2이고, 이번 작업은 freight/clearance preview route의 data mapping을 공통화한 P41.3이다.
- `ServiceRequestCompletionReportPreviewPage` server component를 추가했다.
- freight preview route와 clearance preview route가 같은 repository 조회, document mapping, `buildCompletionReportPreview` 입력 매핑을 사용하게 했다.
- 각 route는 이제 title, description, kind, requestId만 전달한다.
- P41.2에서 추가한 `sourceSnapshotVersion`, `requestStatus`, `publishedAt`은 공통 helper가 `report.sourceSnapshot`에서 읽으므로 route별 누락 가능성을 줄였다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P42.1 completion report preview UI browser check다. 이번 P41.3이 route mapping 공통화라면, P42.1은 로컬 브라우저/route 확인으로 preview 접근 보호와 렌더링 경로를 점검하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/requests/freight/test-request-id/completion-report/preview`, `/requests/clearance/test-request-id/completion-report/preview` 요청 시 `/login` 307 redirect 확인

### completion report source snapshot coverage

- 이전 작업은 preview/read model 노출 범위를 점검한 P41.1이고, 이번 작업은 누락된 source snapshot 값을 실제 read model과 UI에 반영한 P41.2다.
- `CompletionReportPreview.sourceSnapshotVersion`을 추가했다.
- `CompletionReportPreview.requestBasis.requestStatus`를 추가했다.
- `CompletionReportPreview.sourceLocks[].publishedAt`을 추가했다.
- preview 문서의 거래 기준 섹션에 출처 snapshot 버전과 요청 상태 snapshot을 표시한다.
- preview 문서의 출처 잠금 섹션에 공표시각을 표시한다.
- source lock 테스트에 `published_at`과 `publishedAt` 변환 검증을 추가했다.
- preview data shape 문서도 새 필드에 맞췄다.
- 새 repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P41.3 completion report preview route data self-review다. 이번 P41.2가 read model 필드 추가라면, P41.3은 실제 preview route가 새 read model에 전달하는 데이터 매핑이 맞는지 점검하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report read model coverage review

- 이전 작업은 preview helper의 source lock 해석 테스트를 보강한 P40.2이고, 이번 작업은 완료 리포트 preview/read model 전체의 노출 범위를 점검한 P41.1이다.
- `SERVICE_REQUEST_COMPLETION_REPORT_READ_MODEL_REVIEW.md`를 추가했다.
- 현재 preview에 포함되는 필드와 제외되는 민감 필드를 정리했다.
- 파일명, 다운로드 링크, 서류 원문, invoice line item 원문, 견적 메시지 원문, 질문·답변 원문, 개인정보, 내부 메모는 계속 제외한다는 기준을 확인했다.
- source URL은 http/https만 링크로 표시하고 로컬 경로를 링크로 노출하지 않는 기준을 문서화했다.
- coverage gap으로 `published_at`, `source_snapshot.snapshot_version`, request status 미표시를 확인했다.
- 다음 코드 작업을 P41.2 source snapshot coverage로 정리했다.
- 새 코드, repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P41.2 completion report source snapshot coverage다. 이번 P41.1이 점검 문서라면, P41.2는 `published_at`, snapshot version, request status를 실제 preview read model과 UI에 반영하는 작업이다.

검증:

- `rg -n "published_at|snapshot version|requestStatus|파일명|질문·답변" docs/SERVICE_REQUEST_COMPLETION_REPORT_READ_MODEL_REVIEW.md docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md docs/ROADMAP.md docs/WORK_LOG.md`

### completion report source lock tests

- 이전 작업은 출처 잠금 영역의 UI 표시를 정리한 P40.1이고, 이번 작업은 preview helper의 source lock 해석을 테스트로 보강한 P40.2다.
- `source_lookup_snapshot.source_locks` 배열에서 snake_case metadata를 읽는 테스트를 추가했다.
- `source_lookup_snapshot.sources` 배열에서 camelCase metadata를 읽는 테스트를 추가했다.
- source lock test는 `sourceName`, `sourceUrl`, `sourceVersion`, `effectiveFrom`, `retrievedAt`, `checksum` 변환을 검증한다.
- 새 UI, repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P41.1 completion report read model coverage review다. 이번 P40.2가 source lock 해석 테스트라면, P41.1은 완료 리포트 preview/read model 전체에서 노출 누락과 민감정보 숨김 기준을 점검하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report source lock labels

- 이전 작업은 완료 리포트 보관 서류 role을 한글 라벨로 표시한 P39.2이고, 이번 작업은 preview 출처 잠금 metadata 표시를 정리한 P40.1이다.
- 출처 잠금 영역에서 자료명, 자료 버전, 수집시각, 적용시작, 적용종료, 체크섬을 별도 필드로 표시한다.
- 출처 URL은 `http://` 또는 `https://`일 때만 `출처 열기` 링크를 표시한다.
- `file://` 같은 로컬 경로는 링크로 노출하지 않는다.
- source lock이 없는 경우의 경고 문구는 유지했다.
- 새 repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P40.2 completion report source lock tests다. 이번 P40.1이 source lock 표시 UI라면, P40.2는 preview helper가 `source_locks`와 `sources` 배열을 안정적으로 해석하는 테스트 보강이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/requests/freight/test-request-id/completion-report/preview` 요청 시 `/login` 307 redirect 확인

### operations archive role labels

- 이전 작업은 사용자 preview와 완료 리포트 작성 패널에서 보관 서류 role을 한글 라벨로 표시하는 P39.1이고, 이번 작업은 운영 상세 완료 리포트 매핑도 같은 라벨을 쓰는 P39.2다.
- 운영 요청 상세의 `최종 보관 서류 매핑`에서 `final_bl_or_awb`, `import_declaration_certificate` 같은 내부 role 대신 공용 한글 라벨을 표시한다.
- 운영 상세의 파일명, 질문·답변 원문, 견적 메시지 원문 미노출 정책은 유지했다.
- 새 repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P40.1 completion report source lock labels다. 이번 P39.2가 보관 서류명 표시 개선이라면, P40.1은 출처 잠금 영역의 source metadata를 사용자/운영자가 이해하기 쉬운 한국어 필드명으로 정리하는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/operations/requests/test-request-id` 요청 시 `/login` 307 redirect 확인

### completion report archive role labels

- 이전 작업은 preview 화면의 프린트/모바일 레이아웃을 다듬는 P38.6이고, 이번 작업은 완료 리포트 보관 서류 role을 사용자용 한글 라벨로 표시하는 P39.1이다.
- 기존 완료 리포트 작성 패널에 있던 보관 서류 안내와 role 옵션을 `service-request-completion-report-labels` 공용 모듈로 분리했다.
- 완료 리포트 작성 패널은 공용 모듈의 `completionReportArchiveGuide`, `completionReportDocumentRoleOptions`, `completionReportDocumentRoleLabel`을 사용한다.
- 완료 리포트 preview 문서는 `final_bl_or_awb`, `import_declaration_certificate` 같은 내부 role 대신 `최종 B/L 또는 AWB`, `수입신고필증` 같은 라벨을 표시한다.
- 알 수 없는 role은 그대로 표시해 향후 새 보관 서류 role이 추가되어도 숨기지 않는다.
- 라벨 매핑 단위 테스트를 추가했다.
- 새 repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P39.2 operations archive role labels다. 이번 P39.1이 사용자 preview와 작성 패널 라벨이라면, P39.2는 운영 상세 완료 리포트 보관 서류 매핑도 같은 한글 라벨로 맞추는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-labels.test.ts features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### completion report preview print polish

- 이전 작업은 운영 상세에서 완료 리포트 preview로 이동하는 P38.5이고, 이번 작업은 preview 화면 자체의 프린트/모바일 표시를 다듬는 P38.6이다.
- preview 상단에 잠금 완료, 운영 검토 후 잠금 전, 잠금 전 미리보기 상태별 안내 문구를 추가했다.
- 긴 요청 ID, 리포트 ID, 선정 견적 ID, 신고번호, B/L 또는 AWB가 모바일에서 넘치지 않도록 줄바꿈 처리를 보강했다.
- 요청 유형과 수출입 방향은 내부 값 대신 한국어 라벨로 표시한다.
- 정산 항목, 운송 예외, 통관 세액 요약, 통관 주의사항을 preview 화면에 표시한다.
- 파일명, 질문·답변 원문, 견적 메시지 원문은 계속 표시하지 않는다.
- 새 repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P39.1 completion report archive role labels다. 이번 P38.6이 화면 레이아웃 polish라면, P39.1은 `final_bl_or_awb` 같은 내부 보관 서류 role을 사용자용 한글 라벨로 바꾸는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/requests/clearance/test-request-id/completion-report/preview` 요청 시 `/login` 307 redirect 확인

### operations completion report preview link

- 이전 작업은 완료 리포트를 프린트 가능한 화면으로 보여주는 P38.4 route skeleton이고, 이번 작업은 운영 상세에서도 그 preview로 이동할 수 있게 하는 P38.5다.
- 운영 요청 상세의 완료 리포트 운영 요약 카드에 `미리보기` 링크를 추가했다.
- 링크는 `/requests/{requestType}/{requestId}/completion-report/preview` 경로를 사용한다.
- 운영 상세 카드에 preview 모델 기준으로 파일명, 질문·답변 원문, 견적 메시지 원문을 표시하지 않는다는 안내를 추가했다.
- 새 repository, action, migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P38.6 completion report preview print polish다. 이번 P38.5가 운영 화면의 이동 동선이라면, P38.6은 preview 화면 자체의 프린트/모바일 레이아웃과 잠금 상태 안내를 다듬는 작업이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/operations/requests/test-request-id`, `/requests/freight/test-request-id/completion-report/preview` 요청 시 `/login` 307 redirect 확인

### completion report preview UI route skeleton

- 이전 작업은 완료 리포트 row를 안전한 preview 모델로 바꾸는 P38.3이고, 이번 작업은 그 모델을 프린트 가능한 화면으로 보여주는 P38.4 route skeleton이다.
- `ServiceRequestCompletionReportPreviewDocument`를 추가했다.
- preview 문서는 header, 거래 기준, 완료 요약, 운송 결과, 통관 결과, 최종 보관 서류, 출처 잠금, 안전 고지 섹션으로 구성했다.
- 파일명과 다운로드 링크 없이 보관 서류 역할과 필수 여부만 표시한다.
- 출처 잠금 metadata가 없으면 공식 출처 잠금 metadata가 없다는 경고를 표시한다.
- 프린트 버튼과 print CSS용 클래스를 추가했다.
- `/requests/freight/[requestId]/completion-report/preview` route를 추가했다.
- `/requests/clearance/[requestId]/completion-report/preview` route를 추가했다.
- 완료 리포트 패널에 미리보기 링크를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P38.5 operations completion report preview link다. 이번 P38.4가 사용자 요청 상세 preview route라면, P38.5는 운영 상세에서도 민감정보 없는 preview로 이동하는 링크를 추가하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/requests/freight/test-request-id/completion-report/preview`, `/requests/clearance/test-request-id/completion-report/preview` 요청 시 `/login` 307 redirect 확인

### completion report preview read model

- 이전 작업은 완료 리포트 PDF/프린트 미리보기 구조를 설계한 P38.2이고, 이번 작업은 실제 완료 리포트 row와 source snapshot을 안전한 preview 모델로 변환하는 P38.3이다.
- `buildCompletionReportPreview` pure helper를 추가했다.
- preview helper는 완료 리포트 상태별 watermark를 계산한다.
- 요청 기준 정보, selected bid 기준 정보, archive document role, settlement item, freight result, clearance result를 preview 모델로 변환한다.
- `source_snapshot.lookup.source_lookup_snapshot`의 공식 출처 metadata를 source locks로 변환한다.
- safety notice 기본 문구를 preview 모델에 포함했다.
- helper 입력은 파일명, 질문 원문, 답변 원문, 견적 메시지 원문을 받지 않는 구조로 만들었다.
- preview helper 단위 테스트를 추가해 locked preview, source locks, archive documents, 민감 필드 미포함을 검증했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P38.4 completion report preview UI route skeleton이다. 이번 P38.3이 안전한 preview read model이라면, P38.4는 이 모델을 프린트 가능한 화면으로 보여주는 route skeleton 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-preview.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/reports/preview` 요청 시 `/login` 307 redirect 확인

### completion report print/export preview plan

- 이전 작업은 완료 리포트 저장 시 source snapshot을 구조화한 P38.1이고, 이번 작업은 완료 리포트를 PDF/프린트 리포트로 확장하기 전 미리보기 구조를 설계한 P38.2다.
- `docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md`를 추가했다.
- preview에 포함할 항목과 제외할 민감정보를 분리했다.
- preview read model `CompletionReportPreview` 초안을 정의했다.
- Header, 거래 기준, 완료 요약, 업무 결과, 최종 보관 서류, 출처 잠금, 안전 고지 렌더링 섹션을 정의했다.
- draft, submitted, acknowledged, operator reviewed, locked, voided 상태별 preview/print 규칙과 워터마크를 정의했다.
- `source_snapshot.lookup.source_lookup_snapshot`에서 공식 출처 metadata가 있는 경우에만 source locks로 표시한다는 규칙을 잡았다.
- 법적 확정, 요건 없음 확정, FTA 적용 보장, HSK 확정, 통관 가능 확정 같은 금지 표현을 정리했다.
- 기존 완료 리포트 계획 문서에서 preview 문서로 연결했다.
- 새 코드나 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P38.3 completion report preview read model이다. 이번 P38.2가 미리보기 설계 문서라면, P38.3은 완료 리포트 row와 source snapshot을 안전한 preview 모델로 변환하는 pure helper와 테스트를 만드는 코드 작업이다.

검증:

- `rg -n "CompletionReportPreview|P38\\.2|P38\\.3|법적 확정|source locks" docs/SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md docs/SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md docs/ROADMAP.md docs/WORK_LOG.md`

### completion report source snapshot summary

- 이전 작업은 운영 상세 화면에서 완료 리포트 상태와 보관 서류 매핑을 민감정보 없이 보여준 P37.2이고, 이번 작업은 완료 리포트 저장 시 source snapshot을 더 구조화하는 P38.1이다.
- `create_or_update_completion_report` RPC의 기본 `source_snapshot` 구조를 `completion-report-source-v1`로 보강했다.
- source snapshot에 요청 ID, 요청 유형, 요청 상태, 방향, 기준일, source HS request id, lookup snapshot 존재 여부를 저장한다.
- source snapshot에 selected bid id, selected partner company id, bid type, bid status, selected at을 저장한다.
- source snapshot에 기존 요청 생성 시점의 `source_lookup_snapshot`을 `lookup.source_lookup_snapshot` 아래로 유지한다.
- source snapshot에 `legal_certainty: false`, `hs_classification_final: false`, `requires_staff_review_for_legal_outputs: true` 안전 플래그를 넣어 완료 리포트가 법적 확정 판정처럼 보이지 않게 했다.
- 사용자가 추가 `sourceSnapshot` payload를 보내도 서버 기본 구조가 최종적으로 덮어쓰도록 했다.
- 완료 리포트 계획 문서에 MVP 기본 snapshot 구조를 추가했다.
- governance test를 보강했고 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P38.2 completion report print/export preview plan이다. 이번 P38.1이 source snapshot 저장 구조라면, P38.2는 완료 리포트를 나중에 PDF/프린트 리포트로 만들기 위한 미리보기 정보 구조를 설계하는 문서 작업이다.

검증:

- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/operations/requests/test-request-id` 요청 시 `/login` 307 redirect 확인

### operations request detail completion report section

- 이전 작업은 운영 통계/큐에서 완료 리포트 전이 병목을 보여준 P37.1이고, 이번 작업은 운영 상세 화면에서 특정 요청의 완료 리포트 상태와 보관 서류 매핑을 민감정보 없이 확인하는 P37.2다.
- 운영 상세 repository에 완료 리포트 요약을 추가했다.
- 운영 상세 완료 리포트 조회는 상태, 제출일, 잠금일, 요약 존재 여부, 금액 존재 여부, 운송/통관 결과 존재 여부만 반환한다.
- 완료 리포트 보관 서류 매핑은 역할과 필수 여부만 반환하고 파일명, 신고번호, 정산 원문, 문서 원문은 반환하지 않는다.
- 운영 상세 페이지에 “완료 리포트 운영 요약” 섹션을 추가했다.
- 완료 리포트가 없거나 보관 서류 매핑이 없으면 사용자 상세의 완료 리포트/보관 서류 연결 흐름을 확인하라는 안내를 표시한다.
- 운영 상세 민감정보 select allowlist 테스트를 유지하면서 타입 테스트를 통과시켰다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P38.1 completion report source snapshot summary다. 이번 P37.2가 운영 상세 표시라면, P38.1은 완료 리포트 자체에 요청·선정견적·조회 snapshot 출처 요약을 더 구조화해 source-locked report 기반을 만드는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/operations/requests/test-request-id` 요청 시 `/login` 307 redirect 확인

### operations completion report transition visibility

- 이전 작업은 사용자 상세에서 완료 리포트 전이를 실행하는 P36.5이고, 이번 작업은 운영 화면에서 완료 리포트 전이 병목을 볼 수 있게 한 P37.1이다.
- 운영 summary에 `completionReportsSubmitted`, `completionReportsAcknowledged`, `completionReportsReadyToLock`, `completionReportsLocked` 지표를 추가했다.
- 완료 리포트가 없는 완료 요청 다음 우선순위로 제출 후 확인 대기, 확인 후 운영 검토 필요, 운영 검토 후 잠금 대기를 action queue에 올리게 했다.
- 대표 우선순위 큐에 “리포트 확인 대기”, “운영 검토 필요”, “잠금 대기” 항목을 추가했다.
- 복사용 운영 개선 요청 문장에 완료 리포트 전이 상태별 건수를 포함했다.
- 운영 지표 카드에 완료 리포트 확인 대기, 운영 검토 필요, 잠금 대기, 잠금 완료를 추가했다.
- 운영 통계 단위 테스트를 보강했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P37.2 operations request detail completion report section이다. 이번 P37.1이 운영 통계/큐라면, P37.2는 운영 상세 화면에서 특정 요청의 완료 리포트 상태와 보관 서류 매핑을 민감정보 없이 확인하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### completion report transition actions

- 이전 작업은 DB에 완료 리포트 전이 RPC를 추가한 P36.4이고, 이번 작업은 앱 서버에서 그 RPC들을 호출하고 UI skeleton 버튼과 연결하는 P36.5다.
- 완료 리포트 transition schema를 추가했다.
- `transitionServiceRequestCompletionReport` repository를 추가해 `submit_completion_report`, `acknowledge_completion_report`, `review_completion_report`, `lock_completion_report` RPC를 호출한다.
- `transitionServiceRequestCompletionReportAction` server action을 추가했다.
- transition action은 요청 유형과 요청 ID를 받아 대시보드, 요청자 상세, 파트너 상세 route를 revalidate한다.
- 완료 리포트 패널의 제출·화주 확인·파트너 확인·운영 검토·보관 잠금 버튼을 실제 server action form으로 연결했다.
- requester 화면은 requester 확인, partner opportunity 화면은 partner 확인 역할로 action을 호출한다.
- staff 전용 운영 검토·잠금 버튼은 viewerRole이 staff일 때만 활성화되도록 경계를 열어뒀다.
- schema, repository, workflow 단위 테스트를 보강했다.
- 새 migration 파일은 만들지 않고 P36.4의 로컬 marketplace migration 초안을 사용했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P37.1 operations completion report transition visibility다. 이번 P36.5가 사용자 상세에서 상태 전이를 실행하는 경계라면, P37.1은 운영 화면에서 제출됨·확인됨·운영검토 필요·잠금 대기를 우선순위로 볼 수 있게 하는 관찰성 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts features/service-requests/service-request-completion-report-workflow.test.ts server/repositories/service-request-completion-report.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 비로그인 상태 `/requests/clearance/opportunities/test-request-id` 요청 시 `/login` 307 redirect 확인

### completion report transition RPC

- 이전 작업은 완료 리포트 패널에 제출·확인·잠금 흐름을 보여주는 P36.3 UI skeleton이고, 이번 작업은 실제 DB에서 전이를 강제하는 P36.4 RPC 작업이다.
- `submit_completion_report(uuid)` RPC를 추가했다.
- 제출 RPC는 초안 상태, 완료된 요청, selected bid와 리포트 파트너 일치, requester/selected partner/staff 권한, 활성 회사, 보관 서류 1건 이상, 최소 완료 내용 입력을 검증한다.
- `acknowledge_completion_report(uuid, text)` RPC를 추가했다.
- 확인 RPC는 requester/partner 역할별 권한을 분리하고, 확인 메타데이터를 `source_snapshot.confirmations`에 저장한다.
- `review_completion_report(uuid)` RPC를 추가했다.
- 운영 검토 RPC는 staff/admin만 호출할 수 있고 보관 서류 연결을 요구한다.
- `lock_completion_report(uuid)` RPC를 추가했다.
- 잠금 RPC는 운영 검토 상태와 보관 서류 연결을 요구하고, “법적 확정”, “요건 없음 확정”, “FTA 적용 보장”, “HSK 확정” 같은 금지 표현을 차단한다.
- 기존 `create_or_update_completion_report`는 draft가 아닌 리포트 수정을 차단하도록 강화했다.
- 전이 RPC grant와 governance 회귀 테스트를 추가했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P36.5 completion report transition actions다. 이번 P36.4가 DB/RPC 경계라면, P36.5는 앱 서버 schema/repository/action에서 이 RPC들을 호출하고 UI skeleton과 연결하는 작업이다.

검증:

- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### completion report submit UI skeleton

- 이전 작업은 완료 리포트 제출·확인·잠금 상태 전이 규칙을 문서로 고정한 P36.2이고, 이번 작업은 완료 리포트 패널에 그 흐름을 보이는 P36.3 UI skeleton이다.
- `service-request-completion-report-workflow` helper를 추가해 초안 저장, 리포트 제출, 화주/파트너 확인, 운영 검토, 보관 잠금 단계를 계산한다.
- 요청자 상세에서는 확인 단계가 “화주 확인”으로, 선정 파트너 상세에서는 “파트너 확인”으로 표시되게 했다.
- 완료 리포트 패널에 제출·확인 진행 카드를 추가했다.
- 상태 전이 RPC가 아직 없으므로 CTA 버튼은 비활성 상태 안내로 표시한다.
- 보관 서류가 없으면 제출 단계가 대기 상태로 보이고, 초안이 없으면 초안 저장 필요로 안내한다.
- 잠금 후 수정 불가와 통관 결과의 신고 결과 기준/예비 조회 출처 분리 문구를 화면에 고정했다.
- 워크플로우 helper 단위 테스트를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P36.4 completion report transition RPC다. 이번 P36.3이 화면 skeleton이라면, P36.4는 실제 DB에서 제출·확인·운영 검토·잠금 전이를 강제하는 RPC와 governance tests를 추가하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-workflow.test.ts features/service-requests/service-request-completion-report-schemas.test.ts server/repositories/service-request-completion-report.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/requests/freight/test-request-id`, `/requests/freight/opportunities/test-request-id` 요청 시 `/login` 307 redirect 확인

### completion report submit/acknowledge transition plan

- 이전 작업은 완료 리포트 패널에서 요청 서류를 최종 보관 역할로 연결하는 P36.1이고, 이번 작업은 완료 리포트를 초안에서 제출·확인·운영 검토·잠금으로 넘기는 상태 전이 계획인 P36.2다.
- `docs/SERVICE_REQUEST_COMPLETION_REPORT_TRANSITIONS.md`를 추가했다.
- `draft`, `submitted`, `requester_acknowledged`, `partner_acknowledged`, `operator_reviewed`, `locked`, `voided` 상태의 의미, 수정 가능 여부, 다음 상태를 정리했다.
- 현재 단일 `status` 컬럼만으로 양측 확인을 완벽히 표현하기 어렵다는 점을 명시하고, MVP에서는 `source_snapshot.confirmations` JSON으로 양측 확인 메타데이터를 보완하는 방향을 잡았다.
- requester, selected partner, staff/admin/developer, 미선정 파트너, 정지/차단 회사별 허용 작업을 분리했다.
- `submit_completion_report`, `acknowledge_completion_report`, `review_completion_report`, `lock_completion_report`, `void_completion_report` RPC의 검증 기준과 audit metadata 제한을 정의했다.
- 잠금 이후 `create_or_update_completion_report`, `attach_completion_report_document`가 거부되어야 한다는 규칙을 고정했다.
- 완료 리포트 UI 문구에서 금지할 법적 확정 표현과 허용 표현을 정리했다.
- 기존 완료 리포트 계획 문서에 전이 문서 링크와 P36 레일을 추가했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P36.3 completion report submit UI skeleton이다. 이번 P36.2가 상태 전이 규칙 문서라면, P36.3은 실제 완료 리포트 패널에 제출·확인·운영 검토·잠금 안내 CTA skeleton을 표시하는 UI 작업이다.

검증:

- `rg -n "submit_completion_report|acknowledge_completion_report|lock_completion_report|P36\\.2|P36\\.3" docs/SERVICE_REQUEST_COMPLETION_REPORT_TRANSITIONS.md docs/SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md docs/ROADMAP.md docs/WORK_LOG.md`

### completion report UI archive mapping

- 이전 작업은 운영 화면에서 완료 리포트 누락을 볼 수 있게 한 P35.6이고, 이번 작업은 완료 리포트 패널에서 기존 요청 서류를 최종 보관 역할로 직접 연결하는 P36.1이다.
- 완료 리포트 패널에 최종 보관 서류 목록과 연결 폼을 추가했다.
- 요청 서류는 새로 업로드하지 않고 기존 private request document metadata를 선택해 `attach_completion_report_document` RPC로 연결한다.
- 운송 완료 리포트는 최종 B/L 또는 AWB, 운임 청구서, CI, PL, 인도 확인 자료 역할로 연결할 수 있게 했다.
- 통관 완료 리포트는 신고필증, 납부영수증, CI, PL, C/O, 제품 사양서 역할로 연결할 수 있게 했다.
- 요청자 상세과 선정 파트너 상세 페이지가 완료 리포트 문서 매핑을 조회해 패널에 전달한다.
- 리포트 초안이 없으면 먼저 초안을 저장해야 보관 서류를 연결할 수 있다고 안내한다.
- 보관 서류 연결 action은 request type을 받아 관련 운송/통관 요청자·파트너 상세 route를 revalidate한다.
- 리포트별 문서 매핑 record helper와 회귀 테스트를 추가했다.
- 새 migration은 만들지 않고 P35.5에서 만든 RPC와 table을 사용했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P36.2 completion report submit/acknowledge 상태 전이 계획이다. 이번 P36.1이 서류 연결 UI라면, P36.2는 초안 리포트를 제출·화주 확인·파트너 확인·운영 검토·잠금으로 넘기는 안전한 상태 경계를 정리하는 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts server/repositories/service-request-completion-report.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 비로그인 상태 `/requests/freight/test-request-id`, `/requests/clearance/test-request-id` 요청 시 `/login` 307 redirect 확인

### operations completion report visibility

- 이전 작업은 완료 리포트 문서 매핑 경계인 P35.5이고, 이번 작업은 운영 화면에서 완료됐지만 완료 리포트가 없는 요청을 볼 수 있게 한 P35.6이다.
- 운영 summary에 `completedWithoutReport` 지표를 추가했다.
- 운영 summary repository가 `service_request_completion_reports`를 조회해 voided가 아닌 완료 리포트 존재 여부를 계산한다.
- completion report schema가 아직 적용되지 않은 환경에서는 운영 summary가 리포트 없음 지표를 0으로 두고 기존 운영 통계를 계속 계산한다.
- 대표 우선순위 큐, 복사용 운영 개선 요청, 운영 지표 카드에 “완료 리포트 없음” 항목을 추가했다.
- 완료 리포트가 없는 완료 요청은 낮은 후기/후기 미제출보다 먼저 정산·보관 서류 흐름 점검 대상으로 올라오게 했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P36.1 completion report UI archive mapping이다. 이번 P35.6이 운영 지표라면, P36.1은 완료 리포트 화면에서 기존 요청 서류를 최종 보관 역할로 연결하는 UI 작업이다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts server/repositories/platform-marketplace-governance.test.ts server/repositories/service-request-completion-report.repository.test.ts features/service-requests/service-request-completion-report-schemas.test.ts`
- `npm run build`
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### completion report document archive mapping

- 이전 작업은 완료 리포트 상태/작성 CTA를 상세 화면에 붙인 P35.4이고, 이번 작업은 기존 요청 서류를 완료 리포트의 최종 보관 역할로 연결하는 P35.5다.
- `attach_completion_report_document(uuid, uuid, text, boolean)` RPC skeleton을 추가했다.
- RPC는 report가 voided/locked가 아닌지, 요청 서류가 같은 request에 속하는지, requester/selected partner/staff 권한인지, 해당 서류를 읽을 수 있는지 검증한다.
- `service_request_completion_report_documents`에 직접 insert/update RLS를 열지 않고 RPC만 execute grant 했다.
- audit metadata에는 request id, report id, document id, 역할, required flag만 저장하고 파일명이나 문서 원문은 저장하지 않는다.
- 완료 리포트 문서 매핑 schema, repository, action을 추가했다.
- 완료 리포트 문서 매핑 조회는 schema 미적용 환경에서 `schemaReady: false`로 복구한다.
- governance test와 schema/repository tests를 보강했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P35.6 operations completion report visibility다. 이번 P35.5가 문서 연결 경계라면, P35.6은 운영자가 완료됐지만 리포트가 없는 요청을 볼 수 있게 하는 관찰성 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts server/repositories/service-request-completion-report.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `supabase db lint --local --fail-on error`
- `npm run build`

### completed UI skeleton

- 이전 작업은 완료 리포트 repository/action layer인 P35.3이고, 이번 작업은 요청자/선정 파트너 상세의 완료 상태 영역에 완료 리포트 상태와 작성 CTA를 연결한 P35.4다.
- `ServiceRequestCompletionReportPanel`을 추가했다.
- 완료 리포트가 없으면 미작성 상태, 있으면 상태·금액·수정일·요약을 표시한다.
- 완료 리포트 초안 작성/수정 폼은 `saveServiceRequestCompletionReportAction`만 호출하고, 직접 table write는 하지 않는다.
- 운송/통관 요청자 상세과 선정 파트너 상세에서 완료 리포트를 조회해 완료 상태 패널에 전달한다.
- 리스트 화면은 기본값을 유지해 기존 compact 카드 동작을 깨지 않게 했다.
- 통관 완료 리포트 안내는 실제 신고 결과와 예비 조회 출처를 구분해야 한다는 문구를 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P35.5 completion report document archive mapping이다. 이번 P35.4가 리포트 상태/작성 CTA라면, P35.5는 기존 요청 서류를 최종 보관 역할로 연결하는 경계다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts server/repositories/service-request-completion-report.repository.test.ts`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts server/repositories/platform-marketplace-governance.test.ts server/repositories/service-request-completion-report.repository.test.ts features/service-requests/service-request-completion-report-schemas.test.ts`
- `npm run build`
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### completion report repository/action layer

- 이전 작업은 완료 리포트 DB/RLS skeleton인 P35.2이고, 이번 작업은 앱 서버 코드에서 완료 리포트를 읽고 저장하는 P35.3이다.
- `serviceRequestCompletionReportSchema`를 추가해 request id, 통화, 최종 금액, 요약, JSON 배열/객체 입력을 검증한다.
- `listOwnCompletionReportsForRequests` repository를 추가해 완료 리포트를 요청 ID 기준으로 읽고 schema 미적용 환경에서는 `schemaReady: false`로 복구한다.
- `saveServiceRequestCompletionReport` repository를 추가해 직접 table write가 아니라 `create_or_update_completion_report` RPC만 호출한다.
- `saveServiceRequestCompletionReportAction` server action을 추가해 이후 UI에서 완료 리포트 저장을 연결할 수 있게 했다.
- 완료 리포트 action은 저장 후 대시보드와 운송/통관 요청자·파트너 상세 route를 revalidate한다.
- 새 migration은 만들지 않고 P35.2의 로컬 migration skeleton을 사용했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P35.4 completed UI skeleton이다. 이번 P35.3이 서버 저장 경계라면, P35.4는 완료 상태 상세 화면에 리포트 상태와 작성 CTA를 보이는 UI 작업이다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts server/repositories/service-request-completion-report.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run features/service-requests/service-request-completion-report-schemas.test.ts server/repositories/service-request-completion-report.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run build`

### completion report migration 초안

- 이전 작업은 완료 리포트 모델 문서인 P35.1이고, 이번 작업은 실제 로컬 marketplace migration 초안에 완료 리포트 table, RLS, RPC skeleton을 넣은 P35.2다.
- `service_request_completion_reports`와 `service_request_completion_report_documents` 테이블 초안을 추가했다.
- 완료 리포트는 요청 1건당 active report 1개만 허용하도록 partial unique index를 추가했다.
- 완료 리포트와 완료 리포트 문서 매핑에 RLS를 켰고, requester, selected partner, staff/admin만 읽도록 정책을 추가했다.
- 미선정 matched partner는 완료 리포트를 읽지 못하도록 read policy가 match table을 참조하지 않게 했다.
- 직접 insert/update RLS를 열지 않고 `create_or_update_completion_report(uuid, jsonb)` RPC로만 완료 리포트를 저장하도록 했다.
- RPC는 completed 요청, selected bid, requester/selected partner/staff 권한, 회사 활성 상태, JSON shape, locked report 수정 차단을 검증한다.
- audit metadata에는 원문 비용·서류명·신고번호를 넣지 않고 count와 역할 중심으로 남긴다.
- governance test에 완료 리포트 table/RLS/RPC 회귀 검증을 추가했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P35.3 completion report repository/action layer다. 이번 P35.2가 DB 경계라면, P35.3은 앱 서버 코드에서 이 RPC를 호출하고 결과를 읽는 경계다.

검증:

- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `supabase db lint --local --fail-on error`
- `npm run build`

### 거래 완료 리포트 실제 모델 초안

- 이전 작업은 해외 파트너 온보딩 보강인 P34.2이고, 이번 작업은 선정·완료 이후 결과 메타데이터와 최종 보관 서류 묶음을 설계한 P35.1이다.
- `docs/SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md`를 추가했다.
- 완료 상태 자체와 완료 리포트 원장을 분리하고, `service_request_completion_reports`와 `service_request_completion_report_documents` 초안 필드를 정의했다.
- 기존 `service_request_documents` 파일을 복제하지 않고 완료 리포트 문서 역할로 매핑하는 구조를 잡았다.
- requester, selected partner, staff/admin만 읽고 미선정 파트너는 읽지 못하는 RLS 방향을 문서화했다.
- 직접 update RLS를 열지 않고 생성, 제출, 확인, 잠금을 RPC-only mutation으로 처리하는 원칙을 정했다.
- 통관 리포트의 HSK/FTA/요건 내용은 예비 조회와 실제 신고 결과 출처를 분리해야 한다고 명시했다.
- `docs/PLATFORM_SCHEMA_PLAN.md`에서 완료 리포트 계획 문서로 연결했다.
- 리뷰어 에이전트는 현재 하위 agent thread 한도 때문에 새로 붙이지 못했고, 이번 문서는 자체 RLS/security review로 처리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P35.2 completion report migration 초안이다. 이번 P35.1이 문서 모델이라면, P35.2는 실제 로컬 migration/RLS/RPC skeleton과 governance test를 작성하는 작업이다.

검증:

- `rg -n "service_request_completion_reports|SERVICE_REQUEST_COMPLETION_REPORT_PLAN|RPC-only|P35\\.1|P35\\.2" docs/SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md docs/PLATFORM_SCHEMA_PLAN.md docs/ROADMAP.md docs/WORK_LOG.md`
- `sed -n '1,240p' docs/SERVICE_REQUEST_COMPLETION_REPORT_PLAN.md`

### 해외 파트너 온보딩 보강

- 이전 작업은 전체 검증 후 다음 플랫폼 레일을 재정렬한 P34.1이고, 이번 작업은 해외 수출입 파트너가 가입·요청 초안 단계에서 준비해야 할 검증 정보와 서류 기대치를 화면에 보강한 P34.2다.
- 회원가입 완료 폼과 일반 가입 폼에 해외 수출입 파트너만 선택했을 때 표시되는 검증 안내를 추가했다.
- 한국 사업자등록번호 없이 가입 가능한 조건은 유지하되, 회사명·국가, 웹사이트 또는 담당자 연락처, 거래 서류 또는 제품 자료가 운영자 확인 자료가 될 수 있음을 표시했다.
- 운송·통관 요청 초안의 해외 파트너 안내에 검증, 서류, 국가 역할 구분을 카드 형태로 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.
- 다음 작업은 P35.1 거래 완료 리포트 실제 모델 초안이다. 이번 P34.2가 가입·요청 전 안내라면, P35.1은 선정·완료 이후 결과 기록과 최종 서류 묶음의 데이터 모델 계획이다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run features/auth/schemas.test.ts features/service-requests/marketplace-request-prefill.test.ts`
- `npm run build`
- 로컬 서버 `http://localhost:3100`에서 `/login` 200 응답 확인
- 비로그인 상태 `/requests/freight?direction=import&destinationCountry=KR` 요청 시 `/login` 307 redirect 확인

### 작업 레일 상태 점검·다음 우선순위 재정렬

- 이전 작업은 완료 전 요청에서 피드백 조회가 되살아나지 않도록 헬퍼와 테스트로 고정한 P20.2이고, 이번 작업은 코드 기능 추가가 아니라 다음 작업 묶음의 우선순위를 재정렬한 P21.1이다.
- P17~P20에서 요청 목록 limit, index, 중복 fetch, next-focus, feedback 조회 조건이 1차로 정리된 것을 기준으로 다음 병목을 다시 잡았다.
- 다음 작업을 P21.2 요청 상세 feedback map 변환 일관화, P21.3 요청 상세 loader 중복 패턴 정리, P22.1 알림 발송 adapter 경계 분리, P23.1 운영 통계와 거래 신뢰지표 연결 순서로 재배치했다.
- P21.2는 직전 작업과 달리 "피드백을 언제 조회할지"가 아니라 "조회한 feedback Map을 어떤 형태로 페이지에 넘길지"를 일관화하는 작업으로 정의했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `rg -n "P20\\.2|P21\\.|다음|Phase|플랫폼|요청" docs/ROADMAP.md`
- `sed -n '44,145p' docs/ROADMAP.md`

### 요청 상세 feedback map 변환 일관화

- 이전 작업은 작업 순서와 남은 병목을 재정렬한 P21.1이고, 이번 작업은 상세 페이지에서 조회한 feedback Map을 페이지마다 다르게 변환하던 반복을 제거한 P21.2다.
- 운송 요청 상세, 통관 의뢰 상세, 운송 opportunity 상세, 통관 opportunity 상세에서 직접 `Object.fromEntries`를 호출하지 않고 `serviceRequestFeedbackMapToRecord` helper를 사용하게 했다.
- 목록 페이지와 상세 페이지가 같은 feedback record 변환 규칙을 사용한다.
- 화면 문구, 조회 조건, RLS, DB schema는 바꾸지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### marketplace request publish readiness review

- 이전 작업 묶음은 완료 리포트, 피드백, 대시보드 다음 행동 handoff였고, 이번 작업은 화주가 새 요청 초안을 공개 모집으로 전환하기 전 막히는 지점을 보강한 P76이다.
- 다음 marketplace MVP 병목을 `request publish readiness`로 선정했다.
- 운송 요청 초안 카드에서 출발 국가, 도착 국가, 운송 방식이 없으면 공개 버튼만 비활성화하는 데서 끝내지 않고 `포워더 공개 전 필수값을 보완해야 합니다.`, `누락값: 출발 국가, 도착 국가, 운송 방식`, `초안 작성으로 이동`을 표시한다.
- 통관 의뢰 초안 카드에서 목적국이 없으면 관세사무소 공개 설정을 먼저 노출하지 않고 `관세사무소 공개 전 필수값을 보완해야 합니다.`, `누락값: 목적국`, `초안 작성으로 이동`을 표시한다.
- 공개 준비 기준을 `MARKETPLACE_TRANSACTION_MUTATION_E2E_PLAN.md`에 추가해 draft-to-open 전환 검증 항목으로 고정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 push는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 브라우저 화주 세션 `/requests/freight`에서 공개 필수값 없는 운송 초안 생성 후 누락값 안내와 초안 작성 바로가기 확인
- 브라우저 화주 세션 `/requests/clearance`에서 목적국 없는 통관 초안 생성 후 누락값 안내, 초안 작성 바로가기, 공개 설정 숨김 확인
- `npm run review:local-routes`

### marketplace bid comparison and selection review

- 이전 작업 묶음은 초안에서 공개 모집으로 전환하기 전 필수값 안내였고, 이번 작업은 견적이 도착한 뒤 화주가 비교하고 선정하는 중간 병목을 보강한 P77이다.
- 다음 marketplace MVP 병목을 `bid comparison and selection`으로 선정했다.
- 운송 견적 카드에 `최저 총액`, `최단 리드타임`, `후기 보유` 비교 배지를 추가했다.
- 통관 견적 카드에 `최저 총액`, `최단 통관`, `예비 검토 가능` 비교 배지를 추가했다.
- 기존 선정 전 체크리스트, 파트너 신뢰/후기 표시, 선정 액션은 유지했다.
- 견적 비교 배지 기준을 `MARKETPLACE_TRANSACTION_MUTATION_E2E_PLAN.md`에 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 push는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 브라우저 화주 세션 `/requests/freight/75000000-0000-4000-8000-000000000001`에서 `최저 총액`, `최단 리드타임`, `후기 보유` 배지 확인
- 브라우저 화주 세션 `/requests/clearance/75000000-0000-4000-8000-000000000002`에서 `최저 총액`, `최단 통관`, `예비 검토 가능` 배지 확인
- `npm run review:local-routes`

### marketplace overseas partner onboarding review

- 이전 작업 묶음은 견적 도착 후 비교/선정 UX였고, 이번 작업은 해외 파트너가 가입하거나 역할 신청할 때 검증 자료와 제한 기능을 이해하는 앞단 병목을 보강한 P78이다.
- 다음 marketplace MVP 병목을 `overseas partner onboarding`으로 선정했다.
- 해외 수출입 파트너 가입 안내에 운영자 확인 자료와 확인 전 제한될 수 있는 기능을 분리해 표시했다.
- 회사 설정의 플랫폼 역할 신청 화면에 해외 파트너 확인 자료와 보류될 수 있는 경우를 추가했다.
- 한국 사업자등록번호가 없어도 신청 가능하다는 기존 방향은 유지하되, 공개 요청·매칭·민감 서류 공유는 운영 확인 전 제한될 수 있음을 명확히 했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 push는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 브라우저 화주 세션 `/settings/members`에서 `해외 파트너 확인 자료`, `보류될 수 있는 경우`, `회사명과 실제 사업 국가`, `거래 서류, 제품 자료, 선적 예정 정보` 표시 확인
- `npm run review:local-routes`

### marketplace partner preference notification review

- 이전 작업 묶음은 해외 파트너 온보딩 안내였고, 이번 작업은 포워더·관세사무소가 어떤 조건과 알림 기준으로 요청을 받을지 설정하는 P79다.
- 다음 marketplace MVP 병목을 `partner preference notification`으로 선정했다.
- 파트너 관심 조건 화면의 알림 영역에 공개 직후 1회 알림, 마감 임박·묶음 알림, 알림 off 시에도 워크스페이스 확인 가능 기준을 추가했다.
- 출발/수출 국가, 도착/수입 국가, 항구·공항·지역, 화물 태그 입력칸에 비워둘 때 제한하지 않는다는 안내를 추가했다.
- 기존 저장 액션, partner preference schema, 알림 on/off 필드는 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 push는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 브라우저 포워더 세션 `/settings/members`에서 `조건 일치 요청은 공개 직후 1회 알림 대상입니다.`, `비워두면 출발·수출 국가로 제한하지 않습니다.`, `알림을 꺼도 파트너 워크스페이스의 입찰 가능 요청은 계속 확인할 수 있습니다.` 표시 확인
- `npm run review:local-routes`

### marketplace owner operations triage review

- 이전 작업 묶음은 파트너 관심 조건과 알림 기준이었고, 이번 작업은 대표가 운영 통계를 해석하지 않아도 개선 요청을 맡길 수 있게 만든 P80이다.
- 다음 marketplace MVP 병목을 `owner operations triage`로 선정했다.
- 운영 우선순위 큐 카드에 `담당 개발자/운영자`와 `이유 ...` 표시를 추가했다.
- 복사용 운영 개선 요청문에도 담당 주체와 우선 이유를 포함했다.
- 운영 샘플 상세 화면에서 개선 요청 문구를 바로 복사할 수 있게 하고, 먼저 확인할 상세 섹션 링크를 함께 표시했다.
- 운영 상세 화면은 기존처럼 요청 제목, 품목 설명, 서류 파일명, 질문·답변 원문, 견적 금액과 메시지를 노출하지 않는다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 push는 하지 않았다.

검증:

- `npx vitest run features/operations/platform-request-operations-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- 브라우저 개발자 세션 `/operations/users#platform-request-operations`에서 `대표 우선순위 큐`, `담당 개발자` 또는 `담당 운영자`, `이유 ...` 표시 확인
- 브라우저 개발자 세션 `/operations/requests/75000000-0000-4000-8000-000000000001`에서 개선 요청 안내, 바로 확인 링크, `요청 문장 복사` 버튼 확인
- `npm run review:local-routes`

### marketplace completion handoff and dashboard action review

- 이전 작업은 완료 전 피드백 조회 gating 회귀 테스트였고, 이번 작업 묶음은 완료된 거래의 리포트, 보관 서류, 피드백, 대시보드 다음 행동 흐름을 정리한 P72-P75다.
- 완료 리포트 패널에서 보관 서류가 없을 때 `최종 보관 서류 연결이 필요합니다` 안내와 초안 작성 바로가기를 표시한다.
- 완료 리포트 workflow의 비활성 단계 버튼은 `대기:` 문구로 왜 제출, 확인, 운영 검토, 잠금이 막혀 있는지 설명한다.
- 이미 제출한 피드백은 평점과 제출 완료 상태를 보여주고, 추가 제출이 필요하지 않다는 안내를 표시한다.
- 화주 대시보드는 완료 리포트 누락을 피드백 누락보다 먼저 상세 링크로 연결하고, 하단 지표에 `리포트 대기`와 `피드백 대기`를 분리 표시한다.
- 파트너 대시보드는 공개/견적 가능 요청뿐 아니라 선정 후 진행 중인 요청도 `파트너 업무`로 잡도록 확장했고, `입찰 가능`과 `파트너 업무` 지표를 분리했다.
- 운영 통계의 `완료 리포트 없음`과 사용자 대시보드의 `리포트 대기` 의미 차이를 E2E 문서에 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/service-request-completion-report-workflow.test.ts`
- `npx vitest run features/dashboard/dashboard-home.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright 브라우저 확인: 화주 완료 요청 상세, 화주 대시보드, 포워더 대시보드
- Playwright role route smoke: requester `/dashboard`, `/requests/freight`, `/requests/clearance`; forwarder `/dashboard`, `/requests/freight/opportunities/{id}`; broker `/dashboard`, `/requests/clearance/opportunities/{id}`

### 요청 상세 loader 중복 패턴 정리

- 이전 작업은 조회된 feedback Map을 record로 변환하는 helper 적용인 P21.2이고, 이번 작업은 상세 페이지 loader가 완료 상태 피드백 조회와 record 변환을 매번 직접 조립하던 반복을 줄인 P21.3이다.
- `listOwnServiceRequestFeedbackRecordForRequest` repository helper를 추가했다.
- 완료 상태가 아닌 요청은 helper 내부에서 `{}`를 반환해 피드백 DB 조회를 건너뛴다.
- 완료 상태 요청은 기존 `listOwnServiceRequestFeedbacks` 조회 결과를 같은 record 형태로 변환한다.
- 운송 요청 상세, 통관 의뢰 상세, 운송 opportunity 상세, 통관 opportunity 상세의 Promise loader가 feedback record를 바로 받도록 정리했다.
- 완료 전 요청에서 피드백 조회가 호출되지 않는지, 완료 상태에서는 record가 만들어지는지 단위 테스트로 고정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 알림 발송 adapter 경계 분리

- 이전 작업은 요청 상세 loader 반복 정리인 P21.3이고, 이번 작업은 요청 상세와 별개로 marketplace 알림 worker가 실제 발송 기능으로 확장될 수 있게 sender adapter 경계를 분리한 P22.1이다.
- `MarketplaceNotificationSender` 타입과 `MarketplaceNotificationSendInput` 타입을 추가했다.
- 기존 route는 sender를 주입하지 않으므로 현재 운영 동작은 기존처럼 target 계산과 delivery claim까지만 수행한다.
- 테스트나 이후 구현에서 sender를 주입하면 claim 이후 provider 발송 결과를 받아 delivery를 `sent`로 마킹한다.
- sender가 실패하면 delivery를 `retryable_failed` 계열로 마킹하는 기존 repository 함수를 사용하도록 연결했다.
- dry-run은 claim과 sender를 모두 호출하지 않는 기존 안전 경계를 유지한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/jobs/marketplace-notification-worker.service.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- `/api/jobs/marketplace-notifications?dryRun=1` 로컬 요청 시 service role 환경변수 미설정으로 500 JSON 반환 확인. 로컬 환경 문제이며 route handler는 정상 응답했다.

### 운영 통계와 거래 신뢰지표 연결

- 이전 작업은 알림 worker sender adapter 경계 분리인 P22.1이고, 이번 작업은 운영 화면에서 완료 거래와 후기 품질을 개선 요청으로 연결한 P23.1이다.
- 운영 요약 repository가 `service_request_feedbacks`에서 점수 컬럼만 조회하도록 추가했다.
- 후기 코멘트, 서류명, 질문 원문, 견적 금액 원문은 운영 요약에 포함하지 않았다.
- 운영 통계에 피드백 수, 평균 후기, 낮은 후기, 완료 후 피드백 없음 지표를 추가했다.
- 낮은 후기가 있으면 대표 우선순위 큐와 복사용 운영 개선 요청에 먼저 표시되도록 했다.
- 완료됐지만 피드백이 없는 요청도 후기 CTA 개선 대상으로 잡히도록 했다.
- 운영 패널의 지표 카드와 복사용 프롬프트에 거래 후기/후기 미제출 항목을 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### 운영 신뢰지표 UX 문구 점검

- 이전 작업은 운영 통계에 후기 품질 지표를 연결한 P23.1이고, 이번 작업은 지표를 더 추가하는 것이 아니라 대표가 그 수치를 보고 무엇을 맡길지 이해하기 쉽게 문구를 다듬은 P23.2다.
- 운영 패널에 `거래 신뢰지표 해석` 블록을 추가했다.
- 낮은 후기가 있으면 파트너 비교 기준, 선정 전 안내, 완료 후 후속 관리가 점검 대상임을 표시한다.
- 완료 후 피드백이 없으면 후기 요청 CTA와 신뢰 데이터 축적 문제로 해석해 보여준다.
- 신뢰지표 블록은 후기 수, 평균 점수, 미제출 수를 함께 보여주며, 후기 코멘트나 민감 원문은 다루지 않는다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### 사용자 요청 시작 흐름 재점검

- 이전 작업은 운영자가 보는 신뢰지표 문구 정리인 P23.2이고, 이번 작업은 실제 화주/해외 파트너가 운송·통관 요청을 시작할 때 흐름을 더 쉽게 이해하도록 정리한 P24.1이다.
- `RequestStartFlowPanel` 공통 컴포넌트를 추가했다.
- 운송 견적 요청 화면 상단에 `초안 저장 → 서류 보완 → 공개·비교` 3단계 흐름을 표시했다.
- 통관 의뢰 요청 화면 상단에 `초안 저장 → 서류 보완 → 공개·선정` 3단계 흐름을 표시했다.
- 통관 화면 문구는 HS, FTA, 요건 정보가 예비 참고값이며 담당자 검토 흐름으로 이어진다는 안전 문구를 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 요청 시작 화면 접근성·모바일 밀도 점검

- 이전 작업은 요청 시작 흐름 안내 패널 추가인 P24.1이고, 이번 작업은 모바일/좁은 화면에서 긴 폼으로 바로 이동할 수 있게 빠른 이동을 보강한 P24.2다.
- 요청 시작 흐름 패널에 `초안 작성으로 이동`, `내 요청 보기` anchor 버튼을 추가했다.
- 운송 견적 요청 초안 카드에 `request-draft-form` anchor를 추가했다.
- 통관 의뢰 요청 초안 카드에도 같은 `request-draft-form` anchor를 추가했다.
- 운송/통관 내 요청 목록 카드에 `my-service-requests` anchor를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 파트너 입찰 시작 흐름 재점검

- 이전 작업은 화주 요청 시작 화면의 빠른 이동 보강인 P24.2이고, 이번 작업은 포워더/관세사무소가 매칭 요청을 보고 입찰을 시작하는 파트너 흐름을 정리한 P25.1이다.
- `PartnerOpportunityFlowPanel` 공통 컴포넌트를 추가했다.
- 운송 입찰 가능 요청 카드 상단에 `조건 확인 → 질문 등록 → 견적 제출` 3단계 흐름을 표시했다.
- 통관 입찰 가능 요청 카드 상단에 `조건 확인 → 질문 등록 → 예비 견적 제출` 3단계 흐름을 표시했다.
- 파트너 입장에서는 공개 서류와 조건 확인 후 바로 질문 또는 견적 제출로 이어지는 구조를 먼저 볼 수 있다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 파트너 입찰 상세 CTA 점검

- 이전 작업은 파트너 입찰 가능 목록에 작업 흐름 안내를 추가한 P25.1이고, 이번 작업은 입찰 상세 화면에서도 질문·서류·견적 제출 순서를 놓치지 않도록 보강한 P25.2다.
- 운송 입찰 상세 화면에 `PartnerOpportunityFlowPanel`을 추가했다.
- 통관 입찰 상세 화면에도 같은 흐름 패널을 추가했다.
- 기존 다음 작업 바로가기와 anchor는 유지하고, 그 아래에서 조건 확인, 질문 등록, 견적 제출 순서를 다시 안내한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 요청 상세 화주 CTA 재점검

- 이전 작업은 파트너 입찰 상세 CTA 보강인 P25.2이고, 이번 작업은 화주가 요청 상세에서 서류, 질문 답변, 견적 비교 순서를 놓치지 않도록 보강한 P26.1이다.
- `RequesterDetailFlowPanel` 공통 컴포넌트를 추가했다.
- 운송 요청 상세 화면에 `서류 보완 → 질문 답변 → 견적 비교` anchor 흐름을 추가했다.
- 통관 의뢰 상세 화면에도 같은 구조로 `서류 보완 → 질문 답변 → 견적 비교` 흐름을 추가했다.
- 통관 문구는 관세사무소 견적, 서류, 담당자 검토 흐름을 전제로 작성했고 법적 확정 표현은 사용하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 플랫폼 UI 흐름 중복 컴포넌트 점검

- 이전 작업은 화주 요청 상세 CTA 보강인 P26.1이고, 이번 작업은 새 CTA를 더 추가하는 것이 아니라 흐름 패널 3종의 반복 마크업을 공통화한 P27.1이다.
- `ServiceRequestFlowPanel` 공통 컴포넌트를 추가했다.
- 요청 시작 흐름, 파트너 입찰 흐름, 화주 상세 흐름 패널이 같은 렌더링 컴포넌트를 사용하게 했다.
- 요청 시작 패널의 빠른 이동 버튼은 공통 패널의 footer 영역으로 유지했다.
- 중첩 카드가 생기지 않도록 공통 패널이 footer를 직접 렌더링하게 조정했다.
- 첫 검증에서 readonly steps 타입 문제를 발견했고, `ReadonlyArray<ServiceRequestFlowStep>`로 수정했다.
- `typecheck`와 `next build`를 동시에 돌렸을 때 Next 타입 산출물 타이밍 충돌로 1회 실패가 있었고, 빌드 후 `next-env.d.ts`를 원래 dev 타입 경로로 되돌린 뒤 `npm run typecheck`를 단독 재실행해 통과했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run lint`
- `npm run build`
- `npm run typecheck` 단독 재실행
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/freight/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 로컬 변경 묶음 최종 점검

- 이전 작업은 흐름 패널 공통화인 P27.1이고, 이번 작업은 새 기능 구현이 아니라 지금까지 이어서 수정한 플랫폼 레일의 로컬 상태와 검증 결과를 정리한 P28.1이다.
- `next-env.d.ts`는 빌드 산출 변경이 남지 않도록 확인했다.
- 전체 테스트는 107개 파일, 549개 테스트가 통과했다.
- 현재 로컬 변경 항목은 `git status --short | wc -l` 기준 58개다. 이 숫자에는 이번 연속 작업 이전부터 누적된 로컬 플랫폼 전환 파일과 untracked 파일이 포함된다.
- 주요 변경 축은 요청 상세 feedback loader 정리, 알림 sender adapter 경계, 운영 신뢰지표 연결, 화주/파트너 요청 흐름 안내, 흐름 패널 공통화다.
- 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm test`
- `git status --short`
- `git diff -- next-env.d.ts`
- `rg -n "ServiceRequestFlowPanel|RequestStartFlowPanel|PartnerOpportunityFlowPanel|RequesterDetailFlowPanel|listOwnServiceRequestFeedbackRecordForRequest|MarketplaceNotificationSender|averageFeedbackRating" app features server`

### 플랫폼 레일 다음 기능 후보 정리

- 이전 작업은 로컬 변경 묶음 최종 점검인 P28.1이고, 이번 작업은 코드를 추가로 바꾸기 전에 다음 구현 후보를 다시 정렬한 P29.1이다.
- 다음 후보를 거래 완료 이후 리포트/정산 placeholder, 알림 sender 실제 adapter 준비, 운영 화면 실사용 점검, 요청 상세 서류 handoff 개선, 해외 파트너 온보딩 보강 순서로 정리했다.
- 다음 코드 작업은 P29.2 거래 완료 이후 리포트/정산 placeholder 점검으로 잡았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `docs/ROADMAP.md`의 P29 다음 구현 후보 확인

### 거래 완료 이후 리포트/정산 placeholder 점검

- 이전 작업은 다음 구현 후보 정리인 P29.1이고, 이번 작업은 완료 상태에서 사용자가 기대하는 정산·리포트·최종 서류 기능의 최소 placeholder를 추가한 P29.2다.
- `PostCompletionPlaceholder` 공통 컴포넌트를 추가했다.
- 운송 완료 상태에는 최종 운임, 운송 상태 이력, B/L 또는 AWB와 최종 보관 서류 묶음이 이후 연결될 예정임을 표시했다.
- 통관 완료 상태에는 신고·납부 결과, 관세사무소 정산, 신고필증 등 최종 보관 서류 묶음이 이후 연결될 예정임을 표시했다.
- 실제 정산 금액 입력이나 리포트 생성 기능은 아직 추가하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 알림 sender 실제 주입 전 운영 조건 점검

- 이전 작업은 완료 이후 정산/리포트 placeholder인 P29.2이고, 이번 작업은 알림 sender를 실제 route에 연결하기 전 운영 조건을 먼저 차단하는 P30.1이다.
- `getMarketplaceNotificationSendReadiness` helper를 추가했다.
- 실제 발송은 `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED`와 `MARKETPLACE_NOTIFICATIONS_PROVIDER`가 모두 준비된 경우에만 readiness가 true가 되도록 했다.
- `/api/jobs/marketplace-notifications` route에 `send=1` guard를 추가했다.
- `send=1`이 들어와도 readiness가 false이면 worker claim 전에 400 JSON으로 차단한다.
- readiness가 true여도 아직 sender adapter는 route에 연결하지 않고, “sender adapter is not connected yet”으로 차단한다.
- 기존 `dryRun`, `limit`, `reminderWindowHours` 흐름은 유지한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-worker.service.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- `/api/jobs/marketplace-notifications?dryRun=1&send=1` 요청 시 실제 발송 없이 readiness false 400 JSON 반환 확인

### 알림 provider adapter skeleton

- 이전 작업은 알림 sender readiness 차단인 P30.1이고, 이번 작업은 실제 provider 구현을 나중에 끼울 수 있는 adapter 파일 구조와 no-op 테스트 경계를 만든 P30.2다.
- `createMarketplaceNotificationProvider` helper를 추가했다.
- 현재 provider는 `internal_dry_run`만 지원하며 외부 이메일, 문자, 앱 푸시를 발송하지 않는다.
- 알 수 없는 provider 이름은 sender를 만들지 않고 `null`을 반환한다.
- `internal_dry_run` sender는 provider id만 반환해 worker의 sent transition 리허설에 사용할 수 있게 했다.
- route에는 아직 provider를 연결하지 않았고, 실제 발송은 계속 readiness guard로 차단된다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/jobs/marketplace-notification-provider.test.ts server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-worker.service.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- `/api/jobs/marketplace-notifications?dryRun=1&send=1` 요청 시 실제 발송 없이 readiness false 400 JSON 반환 확인

### internal dry-run sender route 연결 검토

- 이전 작업은 provider skeleton 추가인 P30.2이고, 이번 작업은 `internal_dry_run` provider를 route에 제한적으로 연결한 P30.3이다.
- `/api/jobs/marketplace-notifications`에서 `send=1` 요청이 들어온 경우에만 provider를 생성한다.
- `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED`와 `MARKETPLACE_NOTIFICATIONS_PROVIDER` readiness가 false이면 worker 실행 전에 400으로 차단한다.
- readiness가 true이고 provider가 `internal_dry_run`이면 worker에 sender를 주입할 수 있게 했다.
- 알 수 없는 provider는 지원하지 않는 provider로 차단한다.
- 외부 이메일, 문자, 푸시 발송 provider는 아직 구현하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/jobs/marketplace-notification-provider.test.ts server/jobs/marketplace-notification-send-readiness.test.ts server/jobs/marketplace-notification-worker.service.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- `/api/jobs/marketplace-notifications?dryRun=1&send=1` 요청 시 기본 env에서는 실제 발송 없이 readiness false 400 JSON 반환 확인

### 알림 운영 리허설 문서화

- 이전 작업은 internal dry-run sender route 연결인 P30.3이고, 이번 작업은 코드가 아니라 운영자가 알림 worker를 어떻게 리허설해야 하는지 정리한 P31.1이다.
- `docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md`를 추가했다.
- target 계산 전용 dry-run 호출을 문서화했다.
- `send=1`이 기본 env에서 차단되어야 하는 예상 결과를 문서화했다.
- `MARKETPLACE_NOTIFICATIONS_SEND_ENABLED=true`, `MARKETPLACE_NOTIFICATIONS_PROVIDER=internal_dry_run` 조합으로 내부 sender 리허설을 할 수 있음을 적었다.
- 실제 외부 이메일, 문자, 푸시 provider는 아직 연결하지 않았다고 명시했다.
- 알림 metadata에 민감 문서명, 질문 원문, 견적 금액 원문, 개인정보를 넣지 않는 주의사항을 남겼다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `docs/MARKETPLACE_NOTIFICATION_RUNBOOK.md` 내용 검토

### 선정 이후 서류 handoff 개선

- 이전 작업은 알림 운영 리허설 문서화인 P31.1이고, 이번 작업은 화주가 업체 선정 후 어떤 서류를 선정 파트너 전용으로 넘겨야 하는지 보강한 P32.1이다.
- `SelectedPartnerDocumentHandoff` 공통 컴포넌트를 추가했다.
- 운송 요청 선정 이후 영역에 선정 포워더 전용 공개 서류 수와 추천 handoff 서류를 표시했다.
- 통관 의뢰 선정 이후 영역에도 선정 관세사무소 전용 공개 서류 수와 추천 handoff 서류를 표시했다.
- 선정 파트너 전용 서류가 0건이면 공개 범위를 선정 파트너 전용으로 지정하라는 경고를 표시한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 파트너 측 선정 이후 handoff 안내 보강

- 이전 작업은 화주 측 선정 이후 서류 handoff 보강인 P32.1이고, 이번 작업은 선정된 포워더/관세사무소가 본인 화면에서 확인해야 할 서류와 조건을 더 명확히 표시한 P32.2다.
- 운송 opportunity 상세의 선정 이후 영역에 `SelectedPartnerDocumentHandoff`를 추가했다.
- 통관 opportunity 상세의 선정 이후 영역에도 같은 handoff 안내를 추가했다.
- 파트너는 선정 이후 본인이 확인해야 할 선정 파트너 전용 공개 서류 수와 추천 handoff 서류를 볼 수 있다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 전체 플랫폼 변경 최종 재검증

- 이전 작업은 파트너 측 선정 이후 handoff 안내 보강인 P32.2이고, 이번 작업은 새 기능 추가가 아니라 이번 연속 작업 전체를 다시 검증한 P33.1이다.
- `npm run typecheck` 통과.
- `npm run lint` 통과.
- `npm test` 통과: 109개 파일, 554개 테스트.
- `npm run build` 통과.
- 로컬 변경 항목은 `git status --short | wc -l` 기준 63개다. 이 숫자에는 이번 연속 작업 이전부터 누적된 로컬 플랫폼 전환 파일과 untracked 파일이 포함된다.
- `next-env.d.ts`는 빌드 산출 변경이 남지 않도록 원래 dev 타입 경로로 되돌렸다.
- route 확인:
  - `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111` 비로그인 307 `/login`
  - `/requests/clearance/11111111-1111-4111-8111-111111111111` 비로그인 307 `/login`
  - `/api/jobs/marketplace-notifications?dryRun=1&send=1` 기본 env에서 readiness false JSON 반환
- 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- route smoke
- `git diff -- next-env.d.ts`

### 다음 플랫폼 레일 재정렬

- 이전 작업은 전체 플랫폼 변경 재검증인 P33.1이고, 이번 작업은 다음 코드 작업 후보를 다시 우선순위화한 P34.1이다.
- 다음 후보를 해외 파트너 온보딩 보강, 거래 완료 리포트 실제 모델 초안, 알림 internal dry-run 운영 리허설, 운영 화면 카드 밀도 재점검 순서로 정리했다.
- 다음 코드 작업은 P34.2 해외 파트너 온보딩 보강으로 잡았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `docs/ROADMAP.md`의 P34 다음 코드 작업 후보 확인

## 2026-05-30

### HS CODE 일괄 조회 입력·보완 UX 보강

- 일괄조회 XLSX/CSV/붙여넣기 입력에서 실무형 컬럼명을 자동 인식하도록 보강했다.
  - 예: `세번부호`, `거래품명`, `Commodity Code`, `Description`, `Remarks`
  - CSV 업로드도 따옴표 안 쉼표가 포함된 품명을 깨뜨리지 않도록 같은 parser를 사용한다.
- 4자리/6자리/8자리 HS 입력 행은 단순 오류로 끝내지 않고, published HS 데이터 기준 하위 HSK 10자리 후보를 표시한다.
- 보완 필요 행의 화면, XLSX, 복사 안내문에 하위 후보와 보완 질문을 함께 포함한다.
- 후보 링크는 조회기준일과 수입국가를 유지해 통합조회 상세로 이동한다.
- HS CODE가 비어 있고 품명만 있는 행도 버리지 않고 보존한다.
- 품명만 있거나 입력 HS에서 하위 후보를 찾지 못한 행은 AI 정규화 캐시 경로를 통해 예비 HS 방향과 보완 질문을 표시한다.
  - 비용 폭증을 막기 위해 한 번의 일괄조회에서 AI 보조 대상은 최대 20행으로 제한한다.
- XLSX 결과 파일에 `업체 전달용` 시트를 추가했다.
  - 입력행, 품명, 입력 HS, 상태와 함께 한국어·영어·중문 보완요청 문구를 한 번에 제공한다.
  - 정상 조회 행은 한국어 예비 조회 안내문을 제공하고, 보완 필요 행은 해외 수출자에게 전달할 수 있는 다국어 보완요청 문구를 제공한다.
  - 영어·중문 요청문에서는 한국어 후보명/AI 사유를 그대로 섞지 않고, HS 후보 코드와 “예비 방향/최종 분류 아님” 문구 중심으로 표시한다.
- 결과 화면에 XLSX 다운로드 시트별 용도 설명을 추가했다.
  - `전체 결과`: 내부 검토용
  - `보완 필요`: 10자리 미확정·조회 실패 행 확인용
  - `업체 전달용`: 다국어 보완 요청문 복사용
- `BACKGROUND_JOBS_ENABLED=true`이고 80행 이상 입력된 경우 HS CODE 일괄 조회를 `hs_batch_lookup` 백그라운드 작업으로 등록하도록 추가했다.
  - 기존 소량 조회는 즉시 처리 흐름을 유지한다.
  - 큐 작업은 회사/사용자 범위로 저장되며, payload에는 입력 행과 조회기준일·목적국만 저장하고 문서 원문 텍스트는 저장하지 않는다.
  - `/api/jobs/run` worker가 `document_extraction`과 함께 `hs_batch_lookup` 작업을 처리한다.
  - 작업 결과에는 조회기준일, 목적국, 요약, 행별 예비 조회 결과를 저장한다.
- `/hs/batch` 화면에서 최근 `hs_batch_lookup` 작업 상태를 다시 확인할 수 있게 했다.
  - 완료된 백그라운드 작업은 저장된 행별 결과로 기존 `전체 결과`, `보완 필요`, `업체 전달용` XLSX를 다시 다운로드할 수 있다.
  - 조회는 Supabase RLS를 통과한 현재 회사 범위의 작업만 표시한다.
- `/api/jobs/run`을 실제 worker cron으로 호출할 수 있게 운영 진입점을 보강했다.
  - 다른 job route와 동일하게 `JOB_WORKER_SECRET` 또는 `CRON_SECRET`, query secret, `GET`/`POST`를 지원한다.
  - `vercel.json`에 `/api/jobs/run` 5분 주기 cron을 추가했다.
- 운영 반영:
  - Supabase production DB에 `20260530001000_hs_batch_lookup_jobs.sql` migration을 적용했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - Vercel `BACKGROUND_JOBS_ENABLED`를 production/preview에서 `true`로 갱신하고 production을 재배포했다.
  - `https://hsfinder.co.kr/api/jobs/run` 수동 실행 결과 200 OK, claimed 0건을 확인했다.
- 운영 E2E:
  - 일회성 테스트 계정으로 로그인 후 `/hs/batch`에서 82행 입력을 제출해 `hs_batch_lookup` 큐 등록을 확인했다.
  - `/api/jobs/run` 수동 실행 결과 해당 job 1건이 claimed/succeeded 처리되었다.
  - 처리 결과 요약: 총 82행, 성공 55행, 확인 필요 27행, 오류 0행.
  - `/hs/batch` 최근 백그라운드 조회 섹션에서 82행 작업과 XLSX 다운로드 버튼 노출을 확인했다.
  - 검증 후 테스트 계정, profile/company, background job 데이터를 삭제했다.
- 백그라운드 worker 실행 이력 저장을 추가했다.
  - `background_job_runs` 테이블에 `/api/jobs/run` 호출 단위의 worker id, 상태, claimed/succeeded/failed 건수, 소요시간, 오류 메시지를 저장한다.
  - 운영 점검 화면에 최근 worker 실행 이력, 마지막 실행 시각, 마지막 상태, 처리/실패 건수를 표시한다.
  - 개별 job 상태와 별도로 cron route 자체의 실행 여부를 확인할 수 있게 했다.
- 운영 반영:
  - Supabase production DB에 `20260530002000_background_job_runs.sql` migration을 적용했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - production 배포 후 `/api/jobs/run` 수동 실행 결과 200 OK, claimed 0건을 확인했다.
  - `background_job_runs` 최신 row가 `succeeded`, claimed 0, failed 0으로 저장되는 것을 확인했다.
- worker 실패 메일 알림을 추가했다.
  - `/api/jobs/run`에서 실패 job이 있거나 route-level 오류가 발생하면 `OPERATIONS_ALERT_EMAIL` 또는 `DEVELOPER_ALERT_EMAIL`로 운영자 메일을 보낸다.
  - 알림 본문에는 worker id, 처리 건수, 실패 job id/reason만 포함하고 payload, 문서 원문, invoice 내용은 포함하지 않는다.
  - 운영 점검 화면의 외부 연동 준비 상태에 `운영 실패 알림` 항목을 추가했다.
- 운영 반영:
  - Vercel production에 `OPERATIONS_ALERT_EMAIL`을 추가하고 production을 재배포했다.
  - 재배포 후 `/api/jobs/run` 수동 실행 결과 200 OK, claimed 0건을 확인했다.
- worker 실패 알림 리허설 도구를 추가했다.
  - `npm run ops:job:background-failure-rehearsal` 스크립트가 임시 `hs_batch_lookup` 작업을 생성하고 의도적으로 잘못된 payload를 넣어 실패 경로를 검증한다.
  - 리허설 payload에는 회사/사용자/문서 원문/인보이스 내용이 없고, 검증 후 임시 job row를 삭제한다.
  - `/api/jobs/run` 응답에 알림 전송 결과를 포함해 운영 리허설에서 `alert.sent === true`를 확인할 수 있게 했다.
  - `background_job_runs` 이력은 실패 경로 증적으로 남겨 운영 점검 화면에서 확인할 수 있게 했다.
- 운영 리허설:
  - production 배포 후 `vercel env run -e production -- npm run ops:job:background-failure-rehearsal`을 실행했다.
  - 임시 job `ab1bb679-6feb-4a65-a625-bd2753338f70`이 claimed 1건으로 처리되고 의도한 실패 결과로 `dead`, attempts 1이 되었다.
  - worker run `failure-rehearsal-1780112715634`는 `failed`, failed_count 1로 저장되었다.
  - 알림 응답은 `sent: true`로 확인했고, 임시 job row는 스크립트 finally 단계에서 삭제했다.
  - production smoke 10개 경로 모두 통과했다.
- worker 실패 알림 중복/폭주 방지를 추가했다.
  - `operations_alert_events` 테이블을 추가해 운영 알림의 발송, throttle 생략, 발송 실패 이력을 남긴다.
  - 실패 알림은 실패 유형을 해시한 `alert_key` 기준으로 기본 30분 동안 중복 발송을 생략한다.
  - `OPERATIONS_ALERT_THROTTLE_MINUTES`로 throttle 시간을 조정할 수 있으며, 음수/미설정/비숫자 값은 기본 30분을 사용한다.
  - 알림 이벤트에는 worker id, 처리 건수, 실패 건수 같은 운영 메타데이터만 저장하고 payload, 문서 원문, invoice 내용은 저장하지 않는다.
  - 운영 리허설 worker는 반복 검증이 가능하도록 throttle을 우회한다.
  - 운영 점검 화면에 `운영 알림 이력` 섹션을 추가해 최근 발송, 생략, 발송 실패 상태와 alert key를 확인할 수 있게 했다.
- 운영 반영:
  - Supabase production DB에 `20260530003000_operations_alert_events.sql` migration을 적용했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - production 배포 후 실패 알림 리허설을 다시 실행해 임시 job `78319c36-d716-402b-ab10-3b7edebe210e`이 `dead`, worker run이 `failed`, 알림이 `sent: true`로 처리되는 것을 확인했다.
  - `operations_alert_events` 최신 row가 `background_job_failure`, `sent`, provider id 있음, alert key `background_job_failure:jobs:1098fd3c155b050e`로 저장되는 것을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 운영 알림 이력 보존 정책을 추가했다.
  - `cleanup_operations_alert_events(retention_days)` RPC를 추가해 cutoff 이전 `operations_alert_events` row를 DB에서 직접 삭제하고 삭제 건수만 반환한다.
  - `/api/jobs/operations-retention` 보호 route와 `npm run ops:job:operations-retention` 스크립트를 추가했다.
  - 기본 보존 기간은 90일이며 `OPERATIONS_ALERT_RETENTION_DAYS`로 조정할 수 있다. 1 미만, 비숫자, 미설정 값은 기본 90일로 처리한다.
  - Vercel Cron에 매일 03:40 KST 실행되도록 `40 18 * * *` UTC schedule을 추가했다.
- 운영 반영:
  - Supabase production DB에 `20260530004000_cleanup_operations_alert_events.sql` migration을 적용했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - production 배포 후 `npm run ops:job:operations-retention`을 실행해 200 OK, retentionDays 90, deletedCount 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 백그라운드 작업/worker 실행 이력 보존 정책을 추가했다.
  - `cleanup_background_job_history(retention_days)` RPC를 추가해 오래된 `background_job_runs`와 완료 상태의 `background_jobs`를 삭제한다.
  - `background_jobs`는 `succeeded`, `canceled`, `dead` 상태만 삭제 대상으로 삼고, `queued`, `running`, `failed` 재시도 대상 작업은 삭제하지 않는다.
  - 삭제 기준일은 `background_job_runs.created_at`과 `background_jobs`의 `finished_at`, `updated_at`, `created_at` 순서의 fallback 기준이다.
  - 기본 보존 기간은 90일이며 `BACKGROUND_JOB_HISTORY_RETENTION_DAYS`로 조정할 수 있다.
  - `/api/jobs/operations-retention`이 운영 알림 이력 정리와 background job history 정리를 함께 실행하도록 확장했다.
- 운영 반영:
  - Supabase production DB에 `20260530005000_cleanup_background_job_history.sql` migration을 적용했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - production 배포 후 `npm run ops:job:operations-retention`을 실행해 운영 알림 이력 deletedCount 0, background job runs deletedRuns 0, 완료 job deletedJobs 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 운영 점검 화면에 retention 상태를 추가했다.
  - 운영 알림 이력, worker 실행 이력, 완료 작업 이력의 보존 기간과 cutoff, 현재 정리 후보 건수를 표시한다.
  - 완료 작업 이력은 성공·취소·최종 실패만 정리 대상이라는 운영 조건을 화면에 명시했다.
  - 정리 후보 총합을 카드 badge로 표시해 수동 또는 cron 정리 필요 여부를 빠르게 볼 수 있게 했다.
- 운영 반영:
  - production 배포 후 `npm run ops:job:operations-retention`을 실행해 운영 알림 이력 deletedCount 0, background job runs deletedRuns 0, 완료 job deletedJobs 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 운영 점검 화면 상단 요약을 재구성했다.
  - 기존 환경변수 중심 3개 숫자 카드 대신 `핵심 운영 요약` 카드로 배포 설정, DB 스키마, worker, 작업 큐, 운영 알림, 정리 후보, 조회 품질을 한 번에 보이게 했다.
  - 각 항목에 정상/확인 badge와 상세 지표를 붙여 화면 진입 직후 점검 우선순위를 판단할 수 있게 했다.
  - 기존 상세 섹션은 유지해 요약에서 문제를 발견한 뒤 바로 아래에서 원인을 확인할 수 있게 했다.
- 운영 점검 화면 상세 섹션 탐색을 보강했다.
  - `상세 점검 바로가기` 카드를 추가해 수동 명령, 외부 연동, DB 스키마, 보존 상태, 작업 큐, worker 실행, 운영 알림, 조회 품질 섹션으로 바로 이동할 수 있게 했다.
  - 공통 `Card` 컴포넌트가 section HTML 속성을 받을 수 있게 확장해 각 상세 카드에 안정적인 anchor id를 부여했다.
- 운영 점검 화면의 조회 품질 로그 분류를 보강했다.
  - 조회 telemetry를 오류, fallback, GPT 단계, 무결과, 제품코드, HS6 예비, 10자리 확장, 확인 필요, 정상 버킷으로 분류한다.
  - 조회 품질 섹션 상단에 `빠른 분류` 카드를 추가해 최근 로그의 유형별 건수와 운영 조치 문구를 바로 볼 수 있게 했다.
  - 이슈가 있는 경우 `우선 점검 로그`를 별도로 표시해 원본 테이블을 뒤지지 않아도 진단, 경로, 결과 수, 후보 단계별 수치, 조치 방향을 확인할 수 있게 했다.
  - 이슈가 없을 때는 최근 정상 로그 샘플을 표시해 telemetry 기록 자체가 정상적으로 들어오는지 확인할 수 있게 했다.
  - 원본 테이블에도 `분류` 컬럼을 추가해 전체 로그와 빠른 분류 카드가 같은 기준으로 읽히도록 했다.
- 운영 점검 화면의 반복 조회 품질 이슈를 개선 큐 후보로 승격했다.
  - 같은 조회 품질 분류가 최근 로그에서 3회 이상 반복되면 `반복 이슈 개선 큐 후보`로 별도 표시한다.
  - 운영 요약의 `조회 품질` 카드도 반복 이슈가 있으면 점검 건수 대신 반복 분류 수와 최다 반복 분류를 보여준다.
  - 반복 이슈 카드에는 최근 발생 시각, 진단 목록, route 목록, 운영 조치 문구를 함께 표시한다.
- 반복 조회 품질 이슈를 운영 이슈로 저장하는 흐름을 추가했다.
  - `operations_issue_events` 테이블을 추가해 운영 이슈의 유형, 키, 미해결/해결/제외 상태, 심각도, 발생 횟수, 최초/최근 발생 시각, 조치 문구를 저장한다.
  - `/api/jobs/operations-issues` 보호 job이 최근 조회 telemetry를 스캔하고 반복 이슈를 `lookup_quality_recurring:*` 키로 upsert한다.
  - `npm run ops:job:operations-issues` 수동 명령과 30분 주기 Vercel Cron을 추가했다.
  - 운영 점검 화면에 `운영 이슈 처리 상태` 섹션을 추가해 반복 이슈가 저장된 뒤 처리 상태와 조치 내용을 볼 수 있게 했다.
- 운영 이슈 상태 처리와 보존 정책을 추가했다.
  - 개발자 운영 점검 화면에서 운영 이슈를 `해결`, `제외`, `다시 열기` 처리할 수 있게 했다.
  - 상태 변경은 server action에서 개발자 권한을 확인한 뒤 service-role update로 수행하고 `audit_logs`에 이전/이후 상태를 기록한다.
  - `cleanup_operations_issue_events(retention_days)` RPC를 추가해 해결·제외 상태의 오래된 운영 이슈만 정리한다.
  - `operations-retention` job과 운영 점검 retention 카드에 운영 이슈 보존 기간, cutoff, 정리 후보 건수를 포함했다.
- 운영 이슈 E2E 리허설 job을 추가했다.
  - `/api/jobs/operations-issues-rehearsal` 보호 route가 원문 없는 synthetic 조회 telemetry 3건을 만들고 반복 이슈 동기화, 해결 처리, 다시 열기, cleanup을 한 번에 검증한다.
  - 리허설 이슈는 `lookup_quality_rehearsal_*` issue type을 사용해 실제 운영 이슈 키와 충돌하지 않게 했다.
  - 리허설 종료 시 synthetic telemetry와 rehearsal issue row를 삭제하도록 service-role delete policy/grant를 추가했다.
  - `npm run ops:job:operations-issues-rehearsal` 수동 명령을 추가했다.
- 운영 점검 화면에 수동 운영 명령 안내를 추가했다.
  - worker 즉시 실행, 실패 알림 리허설, 운영 이력 정리, 스키마 점검, production smoke 명령을 한 화면에 정리했다.
  - 명령은 `vercel env run -e production -- ...` 형식으로 표시해 secret 값을 화면에 노출하지 않고 Vercel 환경변수에서 주입되도록 했다.
  - 각 명령의 목적과 정상 결과 기준을 함께 표시해 배포 후 점검과 장애 대응 순서를 빠르게 확인할 수 있게 했다.
- 운영 반영:
  - production 배포 후 `npm run ops:job:operations-retention`을 실행해 운영 알림 이력 deletedCount 0, background job runs deletedRuns 0, 완료 job deletedJobs 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 조회 품질 분류 운영 반영:
  - production 배포 `customs-hscode-meod8byca-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결을 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job runs deletedRuns 0, 완료 job deletedJobs 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 반복 조회 품질 이슈 승격 운영 반영:
  - production 배포 `customs-hscode-7z0zt3ype-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결을 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job runs deletedRuns 0, 완료 job deletedJobs 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 반복 조회 품질 운영 이슈 저장 운영 반영:
  - Supabase production DB에 `20260530006000_operations_issue_events.sql` migration을 적용했다.
  - production 배포 `customs-hscode-78bgm8xxj-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결을 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues` 실행 결과 200 OK, scannedEvents 0, recurringIssues 0, syncedIssues 0건을 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job runs deletedRuns 0, 완료 job deletedJobs 0을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 운영 이슈 상태 처리/보존 운영 반영:
  - Supabase production DB에 `20260530007000_cleanup_operations_issue_events.sql` migration을 적용했다.
  - production 배포 `customs-hscode-ip2f5qu06-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결을 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-retention` 실행 결과 operationsIssueEvents retentionDays 180, deletedCount 0을 확인했다.
  - `npm run ops:job:operations-issues` 실행 결과 200 OK, scannedEvents 0, recurringIssues 0, syncedIssues 0건을 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 운영 이슈 리허설 운영 반영:
  - Supabase production DB에 `20260530008000_operations_rehearsal_cleanup_grants.sql` migration을 적용했다.
  - production 배포 `customs-hscode-6oldef5k9-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결을 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, issue/telemetry cleanup true를 확인했다.
  - production smoke 10개 경로 모두 통과했다.
- 운영 이슈 미해결 알림을 추가했다.
  - `/api/jobs/operations-issues`가 반복 조회 품질 이슈를 `operations_issue_events`에 저장한 뒤 미해결 이슈에 대해 `operations_issue_open` 알림을 남긴다.
  - 알림은 `OPERATIONS_ALERT_EMAIL` 또는 `DEVELOPER_ALERT_EMAIL`을 사용하고, `OPERATIONS_ALERT_THROTTLE_MINUTES` 기준으로 같은 issue key의 중복 발송을 제한한다.
  - `operations_alert_events`에는 해시된 alert key와 issue type, severity, occurrence count 같은 운영 메타데이터만 저장하고 입력 품명, 문서 원문, invoice 내용은 저장하지 않는다.
  - 운영 이슈 리허설 job은 반복 검증 중 메일이 발송되지 않도록 `sendAlerts: false`로 유지한다.
- 운영 이슈 알림 운영 반영:
  - production 배포 `customs-hscode-4xt3cz4f0-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues` 실행 결과 scannedEvents 0, recurringIssues 0, syncedIssues 0건, alerts 0건을 확인했다.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, cleanup true를 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job history deletedRuns 0/deletedJobs 0, 운영 이슈 deletedCount 0을 확인했다.
- 운영 이슈 담당자/메모/처리 사유를 추가했다.
  - `operations_issue_events`에 담당자 표시명, 운영 메모, 처리 사유, 상태 변경자, 상태 변경 시각 컬럼을 추가했다.
  - 운영 점검 화면의 운영 이슈 처리 폼에서 담당자, 메모, 처리 사유를 함께 입력한 뒤 해결, 제외, 다시 열기를 수행할 수 있게 했다.
  - 상태 변경 server action은 개발자 권한과 service-role update 흐름을 유지하고, 변경 전후 담당자/메모/처리 사유를 `audit_logs`에 남긴다.
  - RLS는 기존 staff read, service-role write/update 정책을 유지한다.
- 운영 이슈 담당자/메모 운영 반영:
  - Supabase production DB에 `20260530009000_operations_issue_owner_notes.sql` migration을 적용했다.
  - production 배포 `customs-hscode-7i1lckd0z-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, cleanup true를 확인했다.
  - `npm run ops:job:operations-issues` 실행 결과 scannedEvents 0, recurringIssues 0, syncedIssues 0건, alerts 0건을 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job history deletedRuns 0/deletedJobs 0, 운영 이슈 deletedCount 0을 확인했다.
- 운영 이슈 필터/검색을 추가했다.
  - 이전 작업은 이슈별 담당자/메모/처리 사유를 저장하는 기능이고, 이번 작업은 여러 운영 이슈 중 필요한 항목을 빠르게 찾는 목록 탐색 기능이다.
  - 운영 점검 화면에서 상태, 심각도, 담당자, 검색어 기준으로 최근 운영 이슈 목록을 필터링할 수 있게 했다.
  - 검색어는 제목, 요약, 조치, issue key/type, 담당자, 메모, 처리 사유를 대상으로 한다.
  - 필터는 URL query string으로 유지되어 새로고침 후에도 같은 목록 상태를 볼 수 있다.
- 운영 이슈 필터/검색 운영 반영:
  - production 배포 `customs-hscode-kt2bnr3eo-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues` 실행 결과 scannedEvents 0, recurringIssues 0, syncedIssues 0건, alerts 0건을 확인했다.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, cleanup true를 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job history deletedRuns 0/deletedJobs 0, 운영 이슈 deletedCount 0을 확인했다.
- 운영 이슈 담당자별 요약을 추가했다.
  - 이전 작업은 목록에서 특정 이슈를 찾는 필터/검색이고, 이번 작업은 담당자별 미해결 부담과 오래 열린 이슈를 먼저 보는 요약 기능이다.
  - 운영 점검 화면에서 미해결 운영 이슈를 담당자 기준으로 묶어 open, blocker, warning, 오래 열린 기간, 최근 갱신 시각을 표시한다.
  - 담당자 요약 카드를 누르면 해당 담당자의 미해결 이슈 필터 목록으로 이동한다.
  - 담당자가 없는 미해결 이슈는 `미지정`으로 묶어 담당 배정 누락을 확인할 수 있게 했다.
- 운영 이슈 담당자별 요약 운영 반영:
  - production 배포 `customs-hscode-nebvma9xj-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues` 실행 결과 scannedEvents 0, recurringIssues 0, syncedIssues 0건, alerts 0건을 확인했다.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, cleanup true를 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job history deletedRuns 0/deletedJobs 0, 운영 이슈 deletedCount 0을 확인했다.
- 운영 이슈 원인 드릴다운을 추가했다.
  - 이전 작업은 담당자별 미해결 부담을 보는 요약 기능이고, 이번 작업은 운영 이슈가 왜 생겼는지 관련 telemetry 원인으로 내려가는 분석 기능이다.
  - 운영 이슈 metadata의 bucket, route, diagnosis와 최근 조회 telemetry를 대조해 관련 로그 수, 진단, 경로, 후보 수치 샘플을 표시한다.
  - 드릴다운 샘플에는 원문 품명, 이메일, 문서 내용 없이 시간, 진단, 결과 수, AI 후보 수, 공식 후보 수, HS6/10자리 후보 수만 표시한다.
  - 반복 조회 품질 이슈가 아닌 운영 이슈에는 드릴다운을 표시하지 않는다.
- 운영 이슈 원인 드릴다운 운영 반영:
  - production 배포 `customs-hscode-n40t11nwq-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues` 실행 결과 scannedEvents 0, recurringIssues 0, syncedIssues 0건, alerts 0건을 확인했다.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, cleanup true를 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job history deletedRuns 0/deletedJobs 0, 운영 이슈 deletedCount 0을 확인했다.
- 오래 열린 운영 이슈 경고를 추가했다.
  - 이전 작업은 운영 이슈가 왜 생겼는지 원인 telemetry를 보여주는 분석 기능이고, 이번 작업은 미해결 이슈가 얼마나 오래 열려 있는지 처리 우선순위를 표시하는 경고 기능이다.
  - 미해결 이슈의 `first_seen_at` 기준 경과일을 계산해 `열림`, `지연 확인`, `장기 미해결` 배지를 표시한다.
  - 해결·제외 상태의 이슈에는 경과일 경고를 표시하지 않는다.
- 오래 열린 운영 이슈 경고 운영 반영:
  - production 배포 `customs-hscode-on9y0qb57-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
  - `npm run ops:job:operations-issues` 실행 결과 scannedEvents 0, recurringIssues 0, syncedIssues 0건, alerts 0건을 확인했다.
  - `npm run ops:job:operations-issues-rehearsal` 실행 결과 synthetic telemetry 3건, recurringIssues 1건, 운영 이슈 occurrenceCount 3건, resolved/open 상태 변경, cleanup true를 확인했다.
  - `npm run ops:job:operations-retention` 실행 결과 운영 알림 이력 deletedCount 0, background job history deletedRuns 0/deletedJobs 0, 운영 이슈 deletedCount 0을 확인했다.
- 운영 이슈 우선순위 정렬을 추가했다.
  - 이전 작업은 열린 기간을 배지로 표시하는 경고 기능이고, 이번 작업은 운영 이슈 목록의 표시 순서 자체를 처리 우선순위 기준으로 바꾸는 기능이다.
  - 미해결 이슈를 해결·제외 이슈보다 먼저 보여주고, 같은 상태에서는 차단도, 경과일, 반복 건수, 최근 갱신 시각 순으로 정렬한다.
  - 운영 점검 화면의 이슈 목록에 `우선순위순` 표시를 추가해 최신순 목록이 아님을 명확히 했다.
- 운영 이슈 우선순위 정렬 운영 반영:
  - production 배포 `customs-hscode-4mzbu0gx1-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 상태 변경 추적을 보강했다.
  - 이전 작업은 운영 이슈 목록의 표시 순서를 바꾸는 기능이고, 이번 작업은 각 이슈의 상태가 언제, 어떤 운영자 식별자로 변경됐는지 행 안에서 바로 확인하는 추적 기능이다.
  - `status_updated_at`, `status_updated_by`를 요약해 상태 변경 시각과 짧은 운영자 식별자를 표시한다.
  - 전체 사용자 ID는 노출하지 않고 앞 8자리만 표시한다.
- 운영 이슈 상태 변경 추적 운영 반영:
  - production 배포 `customs-hscode-mtknl84cr-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 피드백을 보강했다.
  - 이전 작업은 상태 변경 이력을 행 안에서 확인하는 추적 기능이고, 이번 작업은 운영자가 상태 처리 버튼을 누르는 순간의 pending, success, error 피드백을 주는 입력 UX 기능이다.
  - 운영 이슈 처리 폼을 행 단위 client component로 분리해 처리 중에는 해당 행의 입력창과 버튼을 비활성화한다.
  - server action은 상태 저장 성공 메시지와 입력 오류 메시지를 반환하고, 기존 service-role 업데이트와 audit log 기록은 유지한다.
- 운영 이슈 처리 피드백 운영 반영:
  - production 배포 `customs-hscode-pf1wqttje-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 결과 요약을 추가했다.
  - 이전 작업은 버튼 클릭 중 pending/success/error를 보여주는 입력 UX 기능이고, 이번 작업은 닫힌 운영 이슈의 해결·제외 건수와 평균 처리 기간을 보는 결과 집계 기능이다.
  - 해결·제외 상태 이슈만 집계해 닫힘 건수, 해결 건수, 제외 건수, 평균 처리 기간, 최근 처리 시각을 표시한다.
  - 평균 처리 기간은 `first_seen_at`부터 `resolved_at`, 상태 변경 시각, 갱신 시각 순 fallback으로 계산한다.
- 운영 이슈 처리 결과 요약 운영 반영:
  - production 배포 `customs-hscode-rlaay0bgi-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 빠른 필터를 추가했다.
  - 이전 작업은 닫힌 운영 이슈의 처리 결과를 집계하는 기능이고, 이번 작업은 운영자가 차단 미해결, 장기 미해결, 담당 미지정, 해결, 제외 목록으로 바로 이동하는 탐색 기능이다.
  - 빠른 필터는 기존 필터 파라미터를 사용하며 새 운영 데이터를 저장하지 않는다.
  - 장기 미해결과 담당 미지정 필터를 단위 테스트로 고정했다.
- 운영 이슈 빠른 필터 운영 반영:
  - production 배포 `customs-hscode-hpnef1p5f-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 활성 필터 요약을 추가했다.
  - 이전 작업은 자주 쓰는 조건으로 목록에 이동하는 빠른 필터 기능이고, 이번 작업은 현재 적용 중인 상태, 심각도, 경과, 담당자, 검색어 조건을 화면에 명확히 보여주는 기준 표시 기능이다.
  - 필터가 있으면 조건을 칩으로 표시하고, 필터가 없으면 전체 운영 이슈를 우선순위순으로 표시한다고 안내한다.
  - 활성 필터 라벨 생성을 단위 테스트로 고정했다.
- 운영 이슈 활성 필터 요약 운영 반영:
  - production 배포 `customs-hscode-o72g7meb8-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 필터 해제를 추가했다.
  - 이전 작업은 현재 적용 중인 필터를 칩으로 보여주는 기준 표시 기능이고, 이번 작업은 각 칩에서 해당 조건만 해제해 나머지 필터 조건을 유지하는 필터 조작 기능이다.
  - 활성 필터 칩마다 `해제` 링크를 추가하고, 전체 조건 제거용 `전체 초기화` 링크를 함께 표시한다.
  - 필터 해제는 URL 파라미터만 조정하며 운영 이슈 데이터는 변경하지 않는다.
- 운영 이슈 필터 해제 운영 반영:
  - production 배포 `customs-hscode-oher2cjoq-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 빠른 필터 강조를 추가했다.
  - 이전 작업은 활성 필터 칩에서 조건을 해제하는 필터 조작 기능이고, 이번 작업은 현재 적용 중인 필터 조건과 일치하는 빠른 필터 카드를 `선택됨`으로 보여주는 표시 기능이다.
  - 빠른 필터 프리셋과 현재 URL 필터가 정확히 일치할 때만 선택 상태를 표시한다.
  - 추가 조건이 섞인 조합은 별도 필터로 보고 빠른 필터 선택 상태로 처리하지 않는다.
- 운영 이슈 빠른 필터 강조 운영 반영:
  - production 배포 `customs-hscode-2gh7lmaap-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 빈 상태 안내를 세분화했다.
  - 이전 작업은 현재 필터와 빠른 필터 프리셋이 같은지 강조하는 표시 기능이고, 이번 작업은 필터 결과가 0건일 때 운영자가 다음 조치를 바로 선택할 수 있게 하는 빈 상태 안내 기능이다.
  - 필터 결과 0건과 저장된 운영 이슈 없음 상태를 다른 문구로 구분했다.
  - 필터 결과 0건일 때 `전체 초기화`와 `미해결 전체 보기` 링크를 제공해 조건을 빠르게 다시 조정할 수 있게 했다.
- 운영 이슈 빈 상태 안내 운영 반영:
  - production 배포 `customs-hscode-6h9idz414-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 담당 미지정 필터 안내를 보강했다.
  - 이전 작업은 필터 결과가 비었을 때 다음 조치를 안내하는 빈 상태 기능이고, 이번 작업은 담당자 필터 입력 자체에서 `미지정` 조건의 의미를 명확히 하는 입력 안내 기능이다.
  - `미지정`과 `__unassigned__` 판별 helper를 repository에 추가해 목록 필터링과 화면 안내가 같은 기준을 사용하게 했다.
  - 담당자 입력 placeholder와 도움말을 보강해 담당자명 검색과 미배정 필터를 구분했다.
  - 담당 미지정 판별 기준을 단위 테스트로 고정했다.
- 운영 이슈 담당 미지정 필터 안내 운영 반영:
  - production 배포 `customs-hscode-k5x6xyh2w-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 결과 요약을 추가했다.
  - 이전 작업은 담당자 필터 입력에서 `미지정` 조건의 의미를 안내하는 입력 보강이고, 이번 작업은 현재 목록에 실제로 표시되는 운영 이슈 수와 위험 건수를 한눈에 보는 결과 기준 요약 기능이다.
  - 필터 적용 후 표시 건수, 필터 제외 건수, 미해결, 차단, 주의 건수를 목록 상단에 표시했다.
  - 결과 요약 metric 계산을 repository helper로 분리하고 단위 테스트로 고정했다.
- 운영 이슈 결과 요약 운영 반영:
  - production 배포 `customs-hscode-plvwifxoe-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 빠른 필터 액션 문구를 추가했다.
  - 이전 작업은 현재 목록 기준의 표시/필터 제외/위험 건수를 보여주는 결과 요약 기능이고, 이번 작업은 빠른 필터 카드마다 선택 후 확인할 운영 조치를 표시하는 카드별 액션 안내 기능이다.
  - 차단 미해결, 장기 미해결, 담당 미지정, 해결, 제외 프리셋에 서로 다른 운영 조치 문구를 추가했다.
  - 빠른 필터 action label을 단위 테스트로 고정했다.
- 운영 이슈 빠른 필터 액션 문구 운영 반영:
  - production 배포 `customs-hscode-3dv64rr4v-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 행 처리 정보 표시를 보강했다.
  - 이전 작업은 빠른 필터 카드에 선택 후 확인할 운영 조치를 표시하는 카드 안내 기능이고, 이번 작업은 각 운영 이슈 행 안의 담당자, 메모, 처리 사유, 상태 변경 이력을 구획별로 분리하는 행 가독성 보강이다.
  - 저장 데이터와 상태 변경 로직은 바꾸지 않고 화면 표시 구조만 정리했다.
- 운영 이슈 행 처리 정보 표시 운영 반영:
  - production 배포 `customs-hscode-bucyuwwef-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 상태 변경 문구를 세분화했다.
  - 이전 작업은 각 행의 담당자, 메모, 처리 사유 표시 구획을 나누는 가독성 보강이고, 이번 작업은 상태 변경 이력의 의미를 해결 처리, 제외 처리, 다시 열림으로 명확히 구분하는 상태 추적 보강이다.
  - 상태 변경 helper가 현재 상태 기준 action label을 반환하도록 확장했다.
  - 화면의 상태 변경 이력에 처리 문구, 변경 시각, 짧은 운영자 식별자를 함께 표시했다.
  - 해결, 제외, 다시 열림 문구를 단위 테스트로 고정했다.
- 운영 이슈 상태 변경 문구 운영 반영:
  - production 배포 `customs-hscode-ceiq3qufs-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 긴 텍스트 표시를 안정화했다.
  - 이전 작업은 상태 변경 이력의 의미를 해결 처리, 제외 처리, 다시 열림으로 구분하는 상태 추적 보강이고, 이번 작업은 긴 제목, 요약, 조치, 드릴다운 샘플, 메모가 테이블 폭을 밀지 않도록 하는 레이아웃 안정화다.
  - 제목/요약 셀 폭을 제한하고 주요 텍스트 셀에 줄바꿈 처리를 추가했다.
  - 저장 데이터와 운영 이슈 처리 로직은 바꾸지 않았다.
- 운영 이슈 긴 텍스트 표시 운영 반영:
  - production 배포 `customs-hscode-c7idf9eho-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 키 표시를 보강했다.
  - 이전 작업은 제목, 요약, 조치, 드릴다운 샘플, 메모 같은 긴 텍스트가 테이블 폭을 밀지 않도록 하는 레이아웃 안정화이고, 이번 작업은 긴 `issue_key`만 축약 표시하되 전체 값을 확인할 수 있게 하는 키 확인성 보강이다.
  - 화면에는 긴 issue key를 축약 표시하고, hover title로 전체 issue key를 확인할 수 있게 했다.
  - 저장 데이터와 운영 이슈 처리 로직은 바꾸지 않았다.
- 운영 이슈 키 표시 운영 반영:
  - production 배포 `customs-hscode-mtr43tdv6-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 빈 처리 정보 표시를 보강했다.
  - 이전 작업은 긴 issue key를 축약 표시하되 전체 값을 확인할 수 있게 하는 키 확인성 보강이고, 이번 작업은 담당자, 메모, 처리 사유, 상태 변경 이력이 비어 있을 때 의미 있는 빈 상태 문구를 표시하는 행 정보 보강이다.
  - 담당자, 메모, 처리 사유가 비어 있으면 `미입력`으로 표시한다.
  - 상태 변경 시각이 없으면 `상태 변경 이력 없음`으로 표시한다.
- 운영 이슈 빈 처리 정보 표시 운영 반영:
  - production 배포 `customs-hscode-2948n6d77-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 폼 안내를 보강했다.
  - 이전 작업은 담당자, 메모, 처리 사유, 상태 변경 이력이 비어 있을 때 의미 있는 빈 상태 문구를 표시하는 행 정보 보강이고, 이번 작업은 운영자가 해결, 제외, 다시 열기 버튼을 누르기 전에 어떤 근거를 입력해야 하는지 알려주는 입력 UX 보강이다.
  - 처리 폼 상단에 다음 상태 처리 전 작성할 내용 안내를 추가했다.
  - 담당자, 메모, 처리 사유 placeholder를 실무 입력 목적에 맞게 구체화했다.
  - 담당자 미입력 시 담당 미지정 이슈로 남는다는 안내를 추가했다.
- 운영 이슈 처리 폼 안내 운영 반영:
  - production 배포 `customs-hscode-ets6uph37-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 버튼 안내를 보강했다.
  - 이전 작업은 처리 폼 상단과 입력칸 placeholder로 작성할 근거를 안내하는 입력 UX 보강이고, 이번 작업은 해결, 제외, 다시 열기 버튼 자체에 변경될 상태 설명을 붙이는 버튼 조작 피드백 보강이다.
  - 각 버튼 아래에 `상태를 해결로 변경`, `운영 대상에서 제외`, `미해결 상태로 재전환` 문구를 표시했다.
  - 저장 데이터와 상태 변경 server action 로직은 바꾸지 않았다.
- 운영 이슈 처리 버튼 안내 운영 반영:
  - production 배포 `customs-hscode-af2qyljbr-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 결과 메시지를 보강했다.
  - 이전 작업은 버튼 아래에 변경될 상태 설명을 붙이는 버튼 조작 피드백 보강이고, 이번 작업은 서버 액션의 성공/오류 메시지에 어떤 상태 변경 시도였는지 포함하는 처리 결과 피드백 보강이다.
  - 성공/오류 메시지에 `해결 처리`, `제외 처리`, `다시 열기`를 포함해 저장 결과를 구분한다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 처리 결과 메시지 운영 반영:
  - production 배포 `customs-hscode-awse99yxc-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 결과 메시지 테스트를 추가했다.
  - 이전 작업은 서버 액션 성공/오류 메시지의 표시 내용을 바꾼 처리 결과 피드백 보강이고, 이번 작업은 해당 메시지 생성 규칙을 순수 서비스로 분리해 단위 테스트로 고정하는 회귀 방지 보강이다.
  - `operationsIssueStatusActionLabel`, 성공 메시지, 오류 메시지를 상태별로 검증한다.
  - 오류 메시지는 `해결 처리를`, `제외 처리를`, `다시 열기를`, `상태 변경을`처럼 목적격 조사가 맞게 붙도록 보정했다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 처리 결과 메시지 테스트 운영 반영:
  - production 배포 `customs-hscode-6wu2bc0rv-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` production smoke 10개 경로가 모두 통과했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 후속 안내를 추가했다.
  - 이전 작업은 처리 결과 메시지 생성 규칙을 단위 테스트로 고정하는 회귀 방지 보강이고, 이번 작업은 운영자가 상태 변경 성공 후 다음에 확인할 지점을 화면에서 바로 보는 UX 보강이다.
  - 해결 처리 후에는 재발 모니터링, 제외 처리 후에는 제외 근거와 재개방 대응, 다시 열기 후에는 빠른 필터 기준 우선순위 재확인을 안내한다.
  - 성공 상태에서만 후속 안내를 표시하고 오류 상태에는 오류 메시지만 유지한다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 처리 후속 안내 운영 반영:
  - production 배포 `customs-hscode-g607bg412-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 우선 확인 표시를 추가했다.
  - 이전 작업은 상태 변경 성공 후 후속 확인 지점을 알려주는 처리 이후 UX 보강이고, 이번 작업은 상태 변경 전에 현재 필터 기준 최우선 미해결 이슈를 목록 상단에서 바로 판단하는 처리 전 triage 보강이다.
  - 현재 필터 결과에서 우선순위가 가장 높은 미해결 이슈의 사유, 담당자, 반복 횟수, 경과, 다음 조치를 표시한다.
  - 차단 미해결, 장기 미해결, 담당 미지정, 지연 확인 기준에 따라 같은 기준 보기 링크를 제공한다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 우선 확인 표시 운영 반영:
  - production 배포 `customs-hscode-h1h2t5yxu-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 우선 확인 행 표시를 추가했다.
  - 이전 작업은 최우선 미해결 이슈를 목록 상단에 요약하는 triage 보강이고, 이번 작업은 그 요약 대상이 실제 테이블 행에서 바로 보이도록 연결 표시를 추가하는 행 식별성 보강이다.
  - 우선 확인 대상 행에 별도 배경, 왼쪽 강조선, `우선 확인` 배지, 상단 요약 대상 문구를 표시한다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 우선 확인 행 표시 운영 반영:
  - production 배포 `customs-hscode-mrofm6b8r-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 우선 확인 처리 안내를 추가했다.
  - 이전 작업은 우선 확인 대상 행을 테이블에서 식별하기 쉽게 표시한 행 식별성 보강이고, 이번 작업은 해당 행의 처리 폼 안에서 우선 확인 사유와 다음 조치를 다시 보여주는 처리 입력 안내 보강이다.
  - 우선 확인 대상 행의 처리 폼에만 사유, 다음 조치, 담당자/메모 기록 안내를 표시한다.
  - 일반 운영 이슈 행의 처리 폼과 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 우선 확인 처리 안내 운영 반영:
  - production 배포 `customs-hscode-3b08cj5yq-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 입력 확인을 추가했다.
  - 이전 작업은 우선 확인 대상 행의 처리 폼에 사유와 다음 조치를 반복 표시한 안내 보강이고, 이번 작업은 담당자, 메모, 처리 사유의 현재 작성됨/미입력 상태를 저장 전 표시하는 입력 상태 보강이다.
  - 처리 폼 입력값을 client state로 추적해 담당자, 메모, 처리 사유별 작성 상태와 미입력 안내를 표시한다.
  - 미입력 항목은 저장을 막지 않고 담당자 인계와 사후 검토 품질 저하 가능성만 안내한다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 처리 입력 확인 운영 반영:
  - production 배포 `customs-hscode-3lcvl2k57-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 상태별 권장 입력을 추가했다.
  - 이전 작업은 담당자, 메모, 처리 사유의 작성됨/미입력 상태를 공통으로 보여준 입력 상태 보강이고, 이번 작업은 해결, 제외, 다시 열기 버튼별로 특히 권장되는 입력 항목을 다르게 표시하는 처리 의도별 안내 보강이다.
  - 해결 처리는 메모와 처리 사유, 제외 처리는 처리 사유, 다시 열기는 담당자와 메모 입력을 권장한다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 상태별 권장 입력 운영 반영:
  - production 배포 `customs-hscode-4so7qdjzb-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 폼 안내 흐름을 정리했다.
  - 이전 작업은 해결, 제외, 다시 열기 버튼별 권장 입력 항목을 추가한 단일 안내 보강이고, 이번 작업은 성공 후 입력 변경 안내, 버튼 문구 축약, 우선 확인 안내 중복 제거를 함께 묶은 처리 폼 UX 정리다.
  - 저장 성공 후 입력값이 다시 수정되면 다시 저장해야 반영된다는 문구를 입력 상태 영역에 표시한다.
  - 버튼별 권장 입력 문구를 `메모·사유 권장`, `사유 권장`, `담당·메모 권장`으로 축약했다.
  - 우선 확인 대상 폼 안내는 사유와 다음 조치만 남겨 입력 상태 안내와 중복되지 않게 했다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 처리 폼 안내 흐름 운영 반영:
  - production 배포 `customs-hscode-1qxzuio1f-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 처리 폼 레이아웃을 안정화했다.
  - 이전 작업은 성공 후 입력 변경 안내, 버튼 문구 축약, 우선 확인 안내 중복 제거를 함께 묶은 처리 폼 UX 정리이고, 이번 작업은 그 안내들이 테이블 행 폭 안에서 안정적으로 보이도록 버튼, 입력 상태 칩, 긴 안내 문구의 레이아웃 밀도를 정리한 화면 안정화다.
  - 처리 버튼은 3열 grid와 최소 높이를 사용해 상태별 문구 길이 차이로 높이가 흔들리지 않게 했다.
  - 입력 상태 칩은 좁은 폭에서는 세로로 쌓이고 넓은 폭에서는 3열로 정렬되도록 했다.
  - 우선 확인 안내, 상태 처리 안내, 저장 후속 안내, 입력 상태 보조 문구에 줄바꿈 처리를 추가했다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 처리 폼 레이아웃 운영 반영:
  - production 배포 `customs-hscode-8tsffdmvg-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 목록 행 스캔성을 개선했다.
  - 이전 작업은 처리 폼 내부의 버튼, 입력 상태 칩, 긴 안내 문구가 안정적으로 보이도록 한 폼 레이아웃 정리이고, 이번 작업은 운영 이슈 목록 행 전체에서 상태, 반복, 발생 시각, 다음 조치, 담당 정보, 키를 빠르게 구분하도록 한 목록 스캔성 정리다.
  - 상태 칸은 상태, 우선 확인, 심각도, 경과 배지를 세로 묶음으로 정리했다.
  - 반복 횟수, 최초/최근 발생 시각, 다음 조치, issue key를 라벨 박스 단위로 분리해 행 안에서 정보 종류가 바로 보이게 했다.
  - 담당자, 메모, 처리 사유, 상태 변경 이력의 긴 텍스트가 담당·메모 셀 안에서 줄바꿈되도록 정리했다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 목록 행 스캔성 운영 반영:
  - production 배포 `customs-hscode-q9ar8m2bs-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 상단 의사결정 흐름을 정리했다.
  - 이전 작업은 목록 행 내부에서 상태, 반복, 발생 시각, 다음 조치, 담당 정보, 키를 빠르게 구분하도록 한 행 스캔성 정리이고, 이번 작업은 목록 상단에서 우선 확인, 담당 분배, 목록 좁히기, 현재 목록 기준 순서로 처리 대상을 고르게 하는 의사결정 흐름 정리다.
  - 운영 판단 흐름 요약을 추가해 우선 확인 대상, 담당 분배 상태, 현재 표시 건수와 필터 적용 여부를 먼저 보이게 했다.
  - 담당자별 미해결 요약, 빠른 필터, 현재 목록 기준 제목을 단계형 문구로 정리했다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 상단 의사결정 흐름 운영 반영:
  - production 배포 `customs-hscode-ct5me5fri-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 빈 상태 행동 유도를 정리했다.
  - 이전 작업은 목록 상단에서 우선 확인, 담당 분배, 목록 좁히기, 현재 목록 기준 순서로 처리 대상을 고르게 하는 의사결정 흐름 정리이고, 이번 작업은 필터 결과 0건, 전체 미해결 0건, 저장된 운영 이슈 0건 상태에서 다음 행동을 다르게 안내하는 빈 상태 정리다.
  - 우선 확인 대상 없음 카드는 현재 조치 우선순위만 안내하고, 빈 목록 영역은 조건 해제, 미해결 전체 보기, 닫힌 이슈 근거 확인, 운영 이슈 동기화 job 확인을 상태별로 안내한다.
  - 전체 미해결 이슈가 없을 때는 미해결 전체 보기 링크를 숨겨 불필요한 이동을 줄였다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 빈 상태 행동 유도 운영 반영:
  - production 배포 `customs-hscode-m3wwk59hl-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.
- 운영 이슈 운영 명령 연결을 정리했다.
  - 이전 작업은 필터 결과 0건, 전체 미해결 0건, 저장된 운영 이슈 0건 상태에서 다음 행동을 다르게 안내하는 빈 상태 정리이고, 이번 작업은 저장된 운영 이슈 0건 상태에서 수동 운영 명령 섹션으로 바로 이동하고 각 운영 명령의 실행 시점을 구분하는 운영 명령 연결성 정리다.
  - 수동 운영 명령 카드에 실행 시점 안내를 추가해 worker 즉시 실행, 실패 알림 리허설, 운영 이력 정리, 운영 이슈 동기화, 운영 이슈 리허설, 스키마 점검, smoke 검증의 용도를 구분했다.
  - 저장된 운영 이슈 0건 안내에서 수동 운영 명령 섹션으로 이동하는 링크를 추가했다.
  - 저장 데이터, RLS, 상태 변경 권한 구조는 바꾸지 않았다.
- 운영 이슈 운영 명령 연결 운영 반영:
  - production 배포 `customs-hscode-pge6w8ylx-koo-apps.vercel.app`이 Ready 상태가 되었고 `https://hsfinder.co.kr` alias 연결과 production smoke 10개 경로 통과를 확인했다.
  - `npm run health:db` 기준 schema drift 없음: 차단 0건, 주의 0건.

검증:

- `npm test -- server/repositories/operations-issue.repository.test.ts`
- `npm test -- server/repositories/operations-issue.repository.test.ts server/operations/operations-issue-status-message.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### 포워더 운송 견적 제출

- 이전 작업은 화주가 공개한 운송 요청을 조건에 맞는 포워더에게 매칭하는 P2.2이고, 이번 작업은 매칭된 포워더가 실제 운송 견적을 제출하는 P2.3이다.
- `submit_freight_bid` RPC를 추가했다.
  - 매칭된 포워더만 견적 제출 가능
  - request row와 match row를 `for update`로 잠그고 상태를 확인
  - freight 요청만 freight bid 제출 가능
  - 마감 시간이 지난 요청은 제출 차단
  - 이미 active bid가 있으면 중복 제출 차단
  - 견적 총액, 통화, 상세 금액, 리드타임/운송일수, 유효기한을 DB RPC에서도 검증
  - 제출 시 `service_bids`, `freight_bid_details`를 함께 생성
  - 요청 상태를 `bids_received`로 갱신
  - match interest를 `interested`로 갱신
  - `freight_bid_submitted` audit log에 주요 견적 snapshot을 남김
- 직접 `service_bids` insert/update와 `freight_bid_details` 직접 write는 bidder에게 열지 않고 RPC-only로 좁혔다.
- `clearance_bid_details` 직접 write 정책도 bid type이 `clearance`일 때만 가능하도록 보강해 freight bid에 clearance detail을 붙이는 경로를 차단했다.
- `/requests/freight`에 입찰 가능 운송 요청 목록과 견적 제출 폼을 추가했다.
- 리뷰어 지적사항을 반영했다.
  - Critical: clearance request에 freight bid 생성 차단
  - Critical: 마감 지난 요청 견적 제출 차단
  - High: direct RPC 호출 시 금액/통화/날짜 검증
  - Medium: declined match 견적 제출 차단
  - Medium: request/match row lock 후 상태 검증
  - Low: audit snapshot 보강
  - Low: clearance bid detail type guard 추가
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/freight`를 브라우저로 열었고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- `ROADMAP`에서 P2.3을 완료로 갱신했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/freight-bid-schemas.test.ts features/service-requests/freight-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`


- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- 운영 이슈 화면 보강 반복 작업마다 위 6개 명령을 동일하게 실행했다.
- `npm test -- server/repositories/operations-issue.repository.test.ts server/observability/lookup-telemetry.test.ts`
- `npm test -- server/observability/lookup-telemetry.test.ts`
- `npm test -- server/repositories/operations-issue.repository.test.ts`
- `npm test -- server/repositories/operations-issue.repository.test.ts server/operations/operations-issue-alert.service.test.ts`
- `npm test -- server/operations/operations-issue-alert.service.test.ts server/operations/background-job-alert.service.test.ts`
- `npm test -- server/observability/lookup-telemetry.test.ts`
- `npm test -- server/observability/lookup-telemetry.test.ts server/repositories/operations-issue.repository.test.ts`
- `npm test -- server/operations/operations-retention.service.test.ts server/repositories/operations-issue.repository.test.ts`
- `npm test -- features/hs-batch/input-parser.test.ts server/actions/hs-batch.actions.test.ts`
- `npm test -- server/actions/hs-batch.actions.test.ts server/repositories/background-job.repository.test.ts server/jobs/hs-batch-lookup-job.handler.test.ts server/jobs/background-worker.service.test.ts`
- `npm test -- server/repositories/background-job.repository.test.ts server/jobs/hs-batch-lookup-job.handler.test.ts server/actions/hs-batch.actions.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260530006000_operations_issue_events.sql'`
- `vercel env run -e production -- sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260530007000_cleanup_operations_issue_events.sql'`
- `vercel env run -e production -- sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260530008000_operations_rehearsal_cleanup_grants.sql'`
- `vercel env run -e production -- npm run health:db`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:background-failure-rehearsal`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/operations/background-job-alert.service.test.ts server/repositories/background-job.repository.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `vercel env run -e production -- npm run ops:job:background-failure-rehearsal`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/operations/operations-retention.service.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/operations/operations-retention.service.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/operations/operations-retention.service.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `vercel env run -e production -- sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260530009000_operations_issue_owner_notes.sql'`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `vercel env run -e production -- npm run ops:job:operations-issues-rehearsal`
- `vercel env run -e production -- npm run ops:job:operations-issues`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run ops:job:operations-retention`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 운영 E2E: 임시 계정 기반 82행 큐 등록 → worker 처리 → 결과 UI/XLSX 버튼 확인
- `npm test -- server/repositories/background-job.repository.test.ts`
- `vercel env run -e production -- npm run ops:job:background`
- `npm test -- server/operations/background-job-alert.service.test.ts server/operations/environment-health.service.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 2026-05-29

### 품명 검색 결과 UX

- `c809c16` Improve product candidate result UX
  - 품명 검색 결과를 `가장 유력`, `추가정보 필요`, `복수 가능성` 상태로 구분해 표시하도록 정리했다.
  - 단일 후보는 우선 검토 후보로 명확히 보여주고, 애매한 입력은 보완 질문을 먼저 볼 수 있게 했다.
  - 후보 근거 문구에서 공식 확정처럼 보일 수 있는 표현을 줄이고 `AI 예비 후보`, `약어/다의어 후보` 등으로 정리했다.
  - 검증: typecheck, lint, 전체 테스트, build 통과.

- `c3e977d` Show progress for AI candidate links
  - AI 보조 분석 영역의 우선 검토 후보 HS CODE 링크에도 전역 진행 표시가 뜨도록 했다.
  - 검증: typecheck, lint, HS 후보 테스트 통과.

### 운영 환경

- Vercel Production에 `CUSTOMS_API_EXCHANGE_RATE_RELAY_URL=http://158.247.223.35:8787/exchange-rate`를 추가했다.
  - API012 관세환율도 관세청 `38010` 포트를 쓰므로, Vercel 직접 호출 대신 Vultr relay를 우선 사용하게 했다.
  - 환경변수 반영을 위해 production 재배포를 실행했고 `https://hsfinder.co.kr` alias 준비 상태를 확인했다.
  - 로컬 셸에 `CRON_SECRET`이 없어 `ops:job:exchange-rates` 수동 실행은 하지 못했다.

- API012 관세환율 캐시를 로컬에서 즉시 갱신할 수 있는 `ops:exchange-rates:refresh-local` 스크립트를 추가했다.
  - `.env.local`의 API012 key와 Supabase service role을 사용하며, 출력에는 API key를 남기지 않는다.
  - `2026-05-29` 기준 수동 실행 결과 현재 환율 적용일 `2026-05-24`, 차주 후보 적용일 `2026-05-31` 환율을 수입/수출 각 58건씩 저장했다.
  - 검증: 스크립트 실행, typecheck, lint, exchange-rate action/cache 테스트 통과.

## 2026-05-26

### 런칭 전 조회 UX 정리

- `82427b9` Add Vercel Analytics tracking
  - Vercel Analytics를 앱 레이아웃에 추가해 방문자 수와 페이지 조회수 집계를 시작할 수 있게 했다.
  - 검증: typecheck, lint, build 통과.

- `3b3d8b7` Show prefix HS lookups as folder tree
  - 4자리/6자리 HS 조회 결과를 씨엘형 폴더 구조로 정리했다.
  - 왼쪽 네비게이터에서 HS4, HS6, HSK 10자리 계층을 확인할 수 있게 했다.
  - 검증: typecheck, lint, build 통과.

- `2c3623e` Sort import tariffs in Ciel-style display order
  - 수입 관세율을 기본관세, WTO, 주요 양허, FTA 순으로 사용자 친화적으로 정렬했다.
  - 모든국가와 특정국가 조회 모두 같은 정렬 규칙을 사용한다.
  - 검증: 관련 테스트, typecheck, lint, build 통과.

- `8f11fb2` Make AI product search ask branch questions first
  - 품명 검색 GPT 응답을 `needs_clarification`, `single_likely_candidate`, `ambiguous_multiple_meanings` 상태로 나누었다.
  - 애매한 품명은 후보를 길게 나열하기보다 HS 특정에 필요한 분기 질문을 먼저 보여주도록 정리했다.
  - 검증: 관련 테스트, typecheck, lint, build 통과.

- `2e361d8` Support single high-certainty AI HS candidates
  - GPT가 높은 확신도와 단일 후보를 반환하면 후보 1개만 노출하도록 했다.
  - 확정이 어려운 경우에는 복수 후보 또는 보완 질문을 유지한다.
  - 검증: 관련 테스트, typecheck, lint, build 통과.

- `f8ffcbf` Harden multilingual product HS normalization
  - 한글, 중국어, 일본어, 혼합언어 품명에서 GPT가 HS4/HS6 후보를 반환하지 못하는 경우를 줄이도록 프롬프트와 파서를 보강했다.
  - GPT 응답의 `hsCandidates`, `hsCodes`, `hs6`, `primaryHsCandidate` 같은 별칭 필드도 읽도록 했다.
  - 검증: 관련 테스트, typecheck, lint, 전체 테스트, build 통과.

## 2026-05-25

### 운영·런칭 준비

- `c0900ef` Add safe lookup telemetry
  - 품명 검색 AI 정규화와 후보 생성 구간에 운영용 telemetry를 추가했다.
  - `LOOKUP_TELEMETRY_ENABLED=true`일 때만 동작한다.
  - 품명 원문, 이메일, 문서 원문, 토큰, API key, prompt는 로그에 남기지 않고 후보 수, duration, provider/model, 입력 형태만 기록한다.
  - 검증: `npm run typecheck`, `npm run lint`, 관련 테스트, 전체 테스트, build 통과.

- `96651d4` Gate business registration live check
  - 기업회원 사업자등록번호는 런칭 전 숫자 10자리 형식만 검증하도록 정리했다.
  - 국세청/공공데이터 사업자 상태조회는 `BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED=true`일 때만 호출한다.
  - 검증: 사업자 상태조회 테스트, auth schema 테스트, typecheck, lint 통과.

- `c5489b7` Paginate developer user listing
  - 개발자 사용자 관리에서 Supabase Auth 사용자 목록을 1,000명까지만 가져오던 제한을 제거했다.
  - Supabase Auth admin listUsers를 페이지 단위로 순회해 더 많은 사용자도 운영 화면에서 볼 수 있게 했다.
  - 검증: typecheck, lint 통과.

- `0f9e3d7` Guard route rate limit policy
  - 로그인, 인증, HS 조회, 문서, 관세계산 경로가 rate limit 보호 대상에서 빠지지 않도록 governance test를 추가했다.
  - 검증: governance test, typecheck 통과.

- `0f85421` Expose lookup health flags
  - 운영 점검 화면에 `LOOKUP_TELEMETRY_ENABLED`, `BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED` 항목을 추가했다.
  - 운영자가 Vercel 환경변수 상태를 앱 내부에서 확인할 수 있게 했다.
  - 검증: typecheck, lint, 전체 테스트, build 통과.

### 품명 검색·HS 후보 UX

- `69cc352` Guard GPT product search contract
  - GPT 품명 검색 프롬프트 계약을 테스트로 고정했다.
  - 다국어, 브랜드명, 모델명, SKU, 오타, HS4/HS6 후보를 다루도록 확인했다.

- `8818f57` Prefer GPT HS code order over local hints
  - 품명 검색에서 GPT가 제시한 HS 후보 순서를 우선하도록 정리했다.
  - 로컬 품명 힌트나 저장 데이터가 GPT 후보를 덮어쓰지 않도록 했다.

- `ddd42b9` Clarify stored HS candidate wording
  - “관세청 HS부호검색 저장본”처럼 사용자가 공식 확정으로 오해할 수 있는 문구를 완화했다.
  - 표시 문구를 “저장 HS 검색 데이터”로 바꿨다.
  - 검증: HS candidate service 테스트, governance test, typecheck, lint 통과.

### 사용자·보안·권한

- `9cf8296` Harden recent user data RLS
  - `hs_favorites`, `account_access_events` 등 최근 사용자 데이터 RLS를 강화했다.
  - 계정 접속 이벤트는 service role만 쓸 수 있게 정리했다.
  - 원격 Supabase migration 적용 완료.

- `9b4b3fa` Audit password update events
  - 비밀번호 변경 이벤트를 감사 로그에 남기도록 추가했다.
  - 원격 Supabase migration 적용 완료.

- `a75b520` Show company IP usage in user management
  - 기업회원 접속 IP 사용 현황을 개발자 사용자 관리 화면에서 볼 수 있게 했다.

### 문서·작업 분리

- `1d01f98` Gate deferred document upload
  - 문서 업로드는 일반 사용자에게 숨기고 개발자에게만 내부 테스트 패널을 노출했다.
  - XLS/OCR/worker 준비 전까지 런칭 동선에서 제외했다.

- `7c967d6` Add operations snapshot refresh
  - 운영 화면에서 dashboard metrics와 목적국 데이터 커버리지 materialized view를 refresh하는 service-role RPC와 UI를 추가했다.
  - 원격 Supabase migration 적용 완료.

- `b50e997` Update launch roadmap
  - 런칭 전 작업 목록을 현재 방향성에 맞게 갱신했다.

### 해외 HS·목적국 데이터

- `7e8f155` Track overseas lookup history
  - 해외 HS 조회도 최근 조회 이력에 남기도록 추가했다.
  - 대시보드 최근 조회에서 수출 목적국 조회는 `/hs/overseas`로 이동하도록 처리했다.

- `f9702c3` Summarize destination coverage status
  - 목적국 데이터 커버리지 요약 카드를 추가했다.
  - 대시보드가 아니라 운영 영역에서 국가별 데이터 보강 상태를 확인하는 방향으로 정리했다.

## Verification Baseline

### 적하목록 조회·상태 알림

- API001 화물통관진행정보 조회 화면을 추가했다.
  - `/cargo`에서 화물관리번호, Master B/L, House B/L 중 하나로 조회한다.
  - 조회 결과는 현재 상태와 진행 이력으로 분리해 표시한다.
- 사용자가 여러 건의 적하목록 감시를 등록할 수 있게 했다.
  - 활성 감시는 화면 상단에 로우 데이터 형태로 노출한다.
  - 각 감시 행에서 `감시 해제하기`로 즉시 중지할 수 있다.
- 5분 단위 감시용 `/api/jobs/cargo-watch` 라우트를 추가했다.
  - Vercel Cron이 5분마다 호출할 수 있도록 `vercel.json`에 등록했다.
  - 목표 상태에 도달하면 Resend 기반 이메일 알림을 발송한다.
  - 메일 환경변수가 없으면 감시 결과에는 오류 메시지를 남긴다.
- 필요한 운영 환경변수:
  - `CUSTOMS_API_CARGO_PROGRESS_SERVICE_KEY`
  - `RESEND_API_KEY`
  - `NOTIFICATION_FROM_EMAIL`
  - `JOB_WORKER_SECRET` 또는 `CRON_SECRET`
- 2026-05-27 추가 정리:
  - Vercel에서 관세청 38010 포트 호출이 불안정해 API001 전용 Vultr relay를 구성했다.
  - relay health endpoint는 `http://158.247.223.35:8787/health`이며 systemd service 이름은 `hsfinder-cargo-relay`다.
  - API005 장치장정보조회 데이터를 `customs_shed_info`에 적재했다.
  - API005 `ldunPlcSnarYn = Y`는 CY, `N`은 CFS로 분류한다.
  - API001 이벤트의 `shedSgn`을 API005 `shed_code`와 매칭해 `CY 반입`, `CFS 반입` 감시 조건을 지원한다.
  - 감시 등록 시 이미 지나간 목표 상태가 있으면 즉시 메일을 보낸다.
  - API001 `mtTrgtCargYnNm` 관리대상검사여부가 `Y`이면 사용자가 선택한 목표 상태와 관계없이 관리대상검사 안내 메일을 동일 B/L/연도/이메일 기준으로 1회 발송한다.
  - 감시는 메일 발송 성공 시에만 종료한다. 메일 실패 시 active 상태로 유지하고 다음 주기에 재시도한다.
  - 상세 운영 절차는 `docs/CARGO_API001_RUNBOOK.md`를 기준으로 한다.

### 무역 뉴스 자동 수집

- `/trade-news`는 `trade_news_items` DB 캐시를 우선 조회한다.
- `/api/jobs/trade-news` cron job을 추가해 6시간마다 관세청 RSS, KOTRA API, 정책브리핑 RSS, 산업통상부, WTO RSS를 수집한다.
- 뉴스는 `content_hash` 기준으로 중복 저장을 방지한다.
- 원문 링크와 출처는 유지하고, 카드에는 짧은 요약과 국가 필터용 국가명을 저장한다.

### 자동차 제원 조회

- `/vehicle-spec` 페이지를 추가했다.
- 사용자가 제원관리번호를 입력하면 한국교통안전공단 사이버검사소 자동차 제원조회 화면을 서버에서 보조 호출한다.
- 자동차(`specType=CAR`) 기준으로 조회하고 제작사, 차명, 형식, 용도, 차종, 중량, 연료, 배기량 등 응답 필드를 요약 표시한다.
- CyberTS는 별도 계약 API가 아니라 화면 기반 조회이므로 보안 정책이나 화면 구조 변경 시 실패할 수 있다.
- 결과 화면에는 CyberTS 원문 링크와 조회시각을 표시한다.
- 2026-05-27 샘플 제원관리번호 `A08-1-00123-0042-1221` 직접 호출 점검 결과, CyberTS가 서버 자동 POST 요청을 `잘못된 접근`으로 처리하는 케이스를 확인했다.
- 앱에서는 이 경우 JSON 파싱 오류가 아니라 `CyberTS 보안 정책 제한` 안내로 노출한다.
- 조회는 rate limit과 캐시를 적용한다.

### 중고차 수출 컨테이너 확인

- `/used-car-export` 상위 메뉴를 추가하고 하위 메뉴로 차량 제원정보 조회와 컨테이너 반입 확인을 분리했다.
- `/used-car-export/container-check`는 컨테이너 번호를 입력하면 운송현황을 먼저 조회한다.
- 운송현황 최신 이력의 터미널명과 터미널코드로 최종 반입지를 판단한다.
  - 한진인천컨테이너터미널: 원문 자동 POST 조회 지원
  - 선광신컨테이너터미널: 원문 자동 POST 조회 지원
  - 인천컨테이너터미널: 원문 자동 POST 조회 지원
  - 인천항국제페리부두: Nexacro `nxCtr.do` 직접 조회 기반 요약 표시와 원문 사이트 연결 지원
  - BNCT: JSON 조회 엔드포인트 기반 요약 표시와 원문 사이트 연결 지원
  - 평택컨테이너터미널: JSON 조회 엔드포인트 기반 요약 표시와 `cntrNo` 원문 URL 연결 지원
  - 평택동방아이포트: 메인 WebBrowser 내부 `Container 양하예정시간 조회` 엔드포인트 기반 요약 표시와 원문 URL 연결 지원
- 운송현황 최신 상태가 `반출`이면 “아직 최종 반입지에 반입이 되지 않았습니다” 안내를 표시한다.
- 운송현황 조회 결과가 없으면 컨테이너 번호 오류 또는 이미 선적된 컨테이너 가능성을 안내한다.
- 2026-05-28 샘플 `TBJU7406466` 확인 결과 운송현황 최신 이력은 `인천신국제여객터미널 / IFPCC / 반입완료`로 식별된다.
- IFPC는 `guest` 세션 로그인 후 `isu_010Qry.selectContainerDup`로 수출/수입 중복 구분값을 받고, `isu_010Qry.selectContainer` 상세 조회를 직접 호출한다. 상세 결과가 없을 때만 운송현황 최신 이력 요약으로 대체한다.
- 컨테이너 조회 결과는 화면 내 로우 데이터 요약을 기본으로 유지하고, 사용자가 `원문 화면 보기`를 누를 때만 원문 팝업을 연다.
- `반입계 출력`은 Playwright 기반 API에서 실제 터미널 조회 화면을 렌더링해 PNG로 다운로드한다. IFPC는 원사이트를 직접 열어 컨테이너 번호 입력 후 조회 버튼을 눌러 캡처하는 방식으로 검증했다.
- 2026-05-28 샘플 `UETU6784452` 확인 결과 운송현황 최신 이력은 `인천컨테이너터미널 / ICTPC / 반입완료`로 식별된다.
- 인천컨테이너터미널은 `https://service.psa-ict.co.kr/webpage/general/contInfo.jsp` 구형 JSP 조회를 사용한다.
- BNCT는 `https://info.bnctkorea.com/esvc/cntr/cntrSrch/search?CNTR_NO=` JSON 조회를 사용한다. 샘플 컨테이너가 없어 실제 운영 컨테이너 검증은 추후 필요하다.
- 평택컨테이너터미널은 `http://www.pctc21.com/esvc/cntr/info2/data?cntrNo=` JSON 조회를 사용한다. 원문 화면은 `cntrNo` URL 파라미터 자동 검색을 지원한다.
- 평택동방아이포트(PNCT) `http://www.pnct.co.kr/infoservice/index.html`는 Nexacro 단일 앱 구조다. Playwright 조사로 팝업 공지 닫기 후 메인 화면의 `Container 양하예정시간 조회` 입력창이 `http://www.pnct.co.kr/infoservice/jsp/main/mainPage_SteveTime.jsp?cntrNo=`를 호출하는 것을 확인했다.
- PNCT는 현재 해당 양하예정시간 조회 엔드포인트를 직접 호출한다. 전체 `컨테이너 조회` 메뉴(`C006M129`)의 상세 항목은 추가 XFDL/트랜잭션 추적이 필요하다.

### 품명 AI 검색 보강

- GPT 정규화 cache version을 `product-search-normalization-v14`로 올렸다.
- GPT가 성공 응답을 반환했지만 HS 후보가 비어 있는 경우, 한 번 더 단순한 “이 품명 HS CODE가 뭘까” 인터뷰어 방식으로 재질문한다.
- 분기 질문이 필요한 품명이라도 넓은 HS4/HS6 방향이 유용하면 예비 후보를 표시하고, 필요한 보완 정보는 질문으로 남긴다.
- 명확한 단일 후보가 있는 경우에는 약한 대안 후보를 더 강하게 줄여 사용자 혼란을 낮춘다.

### 운영 공지사항

- 대시보드 공지사항은 `app_notices` 테이블에서 published 항목만 표시한다.
- 작성, 수정, 삭제는 `emptypocket711@gmail.com` 개발자 계정과 `developer` 프로필 역할이 모두 맞을 때만 허용한다.
- 공지 변경은 `app_notice_create`, `app_notice_update`, `app_notice_delete` 감사 로그로 기록한다.
- `popup_enabled` 공지는 대시보드 접속 시 자동으로 열 수 있고, 사용자가 선택하면 브라우저 기준 1일 동안 숨긴다.

### 국내 수입 10자리 조회 스냅샷

- 운영 Supabase에 관세청 품목번호별 관세율표 20260211 데이터를 중복 제거 후 380,229개 published row로 적재했다.
- 10자리 HSK 기준 `domestic_hs_lookup_snapshots` materialized view를 추가했다.
- 스냅샷은 품명, 관세율, 세관장확인 수입요건, 통합공고, 내국세 후보를 HSK10 단위로 미리 묶는다.
- 2026-05-25 기준 커버리지: HSK10 11,327개 중 11,326개 관세율 보유. 누락 1개는 `2424.00-0000 이사화물`.
- 6자리 HS에는 관세율을 추론 표시하지 않고, 10자리 exact 관세율만 사용자 화면에 사용한다.

최근 전체 검증 기준:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### HS 통합조회 다국어 2차

- 해외 HS 조회 결과 테이블과 수입국 HS 상세 화면의 헤더, 빈 상태, 매칭 라벨을 `hs-direct` dictionary로 추가 분리했다.
- 목적국 품명, 세율, 내국세, 수입요건 등 공식 데이터 값은 그대로 유지하고, 화면 chrome만 한국어/영어/중국어로 전환한다.
- 수입국 요건/내국세가 표시되지 않는 경우에도 “없음”으로 단정하지 않고 “표시할 데이터가 없음” 수준의 표현을 유지했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/documents.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/report-preview.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/diagnosis.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm test`
- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run build`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm test`
- `npm run build`

### HS 통합조회 다국어 3차

- 수입 10자리 상세 화면의 품목 기본정보, 내국세, 표준품명, 수입요건, 신고품명 통계 섹션 chrome을 `hs-direct` dictionary로 추가 분리했다.
- 세율, 공식 품명, 요건명, 법령명, 기관명, 신고품명 통계값은 원문 데이터로 유지한다.
- 수입요건 빈 상태는 “요건 없음”으로 단정하지 않고 통합공고·개별법령·표시·인증·유통규제 가능성을 계속 안내한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm test`
- `npm run build`

### HS 통합조회 다국어 4차

- 한국 수출 기준 조회 결과의 기본정보, 목적국 연결 폼, 수출요건, 전략물자/수출통제, FTA C/O 섹션 chrome을 dictionary로 분리했다.
- 수출통제 결과는 계속 예비 스크리닝으로만 표시하며 “필요 가능성 있음” 수준의 표현을 유지한다.
- 수출요건명, 법령명, 기관명, 전략물자 키워드, 원산지증빙 값은 데이터 원문으로 유지한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm test`
- `npm run build`

### 예상 납세액 산출 다국어 1차

- 예상 납세액 산출 페이지와 계산 패널의 주요 UI chrome을 `duty-estimator` dictionary로 분리했다.
- HS 조회에서 전달된 세율, 내국세명, FTA 후보 라벨, 서버 액션 응답 메시지는 원문 데이터 또는 기존 응답값으로 유지했다.
- 결과 복사 문구의 기본 라벨도 locale별로 분리하되, 납세액은 계속 “예상/estimate” 표현을 사용한다.
- dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/duty-estimator.test.ts`
- `npm test`
- `npm run build`

### 진입 화면 다국어 1차

- `/entry` 조회 시작 화면의 제목, 설명, 주요 업무 카드 4개를 `entry` dictionary로 분리했다.
- 화면마다 같은 workflow 순서가 유지되도록 dictionary 테스트를 추가했다.
- 각 카드의 링크와 아이콘은 기존 구조를 유지하고, 표시 chrome만 locale별로 전환한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/entry.test.ts`
- `npm test`
- `npm run build`

### 무역 뉴스 다국어 1차

- `/trade-news` 페이지 제목, 설명, hero, 국가 필터, 카테고리 카드, 빈 상태, 원문 열기 버튼 chrome을 `trade-news` dictionary로 분리했다.
- 뉴스 제목, 원문 URL, 출처명, 국가명 등 수집 데이터는 자동 번역하지 않는다.
- WTO와 일반 뉴스의 기본 요약 fallback만 locale별 문구로 표시한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/trade-news.test.ts`
- `npm test`
- `npm run build`

2026-05-25 기준 전체 테스트 결과:

- 52 test files passed
- 246 tests passed

## 2026-05-29 작업 기록

### 병렬 에이전트 점검 및 성능·안정화

- 백엔드, AI 검색, UI, QA 관점으로 나누어 병렬 리뷰를 진행했다.
- 반입계 다운로드는 실제 터미널 조회 화면을 계속 사용하되, 캡처 전 1초 간격으로 화면 준비 여부를 확인하도록 바꿨다.
- 반입계 PNG는 세로 전체 페이지 캡처 대신 1680x1050 가로형 뷰포트 캡처로 변경했다.
- 반입계 출력 버튼은 생성 경과 초를 표시해 사용자가 진행 여부를 볼 수 있게 했다.
- IFPC 반입계 캡처는 Nexacro 조회 버튼을 직접 선택해 클릭하고, 컨테이너 번호와 상세 필드가 채워진 뒤에만 캡처하도록 보강했다.
- 반입계 캡처가 helper 화면, 로딩 화면, 컨테이너 번호 미확인 상태에서 타임아웃되면 PNG를 만들지 않고 오류로 멈추도록 안전장치를 추가했다.
- Playwright/외부 사이트 내부 오류 원문은 사용자에게 직접 노출하지 않고, 사용자 문구는 고정 안내로 정리했다.

### 품명 AI 검색 보강

- GPT가 단일 후보를 높은 확신으로 제시한 경우 최종 후보를 1개로 집중한다.
- 분기 정보가 부족한 경우에는 넓은 HS 후보와 최소 보완 질문을 유지한다.
- Supabase 공식 데이터 검색 경로를 `hs_master`, `customs_hs_code_search_items`, `standard_product_names`까지 확장했다.
- 한글·중국어·일본어 2글자 품명 단서도 검색어로 인정해 짧은 원어 품명 검색 실패 가능성을 낮췄다.
- GPT 후보가 있는데 공식 HSK exact row가 없어서 화면이 비는 케이스를 방지하는 테스트를 추가했다.

### 관부가세 계산기·환율

- HS 10자리 조회 화면에서 선택한 수입국가와 FTA/협정 후보 라벨을 관부가세 계산기로 넘긴다.
- 계산기에서 HS 조회 화면으로 돌아갈 때도 수입국가와 기준일을 유지한다.
- 차주 환율이 아직 DB에 없으면 “아직 차주 환율을 가져올 수 없습니다.”로 안내하고, 캐시 배치는 기준일 환율과 차주 후보 적용일 환율을 함께 수집한다.
- 저장 환율을 적용할 때 조회기준일 이전 최신 고시일이면 해당 날짜를 함께 표시한다.

### 적하목록 감시 메일 중복 방지

- `cargo_watch_status_notifications` 테이블을 추가해 동일 조회값, 목표상태, 이메일 기준 상태 알림 메일 발송 이력을 기록한다.
- 감시 등록 즉시 이미 목표 상태를 지난 건도 동일 조건 발송 이력이 있으면 새 메일을 생략한다.
- cron 감시 작업에서도 `sending/sent` claim 구조를 사용해 동시 실행이나 재시작 상황의 중복 메일 발송을 줄인다.
- 메일 발송 실패 시 claim을 해제해 다음 주기에 재시도할 수 있게 했다.

### 운영·UI

- 운영 점검 화면의 조회 품질 로그에 정상/점검/무결과 요약을 추가했다.
- 개발자 유저 관리 화면은 운영 권한 수, 필터 적용 여부, 권한 badge, 최근 로그/IP 요약을 더 잘 보이게 정리했다.
- 대시보드 공지사항은 본문 미리보기와 최근 공지 건수를 표시한다.
- HS 조회 진행 메시지는 수출 목적국 조회와 일반 HS 조회를 구분해 표시한다.

### 검증

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

2026-05-29 기준 전체 테스트 결과:

- 53 test files passed
- 286 tests passed

### 다국어 1차 기반

- 공통 locale을 `ko-KR`, `en-US`, `zh-CN`으로 정의했다.
- 헤더와 사이드 내비게이션은 공통 chrome dictionary를 통해 한국어, 영어, 중국어 간 전환할 수 있다.
- 선택 언어는 `hsfinder_locale` 쿠키에 저장하고, `profiles.preferred_locale` 컬럼이 적용된 환경에서는 프로필에도 best effort로 저장한다.
- 루트 레이아웃의 `<html lang>` 값을 선택 언어에 맞춰 변경한다.
- AI/법적 안전문구는 별도 dictionary helper로 분리해 “예비진단”, “확정 아님”, “검토 필요” 흐름을 유지한다.
- 프로필 언어 컬럼용 Supabase migration `20260529002000_profile_preferred_locale.sql`을 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/locales.test.ts lib/i18n/hs-finder-locale.test.ts`

### 대시보드 다국어 확장

- 대시보드 hero, 통합 검색 폼, 공지사항 chrome, 바로가기, 즐겨찾기, 최근 검색, 적하목록 감시 카드의 UI 문구를 dashboard dictionary로 분리했다.
- 공지사항 제목과 본문은 운영자가 작성한 원문 콘텐츠이므로 자동 번역하지 않고, 카테고리·버튼·빈 상태 등 chrome만 locale별로 표시한다.
- 진행 게이지는 `<html lang>` 기준으로 한국어, 영어, 중국어 메시지를 표시하도록 확장했다.
- 인증 app layout과 dashboard page는 `profiles.preferred_locale`이 있으면 이를 우선 사용하고, 없으면 쿠키/브라우저 언어로 fallback한다.
- “예상 납세액 계산”처럼 확정 산출로 읽힐 수 있는 dashboard 문구는 “예상 납세액 산출”, “입력값 기준 예비 산출”로 완화했다.
- 대시보드 dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/dashboard.test.ts lib/i18n/locales.test.ts lib/i18n/hs-finder-locale.test.ts`

### HS 통합조회 다국어 1차

- HS 통합조회와 해외 HS 조회의 페이지 제목, 설명, 검색 폼, 기준일 옵션, 품명 후보 카드, 주요 상세 섹션 chrome을 `hs-direct` dictionary로 분리했다.
- HS 코드, 공식 품명, 법령명, 기관명, source data는 원문 신뢰도를 위해 자동 번역하지 않는다.
- 해외 HS 조회 화면도 같은 dictionary를 사용하되, 페이지 제목과 설명은 목적국 조회 흐름에 맞는 별도 문구를 사용한다.
- 영어/중국어 화면에서도 조회 로직, 최근 검색 저장, 즐겨찾기, 관세율/요건 조회 로직은 변경하지 않았다.
- HS direct dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### 적하목록 조회 다국어 1차

- `/cargo` 페이지 제목, 조회 폼, 현재 상태 요약, 진행 이력, 감시 등록, 내 알림 감시 UI chrome을 `cargo` dictionary로 분리했다.
- 감시 목표 상태 라벨은 한국어, 영어, 중국어 화면에서 각각 표시되도록 매핑했다.
- 관세청 응답 메시지, 진행 상태 원문, 화물 이벤트 데이터는 원문 신뢰도를 위해 자동 번역하지 않는다.
- Cargo dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/cargo.test.ts`
- `npm run build`

### 중고차 수출 화면 다국어 1차

- `/used-car-export` 개요, 제원정보 조회, 컨테이너 반입 확인 페이지의 제목, 탭, 조회 폼, 결과 영역, 안내 문구 UI chrome을 `used-car-export` dictionary로 분리했다.
- 제원조회와 컨테이너 조회의 외부 사이트 응답값, 터미널명, 원문 데이터는 자동 번역하지 않고 그대로 표시한다.
- 반입계 이미지 파일명 접미사와 출력 진행 문구도 locale별로 분리했다.
- Used-car export dictionary 누락 방지 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run build`

### Locale 해석 helper 정리

- `resolveCurrentUserLocale` helper를 추가해 쿠키/브라우저 언어와 `profiles.preferred_locale` fallback 흐름을 공통화했다.
- 관부가세 계산기, 통합 진입점, 무역뉴스, 적하목록 조회, 중고차 수출 페이지의 반복된 locale 해석 코드를 제거했다.
- 이미 user id를 확보한 화면은 같은 helper에 user id를 넘겨 Supabase Auth 조회를 중복하지 않도록 했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### 수입·수출 진단 화면 다국어 1차

- `/diagnosis/import`와 `/diagnosis/export`의 페이지 제목, 조회 폼, 빈 상태, 결과 헤더, 섹션명, 테이블 헤더 UI chrome을 `diagnosis` dictionary로 분리했다.
- HS 코드, 품명, 법령, 기관, 출처, 요건 설명, mock/source 데이터는 원문 신뢰도를 위해 자동 번역하지 않는다.
- 수출통제의 “필요 가능성 있음” 문구도 locale별 dictionary로 분리해 법적 확정 표현을 피한다.
- Diagnosis dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/diagnosis.test.ts`
- `npm run build`

### 리포트 미리보기 다국어 1차

- `/reports/preview` 페이지 제목, 담당자 검토 상태, 생성 메타 라벨, Source Locks, 담당자 메모, PDF 출력, 고지사항 UI chrome을 `report-preview` dictionary로 분리했다.
- 보고서 제목, 본문 섹션, source lock 데이터, disclaimer는 생성/원천 데이터이므로 자동 번역하지 않는다.
- 자동 예비진단과 담당자 검토 전 상태 라벨을 locale별로 분리하되 법적 확정 표현은 피했다.
- Report preview dictionary 누락과 영어권 단정 표현을 방지하는 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/report-preview.test.ts`
- `npm run build`

### 선적서류 업로드 페이지 다국어 1차

- `/documents/upload` 페이지 헤더와 일반 사용자에게 보이는 “준비 중” 안내 카드 UI chrome을 `documents` dictionary로 분리했다.
- 개발자 전용 mock extraction preview와 업로드 form 상세 문구는 아직 원문 유지하며, 기능 확장은 하지 않았다.
- Documents dictionary 누락 방지 테스트를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/documents.test.ts`
- `npm run build`

### 언어 전환 즉시 반영 수정

- 로그인 후 화면에서 `profiles.preferred_locale`가 locale cookie보다 우선되어 언어 버튼 클릭 직후 기존 언어로 되돌아가던 문제를 수정했다.
- locale cookie를 런타임 기준값으로 두고, Supabase 프로필 저장값은 cookie가 없을 때만 fallback으로 사용하도록 서버 locale 해석 순서를 정리했다.
- 언어 변경 server action이 layout cache를 무효화한 뒤 현재 경로로 돌아가도록 해 헤더와 사이드바가 즉시 다시 렌더되게 했다.
- cookie, profile, Accept-Language 우선순위를 검증하는 `lib/i18n/server.test.ts`를 추가했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm test -- lib/i18n/server.test.ts lib/i18n/locales.test.ts`
- `npm run build`

### HS 조회 복사 안내 옵션 추가

- HS 10자리 상세, 품명 AI 후보, 후보 없음 안내, 해외 HS 상세의 클립보드 복사 버튼에 안내 언어 선택(한국어/영어/중국어)과 분량 선택(짧게/상세)을 추가했다.
- 짧은 버전은 품명/HS CODE와 어떤 요건이 있는지까지만 복사하고, 상세 버전은 기존처럼 관세율, FTA, 내국세, 수입요건 보완자료, 원산지 표시 안내까지 포함한다.
- 여러 복사 버튼이 한 화면에 있어도 `select` label/id가 충돌하지 않도록 `useId` 기반으로 정리했다.
- 원천 데이터인 품명, 법령명, 요건명은 번역하지 않고 안내 문장만 선택 언어를 따르게 했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm run build`

### 적하목록 즉시 종료 감시 상태 정리

- 목표 상태가 이미 지나간 건을 감시 등록할 때 상태 알림 메일 발송 또는 중복 발송 생략으로 즉시 종료되는 경우 `cargo_watch_requests.next_check_at`도 `null`로 저장되도록 정리했다.
- 기존 cron은 `status = active`만 조회하므로 중복 발송 위험은 없었지만, 종료된 감시 row가 다음 조회 예정 시간을 가진 것처럼 보이지 않게 DB 상태를 명확히 했다.
- 상태 매칭은 현재 상태뿐 아니라 전체 이벤트 이력 기준으로 유지해, 사용자가 이미 지난 상태값을 선택해도 즉시 감지되는 흐름을 보존했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/services/cargo-status-classifier.test.ts`

### 외부 조회 화면 rate limit 보강

- 관세청 API001 적하목록 조회로 이어지는 `/cargo`와 터미널 외부 조회·반입계 출력으로 이어지는 `/used-car-export`를 proxy rate limit 대상에 추가했다.
- 인증 API route 자체의 제한은 유지하되, 화면 진입 단에서도 반복 요청을 줄여 외부 사이트/API 호출 비용과 서버 부하를 낮춘다.
- governance 테스트에 두 경로가 rate limit 대상에서 빠지지 않도록 고정했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/lookup-governance.test.ts`

### 운영 점검 relay 환경변수 표시 보강

- 개발자 운영 점검 화면의 관세청 OpenAPI 섹션에 API001 적하목록 relay URL/token, API012 관세환율 relay URL/token, API005 장치장 key를 추가했다.
- 운영 보호 섹션에 반입계 출력 API rate limit 설정값을 추가해 외부 터미널 캡처 기능의 제한값을 한 화면에서 확인할 수 있게 했다.
- token/key/secret/password 계열 값은 기존처럼 원문을 표시하지 않고 `설정됨`만 표시한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/operations/environment-health.service.test.ts`

### 운영 route 스모크 테스트 추가

- 배포 후 핵심 페이지가 살아있는지 확인하는 `scripts/smoke_production_routes.mjs`와 `npm run smoke:production` 명령을 추가했다.
- 로그인 쿠키가 없으면 보호 페이지가 로그인으로 막히는지 확인하고, `SMOKE_COOKIE`와 `SMOKE_REQUIRE_AUTHENTICATED=true`를 넣으면 실제 보호 페이지 marker까지 검사한다.
- 대상은 로그인, 대시보드, HS 직접 조회, 품명 AI 조회, 해외 HS 조회, 예상 납세액, 적하목록, 중고차 수출, 컨테이너 조회, 무역뉴스다.
- 보호 페이지는 proxy 단계에서 Supabase auth cookie가 없으면 즉시 `/login`으로 보내도록 해, 비로그인 상태에서 무거운 서버 렌더링이나 외부 조회가 먼저 시작되지 않게 했다.

검증:

- `npm run smoke:production -- https://hsfinder.co.kr`
- `npm run typecheck`
- `npm run lint`

### 운영 환경변수 점검 CLI 추가

- `.env.local` 또는 shell 환경변수를 읽어 필수/선택 운영값 설정 여부를 확인하는 `scripts/check-runtime-env.mjs`와 `npm run health:env` 명령을 추가했다.
- `npm run health`는 환경변수 점검 후 DB 스키마 점검을 이어서 실행하도록 정리했다.
- 개발자 운영 점검 화면에 KOTRA 무역뉴스, 공공데이터 timeout, 터미널 helper rate limit, 차량 제원조회 rate limit 항목을 추가했다.
- 키, 토큰, 비밀번호, DB 접속 문자열 원문은 출력하지 않고 `설정됨`으로만 표시한다.

검증:

- `npm run health:env`
- `npm test -- server/operations/environment-health.service.test.ts`
- `npm run typecheck`
- `npm run lint`

### 로그인 사용자 운영 스모크 보강

- `SMOKE_LOGIN_EMAIL`과 `SMOKE_LOGIN_PASSWORD`를 넣으면 Playwright로 실제 로그인 화면을 통과해 Supabase 세션 쿠키를 얻고 보호 페이지 marker를 검사하도록 `smoke:production`을 확장했다.
- 기존 `SMOKE_COOKIE` 방식은 유지한다.
- 인증 정보와 쿠키 원문은 출력하지 않는다.

검증:

- `npm run smoke:production -- https://hsfinder.co.kr`
- `npm run typecheck`
- `npm run lint`

### 외부 연동 오류 응답 표준화 1차

- 외부 사이트/API 연동 실패를 `input`, `temporary`, `external_unavailable`, `configuration` 등으로 분류하는 공통 JSON 오류 응답 유틸을 추가했다.
- 반입계 출력 API가 실패할 때 HTML/일반 텍스트 원문 대신 `code`, `level`, `message`, `retryable`, `requestId`를 포함한 안전한 JSON 오류를 반환하도록 바꿨다.
- 중고차 수출 화면의 반입계 다운로드 버튼은 JSON 오류를 해석해 사용자용 문구와 요청 ID만 표시하도록 정리했다.
- 터미널 원문 이동 helper API의 인증/입력 오류도 같은 JSON 오류 계약으로 맞췄다.
- 적하목록 API001과 관세환율 API012의 공공데이터 네트워크 실패도 같은 오류 모델로 분류하고, 화면에는 재시도 가능 여부와 진단값을 함께 표시하도록 확장했다.
- governance 테스트에 반입계 출력 API가 공통 오류 응답을 유지하도록 고정했다.

검증:

- `npm test -- server/services/external-integration-error.test.ts server/repositories/lookup-governance.test.ts`
- `npm test -- server/actions/exchange-rate.actions.test.ts`

### 품명 AI 검색 실패 진단 보강

- 품명 AI 정규화 단계의 상태를 `skipped`, `success`, `failed`로 telemetry에 남기도록 정리했다.
- GPT가 제시한 후보가 HS4/HS6/HSK10 중 어느 수준인지 개수만 저장해, 원문 품명 없이도 후보 미노출 원인을 추적할 수 있게 했다.
- 운영 진단 분류에 `GPT 호출 실패`를 추가해 API key, 모델명, quota, timeout 문제와 후보 후처리 문제를 구분하도록 했다.
- 실패 진단은 원문 품명, 검색어, 이메일을 저장하지 않고 상태값과 숫자만 사용한다.

검증:

- `npm test -- server/observability/lookup-telemetry.test.ts server/rules/hs-candidate.service.test.ts`

### 운영 조회 품질 로그 표시 보강

- 개발자 운영 점검 화면의 최근 조회 품질 로그에 GPT 단계와 후보 품질 컬럼을 추가했다.
- GPT 호출 성공/실패/미사용 상태, GPT 후보의 HS4/HS6/10자리 개수, 최종 HS6/10자리 개수를 원문 품명 없이 확인할 수 있게 했다.
- 1순위 후보가 GPT 판단인지, 공식 후보인지, 어느 HS 레벨인지 표시해 품명 검색 실패 원인을 더 빠르게 분리할 수 있게 했다.

검증:

- `npm run typecheck`
- `npm run lint`

### 품명 검색 무결과 화면 보강

- GPT가 HS4/HS6 예비 방향을 제시했지만 공식 후보 확장 결과가 비어 있는 경우, 예비 HS 방향을 결과 없음 화면에 표시하도록 했다.
- 예비 코드는 확정 세번이 아니라 이어서 조회할 수 있는 방향으로 안내하고, 클릭 시 해당 HS 조회 화면으로 이동하게 했다.
- 클립보드 안내문에도 예비 검토 가능한 HS 방향을 포함해 업체 보완 요청 시 활용할 수 있게 했다.
- 품명 후보 카드에서 10자리 후보와 HS4/HS6/HS8 예비 후보를 배지로 구분하고, 예비 후보 버튼 문구를 `하위 10자리 후보 보기`로 바꿨다.
- 중고차 컨테이너 조회 실패 시 시도한 터미널별 결과를 화면에 표시해, 이트랜스 결과 없음과 터미널별 결과 없음/연결 실패를 구분하기 쉽게 했다.
- 개발자 운영 점검 화면에 최근 조회 품질 로그의 일자별 요약을 추가해 무결과, GPT 실패, HS6 예비 후보 발생 흐름을 빠르게 볼 수 있게 했다.
- HS 상세 결과에서 예상 납세액 계산기로 이동하는 링크에 전역 진행 표시 라벨을 추가했다.
- 한글 상품명과 제품코드형 입력에서 GPT가 HS6 예비 후보를 반환하면 공식 10자리 매칭이 없어도 후보가 사라지지 않는 회귀 테스트를 추가했다.

검증:

- `npm test -- server/ai/clarification.service.test.ts`
- `npm test -- server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`

### 대시보드 이동 진행 표시 보강

- 대시보드의 해외 HS 검색 탭, 업무 바로가기 카드, 최근 조회, 즐겨찾기, 적하목록 감시 목록 이동에 전역 진행 표시 라벨을 추가했다.
- 예상납세액 계산기에서 HS CODE 조회 화면으로 이동하는 버튼에도 진행 표시 라벨을 추가했다.
- 사용자가 카드나 목록을 클릭했을 때 결과 화면이 열리기 전까지 작업 중 상태를 더 명확히 볼 수 있게 했다.

검증:

- `npm run typecheck`
- `npm run lint`

### 운영 조회 로그 경로별 요약 추가

- 품명 AI 정규화와 후보 생성 telemetry에 `hs_product_ai` route를 남기도록 했다.
- 개발자 운영 점검 화면에 경로별 전체 건수, 점검 대상 건수, 실패율, 평균/최대 응답시간 요약을 추가했다.
- 기존 로그에 route가 없는 경우에도 이벤트 유형 기준으로 묶어 과거 기록을 볼 수 있게 했다.

검증:

- `npm test -- server/observability/lookup-telemetry.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`

### 반입계 출력 실패 원인 분류 보강

- 반입계 출력 중 터미널 화면이 캡처 가능한 상태가 아닐 때 원인을 세분화했다.
- helper 화면 정체, 외부 사이트 로딩 미종료, 컨테이너 번호 미확인, 상세 필드 미채움 상태를 각각 다른 오류 코드와 사용자 문구로 반환한다.
- 서버 로그에도 터미널 코드와 원인 코드를 함께 남겨 운영에서 반복 실패 유형을 구분할 수 있게 했다.
- governance 테스트에 반입계 출력 실패 원인 코드가 유지되도록 고정했다.

검증:

- `npm test -- server/repositories/lookup-governance.test.ts`
- `npm run typecheck`
- `npm run lint`

### 운영 점검 문서 갱신

- `docs/operations/production-health-check.md`에 개발자 운영 점검 화면에서 확인할 항목을 추가했다.
- 조회 품질 telemetry, route별 실패율/응답시간, 반입계 출력 실패 코드, production smoke 절차를 문서화했다.
- 다음 확장 후보를 Vercel/cron/job 실패 이력, rate limit 초과 이벤트, 반입계 실패 집계 중심으로 정리했다.

검증:

- 문서 변경만 수행

### 운영 점검 백그라운드 작업 상태 추가

- `background_jobs` 최근 작업을 운영 점검 화면에 표시하도록 했다.
- 대기, 실행 중, 재시도 대기, 최종 실패 건수를 요약하고 최근 작업의 유형, 상태, 시도 횟수, 다음 실행 시간, 오류 문구를 볼 수 있게 했다.
- 새 테이블을 추가하지 않고 기존 `background_jobs` RLS 정책을 사용한다.

검증:

- `npm test -- server/repositories/background-job.repository.test.ts`
- `npm run typecheck`
- `npm run lint`

### 무역 뉴스 국가 필터 보강

- 무역 뉴스 국가 필터 로직을 `features/trade-news/trade-news-country-filter.ts`로 분리했다.
- KOTRA, WTO, 정부 원문에서 국가명이 영문명, 약칭, EU 표현으로 들어오는 경우도 선택 국가에 매칭되도록 보강했다.
- 미국 `US` 같은 짧은 약칭이 `customs` 같은 일반 단어 내부에서 오탐되지 않도록 단어 경계 기준으로 매칭한다.
- EU 회원국을 선택했을 때 유럽연합 관련 기사도 함께 볼 수 있도록 alias 매칭을 유지했다.

검증:

- `npm test -- features/trade-news/trade-news-country-filter.test.ts`
- `npm run typecheck`
- `npm run lint`

### 운영 외부 연동 준비 상태 요약 추가

- 개발자 운영 점검 화면에 개별 환경변수 표와 별도로 `외부 연동 준비 상태` 카드를 추가했다.
- 품명 AI 검색, API001 화물통관진행, API012 관세환율, KOTRA 무역뉴스, 알림 메일, 정기 작업을 기능 단위로 표시한다.
- API001/API012는 relay 경유인지 UNIPASS 직접 호출인지 구분하고, 누락값과 운영상 확인이 필요한 값을 따로 보여준다.
- KOTRA 키가 없는 경우에도 RSS/저장 캐시 기반 표시는 가능하다는 점을 warning 상태로 분리했다.

검증:

- `npm test -- server/operations/environment-health.service.test.ts`
- `npm run typecheck`
- `npm run lint`

### 반입계 출력 실패 안내 보강

- 반입계 출력 API가 반환하는 실패 코드별로 사용자 화면에 재시도/원사이트 확인 안내를 함께 표시하도록 했다.
- 외부 사이트 로딩 미종료, helper 화면 정체, 컨테이너 번호 미확인, 상세 필드 미채움, 일반 캡처 실패를 구분한다.
- 오류 문구가 여러 줄로 표시되도록 중고차 수출 컨테이너 반입 확인 화면의 오류 박스 표시를 보강했다.

검증:

- `npm test -- lib/i18n/used-car-export.test.ts`
- `npm run typecheck`
- `npm run lint`

### 무역 뉴스 영문 원문 카드 요약 보강

- 무역 뉴스 카드에서 원문 요약이 영문 등 비한글일 때도 일반 fallback 문구만 나오지 않도록 했다.
- 원문 제목·출처·국가 기준의 짧은 안내와 원문 발췌를 함께 표시해, 원문을 열기 전 확인 가능한 정보량을 늘렸다.
- WTO 뉴스는 국제통상 안내 문구에 원문 발췌를 붙여 규범·분쟁·회원국 조치 관련 여부를 더 빨리 볼 수 있게 했다.

검증:

- `npm test -- lib/i18n/trade-news.test.ts`
- `npm run typecheck`
- `npm run lint`

### 고객군 기준 작업 페이즈 정리

- 관세사무원, 포워더, 해외 수출자, 국내 수입자를 핵심 고객군으로 두고 이후 기능을 Phase F/G/H로 재정리했다.
- Phase F는 관세사무원·포워더의 반복 실무를 줄이는 일괄 조회, 복사 안내문, 적하목록 일괄 감시, 고객사별 품목 관리 중심으로 정의했다.
- Phase G는 해외 수출자와 국내 수입자가 직접 사용할 영어/중국어 화면, 한국 수입 조회, 예상 관부가세, 수입요건 플레이북, FTA/원산지 검토 보조로 정의했다.
- Phase H는 유료화, 사용량 제한, 운영 로그 기반 품질 개선, 데이터 정기 갱신 운영으로 정의했다.

검증:

- 문서 변경만 수행

### 복사 안내문 언어·분량 선택 UI 보강

- HS 조회와 품명 후보 복사 버튼 옆의 선택 박스에 `안내 언어`, `안내 분량` 라벨을 노출했다.
- 한국어/영어/중국어 안내문과 짧게/상세 안내문 선택이 사용자가 바로 이해할 수 있게 했다.
- 품명 무결과 복사문에서 `예비 검토 가능한 HS 방향` 제목이 한국어로 고정되던 부분을 언어별 문구로 분리했다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm run typecheck`
- `npm run lint`

### 복사 안내문 실무형 문구 보강

- 상세 복사문에 `제공된 정보 기준 예비 안내`와 `제품 상세자료, 원산지, 선적 경로, 신고 시점 기준 재확인 필요` 문구를 추가했다.
- 품명 검색 무결과의 짧은 복사문도 바로 업체에 보낼 수 있도록 핵심 보완 요청 항목 3개를 포함하게 했다.
- 품명 무결과 기본 보완 질문을 한국어/영어/중국어별로 분리해 해외 수출자에게 전달할 때 한국어 질문이 섞이지 않게 했다.
- 해외 HS 상세 복사문에도 예비 안내와 재확인 문구를 추가했다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts`
- `npm run typecheck`
- `npm run lint`

### HS CODE 일괄 조회 1차 구현

- `/hs/batch` 페이지를 추가해 XLSX/CSV 업로드와 탭/쉼표 붙여넣기 입력을 지원했다.
- 필수값은 HS CODE로 두고, 10자리 HSK만 세율·요건 조회 대상으로 처리한다.
- 인보이스 전체 행 조회를 전제로 같은 HS CODE가 여러 번 있어도 합치지 않고 입력 순서와 행 번호 그대로 결과를 출력한다.
- 수입국가 필터 기준 기본관세, FTA 관세, 적용 가능 최저세율, 부가세, 수입요건, 원산지표시 요약을 표시한다.
- 결과는 실제 `.xlsx` 다운로드 파일로 내보낸다.
- 좌측 메뉴에 `HS 일괄 조회` 항목을 추가했다.
- 다운로드 파일은 헤더 색상, 컬럼 폭, 줄바꿈, 상태 색상을 적용해 실무 확인용으로 바로 열람할 수 있게 했다.
- 조회 결과 화면을 `전체`, `완료`, `보완 필요`, `오류` 탭으로 나눠 10자리가 아닌 행과 조회 실패 행을 빠르게 볼 수 있게 했다.
- XLSX 다운로드 파일에 보완 필요 행이 있을 경우 `보완 필요` 시트를 별도로 생성한다.
- 조회 결과 각 행에 `안내 복사` 버튼을 추가해 업체 답변용 예비 안내문을 바로 클립보드에 복사할 수 있게 했다.
- 정상 조회 행은 관세율, FTA, 내국세, 수입요건, 원산지표시를 포함하고, 보완/오류 행은 10자리 HS CODE 보완 요청 문구로 복사된다.
- XLSX 다운로드 파일에도 `업체 안내문` 컬럼을 추가해 행별 안내문을 엑셀에서 바로 복사할 수 있게 했다.
- 조회 결과의 현재 필터에 표시된 행 전체를 한 번에 복사하는 `표시 행 안내 복사` 버튼을 추가했다.
- 사용자가 입력 구조를 쉽게 맞출 수 있도록 `업로드 양식 다운로드` 버튼을 추가했다. 양식은 `HS CODE`, `품명`, `비고` 컬럼과 예시 입력행, 작성 방법 시트를 포함한다.

검증:

- `npm test -- features/hs-batch/input-parser.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### 검토 유료화 고객 노출 숨김

- 이전 작업은 운영 이슈 화면의 수동 명령 안내를 보강한 것이고, 이번 작업은 MVP 제품 범위에서 검토 유료화 노출을 빼는 결정이다.
- 좌측 운영 메뉴에서 담당자 검토 센터 진입 항목을 제거했다. 내부 `/staff/review` 라우트는 `requireStaffRole()` 보호 상태로 남겨 두고 고객 메뉴에서는 보이지 않게 했다.
- `/billing` 페이지와 과금 mock/service에서 담당자 검토 크레딧, 검토 사용량, 검토 과금 정책 문구를 제거했다.
- HS 예비진단 요청 성공 문구에서 "담당자 검토 후 확정" 흐름을 제거하고, 출처 기준 예비 조회와 HSK 확정 전 재확인 안내로 바꿨다.
- HS 확정 요청 폼은 나중에 다시 노출할 수 있도록 컴포넌트 이름은 유지하되 현재는 아무 UI도 렌더링하지 않게 했다.
- `PRODUCT_SPEC`와 `ROADMAP`에 HS 확정 요청, 담당자 검토 크레딧, 검토 유료화는 협업 관세사무소와 가격 정책이 정해질 때까지 고객 화면에서 숨긴다고 기록했다.

검증:

- `npm test -- server/rules/billing.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-446t6tudo-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 AI 분류 흐름 노출

- 이전 작업은 검토 유료화와 HS 확정 요청 노출을 숨긴 것이고, 이번 작업은 품명검색 자체를 AI 분류 진행 흐름이 보이도록 바꾼 것이다.
- `/hs/direct`의 품명검색 결과에 `AI HS 분류 검토 흐름` 패널을 추가했다.
- 패널은 `제품 의미 해석`, `류·호 후보 검토`, `HSK 후보 정리`, `조회 연결 준비` 순서로 AI가 어떤 기준으로 검토했는지 보여준다.
- 후보가 있으면 하단에 `AI 예비 분류가 완료되었습니다.` 안내를 표시하고, 후보 선택 후 관세율·수입요건 예비 조회로 이어지게 했다.
- 후보가 없으면 `AI 예비 분류는 완료됐지만 후보 확정을 위한 정보가 부족합니다.` 안내와 보완 필요 흐름을 표시한다.
- 10자리 후보 카드의 CTA는 `상세 조회`보다 사용 의도가 명확한 `이 코드로 조회`로 바꿨다.

검증:

- `npm test -- server/rules/hs-candidate.service.test.ts lib/i18n/hs-direct.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-moczquww6-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 AI 분석 대기 상태 표시

- 이전 작업은 서버 결과가 나온 뒤 `AI HS 분류 검토 흐름`과 완료 안내를 보여준 것이고, 이번 작업은 검색 버튼을 누른 직후 결과를 기다리는 동안의 대기 상태를 보강한 것이다.
- `/hs/direct` 검색 폼의 제출 버튼을 클라이언트 컴포넌트로 분리해 제출 중 상태를 감지하게 했다.
- 입력값이 HS CODE가 아닌 품명 검색일 때만 `AI가 HS 분류 흐름을 검토하고 있습니다.` 패널을 표시한다.
- 대기 패널은 `제품 의미 해석`, `류·호 후보 검토`, `HSK 후보 정리`, `관세율·요건 연결` 순서로 진행 단계를 보여준다.
- HS CODE 직접 조회는 기존처럼 일반 조회 흐름을 유지하고, 품명 검색에서만 AI 분석 중 문구가 나온다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-9chofgjod-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 후보 카드 판단 근거 보강

- 이전 작업은 검색 버튼을 누른 직후의 `AI 분석 중` 대기 상태를 보강한 것이고, 이번 작업은 결과로 나온 후보 카드의 판단 근거와 다음 행동을 더 명확하게 만든 것이다.
- 품명 기반 후보 카드에 `AI 검토 경로` 블록을 추가해 호, 소호, HSK 후보 정리 과정을 단계로 표시했다.
- 후보 선택 시 기준일의 관세율, FTA, 수입요건, 원산지표시 정보를 예비 조회한다는 `선택 후 조회` 안내를 추가했다.
- 기존 보완 필요 정보는 `갈림 조건` 블록으로 재구성해 재질, 용도, 기능, 리스크에 따라 후보가 달라질 수 있음을 더 직접적으로 보여준다.
- 기존 HS6/계층 경로와 예비 후보 근거는 별도 근거 블록으로 유지해 사용자가 후보의 출처와 경로를 함께 확인할 수 있게 했다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-7t72p1kf2-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 후보 선택 후 직접조회 맥락 유지

- 이전 작업은 품명검색 결과 카드 안에서 후보 판단 근거와 다음 행동을 명확히 보여준 것이고, 이번 작업은 사용자가 후보를 눌러 직접조회 화면으로 이동한 뒤에도 품명검색에서 선택한 후보라는 맥락이 끊기지 않게 한 것이다.
- 품명검색 후보의 `이 코드로 조회` 링크에 `source=product_search`, 원래 입력 품명, 후보 순위를 함께 전달하게 했다.
- `/hs/direct` 직접조회 화면은 품명검색에서 넘어온 후보일 때 `품명검색에서 선택한 AI 예비 후보입니다.` 안내 배너를 표시한다.
- 안내 배너는 원래 입력 품명, 후보 순위, 그리고 아래 관세율·FTA·수입요건·원산지표시가 해당 HS CODE 기준의 예비 조회임을 함께 보여준다.
- HS CODE 직접 입력 조회는 기존 흐름을 유지하고, 품명검색 후보 선택으로 넘어온 경우에만 출처 배너가 표시된다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-ju5xoiq6r-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 완료 후 다음 행동 안내 강화

- 이전 작업은 후보를 눌러 직접조회 화면으로 이동한 뒤에도 품명검색 출처와 후보 순위를 유지한 것이고, 이번 작업은 품명검색 결과 화면 자체에서 예비 분류 완료와 다음 행동을 더 명확하게 보여준 것이다.
- `AI HS 분류 검토 흐름` 하단 완료 영역의 문구를 `AI 예비 분류 검토가 완료되었습니다.`로 정리하고, `후보 확인 → 이 코드로 조회 → 관세율·요건 예비진단` 순서를 추가했다.
- 품명검색 후보 목록 하단에 `품명검색 예비 검토가 완료되었습니다.` 완료 패널을 추가했다.
- 완료 패널은 입력 품명, 후보 개수, 기준일을 보여주고 사용자가 실제 재질·용도·기능이 가까운 후보를 선택해 상세 예비진단으로 이동하도록 안내한다.
- 완료 패널은 후보 비교, 상세 조회, 재확인의 3단계로 정리해 HSK 확정 전 재확인 필요 문구를 유지한다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-gxsctntfa-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 보완 질문 재검색 연결

- 이전 작업은 품명검색 결과가 나온 뒤 완료 상태와 다음 행동을 안내한 것이고, 이번 작업은 후보가 없거나 보완이 필요한 상태에서 사용자가 보완 질문을 바로 재검색에 반영할 수 있게 한 것이다.
- 보완 질문을 기존 품명 뒤에 붙여 `/hs/direct` 품명검색을 다시 실행하는 `productRetrySearchHref` 흐름을 추가했다.
- AI 보완 패널에 `보완 정보로 다시 검색` 영역을 추가해 상위 보완 질문을 `반영` 링크로 제공한다.
- 후보가 없는 `HS CODE 특정 정보 부족` 패널에도 상위 보완 요청 항목을 `재검색` 링크로 제공한다.
- 기존 복사 버튼은 유지하되, 사용자가 별도 입력 없이 보완 조건을 붙인 검색 결과로 바로 이동할 수 있게 했다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-9hn324ce2-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 진행바 조기 종료 수정

- 사용자 제보: 품명검색 시 `품명 입력값 확인: ...` 진행 표시가 돌다가 사라지고 결과가 나오지 않는 것처럼 보였다.
- 이전 작업은 보완 질문을 재검색 링크로 연결한 것이고, 이번 작업은 검색 결과 생성 중 전역 진행바가 먼저 꺼지는 동작을 수정한 것이다.
- 전역 진행바의 제출 처리에서 GET 검색 폼은 버튼 활성화 상태만으로 진행바를 종료하지 않도록 바꿨다.
- 품명검색처럼 서버 렌더 결과를 기다리는 GET 조회는 URL 변경 또는 기존 완료 이벤트 기준으로 진행 상태를 유지한다.
- POST 저장/요청류 폼은 기존처럼 버튼이 다시 활성화되면 진행바를 종료하는 안전장치를 유지한다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-5oxri5t9y-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 진행바 최종 단계 정체 보정

- 사용자 제보: 품명검색 진행 표시가 `검색 결과 화면 생성` 단계에서 멈췄다.
- 이전 수정은 GET 검색 진행바가 너무 빨리 꺼지는 문제를 막은 것이고, 이번 수정은 결과 완료 신호를 못 받는 경우 진행바가 계속 남는 문제를 보정한 것이다.
- GET 검색 폼에도 안전 종료 타이머를 다시 적용하되, 1.2초가 아니라 최종 단계 도달 후 12초가 지나고 버튼이 복구된 경우에만 닫히게 했다.
- POST 저장/요청류 폼은 기존처럼 1.2초 안전 종료 기준을 유지한다.
- 운영 로그에서 `/hs/direct` 요청이 200으로 완료되는 것을 확인했고, 진행바 종료 조건 문제로 판단해 전역 진행바 로직을 수정했다.

검증:

- `npm test -- lib/i18n/hs-direct.test.ts server/rules/hs-candidate.service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-qvn8htkn0-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`

### 품명검색 GPT API 전용 전환

- 이전 작업은 품명검색 결과 생성 중 진행바가 오래 남는 UI 상태를 보정한 것이고, 이번 작업은 느린 원인으로 확인된 OpenAI 웹 검색 도구 호출 경로를 제거한 것이다.
- 품명검색 OpenAI Responses API 요청에서 `web_search` 도구를 붙이는 조건과 웹 실패 후 재시도 분기를 삭제했다.
- 모델명, SKU, 짧은 한글 품명, 외국어 품명도 모두 GPT API 일반 응답만 사용한다.
- 제품이 visible input만으로 식별되지 않으면 웹 검색을 하지 않고 제품 category, use, material, catalog, photo, specification 추가 입력을 요청하도록 프롬프트를 정리했다.
- 실사이트 측정에서 웹 도구 제거 후에도 `립밤` 결과가 약 49.2초 걸려, GPT-only 품명 정규화 대기 상한을 5초로 제한하고 no-candidate GPT 재시도 상한을 2초로 분리했다.
- 추가 측정에서도 약 46.0초가 걸려, 품명검색 첫 결과 화면에서는 후보 선택 전 관세율·수입요건 상세 조회를 기다리지 않도록 분리했다. 상세 데이터는 후보의 `이 코드로 조회` 진입 후 직접조회 화면에서 조회한다.
- 이후에도 렌더가 오래 걸려, GPT가 HS4/HS6/HS10 코드 힌트를 반환한 경우에는 느린 광역 품명 `ILIKE` 검색을 건너뛰고 코드 힌트 기반 공식 HS 조회 결과를 우선 반환하게 했다.
- production telemetry를 켠 뒤 확인한 결과 GPT 정규화는 약 2초였고, 후보 생성 단계가 약 96.8초였다. `립밤`처럼 기존 결정적 룰이 HSK 후보를 바로 내는 품명은 광역 DB 검색 전에 해당 HSK만 공식 `hs_master`에서 exact 조회해 빠르게 반환하도록 추가했다.
- 재배포 후 실사이트 `립밤` 검색은 약 7.6초로 측정됐다. telemetry 기준 후보 생성 단계는 약 2.24초, 전체 서버 렌더 주요 단계는 약 4.25초였다.
- 사용자가 DB 후보 후처리 제거와 GPT 중심 흐름을 요청해, Supabase 운영 경로에서 느린 광역 공식명/표준품명/저장 검색 후처리를 제거했다. 결정적 exact 후보가 없으면 GPT가 반환한 HS4/HS6/HS10 힌트를 예비 후보로 바로 표시한다.
- 이 변경은 품목분류 확정이 아니라 `AI 품명 정규화` 출처의 예비 HS 방향이며, 상세 관세율·요건은 사용자가 후보를 선택해 직접조회로 들어간 뒤 공식 데이터 기준으로 조회한다.
- 배포 후 실사이트 측정에서 이전에 37초 이상 걸리거나 70초 timeout이 났던 `텀블러`, `가방`은 각각 약 6.5초, 6.3초에 완료 화면과 후보를 표시했다.
- production telemetry 기준 fast exact 후보 경로는 후보 생성 단계가 약 2.2초로 유지됐고, 결정적 exact 후보가 없는 품명은 `supabase_gpt_only` 경로에서 약 2.0초 안에 후보 없음/추가 정보 필요 상태로 종료됐다.
- 사용자가 `사탕`처럼 명확한 품명에서 GPT가 후보를 못 내는 문제를 지적해, 품명검색 GPT 지시문을 `"검색품명" HS CODE 알려줘` 중심의 짧은 실무 질문으로 단순화했다.
- 이후에도 운영에서 `사탕`이 후보 없음으로 끝나는 원인을 확인한 결과, 1차 GPT 호출이 짧은 timeout에 잘리고 fallback성 빈 응답이 캐시되는 구조였다. 1차 GPT는 서버 실행 예산 안에서 충분히 기다리도록 변경하고, GPT 출력은 compact JSON으로 제한했다.
- 후보와 primaryCandidate가 모두 없는 품명 정규화 결과는 캐시에 저장하지 않도록 해, 일시적인 GPT timeout/fallback 결과가 같은 품명의 이후 검색을 막지 않게 했다.
- 운영 env를 `OPENAI_PRODUCT_SEARCH_TIMEOUT_MS=30000`, `OPENAI_PRODUCT_SEARCH_RETRY_TIMEOUT_MS=8000`으로 갱신하고 재배포했다.
- 재배포 후 실사이트 `사탕` 검색은 약 7.6초에 완료 화면과 `HS 1704` 예비 방향을 표시했다. telemetry 기준 GPT 정규화/후보 생성은 약 3.5초였고 `supabase_gpt_only` 경로에서 `ai_hs_hint` 후보 1개가 생성됐다.
- 운영 확장 문서의 품명검색 캐시/타임아웃 설명도 웹 보조가 아닌 GPT API 전용 정책으로 갱신했다.

검증:

- `npm test -- server/ai/clarification.service.test.ts server/cache/lookup-cache.test.ts server/rules/hs-candidate.service.test.ts`
- `npm test -- server/rules/hs-candidate.service.test.ts server/ai/clarification.service.test.ts server/observability/lookup-telemetry.test.ts lib/i18n/hs-direct.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Vercel production deployment: `customs-hscode-b0qj57qk3-koo-apps.vercel.app`
- Vercel production deployment: `customs-hscode-4a59amfaj-koo-apps.vercel.app`
- Alias: `https://hsfinder.co.kr`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- Playwright 실사이트 검색: `텀블러` 6483ms / 후보 2개, `가방` 6250ms / 후보 1개, `손선풍기` 5844ms / 후보 1개, `핸드크림` 6029ms / 후보 1개
- Playwright 실사이트 검색: `사탕` 7551ms / `HS 1704`, `초콜릿 사탕` 6685ms / `HS 1704`

### HS explorer snapshot payload 축소와 운영 화면 정리

- 이전 작업은 앱 서버에서 불필요한 후속 조회를 줄인 것이고, 이번 작업은 HS4/HS6 explorer RPC가 내려주는 nested HSK child payload 자체를 줄인 것이다.
- `lookup_hs6_explorer`, `lookup_hs4_explorer`가 화면에 쓰지 않는 `internal_taxes`, coverage flags, derived count, refresh metadata를 child JSON에서 제거하도록 migration을 추가하고 운영 DB에 적용했다.
- 4자리/6자리 탐색 화면에 필요한 관세율·요건 요약은 유지하고, 10자리 상세조회는 기존 full detail RPC를 계속 사용한다.
- 운영 홈에서 조회 품질 로그는 점검 대상이 있을 때만 자동으로 펼치고, 정상 상태에서는 summary만 보이도록 접었다.
- 운영 수동 명령의 production smoke 예상 결과를 현재 10개 경로 기준으로 정정했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run health`
- `npm test -- features/hs/import-tariff-display.test.ts`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm run e2e:product-supplement`
- Playwright 실사이트 조회: `1704`, `170490`, `1704902090`
- SQL 운영 확인: HS4/HS6 explorer payload에서 `internal_taxes`, `coverage_flags` 제거 및 `tariff_rates` 유지

### 운영 보조 화면과 대시보드 시작 흐름 정리

- 이전 작업은 운영 홈의 조회 품질 로그를 접는 작업이었고, 이번 작업은 공지 관리·고객 계정·자료 관리 각각의 사용 목적을 화면 상단에서 분명히 나누는 작업이다.
- 공지 관리는 `평소 노출 상태 확인`, `필요할 때 작성·수정`, `삭제는 최후 작업` 기준을 추가했다.
- 고객 계정 관리는 `가입자 상태 확인`, `검색 후 한 명만 펼치기`, `권한·삭제는 위험 작업` 기준을 추가했다.
- 자료 관리는 매일 확인, 자료 갱신 때, 문제 발생 때의 문구를 더 명확하게 바꿨다.
- 고객 대시보드에는 `처음이면 이렇게 시작하세요` 3단 안내를 추가해 상단 통합 검색, 후속 업무, 즐겨찾기/최근 검색 재사용 순서를 보여준다.
- 후속 업무 카드에는 `사용 시점` 문구를 추가하고, 검색 다음 업무 흐름에 맞춰 `HS 일괄 조회`를 후속 업무 첫 카드로 배치했다.
- 대시보드 하단 반복 사용 카드에는 목적 설명과 항목 수를 추가하고, `즐겨찾기 HS CODE`, `최근 검색`, `적하목록 알림 감시` 순서로 재배치했다.
- 공지사항 카드도 같은 하단 카드 패턴에 맞춰 사용자용 설명과 공지 수 배지를 추가했다.
- 대시보드 hero, 검색 helper, 시작 안내 1단계 문구를 짧게 줄여 상단 검색과 시작 안내의 반복을 낮췄다.
- 모바일 실사이트 측정에서 대시보드가 390px viewport에서도 768px scrollWidth를 만드는 문제를 확인했다.
  - 최상위 대시보드 grid, 후속 업무 grid, 하단 반복 카드 grid가 자식 최소 콘텐츠 폭을 따라 커지지 않도록 `minmax(0,1fr)`와 `min-w-0`을 적용했다.
  - 공지사항 카드 루트도 하단 카드들과 같은 축소 가능 레이아웃으로 맞췄다.
- governance test가 현재 운영 내비/수동 계정 발급 UI 문구를 기준으로 검사하도록 갱신했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm run e2e:product-supplement`
- Playwright 실사이트 확인: `/dashboard` 시작 안내 표시
- Playwright 실사이트 확인: `/dashboard` 후속 업무 카드 사용 시점 및 카드 순서 표시
- Playwright 실사이트 확인: `/dashboard` 하단 반복 사용 카드 설명 및 카드 순서 표시
- Playwright 실사이트 확인: `/dashboard` 공지사항 카드 설명 표시
- Playwright 실사이트 확인: `/dashboard` 상단 문구 균형 정리 표시
- Playwright 실사이트 모바일 측정: 390px viewport `scrollWidth=390`, 768px viewport `scrollWidth=768`, horizontal overflow 없음

### HS 직접 조회 결과 화면 모바일 정리

- 이전 작업은 대시보드 모바일 폭을 고친 것이고, 이번 작업은 핵심 조회 화면인 `/hs/direct`의 품명검색 결과와 10자리 상세 결과를 모바일/태블릿에서 실측한 것이다.
- 품명검색 결과 화면은 `사탕` 기준 모바일 390px, 태블릿 768px 모두 전체 가로 overflow가 없음을 확인했다.
- 10자리 상세 조회 화면은 문서 전체 overflow는 없었지만, 상세 카드 상단의 `즐겨찾기`, `예상 납세액 산출`, 안내 언어/분량, 복사 컨트롤이 좁은 화면에서 한 줄에 몰려 잘릴 수 있었다.
- `품목 상세 정보` 액션바를 `lg` 이상에서만 한 줄 배치하고, 모바일/태블릿에서는 제목 아래로 액션들이 줄바꿈되도록 조정했다.
- 관세/요건 table의 내부 `overflow-x-auto`는 유지했다. 이 영역은 데이터 비교용 표라서 문서 전체를 밀지 않고 표 내부에서만 가로 스크롤된다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- features/hs/import-tariff-display.test.ts lib/i18n/hs-direct.test.ts`
- `npm run build`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 측정: `/hs/direct?query=사탕...` 모바일/태블릿 horizontal overflow 없음
- Playwright 실사이트 측정: `/hs/direct?query=1704902090...` 모바일 390px, 태블릿 768px, 데스크톱 1366px 모두 `scrollWidth=viewport`, 액션바 내부 clipped element 없음

### 실무 도구 화면 모바일 폭 점검

- 이전 작업은 HS 직접 조회 결과 화면이었고, 이번 작업은 별도 실무 도구인 `/cargo`, `/duty-estimator`, `/used-car-export`를 모바일/태블릿에서 점검한 것이다.
- `/duty-estimator`, `/used-car-export`는 모바일 390px, 태블릿 768px 모두 전체 가로 overflow가 없음을 확인했다.
- `/cargo`는 모바일 390px에서 조회 입력 카드가 input 기본 최소폭 때문에 720px 이상으로 커져 문서 전체를 밀었다.
- 적하목록 조회/상태 알림 등록 카드에 `min-w-0`, `grid-cols-[minmax(0,1fr)]`, input/select `w-full min-w-0`을 적용해 입력폼이 모바일 폭 안에서 줄어들도록 수정했다.
- 결과/감시 table은 비교용 표라서 기존 내부 `overflow-x-auto`를 유지했다. 운영 재측정에서 문서 전체 `scrollWidth=390`이고 table만 내부 스크롤로 남는 것을 확인했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/i18n/cargo.test.ts server/services/cargo-status-classifier.test.ts`
- `npm run build`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 측정: `/cargo`, `/duty-estimator`, `/used-car-export` 모바일 390px/태블릿 768px 모두 `scrollWidth=viewport`

### 관리 화면 안내 밀도 축소

- 이전 작업은 실무 도구 모바일 폭을 고친 것이고, 이번 작업은 대표/개발자 혼자 운영할 때 관리 화면 첫 화면에 보이는 안내문 밀도를 낮춘 것이다.
- `/operations/users`, `/operations/notices`, `/legal-updates` 상단에 항상 보이던 3개짜리 운영 기준 안내 카드를 `운영 기준 보기` 접힘 영역으로 이동했다.
- 기능은 제거하지 않았다. 고객 계정 검색/필터, 수동 계정 발급, 공지 등록/수정/삭제, 자료 갱신·게시 실행, 상세 데이터 점검 흐름은 그대로 유지했다.
- 첫 화면은 숫자 요약, 검색/필터, 오늘 볼 조치 항목을 우선 보여주고, 운영 기준 도움말은 필요할 때만 펼치도록 정리했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/lookup-governance.test.ts lib/i18n/dashboard.test.ts`
- `npm run build`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 테스트 계정은 `/operations/users`, `/operations/notices`, `/legal-updates`에서 개발자 전용 접근 차단 유지

### 사용자 관리 상세 행 밀도 축소

- 이전 작업은 관리 화면 상단의 공통 안내 카드를 접은 것이고, 이번 작업은 `/operations/users`에서 특정 사용자를 펼쳤을 때 보이는 긴 상세 조작 영역을 나눈 것이다.
- 사용자 ID, 가입일, 마지막 로그인은 즉시 보이게 유지했다.
- 이메일, 이름, 권한, 회원 유형, 회사 정보, 허용 IP 수 수정 폼은 `기본정보 수정` 접힘 영역으로 이동했다.
- `최근 접속 이력`과 `테스트·위험 작업`은 별도 접힘 영역으로 유지해 평상시 운영 확인과 위험 조작을 분리했다.
- 기능은 제거하지 않았다. 저장, 테스트 로그인 링크 생성, 사용자 삭제 흐름은 기존 server action을 그대로 사용한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/lookup-governance.test.ts`
- `npm run build`
- Vercel production deployment: `customs-hscode-4ub93icf7-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/users`에서 접근 차단 유지, 운영 UI 미노출

### 운영 점검 상세 로그 기본 접힘

- 이전 작업은 `/operations/users`의 특정 사용자 상세 행을 정리한 것이고, 이번 작업은 `/operations/health` 첫 화면에서 큰 운영 이슈/조회 로그 표가 바로 펼쳐지지 않게 한 것이다.
- `운영 이슈 처리 상태`를 접힘 영역으로 바꾸고, 필터가 적용된 상태에서만 자동으로 펼치도록 했다.
- `조회 품질 로그`는 점검 대상이 있어도 기본 접힘 상태로 두어, 요약 카드와 오늘 할 일을 먼저 보게 했다.
- 상세 데이터, 원시 telemetry, 이슈 처리 폼은 제거하지 않았다. 운영자가 필요할 때 영역을 펼치면 기존 기능을 그대로 사용할 수 있다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/operations-issue.repository.test.ts server/repositories/lookup-telemetry.repository.test.ts`
- `npm run build`
- Vercel production deployment: `customs-hscode-g9nv9le11-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/users`, `/operations/health`에서 접근 차단 유지, 운영 UI 미노출

### Rate limit 초과 이벤트 운영 표시

- 이전 작업은 운영 점검 화면의 노출 밀도를 낮춘 것이고, 이번 작업은 Phase D 운영 안정화 항목인 route별 rate limit 초과 이벤트 관측을 추가한 것이다.
- `rate_limit_events` 테이블을 추가하고 service role만 insert, developer만 read 하도록 RLS를 설정했다.
- API route 공통 인증 rate limit과 자동차 제원조회 server action에서 초과 시 route, scope, 제한값, retry-after를 저장한다.
- IP와 user-agent 원문은 저장하지 않고 rate limit identity hash만 저장한다.
- `/operations/health` 오늘 할 일과 상세 진단에 `Route rate limit 초과 이력`을 추가해 route별 초과 건수를 볼 수 있게 했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- lib/rate-limit.test.ts server/repositories/rate-limit-event.repository.test.ts server/repositories/lookup-governance.test.ts`
- `npm run build`
- Supabase production DB에 `20260531009000_rate_limit_events.sql` migration 적용
- `vercel env run -e production -- npm run health:db`
- Vercel production deployment: `customs-hscode-4ru3sxyz5-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/health`에서 접근 차단 유지, 운영 UI 미노출

### 반입계 출력 실패 상태 운영 표시

- 이전 작업은 route별 rate limit 초과를 관측한 것이고, 이번 작업은 반입계 출력 실패를 대표/운영자가 이해할 수 있는 `정상`, `주의`, `조치 필요` 상태로 요약한 것이다.
- `container_receipt_failure_events` 테이블을 추가하고 service role만 insert, developer만 read 하도록 RLS를 설정했다.
- 반입계 출력 브라우저 실행 실패와 터미널 캡처 실패를 기록한다.
- 컨테이너 번호 원문은 저장하지 않고 hash만 저장한다.
- `/operations/health`의 오늘 할 일과 상세 진단에 `반입계 출력 실패 상태`를 추가했다.
- 반복 실패는 터미널/원인 묶음으로 먼저 보여주고, `terminal_loading_not_settled` 같은 개발자용 실패 코드는 접힌 상세 영역에 남겼다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/container-receipt-failure-event.repository.test.ts server/repositories/lookup-governance.test.ts`
- `npm run build`
- Supabase production DB에 `20260531010000_container_receipt_failure_events.sql` migration 적용
- `vercel env run -e production -- npm run health:db`
- Vercel production deployment: `customs-hscode-iqyfpff4c-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/health`에서 접근 차단 유지, 운영 UI 미노출

### API001/API012 정기 작업 상태 운영 표시

- 이전 작업은 반입계 출력 실패를 운영자가 이해할 수 있는 상태로 요약한 것이고, 이번 작업은 API001 화물 감시와 API012 관세환율 수집 정기 작업의 성공/실패를 운영 화면에 남긴 것이다.
- `protected_job_events` 테이블을 추가하고 service role만 insert, developer만 read 하도록 RLS를 설정했다.
- `/api/jobs/cargo-watch`와 `/api/jobs/exchange-rates` 실행 결과를 성공/실패, 소요시간, 짧은 메시지, 민감하지 않은 집계 metadata로 저장한다.
- `/operations/health`의 오늘 할 일과 상세 진단에 `외부 API 정기 작업 상태`를 추가했다.
- 운영자는 `정상`, `주의`, `조치 필요`만 먼저 보고, 개발자용 실행 상세는 접힌 표에서 확인하도록 했다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/protected-job-event.repository.test.ts server/repositories/lookup-governance.test.ts server/operations/environment-health.service.test.ts`
- `npm run build`
- Supabase production DB에 `20260531011000_protected_job_events.sql` migration 적용
- `vercel env run -e production -- npm run health:db`
- Vercel production deployment: `customs-hscode-pktutpnjz-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/health`에서 접근 차단 유지, 운영 UI 미노출

### 운영 점검 대표용 첫 화면 축소

- 이전 작업은 외부 API 정기 작업 성공/실패 telemetry를 추가한 것이고, 이번 작업은 `/operations/health` 첫 화면을 1인 대표/운영자가 바로 판단할 수 있게 줄인 것이다.
- `핵심 운영 요약`을 7개 상세 카드에서 `서비스 준비`, `HS 데이터`, `고객 영향`, `외부 작업` 4개 대표 카드로 축소했다.
- `오늘 할 일`은 고객 영향이 있을 수 있는 항목 위주로 유지하고, `상세 진단`, `트래픽 제한`은 `개발자용 바로가기` 접힘 영역으로 분리했다.
- 기존 상세 진단, rate limit, 스키마, 작업 이력, 실패 로그는 제거하지 않았다. 문제가 있을 때 펼쳐서 원인을 확인하는 구조로 남겼다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/protected-job-event.repository.test.ts server/repositories/container-receipt-failure-event.repository.test.ts server/repositories/rate-limit-event.repository.test.ts`
- `npm run build`
- Vercel production deployment: `customs-hscode-8udx3n1lh-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/health`에서 접근 차단 유지, 운영 UI 미노출

### 운영 통계 개발 요청 문구화

- 이전 작업은 `/operations/health` 첫 화면의 카드 수와 노출 밀도를 줄인 것이고, 이번 작업은 남아 있는 운영 통계를 보고 대표가 어떤 개발 요청을 하면 되는지 자동 문구로 보여주는 것이다.
- `개발 요청 문구` 카드를 추가해 운영 이슈, 조회 품질 반복, HS snapshot 지연, 반입계 출력 실패, 외부 API job 실패, rate limit 초과, 배포 설정, background job 실패를 수정 요청 후보로 변환한다.
- 문제가 있으면 `수정 요청` 카드에 그대로 보낼 문장을 표시하고, 문제가 없으면 다음 개선 작업 문구를 표시한다.
- 기존 상세 통계, 원시 telemetry, 운영 이슈 처리 폼은 유지했다. 이번 변경은 통계를 해석하기 쉽게 만드는 상단 안내만 추가한다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test -- server/repositories/operations-issue.repository.test.ts server/repositories/lookup-telemetry.repository.test.ts server/repositories/protected-job-event.repository.test.ts server/repositories/container-receipt-failure-event.repository.test.ts server/repositories/rate-limit-event.repository.test.ts`
- `npm run build`
- Vercel production deployment: `customs-hscode-5dk2x4lhp-koo-apps.vercel.app`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `E2E_BASE_URL=https://hsfinder.co.kr npm run e2e:product-supplement`
- Playwright 실사이트 확인: 일반 테스트 계정은 `/operations/health`에서 접근 차단 유지, 운영 UI 미노출

### 플랫폼 중심 MVP 재정의

- 이전 작업은 운영 통계를 보고 개발 요청 문구를 만들 수 있게 한 운영 화면 개선이고, 이번 작업은 제품 방향 자체를 HS 도구 중심에서 수출입 연결 플랫폼 중심으로 재정의한 것이다.
- `PRODUCT_SPEC`의 한 줄 정의를 수출입 화주, 해외 거래처, 포워더, 관세사를 연결하는 무역 실무 플랫폼으로 바꿨다.
- HS CODE 조회, 품명 AI 검색, 관세율/요건 조회, 중고차 수출, 무역뉴스는 제거하지 않고 견적 요청·통관 의뢰·파트너 매칭을 시작하게 하는 부가 능력으로 재배치했다.
- `ROADMAP` 상단에 `Platform MVP Rebaseline`을 추가해 Platform Phase 0~6을 새 우선순위로 정의했다.
- 1차 MVP 범위를 회원 유형/검증, 운송 견적 요청, 포워더 입찰, 통관 의뢰 요청, 관세사무소 입찰, 화주 견적 비교, 운영자 승인·숨김·차단으로 잡았다.
- 해외 수입자/수출자는 가입 가능하게 하되, MVP에서는 국가별 사업자번호 실시간 검증 대신 이메일 인증, 회사 정보, 증빙 서류 업로드, 운영자 수동 승인으로 검증한다고 명시했다.
- `DECISIONS`에 최저가 입찰만 강조하지 않고 응답 속도, 검증 상태, 전문 분야, 리드타임, 서류 보완 품질, 거래 이력을 함께 보여준다는 제품 결정을 남겼다.

검증:

- `rg`로 PRODUCT_SPEC, ROADMAP, DECISIONS의 플랫폼 MVP, 운송 견적, 통관 의뢰, 해외 업체 검증, 최저가 방지 용어 반영 확인
- 코드 변경 없음. 타입체크, 린트, 빌드, 배포는 대상 아님

### 플랫폼 실행 레일과 회사 역할 연결

- 이전 작업은 플랫폼 방향과 MVP 범위를 문서로 재정의한 것이고, 이번 작업은 그 방향을 따라갈 세부 실행 레일과 첫 앱 코드 연결 지점을 만든 것이다.
- `ROADMAP`에 `Platform Execution Rail`을 추가해 P0.1부터 P6.1까지 작업 단위를 더 작게 나눴다.
- 각 레일에 이전 작업과의 차이, 완료 조건, 검증 기준을 적어 중간에 이어받아도 다음 작업을 선택할 수 있게 했다.
- `company-marketplace.repository`를 추가해 기존 기업회원 `business_types`를 새 marketplace `company_party_types`로 매핑한다.
  - `importer`, `exporter` -> `domestic_shipper`
  - `forwarder` -> `forwarder`
  - `customs_broker` -> `customs_broker`
- 회원가입 완료 후 회사 계정이면 marketplace 역할 동기화를 시도하도록 `authenticateAction`을 연결했다.
- 아직 marketplace migration을 적용하지 않은 환경에서는 `company_party_types` 테이블 없음 오류를 안전하게 건너뛰어 기존 회원가입이 깨지지 않게 했다.
- migration 적용 후에는 같은 코드가 `company_party_types`에 역할 row를 upsert한다.
- marketplace migration에 기존 `companies.business_types`를 `company_party_types`로 옮기는 backfill을 추가했다.
- 리뷰어 검토 후 `company_party_types` 오류 fallback을 실제 missing-schema 오류로만 좁혔다. RLS/권한 오류는 숨기지 않는다.
- 회사 admin이 검증 후 marketplace 역할을 직접 추가하지 못하도록 `company_party_types` write policy를 staff/service-role 중심으로 좁혔다.
- 차단/정지 업체가 match row를 갖고 있어도 요청, 문서, 견적, 질문을 읽지 못하도록 active marketplace helper를 추가했다.
- 요청 문서 metadata와 storage upload는 요청 소유권과 path의 request id를 함께 확인하도록 보강했다.
- `platform-marketplace-governance.test`를 추가해 역할 self-escalation, blocked partner read, 문서 소유권, RPC 기반 상태 변경 정책이 다시 깨지지 않도록 migration SQL 회귀 테스트를 고정했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/repositories/company-marketplace.repository.test.ts features/auth/schemas.test.ts`
- `npm run lint`
- `npm test`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts server/repositories/company-marketplace.repository.test.ts`

### 회사 검증 증빙 업로드 skeleton

- 이전 작업은 회원가입 업무 유형을 marketplace 회사 역할로 연결하고 RLS 회귀 테스트를 고정한 것이고, 이번 작업은 회사 검증 상태와 증빙 업로드의 첫 backend/UI skeleton을 만든 것이다.
- `company_verification_documents` storage 접근을 단순 회사 prefix가 아니라 metadata row와 묶도록 migration helper와 policy를 보강했다.
- 증빙 storage path를 `{company_id}/{document_id}/{random}-{sanitized_file_name}` 구조로 고정했다.
- 회사 검증 증빙 업로드 schema, repository, server action을 추가했다.
  - 회사 관리자만 업로드 가능
  - PDF, JPG, PNG, WEBP만 허용
  - 10MB 제한, SHA-256 checksum 저장
  - 원문 파일은 private bucket에 저장
- `/settings/members`를 회사 검증 화면으로 전환했다.
  - migration 미적용 환경에서는 업로드 비활성 안내를 표시한다.
  - 비로그인 접근은 `/login`으로 redirect된다.
- 운영자 승인 skeleton server action을 추가했다.
  - 개발자 계정만 승인/반려 가능
  - 승인 시 회사 `verification_status`를 `operator_approved`로 갱신
  - audit log에는 문서 ID, 상태, 유형만 남기고 원문이나 storage signed URL은 남기지 않는다.
- 리뷰어 기준에 따라 P1.2 시작 전 보안 리뷰어를 붙였고, private bucket/RLS/path/audit/generic error 요구사항을 반영했다.

검증:

- `npm run typecheck`
- `npx vitest run server/repositories/company-verification.repository.test.ts server/repositories/platform-marketplace-governance.test.ts server/repositories/company-marketplace.repository.test.ts`
- `npx vitest run features/company-verification/schemas.test.ts server/repositories/company-verification.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run lint`
- `npm run build`
- `supabase db lint --local --fail-on error`

### 운송 견적 요청 공개와 포워더 매칭

- 이전 작업은 화주가 운송 견적 요청을 `draft`로 저장하는 P2.1이고, 이번 작업은 저장된 요청을 `open`으로 공개하면서 조건에 맞는 포워더 match row를 생성하는 P2.2다.
- `publish_freight_request` RPC를 추가했다.
  - requester 본인 또는 staff만 공개 가능
  - 회사 프로필이 없는 사용자의 NULL 비교 권한 우회를 차단
  - 정지/차단 회사는 공개 불가
  - 공개 마감은 RPC에서도 최대 48시간으로 제한
  - 공개 전 출발 국가, 도착 국가, 운송 방식 필수
  - 국가 코드는 ISO 2자리, 운송 방식은 허용값만 통과
  - 검증 완료·활성 상태·forwarder 역할이 있는 회사만 매칭
  - 선호 조건의 방향, 국가, 운송 방식, 항구, cargo tag를 기준으로 매칭
  - 알림 비활성 파트너도 inbox 노출은 가능하게 match row를 만들고 `notification_status = skipped`로 둔다.
  - 매칭 0건이면 `open`으로 바꾸지 않고 실패시켜 보이지 않는 공개 요청을 만들지 않는다.
- `service_requests` 직접 update RLS를 staff-only로 좁혀 publish RPC 우회를 막았다.
- direct insert도 `status = draft`만 허용하도록 제한했다.
- `freight_request_details`는 requester가 draft 상태에서만 직접 insert/update/delete 가능하도록 좁혔다.
- draft 생성도 `freight_request_draft_created` audit log를 남기도록 보강했다.
- `/requests/freight`에 내 요청 목록과 24/48시간 공개 버튼을 추가했다.
- 리뷰어 지적사항을 반영했다.
  - Critical: 회사 없는 사용자 publish 권한 우회 차단
  - Critical: direct RLS update로 match/audit 우회 차단
  - High: 공개 후 freight detail 변경 차단
  - High: sparse request 광범위 노출 방지
  - Medium: RPC 직접 호출 deadline 제한
  - Medium: 정지/차단 requester 공개 차단
  - Medium: notification disabled 의미 정리
  - Medium: 매칭 0건 open 방지
  - Low: draft 생성 audit 추가
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/freight`를 브라우저로 열었고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- `ROADMAP`에서 P2.2를 완료로 갱신했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/freight-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`

### 운송 견적 요청 초안 생성

- 이전 작업은 포워더·관세사무소가 받고 싶은 요청 조건을 저장하는 P1.3이고, 이번 작업은 화주가 실제 운송 견적 요청 초안을 저장하는 P2.1이다.
- `create_freight_request_draft` DB RPC를 추가해 `service_requests`와 `freight_request_details`를 한 트랜잭션에서 생성하도록 했다.
- RPC는 로그인 사용자와 현재 회사 프로필을 확인하고, 요청 상태를 `draft`로만 생성한다.
- `freight-request-schemas`와 server action/repository를 추가했다.
- `/requests/freight` 페이지와 `FreightRequestDraftPanel`을 추가했다.
  - 수입/수출 방향
  - 제목과 품목 요약
  - 출발/도착 국가, 장소, 항구·공항
  - Incoterms, 운송 방식, 적재 형태
  - 포장 수량, 중량, CBM, 컨테이너, VIN
  - 위험물, 온도관리, 중고차 여부
- 이 단계는 초안 저장까지만 처리하고, 서류 첨부·공개 모집·파트너 매칭은 다음 레일로 분리했다.
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/freight`를 브라우저로 열었고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- `ROADMAP`에서 P2.1을 완료로 갱신했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/freight-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`
- `supabase db lint --local --fail-on error`

### 조회 결과에서 요청 초안 생성 연결

- 이전 작업은 marketplace 알림 worker skeleton이었고, 이번 작업은 HS/품명 조회 결과를 실제 운송 견적 요청 또는 통관 의뢰 요청 초안으로 넘기는 P5.1 전환 흐름이다.
- `marketplace-request-prefill` 유틸을 추가해 HS 조회 결과의 품명, HSK/HS6, 조회 기준일, 수입/수출 방향, 국가 값을 `/requests/freight`와 `/requests/clearance` query로 전달한다.
- 품명 AI 후보 카드에 `이 후보로 운송 초안 만들기`, `이 후보로 통관 초안 만들기` CTA를 추가했다.
  - 후보는 HSK 확정 전 예비값으로만 요청 초안에 전달된다는 안내를 함께 표시한다.
- 10자리 직접조회 수입 결과 toolbar에 `운송 초안`, `통관 초안` CTA를 추가했다.
- 수출 직접조회 결과에도 운송/통관 초안 생성 CTA를 추가해 export 조회에서 플랫폼 의뢰로 이어지게 했다.
- 운송 견적 초안 폼은 HS 조회 query에서 품명, 예비 HS CODE, 기준일, 출발/도착 국가, 요청 방향을 기본값으로 채운다.
- 통관 의뢰 초안 폼도 같은 값을 기본값으로 채우되, HS 조회에서 넘어온 예비 코드를 `확정 또는 제공받은 HS CODE`로 자동 체크하지 않도록 했다.
  - HS 조회에서 시작한 통관 의뢰는 `요건 확인 필요`를 기본 체크해 통합공고, 개별법령, 표시·인증·유통규제 검토가 빠지지 않게 했다.
- UX/UI 리뷰어가 지적한 export CTA 누락, 예비 HS CODE 확정 오해, 검토 범위 기본값 문제, CTA 문구 모호성을 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/marketplace-request-prefill.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s 'http://localhost:3100/requests/clearance?...'` -> `/login` 307 redirect
- `curl -I -s 'http://localhost:3100/requests/freight?...'` -> `/login` 307 redirect

### 요청 초안의 조회 출처 표시

- 이전 작업은 HS/품명 조회 결과에서 요청 초안으로 이동하는 CTA와 query prefill을 붙인 P5.1이고, 이번 작업은 요청 초안 화면에서 그 값이 어디서 왔고 어떤 의미인지 헷갈리지 않게 표시하는 P5.2다.
- `MarketplacePrefillSourcePanel`을 추가해 운송 견적 초안과 통관 의뢰 초안 상단에 HS 조회 출처 패널을 표시한다.
- 패널은 중복과 과밀을 줄이기 위해 조회 품명, 예비 HSK/HS6, 조회 기준일만 표시한다.
- 통관 의뢰에서는 원산지·수출국·선적국이 같은 값이라고 오해하지 않도록 `FTA 판단을 위해 원산지·수출국·선적국은 별도 확인이 필요합니다.` 문구를 추가했다.
- 패널 문구를 HS FINDER 법적 안전 문구에 맞춰 `예비진단 참고값이며, HSK 확정 및 법령·요건 적용 여부는 담당자 검토가 필요합니다.`로 정리했다.
- UX/UI 리뷰어가 지적한 국가 역할 혼동, 정보 과밀, 파란 패널 중첩 문제를 반영해 중립색/compact strip으로 바꿨다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/marketplace-request-prefill.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s 'http://localhost:3100/requests/clearance?...'` -> `/login` 307 redirect

### 운영자 검증·차단 화면

- 이전 작업은 조회 결과에서 요청 초안으로 이어지는 P5 레일이고, 이번 작업은 대표/운영자가 marketplace 업체 상태를 직접 관리하는 P6.1 운영 레일이다.
- `/operations/users`에 `업체 운영 관리` 패널을 추가했다.
  - 전체, 활성, 숨김/정지, 차단 업체 수를 요약한다.
  - 회사명, 사업자번호, 국가, 신뢰 점수, 가입일, marketplace 역할을 한 카드에서 확인한다.
  - 상태 기준을 상단에 고정해 `운영자 승인·추천 파트너`, `숨김/정지`, `차단`, `미검증`의 효과를 바로 볼 수 있게 했다.
- developer 전용 server action `updateCompanyOperationsStatusAction`을 추가했다.
  - 상태는 `operator_approved`, `recommended_partner`, `suspended`, `blocked`, `unverified`만 허용한다.
  - `suspended`와 `blocked`는 기존 marketplace rule의 `is_company_active_for_marketplace` 기준으로 요청 노출과 입찰에서 제외된다.
- 보안 리뷰어 지적을 반영해 회사 상태 변경과 audit log 삽입을 `update_company_marketplace_status` service-role RPC로 묶었다.
  - 회사 row를 `for update`로 잠근 뒤 상태를 바꾸고 같은 트랜잭션에서 `audit_logs`를 기록한다.
  - audit `after_json`에는 변경 후 `verificationStatus`, `trustScore`, `suspendedAt`, `blockedAt`, `verifiedAt`, `verifiedBy`, `note`를 남긴다.
  - 정지/차단/미검증으로 내려갈 때 stale `verified_at`, `verified_by`, 반대 timestamp, 과도한 trust score를 정리한다.
- UX 슬롯 제한으로 별도 UX 리뷰어는 못 붙였고, 자체 점검으로 상태 효과 설명과 상태 기준 안내를 추가했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/company-verification/schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/operations/users` -> `/login` 307 redirect

### 운영 화면 단순화

- 이전 작업은 업체 운영 상태 변경 기능과 audit RPC를 만든 P6.1이고, 이번 작업은 같은 운영 화면을 대표/운영자가 더 적은 정보로 판단하게 정리한 P6.2다.
- 업체 운영 관리 패널의 기본 목록을 `먼저 볼 업체`로 바꿨다.
  - 서류 제출, 이메일 인증, 미검증, 숨김/정지, 차단 업체를 먼저 보게 한다.
  - 운영자 승인/추천 파트너는 `활성` 필터에서 따로 확인한다.
- 상태 필터를 추가했다.
  - `먼저 볼 업체`, `전체`, `활성`, `숨김/정지`, `차단`
- 상태 변경 폼은 기본 화면에서 접어두고, 필요한 업체만 `상태 변경`을 펼쳐 조작하게 했다.
- 상단 상태 기준 안내를 추가해 각 상태가 요청 공개/입찰 참여에 어떤 영향을 주는지 바로 확인하게 했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/operations/users` -> `/login` 307 redirect

### 역할별 대시보드 진입 정리

- 이전 작업은 운영자가 업체를 관리하는 P6 레일이고, 이번 작업은 로그인한 사용자가 바로 플랫폼 핵심 행동으로 이동하게 하는 P7.1 대시보드 레일이다.
- `/dashboard`에 `플랫폼 업무 시작` 섹션을 추가했다.
  - `운송 견적 요청`
  - `통관 의뢰 요청`
  - `포워더 입찰 확인`
  - `관세사 입찰 확인`
- 기존 HS 직접 조회, 해외 HS, 일괄조회, 납세액, 화물추적, 중고차수출, 무역뉴스 링크는 제거하지 않고 그대로 유지했다.
- 대시보드에서 회사명, 회사 권한, 검증 상태, 신뢰 점수, marketplace 역할을 함께 표시한다.
- 회사 검증/역할 데이터가 없는 환경에서는 `역할 미설정`, `회사 검증 데이터 준비 필요` 안내를 표시한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/dashboard` -> `/login` 307 redirect

### 대시보드 요청 현황 요약

- 이전 작업은 대시보드에 역할별 진입 버튼을 추가한 P7.1이고, 이번 작업은 실제 요청/입찰 상태 숫자를 같은 영역에 붙인 P7.2다.
- `/dashboard`에서 현재 회사 기준 marketplace 활동 요약을 조회한다.
  - 임시저장 요청
  - 진행중 요청
  - 견적 도착
  - 입찰 가능
- 요청 현황은 현재 회사의 `service_requests`와 `service_request_partner_matches`를 기준으로 계산한다.
- schema 미적용 또는 RLS 조회 실패 시 0건으로 안전하게 표시하고 기존 대시보드 렌더링은 유지한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/dashboard` -> `/login` 307 redirect

### 회사 설정에서 플랫폼 역할 관리 정리

- 이전 작업은 대시보드에서 역할별 진입과 현황을 보여준 P7 레일이고, 이번 작업은 회사 설정에서 검증·역할·관심조건을 한 흐름으로 묶은 P8.1이다.
- `/settings/members` 상단에 `플랫폼 참여 상태` 패널을 추가했다.
  - 회사 검증 상태와 신뢰 점수
  - 현재 플랫폼 역할
  - 파트너 관심 조건 저장 개수
  - 다음 작업 안내
- 기존 회사 검증 증빙 제출, 제출 이력, 파트너 관심 조건 설정 기능은 제거하지 않고 아래에 유지했다.
- 회사 관리자 여부, 검증 상태, 파트너 조건 미저장 여부에 따라 다음 작업 문구가 달라진다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/settings/members` -> `/login` 307 redirect

### P4.1 알림 정책 skeleton

- 이전 작업은 통관 의뢰 공개와 관세사무소 견적 제출을 만드는 P3.2이고, 이번 작업은 요청 노출과 별개로 알림 피로도를 제어하는 정책 계산층 P4.1이다.
- `marketplace-notification-policy`를 추가했다.
  - `buildInitialMarketplaceNotificationTargets`: 공개된 요청에 매칭된 파트너 중 1회 최초 알림 대상 계산
  - `buildMarketplaceDeadlineReminderTargets`: 마감 전 아직 활성 견적이 없는 파트너 리마인드 대상 계산
- 알림 대상에서 제외하는 조건을 명확히 했다.
  - 알림 비활성
  - digest 사용
  - 이미 발송됨 또는 실패 상태
  - declined 관심 상태
  - 닫힌 요청 또는 마감 지난 요청
  - 이미 draft/submitted/shortlisted/selected 상태의 활성 견적이 있는 파트너
- 알림 정책 리뷰어 지적사항을 반영했다.
  - 알림 종류별 기존 발송 상태(`deliveredNotificationKinds`)를 입력으로 받아 deadline reminder 반복 발송을 막도록 했다.
  - digest 사용 파트너를 단순 제외하지 않고 `buildMarketplaceDigestTargets`로 별도 digest 대상 그룹을 만들도록 했다.
  - 마감 전 리마인드는 `viewed/interested` 파트너로 제한해 never-engaged 파트너에게 추가 알림이 가지 않게 했다.
  - 중복 join row가 들어와도 match/kind 기준으로 한 번만 target을 만들도록 했다.
  - draft bid는 제출된 견적이 아니므로 deadline reminder를 막지 않게 했다.
  - reminder window는 0~48시간 범위 밖이면 오류로 처리한다.
- 아직 실제 이메일/인앱 발송은 연결하지 않았다.
  - 이번 rail은 정책 계산 skeleton이고, 실제 발송/claim/중복 방지는 다음 알림 worker 단계로 분리한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/notifications/marketplace-notification-policy.test.ts`
- `npx eslint server/notifications/marketplace-notification-policy.ts server/notifications/marketplace-notification-policy.test.ts`
- 리뷰 반영 후 위 3개 재실행
- `npm run lint`
- `npm test`
- `npm run build`

### P4.4 알림 worker skeleton

- 이전 작업은 DB/RPC claim 경계 P4.3이고, 이번 작업은 알림 target 계산 결과를 실제 claim RPC까지 연결하는 worker skeleton P4.4다.
- `marketplace-notification-worker.service`를 추가했다.
  - `service_request_partner_matches`와 연결된 요청을 조회
  - 기존 bid와 delivery 이력을 함께 조회
  - P4.1 policy로 최초 알림과 마감 전 리마인드 target 계산
  - `dryRun`이면 target 수만 반환하고 claim하지 않음
  - 실제 실행이면 `claimMarketplaceNotificationDelivery`를 통해 DB claim RPC 호출
- `/api/jobs/marketplace-notifications` route를 추가했다.
  - `JOB_WORKER_SECRET` 또는 `CRON_SECRET` 인증 방식 사용
  - `dryRun`, `limit`, `reminderWindowHours` query 지원
  - service role env가 없으면 명시적 500 환경 오류 반환
- 아직 이메일/인앱 실제 발송은 연결하지 않았다.
  - 현재 단계는 target 계산과 claim까지만 검증한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/jobs/marketplace-notification-worker.service.test.ts server/repositories/marketplace-notification-deliveries.repository.test.ts server/notifications/marketplace-notification-policy.test.ts`
- `npx eslint server/jobs/marketplace-notification-worker.service.ts server/jobs/marketplace-notification-worker.service.test.ts app/api/jobs/marketplace-notifications/route.ts`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s 'http://localhost:3100/api/jobs/marketplace-notifications?dryRun=true'`
- `curl -s 'http://localhost:3100/api/jobs/marketplace-notifications?dryRun=true'`

### P4.3 알림 claim RPC 원천 검증

- 이전 작업은 delivery 저장소와 repository claim을 만든 P4.2이고, 이번 작업은 DB가 match/request/partner 상태를 직접 확인한 뒤 delivery를 claim하게 만드는 P4.3이다.
- `claim_marketplace_notification_delivery` RPC를 marketplace migration에 추가했다.
  - service_role만 실행 가능
  - `match_id` 기준으로 `service_request_partner_matches`와 `service_requests`를 잠금 조회
  - 요청 상태가 `open/bids_received`이고 deadline이 남아 있어야 claim 가능
  - declined 파트너는 claim 불가
  - 파트너가 검증되고 활성 상태여야 claim 가능
  - 최초 알림은 `notification_status = pending`일 때만 가능
  - deadline reminder는 `viewed/interested` 상태일 때만 가능
  - digest는 partner/window 기준 delivery key 사용
  - metadata는 requestType/requestCount/matchCount/templateId로 정제
- repository는 match id가 있는 claim은 직접 insert하지 않고 RPC를 호출하도록 변경했다.
- sent/failed 전이 검증은 P4.2 repository guard를 유지한다.
- digest처럼 match id 없이 묶이는 fallback은 남겨두었고, 실제 worker 단계에서 digest claim 모델을 더 좁힐 예정이다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/repositories/marketplace-notification-deliveries.repository.test.ts server/repositories/platform-marketplace-governance.test.ts server/notifications/marketplace-notification-policy.test.ts`
- `supabase db lint --local --fail-on error`
- `npx eslint server/repositories/marketplace-notification-deliveries.repository.ts server/repositories/marketplace-notification-deliveries.repository.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`

### P4.2 알림 delivery claim 저장소

- 이전 작업은 알림 대상 계산 정책 P4.1이고, 이번 작업은 계산된 알림을 실제 발송 전에 중복 claim하고 sent/failed 상태를 기록하는 저장 계층 P4.2다.
- `marketplace_notification_deliveries` 테이블을 플랫폼 marketplace migration에 추가했다.
  - `delivery_key` unique로 `match + notification_kind + delivery_window` 중복 claim 차단
  - `notification_kind`: initial, deadline_reminder, digest
  - `status`: claimed, sent, skipped, failed
  - channel, provider id, delivery window, reason, 최소 metadata 저장
- RLS/권한을 추가했다.
  - staff/admin은 delivery 이력 조회만 가능
  - service_role만 delivery insert/update 가능
  - 일반 authenticated 사용자는 직접 delivery 상태를 만들거나 바꿀 수 없음
- `marketplace-notification-deliveries.repository`를 추가했다.
  - `createMarketplaceNotificationDeliveryKey`
  - `claimMarketplaceNotificationDelivery`
  - `markMarketplaceNotificationDeliverySent`
  - `markMarketplaceNotificationDeliveryFailed`
- 실제 이메일/인앱 발송 worker는 아직 연결하지 않았다.
  - 다음 단계에서 P4.1 target과 P4.2 claim 저장소를 worker로 연결한다.
- 보안 리뷰어 지적사항을 반영했다.
  - digest delivery key를 partner/window 기준으로 정규화했다.
  - metadata는 `requestType`, `requestCount`, `matchCount`, `templateId`만 저장하도록 allowlist 처리했다.
  - provider 오류 원문을 저장하지 않고 `provider_timeout`, `provider_rate_limited`, `provider_auth_error`, `provider_send_failed` 같은 범주만 저장한다.
  - sent/failed 전이는 `.select("id").single()`로 실제 row 전이가 없으면 오류를 내도록 했다.
  - retryable provider failure를 `retryable_failed`로 구분하고 attempt/retry 컬럼을 추가했다.
  - DB가 `match_id`, `request_id`, `partner_company_id` 정합성을 직접 검증하는 claim RPC는 P4.3으로 분리했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/repositories/marketplace-notification-deliveries.repository.test.ts server/repositories/platform-marketplace-governance.test.ts server/notifications/marketplace-notification-policy.test.ts`
- `supabase db lint --local --fail-on error`
- 보안 리뷰 반영 후 위 3개 재실행
- `npm run lint`
- `npm test`
- `npm run build`

### P3.2 관세사무소 견적 제출

- 이전 작업은 화주가 통관 의뢰 초안을 만드는 P3.1이고, 이번 작업은 그 요청을 관세사무소에 공개하고 관세사무소가 예비 통관 견적을 제출하는 P3.2다.
- `clearanceRequestPublishSchema`, `clearanceBidSubmitSchema`를 추가했다.
  - 공개 마감은 1~48시간으로 제한
  - 통관 견적은 통화, 총액, 통관 수수료, 유효기한, 리드타임, 예상 통관일수, 추가 요청 서류, 리스크 메모를 검증
- `publish_clearance_request` RPC를 추가했다.
  - 통관 의뢰 draft만 공개 가능
  - 목적국 필수
  - 검증되고 활성 상태인 관세사무소만 관심 조건에 따라 매칭
  - 요청자도 운영자 승인 상태여야 공개 가능
  - 공개 audit log 기록
- `submit_clearance_bid` RPC를 추가했다.
  - 매칭된 검증 관세사무소만 견적 제출 가능
  - 마감 전 `open/bids_received` 요청만 허용
  - 중복 활성 견적 제출 차단
  - 견적 제출 시 요청 상태를 `bids_received`로 전환
  - 추가 요청 서류는 JSON 배열로만 저장
  - 견적 제출 audit log 기록
- `/requests/clearance` UI를 P2.7 운송 요청 화면과 같은 workspace 구조로 정리했다.
  - `내 요청 관리`: 초안 작성, 공개, 견적 비교, 관세사무소 선정
  - `관세사 입찰`: 공개 요청 확인, 예비 견적 제출
  - 상단 상태 요약: 초안, 공개중, 견적 도착, 선정 완료, 입찰 가능
  - 공개 전 확인 패널: 공개 대상, 공개 정보, 비공개 정보
  - 관세사 견적 문구는 `예비 통관 견적`, `HS/FTA/요건 예비 검토 가능`으로 정리
- 보안 리뷰어 지적사항을 반영했다.
  - 선정 이후 비선정 매칭 파트너의 request/detail read를 차단했다.
  - `matched_partner_after_interest` 문서 공개는 `open/bids_received` 상태로 제한했다.
  - 선정 이후 문서는 selected bid 회사만 읽을 수 있게 유지했다.
  - staff/admin도 정지·차단 요청자의 공개를 우회할 수 없게 했다.
  - 미검증 요청자는 통관/운송 요청 공개를 할 수 없게 했다.
- UX/UI 리뷰어 지적사항을 반영했다.
  - 화주 작업과 관세사 작업을 분리
  - draft -> publish -> bid 흐름을 상태 요약과 다음 작업으로 표시
  - 공개 액션에 privacy checkpoint 추가
  - 요건 미검토와 예비 검토 문구를 법적 확정처럼 보이지 않게 수정
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/clearance`를 확인했고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/clearance-bid-schemas.test.ts features/service-requests/clearance-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/requests/clearance`

### P3.1 통관 의뢰 draft 생성

- 이전 작업은 운송 요청 UX/UI 정리이고, 이번 작업은 같은 공통 요청 모델을 통관 의뢰 업무로 확장한 것이다.
- `clearance_request_details`와 `create_clearance_request_draft` RPC를 추가해 화주가 수입/수출 통관 의뢰 초안을 저장할 수 있게 했다.
- 통관 초안에는 HSK 10자리, HS6, HS CODE 보유 여부, FTA 적용 희망, 요건 확인 필요 여부, 예상 신고 건수, 원산지/수출국/선적국/목적국, 모델명, 재질/성분, 용도, 일정 정보를 저장한다.
- `/requests/clearance` 페이지와 `ClearanceRequestDraftPanel`을 추가했다.
  - 기본 정보, 품목 및 HS 정보, 국가·원산지·FTA 정보, 일정 및 물류 정보, 검토 요청 범위로 입력을 분리했다.
  - HS, FTA, 요건 및 인허가 적용 여부는 예비진단이며 담당자 검토가 필요하다는 문구를 상단에 고정했다.
  - FTA는 선적국만으로 판단하지 않고 원산지, 수출국, 직접운송, 증빙 검토가 필요하다는 안내를 추가했다.
  - 저장된 초안 카드에 `초안 작성 -> 서류 첨부 -> 검토 항목 확인 -> 관세사무소 공개` 다음 단계를 표시했다.
- 보안 리뷰어 지적사항을 반영했다.
  - 매칭 파트너와 입찰자는 숨김/취소/초안 요청을 읽을 수 없도록 `can_read_service_request`의 상태 조건을 좁혔다.
  - 요청과 통관 detail 조회에 필요한 select grant를 명시하고, 요청 document metadata insert/delete grant를 추가했다.
  - 정지 또는 차단된 회사는 운송/통관 요청 draft를 만들 수 없게 했다.
  - 통관 detail RLS를 `request_type = clearance`와 `status = draft`에 묶었다.
- UX/UI 리뷰어 지적사항을 반영했다.
  - 통관 화면의 국가/FTA 구분, 예비진단 문구, 요건 검토 미요청 표현, 저장 후 다음 행동, 입력 그룹 구조를 보강했다.
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/clearance`를 확인했고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/clearance-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/requests/clearance`

### P2.7 운송 요청 UX/UI 정리

- 이전 작업은 요청 질문·답변 기능을 추가한 P2.6이고, 이번 작업은 기능 추가가 아니라 UX/UI 리뷰어가 지적한 `/requests/freight` 화면 흐름을 정리한 P2.7이다.
- UX/UI 리뷰어를 신규 작업 기준으로 도입했다.
  - 보안 리뷰어와 별개로 사용자 역할, 정보 위계, 버튼 문구, 모바일 사용성, 업무 흐름을 리뷰한다.
- `/requests/freight`를 역할별 workspace로 분리했다.
  - `내 요청 관리`: 초안 작성, 서류 첨부, 포워더 공개, 질문 답변, 견적 비교, 포워더 선정
  - `입찰 가능 요청`: 매칭 요청 확인, 질문 등록, 운송 견적 제출
- 내 요청 카드에 진행 단계 표시를 추가했다.
  - 초안 → 서류 → 공개 → 질문 → 견적 → 선정
  - 다음 작업 안내 문구 표시
  - 미답변 질문 badge 표시
- 공개 필수 조건을 draft form 안에서 별도 그룹으로 분리했다.
  - 출발 국가
  - 도착 국가
  - 운송 방식
- `모집 공개` 버튼 문구를 `포워더에게 견적 요청 공개`로 바꿨고, 마감 select에 `견적 접수 마감` label을 붙였다.
- 문서 공개 범위 문구를 더 명확하게 바꿨다.
  - `나와 운영자만`
  - `매칭된 포워더에게 공개`
  - `선정된 포워더에게만 공개`
  - `운영자만`
- 질문 섹션을 받은 견적보다 먼저 배치하고, 질문/견적이 없어도 빈 상태 안내가 보이도록 했다.
- `이 견적 선택` 버튼 문구를 `이 포워더 선정`으로 변경했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx eslint features/service-requests/freight-request-draft-panel.tsx app/'(app)'/requests/freight/page.tsx`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/requests/freight`

### P2.6 요청 질문·답변

- 이전 작업은 요청 서류를 private bucket에 첨부하고 공개 범위를 제어하는 P2.5이고, 이번 작업은 포워더가 운송 요청에 질문하고 화주가 답변하는 협의 흐름 P2.6이다.
- `ask_service_request_question` RPC를 추가했다.
  - 매칭되고 입찰 가능한 파트너만 질문 가능
  - 질문 길이 제한과 공백 검증
  - 직접 insert 정책 제거 후 RPC-only mutation으로 변경
  - 질문 등록 audit log 기록
- `answer_service_request_question` RPC를 보강했다.
  - 요청 소유 회사만 답변 가능
  - 이미 답변된 질문은 덮어쓰기 불가
  - `open/bids_received` 상태와 마감 전 요청만 답변 가능
  - defensive update로 `answered_at is null` 조건을 재확인
- `/requests/freight`에 질문·답변 UI를 연결했다.
  - 입찰 가능 요청 카드에서 파트너가 질문 등록
  - 내 요청 카드에서 질문 목록과 미답변 질문 답변 등록
- `listOwnFreightRequests`가 RLS visible request 전체가 아니라 `requester_company_id = current_company_id()`인 요청만 가져오도록 명시 필터링했다.
- 보안 리뷰어가 지적한 답변 overwrite/종료 요청 답변/요청자 목록 혼선 문제를 반영했다.
- UX/UI 리뷰어를 새로 도입했고, 이번 `/requests/freight` 페이지 리뷰를 별도 P2.7 작업으로 받도록 등록했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/freight-request-question-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/requests/freight`

### P2.5 요청 서류 첨부·공개 범위

- 이전 작업은 화주가 받은 견적을 비교하고 하나를 선택하는 P2.4이고, 이번 작업은 운송 견적 요청에 CI/PL/B/L 등 private 서류를 첨부하고 공개 범위를 제어하는 P2.5다.
- `service_request_documents`를 `/requests/freight`에 연결했다.
  - 내 요청별 첨부 서류 목록 표시
  - 서류 유형, 파일명, 용량, 생성일, 공개 범위 표시
  - 요청별 파일 업로드 form 추가
- `uploadFreightRequestDocumentAction`과 repository helper를 추가했다.
  - `service-request-documents` private bucket 사용
  - storage path는 `{company_id}/{request_id}/{uuid}-{sanitized_file_name}`
  - SHA-256 checksum 계산
  - 업로드 실패 시 storage object와 metadata cleanup 시도
  - audit log에는 문서 유형, 파일명, request id, bucket만 남기고 원문 경로나 signed URL은 남기지 않는다.
- 공개 범위는 `화주만`, `관심 표시 파트너`, `선정 파트너`, `운영자만`으로 제한했다.
- 보안 리뷰어 지적사항을 반영했다.
  - `matched_partner_after_interest`는 `viewed`가 아니라 `interested` 상태 파트너에게만 공개
  - MIME이 비어 있어도 허용 확장자가 아니면 업로드 거부
  - request document metadata 직접 update/delete 정책 제거
  - storage upload 정책을 metadata row와 request status에 묶음
  - 업로드 가능 요청 상태를 `draft/open/bids_received/partner_selected`로 제한
- `freight-request-document-schemas` test와 `freight-requests.repository` helper test를 추가했다.
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/freight`를 확인했고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/freight-request-document-schemas.test.ts features/service-requests/freight-bid-schemas.test.ts server/repositories/freight-requests.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/requests/freight`

### P2.4 화주 견적 비교·선택

- 이전 작업은 포워더가 매칭된 운송 요청에 견적을 제출하는 P2.3이고, 이번 작업은 화주가 받은 견적을 비교하고 하나를 선택하는 P2.4 거래 전환 단계다.
- `/requests/freight`에서 내 운송 요청별 받은 견적을 조회해 총액, 운임, 로컬 비용, 부대비용, 유효기한, 리드타임, 운송일수, 메모를 표시하도록 연결했다.
- `selectFreightBidAction`과 `selectFreightBid` repository를 추가해 기존 `select_service_bid` RPC를 화면에서 호출할 수 있게 했다.
- `select_service_bid` RPC를 보강했다.
  - 요청 row와 bid row를 잠그고 요청자 회사만 선택 가능하게 유지
  - 요청 상태가 `open`, `bids_received`일 때만 선택 가능
  - 선택한 견적은 `selected`, 나머지 제출/검토중 견적은 `rejected`, 요청은 `partner_selected`로 전환
  - 정지/차단된 요청자는 견적 선택 불가
  - 선택 audit log 기록
- 보안 리뷰어가 지적한 숨김 견적 노출 문제를 반영했다.
  - `can_read_service_bid`에서 `hidden` bid는 staff/admin만 읽을 수 있게 제한
  - 받은 견적 조회 repository에서도 `hidden` 상태를 제외
- `freightBidSelectSchema`와 governance test를 추가해 선택 입력값과 RPC 상태전이/권한 조건을 회귀 검증한다.
- UI 작업이므로 로컬 서버 `http://localhost:3100/requests/freight`를 확인했고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/service-requests/freight-bid-schemas.test.ts features/service-requests/freight-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm run lint`
- `npm test`
- `npm run build`
- `curl -I -s http://localhost:3100/requests/freight`

### 파트너 관심 조건 설정

- 이전 작업은 운영자가 회사 검증 증빙을 승인/반려하는 큐이고, 이번 작업은 포워더·관세사무소가 어떤 요청을 받고 싶은지 저장하는 P1.3 조건 설정이다.
- `partner_service_preferences`를 앱에서 읽고 저장하는 repository와 server action을 추가했다.
- `/settings/members`에 `PartnerPreferencesPanel`을 추가했다.
  - 포워더는 운송 견적 관심 조건을 설정
  - 관세사무소는 통관 의뢰 관심 조건을 설정
  - 수입/수출 방향, 국가 코드, 운송 방식, 항구·공항·지역, 화물 태그, 긴급 대응, 알림/digest 설정 저장
- 회사 관리자만 저장 가능하고, 회사 역할이 `forwarder` 또는 `customs_broker`인 경우에만 해당 서비스 조건이 표시된다.
- RLS도 회사 admin 여부만 보지 않고, `freight`는 `forwarder`, `clearance`는 `customs_broker` 역할을 가진 회사만 관리할 수 있게 좁혔다.
- `partner-preferences` schema test와 marketplace governance test를 추가해 방향 필수값과 partner role 제한을 회귀 검증한다.
- UI 작업이므로 로컬 서버 `http://localhost:3100/settings/members`를 브라우저로 열었고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- `ROADMAP`에서 P1.1, P1.2, P1.3을 완료로 갱신했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run features/partner-preferences/schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`
- `supabase db lint --local --fail-on error`

### 회사 검증 운영 검토 큐 연결

- 이전 작업은 회사 검증 업로드 경로의 보안/RLS 문제를 막은 것이고, 이번 작업은 운영자가 제출된 증빙을 실제로 검토할 수 있게 `/operations/users`에 큐를 연결한 것이다.
- `company-verification-review.repository`를 추가해 service-role로 최근 회사 검증 증빙 50건을 불러오고, private bucket 원문은 10분 signed URL로만 제공한다.
- `/operations/users`에서 사용자 목록과 회사 검증 증빙 큐를 병렬 로드하도록 바꿨다.
- `CompanyVerificationReviewPanel`을 추가했다.
  - 제출 대기 건수 표시
  - 회사명, 사업자번호, 검증 상태, 신뢰 점수, 파일 정보, checksum 표시
  - 원문 열람 링크는 signed URL만 사용
  - 승인/반려 버튼은 기존 developer-only server action과 연결
- migration 미적용 환경에서는 운영 큐도 schema 미적용 안내를 표시한다.
- UI 작업이므로 로컬 서버 `http://localhost:3100/operations/users`를 브라우저로 열었고, 비로그인 상태에서는 `/login` 307 redirect가 유지됨을 확인했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts server/repositories/company-verification.repository.test.ts features/company-verification/schemas.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`
- `supabase db lint --local --fail-on error`

### 플랫폼 역할 신청 UX

- 이전 작업은 회사 설정에서 현재 검증·역할·관심조건을 요약한 P8.1이고, 이번 작업은 회사 관리자가 필요한 플랫폼 역할을 직접 신청하는 P8.2다.
- `/settings/members`에 `CompanyRoleRequestPanel`을 추가했다.
  - 국내 수출입 화주, 해외 수출입 파트너, 포워더, 관세사무소, 기타 실무 파트너 역할 신청
  - 신청 사유 입력
  - 최근 신청 이력과 검토 대기/승인/반려/취소 상태 표시
  - 신청만으로 입찰·요청 권한이 바로 부여되지 않는다는 안내 문구 표시
- `company_party_type_requests` 테이블과 RLS를 추가했다.
  - 회사 admin은 자기 회사 요청만 읽고 제출 가능
  - staff/admin만 검토 상태를 업데이트 가능
  - insert RLS에서 `status = submitted`, `review_note/reviewed_by/reviewed_at is null`을 강제해 사용자가 `approved` 요청을 위조하지 못하게 했다.
- 기존 `companies.business_types` 백필에서 포워더/관세사무소를 실권한 `company_party_types`로 자동 부여하지 않도록 막았다. 기존 사업자 유형은 역할 신청·운영자 검토 흐름과 분리한다.
- 역할 신청 접수 시 `company_party_type_request_submitted` audit log를 남긴다.
- 보안 리뷰어가 지적한 High 항목 2건을 반영했다.
  - 사용자의 직접 insert로 승인 상태를 위조할 수 있던 RLS 누락 수정
  - self-declared business type이 바로 포워더/관세사 입찰 권한이 되는 백필 제거
- UI 자체 점검 결과, 문구는 `신청`과 `권한 부여`를 분리해 표현하고 모바일에서는 역할 카드가 1열로 접히도록 유지했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/company-verification/company-role-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100/settings/members` 열기
- 비로그인 상태 `/settings/members` 요청 시 `/login` 307 redirect 확인

### 운영자 역할 신청 검토 큐

- 이전 작업은 회사 관리자가 플랫폼 역할을 신청하는 P8.2이고, 이번 작업은 운영자가 그 신청을 승인·반려해 실제 `company_party_types`에 반영하는 P8.3이다.
- `/operations/users` 상단에 `CompanyRoleRequestReviewPanel`을 추가했다.
  - 검토 대기/전체/승인/반려 필터
  - 회사명, 사업자번호, 회사 검증 상태, 신청자, 신청 역할, 신청 사유 표시
  - 승인 및 역할 반영, 반려 버튼 제공
- `review_company_party_type_request` RPC를 추가했다.
  - service-role 외 직접 실행 차단
  - `p_actor_id`가 실제 developer 프로필인지 DB 내부에서 검증
  - 신청 row와 회사 row를 `for update`로 잠그고 처리
  - 승인 시 `company_party_types`에 역할 추가, 중복은 `on conflict do nothing`
  - 정지/차단 회사 승인 차단
  - 포워더/관세사무소 역할은 회사 검증 상태가 `operator_approved`, `recommended_partner`, `trade_history` 중 하나일 때만 승인
  - 신청 상태 변경과 audit log를 같은 RPC에서 처리
- 직접 RLS 관리 정책을 기존 broad staff 기준에서 developer 기준으로 좁혔다. 일반 회사 admin은 신청 제출만 가능하고 실제 역할 부여는 RPC 검토 흐름으로만 처리된다.
- 보안 리뷰어 지적을 반영했다.
  - RPC가 service-role뿐 아니라 실제 검토자 권한을 확인하도록 보강
  - 승인 대상 회사의 정지/차단 및 검증 상태를 DB 경계에서 확인
  - 직접 `company_party_types` 관리 RLS를 developer 기준으로 축소
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/company-verification/company-role-request-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- 비로그인 상태 `/operations/users`, `/settings/members` 요청 시 `/login` 307 redirect 확인

### 운영 화면 정보 구조 정리

- 이전 작업은 운영자가 플랫폼 역할 신청을 승인·반려하는 P8.3 기능이고, 이번 작업은 운영 페이지가 너무 많은 정보를 한 번에 보여주는 문제를 줄이는 P8.4 UX 정리다.
- `/operations/users` 상단에 `OperationsUsersPriorityPanel`을 추가했다.
  - 역할 신청 대기
  - 회사 검증 증빙 대기
  - 먼저 볼 업체 상태
  - 사용자 상세 관리
  를 한 줄 요약으로 보여주고 각 섹션으로 이동할 수 있게 했다.
- 페이지 설명을 “먼저 처리할 큐 → 업체 상태 → 사용자 상세” 순서로 바꿨다.
- 사용자 상세 관리는 기본 접힘으로 내려서, 평소에는 권한 변경·삭제·테스트 로그인 같은 위험 작업이 바로 노출되지 않게 했다.
- 역할 신청, 검증 증빙, 업체 상태 섹션에 anchor를 추가해 상단 요약에서 바로 이동할 수 있게 했다.
- UI 자체 점검 결과, 운영자가 처음 봐야 하는 대기 건과 처리 순서가 상단에 분리되어 있고, 사용자 상세는 문의 대응 시에만 펼치는 구조로 정리됐다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### 해외 파트너 가입·검증 안내 정리

- 이전 작업은 운영자 내부 화면을 정리한 P8.4이고, 이번 작업은 해외 수출입 파트너가 가입·역할 신청 흐름에서 막히지 않게 하는 P9.1이다.
- 가입 업무 유형에 `해외 수출입 파트너`를 추가했다.
- 해외 수출입 파트너만 선택한 기업회원은 한국 사업자등록번호 없이 가입할 수 있게 했다.
  - auth schema에서 `foreign_shipper`만 선택한 경우 사업자등록번호 필수 검증을 제외
  - server action의 사업자등록 상태 확인도 국내 사업자 유형이 있을 때만 수행
  - `ensure_client_profile` RPC도 같은 기준으로 한국 사업자등록번호 필수 조건을 완화
- 국내 수입기업·수출기업·포워더·관세사무소를 함께 선택하면 기존처럼 한국 사업자등록번호 10자리를 요구한다.
- 가입 화면과 이메일 인증 후 가입정보 입력 화면에 해외 파트너의 한국 사업자등록번호 선택 입력 안내를 추가했다.
- 역할 신청 화면에 해외 파트너는 회사명, 국가, 담당자 정보, 거래 서류 등으로 운영자가 보류·승인 여부를 확인한다는 안내를 추가했다.
- 기존 가입 업무 유형에서 포워더/관세사무소를 선택해도 실제 `company_party_types` 권한이 자동 부여되지 않도록 `company-marketplace` 동기화를 수정했다. 포워더/관세사무소 권한은 역할 신청과 운영자 검토 큐를 통해서만 반영한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/auth/schemas.test.ts server/repositories/company-marketplace.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- `/login?mode=signup` 200 OK
- 비로그인 상태 `/auth/complete-signup` 요청 시 `/login?mode=signup` 307 redirect 확인

### 해외 파트너 요청 진입 CTA

- 이전 작업은 해외 파트너가 가입하고 검증 대기 상태를 이해하게 하는 P9.1이고, 이번 작업은 가입 후 대시보드에서 한국 운송·통관 연결 요청으로 바로 들어가게 하는 P9.2다.
- 대시보드 `플랫폼 업무 시작` 카드에서 `foreign_shipper` 역할이 있으면 해외 파트너용 CTA를 먼저 보여준다.
  - `한국 운송 연결 요청`
  - `한국 통관 연결 요청`
- 해외 파트너 CTA는 일반 국내 화주 문구가 아니라 한국으로 보내거나 한국에서 받을 화물, 한국 통관이 필요한 품목과 서류 범위를 정리하도록 설명한다.
- 해외 파트너는 한국 사업자등록번호 없이도 연결 요청을 시작할 수 있다는 안내를 회사 상태 줄에 추가했다.
- 기존 일반 화주, 포워더, 관세사 CTA는 유지하되 최대 4개 카드만 보여 화면 밀도를 유지했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/auth/schemas.test.ts server/repositories/company-marketplace.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/dashboard` 요청 시 `/login` 307 redirect 확인

### 해외 파트너 문구 다국어 준비

- 이전 작업은 대시보드에 해외 파트너용 CTA를 추가한 P9.2이고, 이번 작업은 그 문구를 컴포넌트 하드코딩에서 dashboard i18n dictionary로 분리한 P9.3이다.
- `lib/i18n/dashboard.ts`에 marketplace dictionary를 추가했다.
  - 해외 파트너 안내 문구
  - marketplace 상태 라벨
  - marketplace 역할 라벨
  - 해외 파트너용 한국 운송 연결/통관 연결 CTA 제목과 설명
- 한국어, 영어, 중국어 dictionary에 동일 키를 채웠다.
- `DashboardMarketplaceEntry`는 해외 파트너 CTA와 역할/상태 라벨을 dictionary에서 읽고, 알 수 없는 값만 기존 fallback 라벨을 사용한다.
- 영어 문구도 법적 확정 표현 없이 연결 요청과 준비 단계로 표현했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run lib/i18n/dashboard.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

### 요청 생성 페이지의 해외 파트너 prefill 정리

- 이전 작업은 해외 파트너 CTA 문구를 다국어 dictionary로 분리한 P9.3이고, 이번 작업은 그 CTA가 실제 요청 draft 페이지에 올바른 query를 전달하게 하는 P10.1이다.
- 해외 파트너 대시보드 CTA href를 draft parser가 읽는 정식 query 이름으로 바꿨다.
  - `destinationCountryCode=KR`
  - `direction=import`
- `marketplaceRequestPrefillFromSearchParams`가 `destinationCountry`, `originCountry` alias도 읽어 ISO2 코드로 정규화하도록 보강했다.
- 해외 파트너 CTA 또는 향후 다른 화면이 legacy query name을 보내도 draft form의 목적국/출발국 prefill이 비는 문제를 줄였다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/marketplace-request-prefill.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/requests/freight?direction=import&destinationCountryCode=KR`, `/requests/clearance?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 해외 파트너용 요청 초안 안내

- 이전 작업은 해외 파트너 CTA query가 draft 페이지에 올바르게 들어오도록 정규화한 P10.1이고, 이번 작업은 그 prefill 상태를 사용자가 이해하고 보완할 수 있게 draft 화면 안내를 추가한 P10.2다.
- `OverseasPartnerRequestHint`를 추가해 `direction=import`, `destinationCountryCode=KR`인 요청 초안에서만 해외 파트너용 안내를 표시한다.
- 운송 견적 초안에는 한국 도착 운송 연결 요청임을 설명하고 출발국, 출발지, 품목, 수량, 희망 일정, 보유 서류를 보완하도록 안내한다.
- 통관 의뢰 초안에는 한국 통관 연결 요청임을 설명하고 HS 코드가 없어도 품명·용도·재질·거래 서류로 초안을 만들 수 있음을 안내한다.
- 한국 사업자등록번호가 없어도 초안 작성은 가능하되, 업체 매칭·공개 범위는 회사 정보와 서류 검증 상태에 따라 제한될 수 있음을 명확히 표시했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/marketplace-request-prefill.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/requests/freight?direction=import&destinationCountryCode=KR`, `/requests/clearance?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 요청 초안 필수값·빈 상태 정리

- 이전 작업은 해외 파트너용 안내 문구를 draft 화면에 추가한 P10.2이고, 이번 작업은 운송/통관 초안 작성 중 실제로 비어 있는 값과 보완하면 좋은 값을 사용자에게 바로 보여주는 P10.3이다.
- `RequestDraftReadinessPanel`을 추가해 초안 저장 필수값과 공개 전 보완값을 한 패널에서 구분해 표시한다.
- 운송 견적 초안은 요청 제목·방향은 저장 필수로, 출발 국가·도착 국가·운송 방식은 포워더 공개 전 필수 보완값으로 표시한다.
- 통관 의뢰 초안은 요청 제목·통관 방향은 저장 필수로, 목적국·품목 요약·HS 정보·용도·원산지·신고 예정일 등을 관세사무소 공개 전 보완값으로 표시한다.
- 입력 변경 시 패널이 즉시 갱신되도록 폼 값을 읽어 상태에 반영한다.
- readiness 계산 로직을 순수 함수로 분리하고 단위 테스트를 추가했다.
- UX 자체 리뷰 결과, 저장 필수값과 공개 전 보완값을 분리해 “왜 저장은 되는데 공개가 막히는지”를 설명하는 데 도움이 되며, 모바일에서는 패널이 세로 흐름으로 접혀 기존 폼 구조를 크게 해치지 않는다.
- UX/UI 리뷰어 에이전트를 붙이려 했으나 현재 서브에이전트 도구가 모델 해석 오류로 생성되지 않아 자체 리뷰로 대체했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/request-draft-readiness.test.ts features/service-requests/marketplace-request-prefill.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/requests/freight?direction=import&destinationCountryCode=KR`, `/requests/clearance?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 통관 의뢰 서류 첨부 parity

- 이전 작업은 초안 작성 중 비어 있는 값과 보완값을 보여주는 P10.3이고, 이번 작업은 통관 의뢰에도 요청 서류를 private bucket에 첨부하고 관세사무소 공개 범위를 관리하는 P10.4다.
- `clearanceRequestDocumentUploadSchema`와 action state를 추가했다.
- `uploadClearanceRequestDocumentAction`을 추가해 통관 의뢰 서류 업로드, audit log, `/requests/clearance`/`/dashboard` revalidate를 연결했다.
- `uploadClearanceRequestDocument` repository를 추가했다.
  - 기존 공통 `service_request_documents`와 `service-request-documents` private bucket을 재사용
  - DB에서 `request_type = clearance`와 요청 상태를 다시 확인
  - 파일 형식, 10MB 제한, checksum, storage path 구조는 운송 요청과 동일하게 유지
  - storage upload 실패 시 object와 metadata cleanup을 수행
- `/requests/clearance`에서 내 통관 의뢰별 첨부 서류 목록과 업로드 폼을 표시한다.
- 매칭된 관세사무소 입찰 가능 카드에도 RLS로 읽을 수 있는 공개 서류 메타데이터를 표시한다.
- 새 migration은 만들지 않았다. 기존 공통 문서 테이블과 metadata-backed storage RLS를 재사용했고, Supabase local lint로 정책 오류 없음을 확인했다.
- 보안 자체 리뷰 결과, 직접 storage path만으로 읽는 경로가 아니라 `service_request_documents` metadata와 `can_read_service_request_document`를 통과해야 하며, repository에서도 통관 요청 타입을 재확인한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/clearance-request-document-schemas.test.ts server/repositories/freight-requests.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 비로그인 상태 `/requests/clearance?direction=import&destinationCountryCode=KR`, `/requests/freight?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 통관 견적 비교·선택

- 이전 작업은 통관 의뢰 서류를 첨부하고 관세사무소에 공개 서류 메타데이터를 보여주는 P10.4이고, 이번 작업은 제출된 통관 견적을 화주가 비교하고 하나를 선택하는 P10.5다.
- `clearanceBidSelectSchema`와 action state를 추가했다.
- `listReceivedClearanceBids` repository를 추가해 `bid_type = clearance`인 견적만 조회하고, `clearance_bid_details`의 통관 수수료, 예상 통관일수, 추가 요청 서류, 리스크 메모를 함께 묶어 반환한다.
- `selectClearanceBidAction`과 `selectClearanceBid` repository를 추가했다.
  - 기존 `select_service_bid` RPC를 재사용해 요청 소유권, 요청 상태, bid 상태, 선택/미선정 상태 전이를 DB에서 처리
  - RPC 호출 전 repository에서 `bid_type = clearance`를 재확인해 통관 선택 action으로 다른 서비스 bid를 선택하지 못하게 했다.
- `/requests/clearance`의 내 통관 의뢰 카드에 도착한 통관 견적 비교 영역을 추가했다.
  - 총액, 통관 수수료, 유효기한, 리드타임, 예상 통관일수, 추가 요청 서류, 리스크 메모, 관세사무소 선정 버튼 표시
  - 선정 시 다른 제출/검토중 견적은 DB RPC에 의해 미선정 처리된다.
- 보안 자체 리뷰 결과, 숨김 bid는 조회에서 제외하고, 선택은 RLS로 읽히는 bid 중 통관 bid만 RPC로 전달한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/clearance-bid-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 비로그인 상태 `/requests/clearance?direction=import&destinationCountryCode=KR`, `/requests/freight?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 통관 의뢰 질문·답변 parity

- 이전 작업은 화주가 통관 견적을 비교하고 관세사무소를 선택하는 P10.5이고, 이번 작업은 견적 제출 전 관세사무소가 질문하고 화주가 답변하는 P10.6 협의 흐름이다.
- `clearanceRequestQuestionAskSchema`, `clearanceRequestQuestionAnswerSchema`와 action state를 추가했다.
- `listClearanceRequestQuestions`, `askClearanceRequestQuestion`, `answerClearanceRequestQuestion` repository를 추가했다.
  - 기존 공통 `service_request_questions` 테이블과 RPC를 재사용
  - 질문 등록 전 `request_type = clearance`를 확인
  - 답변 전 question의 request가 통관 의뢰인지 재확인
- `askClearanceRequestQuestionAction`, `answerClearanceRequestQuestionAction`을 추가했다.
- `/requests/clearance`의 내 통관 의뢰 카드에 관세사무소 질문과 답변 폼을 표시한다.
- 관세사무소 입찰 가능 카드에도 질문·답변 이력과 질문 등록 폼을 표시한다.
- 진행 단계의 다음 작업 문구는 미답변 질문이 있으면 `관세사무소 질문 답변 필요`로 먼저 표시한다.
- 새 migration은 만들지 않았다. 기존 RPC/RLS를 재사용했고, Supabase local lint로 정책 오류 없음을 확인했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run features/service-requests/clearance-request-question-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 비로그인 상태 `/requests/clearance?direction=import&destinationCountryCode=KR`, `/requests/freight?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 플랫폼 요청 운영 통계 정리

- 이전 작업은 통관 의뢰 질문·답변 기능을 붙인 P10.6이고, 이번 작업은 대표/운영자가 플랫폼 요청 상태를 보고 바로 다음 개선 작업을 맡길 수 있게 하는 P10.7 운영 통계다.
- `platform-operations.repository`를 추가했다.
  - 요청 전체, 운송/통관 요청 수
  - 공개중/견적도착/선정완료 수
  - 미답변 질문
  - 공개됐지만 견적이 없는 요청
  - 3일 이상 방치된 초안
  - 마감 시간이 지난 공개 요청
  를 요약한다.
- 통계를 해석하지 않아도 바로 사용할 수 있는 `actionRequest` 문장을 생성한다.
- `/operations/users` 상단에 `PlatformRequestOperationsPanel`을 추가했다.
  - “플랫폼 요청 운영 상태” 카드
  - 병목 지표 카드
  - “다음에 바로 요청할 작업” 문장
- 새 migration은 만들지 않았다. 기존 staff/developer read 경계에서 요청, bid, question을 읽어 요약한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 비로그인 상태 `/operations/users`, `/requests/clearance?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 요청 업무 UI 밀도 정리

- 이전 작업은 대표/운영자가 플랫폼 요청 병목을 볼 수 있는 P10.7 운영 통계이고, 이번 작업은 운송/통관 요청 카드가 길어진 문제를 줄이는 P10.8 UI 정리다.
- 운송 요청 카드에서 서류 목록과 상태는 계속 보이게 두고, 서류 업로드 입력 폼은 `서류 추가하기` 접힘 영역으로 옮겼다.
- 통관 의뢰 카드도 서류 목록과 상태는 유지하고, 서류 업로드 입력 폼은 `서류 추가하기` 접힘 영역으로 옮겼다.
- 통관 의뢰 공개 설정 폼도 기본 접힘으로 내려, 요청 카드에서 먼저 보이는 정보가 진행 상태, 다음 작업, 서류/질문/견적 상태가 되도록 정리했다.
- UX 자체 리뷰 결과, 목록·상태·다음 작업은 유지하면서 반복 입력 폼만 접어 모바일과 데스크톱 모두에서 요청 카드 첫 화면의 정보 밀도가 낮아졌다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/requests/clearance?direction=import&destinationCountryCode=KR`, `/requests/freight?direction=import&destinationCountryCode=KR` 요청 시 `/login` 307 redirect 확인

### 요청 상세 페이지 분리

- 이전 작업은 운송/통관 요청 카드 안의 보조 입력 폼을 접어 목록 화면 밀도를 낮춘 P10.8이고, 이번 작업은 요청 목록과 요청별 상세 작업 공간을 분리하는 P11.1이다.
- `/requests/freight/[requestId]` 상세 route를 추가했다.
  - 해당 운송 요청 1건만 조회
  - 연결된 서류, 질문, 받은 견적을 함께 조회
  - 기존 검증된 운송 요청 작업 카드를 재사용
- `/requests/clearance/[requestId]` 상세 route를 추가했다.
  - 해당 통관 의뢰 1건만 조회
  - 연결된 서류, 질문, 받은 통관 견적을 함께 조회
  - 기존 검증된 통관 의뢰 작업 카드를 재사용
- 운송/통관 목록 카드에 `상세 작업` 링크를 추가했다.
- repository에 `getOwnFreightRequest`, `getOwnClearanceRequest`를 추가해 현재 회사의 요청만 상세 조회할 수 있게 했다.
- 상세 route도 비로그인 상태에서는 `/login`으로 redirect된다.
- 새 migration은 만들지 않았다. 기존 요청/서류/질문/bid RLS를 재사용한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts features/service-requests/clearance-bid-schemas.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 요청 상세 direct action anchor

- 이전 작업은 운송/통관 요청 상세 route를 만든 P11.1이고, 이번 작업은 상세 화면 안에서 바로 처리해야 할 위치로 이동하는 P11.2다.
- 운송 상세 화면에 `다음 작업 바로가기` 바를 추가했다.
  - 미답변 질문이 있으면 질문 섹션 우선
  - 견적이 있으면 견적 비교 우선
  - 서류가 없으면 서류 첨부 우선
- 통관 상세 화면에도 동일한 바로가기 바를 추가했다.
  - 미답변 질문, 견적 비교, 서류 첨부, draft 상태의 공개 설정을 상태에 따라 우선 안내
- 운송/통관 요청 카드 주요 섹션에 상세 전용 anchor id를 추가했다.
  - `request-documents`
  - `request-questions`
  - `request-bids`
  - 통관 draft 공개 설정: `request-publish`
- 목록 화면에서는 anchor id를 만들지 않도록 `anchorPrefix`를 상세 화면에서만 넘긴다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111#request-documents`, `/requests/clearance/11111111-1111-4111-8111-111111111111#request-questions` 요청 시 `/login` 307 redirect 확인

### 목록 화면 compact mode

- 이전 작업은 상세 화면 안에서 다음 작업 위치로 이동하는 P11.2이고, 이번 작업은 목록 화면 자체를 가볍게 만드는 P11.3이다.
- 운송 요청 목록에서는 공개 설정, 서류 첨부, 질문 답변, 견적 비교 블록을 숨기고 요청 요약과 `상세 작업` 링크를 우선 표시한다.
- 통관 요청 목록도 동일하게 목록에서는 서류/질문/견적 요약만 표시하고, 실제 첨부·답변·견적 비교·공개 설정은 상세 작업 페이지로 이동하도록 정리했다.
- 상세 페이지에서는 기존 작업 블록을 그대로 유지하고 `anchorPrefix`를 통해 바로가기 anchor만 상세 화면에서 활성화한다.
- 새 migration은 만들지 않았다. 기존 요청/서류/질문/bid RLS를 재사용한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`

### 파트너 기회 화면 작업 분리

- 이전 작업은 화주가 보는 내 요청 목록을 compact하게 만든 P11.3이고, 이번 작업은 포워더/관세사무소가 보는 입찰 가능 건도 목록과 상세 작업으로 분리하는 P11.4다.
- `/requests/freight/opportunities/[requestId]` 상세 route를 추가했다.
  - 현재 회사에 매칭된 공개 운송 요청만 조회
  - 공개 서류, 질문·답변, 운송 견적 제출 폼을 상세 화면에서 처리
- `/requests/clearance/opportunities/[requestId]` 상세 route를 추가했다.
  - 현재 회사에 매칭된 공개 통관 의뢰만 조회
  - 공개 서류, 질문·답변, 통관 견적 제출 폼을 상세 화면에서 처리
- 운송/통관 입찰 가능 목록은 공개 서류 수, 질문 수, `입찰 작업` 링크만 우선 표시하도록 compact mode를 적용했다.
- repository에 `getMatchedFreightOpportunity`, `getMatchedClearanceOpportunity`를 추가해 기존 match RLS를 그대로 사용한다.
- 운송 입찰 가능 목록도 통관과 동일하게 공개 서류/질문 수를 계산할 수 있도록 visible request id 조회 범위를 보강했다.
- 새 migration은 만들지 않았다. 기존 match/request/document/question/bid RLS를 재사용한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/freight` 요청 시 `/login` 307 redirect 확인

### 대시보드/운영 화면 상세 연결

- 이전 작업은 포워더/관세사무소 입찰 상세 route를 만든 P11.4이고, 이번 작업은 대시보드에서 해당 작업 공간으로 바로 진입하는 P11.5다.
- 운송 요청 화면은 `workspace=forwarder` 쿼리가 있으면 포워더 입찰 탭으로 바로 열린다.
- 통관 요청 화면은 `workspace=broker` 쿼리가 있으면 관세사 입찰 탭으로 바로 열린다.
- 대시보드의 `포워더 입찰 확인`, `관세사 입찰 확인` 카드가 각각 입찰 탭으로 직접 연결되도록 수정했다.
- 플랫폼 업무 시작 카드 하단에 내 운송 요청, 내 통관 의뢰, 운송 입찰 가능, 통관 입찰 가능 바로가기 링크를 추가했다.
- 새 migration은 만들지 않았다. 인증/권한은 기존 route middleware와 request page RLS를 그대로 사용한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight?workspace=forwarder`, `/requests/clearance?workspace=broker`, `/dashboard` 요청 시 `/login` 307 redirect 확인

### 운영 통계 액션 가이드 보강

- 이전 작업은 대시보드에서 요청/입찰 작업 공간으로 바로 들어가는 P11.5이고, 이번 작업은 운영 통계 숫자를 보고 무엇을 요청해야 하는지 알 수 있게 만든 P12.1이다.
- 플랫폼 요청 운영 summary에 `actionItems`를 추가했다.
  - 미답변 질문이 있으면 질문 확인 샘플을 우선 표시
  - 견적 도착 요청이 있으면 견적 비교 샘플을 표시
  - 공개됐지만 견적이 없는 요청이 있으면 매칭·알림 점검 샘플을 표시
  - 오래된 초안이나 마감 지난 공개 요청도 샘플로 표시
- 운영 패널에 `우선 확인 샘플` 블록을 추가해 요청 유형, 짧은 요청 ID, 확인 이유를 표시한다.
- 자체 리뷰에서 운영자 화면의 샘플이 고객 회사 소유 요청 상세 route로 직접 이동하면 RLS/소유권 경계와 충돌할 수 있음을 확인했다.
- 그래서 P12.1에서는 샘플을 운영 패널 anchor로 연결하고, staff-only 요청 상세 검토 화면은 P12.2로 분리했다.
- 새 migration은 만들지 않았다. 기존 운영 summary 조회 경계를 유지한다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/users#platform-request-operations` 요청 시 `/login` 307 redirect 확인

### 운영 샘플 상세 검토 화면

- 이전 작업은 운영 통계에 우선 확인 샘플 ID를 표시한 P12.1이고, 이번 작업은 그 샘플을 developer 전용 읽기 화면에서 열 수 있게 만든 P12.2다.
- `/operations/requests/[requestId]` route를 추가했다.
  - `requireDeveloperRole`을 통과한 developer만 접근
  - 요청 기본 정보, 운송/통관 detail, 서류 메타데이터, 질문·답변, 견적 요약을 읽기 전용으로 표시
  - 원문 서류 다운로드, signed URL 발급, 상태 변경, 견적 선택 같은 mutation은 제공하지 않음
- `getPlatformRequestOperationsDetail` repository를 추가했다.
  - 운영 summary와 같은 Supabase/RLS 경계에서 요청 상세 메타데이터를 조회
  - marketplace schema가 없으면 schemaReady false로 안전하게 반환
  - 요청이 없으면 route에서 404 처리
- P12.1의 `actionItems` 링크를 `/operations/requests/{requestId}`로 연결했다.
- 자체 보안 리뷰:
  - 고객 회사 소유 요청 상세 route(`/requests/...`)를 운영자 샘플 링크로 재사용하지 않음
  - 운영 상세는 developer-only route guard를 먼저 통과해야 함
  - 원문 서류 내용, storage signed URL, 다운로드 액션을 만들지 않음
  - 상태 변경/승인/입찰 선택 mutation을 만들지 않음
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/requests/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 운영 상세에서 개선 요청 문구 자동화

- 이전 작업은 developer 전용 운영 상세 화면을 만든 P12.2이고, 이번 작업은 그 상세 화면에서 바로 사용할 개선 요청 문구를 자동 생성하는 P12.3이다.
- `buildPlatformRequestImprovementPrompt`를 추가했다.
  - 미답변 질문이 있으면 질문 답변 흐름 개선 문구 생성
  - 견적 도착 요청이면 견적 비교·선택 전환 개선 문구 생성
  - 마감 지난 공개 요청이면 마감 이후 후속 안내 개선 문구 생성
  - 공개됐지만 견적이 없으면 매칭·알림 점검 문구 생성
  - 초안이면 공개까지 이어지는 다음 행동 안내 개선 문구 생성
  - 그 외에는 요청 상세 흐름 표본 점검 문구 생성
- 운영 상세 route에 개선 요청 문구 카드를 추가했다.
- 민감정보 보호를 위해 프롬프트에는 요청 ID, 요청 유형, 상태, 서류/질문/견적 건수만 포함한다.
- 회귀 테스트에서 파일명, 품목 설명, 요청 제목이 프롬프트에 포함되지 않음을 검증했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/requests/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 선정 이후 후속 안내 정리

- 이전 작업은 운영 상세에서 개선 요청 문구를 자동 생성한 P12.3이고, 이번 작업은 화주가 업체 선정 후 다음 업무를 놓치지 않게 하는 P13.1이다.
- 운송 요청이 `partner_selected` 상태일 때 `포워더 선정 후 다음 업무` 안내를 표시한다.
  - 선정 견적 금액, 리드타임, 운송일수 요약
  - 최종 선적 일정·비용 범위 확인
  - CI/PL/B/L/AWB 등 선정 포워더 공개 범위 서류 첨부 안내
  - 위험물·온도관리·중고차 등 특수 조건 확인 안내
- 통관 의뢰가 `partner_selected` 상태일 때 `관세사무소 선정 후 다음 업무` 안내를 표시한다.
  - 선정 견적 금액, 통관 수수료, 예상 통관일수 요약
  - CI/PL/C/O/사양서 등 선정 관세사무소 공개 범위 서류 첨부 안내
  - HSK/FTA/요건은 담당자 검토 필요 표현 유지
  - 세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 있을 수 있다는 주의 문구 유지
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 선정된 파트너 후속 안내

- 이전 작업은 화주가 업체 선정 후 다음 업무를 보게 하는 P13.1이고, 이번 작업은 선정된 포워더/관세사무소가 본인이 선정된 요청에서 다음 처리 업무를 확인하는 P13.2다.
- 운송/통관 파트너 opportunity 조회에 `partner_selected` 상태를 포함했다.
  - 실제 노출은 기존 RLS가 선정된 bid를 가진 파트너만 읽도록 제한한다.
- 운송 입찰 상세에서 `partner_selected` 상태이면 새 견적 제출 폼 대신 `선정된 운송 요청` 안내를 표시한다.
  - 선적 일정 확정
  - 선정 포워더 공개 범위 서류 확인
  - 위험물·온도관리·중고차 특수 조건 확인
- 통관 입찰 상세에서 `partner_selected` 상태이면 새 견적 제출 폼 대신 `선정된 통관 의뢰` 안내를 표시한다.
  - 신고 예정일과 서류 수령 일정 확정
  - 선정 관세사무소 공개 범위 서류 확인
  - HSK/FTA/요건은 담당자 검토 필요 표현 유지
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 거래 후속 상태 모델 계획

- 이전 작업은 선정된 파트너가 후속 업무 안내를 보게 한 P13.2이고, 이번 작업은 선정 이후 상태 전이를 안전하게 넣기 위한 P13.3 계획이다.
- `docs/PLATFORM_REQUEST_LIFECYCLE.md`를 추가했다.
- 현재 구현 상태와 후속 상태를 분리했다.
  - 현재 구현: `draft`, `open`, `bids_received`, `partner_selected`
  - 후속 계획: `in_progress`, `completed`
- `partner_selected -> in_progress`, `in_progress -> completed` 전이 규칙을 정의했다.
- requester, selected partner, staff/admin만 전이할 수 있게 RPC-only로 계획했다.
- audit event를 정의했다.
  - `service_request_started`
  - `service_request_completed`
- audit metadata에는 내부 UUID와 역할만 남기고 파일명, invoice 내용, 개인정보는 남기지 않는 원칙을 명시했다.
- broad `service_requests` update RLS를 열지 않고 RPC로만 쓰기 처리한다는 원칙을 고정했다.
- 새 migration은 만들지 않았다. P13.4에서 로컬 migration/RPC skeleton으로 이어간다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `rg`로 `in_progress`, `completed`, `service_request_started`, `service_request_completed`, `PLATFORM_REQUEST_LIFECYCLE` 문서 반영 확인

### 회사 검증 증빙 업로드 보안 리뷰 반영

- 이전 작업은 회사 검증 증빙 업로드 skeleton을 만든 것이고, 이번 작업은 리뷰어가 지적한 권한 상승/RLS/정합성 문제를 막은 것이다.
- broad profile self-update 정책을 draft marketplace migration에서 제거하고, 일반 사용자가 직접 수정 가능한 profile 컬럼을 `full_name`, `preferred_locale`로 제한했다.
- 운영자 검증 문서 리뷰 정책을 서버 액션과 동일하게 developer-only로 맞췄다.
- storage path UUID 캐스팅 전에 `is_uuid_text` 가드를 거치도록 해 malformed path가 RLS 평가 중 오류를 만들지 않게 했다.
- 검증 문서 storage upload 실패 시 storage object remove와 metadata delete를 모두 시도하고, 정리 실패도 오류로 처리하도록 보강했다.
- 회사 검증 상태 변경과 audit insert 오류를 더 이상 조용히 무시하지 않도록 company verification action에서 오류를 확인한다.
- 사용자에게 노출되는 Supabase 설정 오류 문구를 일반 업로드 환경 오류 문구로 바꿨다.
- governance test에 profile self-update 제거, developer-only review policy, UUID path guard 회귀 검증을 추가했다.
- repository test에 upload 실패 시 storage/object와 metadata cleanup이 호출되는 검증을 추가했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts server/repositories/company-verification.repository.test.ts features/company-verification/schemas.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`
- `supabase db lint --local --fail-on error`

### 거래 후속 상태 RPC skeleton

- 이전 작업은 `in_progress`, `completed` 상태 모델을 문서로 계획한 P13.3이고, 이번 작업은 실제 로컬 migration/RPC, repository, server action, UI 버튼을 연결한 P13.4다.
- `start_selected_service_request(p_request_id uuid)` RPC를 추가했다.
  - `partner_selected` 상태와 selected bid 존재 여부를 확인한다.
  - requester, selected partner, staff/admin만 진행 시작할 수 있다.
  - 상태를 `in_progress`로 바꾸고 `service_request_started` audit log를 남긴다.
- `complete_selected_service_request(p_request_id uuid, p_completion_note text)` RPC를 추가했다.
  - `in_progress` 상태와 selected bid 존재 여부를 확인한다.
  - requester, selected partner, staff/admin만 완료 처리할 수 있다.
  - 상태를 `completed`로 바꾸고 `service_request_completed` audit log를 남긴다.
  - audit metadata에는 완료 메모 원문을 저장하지 않고 `has_completion_note`만 저장한다.
- 운송/통관 repository와 server action에 진행 시작/완료 처리 호출을 추가했다.
- 운송/통관 요청자 화면과 선정된 파트너 opportunity 화면에 상태별 버튼을 붙였다.
  - `partner_selected`: 진행 시작
  - `in_progress`: 완료 처리
  - `completed`: 읽기 전용 완료 안내
- governance test에 lifecycle RPC, audit event, execute grant, direct update policy 미사용 검증을 추가했다.
- lifecycle schema test를 추가했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run features/service-requests/service-request-lifecycle-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm test`
- `supabase db lint --local --fail-on error`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance`, `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 후속 상태 운영 관찰성

- 이전 작업은 요청 상태를 `partner_selected -> in_progress -> completed`로 바꾸는 P13.4이고, 이번 작업은 운영자가 그 후속 상태가 막히는지 볼 수 있게 하는 P13.5다.
- 운영 통계 summary에 후속 상태 지표를 추가했다.
  - `inProgress`
  - `completed`
  - `staleInProgress`
- 운영 화면 `플랫폼 요청 운영 상태`에 `선정 후 진행`, `오래 진행중` 카드를 추가했다.
- `in_progress` 요청이 7일 이상 멈춘 경우 우선 확인 샘플과 개선 요청 문구를 생성한다.
- 진행중 요청 상세 개선 프롬프트는 민감 품목 설명, 요청 제목, 서류 파일명을 포함하지 않는다.
- 운영 상세 화면의 상태 배지를 `in_progress`, `completed`까지 성공 톤으로 표시하도록 맞췄다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/users`, `/operations/requests/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 완료 이후 피드백 골격

- 이전 작업은 운영자가 진행중/완료 병목을 보는 P13.5이고, 이번 작업은 완료된 거래의 신뢰 지표를 쌓는 P13.6이다.
- `service_request_feedbacks` 테이블을 로컬 marketplace migration 초안에 추가했다.
  - 요청 ID, 평가 회사, 평가 대상 회사, 평가자 역할
  - 전체 평점, 응답 속도, 소통, 서류 품질
  - 500자 제한 메모
  - 같은 요청/평가자/평가대상/역할 조합 중복 방지
- 직접 insert/update 정책은 열지 않고 `submit_service_request_feedback(...)` RPC로만 제출하게 했다.
- RPC는 완료된 요청, selected bid, requester 또는 selected partner 권한을 확인한다.
- audit log에는 평점과 `has_comment`만 남기고 피드백 메모 원문은 저장하지 않는다.
- 운송/통관 완료 상태 화면에 `완료 요청 피드백` 폼을 추가했다.
- feedback schema와 governance test를 추가했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run features/service-requests/service-request-feedback-schemas.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 파트너 신뢰 지표 조회

- 이전 작업은 완료된 요청에 피드백을 제출할 수 있게 한 P13.6이고, 이번 작업은 그 피드백을 견적 비교 화면에서 집계 신뢰 지표로 활용하는 P14.1이다.
- raw 피드백 row와 코멘트 원문을 견적 비교 화면에 노출하지 않도록 `get_partner_feedback_summaries(uuid[])` aggregate RPC를 추가했다.
- aggregate RPC는 회사별 후기 건수와 평균 평점, 응답 속도, 소통, 서류 품질 평균만 반환한다.
- 운송/통관 견적 조회 repository가 bidder 회사 ID별 feedback summary를 붙인다.
- 운송/통관 견적 카드에 `거래 후기 n건 / 평균 x.x점` 배지를 표시한다.
- governance test에 aggregate RPC, execute grant, raw direct write 미사용 검증을 추가했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts features/service-requests/service-request-feedback-schemas.test.ts`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 견적 비교 기준 정리

- 이전 작업은 완료 거래 피드백을 견적 카드에 집계 지표로 표시한 P14.1이고, 이번 작업은 화주가 최저가만 보지 않도록 비교 기준을 압축 안내하는 P14.2다.
- 운송 견적 목록 위에 비교 기준 카드를 추가했다.
  - 최저 총액
  - 선적 가능일과 운송일수
  - 후기 보유 업체 수
  - 포함·제외 비용, free time, 특수화물 조건
- 통관 견적 목록 위에 비교 기준 카드를 추가했다.
  - 최저 총액
  - 예상 통관일수와 시작 가능일
  - 후기 보유 업체 수
  - 요청 서류, 예비 검토 가능 여부, 리스크 메모
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 파트너 검증 배지 노출

- 이전 작업은 견적 비교 기준을 안내한 P14.2이고, 이번 작업은 견적 제출 업체의 운영 검증/추천 상태를 비교 정보로 표시하는 P14.3이다.
- raw 회사 테이블을 직접 읽지 않고 `get_partner_trust_summaries(uuid[])` aggregate RPC를 추가했다.
- aggregate RPC는 회사 ID, 검증 상태, 신뢰 점수만 반환하고 `suspended`, `blocked` 회사는 제외한다.
- 운송/통관 견적 조회 repository에 `partnerTrust`를 붙였다.
- 견적 카드에 다음 배지를 표시한다.
  - 추천 파트너
  - 운영 검증
  - 거래 이력
  - 신뢰 점수
- feedback aggregate와 함께 표시해 화주가 가격만이 아니라 검증 상태와 거래 후기까지 함께 볼 수 있게 했다.
- 새 migration 파일은 만들지 않고 기존 로컬 marketplace migration 초안에 반영했다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 선정 전 확인 체크리스트

- 이전 작업은 견적 카드에 검증/후기 배지를 표시한 P14.3이고, 이번 작업은 화주가 선정 버튼을 누르기 전에 누락 조건을 확인하게 하는 P14.4다.
- 운송 견적 카드에 `선정 전 확인` 체크리스트를 추가했다.
  - 총액
  - 일정
  - 검증
  - 후기
  - 조건
- 통관 견적 카드에 `선정 전 확인` 체크리스트를 추가했다.
  - 금액
  - 일정
  - 검증
  - 후기
  - 검토조건
- 선택 RPC와 권한 흐름은 변경하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 완료 피드백 제출 상태 표시

- 이전 작업은 업체 선정 전 체크리스트를 붙인 P14.4이고, 이번 작업은 완료 후 내가 이미 피드백을 남겼는지 화면에서 구분하는 P14.5다.
- 현재 회사가 제출한 완료 피드백을 요청 ID별로 읽는 `listOwnServiceRequestFeedbacks` repository를 추가했다.
- 운송/통관 요청 목록, 요청 상세, 파트너 opportunity 목록, opportunity 상세에서 피드백 제출 상태를 전달한다.
- 완료 상태에서 이미 제출한 피드백이 있으면 폼 대신 `완료 요청 피드백 제출됨` 안내를 표시한다.
- 같은 요청에는 회사별로 한 번만 피드백을 남길 수 있다는 문구를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run features/service-requests/service-request-feedback-schemas.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance`, `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 대시보드 거래 흐름 요약 보강

- 이전 작업은 완료된 요청 화면에서 피드백 제출 여부를 표시한 P14.5이고, 이번 작업은 홈 대시보드에서 전체 거래 흐름을 한눈에 보게 하는 P15.1이다.
- 대시보드 marketplace 요약에 `진행중 요청`, `업무 진행`, `완료`, `피드백 대기` 지표를 추가했다.
- 완료된 요청 중 현재 회사가 아직 피드백을 제출하지 않은 건수를 `listOwnServiceRequestFeedbacks`로 계산해 표시한다.
- 기존 요청/입찰 상세 기능, 상태 전환 RPC, 피드백 제출 RPC는 변경하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/dashboard` 요청 시 `/login` 307 redirect 확인

### 대시보드 다음 행동 우선순위 CTA

- 이전 작업은 홈 대시보드에 요청·입찰·진행·완료 숫자 요약을 추가한 P15.1이고, 이번 작업은 그 숫자를 보고 바로 눌러야 할 다음 행동을 제시하는 P15.2다.
- `다음 행동` 영역을 추가해 운송 화주 업무, 통관 화주 업무, 운송 파트너 입찰, 통관 파트너 입찰을 우선순위 카드로 보여준다.
- 자체 UX 리뷰에서 합산 숫자가 운송 화면으로만 연결되는 혼동을 발견해, 액션 카드용 카운트를 운송/통관/파트너 업무별로 분리했다.
- 대시보드 하단의 상태 숫자 요약은 유지해 운영 흐름 전체도 계속 볼 수 있게 했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/dashboard` 요청 시 `/login` 307 redirect 확인

### 대시보드 역할별 빈 상태 정리

- 이전 작업은 처리할 업무가 있을 때 우선순위 CTA를 보여준 P15.2이고, 이번 작업은 요청·입찰 데이터가 없을 때 사용자가 무엇부터 시작해야 하는지 안내하는 P15.3이다.
- 처리할 업무가 없는 경우 `다음 행동` 문구를 빈 상태 안내로 바꾸고, 역할 설정과 회사 검증 상태 확인을 먼저 노출한다.
- 역할이 없으면 회사 설정으로 이동하게 하고, 운영자 승인 전 상태이면 검증 확인 경로를 보여준다.
- 운송/통관 첫 요청 생성 CTA는 유지해, 검증 또는 역할 정리 후 바로 요청을 시작할 수 있게 했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/dashboard` 요청 시 `/login` 307 redirect 확인

### 대표용 운영 홈 우선순위 정리

- 이전 작업은 고객 대시보드의 빈 상태를 정리한 P15.3이고, 이번 작업은 대표/운영자가 운영 화면에서 무엇을 먼저 고쳐달라고 해야 하는지 보는 P16.1이다.
- 플랫폼 요청 운영 패널 상단에 `대표 우선순위 큐`를 추가했다.
- 미답변 질문, 견적 도착, 오래 진행중, 견적 없는 공개, 오래된 초안, 마감 지난 공개를 병목 순서로 정리한다.
- 각 항목은 `무엇을 맡길지`와 `왜 중요한지`를 함께 보여줘 운영자가 통계를 해석하지 않아도 수정 요청을 만들 수 있게 했다.
- 기존 운영 지표, 샘플 상세 링크, DB/RLS 로직은 변경하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### 운영 개선 요청 복사 UX

- 이전 작업은 대표 우선순위 큐를 보여준 P16.1이고, 이번 작업은 그 내용을 나에게 바로 붙여넣을 수 있는 복사용 문장으로 만드는 P16.2다.
- 운영 요청 패널의 `다음에 바로 요청할 작업` 영역에 클립보드 복사 버튼을 추가했다.
- 복사 문장에는 전체 건수, 주요 병목, 샘플 요청 ID, 상태만 포함한다.
- 서류 원문, 파일명, 단가 원문, 개인정보는 복사 문장에 포함하지 말라는 주의 문구를 함께 넣었다.
- 복사될 내용을 화면에서 미리 확인할 수 있도록 `pre` 블록을 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/users` 요청 시 `/login` 307 redirect 확인

### 운영 요청 상세 민감정보 노출 점검

- 이전 작업은 운영 패널에서 복사용 개선 요청 문장을 만든 P16.2이고, 이번 작업은 운영 샘플 상세 화면에서 민감 원문이 보이지 않도록 정리한 P16.3이다.
- 운영 상세 카드 제목에서 고객 요청 제목 대신 요청 ID 축약값을 표시한다.
- 품목 설명 원문을 화면에서 제거하고, 서류 파일명도 표시하지 않는다.
- 질문·답변 원문 대신 답변 여부와 날짜만 보여준다.
- 견적 금액과 메시지 원문 대신 상태, 통화, 리드타임, 제출일, 선정일만 보여준다.
- 화면 상단에 이 상세 화면은 개선 판단용 요약만 표시한다는 안전 안내를 추가했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/requests/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 운영 상세 민감 데이터 조회 축소

- 이전 작업은 운영 상세 화면에서 민감 원문을 숨긴 P16.3이고, 이번 작업은 repository 단계에서 원문성 컬럼을 덜 조회하도록 줄인 P16.4다.
- 운영 상세 요청 조회에서 `title`, `product_summary`를 제거했다.
- 서류 조회에서 `file_name`을 제거했다.
- 질문 조회에서 `question`, `answer` 원문을 제거하고 답변 여부는 `answered_at`으로 판단한다.
- 견적 조회에서 `total_amount`, `message`를 제거했다.
- 반환 객체에는 기존 UI 타입 호환을 위해 빈 문자열, `null`, `[redacted]` placeholder만 채운다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/requests/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 운영 상세 redaction 회귀 테스트

- 이전 작업은 운영 상세 repository가 민감 원문성 컬럼을 덜 조회하도록 줄인 P16.4이고, 이번 작업은 그 경계를 테스트로 고정한 P16.5다.
- 운영 상세 select 컬럼 목록을 `platformRequestOperationsDetailSelects` 상수로 분리했다.
- 회귀 테스트에서 `title`, `product_summary`, `file_name`, `question`, `answer`, `message`, `total_amount`가 운영 상세 select에 들어오지 않는지 검사한다.
- 이후 운영 상세를 수정하다가 원문성 컬럼을 다시 조회하면 테스트가 실패한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/operations/requests/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 요청 목록 성능·쿼리 경계 점검

- 이전 작업은 운영 상세 redaction 회귀 테스트를 추가한 P16.5이고, 이번 작업은 화주/파트너 요청 목록이 커졌을 때 조회 범위를 정리한 P17.1이다.
- 운송/통관 요청자 목록 limit을 `serviceRequestListLimit = 20` 상수로 고정했다.
- 파트너 opportunity 목록은 운송/통관 타입 필터 전 매칭 스캔 범위를 `serviceRequestOpportunityScanLimit = 60`으로 넓혔다.
- 운송 opportunity 상세 조회는 실제 표시 가능한 요청 ID가 없으면 바로 빈 결과를 반환하고, 표시 가능한 요청 ID에 대해서만 detail을 조회한다.
- 통관 opportunity 목록도 동일한 스캔 limit 상수를 사용하도록 정리했다.
- 기존 schema와 RLS는 변경하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts server/repositories/platform-operations.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 요청 목록 limit 회귀 테스트

- 이전 작업은 요청/기회 목록 limit과 매칭 스캔 범위를 정리한 P17.1이고, 이번 작업은 그 경계를 테스트로 고정한 P17.2다.
- 운송 요청 repository의 `serviceRequestListLimit`, `serviceRequestOpportunityScanLimit`을 export했다.
- 통관 요청 repository의 `clearanceServiceRequestListLimit`, `clearanceServiceRequestOpportunityScanLimit`을 export했다.
- 회귀 테스트에서 요청자 목록 limit이 20건으로 유지되는지 확인한다.
- 파트너 opportunity 스캔 limit은 요청자 목록 limit보다 커야 한다는 조건을 테스트로 고정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 요청 목록 index 보강 검토

- 이전 작업은 요청 목록 limit이 무제한으로 돌아가지 않게 테스트로 고정한 P17.2이고, 이번 작업은 실제 DB index가 목록/상세/입찰 조회 패턴을 받치는지 점검한 P17.3이다.
- 요청자 목록 패턴을 위해 `service_requests(requester_company_id, request_type, created_at desc)` index를 추가했다.
- 파트너 상세 매칭 조회를 위해 `service_request_partner_matches(request_id, partner_company_id)` index를 추가했다.
- 견적 비교 정렬을 위해 `service_bids(request_id, bid_type, total_amount, created_at)` index를 추가했다.
- 질문 목록 조회를 위해 `service_request_questions(request_id, created_at)` index를 추가했다.
- 완료 피드백 상태 조회를 위해 `service_request_feedbacks(reviewer_company_id, request_id, created_at desc)` index를 추가했다.
- governance test에서 위 index들이 migration에 유지되는지 확인한다.
- 로컬 migration 초안만 수정했고 DB migration 적용, 커밋, 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/platform-marketplace-governance.test.ts server/repositories/freight-requests.repository.test.ts`
- `supabase db lint --local --fail-on error`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 요청 상세 데이터 로딩 중복 점검

- 이전 작업은 DB index를 보강한 P17.3이고, 이번 작업은 요청 목록 페이지의 서버 데이터 로딩 대기 구조를 줄인 P18.1이다.
- 운송 요청 목록에서 견적, 서류, 질문, 피드백 조회를 순차 await에서 `Promise.all` 병렬 로딩으로 변경했다.
- 통관 의뢰 목록에서도 서류, 질문, 견적, 피드백 조회를 `Promise.all`로 병렬화했다.
- 상세 페이지들은 이미 필요한 보조 데이터를 병렬 로딩하고 있어 추가 변경하지 않았다.
- 화면 표시 데이터와 RLS 경계는 변경하지 않았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 요청 목록 데이터 조립 헬퍼 분리

- 이전 작업은 운송/통관 목록의 보조 데이터 조회를 병렬화한 P18.1이고, 이번 작업은 목록 페이지의 반복 데이터 조립 코드를 줄인 P18.2다.
- `server/repositories/service-request-list-view.ts`를 추가했다.
- `uniqueServiceRequestIds`로 요청자 목록과 파트너 기회 목록의 요청 ID dedupe를 공통화했다.
- `groupServiceRequestItemsByRequestId`로 견적, 서류, 질문 배열을 requestId 기준으로 묶는 반복 reduce를 제거했다.
- `serviceRequestFeedbackMapToRecord`로 feedback Map 변환을 공통화했다.
- 운송/통관 목록 페이지 모두 같은 헬퍼를 사용하도록 정리했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 요청 상세 next-focus 계산 헬퍼 분리

- 이전 작업은 운송/통관 목록 페이지의 데이터 조립 반복을 줄인 P18.2이고, 이번 작업은 요청자 상세 페이지의 다음 작업 계산 반복을 줄인 P18.3이다.
- `buildRequesterServiceRequestNextFocus` 헬퍼를 추가했다.
- 운송 요청 상세와 통관 의뢰 상세에서 미답변 질문, 견적 도착, 서류 없음, 초안 공개, 견적 대기 우선순위 계산을 공통 헬퍼로 이동했다.
- 통관 의뢰 상세의 `#request-publish` 예외는 헬퍼 옵션으로 유지했다.
- 화면 문구와 이동 anchor는 기존 동작을 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts server/repositories/platform-marketplace-governance.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### next-focus 헬퍼 단위 테스트

- 이전 작업은 요청자 상세 페이지의 next-focus 계산을 헬퍼로 분리한 P18.3이고, 이번 작업은 그 우선순위를 테스트로 고정한 P18.4다.
- 목록 헬퍼의 request id dedupe, requestId별 grouping, feedback Map 변환을 테스트했다.
- next-focus 헬퍼가 미답변 질문을 견적 비교보다 우선하는지 확인했다.
- 견적이 있으면 견적 비교로 이동하는지 확인했다.
- 서류가 없으면 초안 공개보다 서류 첨부가 먼저 나오는지 확인했다.
- 서류가 있고 초안 상태이면 공개 설정으로 이동하는지 확인했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 파트너 opportunity 상세 next-focus 헬퍼 분리

- 이전 작업은 요청자 상세 next-focus 우선순위를 테스트로 고정한 P18.4이고, 이번 작업은 파트너 입찰 상세의 질문 확인·견적 제출 우선순위를 공통화한 P19.1이다.
- `buildPartnerOpportunityNextFocus` 헬퍼를 추가했다.
- 운송 opportunity 상세와 통관 opportunity 상세에서 같은 질문 확인/견적 제출 계산을 헬퍼로 이동했다.
- 미답변 질문이 있으면 질문 확인을 먼저 보여주고, 없으면 견적 제출로 이동하는 우선순위를 테스트로 고정했다.
- 화면 문구와 anchor는 기존 동작을 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 파트너 opportunity 상세 피드백 조회 필요성 점검

- 이전 작업은 파트너 opportunity 상세의 next-focus 계산을 공통화한 P19.1이고, 이번 작업은 상세 페이지에서 불필요한 완료 피드백 조회를 줄인 P19.2다.
- 운송 opportunity 상세에서 요청 상태가 `completed`일 때만 `listOwnServiceRequestFeedbacks`를 호출하도록 변경했다.
- 통관 opportunity 상세도 동일하게 완료 상태일 때만 피드백을 조회한다.
- 현재 opportunity 상세 조회는 공개, 견적 도착, 선정 상태 중심이므로 대부분의 경우 피드백 조회를 건너뛴다.
- 화면 구조와 feedback form 전달 타입은 유지했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/opportunities/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 파트너 opportunity 목록 feedback 조회 범위 점검

- 이전 작업은 파트너 opportunity 상세에서 완료 상태일 때만 피드백을 조회하게 한 P19.2이고, 이번 작업은 목록 화면의 피드백 조회 대상도 완료 요청으로 줄인 P19.3이다.
- `completedServiceRequestIds` 헬퍼를 추가했다.
- 운송 요청 목록에서 완료 상태 요청 ID만 `listOwnServiceRequestFeedbacks`에 전달한다.
- 통관 의뢰 목록도 동일하게 완료 요청 ID만 피드백 조회 대상으로 전달한다.
- 완료 전 요청에서는 피드백 폼이 노출되지 않으므로 불필요한 feedback 조회를 줄였다.
- 완료 ID dedupe 동작을 단위 테스트로 고정했다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight`, `/requests/clearance` 요청 시 `/login` 307 redirect 확인

### 요청 상세 feedback 조회 helper 적용 범위 검토

- 이전 작업은 목록 화면의 피드백 조회 대상을 완료 요청으로 줄인 P19.3이고, 이번 작업은 요청자 상세 화면에도 같은 기준을 적용한 P20.1이다.
- 운송 요청자 상세에서 요청 상태가 `completed`일 때만 `listOwnServiceRequestFeedbacks`를 호출한다.
- 통관 요청자 상세도 동일하게 완료 상태일 때만 피드백 제출 여부를 조회한다.
- 완료 전 상태에서는 피드백 폼이 노출되지 않으므로 불필요한 feedback 조회를 건너뛴다.
- 파트너 상세, 목록, 요청자 상세 모두 완료 상태 중심으로 feedback 조회 기준이 맞춰졌다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### 피드백 조회 gating 회귀 테스트 보강

- 이전 작업은 요청자 상세에도 완료 상태 피드백 조회 기준을 적용한 P20.1이고, 이번 작업은 완료 전 요청에는 피드백 조회가 필요 없다는 규칙을 헬퍼와 테스트로 고정한 P20.2다.
- `shouldLoadServiceRequestFeedback` 헬퍼를 추가했다.
- 요청자 상세, 파트너 상세 모두 직접 `status === "completed"`를 비교하지 않고 공통 헬퍼를 사용한다.
- 단위 테스트에서 `completed`만 피드백 조회 대상으로 보고, `in_progress`, `partner_selected`는 조회하지 않는 규칙을 확인한다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 커밋, 푸시, DB migration 적용, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run server/repositories/freight-requests.repository.test.ts`
- `npm test`
- `npm run build`
- 로컬 서버 `http://localhost:3100` 실행
- 비로그인 상태 `/requests/freight/11111111-1111-4111-8111-111111111111`, `/requests/clearance/opportunities/11111111-1111-4111-8111-111111111111` 요청 시 `/login` 307 redirect 확인

### marketplace post-interest-flow 병목 선정

- 이전 작업은 파트너의 viewed/declined 상태 전환이 운영 상세 카운트에 반영되는지 확인한 P136.1이고, 이번 작업은 no-response/interest flow 이후 남은 marketplace MVP 병목을 다시 고른 P137.1이다.
- 운송·통관 상세에는 이미 견적 비교 기준, 최저 총액/최단 리드타임·통관, 파트너 검증/후기, 선정 전 체크리스트가 존재한다.
- 따라서 다음 병목은 견적 비교 상세 기능을 새로 만드는 것이 아니라, 화주가 요청 목록에서 견적 도착 후 비교·선정 필요성을 상세 진입 전부터 알 수 있게 하는 것이다.
- 다음 작업은 P138.1 `requester bid decision list clarity`로 잡았다.
- 새 migration은 만들지 않았다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `rg -n "견적 비교|선정 전 확인|P137|P136" docs features app server`
- `git diff -- docs/ROADMAP.md docs/WORK_LOG.md`

### requester bid decision list clarity

- 이전 작업은 다음 병목을 고른 P137.1이고, 이번 작업은 그 결론에 따라 화주 목록에서 견적 도착 후 비교·선정 필요성을 먼저 보여준 P138.1이다.
- 운송 요청 compact row에 견적 도착 요약을 추가했다.
- 운송 요약은 견적 건수, 최저 총액, 최단 리드타임, 후기 보유 업체 수를 표시하고 상세 견적 영역으로 이동한다.
- 통관 의뢰 compact row에도 같은 목적의 요약을 추가했다.
- 통관 요약은 견적 건수, 최저 총액, 최단 통관일, 예비 검토 가능 업체 수를 표시하고 상세 견적 영역으로 이동한다.
- 기존 상세의 견적 비교 기준, 선정 전 체크리스트, 파트너 검증/후기 표시는 유지했다.
- 새 DB 조회, migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- 로컬 DB `service_requests`에서 `bids_received` 운송/통관 fixture 존재 확인
- Playwright 화주 계정으로 `/requests/freight`, `/requests/clearance` 접속
- 운송 목록에서 `견적 1건 도착 · 비교 후 포워더 선정 필요`, 최저 총액 문구 확인
- 통관 목록에서 `견적 1건 도착 · 비교 후 관세사무소 선정 필요`, 예비 검토 가능 문구 확인
- 새 버튼 href가 각각 `/requests/freight/75000000-0000-4000-8000-000000000001#request-bids`, `/requests/clearance/75000000-0000-4000-8000-000000000002#request-bids`로 연결되는지 확인

### requester bid selection readiness detail

- 이전 작업은 화주 목록에서 견적 도착 후 비교·선정 필요성을 보여준 P138.1이고, 이번 작업은 상세 견적 영역에서 선정 전 준비 상태를 한눈에 보여준 P139.1이다.
- 운송 상세의 받은 견적 영역에 `선정 준비 요약`을 추가했다.
- 운송 요약은 미답변 질문, 공개 서류, 금액 입력 업체 수, 후기 보유 업체 수를 표시한다.
- 통관 상세의 받은 견적 영역에도 `선정 준비 요약`을 추가했다.
- 통관 요약은 미답변 질문, 공개 서류, 금액 입력 업체 수, 예비 검토 가능 업체 수, 추가 요청 서류 수를 표시한다.
- 기존 견적 비교 기준과 각 견적별 선정 전 체크리스트는 유지했다.
- 새 DB 조회, migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright 화주 계정으로 `/requests/freight/75000000-0000-4000-8000-000000000001#request-bids` 접속
- 운송 상세에서 `선정 준비 요약`, `금액 입력 n/n곳`, `견적 비교 기준` 확인
- Playwright 화주 계정으로 `/requests/clearance/75000000-0000-4000-8000-000000000002#request-bids` 접속
- 통관 상세에서 `선정 준비 요약`, `예비 검토 n곳 / 요청 서류 n건`, `견적 비교 기준` 확인

### partner bid submission readiness detail

- 이전 작업은 화주가 견적을 선정하기 전 준비도를 보는 P139.1이고, 이번 작업은 파트너가 견적 제출 전 공개 서류·질문·참여 상태를 점검하는 P140.1이다.
- 운송 opportunity 상세의 견적 제출 form 앞에 `견적 제출 전 확인` 요약을 추가했다.
- 운송 요약은 참여 상태, 공개 서류 수, 답변 대기 질문 수, 총액·유효기한·리드타임 입력 필요성을 표시한다.
- 통관 opportunity 상세의 예비 견적 제출 form 앞에도 같은 요약을 추가했다.
- 통관 요약은 참여 상태, 공개 서류 수, 답변 대기 질문 수, HS/FTA/요건은 담당자 검토 필요 문구를 표시한다.
- 견적 제출 form과 질문 등록 form의 저장 동작은 변경하지 않았다.
- 새 DB 조회, migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright 포워더 계정으로 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000101#opportunity-bid` 접속
- 운송 상세에서 `견적 제출 전 확인`, 참여 상태, `포워더 운송 견적 제출` 확인
- Playwright 관세사무소 계정으로 `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000102#opportunity-bid` 접속
- 통관 상세에서 `견적 제출 전 확인`, `HS/FTA/요건은 담당자 검토 필요`, `관세사무소 예비 견적 제출` 확인

### marketplace bid readiness route regression

- 이전 작업은 파트너 견적 제출 전 확인 요약을 추가한 P140.1이고, 이번 작업은 연속 UI 변경 후 역할별 주요 route가 계속 정상 렌더링되는지 확인한 P141.1이다.
- 화주 계정으로 대시보드, 운송 목록, 운송 상세 견적 영역, 통관 목록, 통관 상세 견적 영역을 확인했다.
- 포워더 계정으로 대시보드, 운송 요청 목록, 운송 opportunity 상세 견적 영역을 확인했다.
- 관세사무소 계정으로 대시보드, 통관 의뢰 목록, 통관 opportunity 상세 견적 영역을 확인했다.
- 첫 smoke에서는 dashboard 숨김 내비게이션 텍스트와 실제 탭 문구 차이 때문에 assertion을 조정했다.
- 조정 후 실제 화면 문구 기준으로 role route smoke가 통과했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright route smoke:
  - requester `/dashboard`, `/requests/freight`, `/requests/freight/75000000-0000-4000-8000-000000000001#request-bids`, `/requests/clearance`, `/requests/clearance/75000000-0000-4000-8000-000000000002#request-bids`
  - forwarder `/dashboard`, `/requests/freight`, `/requests/freight/opportunities/75000000-0000-4000-8000-000000000101#opportunity-bid`
  - broker `/dashboard`, `/requests/clearance`, `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000102#opportunity-bid`

### partner submitted bid duplicate UX guard

- 이전 작업은 역할별 route 회귀 검증인 P141.1이고, 이번 작업은 이미 견적을 제출한 파트너에게 중복 제출 form이 계속 보이는 문제를 정리한 P142.1이다.
- DB/RPC에는 파트너당 활성 견적 1개 unique index와 `이미 제출 중인 견적이 있습니다.` 중복 제출 차단이 이미 있다.
- 하지만 포워더/관세사무소 opportunity 상세에서는 이미 제출한 요청에도 제출 form이 계속 보였다.
- opportunity 상세 loader에서 현재 파트너가 읽을 수 있는 기존 견적을 조회해 row에 전달했다.
- 운송 opportunity는 기존 견적이 있으면 `제출한 운송 견적` 요약을 표시하고 제출 form을 숨긴다.
- 통관 opportunity도 기존 견적이 있으면 `제출한 통관 견적` 요약을 표시하고 제출 form을 숨긴다.
- 수정·철회 기능은 MVP에서 바로 열지 않고, 별도 정책 전까지 운영 확인 필요 문구로 제한했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- RPC `submit_freight_bid`, `submit_clearance_bid`의 기존 중복 제출 차단 확인
- Playwright 포워더 계정으로 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000001#opportunity-bid` 접속
- 운송 상세에서 `제출한 운송 견적`, 중복 form 숨김 문구 확인, `포워더 운송 견적 제출` form 비노출 확인
- Playwright 관세사무소 계정으로 `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000002#opportunity-bid` 접속
- 통관 상세에서 `제출한 통관 견적`, 중복 form 숨김 문구 확인, `관세사무소 예비 견적 제출` form 비노출 확인

### bid revision policy visibility

- 이전 작업은 이미 견적을 제출한 파트너에게 중복 제출 form을 숨긴 P142.1이고, 이번 작업은 제출 후 수정·철회 직접 처리 불가 정책을 화주·파트너 화면에 일관되게 표시한 P143.1이다.
- 운송 화주 상세의 받은 견적 카드에 “파트너가 제출한 시점의 조건”이며 수정·철회는 운영 확인 후 반영한다는 문구를 추가했다.
- 통관 화주 상세의 받은 견적 카드에도 동일한 정책 문구를 추가했다.
- 운송 파트너 상세의 제출한 견적 요약 문구를 공통 정책 문구로 정리했다.
- 통관 파트너 상세의 제출한 견적 요약 문구도 같은 기준으로 정리했다.
- 수정·철회 기능 자체는 열지 않았다. MVP에서는 중복 제출 차단, 제출 상태 표시, 운영 확인 필요 문구까지만 둔다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright 화주 계정으로 운송·통관 받은 견적 영역에서 `이 견적은 파트너가 제출한 시점의 조건입니다.` 문구 확인
- Playwright 포워더 계정으로 제출한 운송 견적 요약에서 `제출 후 견적 수정·철회는 아직 직접 처리할 수 없습니다.` 문구 확인
- Playwright 관세사무소 계정으로 제출한 통관 견적 요약에서 같은 정책 문구 확인

### operations bid revision policy visibility

- 이전 작업은 화주·파트너 사용자 화면에 수정·철회 정책을 표시한 P143.1이고, 이번 작업은 운영 요청 상세에서도 같은 정책을 민감정보 없이 확인하게 한 P144.1이다.
- 운영 요청 상세의 `견적 상태` 카드에 활성 견적 수, 선정 견적 수, 수정·철회 직접 처리 미제공 요약을 추가했다.
- 각 견적 row에는 상태 badge와 제출일·선정일만 유지하고, 금액과 메시지 원문은 계속 표시하지 않는다.
- 각 견적 row에 제출 후 파트너 직접 수정·철회는 아직 제공하지 않으며 조건 변경은 운영 확인 후 별도 처리한다는 정책 문구를 추가했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npm run typecheck`
- `npm run lint`
- Playwright 개발자 계정으로 `/operations/requests/75000000-0000-4000-8000-000000000001#request-bids` 접속
- 운영 상세에서 `수정·철회 직접 처리 미제공`, 정책 문구, `견적 금액과 메시지 원문은 표시하지 않습니다.` 안내 확인

### operations bid conversion prompt policy

- 이전 작업은 운영 요청 상세 화면에 수정·철회 정책을 표시한 P144.1이고, 이번 작업은 운영자가 복사하는 개선 프롬프트에도 같은 MVP 정책 기준을 포함한 P145.1이다.
- `bid_conversion` 개선 프롬프트에 현재 MVP에서는 파트너 직접 견적 수정·철회 기능을 열지 않고, 조건 변경은 운영 확인 후 별도 처리 안내로 둔다는 문장을 추가했다.
- 프롬프트 테스트를 추가해 정책 문구가 포함되는지 확인했다.
- 같은 테스트에서 견적 메시지, 금액, 품목 설명, 요청 제목 같은 민감 원문이 프롬프트에 섞이지 않는지도 고정했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npx vitest run server/repositories/platform-operations.repository.test.ts`
- `npm run typecheck`
- `npm run lint`

### transaction state route regression

- 이전 작업은 완료 상태에서 리포트·보관 서류·피드백 확인 순서를 표시한 P149.1이고, 이번 작업은 최근 견적·선정·진행·완료 상태 UI 변경 후 역할별 route가 계속 정상 렌더링되는지 확인한 P150.1이다.
- 화주 계정으로 운송·통관 상세의 받은 견적 영역을 확인했다.
- 포워더 계정으로 운송 opportunity 상세의 제출한 견적 영역을 확인했다.
- 관세사무소 계정으로 통관 opportunity 상세의 제출한 견적 영역을 확인했다.
- 완료 preview 화주 계정으로 운송·통관 완료 상태 후속 안내 영역을 확인했다.
- 개발자 계정으로 운영 요청 상세의 견적 수정·철회 정책 영역을 확인했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright route smoke:
  - requester `/requests/freight/75000000-0000-4000-8000-000000000001#request-bids`
  - requester `/requests/clearance/75000000-0000-4000-8000-000000000002#request-bids`
  - forwarder `/requests/freight/opportunities/75000000-0000-4000-8000-000000000001#opportunity-bid`
  - broker `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000002#opportunity-bid`
  - requester `/requests/freight/00000000-0000-4000-8000-000000000101#request-completion`
  - requester `/requests/clearance/00000000-0000-4000-8000-000000000201#request-completion`
  - developer `/operations/requests/75000000-0000-4000-8000-000000000001#request-bids`

### dashboard next action section anchors

- 이전 작업은 상세/운영 route가 깨지지 않는지 확인한 P150.1이고, 이번 작업은 대시보드 다음 행동 CTA가 현재 상태의 실제 처리 섹션으로 바로 이동하게 한 P151.1이다.
- 대시보드 activity summary에 첫 처리 대상 요청의 상태를 함께 전달한다.
- 화주 다음 행동은 상태에 따라 견적 비교, 진행 시작/완료 처리, 완료 후 확인, 초안 form 섹션으로 이동한다.
- 파트너 다음 행동은 공개·견적 수신 상태에서는 견적 제출/제출 요약 섹션으로, 선정·진행 상태에서는 lifecycle 섹션으로 이동한다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npx vitest run features/dashboard/dashboard-home.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright requester `/dashboard`에서 다음 행동 링크가 `/requests/freight/75000000-0000-4000-8000-000000000001#request-bids`와 `/requests/clearance/75000000-0000-4000-8000-000000000002#request-bids`로 이동하는지 확인
- Playwright forwarder `/dashboard`에서 다음 행동 링크가 `/requests/freight/opportunities/75000000-0000-4000-8000-000000000101#opportunity-bid`로 이동하는지 확인
- Playwright broker `/dashboard`에서 다음 행동 링크가 `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000102#opportunity-bid`로 이동하는지 확인

### detail top next-focus anchor regression

- 이전 작업은 대시보드 다음 행동 CTA가 상세 섹션으로 이동하게 한 P151.1이고, 이번 작업은 상세 화면 상단의 `다음 작업 바로가기` 버튼이 상태별 처리 섹션으로 계속 이동하는지 확인한 P152.1이다.
- requester 운송·통관 상세는 받은 견적/비교 영역으로 이동하는지 확인했다.
- forwarder 운송 opportunity와 broker 통관 opportunity는 견적 제출/제출 요약 영역으로 이동하는지 확인했다.
- 완료 preview requester 운송·통관 상세는 완료 리포트·피드백 영역으로 이동하는지 확인했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npx vitest run server/repositories/service-request-list-view.test.ts`
- Playwright route smoke:
  - requester `/requests/freight/75000000-0000-4000-8000-000000000001` top next focus `#request-bids`
  - requester `/requests/clearance/75000000-0000-4000-8000-000000000002` top next focus `#request-bids`
  - forwarder `/requests/freight/opportunities/75000000-0000-4000-8000-000000000001` top next focus `#opportunity-bid`
  - broker `/requests/clearance/opportunities/75000000-0000-4000-8000-000000000002` top next focus `#opportunity-bid`
  - requester `/requests/freight/00000000-0000-4000-8000-000000000101` top next focus `#request-completion`
  - requester `/requests/clearance/00000000-0000-4000-8000-000000000201` top next focus `#request-completion`

### notification opportunity section anchors

- 이전 작업은 상세 화면 상단 바로가기 버튼을 검증한 P152.1이고, 이번 작업은 대시보드 파트너 알림 링크가 opportunity의 실제 처리 섹션으로 이동하게 한 P153.1이다.
- 공개·견적 수신 알림은 `#opportunity-bid`로 이동한다.
- 선정·진행 상태 알림은 `#request-lifecycle`로 이동한다.
- 완료 상태 알림은 `#request-completion`으로 이동한다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npx vitest run features/dashboard/marketplace-notification-inbox.test.ts`
- `npm run typecheck`
- `npm run lint`
- Playwright forwarder/broker `/dashboard` 파트너 알림 영역 렌더링 확인
- 현재 local fixture에는 파트너 알림 링크가 없어 실제 링크 클릭 검증은 단위 테스트로 고정

### notification dashboard e2e fixture

- 이전 작업은 대시보드 파트너 알림 링크 로직을 고친 P153.1이고, 이번 작업은 local seed에 실제 in-app notification fixture를 추가해 브라우저 E2E가 알림 클릭·앵커 이동·읽음 처리를 검증하게 한 P154.1이다.
- transaction fixture에 안정적인 notification delivery ID와 notification E2E env export를 추가했다.
- transaction seed runner가 forwarder용 in-app initial delivery를 생성하고 반복 seed 시 `read_at/read_by`를 다시 초기화한다.
- notification dashboard E2E가 알림 클릭 후 opportunity 상세뿐 아니라 `#opportunity-bid` 앵커까지 확인하도록 보강했다.
- seed 직후 auth user 갱신으로 기존 storage state가 무효화될 수 있어 seed 다음에는 storage state를 재생성해야 함을 실제 검증에서 확인했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `node --check scripts/seed_marketplace_transaction_fixture.mjs`
- `node --check scripts/e2e_marketplace_notification_dashboard.mjs`
- `npx vitest run tests/fixtures/marketplace-transaction.fixture.test.ts features/dashboard/marketplace-notification-inbox.test.ts`
- local env 지정 `npm run e2e:marketplace-transaction:seed`
- local env 지정 `npm run e2e:marketplace-transaction:auth`
- local env 지정 `npm run e2e:marketplace-notification`
- `npm run typecheck`
- `npm run lint`

### dashboard request counter label clarity

- 이전 작업은 notification E2E fixture를 추가한 P154.1이고, 이번 작업은 대시보드 하단 카운터에서 공개 요청과 실제 진행중 업무가 혼동되지 않게 문구를 분리한 P155.1이다.
- 기존 `진행중 요청` 카운터는 실제로 `openRequests`를 표시하고 있었다.
- 이미 `업무 진행` 카운터가 `inProgressRequests`를 표시하므로, `openRequests` 카운터 문구를 `공개 요청`으로 바꿨다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright requester `/dashboard`에서 `공개 요청 n`, `업무 진행 n` 확인
- Playwright requester `/dashboard`에서 기존 `진행중 요청` 문구 비노출 확인
- `npm run typecheck`
- `npm run lint`

### role-aware dashboard counters and links

- 이전 작업은 대시보드 카운터 문구를 명확히 한 P155.1이고, 이번 작업은 화주/포워더/관세사 역할별로 관련 카운터와 workspace 링크만 노출한 P156.1이다.
- 화주 역할에는 화주 요청 카운터와 `내 운송 요청`, `내 통관 의뢰` 링크만 표시한다.
- 포워더 역할에는 파트너 업무/입찰 가능 카운터와 `운송 입찰 가능` 링크만 표시한다.
- 관세사무소 역할에는 파트너 업무/입찰 가능 카운터와 `통관 입찰 가능` 링크만 표시한다.
- 역할이 여러 개인 회사는 해당 역할 묶음이 함께 표시된다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright requester `/dashboard`에서 화주 카운터/링크 노출, 파트너 카운터/입찰 링크 비노출 확인
- Playwright forwarder `/dashboard`에서 파트너 카운터/운송 입찰 링크 노출, 화주 카운터/내 운송 요청 링크 비노출 확인
- Playwright broker `/dashboard`에서 파트너 카운터/통관 입찰 링크 노출, 화주 카운터/내 통관 의뢰 링크 비노출 확인
- `npm run typecheck`
- `npm run lint`

### unapproved role dashboard guard

- 이전 작업은 승인된 역할별 대시보드 카운터와 workspace 링크를 분리한 P156.1이고, 이번 작업은 역할 미승인/미설정 상태에서 요청 생성·입찰 링크 대신 역할 설정/승인 확인을 먼저 보여준 P157.1이다.
- 승인된 marketplace 역할이 없으면 상단 action card는 `플랫폼 역할 설정` 또는 `플랫폼 역할 승인 대기`만 표시한다.
- 가입 시 선택한 역할 intent만 있는 경우에도 운영자 승인 전에는 요청 생성·입찰 action card를 열지 않는다.
- 화주/포워더/관세사 승인 역할 계정은 기존 역할별 대시보드 링크와 카운터가 유지되는지 브라우저로 확인했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npx vitest run features/dashboard/dashboard-home.test.ts`
- unit render에서 역할 없음 상태의 `플랫폼 역할 설정` 노출, 요청 생성/입찰 링크 비노출 확인
- Playwright requester/forwarder/broker `/dashboard` 승인 역할 회귀 확인
- `npm run typecheck`
- `npm run lint`

### dashboard marketplace regression

- 이전 작업은 역할 미승인/미설정 상태의 대시보드 action guard를 추가한 P157.1이고, 이번 작업은 P151-P157 대시보드·알림 변경 묶음이 역할별로 계속 정상 동작하는지 확인한 P158.1이다.
- dashboard next action anchor, notification href helper, role guard render 테스트를 함께 실행했다.
- requester/forwarder/broker 대시보드 브라우저 smoke에서 역할별 필수 문구와 비노출 문구를 확인했다.
- 각 역할의 다음 행동 링크가 `#request-bids`, `#opportunity-bid`, `#request-lifecycle`, `#request-completion` 계열 섹션 앵커를 포함하는지 확인했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `npx vitest run features/dashboard/dashboard-home.test.ts features/dashboard/marketplace-notification-inbox.test.ts`
- Playwright requester/forwarder/broker `/dashboard` role regression smoke
- `npm run typecheck`
- `npm run lint`

### operations users default detail reduction

- 이전 작업은 대시보드·알림 변경 묶음 회귀 검증인 P158.1이고, 이번 작업은 운영 관리 홈에서 역할 신청·검증·업체 상태 세부 패널을 한 번에 모두 펼치지 않고 우선순위 1개만 보여준 P159.1이다.
- 역할 신청, 회사 검증 증빙, 업체 운영 관리 패널을 `details`로 감쌌다.
- 처리 우선순위는 역할 신청 > 검증 증빙 > 업체 상태 순서로 계산하고, 해당하는 첫 패널만 기본으로 연다.
- 사용자 상세 관리는 기존처럼 문의 대응이 필요할 때만 펼치는 상태를 유지한다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright developer `/operations/users`에서 운영 세부 패널 중 기본 open 패널이 1개 이하인지 확인
- Playwright developer `/operations/users`에서 `user-management` detail이 기본으로 닫혀 있는지 확인
- `npm run typecheck`
- `npm run lint`

### operations health fallback next request refresh

- 이전 작업은 `/operations/users` 세부 패널 기본 노출을 줄인 P159.1이고, 이번 작업은 `/operations/health`의 정상 fallback 복사용 문구가 이미 끝난 사용자 관리가 아니라 다음 대상인 공지 관리로 이어지게 한 P160.1이다.
- 운영 점검에 실제 수정 후보가 없을 때 표시되는 `현재 우선 수정 없음` 카드의 요청 문구를 갱신했다.
- 상세 설명도 사용자 관리가 아니라 공지 관리 UX 정리로 넘어가면 된다고 맞췄다.
- 현재 local 운영 점검 화면에는 실제 수정 후보가 있어 fallback 카드가 화면에 노출되지 않으므로, 해당 경로는 소스 검증으로 확인했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- source check: 기존 `사용자 관리 화면을 대표용으로 더 단순화` 문구 비존재, 새 `공지 관리 화면을 대표용으로 더 단순화` 문구 존재 확인
- `npm run typecheck`
- `npm run lint`

### notice delete danger guard

- 이전 작업은 운영 점검의 다음 작업 fallback 문구를 공지 관리로 갱신한 P160.1이고, 이번 작업은 공지 관리에서 삭제 폼을 위험 작업 접힘 영역으로 분리한 P161.1이다.
- 공지를 펼쳐 수정할 때도 `공지 삭제` 버튼이 바로 보이지 않게 했다.
- 삭제는 `위험 작업`을 한 번 더 펼친 뒤, 삭제 확인값을 입력해야 접근할 수 있다.
- 숨김 처리로 충분한 공지는 삭제하지 않는다는 운영 기준 문구를 삭제 form 앞에 표시했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright developer `/operations/notices`에서 기본 상태의 `공지 삭제` 버튼 비노출 확인
- Playwright developer `/operations/notices`에서 공지 수정 영역을 펼친 후에도 `위험 작업`을 열기 전 `공지 삭제` 버튼 비노출 확인
- Playwright developer `/operations/notices`에서 `위험 작업`을 펼친 뒤 `공지 삭제` 버튼 노출 확인
- `npm run typecheck`
- `npm run lint`

### operations management regression

- 이전 작업은 공지 관리의 삭제 위험 작업을 접힘 영역으로 분리한 P161.1이고, 이번 작업은 운영 사용자·점검·공지 화면이 함께 정상 렌더링되고 접힘 정책이 유지되는지 확인한 P162.1이다.
- developer 계정으로 `/operations/users`, `/operations/health`, `/operations/notices`를 순서대로 열어 주요 heading과 핵심 문구를 확인했다.
- `/operations/users`에서 사용자 상세 관리가 기본으로 닫혀 있고, 역할 신청·검증·업체 상태 세부 패널 중 기본 open 패널이 1개 이하인지 확인했다.
- `/operations/notices`에서 공지 삭제 버튼이 기본으로 노출되지 않는지 확인했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright developer `/operations/users`, `/operations/health`, `/operations/notices` render smoke
- Playwright developer operations detail collapse checks
- `npm run typecheck`
- `npm run lint`

### operations request check order

- 이전 작업은 운영 사용자·점검·공지 화면 회귀 검증인 P162.1이고, 이번 작업은 운영 요청 상세 상단에 민감정보 없이 먼저 볼 카드 순서를 표시한 P163.1이다.
- `운영 확인 순서` 카드를 추가해 1단계 운영 병목, 2단계 견적 상태, 3단계 완료 후속 확인으로 이동하게 했다.
- 첫 단계는 현재 개선 프롬프트 target이 있으면 그 target으로, 없으면 파트너 노출·알림 요약으로 이동한다.
- 견적 상태와 완료 리포트 요약은 각각 `#request-bids`, `#completion-report-summary` 앵커로 연결했다.
- 새 migration, RLS 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright developer `/operations/requests/75000000-0000-4000-8000-000000000001`에서 `운영 확인 순서` 노출 확인
- Playwright에서 `#request-bids`, `#completion-report-summary` 앵커 링크 확인
- `npm run typecheck`
- `npm run lint`

### operations request detail regression

- 이전 작업은 운영 요청 상세 상단에 `운영 확인 순서`를 추가한 P163.1이고, 이번 작업은 운송·통관 운영 상세이 민감정보 보호 문구와 주요 운영 앵커를 계속 유지하는지 확인한 P164.1이다.
- developer 계정으로 운송 운영 상세와 통관 운영 상세 fixture를 모두 열었다.
- `운영 확인 순서`, 민감정보 비노출 안내, `파트너 노출·알림 운영 요약`, `견적 상태` 문구를 확인했다.
- `#request-bids`, `#completion-report-summary` 앵커 링크가 유지되는지 확인했다.
- 화면 텍스트에서 견적 금액/메시지 원문/파일명 원문 노출 label이 보이지 않는지 확인했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright developer `/operations/requests/75000000-0000-4000-8000-000000000001`
- Playwright developer `/operations/requests/75000000-0000-4000-8000-000000000002`
- `npm run typecheck`
- `npm run lint`

### operations full smoke regression

- 이전 작업은 운송·통관 운영 요청 상세 개별 검증인 P164.1이고, 이번 작업은 운영 사용자·점검·공지·운송 상세·통관 상세 화면 전체가 함께 정상 렌더링되는지 확인한 P165.1이다.
- developer 계정으로 `/operations/users`, `/operations/health`, `/operations/notices`를 확인했다.
- developer 계정으로 운송 운영 상세와 통관 운영 상세 fixture를 확인했다.
- 각 화면의 대표 heading과 핵심 운영 문구가 표시되는지 확인했다.
- 새 코드 변경은 없고, 문서 상태만 완료로 갱신했다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- Playwright developer operations full smoke 5 routes
- `npm run typecheck`
- `npm run lint`

### roadmap completed fixture status sync

- 이전 작업은 운영 화면 전체 smoke 검증인 P165.1이고, 이번 작업은 오래된 로드맵 상태 불일치를 바로잡은 P166.1이다.
- `P42.4 completion report e2e fixture implementation`은 fixture 원장, seed/auth/e2e 후속 작업이 이미 완료되어 있었지만 로드맵 상태가 `진행`으로 남아 있었다.
- P42.4 상태를 `완료`로 갱신했다.
- 남은 `진행` 표기는 상위 phase 또는 큰 범위 상태임을 확인했다.
- 새 코드 변경은 없다.
- 로컬 파일만 수정했고 원격 푸시, 배포는 하지 않았다.

검증:

- `rg -n "\\| .*진행|로컬 진행" docs/ROADMAP.md`
- `git diff --check`
