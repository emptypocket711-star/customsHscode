# Service Request Completion Report Read Model Review

이 문서는 P41.1 기준 완료 리포트 preview/read model의 노출 범위와 숨김 범위를 점검한 기록이다.

## Current Boundary

현재 preview helper는 raw completion report row를 UI가 직접 해석하지 않게 막는 중간 read model이다.

현재 포함:

- 리포트 ID, 요청 ID, 요청 유형, 상태, 생성/잠금 시각
- 요청 기준일, 수출입 방향, source HS request id, 조회 snapshot 존재 여부
- selected bid id, selected bid type, selected at
- 완료 요약, 통화, 최종 금액, 정산 항목 요약
- 운송 결과: 선사/운송사, B/L 또는 AWB 번호, 출발/도착일, 항구, 예외사항
- 통관 결과: 신고번호, 신고 결과 HSK, 원산지, 신고/수리일, FTA 명칭, 세액 요약, 주의사항
- 최종 보관 서류 role, 필수 여부
- source lock metadata: source name, url, version, effective from/to, retrieved at, checksum
- 안전 고지와 상태 watermark

현재 제외:

- 파일명
- 파일 다운로드 링크
- 선적서류 원문
- invoice line item 원문
- 견적 메시지 원문
- 질문·답변 원문
- audit log 원문
- 주민번호, 개인 연락처, 계좌 정보, 내부 운영 메모

## Security Review

유지해야 할 규칙:

- preview input type이 파일명, 질문 원문, 답변 원문, 견적 메시지 원문을 받지 않는 구조는 유지한다.
- 운영 상세도 preview 링크와 요약만 제공하고 파일명·원문·다운로드 링크를 표시하지 않는다.
- source URL은 `http://` 또는 `https://`만 링크로 표시한다. `file://`과 로컬 경로는 링크로 노출하지 않는다.
- 통관 결과 HSK는 “신고 결과 기준”으로만 표시한다.
- `locked` 이전 상태는 보관본이 아니라 미리보기로 표시한다.

주의할 점:

- 신고번호와 B/L 또는 AWB 번호는 거래 완료 기록에는 필요하지만 영업상 민감할 수 있다. preview route는 요청 당사자, 선정 파트너, 운영자만 접근해야 한다.
- 금액 상세는 settlement item label/amount/currency만 표시한다. 세금계산서, 계좌, 청구서 원문은 preview에 넣지 않는다.

## Coverage Gaps

1. `published_at` 누락
   - `SERVICE_REQUEST_COMPLETION_REPORT_PREVIEW.md`의 source lock 후보에는 `published_at`이 있으나 helper type과 UI에는 아직 없다.
   - 다음 코드 작업에서 `publishedAt`을 추가해 source lock metadata와 표시를 맞춘다.

2. snapshot version 미표시
   - `source_snapshot.snapshot_version`은 source-locked report 기반을 설명하는 중요한 값이지만 preview 모델에는 없다.
   - 다음 작업 후보: `sourceSnapshotVersion`을 preview에 추가하고 출처 잠금 카드 상단에 표시한다.

3. request status 미표시
   - source snapshot에는 요청 상태가 들어가지만 preview의 거래 기준에는 현재 요청 유형, 방향, 기준일만 표시한다.
   - 완료 리포트가 어떤 lifecycle 상태에서 생성됐는지 보여주려면 `requestStatus`를 read model에 포함한다.

4. selected partner company id 표시 위치
   - preview model에는 parties가 있으나 UI에는 아직 표시하지 않는다.
   - 사용자에게 회사 UUID를 그대로 보여주는 것은 UX 가치가 낮으므로 보류한다. 회사명 read model이 생기기 전까지는 내부 model에만 둔다.

5. voided 상태
   - preview input은 `voided`를 제외한다.
   - 운영자용 voided preview가 필요해지면 별도 route와 경고 UI로 분리한다.

## Next Code Recommendation

P41.2에서 read model에 source snapshot coverage를 보강한다.

- `CompletionReportPreview.requestBasis.requestStatus` 추가
- `CompletionReportPreview.sourceSnapshotVersion` 추가
- `CompletionReportPreview.sourceLocks[].publishedAt` 추가
- source lock 테스트에 `published_at`을 추가
- preview UI의 거래 기준/출처 잠금 섹션에 위 값을 한국어 라벨로 표시

새 migration은 필요 없다. 기존 `source_snapshot` JSON에서 읽어오는 표시/read model 작업이다.
