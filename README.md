# Customs AI Codex Harness

관세·FTA·수출입요건 진단 SaaS를 Codex로 빠르게 만들기 위한 하네스 패키지입니다.

## 목표 제품

사용자가 아래 방식 중 하나로 진입하면 조회 결과 또는 수입/수출 진단 리포트를 생성합니다.

1. HS CODE/품명 통합 조회
2. 선적서류 조회

통합 조회 화면은 HS4, HS6, HSK10, 품명을 같은 입력창에서 받아 품목번호, 관세율, 표준품명, 수입요건, 수출상대국 관세율을 표시합니다. HSK와 HS6 값은 클릭해서 해당 조회 결과로 이동합니다.

진단 리포트는 다음을 포함합니다.

- HS 후보 및 판단근거
- 기본세율 / WTO 세율 / FTA 협정세율
- FTA C/O 발급 가능성
- 원산지결정기준
- 직접운송 검토
- 수입요건 / 수출요건
- 요건 취득방법
- 전략물자 예비 리스크
- 고객 요청자료
- 담당자 검토 포인트
- 조회기준일 및 데이터 출처

## 권장 스택

- Next.js App Router
- TypeScript
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- pgvector
- Tailwind CSS
- shadcn/ui
- OpenAI API 또는 별도 LLM Provider
- 크론/잡 큐: Supabase Edge Functions, GitHub Actions, 또는 별도 Worker

## 설치 위치

이 패키지의 내용을 새 프로젝트 루트에 복사하세요.

```bash
customs-ai/
  AGENTS.md
  PLANS.md
  docs/
  .codex/
  skills/
```

## Codex 시작 명령 예시

프로젝트 루트에서 Codex를 실행한 뒤 `CODEX_START_PROMPT.md` 내용을 붙여넣으세요.

```bash
codex
```

또는 초기 부트스트랩만 명령으로 실행합니다.

```bash
codex "Read AGENTS.md, PLANS.md, docs/PRODUCT_SPEC.md, docs/ARCHITECTURE.md, then implement Phase 1 from docs/ROADMAP.md. Create a Next.js + Supabase MVP for HS direct lookup, product-name HS recommendation, and import/export diagnosis skeleton."
```

## 개발 순서

1. Phase 0: 프로젝트 초기화
2. Phase 1: DB 스키마 + Supabase RLS
3. Phase 2: HS CODE/품명 통합 조회
4. Phase 3: 품명 기반 HSK 매칭
5. Phase 4: 수입진단
6. Phase 5: 수출진단
7. Phase 6: 법령/세율/요건 업데이트 엔진
8. Phase 7: 선적서류 업로드/OCR
9. Phase 8: 리포트 PDF/공유
10. Phase 9: 결제/과금

## 중요한 원칙

이 프로젝트는 AI가 법령을 기억해서 답변하는 앱이 아닙니다.

공식 원천 데이터 → 버전 저장 → 기준일 필터링 → 룰엔진 계산 → AI 설명문 생성 → 담당자 검토 승인 구조로 구현해야 합니다.

## 조회 데이터 적용

생성된 HS/표준품명/관세율/수입요건/국가별 관세율 seed를 DB에 적용하려면 PostgreSQL 접속 문자열과 `psql`이 필요합니다.

```bash
DATABASE_URL='postgresql://postgres:...@...:5432/postgres' npm run db:apply-lookup-seeds
```

신규 DB에는 마이그레이션까지 함께 적용합니다.

```bash
APPLY_MIGRATIONS=1 DATABASE_URL='postgresql://postgres:...@...:5432/postgres' npm run db:apply-lookup-seeds
```

내국세 관련 통계부호 코드표 seed는 API019로 생성합니다.

```bash
CUSTOMS_API_STATS_CODE_SERVICE_KEY='...' python3 scripts/generate_customs_statistical_codes_seed.py
```
