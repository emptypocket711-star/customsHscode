# Service Request Completion Report Preview

이 문서는 완료 리포트를 PDF/프린트 리포트로 확장하기 전, 화면 미리보기와 출력 데이터 구조를 정의한다.

완료 리포트 preview는 법적 확정 리포트가 아니라 플랫폼 거래 종료 기록이다. HS, FTA, 요건, 세관장확인, 통합공고, 개별법령 내용이 포함되면 “예비 조회”와 “실제 신고 결과 기준”을 분리한다.

P41.1 기준 preview/read model 노출 범위 점검은 [SERVICE_REQUEST_COMPLETION_REPORT_READ_MODEL_REVIEW.md](./SERVICE_REQUEST_COMPLETION_REPORT_READ_MODEL_REVIEW.md)를 따른다.

권한별 preview 본문 자동 검증 계획은 [SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_AUTH_FIXTURE_PLAN.md](./SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW_AUTH_FIXTURE_PLAN.md)를 따른다.

## Preview Boundary

### 포함

- 리포트 상태: 초안, 제출, 화주 확인, 파트너 확인, 운영 검토, 잠금
- 요청 기준 정보: 요청 ID, 요청 유형, 수출입 방향, 기준일, 요청 상태
- 선정 견적 기준 정보: 선정 견적 ID, 파트너 회사 ID, 선정일, 견적 유형
- 완료 요약: 민감 원문을 제거한 1000자 이하 요약
- 정산 요약: 통화, 총액 존재 여부, 요약된 항목
- 운송 결과: B/L 또는 AWB 번호, 출발·도착일, 항구, 예외사항
- 통관 결과: 신고 결과 기준 HSK, 신고/수리일, 원산지, 세액 요약, 주의사항
- 최종 보관 서류: 문서 역할, 필수 여부, 연결 상태
- 출처 잠금: `source_snapshot.snapshot_version`, 요청 snapshot, selected bid snapshot, lookup snapshot source metadata
- 안전 문구: 예비진단, 담당자 검토 필요, HSK 확정 후 재조회 필요

### 제외

- 파일명
- 파일 다운로드 링크
- 선적서류 원문
- invoice line item 원문
- 견적 메시지 원문
- 질문·답변 원문
- 주민번호, 개인 연락처, 통장 정보, 내부 메모
- audit log에 저장하지 않는 신고번호/비용 상세 원문

## Preview Data Shape

서버에서 preview 전용 read model을 만든다. UI가 raw completion report row를 직접 해석하지 않는다.

```ts
type CompletionReportPreview = {
  reportId: string;
  requestId: string;
  requestType: "freight" | "clearance";
  status: "draft" | "submitted" | "requester_acknowledged" | "partner_acknowledged" | "operator_reviewed" | "locked";
  generatedAt: string;
  lockedAt: string | null;
  sourceSnapshotVersion: string | null;
  parties: {
    requesterCompanyId: string;
    selectedPartnerCompanyId: string;
  };
  requestBasis: {
    direction: "import" | "export";
    basisDate: string;
    requestStatus: string | null;
    sourceHsRequestId: string | null;
    hasSourceLookupSnapshot: boolean;
  };
  selectedBidBasis: {
    selectedBidId: string;
    bidType: "freight" | "clearance";
    selectedAt: string | null;
  };
  summary: {
    text: string | null;
    currency: string | null;
    finalAmount: number | null;
    settlementItems: Array<{ label: string; amount?: number; currency?: string }>;
  };
  freightResult?: {
    carrier?: string;
    blOrAwbNo?: string;
    departureDate?: string;
    arrivalDate?: string;
    originPort?: string;
    destinationPort?: string;
    exceptions: string[];
  };
  clearanceResult?: {
    declarationNo?: string;
    acceptedAt?: string;
    releasedAt?: string;
    declaredHskCode?: string;
    originCountryCode?: string;
    ftaAgreementName?: string;
    taxSummary: Array<{ label: string; amount: number; currency: string }>;
    cautions: string[];
  };
  archiveDocuments: Array<{
    documentRole: string;
    requiredForArchive: boolean;
    linked: boolean;
  }>;
  sourceLocks: Array<{
    sourceName: string;
    sourceUrl?: string;
    sourceVersion?: string;
    effectiveFrom?: string;
    effectiveTo?: string | null;
    publishedAt?: string;
    retrievedAt?: string;
    checksum?: string;
  }>;
  safetyNotices: string[];
};
```

## Rendering Sections

1. Header
   - HS FINDER 완료 리포트
   - 요청 ID, 리포트 ID, 상태, 생성일, 잠금일
2. 거래 기준
   - 요청 유형, 방향, 기준일, selected bid 기준
3. 완료 요약
   - summary, currency, final amount
   - 금액이 없으면 “정산 금액 미기재”
4. 업무 결과
   - freight 또는 clearance result
   - 통관 결과는 “신고 결과 기준” 표시
5. 최종 보관 서류
   - 역할별 연결 상태와 필수 여부
   - 파일명/다운로드 없음
6. 출처 잠금
   - source snapshot version
   - 공식 출처 metadata가 있으면 source locks로 표시
7. 안전 고지
   - 예비진단과 실제 신고 결과 구분
   - 담당자 검토 필요
   - 법적 확정·보장 아님

## Status-Based Export Rules

| Status | Preview | Print/PDF |
| --- | --- | --- |
| `draft` | 가능 | 워터마크 “초안” 필수 |
| `submitted` | 가능 | 워터마크 “상대방 확인 필요” |
| `requester_acknowledged` | 가능 | 워터마크 “파트너 확인 또는 운영 검토 필요” |
| `partner_acknowledged` | 가능 | 워터마크 “화주 확인 또는 운영 검토 필요” |
| `operator_reviewed` | 가능 | “운영 검토 완료, 잠금 전” 표시 |
| `locked` | 가능 | 정식 보관본 |
| `voided` | 운영자만 | 출력 비권장 |

MVP에서는 `locked` 전에도 preview는 가능하게 하되, 출력물에는 상태 워터마크를 명확히 표시한다.

## Source Locks

`source_snapshot.lookup.source_lookup_snapshot`에 공식 출처 metadata가 포함된 경우에만 source locks로 올린다.

source lock 후보 필드:

- `source_name`
- `source_url`
- `source_version`
- `effective_from`
- `effective_to`
- `published_at`
- `retrieved_at`
- `checksum`

공식 출처 metadata가 없으면 “요청 생성 시점의 예비 조회 snapshot은 있으나 공식 출처 잠금 metadata는 없음”으로 표시한다.

## Safety Copy

기본 고지:

- “본 완료 리포트는 플랫폼 거래 종료 기록입니다.”
- “HS, FTA, 요건, 인허가 내용은 예비진단 또는 실제 신고 결과 기준으로 구분됩니다.”
- “담당자 검토 없이 법적 확정, 요건 없음 확정, FTA 적용 보장으로 사용할 수 없습니다.”
- “세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다.”

금지 표현:

- “법적 확정”
- “요건 없음 확정”
- “FTA 적용 보장”
- “HSK 확정”
- “통관 가능 확정”

## Implementation Rails

- P38.3 preview read model
  - `buildCompletionReportPreview` pure helper
  - source snapshot parsing
  - raw text redaction tests
- P38.4 preview UI route skeleton
  - `/requests/{type}/{id}/completion-report/preview` 또는 modal entry
  - print CSS
  - status watermark
- P38.5 operations preview link
  - 운영 상세에서 preview 진입
  - locked 여부와 status warning 표시
- P38.6 PDF export decision
  - browser print first
  - PDF generation library는 preview가 안정된 뒤 선택

## Validation

- preview helper는 파일명, 질문 원문, 답변 원문, 견적 메시지 원문을 받지 않는다.
- status별 워터마크가 누락되지 않는다.
- source lock metadata가 없을 때도 안전 문구가 표시된다.
- 통관 결과 HSK는 “신고 결과 기준”으로만 표시한다.
- 금지 표현이 summary/source snapshot에 있으면 locked report 출력이 차단되거나 경고된다.
