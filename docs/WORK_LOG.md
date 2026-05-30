# Work Log

이 문서는 HS FINDER 개발 중 실제로 수행한 작업, 검증 결과, 커밋을 날짜별로 남긴다.

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

검증:

- `npm test -- server/repositories/operations-issue.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/repositories/operations-issue.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/repositories/operations-issue.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
- `npm test -- server/repositories/operations-issue.repository.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `vercel env run -e production -- npm run health:db`
- `SMOKE_BASE_URL=https://hsfinder.co.kr npm run smoke:production`
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
