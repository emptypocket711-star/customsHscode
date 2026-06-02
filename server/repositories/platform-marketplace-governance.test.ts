import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const marketplaceMigrationPath = "supabase/migrations/20260531012000_platform_marketplace_schema.sql";
const marketplaceNotificationPreferencesMigrationPath =
  "supabase/migrations/20260603001000_marketplace_notification_preferences.sql";

function readMarketplaceMigration() {
  return readFileSync(join(process.cwd(), marketplaceMigrationPath), "utf8");
}

function readMarketplaceNotificationPreferencesMigration() {
  return readFileSync(join(process.cwd(), marketplaceNotificationPreferencesMigrationPath), "utf8");
}

function policyBlock(sql: string, policyName: string) {
  const start = sql.indexOf(`create policy "${policyName}"`);
  expect(start, `${policyName} policy was not found`).toBeGreaterThanOrEqual(0);

  const nextPolicy = sql.indexOf("create policy", start + 1);
  return sql.slice(start, nextPolicy === -1 ? undefined : nextPolicy);
}

describe("platform marketplace migration governance", () => {
  it("removes broad profile self-updates and limits user-editable profile fields", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain('drop policy if exists "users update own limited profile" on public.profiles');
    expect(sql).toContain("revoke update on public.profiles from authenticated");
    expect(sql).toContain("grant update (full_name, preferred_locale) on public.profiles to authenticated");
    expect(sql).toContain("create or replace function public.update_own_profile_settings");
    expect(sql).not.toContain('create policy "users update own limited profile" on public.profiles');
  });

  it("keeps marketplace role assignment out of direct company-admin RLS writes", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("create policy \"company reads own party types or staff reads all\"");
    expect(sql).toContain("create policy \"developer manages company party types\"");
    expect(sql).toContain("profile.id = p_actor_id");
    expect(sql).toContain("profile.role = 'developer'::public.user_role");
    expect(sql).toContain("v_company public.companies%rowtype");
    expect(sql).toContain("for update");
    expect(sql).toContain("숨김·정지 또는 차단 상태의 회사에는 플랫폼 역할을 승인할 수 없습니다.");
    expect(sql).toContain("포워더 또는 관세사무소 역할은 회사 검증 승인 후 반영할 수 있습니다.");
    expect(sql).toContain("create or replace function public.review_company_party_type_request");
    expect(sql).toContain("auth.role() <> 'service_role'");
    expect(sql).toContain("insert into public.company_party_types");
    expect(sql).toContain("from unnest(v_request.requested_party_types)");
    expect(sql).toContain("'company_party_type_request_reviewed'");
    expect(sql).toContain("grant execute on function public.review_company_party_type_request");
    expect(sql).toContain("create table if not exists public.company_party_type_requests");
    expect(sql).toContain("alter table public.company_party_type_requests enable row level security");
    expect(sql).toContain("grant select on\n  public.company_party_types,\n  public.company_party_type_requests");
    expect(sql).toContain("grant insert on public.company_party_type_requests to authenticated");
    expect(sql).toContain("create policy \"company admin creates own party type requests\"");
    expect(sql).toContain("requested_by = auth.uid()");
    expect(sql).toContain("and status = 'submitted'");
    expect(sql).toContain("and review_note is null");
    expect(sql).toContain("and reviewed_by is null");
    expect(sql).toContain("and reviewed_at is null");
    expect(sql).toContain("create policy \"staff manages company party type requests\"");
    expect(sql).not.toContain("company admin manages own party types");
    expect(sql).not.toContain("create policy \"staff manages company party types\"");
    expect(sql).not.toContain("grant update on public.company_party_type_requests to authenticated");
    expect(sql).not.toContain("when 'customs_broker' then 'customs_broker'");
    expect(sql).not.toContain("when 'forwarder' then 'forwarder'");
  });

  it("blocks suspended or blocked matched partners from marketplace read paths", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("create or replace function public.is_company_active_for_marketplace");
    expect(sql).toContain("company.verification_status not in ('suspended', 'blocked')");
    expect(sql).toContain("request.deadline_at > now()");

    const serviceRequestReader = sql.slice(
      sql.indexOf("create or replace function public.can_read_service_request"),
      sql.indexOf("create or replace function public.can_bid_on_service_request")
    );
    expect(serviceRequestReader).toContain("'open'::public.service_request_status");
    expect(serviceRequestReader).toContain("'completed'::public.service_request_status");
    expect(serviceRequestReader).toContain("public.is_company_active_for_marketplace(matched.partner_company_id)");
    expect(serviceRequestReader).toContain("public.is_company_active_for_marketplace(bid.bidder_company_id)");
    expect(serviceRequestReader).toContain("request.status in (\n              'open'::public.service_request_status,\n              'bids_received'::public.service_request_status\n            )");
    expect(serviceRequestReader).toContain("bid.status = 'selected'::public.service_bid_status");
    expect(serviceRequestReader).toContain("request.request_type = 'clearance'::public.service_request_type and public.current_company_has_party_type('customs_broker'::public.marketplace_party_type)");

    const documentReader = sql.slice(
      sql.indexOf("create or replace function public.can_read_service_request_document"),
      sql.indexOf("create or replace function public.can_read_service_request_storage_object")
    );
    expect(documentReader).toContain("public.is_company_active_for_marketplace(matched.partner_company_id)");
    expect(documentReader).toContain("public.is_company_active_for_marketplace(bid.bidder_company_id)");
    expect(documentReader).toContain("matched.interest_status = 'interested'");
    expect(documentReader).toContain("document.visibility = 'matched_partner_after_interest'");
    expect(documentReader).toContain("request.status in (\n            'open'::public.service_request_status,\n            'bids_received'::public.service_request_status\n          )");
    expect(documentReader).toContain("bid.status = 'selected'");

    const bidReader = sql.slice(
      sql.indexOf("create or replace function public.can_read_service_bid"),
      sql.indexOf("create or replace function public.select_service_bid")
    );
    expect(bidReader).toContain("bid.status <> 'hidden'::public.service_bid_status");

    const matchPolicy = policyBlock(sql, "requester and partner read own matches");
    expect(matchPolicy).toContain("public.is_company_active_for_marketplace(partner_company_id)");

    const questionPolicy = policyBlock(sql, "requester and bidder read request questions");
    expect(questionPolicy).toContain("public.is_company_active_for_marketplace(bidder_company_id)");
  });

  it("requires request ownership for marketplace document metadata and storage uploads", () => {
    const sql = readMarketplaceMigration();

    const insertPolicy = policyBlock(sql, "requester inserts own request documents");
    expect(insertPolicy).toContain("request.id = service_request_documents.request_id");
    expect(insertPolicy).toContain("request.requester_company_id = public.current_company_id()");
    expect(insertPolicy).toContain("request.requester_company_id = service_request_documents.requester_company_id");
    expect(insertPolicy).toContain("'draft'::public.service_request_status");
    expect(insertPolicy).toContain("'partner_selected'::public.service_request_status");
    expect(sql).not.toContain('create policy "requester updates own request documents"');
    expect(sql).not.toContain('create policy "requester deletes own request documents"');

    const storagePolicy = policyBlock(sql, "requester uploads service request document storage");
    expect(storagePolicy).toContain("public.is_uuid_text(split_part(name, '/', 1))");
    expect(storagePolicy).toContain("public.is_uuid_text(split_part(name, '/', 2))");
    expect(storagePolicy).toContain("from public.service_request_documents document");
    expect(storagePolicy).toContain("document.storage_path = name");
    expect(storagePolicy).toContain("document.uploaded_by = auth.uid()");
    expect(storagePolicy).toContain("request.id = split_part(name, '/', 2)::uuid");
    expect(storagePolicy).toContain("request.requester_company_id = public.current_company_id()");
    expect(storagePolicy).toContain("'bids_received'::public.service_request_status");
    expect(sql).not.toContain('create policy "requester deletes own service request document storage"');
  });

  it("locks company verification documents to company admins and metadata-backed storage reads", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("create or replace function public.can_read_company_verification_storage_object");
    expect(sql).toContain("document.storage_path = p_storage_path");

    const selectPolicy = policyBlock(sql, "company admin reads own verification documents or staff reads all");
    expect(selectPolicy).toContain("public.is_company_admin()");

    const insertPolicy = policyBlock(sql, "company admin uploads own verification documents");
    expect(insertPolicy).toContain("public.is_company_admin()");
    expect(insertPolicy).toContain("public.is_uuid_text(split_part(storage_path, '/', 1))");
    expect(insertPolicy).toContain("split_part(storage_path, '/', 2) = id::text");
    expect(insertPolicy).toContain("storage_bucket = 'company-verification-documents'");

    const storageReadPolicy = policyBlock(sql, "company reads own verification document storage");
    expect(storageReadPolicy).toContain("public.can_read_company_verification_storage_object(bucket_id, name)");
    expect(storageReadPolicy).not.toContain("split_part(name, '/', 1)::uuid = public.current_company_id()");

    const storageUploadPolicy = policyBlock(sql, "company uploads own verification document storage");
    expect(storageUploadPolicy).toContain("public.is_uuid_text(split_part(name, '/', 1))");
    expect(storageUploadPolicy).toContain("document.storage_path = name");
    expect(storageUploadPolicy).toContain("document.uploaded_by = auth.uid()");
    expect(storageUploadPolicy).toContain("split_part(name, '/', 2) = document.id::text");
    expect(storageUploadPolicy).toContain("public.is_company_admin()");
  });

  it("keeps company verification review policy aligned with developer-only server actions", () => {
    const sql = readMarketplaceMigration();

    expect(sql).not.toContain('create policy "staff reviews verification documents"');
    const reviewPolicy = policyBlock(sql, "developer reviews verification documents");
    expect(reviewPolicy).toContain("public.current_user_role() = 'developer'::public.user_role");
  });

  it("keeps constrained workflow mutations behind RPCs", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("create or replace function public.select_service_bid");
    expect(sql).toContain("create or replace function public.set_service_request_partner_interest");
    expect(sql).toContain("create or replace function public.ask_service_request_question");
    expect(sql).toContain("create or replace function public.answer_service_request_question");
    expect(sql).toContain("create or replace function public.create_freight_request_draft");
    expect(sql).toContain("create or replace function public.create_clearance_request_draft");
    expect(sql).toContain("create or replace function public.publish_freight_request");
    expect(sql).toContain("create or replace function public.publish_clearance_request");
    expect(sql).toContain("create or replace function public.submit_freight_bid");
    expect(sql).toContain("create or replace function public.submit_clearance_bid");
    expect(sql).toContain("create or replace function public.start_selected_service_request");
    expect(sql).toContain("create or replace function public.complete_selected_service_request");
    expect(sql).toContain("create or replace function public.submit_service_request_feedback");
    expect(sql).not.toContain("matched partner updates own interest");
    expect(sql).not.toContain("requester answers request questions");
    expect(sql).not.toContain("matched partners ask request questions");
    expect(sql).not.toContain("verified matched partners insert bids");
    expect(sql).not.toContain("bidder updates own active bids");
    expect(sql).not.toContain("requester updates own draft or staff updates service requests");
  });

  it("creates freight request drafts through a single transactional RPC", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.create_freight_request_draft");
    const end = sql.indexOf("grant execute on function public.create_freight_request_draft", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("insert into public.service_requests");
    expect(rpc).toContain("insert into public.freight_request_details");
    expect(rpc).toContain("'freight_request_draft_created'");
    expect(rpc).toContain("v_company_id := public.current_company_id()");
    expect(rpc).toContain("'draft'");
  });

  it("keeps requester service request status changes and published freight detail edits out of direct RLS", () => {
    const sql = readMarketplaceMigration();

    const insertPolicy = policyBlock(sql, "requester inserts own service requests");
    expect(insertPolicy).toContain("status = 'draft'::public.service_request_status");

    const staffUpdatePolicy = policyBlock(sql, "staff updates service requests");
    expect(staffUpdatePolicy).toContain("public.is_staff_or_admin()");

    const detailUpdatePolicy = policyBlock(sql, "requester updates own draft freight details");
    expect(detailUpdatePolicy).toContain("request.status = 'draft'::public.service_request_status");
    expect(sql).not.toContain('create policy "requester manages own freight details"');

    expect(sql).not.toContain('create policy "requester deletes own request documents"');
  });

  it("creates clearance request drafts through a single audited RPC and keeps detail edits draft-only", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.create_clearance_request_draft");
    const end = sql.indexOf("grant execute on function public.create_clearance_request_draft", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("insert into public.service_requests");
    expect(rpc).toContain("'clearance'");
    expect(rpc).toContain("insert into public.clearance_request_details");
    expect(rpc).toContain("not public.is_company_active_for_marketplace(v_company_id)");
    expect(rpc).toContain("p_hsk_code");
    expect(rpc).toContain("p_estimated_declaration_count is not null and p_estimated_declaration_count <= 0");
    expect(rpc).toContain("'clearance_request_draft_created'");

    const detailInsertPolicy = policyBlock(sql, "requester inserts own draft clearance details");
    expect(detailInsertPolicy).toContain("request.status = 'draft'::public.service_request_status");
    expect(detailInsertPolicy).toContain("request.request_type = 'clearance'::public.service_request_type");

    const detailUpdatePolicy = policyBlock(sql, "requester updates own draft clearance details");
    expect(detailUpdatePolicy).toContain("request.status = 'draft'::public.service_request_status");
    expect(detailUpdatePolicy).toContain("request.request_type = 'clearance'::public.service_request_type");

    const detailDeletePolicy = policyBlock(sql, "requester deletes own draft clearance details");
    expect(detailDeletePolicy).toContain("request.status = 'draft'::public.service_request_status");
    expect(detailDeletePolicy).toContain("request.request_type = 'clearance'::public.service_request_type");

    expect(sql).not.toContain('create policy "requester manages own clearance details"');
  });

  it("grants marketplace read privileges without opening direct request mutations", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("grant select on");
    expect(sql).toContain("public.service_requests");
    expect(sql).toContain("public.clearance_request_details");
    expect(sql).toContain("to authenticated");
    expect(sql).toContain("grant insert, delete on public.service_request_documents to authenticated");
    expect(sql).not.toContain("grant insert on public.service_requests to authenticated");
    expect(sql).not.toContain("grant update on public.service_requests to authenticated");
  });

  it("keeps marketplace list and detail query indexes aligned with repository access patterns", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("create index if not exists service_requests_requester_type_created_idx");
    expect(sql).toContain("on public.service_requests(requester_company_id, request_type, created_at desc)");
    expect(sql).toContain("create index if not exists service_request_partner_matches_request_idx");
    expect(sql).toContain("on public.service_request_partner_matches(request_id, partner_company_id)");
    expect(sql).toContain("create index if not exists service_bids_request_type_amount_idx");
    expect(sql).toContain("on public.service_bids(request_id, bid_type, total_amount, created_at)");
    expect(sql).toContain("create index if not exists service_request_questions_request_idx");
    expect(sql).toContain("on public.service_request_questions(request_id, created_at)");
    expect(sql).toContain("create index if not exists service_request_feedbacks_reviewer_request_idx");
    expect(sql).toContain("on public.service_request_feedbacks(reviewer_company_id, request_id, created_at desc)");
  });

  it("stores marketplace notification deliveries with per-kind service-role idempotency", () => {
    const sql = readMarketplaceMigration();

    expect(sql).toContain("create table if not exists public.marketplace_notification_deliveries");
    expect(sql).toContain("delivery_key text not null unique");
    expect(sql).toContain("notification_kind text not null check (notification_kind in ('initial', 'deadline_reminder', 'digest'))");
    expect(sql).toContain("status text not null default 'claimed' check (status in ('claimed', 'sent', 'skipped', 'retryable_failed', 'failed'))");
    expect(sql).toContain("attempt_count integer not null default 1 check (attempt_count > 0)");
    expect(sql).toContain("next_retry_at timestamptz");
    expect(sql).toContain("read_at timestamptz");
    expect(sql).toContain("read_by uuid references auth.users(id)");
    expect(sql).toContain("create index if not exists marketplace_notification_deliveries_unread_partner_idx");
    expect(sql).toContain("alter table public.marketplace_notification_deliveries enable row level security");
    expect(sql).toContain("grant select, insert, update on public.marketplace_notification_deliveries to service_role");
    expect(sql).toContain("create or replace function public.claim_marketplace_notification_delivery");
    expect(sql).toContain("create or replace function public.mark_marketplace_notification_delivery_read");
    expect(sql).toContain("auth.role() <> 'service_role'");
    expect(sql).toContain("v_request.status not in ('open', 'bids_received')");
    expect(sql).toContain("v_request.deadline_at is null or v_request.deadline_at <= now()");
    expect(sql).toContain("v_match.interest_status = 'declined'");
    expect(sql).toContain("not public.is_company_verified_for_marketplace(v_match.partner_company_id)");
    expect(sql).toContain("on conflict (delivery_key) do nothing");
    expect(sql).toContain("grant execute on function public.claim_marketplace_notification_delivery");
    expect(sql).toContain("grant execute on function public.mark_marketplace_notification_delivery_read(uuid) to authenticated");
    expect(sql).toContain("'marketplace_notification_delivery_read'");
    expect(sql).toContain("delivery.partner_company_id = v_actor_company_id");
    expect(sql).toContain("delivery.channel = 'in_app'");

    const staffReadPolicy = policyBlock(sql, "staff reads marketplace notification deliveries");
    expect(staffReadPolicy).toContain("public.is_staff_or_admin()");

    const serviceRolePolicy = policyBlock(sql, "service role manages marketplace notification deliveries");
    expect(serviceRolePolicy).toContain("auth.role() = 'service_role'");
  });

  it("requires explicit user-level email opt-in for marketplace notification preferences", () => {
    const sql = readMarketplaceNotificationPreferencesMigration();

    expect(sql).toContain("create table if not exists public.marketplace_notification_preferences");
    expect(sql).toContain("profile_id uuid not null references public.profiles(id) on delete cascade");
    expect(sql).toContain("channel text not null check (channel in ('email'))");
    expect(sql).toContain("notification_kind text not null check (notification_kind in ('initial', 'deadline_reminder'))");
    expect(sql).toContain("enabled boolean not null default false");
    expect(sql).toContain("unique(profile_id, channel, notification_kind)");
    expect(sql).toContain("alter table public.marketplace_notification_preferences enable row level security");
    expect(sql).toContain("grant select, insert, update, delete on public.marketplace_notification_preferences to authenticated");
    expect(sql).toContain("grant select, insert, update, delete on public.marketplace_notification_preferences to service_role");

    expect(sql).toContain('drop policy if exists "users read own marketplace notification preferences or staff re"');

    const readPolicy = policyBlock(sql, "users read own marketplace notification prefs or staff reads");
    expect(readPolicy).toContain("profile_id = auth.uid()");
    expect(readPolicy).toContain("public.is_staff_or_admin()");

    const insertPolicy = policyBlock(sql, "users insert own marketplace notification preferences");
    expect(insertPolicy).toContain("profile_id = auth.uid()");

    const updatePolicy = policyBlock(sql, "users update own marketplace notification preferences");
    expect(updatePolicy).toContain("profile_id = auth.uid()");

    const serviceRolePolicy = policyBlock(sql, "service role manages marketplace notification preferences");
    expect(serviceRolePolicy).toContain("auth.role() = 'service_role'");
  });

  it("limits partner preferences to company admins with matching partner roles", () => {
    const sql = readMarketplaceMigration();

    const preferencePolicy = policyBlock(sql, "company admin manages own partner preferences");
    expect(preferencePolicy).toContain("company_id = public.current_company_id()");
    expect(preferencePolicy).toContain("public.is_company_admin()");
    expect(preferencePolicy).toContain("partner_service_preferences.service_type = 'freight'::public.service_request_type");
    expect(preferencePolicy).toContain("party_type.party_type = 'forwarder'::public.marketplace_party_type");
    expect(preferencePolicy).toContain("partner_service_preferences.service_type = 'clearance'::public.service_request_type");
    expect(preferencePolicy).toContain("party_type.party_type = 'customs_broker'::public.marketplace_party_type");
  });

  it("publishes freight requests by matching verified active forwarders from preferences", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.publish_freight_request");
    const end = sql.indexOf("grant execute on function public.publish_freight_request", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("v_request.status <> 'draft'::public.service_request_status");
    expect(rpc).toContain("insert into public.service_request_partner_matches");
    expect(rpc).toContain("preference.service_type = 'freight'::public.service_request_type");
    expect(rpc).toContain("public.company_has_party_type(preference.company_id, 'forwarder'::public.marketplace_party_type)");
    expect(rpc).toContain("public.is_company_verified_for_marketplace(preference.company_id)");
    expect(rpc).toContain("public.is_company_active_for_marketplace(preference.company_id)");
    expect(rpc).toContain("p_deadline_at > now() + interval '48 hours'");
    expect(rpc).toContain("v_request.requester_company_id is distinct from v_actor_company_id");
    expect(rpc).toContain("not public.is_company_active_for_marketplace(v_request.requester_company_id)");
    expect(rpc).toContain("not public.is_company_verified_for_marketplace(v_request.requester_company_id)");
    expect(rpc).not.toContain("조건에 맞는 검증 포워더가 없어 요청을 공개할 수 없습니다.");
    expect(rpc).toContain("'matched_count', v_match_count");
    expect(rpc).toContain("preference.cargo_tags && v_cargo_tags");
    expect(rpc).toContain("action,");
    expect(rpc).toContain("'freight_request_published'");
  });

  it("submits freight bids through an audited RPC and blocks direct bidder write policies", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.submit_freight_bid");
    const end = sql.indexOf("grant execute on function public.submit_freight_bid", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("public.can_bid_on_service_request(p_request_id)");
    expect(rpc).toContain("v_request.request_type <> 'freight'::public.service_request_type");
    expect(rpc).toContain("v_request.deadline_at is null or v_request.deadline_at <= now()");
    expect(rpc).toContain("for update");
    expect(rpc).toContain("insert into public.service_bids");
    expect(rpc).toContain("'submitted'");
    expect(rpc).toContain("insert into public.freight_bid_details");
    expect(rpc).toContain("set status = 'bids_received'::public.service_request_status");
    expect(rpc).toContain("upper(trim(coalesce(p_currency, ''))) !~ '^[A-Z]{3}$'");
    expect(rpc).toContain("p_valid_until is not null and p_valid_until < current_date");
    expect(rpc).toContain("'match_id', v_match_id");
    expect(rpc).toContain("'freight_bid_submitted'");

    const bidsPolicy = policyBlock(sql, "staff manages bids");
    expect(bidsPolicy).toContain("public.is_staff_or_admin()");

    const freightBidDetailsPolicy = policyBlock(sql, "staff manages freight bid details");
    expect(freightBidDetailsPolicy).toContain("public.is_staff_or_admin()");

    const clearanceBidDetailsPolicy = policyBlock(sql, "staff manages clearance bid details");
    expect(clearanceBidDetailsPolicy).toContain("public.is_staff_or_admin()");
    expect(sql).not.toContain('create policy "bidder manages own clearance bid details"');
  });

  it("publishes clearance requests by matching verified active customs brokers from preferences", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.publish_clearance_request");
    const end = sql.indexOf("grant execute on function public.publish_clearance_request", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("v_request.status <> 'draft'::public.service_request_status");
    expect(rpc).toContain("insert into public.service_request_partner_matches");
    expect(rpc).toContain("preference.service_type = 'clearance'::public.service_request_type");
    expect(rpc).toContain("public.company_has_party_type(preference.company_id, 'customs_broker'::public.marketplace_party_type)");
    expect(rpc).toContain("public.is_company_verified_for_marketplace(preference.company_id)");
    expect(rpc).toContain("public.is_company_active_for_marketplace(preference.company_id)");
    expect(rpc).toContain("p_deadline_at > now() + interval '48 hours'");
    expect(rpc).toContain("v_request.requester_company_id is distinct from v_actor_company_id");
    expect(rpc).toContain("not public.is_company_active_for_marketplace(v_request.requester_company_id)");
    expect(rpc).toContain("not public.is_company_verified_for_marketplace(v_request.requester_company_id)");
    expect(rpc).not.toContain("조건에 맞는 검증 관세사무소가 없어 요청을 공개할 수 없습니다.");
    expect(rpc).toContain("'matched_count', v_match_count");
    expect(rpc).toContain("detail.urgent");
    expect(rpc).toContain("'clearance_request_published'");
  });

  it("submits clearance bids through an audited RPC and blocks direct bidder write policies", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.submit_clearance_bid");
    const end = sql.indexOf("grant execute on function public.submit_clearance_bid", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("public.can_bid_on_service_request(p_request_id)");
    expect(rpc).toContain("v_request.request_type <> 'clearance'::public.service_request_type");
    expect(rpc).toContain("v_request.deadline_at is null or v_request.deadline_at <= now()");
    expect(rpc).toContain("for update");
    expect(rpc).toContain("insert into public.service_bids");
    expect(rpc).toContain("'submitted'");
    expect(rpc).toContain("insert into public.clearance_bid_details");
    expect(rpc).toContain("set status = 'bids_received'::public.service_request_status");
    expect(rpc).toContain("upper(trim(coalesce(p_currency, ''))) !~ '^[A-Z]{3}$'");
    expect(rpc).toContain("p_valid_until is not null and p_valid_until < current_date");
    expect(rpc).toContain("jsonb_typeof(p_additional_documents_required) <> 'array'");
    expect(rpc).toContain("'match_id', v_match_id");
    expect(rpc).toContain("'clearance_bid_submitted'");

    const clearanceBidDetailsPolicy = policyBlock(sql, "staff manages clearance bid details");
    expect(clearanceBidDetailsPolicy).toContain("public.is_staff_or_admin()");
  });

  it("selects service bids only through requester-owned audited RPC state transitions", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.select_service_bid");
    const end = sql.indexOf("grant execute on function public.select_service_bid", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("for update");
    expect(rpc).toContain("v_requester_company_id is distinct from v_actor_company_id");
    expect(rpc).toContain("not public.is_company_active_for_marketplace(v_requester_company_id)");
    expect(rpc).toContain("v_request_status not in ('open', 'bids_received')");
    expect(rpc).toContain("v_bid_status not in ('submitted', 'shortlisted')");
    expect(rpc).toContain("set status = 'rejected'::public.service_bid_status");
    expect(rpc).toContain("set status = 'selected'::public.service_bid_status");
    expect(rpc).toContain("set status = 'partner_selected'::public.service_request_status");
    expect(rpc).toContain("'service_bid_selected'");
  });

  it("moves selected service requests through audited lifecycle RPCs only", () => {
    const sql = readMarketplaceMigration();
    const startStart = sql.indexOf("create or replace function public.start_selected_service_request");
    const completeStart = sql.indexOf("create or replace function public.complete_selected_service_request");
    const askStart = sql.indexOf("create or replace function public.ask_service_request_question");
    const startRpc = sql.slice(startStart, completeStart);
    const completeRpc = sql.slice(completeStart, askStart);

    expect(startRpc).toContain("for update");
    expect(startRpc).toContain("status = 'selected'::public.service_bid_status");
    expect(startRpc).toContain("v_request.status <> 'partner_selected'::public.service_request_status");
    expect(startRpc).toContain("v_request.requester_company_id = v_actor_company_id");
    expect(startRpc).toContain("v_selected_bid.bidder_company_id = v_actor_company_id");
    expect(startRpc).toContain("not public.is_company_active_for_marketplace(v_actor_company_id)");
    expect(startRpc).toContain("set status = 'in_progress'::public.service_request_status");
    expect(startRpc).toContain("'service_request_started'");

    expect(completeRpc).toContain("for update");
    expect(completeRpc).toContain("status = 'selected'::public.service_bid_status");
    expect(completeRpc).toContain("v_request.status <> 'in_progress'::public.service_request_status");
    expect(completeRpc).toContain("v_request.requester_company_id = v_actor_company_id");
    expect(completeRpc).toContain("v_selected_bid.bidder_company_id = v_actor_company_id");
    expect(completeRpc).toContain("left(coalesce(p_completion_note, ''), 500)");
    expect(completeRpc).toContain("set status = 'completed'::public.service_request_status");
    expect(completeRpc).toContain("'has_completion_note', v_completion_note is not null");
    expect(completeRpc).toContain("'service_request_completed'");
    expect(sql).toContain("grant execute on function public.start_selected_service_request(uuid) to authenticated");
    expect(sql).toContain("grant execute on function public.complete_selected_service_request(uuid, text) to authenticated");
    expect(sql).not.toContain("requester updates selected service requests");
    expect(sql).not.toContain("selected partner updates selected service requests");
  });

  it("stores completed request feedback through an audited RPC without direct party writes", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.submit_service_request_feedback");
    const end = sql.indexOf("create or replace function public.ask_service_request_question", start);
    const rpc = sql.slice(start, end);

    expect(sql).toContain("create table if not exists public.service_request_feedbacks");
    expect(sql).toContain("unique(request_id, reviewer_company_id, reviewed_company_id, reviewer_role)");
    expect(sql).toContain("alter table public.service_request_feedbacks enable row level security");
    expect(sql).toContain("grant select on");
    expect(sql).toContain("public.service_request_feedbacks");
    expect(sql).toContain("grant execute on function public.submit_service_request_feedback(uuid, integer, integer, integer, integer, text) to authenticated");
    expect(sql).toContain("create or replace function public.get_partner_feedback_summaries");
    expect(sql).toContain("grant execute on function public.get_partner_feedback_summaries(uuid[]) to authenticated");
    expect(sql).toContain("round(avg(feedback.rating)::numeric, 1) as avg_rating");
    expect(sql).toContain("create or replace function public.get_partner_trust_summaries");
    expect(sql).toContain("grant execute on function public.get_partner_trust_summaries(uuid[]) to authenticated");
    expect(sql).toContain("company.verification_status not in ('suspended', 'blocked')");
    expect(rpc).toContain("p_rating not between 1 and 5");
    expect(rpc).toContain("v_request.status <> 'completed'::public.service_request_status");
    expect(rpc).toContain("status = 'selected'::public.service_bid_status");
    expect(rpc).toContain("v_request.requester_company_id = v_actor_company_id");
    expect(rpc).toContain("v_selected_bid.bidder_company_id = v_actor_company_id");
    expect(rpc).toContain("insert into public.service_request_feedbacks");
    expect(rpc).toContain("left(trim(coalesce(p_comment, '')), 500)");
    expect(rpc).toContain("'service_request_feedback_submitted'");
    expect(rpc).toContain("'has_comment', v_comment is not null");

    const readPolicy = policyBlock(sql, "request parties read service feedbacks");
    expect(readPolicy).toContain("reviewer_company_id = public.current_company_id()");
    expect(readPolicy).toContain("reviewed_company_id = public.current_company_id()");
    expect(sql).not.toContain("request parties insert service feedbacks");
    expect(sql).not.toContain("request parties update service feedbacks");
  });

  it("stores completion reports through an audited RPC without exposing them to unselected partners", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.create_or_update_completion_report");
    const end = sql.indexOf("create or replace function public.get_partner_feedback_summaries", start);
    const rpc = sql.slice(start, end);

    expect(sql).toContain("create table if not exists public.service_request_completion_reports");
    expect(sql).toContain("create table if not exists public.service_request_completion_report_documents");
    expect(sql).toContain("create unique index if not exists service_request_completion_reports_one_active_per_request_idx");
    expect(sql).toContain("where status <> 'voided'");
    expect(sql).toContain("alter table public.service_request_completion_reports enable row level security");
    expect(sql).toContain("alter table public.service_request_completion_report_documents enable row level security");
    expect(sql).toContain("public.service_request_completion_reports");
    expect(sql).toContain("public.service_request_completion_report_documents");
    expect(sql).toContain("grant execute on function public.create_or_update_completion_report(uuid, jsonb) to authenticated");
    expect(rpc).toContain("v_request.status <> 'completed'::public.service_request_status");
    expect(rpc).toContain("status = 'selected'::public.service_bid_status");
    expect(rpc).toContain("v_request.requester_company_id = v_actor_company_id");
    expect(rpc).toContain("v_selected_bid.bidder_company_id = v_actor_company_id");
    expect(rpc).toContain("not public.is_company_active_for_marketplace(v_actor_company_id)");
    expect(rpc).toContain("v_existing_report.status <> 'draft'");
    expect(rpc).toContain("jsonb_typeof(v_settlement_items) <> 'array'");
    expect(rpc).toContain("snapshot_version");
    expect(rpc).toContain("completion-report-source-v1");
    expect(rpc).toContain("'basis_date'");
    expect(rpc).toContain("'selected_bid'");
    expect(rpc).toContain("'source_lookup_snapshot'");
    expect(rpc).toContain("'legal_certainty', false");
    expect(rpc).toContain("'hs_classification_final', false");
    expect(rpc).toContain("insert into public.service_request_completion_reports");
    expect(rpc).toContain("service_request_completion_report_saved");
    expect(rpc).toContain("settlement_item_count");

    const reportReadPolicy = policyBlock(sql, "request parties read completion reports");
    expect(reportReadPolicy).toContain("requester_company_id = public.current_company_id()");
    expect(reportReadPolicy).toContain("selected_partner_company_id = public.current_company_id()");
    expect(reportReadPolicy).not.toContain("service_request_partner_matches");

    const documentReadPolicy = policyBlock(sql, "request parties read completion report documents");
    expect(documentReadPolicy).toContain("report.requester_company_id = public.current_company_id()");
    expect(documentReadPolicy).toContain("report.selected_partner_company_id = public.current_company_id()");
    expect(documentReadPolicy).toContain("public.can_read_service_request_document(service_request_completion_report_documents.request_document_id)");

    expect(sql).not.toContain("request parties insert completion reports");
    expect(sql).not.toContain("request parties update completion reports");
  });

  it("keeps completion report submit, acknowledge, review, and lock transitions behind audited RPCs", () => {
    const sql = readMarketplaceMigration();
    const submitStart = sql.indexOf("create or replace function public.submit_completion_report");
    const acknowledgeStart = sql.indexOf("create or replace function public.acknowledge_completion_report");
    const reviewStart = sql.indexOf("create or replace function public.review_completion_report");
    const lockStart = sql.indexOf("create or replace function public.lock_completion_report");
    const attachStart = sql.indexOf("create or replace function public.attach_completion_report_document");
    const submitRpc = sql.slice(submitStart, acknowledgeStart);
    const acknowledgeRpc = sql.slice(acknowledgeStart, reviewStart);
    const reviewRpc = sql.slice(reviewStart, lockStart);
    const lockRpc = sql.slice(lockStart, attachStart);

    expect(submitRpc).toContain("v_report.status <> 'draft'");
    expect(submitRpc).toContain("v_request.status <> 'completed'::public.service_request_status");
    expect(submitRpc).toContain("v_selected_bid.bidder_company_id <> v_report.selected_partner_company_id");
    expect(submitRpc).toContain("v_report.requester_company_id = v_actor_company_id");
    expect(submitRpc).toContain("v_report.selected_partner_company_id = v_actor_company_id");
    expect(submitRpc).toContain("not public.is_company_active_for_marketplace(v_actor_company_id)");
    expect(submitRpc).toContain("완료 리포트 제출 전 최종 보관 서류를 1건 이상 연결해 주세요.");
    expect(submitRpc).toContain("service_request_completion_report_submitted");
    expect(submitRpc).toContain("'linked_document_count', v_document_count");

    expect(acknowledgeRpc).toContain("v_ack_role not in ('requester', 'partner')");
    expect(acknowledgeRpc).toContain("v_report.status not in ('submitted', 'requester_acknowledged', 'partner_acknowledged')");
    expect(acknowledgeRpc).toContain("v_report.requester_company_id = v_actor_company_id");
    expect(acknowledgeRpc).toContain("v_report.selected_partner_company_id = v_actor_company_id");
    expect(acknowledgeRpc).toContain("jsonb_set");
    expect(acknowledgeRpc).toContain("service_request_completion_report_acknowledged");

    expect(reviewRpc).toContain("not public.is_staff_or_admin()");
    expect(reviewRpc).toContain("v_report.status = 'locked'");
    expect(reviewRpc).toContain("운영 검토 전 최종 보관 서류 연결을 확인해 주세요.");
    expect(reviewRpc).toContain("service_request_completion_report_reviewed");

    expect(lockRpc).toContain("not public.is_staff_or_admin()");
    expect(lockRpc).toContain("v_report.status <> 'operator_reviewed'");
    expect(lockRpc).toContain("법적 확정|요건 없음 확정|FTA 적용 보장|HSK 확정");
    expect(lockRpc).toContain("locked_by = auth.uid()");
    expect(lockRpc).toContain("service_request_completion_report_locked");

    expect(sql).toContain("grant execute on function public.submit_completion_report(uuid) to authenticated");
    expect(sql).toContain("grant execute on function public.acknowledge_completion_report(uuid, text) to authenticated");
    expect(sql).toContain("grant execute on function public.review_completion_report(uuid) to authenticated");
    expect(sql).toContain("grant execute on function public.lock_completion_report(uuid) to authenticated");
  });

  it("attaches completion report documents through an audited RPC without exposing direct writes", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.attach_completion_report_document");
    const end = sql.indexOf("create or replace function public.get_partner_feedback_summaries", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("v_report.status = 'locked'");
    expect(rpc).toContain("v_document.request_id <> v_report.request_id");
    expect(rpc).toContain("v_report.requester_company_id = v_actor_company_id");
    expect(rpc).toContain("v_report.selected_partner_company_id = v_actor_company_id");
    expect(rpc).toContain("not public.is_company_active_for_marketplace(v_actor_company_id)");
    expect(rpc).toContain("not public.can_read_service_request_document(p_request_document_id)");
    expect(rpc).toContain("insert into public.service_request_completion_report_documents");
    expect(rpc).toContain("on conflict (completion_report_id, request_document_id) do update");
    expect(rpc).toContain("service_request_completion_report_document_attached");
    expect(rpc).toContain("'request_document_id', p_request_document_id");
    expect(sql).toContain("grant execute on function public.attach_completion_report_document(uuid, uuid, text, boolean) to authenticated");

    expect(sql).not.toContain("request parties insert completion report documents");
    expect(sql).not.toContain("request parties update completion report documents");
  });

  it("handles request questions through audited RPCs instead of direct partner mutations", () => {
    const sql = readMarketplaceMigration();
    const askStart = sql.indexOf("create or replace function public.ask_service_request_question");
    const answerStart = sql.indexOf("create or replace function public.answer_service_request_question");
    const askRpc = sql.slice(askStart, answerStart);
    const answerEnd = sql.indexOf("grant execute on function public.select_service_bid", answerStart);
    const answerRpc = sql.slice(answerStart, answerEnd);

    expect(askRpc).toContain("public.can_bid_on_service_request(p_request_id)");
    expect(askRpc).toContain("char_length(trim(p_question)) > 1000");
    expect(askRpc).toContain("insert into public.service_request_questions");
    expect(askRpc).toContain("'service_request_question_asked'");

    expect(answerRpc).toContain("v_requester_company_id is distinct from v_actor_company_id");
    expect(answerRpc).toContain("v_answered_at is not null");
    expect(answerRpc).toContain("v_request_status not in ('open', 'bids_received')");
    expect(answerRpc).toContain("v_deadline_at is null or v_deadline_at <= now()");
    expect(answerRpc).toContain("and answered_at is null");
    expect(answerRpc).toContain("if not found then");
    expect(answerRpc).toContain("char_length(trim(p_answer)) > 1000");
    expect(answerRpc).toContain("'service_request_question_answered'");
  });

  it("updates company marketplace status and audit log in one service-role RPC", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.update_company_marketplace_status");
    const end = sql.indexOf("grant execute on function public.update_company_marketplace_status", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("auth.role() <> 'service_role'");
    expect(rpc).toContain("for update");
    expect(rpc).toContain("insert into public.audit_logs");
    expect(rpc).toContain("'company_marketplace_status_updated'");
    expect(rpc).toContain("'verificationStatus', v_after.verification_status");
    expect(rpc).toContain("'trustScore', v_after.trust_score");
    expect(rpc).toContain("'suspendedAt', v_after.suspended_at");
    expect(rpc).toContain("'blockedAt', v_after.blocked_at");
    expect(sql).toContain("grant execute on function public.update_company_marketplace_status");
  });

  it("clears stale marketplace status fields on status transitions", () => {
    const sql = readMarketplaceMigration();
    const start = sql.indexOf("create or replace function public.update_company_marketplace_status");
    const end = sql.indexOf("grant execute on function public.update_company_marketplace_status", start);
    const rpc = sql.slice(start, end);

    expect(rpc).toContain("when p_status in ('suspended', 'blocked', 'unverified') then null");
    expect(rpc).toContain("when p_status in ('operator_approved', 'recommended_partner', 'blocked', 'unverified') then null");
    expect(rpc).toContain("when p_status in ('operator_approved', 'recommended_partner', 'suspended', 'unverified') then null");
    expect(rpc).toContain("when p_status in ('suspended', 'blocked', 'unverified') then least(coalesce(v_before.trust_score, 0), 50)");
  });
});
