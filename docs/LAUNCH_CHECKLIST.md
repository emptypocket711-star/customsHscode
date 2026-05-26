# 런칭 전 운영 체크리스트

관련 기록:

- 작업일지: [WORK_LOG.md](./WORK_LOG.md)
- 주요 의사결정: [DECISIONS.md](./DECISIONS.md)

## 계정과 권한

- Supabase Auth를 기본 로그인으로 사용한다.
- `emptypocket711@gmail.com` 계정만 개발자 운영 메뉴 접근 권한을 갖는다.
- 일반 사용자, 회사 사용자, 관리자, 개발자 역할별 RLS 정책을 배포 전 재점검한다.
- 운영 메뉴는 법령/데이터 적재, 목적국 데이터 커버리지, source snapshot, publish, 대시보드 공지사항 관리 작업만 노출한다.
- 개발자 사용자 관리는 Supabase Auth 사용자를 페이지 단위로 모두 불러와 앱 프로필과 회사 정보를 연결해 보여준다.
- 개발자 테스트 로그인 링크는 `TEST_LOGIN_LINKS_ENABLED=true`일 때만 사용하고, 테스트 종료 후 즉시 비활성화한다.
- 대시보드 공지사항 작성, 수정, 삭제와 접속 시 자동 팝업 설정은 `emptypocket711@gmail.com` 개발자 계정만 수행한다.
- 문서 업로드/추출은 별도 worker와 파일 변환 환경이 준비되기 전까지 기본 사용자 동선에서 노출하지 않는다.
- 기업회원 가입은 사업자등록번호 숫자 10자리 형식만 검증한다. 국세청/공공데이터 사업자 상태조회 API는 런칭 후 `BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED=true`로 명시적으로 켤 때만 사용한다.
- 회원가입은 개인회원/기업회원 선택, 이메일 OTP 인증, 비밀번호 강도 검증, 필수 가입정보 입력이 모두 완료된 뒤에만 가입 완료 버튼을 활성화한다.

## 환경변수

- `.env.local`은 Git에 올리지 않는다.
- Vercel 환경변수에 Supabase URL, anon key, service role key, OpenAI API key, 관세청 API key를 직접 등록한다.
- service role key는 서버 전용 코드에서만 사용한다.
- 클라이언트 로그에 API key, 인보이스 원문, 개인정보, 원문 파일 경로를 남기지 않는다.
- 운영 도메인 `hsfinder.co.kr`과 Vercel production domain 연결 상태를 배포 후 확인한다.
- Supabase Auth SMTP는 운영용 Resend SMTP로 전환된 상태를 확인하고, OTP 템플릿에 실제 인증번호가 노출되는지 확인한다.
- Vercel Analytics는 앱 레이아웃에 포함되어 있어야 하며, 배포 후 실제 페이지 이동 이벤트가 수집되는지 확인한다.

## 데이터 갱신

- 관세청 품명 API는 실시간 사용자 조회가 아니라 월 1회 DB 적재 용도로 사용한다.
- 중복 적재는 source/version/checksum 기준으로 방지한다.
- 품명 검색은 GPT를 분류 인터뷰어로 사용한다. 확정도가 높은 단일 후보는 1개만 표시하고, 애매한 입력은 후보 나열보다 필요한 분기 질문을 먼저 표시한다.
- 공식 HS 데이터는 GPT 후보를 덮어쓰지 않고, 선택된 HS의 하위 세번 상세, 관세율, 수입요건, 내국세 조회에 사용한다.
- 대시보드 숫자는 `public.refresh_dashboard_metrics(current_date)`로 운영에서 갱신한다.
- 목적국 데이터 커버리지는 대시보드가 아니라 운영 페이지에서 확인한다.

## 성능과 비용

- 품명 검색은 GPT 정규화 결과를 캐시하고, 동일 입력 재조회는 캐시를 우선 사용한다.
- HS, 관세율, 요건 조회는 `basis_date`, `status`, `hsk_code` 계열 인덱스를 사용한다.
- 무거운 문서 업로드/OCR/엑셀 변환은 MVP 런칭 후 background job으로 분리한다.
- route별 rate limit을 적용해 GPT/API 비용 폭증을 막는다.

## 배포 전 검증

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- 핵심 테스트: 품명 후보, HS 조회, 관세율/FTA, 수입요건, RLS, basis-date 필터, 로그인/가입, 즐겨찾기, 조회이력
- 핵심 테스트: 품명 후보, HS 조회, 관세율/FTA, 수입요건, RLS, basis-date 필터, 로그인/가입, 즐겨찾기, 조회이력, 개발자 공지사항 관리, 공지 자동 팝업 1일 숨김
- 수동 확인: 4자리/6자리 조회는 폴더형 HS 네비게이터가 보이고 4자리, 6자리, 10자리 클릭 시 진행 상태가 표시된다.
- 수동 확인: 10자리 수입 조회는 모든국가/특정국가 모두 씨엘형 우선순위 정렬로 관세율을 보여준다.
- 수동 확인: 품명 검색에서 `애플워치`, `작업용 조끼`, `레이니 키보드`처럼 분기 조건이 필요한 입력은 부족 정보 질문을 우선 표시한다.
- 수동 확인: 일반 사용자는 문서 업로드 기능 대신 준비 중 안내만 볼 수 있고, 개발자만 내부 테스트 패널에 접근할 수 있다.
- AI 출력이 품목분류나 법령 적용을 확정 표현하지 않는지 확인한다.
- 수입/수출 모드가 서로 다른 화면과 데이터 범위를 쓰는지 확인한다.
- 배포 절차는 [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)를 따른다.
