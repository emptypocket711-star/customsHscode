# Preview Migration Runbook

Preview DB migration은 아래 순서로만 적용한다.

1. 적용할 파일을 하나 고른다.

```bash
npm run db:preview-migration:plan -- --file supabase/migrations/20260603004000_bid_submission_audit_snapshot.sql
```

2. 출력된 `dryRun` 명령을 먼저 실행한다. 반드시 `begin; ... rollback;` 형태여야 한다.

3. dry-run이 통과하면 출력된 `apply` 명령을 실행한다.

4. 적용 직후 DB health를 확인한다.

```bash
vercel env run -e preview -- npm run health:db
```

5. marketplace schema smoke를 확인한다.

```bash
vercel env run -e preview -- npm run smoke:marketplace-schema
```

6. UI 또는 거래 흐름에 영향이 있으면 staging regression을 실행한다.

```bash
vercel env run -e preview -- npm run smoke:staging:suite -- https://your-preview-url.vercel.app
```

## Rules

- `DATABASE_URL`, service-role key, bypass secret 값은 출력하거나 문서에 남기지 않는다.
- 여러 migration을 한 번에 묶지 말고 파일 단위로 dry-run, apply, health를 반복한다.
- 적용된 Supabase migration은 직접 rollback하지 않는다. 문제가 있으면 후속 migration으로 수정한다.
- schema 변경 후에는 `health:db`에서 blocker 0개를 확인한다.
- marketplace 요청, 입찰, 알림, 완료 리포트 관련 migration은 최소 `smoke:marketplace-schema`와 관련 E2E를 함께 실행한다.
