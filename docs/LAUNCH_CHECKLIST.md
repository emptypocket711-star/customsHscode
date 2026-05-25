# 런칭 전 운영 체크리스트

## 계정과 권한

- Supabase Auth를 기본 로그인으로 사용한다.
- `emptypocket711@gmail.com` 계정만 개발자 운영 메뉴 접근 권한을 갖는다.
- 일반 사용자, 회사 사용자, 관리자, 개발자 역할별 RLS 정책을 배포 전 재점검한다.
- 운영 메뉴는 법령/데이터 적재, 목적국 데이터 커버리지, source snapshot, publish 작업만 노출한다.
- 문서 업로드/추출은 별도 worker와 파일 변환 환경이 준비되기 전까지 기본 사용자 동선에서 노출하지 않는다.
- 기업회원 가입은 사업자등록번호 숫자 10자리 형식만 검증한다. 국세청/공공데이터 사업자 상태조회 API는 런칭 후 `BUSINESS_REGISTRATION_STATUS_LIVE_ENABLED=true`로 명시적으로 켤 때만 사용한다.

## 환경변수

- `.env.local`은 Git에 올리지 않는다.
- Vercel 환경변수에 Supabase URL, anon key, service role key, OpenAI API key, 관세청 API key를 직접 등록한다.
- service role key는 서버 전용 코드에서만 사용한다.
- 클라이언트 로그에 API key, 인보이스 원문, 개인정보, 원문 파일 경로를 남기지 않는다.

## 데이터 갱신

- 관세청 품명 API는 실시간 사용자 조회가 아니라 월 1회 DB 적재 용도로 사용한다.
- 중복 적재는 source/version/checksum 기준으로 방지한다.
- 품명 검색 화면은 GPT가 제시한 HS4/HS6/HSK 후보를 우선 표시한다. 공식 HS 데이터는 하위 세번 상세, 관세율, 수입요건, 내국세 조회에 사용한다.
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
- AI 출력이 품목분류나 법령 적용을 확정 표현하지 않는지 확인한다.
- 수입/수출 모드가 서로 다른 화면과 데이터 범위를 쓰는지 확인한다.
- 배포 절차는 [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)를 따른다.
