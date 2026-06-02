-- Draft migration for the HS FINDER marketplace pivot.
-- This file is intentionally not applied yet. Review RLS and workflow rules before running it.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'marketplace_party_type') then
    create type public.marketplace_party_type as enum (
      'domestic_shipper',
      'foreign_shipper',
      'forwarder',
      'customs_broker',
      'support_partner'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'company_verification_status') then
    create type public.company_verification_status as enum (
      'unverified',
      'email_verified',
      'documents_submitted',
      'operator_approved',
      'trade_history',
      'recommended_partner',
      'suspended',
      'blocked'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'service_request_type') then
    create type public.service_request_type as enum ('freight', 'clearance');
  end if;

  if not exists (select 1 from pg_type where typname = 'service_request_status') then
    create type public.service_request_status as enum (
      'draft',
      'open',
      'bids_received',
      'partner_selected',
      'in_progress',
      'completed',
      'cancelled',
      'expired',
      'hidden'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'service_bid_status') then
    create type public.service_bid_status as enum (
      'draft',
      'submitted',
      'withdrawn',
      'shortlisted',
      'selected',
      'rejected',
      'expired',
      'hidden'
    );
  end if;
end
$$;

alter table public.companies
  add column if not exists country_code text,
  add column if not exists website_url text,
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists verification_status public.company_verification_status not null default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id),
  add column if not exists suspended_at timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists trust_score integer not null default 0;

alter table public.companies
  drop constraint if exists companies_trust_score_check;

alter table public.companies
  add constraint companies_trust_score_check check (trust_score >= 0 and trust_score <= 100);

create or replace function public.is_uuid_text(p_value text)
returns boolean
language sql
immutable
as $$
  select coalesce(
    p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    false
  )
$$;

drop policy if exists "users update own limited profile" on public.profiles;
revoke update on public.profiles from authenticated;
grant update (full_name, preferred_locale) on public.profiles to authenticated;

create policy "users update own profile display fields" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.update_own_profile_settings(
  p_full_name text default null,
  p_preferred_locale text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  update public.profiles
     set full_name = coalesce(nullif(p_full_name, ''), full_name),
         preferred_locale = coalesce(nullif(p_preferred_locale, ''), preferred_locale)
   where id = auth.uid()
   returning * into updated_profile;

  if updated_profile.id is null then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.update_own_profile_settings(text, text) to authenticated;

create table if not exists public.company_party_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  party_type public.marketplace_party_type not null,
  is_primary boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(company_id, party_type)
);

create table if not exists public.company_party_type_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  requested_party_types public.marketplace_party_type[] not null,
  reason text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'cancelled')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_party_type_requests_non_empty check (array_length(requested_party_types, 1) > 0)
);

create table if not exists public.company_verification_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  document_type text not null,
  file_name text not null,
  storage_bucket text not null default 'company-verification-documents',
  storage_path text not null,
  mime_type text,
  file_size bigint,
  checksum text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table if not exists public.partner_service_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_type public.service_request_type not null,
  directions text[] not null default '{}',
  origin_country_codes text[] not null default '{}',
  destination_country_codes text[] not null default '{}',
  transport_modes text[] not null default '{}',
  cargo_tags text[] not null default '{}',
  ports text[] not null default '{}',
  urgent_available boolean not null default false,
  notification_enabled boolean not null default true,
  digest_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, service_type)
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_type public.service_request_type not null,
  requester_company_id uuid not null references public.companies(id),
  created_by uuid not null references auth.users(id),
  direction public.request_direction not null,
  status public.service_request_status not null default 'draft',
  title text not null,
  product_summary text,
  hsk_code text,
  hs6 text,
  origin_country_code text,
  export_country_code text,
  shipment_country_code text,
  destination_country_code text,
  incoterms text,
  deadline_at timestamptz,
  preferred_start_date date,
  preferred_arrival_date date,
  visibility text not null default 'matched_partners' check (visibility in ('matched_partners', 'invited_only', 'private')),
  source_hs_request_id uuid references public.hs_search_requests(id),
  source_lookup_snapshot jsonb not null default '{}'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  expired_at timestamptz,
  constraint service_requests_hs6_check check (hs6 is null or hs6 ~ '^[0-9]{6}$'),
  constraint service_requests_hsk_check check (hsk_code is null or hsk_code ~ '^[0-9]{10}$')
);

create table if not exists public.freight_request_details (
  request_id uuid primary key references public.service_requests(id) on delete cascade,
  transport_mode text,
  load_type text,
  origin_place text,
  destination_place text,
  origin_port text,
  destination_port text,
  package_count numeric,
  package_unit text,
  gross_weight numeric,
  weight_unit text,
  cbm numeric,
  container_type text,
  hazardous boolean not null default false,
  temperature_controlled boolean not null default false,
  used_car boolean not null default false,
  vehicle_vin text
);

create table if not exists public.clearance_request_details (
  request_id uuid primary key references public.service_requests(id) on delete cascade,
  hs_code_known boolean not null default false,
  fta_preference_requested boolean not null default false,
  requirements_check_needed boolean not null default false,
  urgent boolean not null default false,
  estimated_declaration_count integer,
  product_material text,
  product_usage text,
  model_name text,
  required_review_points jsonb not null default '[]'::jsonb
);

create table if not exists public.service_request_partner_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  partner_company_id uuid not null references public.companies(id) on delete cascade,
  matched_by text not null default 'preference',
  match_reason jsonb not null default '{}'::jsonb,
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'skipped', 'failed')),
  notified_at timestamptz,
  interest_status text not null default 'none' check (interest_status in ('none', 'viewed', 'interested', 'declined')),
  created_at timestamptz not null default now(),
  unique(request_id, partner_company_id)
);

create table if not exists public.service_request_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  requester_company_id uuid not null references public.companies(id),
  uploaded_by uuid not null references auth.users(id),
  document_type public.document_type not null,
  file_name text not null,
  storage_bucket text not null default 'service-request-documents',
  storage_path text not null,
  mime_type text,
  file_size bigint,
  checksum text,
  visibility text not null default 'requester_only' check (
    visibility in ('requester_only', 'matched_partner_after_interest', 'selected_partner', 'operator_only')
  ),
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table if not exists public.service_bids (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  bidder_company_id uuid not null references public.companies(id),
  created_by uuid not null references auth.users(id),
  bid_type public.service_request_type not null,
  status public.service_bid_status not null default 'draft',
  currency text,
  total_amount numeric,
  included_costs jsonb not null default '[]'::jsonb,
  excluded_costs jsonb not null default '[]'::jsonb,
  valid_until date,
  lead_time_days integer,
  message text,
  quote_file_document_id uuid references public.service_request_documents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  selected_at timestamptz
);

create table if not exists public.freight_bid_details (
  bid_id uuid primary key references public.service_bids(id) on delete cascade,
  freight_rate_amount numeric,
  local_charge_amount numeric,
  surcharge_amount numeric,
  transit_time_days integer,
  free_time_note text,
  carrier_note text
);

alter table public.service_bids
  drop constraint if exists service_bids_positive_amounts_check,
  drop constraint if exists service_bids_currency_check,
  drop constraint if exists service_bids_positive_days_check;

alter table public.service_bids
  add constraint service_bids_positive_amounts_check check (
    (total_amount is null or total_amount > 0)
  ),
  add constraint service_bids_currency_check check (
    currency is null or currency ~ '^[A-Z]{3}$'
  ),
  add constraint service_bids_positive_days_check check (
    lead_time_days is null or lead_time_days > 0
  );

alter table public.freight_bid_details
  drop constraint if exists freight_bid_details_positive_values_check;

alter table public.freight_bid_details
  add constraint freight_bid_details_positive_values_check check (
    (freight_rate_amount is null or freight_rate_amount > 0)
    and (local_charge_amount is null or local_charge_amount > 0)
    and (surcharge_amount is null or surcharge_amount > 0)
    and (transit_time_days is null or transit_time_days > 0)
  );

create table if not exists public.clearance_bid_details (
  bid_id uuid primary key references public.service_bids(id) on delete cascade,
  brokerage_fee_amount numeric,
  review_available boolean not null default true,
  additional_documents_required jsonb not null default '[]'::jsonb,
  risk_note text,
  expected_clearance_days integer
);

alter table public.clearance_bid_details
  drop constraint if exists clearance_bid_details_positive_values_check;

alter table public.clearance_bid_details
  add constraint clearance_bid_details_positive_values_check check (
    (brokerage_fee_amount is null or brokerage_fee_amount > 0)
    and (expected_clearance_days is null or expected_clearance_days > 0)
  );

create table if not exists public.service_request_questions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  bidder_company_id uuid not null references public.companies(id),
  asked_by uuid not null references auth.users(id),
  question text not null,
  answer text,
  answered_by uuid references auth.users(id),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.service_request_feedbacks (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  reviewer_company_id uuid not null references public.companies(id),
  reviewed_company_id uuid not null references public.companies(id),
  reviewer_role text not null check (reviewer_role in ('requester', 'selected_partner')),
  rating integer not null check (rating between 1 and 5),
  response_speed_score integer check (response_speed_score between 1 and 5),
  communication_score integer check (communication_score between 1 and 5),
  document_quality_score integer check (document_quality_score between 1 and 5),
  comment text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(request_id, reviewer_company_id, reviewed_company_id, reviewer_role)
);

create table if not exists public.service_request_completion_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  request_type public.service_request_type not null,
  requester_company_id uuid not null references public.companies(id),
  selected_partner_company_id uuid not null references public.companies(id),
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'requester_acknowledged',
      'partner_acknowledged',
      'operator_reviewed',
      'locked',
      'voided'
    )
  ),
  summary text,
  currency text,
  final_amount numeric,
  settlement_items jsonb not null default '[]'::jsonb,
  timeline_events jsonb not null default '[]'::jsonb,
  clearance_result jsonb not null default '{}'::jsonb,
  freight_result jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz,
  locked_by uuid references auth.users(id),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_request_completion_reports
  drop constraint if exists service_request_completion_reports_amount_check;

alter table public.service_request_completion_reports
  add constraint service_request_completion_reports_amount_check check (
    final_amount is null or final_amount >= 0
  );

alter table public.service_request_completion_reports
  drop constraint if exists service_request_completion_reports_currency_check;

alter table public.service_request_completion_reports
  add constraint service_request_completion_reports_currency_check check (
    currency is null or currency ~ '^[A-Z]{3}$'
  );

alter table public.service_request_completion_reports
  drop constraint if exists service_request_completion_reports_json_shape_check;

alter table public.service_request_completion_reports
  add constraint service_request_completion_reports_json_shape_check check (
    jsonb_typeof(settlement_items) = 'array'
    and jsonb_typeof(timeline_events) = 'array'
    and jsonb_typeof(clearance_result) = 'object'
    and jsonb_typeof(freight_result) = 'object'
    and jsonb_typeof(source_snapshot) = 'object'
  );

create table if not exists public.service_request_completion_report_documents (
  id uuid primary key default gen_random_uuid(),
  completion_report_id uuid not null references public.service_request_completion_reports(id) on delete cascade,
  request_document_id uuid not null references public.service_request_documents(id) on delete cascade,
  document_role text not null,
  required_for_archive boolean not null default false,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(completion_report_id, request_document_id)
);

create table if not exists public.marketplace_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_key text not null unique,
  match_id uuid references public.service_request_partner_matches(id) on delete cascade,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  partner_company_id uuid not null references public.companies(id) on delete cascade,
  notification_kind text not null check (notification_kind in ('initial', 'deadline_reminder', 'digest')),
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'digest')),
  delivery_window text,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'skipped', 'retryable_failed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  next_retry_at timestamptz,
  reason text,
  provider_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  read_at timestamptz,
  read_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_verification_status_idx
  on public.companies(verification_status, country_code);
create index if not exists company_party_types_company_idx
  on public.company_party_types(company_id, party_type);
create index if not exists company_party_type_requests_company_idx
  on public.company_party_type_requests(company_id, status, created_at desc);
create index if not exists partner_service_preferences_company_idx
  on public.partner_service_preferences(company_id, service_type);
create index if not exists service_requests_requester_status_idx
  on public.service_requests(requester_company_id, status, created_at desc);
create index if not exists service_requests_requester_type_created_idx
  on public.service_requests(requester_company_id, request_type, created_at desc);
create index if not exists service_requests_open_type_deadline_idx
  on public.service_requests(request_type, status, deadline_at)
  where status in ('open', 'bids_received');
create index if not exists service_request_partner_matches_partner_idx
  on public.service_request_partner_matches(partner_company_id, interest_status, created_at desc);
create index if not exists service_request_partner_matches_request_idx
  on public.service_request_partner_matches(request_id, partner_company_id);
create index if not exists service_request_documents_request_idx
  on public.service_request_documents(request_id, visibility);
create index if not exists service_bids_request_idx
  on public.service_bids(request_id, status, created_at desc);
create index if not exists service_bids_request_type_amount_idx
  on public.service_bids(request_id, bid_type, total_amount, created_at);
create index if not exists service_bids_bidder_idx
  on public.service_bids(bidder_company_id, status, created_at desc);
create index if not exists service_request_questions_request_idx
  on public.service_request_questions(request_id, created_at);
create index if not exists service_request_feedbacks_request_idx
  on public.service_request_feedbacks(request_id, created_at desc);
create index if not exists service_request_feedbacks_reviewer_request_idx
  on public.service_request_feedbacks(reviewer_company_id, request_id, created_at desc);
create index if not exists service_request_completion_reports_request_idx
  on public.service_request_completion_reports(request_id, status, updated_at desc);
create index if not exists service_request_completion_reports_partner_idx
  on public.service_request_completion_reports(selected_partner_company_id, status, updated_at desc);
create index if not exists service_request_completion_report_documents_report_idx
  on public.service_request_completion_report_documents(completion_report_id, document_role);
create index if not exists marketplace_notification_deliveries_partner_idx
  on public.marketplace_notification_deliveries(partner_company_id, notification_kind, created_at desc);
create index if not exists marketplace_notification_deliveries_status_idx
  on public.marketplace_notification_deliveries(status, created_at desc);
create index if not exists marketplace_notification_deliveries_unread_partner_idx
  on public.marketplace_notification_deliveries(partner_company_id, read_at, created_at desc)
  where channel = 'in_app';

create unique index if not exists service_bids_one_active_bid_per_partner_idx
  on public.service_bids(request_id, bidder_company_id)
  where status not in ('withdrawn', 'rejected', 'expired', 'hidden');

create unique index if not exists service_request_completion_reports_one_active_per_request_idx
  on public.service_request_completion_reports(request_id)
  where status <> 'voided';

insert into public.company_party_types (company_id, party_type, created_by)
select distinct
  company_type.company_id,
  company_type.party_type::public.marketplace_party_type,
  null::uuid
from (
  select
    company.id as company_id,
    case business_type.value
      when 'exporter' then 'domestic_shipper'
      when 'foreign_shipper' then 'foreign_shipper'
      when 'importer' then 'domestic_shipper'
      else null
    end as party_type
  from public.companies company
  cross join lateral unnest(coalesce(company.business_types, '{}'::text[])) as business_type(value)
) company_type
where company_type.party_type is not null
on conflict (company_id, party_type) do nothing;

create or replace function public.company_has_party_type(
  p_company_id uuid,
  p_party_type public.marketplace_party_type
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_party_types party
    where party.company_id = p_company_id
      and party.party_type = p_party_type
  )
$$;

create or replace function public.current_company_has_party_type(
  p_party_type public.marketplace_party_type
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.company_has_party_type(public.current_company_id(), p_party_type)
$$;

create or replace function public.is_company_verified_for_marketplace(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies company
    where company.id = p_company_id
      and company.verification_status in ('operator_approved', 'trade_history', 'recommended_partner')
  )
$$;

create or replace function public.is_company_active_for_marketplace(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.companies company
    where company.id = p_company_id
      and company.verification_status not in ('suspended', 'blocked')
  )
$$;

create or replace function public.can_read_service_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.service_requests request
    where request.id = p_request_id
      and (
        request.requester_company_id = public.current_company_id()
        or public.is_staff_or_admin()
        or exists (
          select 1
          from public.service_request_partner_matches matched
          where matched.request_id = request.id
            and matched.partner_company_id = public.current_company_id()
            and public.is_company_active_for_marketplace(matched.partner_company_id)
            and request.status in (
              'open'::public.service_request_status,
              'bids_received'::public.service_request_status
            )
            and (
              (request.request_type = 'freight'::public.service_request_type and public.current_company_has_party_type('forwarder'::public.marketplace_party_type))
              or (request.request_type = 'clearance'::public.service_request_type and public.current_company_has_party_type('customs_broker'::public.marketplace_party_type))
            )
        )
        or exists (
          select 1
          from public.service_bids bid
          where bid.request_id = request.id
            and bid.bidder_company_id = public.current_company_id()
            and public.is_company_active_for_marketplace(bid.bidder_company_id)
            and (
              request.status in (
                'open'::public.service_request_status,
                'bids_received'::public.service_request_status
              )
              or (
                request.status in (
                  'partner_selected'::public.service_request_status,
                  'in_progress'::public.service_request_status,
                  'completed'::public.service_request_status
                )
                and bid.status = 'selected'::public.service_bid_status
              )
            )
        )
      )
  )
$$;

create or replace function public.can_bid_on_service_request(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.service_requests request
    where request.id = p_request_id
      and request.status in ('open', 'bids_received')
      and request.deadline_at is not null
      and request.deadline_at > now()
      and public.is_company_verified_for_marketplace(public.current_company_id())
      and (
        (request.request_type = 'freight' and public.current_company_has_party_type('forwarder'))
        or (request.request_type = 'clearance' and public.current_company_has_party_type('customs_broker'))
      )
      and exists (
        select 1
        from public.service_request_partner_matches matched
        where matched.request_id = request.id
          and matched.partner_company_id = public.current_company_id()
          and matched.interest_status in ('none', 'viewed', 'interested')
      )
  )
$$;

create or replace function public.can_read_service_request_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.service_request_documents document
    join public.service_requests request on request.id = document.request_id
    where document.id = p_document_id
      and (
        public.is_staff_or_admin()
        or document.requester_company_id = public.current_company_id()
        or (
          document.visibility = 'matched_partner_after_interest'
          and request.status in (
            'open'::public.service_request_status,
            'bids_received'::public.service_request_status
          )
          and exists (
            select 1
            from public.service_request_partner_matches matched
            where matched.request_id = document.request_id
              and matched.partner_company_id = public.current_company_id()
              and matched.interest_status = 'interested'
              and public.is_company_active_for_marketplace(matched.partner_company_id)
              and (
                (request.request_type = 'freight'::public.service_request_type and public.current_company_has_party_type('forwarder'::public.marketplace_party_type))
                or (request.request_type = 'clearance'::public.service_request_type and public.current_company_has_party_type('customs_broker'::public.marketplace_party_type))
              )
          )
        )
        or (
          document.visibility = 'selected_partner'
          and exists (
            select 1
            from public.service_bids bid
            where bid.request_id = document.request_id
              and bid.bidder_company_id = public.current_company_id()
              and bid.status = 'selected'
              and public.is_company_active_for_marketplace(bid.bidder_company_id)
          )
        )
      )
  )
$$;

create or replace function public.can_read_service_request_storage_object(
  p_bucket text,
  p_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.service_request_documents document
    where document.storage_bucket = p_bucket
      and document.storage_path = p_storage_path
      and public.can_read_service_request_document(document.id)
  )
$$;

create or replace function public.can_read_company_verification_storage_object(
  p_bucket text,
  p_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_verification_documents document
    where document.storage_bucket = p_bucket
      and document.storage_path = p_storage_path
      and (
        public.is_staff_or_admin()
        or (
          document.company_id = public.current_company_id()
          and public.is_company_admin()
        )
      )
  )
$$;

create or replace function public.can_read_service_bid(p_bid_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.service_bids bid
    join public.service_requests request on request.id = bid.request_id
    where bid.id = p_bid_id
      and (
        public.is_staff_or_admin()
        or (
          bid.bidder_company_id = public.current_company_id()
          and bid.status <> 'hidden'::public.service_bid_status
          and public.is_company_active_for_marketplace(bid.bidder_company_id)
        )
        or (
          request.requester_company_id = public.current_company_id()
          and bid.status <> 'hidden'::public.service_bid_status
        )
      )
  )
$$;

create or replace function public.select_service_bid(p_bid_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_request_id uuid;
  v_requester_company_id uuid;
  v_bidder_company_id uuid;
  v_bid_status public.service_bid_status;
  v_request_status public.service_request_status;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if not public.is_staff_or_admin() and v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  select
    bid.request_id,
    bid.bidder_company_id,
    bid.status,
    request.status,
    request.requester_company_id
    into v_request_id, v_bidder_company_id, v_bid_status, v_request_status, v_requester_company_id
  from public.service_bids bid
  join public.service_requests request on request.id = bid.request_id
  where bid.id = p_bid_id
  for update;

  if v_request_id is null then
    raise exception '견적을 찾을 수 없습니다.';
  end if;

  if not public.is_staff_or_admin() and v_requester_company_id is distinct from v_actor_company_id then
    raise exception '견적을 선택할 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_requester_company_id) then
    raise exception '정지 또는 차단된 회사는 견적을 선택할 수 없습니다.';
  end if;

  if v_request_status not in ('open', 'bids_received') then
    raise exception '진행 중인 요청의 견적만 선택할 수 있습니다.';
  end if;

  if v_bid_status not in ('submitted', 'shortlisted') then
    raise exception '제출된 견적만 선택할 수 있습니다.';
  end if;

  update public.service_bids
    set status = 'rejected'::public.service_bid_status,
        updated_at = now()
  where request_id = v_request_id
    and id <> p_bid_id
    and status in ('submitted', 'shortlisted');

  update public.service_bids
    set status = 'selected'::public.service_bid_status,
        selected_at = now(),
        updated_at = now()
  where id = p_bid_id;

  update public.service_requests
    set status = 'partner_selected'::public.service_request_status,
        updated_at = now()
  where id = v_request_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_bid_selected',
    'service_bids',
    p_bid_id,
    jsonb_build_object(
      'request_id', v_request_id,
      'selected_bidder_company_id', v_bidder_company_id
    )
  );

  return p_bid_id;
end;
$$;

create or replace function public.set_service_request_partner_interest(
  p_match_id uuid,
  p_interest_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_interest_status not in ('viewed', 'interested', 'declined') then
    raise exception '지원하지 않는 관심 상태입니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  select matched.request_id
    into v_request_id
  from public.service_request_partner_matches matched
  where matched.id = p_match_id
    and matched.partner_company_id = v_actor_company_id
  for update;

  if v_request_id is null then
    raise exception '매칭 정보를 찾을 수 없습니다.';
  end if;

  update public.service_request_partner_matches
    set interest_status = p_interest_status
  where id = p_match_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_partner_interest_set',
    'service_request_partner_matches',
    p_match_id,
    jsonb_build_object(
      'request_id', v_request_id,
      'interest_status', p_interest_status
    )
  );

  return p_match_id;
end;
$$;

create or replace function public.start_selected_service_request(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_actor_role text;
  v_request public.service_requests%rowtype;
  v_selected_bid public.service_bids%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  select *
    into v_request
  from public.service_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception '요청을 찾을 수 없습니다.';
  end if;

  select *
    into v_selected_bid
  from public.service_bids
  where request_id = p_request_id
    and status = 'selected'::public.service_bid_status
  order by selected_at desc nulls last, updated_at desc
  limit 1
  for update;

  if v_selected_bid.id is null then
    raise exception '선정된 견적을 확인할 수 없습니다.';
  end if;

  if v_request.status <> 'partner_selected'::public.service_request_status then
    raise exception '선정 완료 상태의 요청만 진행 시작할 수 있습니다.';
  end if;

  if public.is_staff_or_admin() then
    v_actor_role := 'staff';
  elsif v_request.requester_company_id = v_actor_company_id then
    v_actor_role := 'requester';
  elsif v_selected_bid.bidder_company_id = v_actor_company_id then
    v_actor_role := 'selected_partner';
  else
    raise exception '요청 진행을 시작할 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 요청 진행을 시작할 수 없습니다.';
  end if;

  update public.service_requests
    set status = 'in_progress'::public.service_request_status,
        updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_started',
    'service_requests',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_type', v_request.request_type,
      'selected_bid_id', v_selected_bid.id,
      'actor_company_role', v_actor_role
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'in_progress'
  );
end;
$$;

create or replace function public.complete_selected_service_request(
  p_request_id uuid,
  p_completion_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_actor_role text;
  v_request public.service_requests%rowtype;
  v_selected_bid public.service_bids%rowtype;
  v_completion_note text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  select *
    into v_request
  from public.service_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception '요청을 찾을 수 없습니다.';
  end if;

  select *
    into v_selected_bid
  from public.service_bids
  where request_id = p_request_id
    and status = 'selected'::public.service_bid_status
  order by selected_at desc nulls last, updated_at desc
  limit 1
  for update;

  if v_selected_bid.id is null then
    raise exception '선정된 견적을 확인할 수 없습니다.';
  end if;

  if v_request.status <> 'in_progress'::public.service_request_status then
    raise exception '진행 중인 요청만 완료 처리할 수 있습니다.';
  end if;

  if public.is_staff_or_admin() then
    v_actor_role := 'staff';
  elsif v_request.requester_company_id = v_actor_company_id then
    v_actor_role := 'requester';
  elsif v_selected_bid.bidder_company_id = v_actor_company_id then
    v_actor_role := 'selected_partner';
  else
    raise exception '요청을 완료 처리할 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 요청을 완료 처리할 수 없습니다.';
  end if;

  v_completion_note := nullif(left(coalesce(p_completion_note, ''), 500), '');

  update public.service_requests
    set status = 'completed'::public.service_request_status,
        updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_completed',
    'service_requests',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_type', v_request.request_type,
      'selected_bid_id', v_selected_bid.id,
      'actor_company_role', v_actor_role,
      'has_completion_note', v_completion_note is not null
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'completed'
  );
end;
$$;

create or replace function public.submit_service_request_feedback(
  p_request_id uuid,
  p_rating integer,
  p_response_speed_score integer default null,
  p_communication_score integer default null,
  p_document_quality_score integer default null,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_feedback_id uuid;
  v_request public.service_requests%rowtype;
  v_reviewer_role text;
  v_reviewed_company_id uuid;
  v_selected_bid public.service_bids%rowtype;
  v_comment text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_rating not between 1 and 5 then
    raise exception '평점은 1점부터 5점까지 입력해 주세요.';
  end if;

  if p_response_speed_score is not null and p_response_speed_score not between 1 and 5 then
    raise exception '응답 속도 점수는 1점부터 5점까지 입력해 주세요.';
  end if;

  if p_communication_score is not null and p_communication_score not between 1 and 5 then
    raise exception '소통 점수는 1점부터 5점까지 입력해 주세요.';
  end if;

  if p_document_quality_score is not null and p_document_quality_score not between 1 and 5 then
    raise exception '서류 품질 점수는 1점부터 5점까지 입력해 주세요.';
  end if;

  v_actor_company_id := public.current_company_id();

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 피드백을 제출할 수 없습니다.';
  end if;

  select *
    into v_request
  from public.service_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception '요청을 찾을 수 없습니다.';
  end if;

  if v_request.status <> 'completed'::public.service_request_status then
    raise exception '완료 처리된 요청에만 피드백을 남길 수 있습니다.';
  end if;

  select *
    into v_selected_bid
  from public.service_bids
  where request_id = p_request_id
    and status = 'selected'::public.service_bid_status
  order by selected_at desc nulls last, updated_at desc
  limit 1;

  if v_selected_bid.id is null then
    raise exception '선정된 견적을 확인할 수 없습니다.';
  end if;

  if v_request.requester_company_id = v_actor_company_id then
    v_reviewer_role := 'requester';
    v_reviewed_company_id := v_selected_bid.bidder_company_id;
  elsif v_selected_bid.bidder_company_id = v_actor_company_id then
    v_reviewer_role := 'selected_partner';
    v_reviewed_company_id := v_request.requester_company_id;
  else
    raise exception '완료 요청 피드백을 제출할 권한이 없습니다.';
  end if;

  v_comment := nullif(left(trim(coalesce(p_comment, '')), 500), '');

  insert into public.service_request_feedbacks (
    request_id,
    reviewer_company_id,
    reviewed_company_id,
    reviewer_role,
    rating,
    response_speed_score,
    communication_score,
    document_quality_score,
    comment,
    created_by
  )
  values (
    p_request_id,
    v_actor_company_id,
    v_reviewed_company_id,
    v_reviewer_role,
    p_rating,
    p_response_speed_score,
    p_communication_score,
    p_document_quality_score,
    v_comment,
    auth.uid()
  )
  returning id into v_feedback_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_feedback_submitted',
    'service_request_feedbacks',
    v_feedback_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_type', v_request.request_type,
      'reviewer_role', v_reviewer_role,
      'reviewed_company_id', v_reviewed_company_id,
      'rating', p_rating,
      'has_comment', v_comment is not null
    )
  );

  return v_feedback_id;
end;
$$;

create or replace function public.create_or_update_completion_report(
  p_request_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_actor_role text;
  v_report_id uuid;
  v_request public.service_requests%rowtype;
  v_selected_bid public.service_bids%rowtype;
  v_existing_report public.service_request_completion_reports%rowtype;
  v_payload jsonb;
  v_summary text;
  v_currency text;
  v_final_amount numeric;
  v_settlement_items jsonb;
  v_timeline_events jsonb;
  v_clearance_result jsonb;
  v_freight_result jsonb;
  v_source_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_payload is not null and jsonb_typeof(p_payload) <> 'object' then
    raise exception '완료 리포트 payload 형식이 올바르지 않습니다.';
  end if;

  v_payload := coalesce(p_payload, '{}'::jsonb);
  v_actor_company_id := public.current_company_id();

  select *
    into v_request
  from public.service_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception '요청을 찾을 수 없습니다.';
  end if;

  if v_request.status <> 'completed'::public.service_request_status then
    raise exception '완료 처리된 요청만 완료 리포트를 작성할 수 있습니다.';
  end if;

  select *
    into v_selected_bid
  from public.service_bids
  where request_id = p_request_id
    and status = 'selected'::public.service_bid_status
  order by selected_at desc nulls last, updated_at desc
  limit 1;

  if v_selected_bid.id is null then
    raise exception '선정된 견적을 확인할 수 없습니다.';
  end if;

  if public.is_staff_or_admin() then
    v_actor_role := 'staff';
  elsif v_request.requester_company_id = v_actor_company_id then
    v_actor_role := 'requester';
  elsif v_selected_bid.bidder_company_id = v_actor_company_id then
    v_actor_role := 'selected_partner';
  else
    raise exception '완료 리포트를 작성할 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 완료 리포트를 작성할 수 없습니다.';
  end if;

  select *
    into v_existing_report
  from public.service_request_completion_reports
  where request_id = p_request_id
    and status <> 'voided'
  order by created_at desc
  limit 1
  for update;

  if v_existing_report.id is not null and v_existing_report.status <> 'draft' then
    raise exception '제출 또는 잠긴 완료 리포트는 수정할 수 없습니다.';
  end if;

  v_summary := nullif(left(trim(coalesce(v_payload->>'summary', '')), 1000), '');
  v_currency := nullif(upper(trim(coalesce(v_payload->>'currency', ''))), '');
  v_final_amount := nullif(v_payload->>'finalAmount', '')::numeric;
  v_settlement_items := coalesce(v_payload->'settlementItems', '[]'::jsonb);
  v_timeline_events := coalesce(v_payload->'timelineEvents', '[]'::jsonb);
  v_clearance_result := coalesce(v_payload->'clearanceResult', '{}'::jsonb);
  v_freight_result := coalesce(v_payload->'freightResult', '{}'::jsonb);
  v_source_snapshot := coalesce(v_payload->'sourceSnapshot', '{}'::jsonb)
    || jsonb_build_object(
      'snapshot_version', 'completion-report-source-v1',
      'request', jsonb_build_object(
        'request_id', p_request_id,
        'request_type', v_request.request_type,
        'request_status', v_request.status,
        'direction', v_request.direction,
        'basis_date', coalesce(v_request.preferred_start_date::text, v_request.created_at::date::text),
        'source_hs_request_id', v_request.source_hs_request_id,
        'has_source_lookup_snapshot', coalesce(v_request.source_lookup_snapshot, '{}'::jsonb) <> '{}'::jsonb
      ),
      'selected_bid', jsonb_build_object(
        'selected_bid_id', v_selected_bid.id,
        'selected_partner_company_id', v_selected_bid.bidder_company_id,
        'bid_type', v_selected_bid.bid_type,
        'bid_status', v_selected_bid.status,
        'selected_at', v_selected_bid.selected_at
      ),
      'lookup', jsonb_build_object(
        'source_lookup_snapshot', coalesce(v_request.source_lookup_snapshot, '{}'::jsonb)
      ),
      'safety', jsonb_build_object(
        'legal_certainty', false,
        'hs_classification_final', false,
        'requires_staff_review_for_legal_outputs', true
      )
  );

  if jsonb_typeof(v_settlement_items) <> 'array'
    or jsonb_typeof(v_timeline_events) <> 'array'
    or jsonb_typeof(v_clearance_result) <> 'object'
    or jsonb_typeof(v_freight_result) <> 'object'
    or jsonb_typeof(v_source_snapshot) <> 'object' then
    raise exception '완료 리포트 상세 형식이 올바르지 않습니다.';
  end if;

  if v_existing_report.id is null then
    insert into public.service_request_completion_reports (
      request_id,
      request_type,
      requester_company_id,
      selected_partner_company_id,
      summary,
      currency,
      final_amount,
      settlement_items,
      timeline_events,
      clearance_result,
      freight_result,
      source_snapshot,
      created_by
    )
    values (
      p_request_id,
      v_request.request_type,
      v_request.requester_company_id,
      v_selected_bid.bidder_company_id,
      v_summary,
      v_currency,
      v_final_amount,
      v_settlement_items,
      v_timeline_events,
      v_clearance_result,
      v_freight_result,
      v_source_snapshot,
      auth.uid()
    )
    returning id into v_report_id;
  else
    update public.service_request_completion_reports
      set summary = v_summary,
          currency = v_currency,
          final_amount = v_final_amount,
          settlement_items = v_settlement_items,
          timeline_events = v_timeline_events,
          clearance_result = v_clearance_result,
          freight_result = v_freight_result,
          source_snapshot = v_source_snapshot,
          updated_at = now()
    where id = v_existing_report.id
    returning id into v_report_id;
  end if;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_completion_report_saved',
    'service_request_completion_reports',
    v_report_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_type', v_request.request_type,
      'actor_company_role', v_actor_role,
      'has_summary', v_summary is not null,
      'settlement_item_count', jsonb_array_length(v_settlement_items),
      'timeline_event_count', jsonb_array_length(v_timeline_events)
    )
  );

  return v_report_id;
end;
$$;

create or replace function public.submit_completion_report(
  p_report_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_actor_role text;
  v_document_count integer;
  v_report public.service_request_completion_reports%rowtype;
  v_request public.service_requests%rowtype;
  v_selected_bid public.service_bids%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  select *
    into v_report
  from public.service_request_completion_reports
  where id = p_report_id
    and status <> 'voided'
  for update;

  if v_report.id is null then
    raise exception '완료 리포트를 찾을 수 없습니다.';
  end if;

  if v_report.status <> 'draft' then
    raise exception '초안 상태의 완료 리포트만 제출할 수 있습니다.';
  end if;

  select *
    into v_request
  from public.service_requests
  where id = v_report.request_id
  for update;

  if v_request.id is null or v_request.status <> 'completed'::public.service_request_status then
    raise exception '완료 처리된 요청의 리포트만 제출할 수 있습니다.';
  end if;

  select *
    into v_selected_bid
  from public.service_bids
  where request_id = v_report.request_id
    and status = 'selected'::public.service_bid_status
  order by selected_at desc nulls last, updated_at desc
  limit 1;

  if v_selected_bid.id is null or v_selected_bid.bidder_company_id <> v_report.selected_partner_company_id then
    raise exception '선정된 견적과 완료 리포트 파트너가 일치하지 않습니다.';
  end if;

  if public.is_staff_or_admin() then
    v_actor_role := 'staff';
  elsif v_report.requester_company_id = v_actor_company_id then
    v_actor_role := 'requester';
  elsif v_report.selected_partner_company_id = v_actor_company_id then
    v_actor_role := 'selected_partner';
  else
    raise exception '완료 리포트를 제출할 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 완료 리포트를 제출할 수 없습니다.';
  end if;

  select count(*)::integer
    into v_document_count
  from public.service_request_completion_report_documents document
  where document.completion_report_id = p_report_id;

  if coalesce(v_document_count, 0) = 0 then
    raise exception '완료 리포트 제출 전 최종 보관 서류를 1건 이상 연결해 주세요.';
  end if;

  if v_report.summary is null
    and v_report.final_amount is null
    and jsonb_array_length(v_report.settlement_items) = 0
    and v_report.freight_result = '{}'::jsonb
    and v_report.clearance_result = '{}'::jsonb then
    raise exception '완료 리포트 제출 전 완료 요약, 정산, 운송 또는 통관 결과 중 하나를 입력해 주세요.';
  end if;

  update public.service_request_completion_reports
    set status = 'submitted',
        submitted_by = auth.uid(),
        submitted_at = now(),
        updated_at = now()
  where id = p_report_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_completion_report_submitted',
    'service_request_completion_reports',
    p_report_id,
    jsonb_build_object(
      'request_id', v_report.request_id,
      'request_type', v_report.request_type,
      'actor_company_role', v_actor_role,
      'previous_status', v_report.status,
      'next_status', 'submitted',
      'linked_document_count', v_document_count
    )
  );

  return p_report_id;
end;
$$;

create or replace function public.acknowledge_completion_report(
  p_report_id uuid,
  p_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ack_role text;
  v_actor_company_id uuid;
  v_next_status text;
  v_report public.service_request_completion_reports%rowtype;
  v_source_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_ack_role := lower(trim(coalesce(p_role, '')));
  if v_ack_role not in ('requester', 'partner') then
    raise exception '완료 리포트 확인 역할을 확인해 주세요.';
  end if;

  v_actor_company_id := public.current_company_id();

  select *
    into v_report
  from public.service_request_completion_reports
  where id = p_report_id
    and status <> 'voided'
  for update;

  if v_report.id is null then
    raise exception '완료 리포트를 찾을 수 없습니다.';
  end if;

  if v_report.status not in ('submitted', 'requester_acknowledged', 'partner_acknowledged') then
    raise exception '제출된 완료 리포트만 확인할 수 있습니다.';
  end if;

  if v_ack_role = 'requester' and not (public.is_staff_or_admin() or v_report.requester_company_id = v_actor_company_id) then
    raise exception '화주 확인 권한이 없습니다.';
  end if;

  if v_ack_role = 'partner' and not (public.is_staff_or_admin() or v_report.selected_partner_company_id = v_actor_company_id) then
    raise exception '파트너 확인 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 완료 리포트를 확인할 수 없습니다.';
  end if;

  v_next_status := case
    when v_ack_role = 'requester' then 'requester_acknowledged'
    else 'partner_acknowledged'
  end;

  v_source_snapshot := jsonb_set(
    jsonb_set(
      coalesce(v_report.source_snapshot, '{}'::jsonb),
      '{confirmations}',
      coalesce(v_report.source_snapshot->'confirmations', '{}'::jsonb),
      true
    ),
    array['confirmations', v_ack_role],
    jsonb_build_object(
      'acknowledgedAt', now(),
      'acknowledgedBy', auth.uid()
    ),
    true
  );

  update public.service_request_completion_reports
    set status = v_next_status,
        source_snapshot = v_source_snapshot,
        updated_at = now()
  where id = p_report_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_completion_report_acknowledged',
    'service_request_completion_reports',
    p_report_id,
    jsonb_build_object(
      'request_id', v_report.request_id,
      'request_type', v_report.request_type,
      'acknowledged_role', v_ack_role,
      'previous_status', v_report.status,
      'next_status', v_next_status
    )
  );

  return p_report_id;
end;
$$;

create or replace function public.review_completion_report(
  p_report_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document_count integer;
  v_report public.service_request_completion_reports%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_staff_or_admin() then
    raise exception '완료 리포트 운영 검토 권한이 없습니다.';
  end if;

  select *
    into v_report
  from public.service_request_completion_reports
  where id = p_report_id
    and status <> 'voided'
  for update;

  if v_report.id is null then
    raise exception '완료 리포트를 찾을 수 없습니다.';
  end if;

  if v_report.status = 'locked' then
    raise exception '잠긴 완료 리포트는 다시 검토 상태로 변경할 수 없습니다.';
  end if;

  select count(*)::integer
    into v_document_count
  from public.service_request_completion_report_documents document
  where document.completion_report_id = p_report_id;

  if coalesce(v_document_count, 0) = 0 then
    raise exception '운영 검토 전 최종 보관 서류 연결을 확인해 주세요.';
  end if;

  update public.service_request_completion_reports
    set status = 'operator_reviewed',
        updated_at = now()
  where id = p_report_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    public.current_company_id(),
    'service_request_completion_report_reviewed',
    'service_request_completion_reports',
    p_report_id,
    jsonb_build_object(
      'request_id', v_report.request_id,
      'request_type', v_report.request_type,
      'previous_status', v_report.status,
      'next_status', 'operator_reviewed',
      'linked_document_count', v_document_count
    )
  );

  return p_report_id;
end;
$$;

create or replace function public.lock_completion_report(
  p_report_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document_count integer;
  v_report public.service_request_completion_reports%rowtype;
  v_summary_and_sources text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_staff_or_admin() then
    raise exception '완료 리포트 잠금 권한이 없습니다.';
  end if;

  select *
    into v_report
  from public.service_request_completion_reports
  where id = p_report_id
    and status <> 'voided'
  for update;

  if v_report.id is null then
    raise exception '완료 리포트를 찾을 수 없습니다.';
  end if;

  if v_report.status <> 'operator_reviewed' then
    raise exception '운영 검토가 완료된 리포트만 잠글 수 있습니다.';
  end if;

  select count(*)::integer
    into v_document_count
  from public.service_request_completion_report_documents document
  where document.completion_report_id = p_report_id;

  if coalesce(v_document_count, 0) = 0 then
    raise exception '잠금 전 최종 보관 서류 연결을 확인해 주세요.';
  end if;

  v_summary_and_sources := coalesce(v_report.summary, '') || ' ' || coalesce(v_report.source_snapshot::text, '');
  if v_summary_and_sources ~ '(법적 확정|요건 없음 확정|FTA 적용 보장|HSK 확정)' then
    raise exception '법적 확정 또는 보장으로 오해될 수 있는 표현은 잠금 전에 수정해 주세요.';
  end if;

  update public.service_request_completion_reports
    set status = 'locked',
        locked_by = auth.uid(),
        locked_at = now(),
        updated_at = now()
  where id = p_report_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    public.current_company_id(),
    'service_request_completion_report_locked',
    'service_request_completion_reports',
    p_report_id,
    jsonb_build_object(
      'request_id', v_report.request_id,
      'request_type', v_report.request_type,
      'previous_status', v_report.status,
      'next_status', 'locked',
      'linked_document_count', v_document_count
    )
  );

  return p_report_id;
end;
$$;

create or replace function public.attach_completion_report_document(
  p_report_id uuid,
  p_request_document_id uuid,
  p_document_role text,
  p_required_for_archive boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_actor_role text;
  v_mapping_id uuid;
  v_report public.service_request_completion_reports%rowtype;
  v_document public.service_request_documents%rowtype;
  v_document_role text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();
  v_document_role := nullif(left(trim(coalesce(p_document_role, '')), 80), '');

  if v_document_role is null then
    raise exception '최종 보관 서류 역할을 입력해 주세요.';
  end if;

  select *
    into v_report
  from public.service_request_completion_reports
  where id = p_report_id
    and status <> 'voided'
  for update;

  if v_report.id is null then
    raise exception '완료 리포트를 찾을 수 없습니다.';
  end if;

  if v_report.status = 'locked' then
    raise exception '잠긴 완료 리포트의 보관 서류는 수정할 수 없습니다.';
  end if;

  select *
    into v_document
  from public.service_request_documents
  where id = p_request_document_id;

  if v_document.id is null then
    raise exception '연결할 요청 서류를 찾을 수 없습니다.';
  end if;

  if v_document.request_id <> v_report.request_id then
    raise exception '완료 리포트와 같은 요청의 서류만 연결할 수 있습니다.';
  end if;

  if public.is_staff_or_admin() then
    v_actor_role := 'staff';
  elsif v_report.requester_company_id = v_actor_company_id then
    v_actor_role := 'requester';
  elsif v_report.selected_partner_company_id = v_actor_company_id then
    v_actor_role := 'selected_partner';
  else
    raise exception '완료 리포트 보관 서류를 연결할 권한이 없습니다.';
  end if;

  if not public.is_staff_or_admin() and not public.is_company_active_for_marketplace(v_actor_company_id) then
    raise exception '정지 또는 차단된 회사는 완료 리포트 보관 서류를 연결할 수 없습니다.';
  end if;

  if not public.can_read_service_request_document(p_request_document_id) then
    raise exception '열람 가능한 요청 서류만 완료 리포트에 연결할 수 있습니다.';
  end if;

  insert into public.service_request_completion_report_documents (
    completion_report_id,
    request_document_id,
    document_role,
    required_for_archive,
    added_by
  )
  values (
    p_report_id,
    p_request_document_id,
    v_document_role,
    coalesce(p_required_for_archive, false),
    auth.uid()
  )
  on conflict (completion_report_id, request_document_id) do update
    set document_role = excluded.document_role,
        required_for_archive = excluded.required_for_archive
  returning id into v_mapping_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_completion_report_document_attached',
    'service_request_completion_report_documents',
    v_mapping_id,
    jsonb_build_object(
      'request_id', v_report.request_id,
      'report_id', p_report_id,
      'request_document_id', p_request_document_id,
      'actor_company_role', v_actor_role,
      'document_role', v_document_role,
      'required_for_archive', coalesce(p_required_for_archive, false)
    )
  );

  return v_mapping_id;
end;
$$;

create or replace function public.get_partner_feedback_summaries(
  p_company_ids uuid[]
)
returns table (
  company_id uuid,
  feedback_count bigint,
  avg_rating numeric,
  avg_response_speed numeric,
  avg_communication numeric,
  avg_document_quality numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    feedback.reviewed_company_id as company_id,
    count(*) as feedback_count,
    round(avg(feedback.rating)::numeric, 1) as avg_rating,
    round(avg(feedback.response_speed_score)::numeric, 1) as avg_response_speed,
    round(avg(feedback.communication_score)::numeric, 1) as avg_communication,
    round(avg(feedback.document_quality_score)::numeric, 1) as avg_document_quality
  from public.service_request_feedbacks feedback
  where feedback.reviewed_company_id = any(coalesce(p_company_ids, '{}'::uuid[]))
  group by feedback.reviewed_company_id;
$$;

create or replace function public.get_partner_trust_summaries(
  p_company_ids uuid[]
)
returns table (
  company_id uuid,
  verification_status public.company_verification_status,
  trust_score integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    company.id as company_id,
    company.verification_status,
    company.trust_score
  from public.companies company
  where company.id = any(coalesce(p_company_ids, '{}'::uuid[]))
    and company.verification_status not in ('suspended', 'blocked');
$$;

create or replace function public.ask_service_request_question(
  p_request_id uuid,
  p_question text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_question_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if nullif(trim(p_question), '') is null or char_length(trim(p_question)) < 3 then
    raise exception '질문은 3자 이상 입력해야 합니다.';
  end if;

  if char_length(trim(p_question)) > 1000 then
    raise exception '질문은 1000자 이하로 입력해야 합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  if not public.can_bid_on_service_request(p_request_id) then
    raise exception '질문을 등록할 수 있는 매칭 요청이 아닙니다.';
  end if;

  insert into public.service_request_questions (
    request_id,
    bidder_company_id,
    asked_by,
    question
  )
  values (
    p_request_id,
    v_actor_company_id,
    auth.uid(),
    trim(p_question)
  )
  returning id into v_question_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_question_asked',
    'service_request_questions',
    v_question_id,
    jsonb_build_object('request_id', p_request_id)
  );

  return v_question_id;
end;
$$;

create or replace function public.answer_service_request_question(
  p_question_id uuid,
  p_answer text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_answered_at timestamptz;
  v_deadline_at timestamptz;
  v_request_id uuid;
  v_request_status public.service_request_status;
  v_requester_company_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if nullif(trim(p_answer), '') is null or char_length(trim(p_answer)) < 2 then
    raise exception '답변은 2자 이상 입력해야 합니다.';
  end if;

  if char_length(trim(p_answer)) > 1000 then
    raise exception '답변은 1000자 이하로 입력해야 합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if not public.is_staff_or_admin() and v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  select question.request_id, question.answered_at, request.requester_company_id, request.status, request.deadline_at
    into v_request_id, v_answered_at, v_requester_company_id, v_request_status, v_deadline_at
  from public.service_request_questions question
  join public.service_requests request on request.id = question.request_id
  where question.id = p_question_id
  for update;

  if v_request_id is null then
    raise exception '질문을 찾을 수 없습니다.';
  end if;

  if not public.is_staff_or_admin() and v_requester_company_id is distinct from v_actor_company_id then
    raise exception '질문에 답변할 권한이 없습니다.';
  end if;

  if v_answered_at is not null then
    raise exception '이미 답변된 질문입니다.';
  end if;

  if v_request_status not in ('open', 'bids_received') then
    raise exception '진행 중인 요청의 질문만 답변할 수 있습니다.';
  end if;

  if v_deadline_at is null or v_deadline_at <= now() then
    raise exception '마감된 요청의 질문은 답변할 수 없습니다.';
  end if;

  update public.service_request_questions
    set answer = trim(p_answer),
        answered_by = auth.uid(),
        answered_at = now()
  where id = p_question_id
    and answered_at is null;

  if not found then
    raise exception '질문 답변 상태를 갱신하지 못했습니다.';
  end if;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'service_request_question_answered',
    'service_request_questions',
    p_question_id,
    jsonb_build_object('request_id', v_request_id)
  );

  return p_question_id;
end;
$$;

grant execute on function public.select_service_bid(uuid) to authenticated;
grant execute on function public.set_service_request_partner_interest(uuid, text) to authenticated;
grant execute on function public.start_selected_service_request(uuid) to authenticated;
grant execute on function public.complete_selected_service_request(uuid, text) to authenticated;
grant execute on function public.submit_service_request_feedback(uuid, integer, integer, integer, integer, text) to authenticated;
grant execute on function public.create_or_update_completion_report(uuid, jsonb) to authenticated;
grant execute on function public.attach_completion_report_document(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.submit_completion_report(uuid) to authenticated;
grant execute on function public.acknowledge_completion_report(uuid, text) to authenticated;
grant execute on function public.review_completion_report(uuid) to authenticated;
grant execute on function public.lock_completion_report(uuid) to authenticated;
grant execute on function public.get_partner_feedback_summaries(uuid[]) to authenticated;
grant execute on function public.get_partner_trust_summaries(uuid[]) to authenticated;
grant execute on function public.ask_service_request_question(uuid, text) to authenticated;
grant execute on function public.answer_service_request_question(uuid, text) to authenticated;

create or replace function public.create_freight_request_draft(
  p_direction public.request_direction,
  p_title text,
  p_product_summary text default null,
  p_origin_country_code text default null,
  p_destination_country_code text default null,
  p_incoterms text default null,
  p_preferred_start_date date default null,
  p_preferred_arrival_date date default null,
  p_transport_mode text default null,
  p_load_type text default null,
  p_origin_place text default null,
  p_destination_place text default null,
  p_origin_port text default null,
  p_destination_port text default null,
  p_package_count numeric default null,
  p_package_unit text default null,
  p_gross_weight numeric default null,
  p_weight_unit text default null,
  p_cbm numeric default null,
  p_container_type text default null,
  p_hazardous boolean default false,
  p_temperature_controlled boolean default false,
  p_used_car boolean default false,
  p_vehicle_vin text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_company_id uuid;
  v_request_id uuid;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  if not public.is_company_active_for_marketplace(v_company_id) then
    raise exception '정지 또는 차단된 회사는 요청을 생성할 수 없습니다.';
  end if;

  insert into public.service_requests (
    request_type,
    requester_company_id,
    created_by,
    direction,
    status,
    title,
    product_summary,
    origin_country_code,
    destination_country_code,
    incoterms,
    preferred_start_date,
    preferred_arrival_date
  )
  values (
    'freight',
    v_company_id,
    v_actor,
    p_direction,
    'draft',
    nullif(trim(p_title), ''),
    nullif(trim(coalesce(p_product_summary, '')), ''),
    nullif(upper(trim(coalesce(p_origin_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_destination_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_incoterms, ''))), ''),
    p_preferred_start_date,
    p_preferred_arrival_date
  )
  returning id into v_request_id;

  insert into public.freight_request_details (
    request_id,
    transport_mode,
    load_type,
    origin_place,
    destination_place,
    origin_port,
    destination_port,
    package_count,
    package_unit,
    gross_weight,
    weight_unit,
    cbm,
    container_type,
    hazardous,
    temperature_controlled,
    used_car,
    vehicle_vin
  )
  values (
    v_request_id,
    nullif(trim(coalesce(p_transport_mode, '')), ''),
    nullif(trim(coalesce(p_load_type, '')), ''),
    nullif(trim(coalesce(p_origin_place, '')), ''),
    nullif(trim(coalesce(p_destination_place, '')), ''),
    nullif(upper(trim(coalesce(p_origin_port, ''))), ''),
    nullif(upper(trim(coalesce(p_destination_port, ''))), ''),
    p_package_count,
    nullif(trim(coalesce(p_package_unit, '')), ''),
    p_gross_weight,
    nullif(trim(coalesce(p_weight_unit, '')), ''),
    p_cbm,
    nullif(trim(coalesce(p_container_type, '')), ''),
    coalesce(p_hazardous, false),
    coalesce(p_temperature_controlled, false),
    coalesce(p_used_car, false),
    nullif(trim(coalesce(p_vehicle_vin, '')), '')
  );

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    v_actor,
    v_company_id,
    'freight_request_draft_created',
    'service_requests',
    v_request_id,
    jsonb_build_object('request_type', 'freight')
  );

  return v_request_id;
end;
$$;

grant execute on function public.create_freight_request_draft(
  public.request_direction,
  text,
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text,
  numeric,
  text,
  numeric,
  text,
  boolean,
  boolean,
  boolean,
  text
) to authenticated;

create or replace function public.create_clearance_request_draft(
  p_direction public.request_direction,
  p_title text,
  p_product_summary text default null,
  p_hsk_code text default null,
  p_hs6 text default null,
  p_origin_country_code text default null,
  p_export_country_code text default null,
  p_shipment_country_code text default null,
  p_destination_country_code text default null,
  p_incoterms text default null,
  p_preferred_start_date date default null,
  p_preferred_arrival_date date default null,
  p_hs_code_known boolean default false,
  p_fta_preference_requested boolean default false,
  p_requirements_check_needed boolean default false,
  p_urgent boolean default false,
  p_estimated_declaration_count integer default null,
  p_product_material text default null,
  p_product_usage text default null,
  p_model_name text default null,
  p_required_review_points jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_company_id uuid;
  v_request_id uuid;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_company_id := public.current_company_id();
  if v_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  if not public.is_company_active_for_marketplace(v_company_id) then
    raise exception '정지 또는 차단된 회사는 요청을 생성할 수 없습니다.';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception '요청 제목을 입력해야 합니다.';
  end if;

  if p_hsk_code is not null and nullif(trim(p_hsk_code), '') is not null and trim(p_hsk_code) !~ '^[0-9]{10}$' then
    raise exception 'HSK는 숫자 10자리로 입력해 주세요.';
  end if;

  if p_hs6 is not null and nullif(trim(p_hs6), '') is not null and trim(p_hs6) !~ '^[0-9]{6}$' then
    raise exception 'HS6는 숫자 6자리로 입력해 주세요.';
  end if;

  if p_estimated_declaration_count is not null and p_estimated_declaration_count <= 0 then
    raise exception '예상 신고 건수는 1 이상이어야 합니다.';
  end if;

  insert into public.service_requests (
    request_type,
    requester_company_id,
    created_by,
    direction,
    status,
    title,
    product_summary,
    hsk_code,
    hs6,
    origin_country_code,
    export_country_code,
    shipment_country_code,
    destination_country_code,
    incoterms,
    preferred_start_date,
    preferred_arrival_date,
    missing_information
  )
  values (
    'clearance',
    v_company_id,
    v_actor,
    p_direction,
    'draft',
    trim(p_title),
    nullif(trim(coalesce(p_product_summary, '')), ''),
    nullif(trim(coalesce(p_hsk_code, '')), ''),
    nullif(trim(coalesce(p_hs6, '')), ''),
    nullif(upper(trim(coalesce(p_origin_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_export_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_shipment_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_destination_country_code, ''))), ''),
    nullif(upper(trim(coalesce(p_incoterms, ''))), ''),
    p_preferred_start_date,
    p_preferred_arrival_date,
    coalesce(p_required_review_points, '[]'::jsonb)
  )
  returning id into v_request_id;

  insert into public.clearance_request_details (
    request_id,
    hs_code_known,
    fta_preference_requested,
    requirements_check_needed,
    urgent,
    estimated_declaration_count,
    product_material,
    product_usage,
    model_name,
    required_review_points
  )
  values (
    v_request_id,
    coalesce(p_hs_code_known, false),
    coalesce(p_fta_preference_requested, false),
    coalesce(p_requirements_check_needed, false),
    coalesce(p_urgent, false),
    p_estimated_declaration_count,
    nullif(trim(coalesce(p_product_material, '')), ''),
    nullif(trim(coalesce(p_product_usage, '')), ''),
    nullif(trim(coalesce(p_model_name, '')), ''),
    coalesce(p_required_review_points, '[]'::jsonb)
  );

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    v_actor,
    v_company_id,
    'clearance_request_draft_created',
    'service_requests',
    v_request_id,
    jsonb_build_object('request_type', 'clearance')
  );

  return v_request_id;
end;
$$;

grant execute on function public.create_clearance_request_draft(
  public.request_direction,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  date,
  boolean,
  boolean,
  boolean,
  boolean,
  integer,
  text,
  text,
  text,
  jsonb
) to authenticated;

create or replace function public.publish_freight_request(
  p_request_id uuid,
  p_deadline_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_request public.service_requests%rowtype;
  v_detail public.freight_request_details%rowtype;
  v_match_count integer := 0;
  v_cargo_tags text[] := '{}';
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_deadline_at <= now() then
    raise exception '마감 시간은 현재 이후여야 합니다.';
  end if;

  if p_deadline_at > now() + interval '48 hours' then
    raise exception '견적 모집 시간은 최대 48시간입니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if not public.is_staff_or_admin() and v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  select *
    into v_request
  from public.service_requests request
  where request.id = p_request_id
    and request.request_type = 'freight'
  for update;

  if v_request.id is null then
    raise exception '운송 견적 요청을 찾을 수 없습니다.';
  end if;

  if not public.is_staff_or_admin() and v_request.requester_company_id is distinct from v_actor_company_id then
    raise exception '요청을 공개할 권한이 없습니다.';
  end if;

  if not public.is_company_active_for_marketplace(v_request.requester_company_id) then
    raise exception '정지 또는 차단된 회사는 요청을 공개할 수 없습니다.';
  end if;

  if not public.is_company_verified_for_marketplace(v_request.requester_company_id) then
    raise exception '운영자 승인 전에는 요청을 공개할 수 없습니다.';
  end if;

  if v_request.status <> 'draft'::public.service_request_status then
    raise exception '임시저장 상태의 요청만 공개할 수 있습니다.';
  end if;

  select *
    into v_detail
  from public.freight_request_details detail
  where detail.request_id = p_request_id;

  if coalesce(v_detail.used_car, false) then
    v_cargo_tags := array_append(v_cargo_tags, 'used_car');
  end if;
  if coalesce(v_detail.hazardous, false) then
    v_cargo_tags := array_append(v_cargo_tags, 'hazardous');
  end if;
  if coalesce(v_detail.temperature_controlled, false) then
    v_cargo_tags := array_append(v_cargo_tags, 'temperature_controlled');
  end if;

  if nullif(trim(coalesce(v_request.origin_country_code, '')), '') is null
    or nullif(trim(coalesce(v_request.destination_country_code, '')), '') is null
    or nullif(trim(coalesce(v_detail.transport_mode, '')), '') is null then
    raise exception '출발 국가, 도착 국가, 운송 방식은 공개 전에 필요합니다.';
  end if;

  if v_request.origin_country_code !~ '^[A-Z]{2}$'
    or v_request.destination_country_code !~ '^[A-Z]{2}$' then
    raise exception '국가 코드는 ISO 2자리 코드로 입력해 주세요.';
  end if;

  if v_detail.transport_mode not in ('sea', 'air', 'express', 'truck', 'rail') then
    raise exception '지원하지 않는 운송 방식입니다.';
  end if;

  insert into public.service_request_partner_matches (
    request_id,
    partner_company_id,
    matched_by,
    match_reason,
    notification_status
  )
  select
    v_request.id,
    preference.company_id,
    'preference',
    jsonb_build_object(
      'service_type', preference.service_type,
      'directions', preference.directions,
      'origin_country_codes', preference.origin_country_codes,
      'destination_country_codes', preference.destination_country_codes,
      'transport_modes', preference.transport_modes,
      'cargo_tags', preference.cargo_tags,
      'ports', preference.ports
    ),
    case when preference.notification_enabled then 'pending' else 'skipped' end
  from public.partner_service_preferences preference
  where preference.service_type = 'freight'::public.service_request_type
    and preference.company_id <> v_request.requester_company_id
    and public.company_has_party_type(preference.company_id, 'forwarder'::public.marketplace_party_type)
    and public.is_company_verified_for_marketplace(preference.company_id)
    and public.is_company_active_for_marketplace(preference.company_id)
    and (
      coalesce(array_length(preference.directions, 1), 0) = 0
      or v_request.direction::text = any(preference.directions)
    )
    and (
      coalesce(array_length(preference.origin_country_codes, 1), 0) = 0
      or upper(v_request.origin_country_code) = any(preference.origin_country_codes)
    )
    and (
      coalesce(array_length(preference.destination_country_codes, 1), 0) = 0
      or upper(v_request.destination_country_code) = any(preference.destination_country_codes)
    )
    and (
      coalesce(array_length(preference.transport_modes, 1), 0) = 0
      or v_detail.transport_mode = any(preference.transport_modes)
    )
    and (
      coalesce(array_length(preference.ports, 1), 0) = 0
      or upper(coalesce(v_detail.origin_port, '')) = any(preference.ports)
      or upper(coalesce(v_detail.destination_port, '')) = any(preference.ports)
    )
    and (
      coalesce(array_length(preference.cargo_tags, 1), 0) = 0
      or preference.cargo_tags && v_cargo_tags
    )
  on conflict (request_id, partner_company_id) do nothing;

  get diagnostics v_match_count = row_count;

  if v_match_count = 0 then
    raise exception '조건에 맞는 검증 포워더가 없어 요청을 공개할 수 없습니다.';
  end if;

  update public.service_requests
    set status = 'open'::public.service_request_status,
        deadline_at = p_deadline_at,
        published_at = now(),
        updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'freight_request_published',
    'service_requests',
    p_request_id,
    jsonb_build_object(
      'matched_count', v_match_count,
      'deadline_at', p_deadline_at
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'matched_count', v_match_count
  );
end;
$$;

grant execute on function public.publish_freight_request(uuid, timestamptz) to authenticated;

create or replace function public.publish_clearance_request(
  p_request_id uuid,
  p_deadline_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_match_count integer := 0;
  v_request public.service_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_deadline_at <= now() then
    raise exception '마감 시간은 현재 이후여야 합니다.';
  end if;

  if p_deadline_at > now() + interval '48 hours' then
    raise exception '통관 의뢰 모집 시간은 최대 48시간입니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if not public.is_staff_or_admin() and v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  select *
    into v_request
  from public.service_requests request
  where request.id = p_request_id
    and request.request_type = 'clearance'
  for update;

  if v_request.id is null then
    raise exception '통관 의뢰 요청을 찾을 수 없습니다.';
  end if;

  if not public.is_staff_or_admin() and v_request.requester_company_id is distinct from v_actor_company_id then
    raise exception '요청을 공개할 권한이 없습니다.';
  end if;

  if not public.is_company_active_for_marketplace(v_request.requester_company_id) then
    raise exception '정지 또는 차단된 회사는 요청을 공개할 수 없습니다.';
  end if;

  if not public.is_company_verified_for_marketplace(v_request.requester_company_id) then
    raise exception '운영자 승인 전에는 요청을 공개할 수 없습니다.';
  end if;

  if v_request.status <> 'draft'::public.service_request_status then
    raise exception '임시저장 상태의 요청만 공개할 수 있습니다.';
  end if;

  if nullif(trim(coalesce(v_request.destination_country_code, '')), '') is null then
    raise exception '목적국은 공개 전에 필요합니다.';
  end if;

  if v_request.destination_country_code !~ '^[A-Z]{2}$' then
    raise exception '국가 코드는 ISO 2자리 코드로 입력해 주세요.';
  end if;

  insert into public.service_request_partner_matches (
    request_id,
    partner_company_id,
    matched_by,
    match_reason,
    notification_status
  )
  select
    v_request.id,
    preference.company_id,
    'preference',
    jsonb_build_object(
      'service_type', preference.service_type,
      'directions', preference.directions,
      'origin_country_codes', preference.origin_country_codes,
      'destination_country_codes', preference.destination_country_codes,
      'urgent_available', preference.urgent_available
    ),
    case when preference.notification_enabled then 'pending' else 'skipped' end
  from public.partner_service_preferences preference
  join public.clearance_request_details detail on detail.request_id = v_request.id
  where preference.service_type = 'clearance'::public.service_request_type
    and preference.company_id <> v_request.requester_company_id
    and public.company_has_party_type(preference.company_id, 'customs_broker'::public.marketplace_party_type)
    and public.is_company_verified_for_marketplace(preference.company_id)
    and public.is_company_active_for_marketplace(preference.company_id)
    and (
      coalesce(array_length(preference.directions, 1), 0) = 0
      or v_request.direction::text = any(preference.directions)
    )
    and (
      coalesce(array_length(preference.origin_country_codes, 1), 0) = 0
      or upper(coalesce(v_request.origin_country_code, '')) = any(preference.origin_country_codes)
      or upper(coalesce(v_request.export_country_code, '')) = any(preference.origin_country_codes)
    )
    and (
      coalesce(array_length(preference.destination_country_codes, 1), 0) = 0
      or upper(v_request.destination_country_code) = any(preference.destination_country_codes)
    )
    and (
      coalesce(detail.urgent, false) = false
      or preference.urgent_available = true
    )
  on conflict (request_id, partner_company_id) do nothing;

  get diagnostics v_match_count = row_count;

  if v_match_count = 0 then
    raise exception '조건에 맞는 검증 관세사무소가 없어 요청을 공개할 수 없습니다.';
  end if;

  update public.service_requests
    set status = 'open'::public.service_request_status,
        deadline_at = p_deadline_at,
        published_at = now(),
        updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'clearance_request_published',
    'service_requests',
    p_request_id,
    jsonb_build_object(
      'matched_count', v_match_count,
      'deadline_at', p_deadline_at
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'matched_count', v_match_count
  );
end;
$$;

grant execute on function public.publish_clearance_request(uuid, timestamptz) to authenticated;

create or replace function public.submit_freight_bid(
  p_request_id uuid,
  p_currency text,
  p_total_amount numeric,
  p_valid_until date default null,
  p_lead_time_days integer default null,
  p_message text default null,
  p_freight_rate_amount numeric default null,
  p_local_charge_amount numeric default null,
  p_surcharge_amount numeric default null,
  p_transit_time_days integer default null,
  p_free_time_note text default null,
  p_carrier_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_bid_id uuid;
  v_existing_bid_id uuid;
  v_match_id uuid;
  v_request public.service_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();
  if v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  if p_total_amount is null or p_total_amount <= 0 then
    raise exception '견적 총액을 입력해야 합니다.';
  end if;

  if upper(trim(coalesce(p_currency, ''))) !~ '^[A-Z]{3}$' then
    raise exception '통화 코드는 3자리 코드로 입력해 주세요.';
  end if;

  if (p_freight_rate_amount is not null and p_freight_rate_amount <= 0)
    or (p_local_charge_amount is not null and p_local_charge_amount <= 0)
    or (p_surcharge_amount is not null and p_surcharge_amount <= 0) then
    raise exception '견적 상세 금액은 0보다 커야 합니다.';
  end if;

  if (p_lead_time_days is not null and p_lead_time_days <= 0)
    or (p_transit_time_days is not null and p_transit_time_days <= 0) then
    raise exception '리드타임과 운송일수는 1일 이상이어야 합니다.';
  end if;

  if p_valid_until is not null and p_valid_until < current_date then
    raise exception '견적 유효기한은 오늘 이후여야 합니다.';
  end if;

  select *
    into v_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if v_request.id is null
    or v_request.request_type <> 'freight'::public.service_request_type then
    raise exception '운송 견적 요청을 찾을 수 없습니다.';
  end if;

  if v_request.status not in ('open', 'bids_received') then
    raise exception '견적을 받을 수 있는 요청 상태가 아닙니다.';
  end if;

  if v_request.deadline_at is null or v_request.deadline_at <= now() then
    raise exception '견적 제출 마감 시간이 지났습니다.';
  end if;

  select matched.id
    into v_match_id
  from public.service_request_partner_matches matched
  where matched.request_id = p_request_id
    and matched.partner_company_id = v_actor_company_id
  for update;

  if v_match_id is null then
    raise exception '매칭 정보를 찾을 수 없습니다.';
  end if;

  if not public.can_bid_on_service_request(p_request_id) then
    raise exception '이 요청에 견적을 제출할 권한이 없습니다.';
  end if;

  select bid.id
    into v_existing_bid_id
  from public.service_bids bid
  where bid.request_id = p_request_id
    and bid.bidder_company_id = v_actor_company_id
    and bid.status not in ('withdrawn', 'rejected', 'expired', 'hidden')
  limit 1;

  if v_existing_bid_id is not null then
    raise exception '이미 제출 중인 견적이 있습니다.';
  end if;

  insert into public.service_bids (
    request_id,
    bidder_company_id,
    created_by,
    bid_type,
    status,
    currency,
    total_amount,
    valid_until,
    lead_time_days,
    message,
    submitted_at
  )
  values (
    p_request_id,
    v_actor_company_id,
    auth.uid(),
    'freight',
    'submitted',
    upper(trim(p_currency)),
    p_total_amount,
    p_valid_until,
    p_lead_time_days,
    nullif(trim(coalesce(p_message, '')), ''),
    now()
  )
  returning id into v_bid_id;

  insert into public.freight_bid_details (
    bid_id,
    freight_rate_amount,
    local_charge_amount,
    surcharge_amount,
    transit_time_days,
    free_time_note,
    carrier_note
  )
  values (
    v_bid_id,
    p_freight_rate_amount,
    p_local_charge_amount,
    p_surcharge_amount,
    p_transit_time_days,
    nullif(trim(coalesce(p_free_time_note, '')), ''),
    nullif(trim(coalesce(p_carrier_note, '')), '')
  );

  update public.service_requests
    set status = 'bids_received'::public.service_request_status,
        updated_at = now()
  where id = p_request_id
    and status = 'open'::public.service_request_status;

  update public.service_request_partner_matches
    set interest_status = 'interested'
  where request_id = p_request_id
    and partner_company_id = v_actor_company_id
    and interest_status in ('none', 'viewed');

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'freight_bid_submitted',
    'service_bids',
    v_bid_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'match_id', v_match_id,
      'currency', upper(trim(p_currency)),
      'total_amount', p_total_amount,
      'valid_until', p_valid_until,
      'lead_time_days', p_lead_time_days,
      'freight_rate_amount', p_freight_rate_amount,
      'local_charge_amount', p_local_charge_amount,
      'surcharge_amount', p_surcharge_amount,
      'transit_time_days', p_transit_time_days
    )
  );

  return jsonb_build_object(
    'bid_id', v_bid_id,
    'request_id', p_request_id
  );
end;
$$;

grant execute on function public.submit_freight_bid(
  uuid,
  text,
  numeric,
  date,
  integer,
  text,
  numeric,
  numeric,
  numeric,
  integer,
  text,
  text
) to authenticated;

create or replace function public.submit_clearance_bid(
  p_request_id uuid,
  p_currency text,
  p_total_amount numeric,
  p_valid_until date default null,
  p_lead_time_days integer default null,
  p_message text default null,
  p_brokerage_fee_amount numeric default null,
  p_review_available boolean default true,
  p_additional_documents_required jsonb default '[]'::jsonb,
  p_risk_note text default null,
  p_expected_clearance_days integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_bid_id uuid;
  v_existing_bid_id uuid;
  v_match_id uuid;
  v_request public.service_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();
  if v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  if p_total_amount is null or p_total_amount <= 0 then
    raise exception '견적 총액을 입력해야 합니다.';
  end if;

  if upper(trim(coalesce(p_currency, ''))) !~ '^[A-Z]{3}$' then
    raise exception '통화 코드는 3자리 코드로 입력해 주세요.';
  end if;

  if p_brokerage_fee_amount is not null and p_brokerage_fee_amount <= 0 then
    raise exception '통관 수수료는 0보다 커야 합니다.';
  end if;

  if (p_lead_time_days is not null and p_lead_time_days <= 0)
    or (p_expected_clearance_days is not null and p_expected_clearance_days <= 0) then
    raise exception '리드타임과 예상 통관일수는 1일 이상이어야 합니다.';
  end if;

  if p_valid_until is not null and p_valid_until < current_date then
    raise exception '견적 유효기한은 오늘 이후여야 합니다.';
  end if;

  if p_additional_documents_required is not null and jsonb_typeof(p_additional_documents_required) <> 'array' then
    raise exception '추가서류 요청 항목은 배열 형식이어야 합니다.';
  end if;

  select *
    into v_request
  from public.service_requests request
  where request.id = p_request_id
  for update;

  if v_request.id is null
    or v_request.request_type <> 'clearance'::public.service_request_type then
    raise exception '통관 의뢰 요청을 찾을 수 없습니다.';
  end if;

  if v_request.status not in ('open', 'bids_received') then
    raise exception '견적을 받을 수 있는 요청 상태가 아닙니다.';
  end if;

  if v_request.deadline_at is null or v_request.deadline_at <= now() then
    raise exception '견적 제출 마감 시간이 지났습니다.';
  end if;

  select matched.id
    into v_match_id
  from public.service_request_partner_matches matched
  where matched.request_id = p_request_id
    and matched.partner_company_id = v_actor_company_id
  for update;

  if v_match_id is null then
    raise exception '매칭 정보를 찾을 수 없습니다.';
  end if;

  if not public.can_bid_on_service_request(p_request_id) then
    raise exception '이 요청에 견적을 제출할 권한이 없습니다.';
  end if;

  select bid.id
    into v_existing_bid_id
  from public.service_bids bid
  where bid.request_id = p_request_id
    and bid.bidder_company_id = v_actor_company_id
    and bid.status not in ('withdrawn', 'rejected', 'expired', 'hidden')
  limit 1;

  if v_existing_bid_id is not null then
    raise exception '이미 제출 중인 견적이 있습니다.';
  end if;

  insert into public.service_bids (
    request_id,
    bidder_company_id,
    created_by,
    bid_type,
    status,
    currency,
    total_amount,
    valid_until,
    lead_time_days,
    message,
    submitted_at
  )
  values (
    p_request_id,
    v_actor_company_id,
    auth.uid(),
    'clearance',
    'submitted',
    upper(trim(p_currency)),
    p_total_amount,
    p_valid_until,
    p_lead_time_days,
    nullif(trim(coalesce(p_message, '')), ''),
    now()
  )
  returning id into v_bid_id;

  insert into public.clearance_bid_details (
    bid_id,
    brokerage_fee_amount,
    review_available,
    additional_documents_required,
    risk_note,
    expected_clearance_days
  )
  values (
    v_bid_id,
    p_brokerage_fee_amount,
    coalesce(p_review_available, true),
    coalesce(p_additional_documents_required, '[]'::jsonb),
    nullif(trim(coalesce(p_risk_note, '')), ''),
    p_expected_clearance_days
  );

  update public.service_requests
    set status = 'bids_received'::public.service_request_status,
        updated_at = now()
  where id = p_request_id
    and status = 'open'::public.service_request_status;

  update public.service_request_partner_matches
    set interest_status = 'interested'
  where request_id = p_request_id
    and partner_company_id = v_actor_company_id
    and interest_status in ('none', 'viewed');

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'clearance_bid_submitted',
    'service_bids',
    v_bid_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'match_id', v_match_id,
      'currency', upper(trim(p_currency)),
      'total_amount', p_total_amount,
      'valid_until', p_valid_until,
      'lead_time_days', p_lead_time_days,
      'brokerage_fee_amount', p_brokerage_fee_amount,
      'review_available', coalesce(p_review_available, true),
      'expected_clearance_days', p_expected_clearance_days
    )
  );

  return jsonb_build_object(
    'bid_id', v_bid_id,
    'request_id', p_request_id
  );
end;
$$;

grant execute on function public.submit_clearance_bid(
  uuid,
  text,
  numeric,
  date,
  integer,
  text,
  numeric,
  boolean,
  jsonb,
  text,
  integer
) to authenticated;

create or replace function public.claim_marketplace_notification_delivery(
  p_match_id uuid,
  p_notification_kind text,
  p_channel text default 'in_app',
  p_delivery_window text default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_id uuid;
  v_delivery_key text;
  v_match public.service_request_partner_matches%rowtype;
  v_request public.service_requests%rowtype;
  v_sanitized_metadata jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role only';
  end if;

  if p_notification_kind not in ('initial', 'deadline_reminder', 'digest') then
    raise exception '지원하지 않는 알림 종류입니다.';
  end if;

  if p_channel not in ('in_app', 'email', 'digest') then
    raise exception '지원하지 않는 알림 채널입니다.';
  end if;

  select *
    into v_match
  from public.service_request_partner_matches matched
  where matched.id = p_match_id
  for update;

  if v_match.id is null then
    raise exception '매칭 정보를 찾을 수 없습니다.';
  end if;

  select *
    into v_request
  from public.service_requests request
  where request.id = v_match.request_id
  for update;

  if v_request.id is null then
    raise exception '요청 정보를 찾을 수 없습니다.';
  end if;

  if v_request.status not in ('open', 'bids_received') then
    raise exception '알림을 보낼 수 있는 요청 상태가 아닙니다.';
  end if;

  if v_request.deadline_at is null or v_request.deadline_at <= now() then
    raise exception '알림을 보낼 수 있는 마감 상태가 아닙니다.';
  end if;

  if v_match.interest_status = 'declined' then
    raise exception '거절한 파트너에게는 알림을 보낼 수 없습니다.';
  end if;

  if not public.is_company_active_for_marketplace(v_match.partner_company_id)
    or not public.is_company_verified_for_marketplace(v_match.partner_company_id) then
    raise exception '알림 대상 파트너 상태를 확인해 주세요.';
  end if;

  if p_notification_kind = 'initial' and v_match.notification_status <> 'pending' then
    raise exception '최초 알림 대상 상태가 아닙니다.';
  end if;

  if p_notification_kind = 'deadline_reminder' and v_match.interest_status not in ('viewed', 'interested') then
    raise exception '마감 전 리마인드 대상 상태가 아닙니다.';
  end if;

  if p_notification_kind = 'digest' then
    v_delivery_key := format(
      'marketplace:digest:%s:%s',
      v_match.partner_company_id,
      coalesce(nullif(p_delivery_window, ''), to_char(now(), 'YYYY-MM-DD'))
    );
  else
    v_delivery_key := format(
      'marketplace:%s:%s:%s',
      p_notification_kind,
      p_match_id,
      coalesce(nullif(p_delivery_window, ''), 'once')
    );
  end if;

  v_sanitized_metadata := jsonb_strip_nulls(jsonb_build_object(
    'requestType', v_request.request_type,
    'requestCount', p_metadata -> 'requestCount',
    'matchCount', p_metadata -> 'matchCount',
    'templateId', p_metadata -> 'templateId'
  ));

  insert into public.marketplace_notification_deliveries (
    delivery_key,
    match_id,
    request_id,
    partner_company_id,
    notification_kind,
    channel,
    delivery_window,
    status,
    reason,
    metadata
  )
  values (
    v_delivery_key,
    p_match_id,
    v_request.id,
    v_match.partner_company_id,
    p_notification_kind,
    p_channel,
    nullif(p_delivery_window, ''),
    'claimed',
    nullif(trim(coalesce(p_reason, '')), ''),
    v_sanitized_metadata
  )
  on conflict (delivery_key) do nothing
  returning id into v_delivery_id;

  if v_delivery_id is not null and p_notification_kind = 'initial' then
    update public.service_request_partner_matches
      set notification_status = 'sent',
          notified_at = now()
    where id = p_match_id;
  end if;

  return v_delivery_id;
end;
$$;

revoke all on function public.claim_marketplace_notification_delivery(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.claim_marketplace_notification_delivery(uuid, text, text, text, text, jsonb) to service_role;

create or replace function public.mark_marketplace_notification_delivery_read(
  p_delivery_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_company_id uuid;
  v_delivery public.marketplace_notification_deliveries%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_actor_company_id := public.current_company_id();

  if v_actor_company_id is null then
    raise exception '회사 프로필을 확인할 수 없습니다.';
  end if;

  select *
    into v_delivery
  from public.marketplace_notification_deliveries delivery
  where delivery.id = p_delivery_id
    and delivery.partner_company_id = v_actor_company_id
    and delivery.channel = 'in_app'
    and delivery.status in ('claimed', 'sent')
  for update;

  if v_delivery.id is null then
    raise exception '읽음 처리할 알림을 찾을 수 없습니다.';
  end if;

  update public.marketplace_notification_deliveries
    set read_at = coalesce(read_at, now()),
        read_by = coalesce(read_by, auth.uid()),
        updated_at = now()
  where id = p_delivery_id;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    after_json
  )
  values (
    auth.uid(),
    v_actor_company_id,
    'marketplace_notification_delivery_read',
    'marketplace_notification_deliveries',
    p_delivery_id,
    jsonb_build_object(
      'request_id', v_delivery.request_id,
      'notification_kind', v_delivery.notification_kind
    )
  );

  return p_delivery_id;
end;
$$;

revoke all on function public.mark_marketplace_notification_delivery_read(uuid) from public;
grant execute on function public.mark_marketplace_notification_delivery_read(uuid) to authenticated;

create or replace function public.update_company_marketplace_status(
  p_company_id uuid,
  p_actor_id uuid,
  p_status public.company_verification_status,
  p_note text default null
)
returns table (
  company_id uuid,
  verification_status public.company_verification_status,
  trust_score integer,
  suspended_at timestamptz,
  blocked_at timestamptz,
  verified_at timestamptz,
  verified_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.companies%rowtype;
  v_after public.companies%rowtype;
  v_patch_trust_score integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  select *
    into v_before
    from public.companies
    where id = p_company_id
    for update;

  if v_before.id is null then
    raise exception 'company not found';
  end if;

  v_patch_trust_score := case
    when p_status = 'recommended_partner' then greatest(coalesce(v_before.trust_score, 0), 90)
    when p_status in ('suspended', 'blocked', 'unverified') then least(coalesce(v_before.trust_score, 0), 50)
    else coalesce(v_before.trust_score, 0)
  end;

  update public.companies
    set
      verification_status = p_status,
      trust_score = v_patch_trust_score,
      verified_at = case
        when p_status in ('operator_approved', 'recommended_partner') then now()
        when p_status in ('suspended', 'blocked', 'unverified') then null
        else verified_at
      end,
      verified_by = case
        when p_status in ('operator_approved', 'recommended_partner') then p_actor_id
        when p_status in ('suspended', 'blocked', 'unverified') then null
        else verified_by
      end,
      suspended_at = case
        when p_status = 'suspended' then now()
        when p_status in ('operator_approved', 'recommended_partner', 'blocked', 'unverified') then null
        else suspended_at
      end,
      blocked_at = case
        when p_status = 'blocked' then now()
        when p_status in ('operator_approved', 'recommended_partner', 'suspended', 'unverified') then null
        else blocked_at
      end
    where id = p_company_id
    returning * into v_after;

  insert into public.audit_logs (
    actor_id,
    company_id,
    action,
    target_table,
    target_id,
    before_json,
    after_json
  )
  values (
    p_actor_id,
    p_company_id,
    'company_marketplace_status_updated',
    'companies',
    p_company_id,
    jsonb_build_object(
      'verificationStatus', v_before.verification_status,
      'trustScore', v_before.trust_score,
      'suspendedAt', v_before.suspended_at,
      'blockedAt', v_before.blocked_at,
      'verifiedAt', v_before.verified_at,
      'verifiedBy', v_before.verified_by
    ),
    jsonb_build_object(
      'verificationStatus', v_after.verification_status,
      'trustScore', v_after.trust_score,
      'suspendedAt', v_after.suspended_at,
      'blockedAt', v_after.blocked_at,
      'verifiedAt', v_after.verified_at,
      'verifiedBy', v_after.verified_by,
      'note', nullif(trim(coalesce(p_note, '')), '')
    )
  );

  return query
    select
      v_after.id,
      v_after.verification_status,
      v_after.trust_score,
      v_after.suspended_at,
      v_after.blocked_at,
      v_after.verified_at,
      v_after.verified_by;
end;
$$;

revoke all on function public.update_company_marketplace_status(uuid, uuid, public.company_verification_status, text) from public;
grant execute on function public.update_company_marketplace_status(uuid, uuid, public.company_verification_status, text) to service_role;

create or replace function public.review_company_party_type_request(
  p_actor_id uuid,
  p_request_id uuid,
  p_decision text,
  p_review_note text default null
)
returns table (
  request_id uuid,
  company_id uuid,
  status text,
  requested_party_types public.marketplace_party_type[],
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.company_party_type_requests%rowtype;
  v_company public.companies%rowtype;
  v_reviewed_at timestamptz := now();
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role only';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = p_actor_id
      and profile.role = 'developer'::public.user_role
  ) then
    raise exception '개발자 권한 검토자만 플랫폼 역할 신청을 검토할 수 있습니다.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception '지원하지 않는 역할 신청 검토 결과입니다.';
  end if;

  select *
  into v_request
  from public.company_party_type_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception '검토할 역할 신청을 찾을 수 없습니다.';
  end if;

  if v_request.status <> 'submitted' then
    raise exception '이미 처리된 역할 신청입니다.';
  end if;

  select *
  into v_company
  from public.companies
  where id = v_request.company_id
  for update;

  if v_company.id is null then
    raise exception '역할을 반영할 회사를 찾을 수 없습니다.';
  end if;

  if p_decision = 'approved' then
    if v_company.verification_status in ('suspended'::public.company_verification_status, 'blocked'::public.company_verification_status) then
      raise exception '숨김·정지 또는 차단 상태의 회사에는 플랫폼 역할을 승인할 수 없습니다.';
    end if;

    if v_request.requested_party_types && array['forwarder'::public.marketplace_party_type, 'customs_broker'::public.marketplace_party_type]
      and v_company.verification_status not in (
        'operator_approved'::public.company_verification_status,
        'recommended_partner'::public.company_verification_status,
        'trade_history'::public.company_verification_status
      ) then
      raise exception '포워더 또는 관세사무소 역할은 회사 검증 승인 후 반영할 수 있습니다.';
    end if;
  end if;

  if p_decision = 'approved' then
    insert into public.company_party_types (company_id, party_type, created_by)
    select
      v_request.company_id,
      requested_party_type,
      p_actor_id
    from unnest(v_request.requested_party_types) as requested_party_type
    on conflict (company_id, party_type) do nothing;
  end if;

  update public.company_party_type_requests
  set
    status = p_decision,
    review_note = nullif(trim(coalesce(p_review_note, '')), ''),
    reviewed_by = p_actor_id,
    reviewed_at = v_reviewed_at,
    updated_at = v_reviewed_at
  where id = p_request_id;

  insert into public.audit_logs (
    action,
    actor_id,
    company_id,
    target_table,
    target_id,
    before_json,
    after_json
  )
  values (
    'company_party_type_request_reviewed',
    p_actor_id,
    v_request.company_id,
    'company_party_type_requests',
    p_request_id,
    jsonb_build_object(
      'status', v_request.status,
      'requestedPartyTypes', v_request.requested_party_types
    ),
    jsonb_build_object(
      'status', p_decision,
      'requestedPartyTypes', v_request.requested_party_types,
      'reviewNote', nullif(trim(coalesce(p_review_note, '')), '')
    )
  );

  return query
    select
      p_request_id,
      v_request.company_id,
      p_decision,
      v_request.requested_party_types,
      v_reviewed_at;
end;
$$;

revoke all on function public.review_company_party_type_request(uuid, uuid, text, text) from public;
grant execute on function public.review_company_party_type_request(uuid, uuid, text, text) to service_role;

alter table public.company_party_types enable row level security;
alter table public.company_party_type_requests enable row level security;
alter table public.company_verification_documents enable row level security;
alter table public.partner_service_preferences enable row level security;
alter table public.service_requests enable row level security;
alter table public.freight_request_details enable row level security;
alter table public.clearance_request_details enable row level security;
alter table public.service_request_partner_matches enable row level security;
alter table public.service_request_documents enable row level security;
alter table public.service_bids enable row level security;
alter table public.freight_bid_details enable row level security;
alter table public.clearance_bid_details enable row level security;
alter table public.service_request_questions enable row level security;
alter table public.service_request_feedbacks enable row level security;
alter table public.service_request_completion_reports enable row level security;
alter table public.service_request_completion_report_documents enable row level security;
alter table public.marketplace_notification_deliveries enable row level security;

grant select on
  public.company_party_types,
  public.company_party_type_requests,
  public.service_requests,
  public.freight_request_details,
  public.clearance_request_details,
  public.service_request_partner_matches,
  public.service_request_documents,
  public.service_bids,
  public.freight_bid_details,
  public.clearance_bid_details,
  public.service_request_questions,
  public.service_request_feedbacks,
  public.service_request_completion_reports,
  public.service_request_completion_report_documents
to authenticated;

grant insert on public.company_party_type_requests to authenticated;
grant insert, delete on public.service_request_documents to authenticated;

grant select, insert, update on public.marketplace_notification_deliveries to service_role;

create policy "company reads own party types or staff reads all" on public.company_party_types
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "developer manages company party types" on public.company_party_types
  for all using (public.current_user_role() = 'developer'::public.user_role) with check (public.current_user_role() = 'developer'::public.user_role);

create policy "company admin reads own party type requests or staff reads all" on public.company_party_type_requests
  for select using (
    public.is_staff_or_admin()
    or (
      company_id = public.current_company_id()
      and public.is_company_admin()
    )
  );

create policy "company admin creates own party type requests" on public.company_party_type_requests
  for insert with check (
    company_id = public.current_company_id()
    and requested_by = auth.uid()
    and public.is_company_admin()
    and status = 'submitted'
    and review_note is null
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "staff manages company party type requests" on public.company_party_type_requests
  for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company admin reads own verification documents or staff reads all" on public.company_verification_documents
  for select using (
    public.is_staff_or_admin()
    or (
      company_id = public.current_company_id()
      and public.is_company_admin()
    )
  );

create policy "company admin uploads own verification documents" on public.company_verification_documents
  for insert with check (
    company_id = public.current_company_id()
    and uploaded_by = auth.uid()
    and public.is_company_admin()
    and storage_bucket = 'company-verification-documents'
    and public.is_uuid_text(split_part(storage_path, '/', 1))
    and split_part(storage_path, '/', 1)::uuid = public.current_company_id()
    and split_part(storage_path, '/', 2) = id::text
  );

create policy "company admin removes own submitted verification documents" on public.company_verification_documents
  for delete using (
    company_id = public.current_company_id()
    and uploaded_by = auth.uid()
    and public.is_company_admin()
    and status = 'submitted'
  );

create policy "developer reviews verification documents" on public.company_verification_documents
  for update using (public.current_user_role() = 'developer'::public.user_role)
  with check (public.current_user_role() = 'developer'::public.user_role);

create policy "company admin manages own partner preferences" on public.partner_service_preferences
  for all using (
    company_id = public.current_company_id()
    and public.is_company_admin()
    and exists (
      select 1
      from public.company_party_types party_type
      where party_type.company_id = partner_service_preferences.company_id
        and (
          (partner_service_preferences.service_type = 'freight'::public.service_request_type and party_type.party_type = 'forwarder'::public.marketplace_party_type)
          or (partner_service_preferences.service_type = 'clearance'::public.service_request_type and party_type.party_type = 'customs_broker'::public.marketplace_party_type)
        )
    )
  ) with check (
    company_id = public.current_company_id()
    and public.is_company_admin()
    and exists (
      select 1
      from public.company_party_types party_type
      where party_type.company_id = partner_service_preferences.company_id
        and (
          (partner_service_preferences.service_type = 'freight'::public.service_request_type and party_type.party_type = 'forwarder'::public.marketplace_party_type)
          or (partner_service_preferences.service_type = 'clearance'::public.service_request_type and party_type.party_type = 'customs_broker'::public.marketplace_party_type)
        )
    )
  );

create policy "staff manages partner preferences" on public.partner_service_preferences
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "requester inserts own service requests" on public.service_requests
  for insert with check (
    requester_company_id = public.current_company_id()
    and created_by = auth.uid()
    and status = 'draft'::public.service_request_status
  );

create policy "allowed parties read service requests" on public.service_requests
  for select using (public.can_read_service_request(id));

create policy "staff updates service requests" on public.service_requests
  for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "requester inserts draft freight details" on public.freight_request_details
  for insert with check (
    exists (
      select 1 from public.service_requests request
      where request.id = freight_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  );

create policy "requester updates own draft freight details" on public.freight_request_details
  for update using (
    exists (
      select 1 from public.service_requests request
      where request.id = freight_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  ) with check (
    exists (
      select 1 from public.service_requests request
      where request.id = freight_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  );

create policy "requester deletes own draft freight details" on public.freight_request_details
  for delete using (
    exists (
      select 1 from public.service_requests request
      where request.id = freight_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  );

create policy "allowed parties read freight details" on public.freight_request_details
  for select using (public.can_read_service_request(request_id));

create policy "requester inserts own draft clearance details" on public.clearance_request_details
  for insert with check (
    exists (
      select 1 from public.service_requests request
      where request.id = clearance_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.request_type = 'clearance'::public.service_request_type
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  );

create policy "requester updates own draft clearance details" on public.clearance_request_details
  for update using (
    exists (
      select 1 from public.service_requests request
      where request.id = clearance_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.request_type = 'clearance'::public.service_request_type
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  ) with check (
    exists (
      select 1 from public.service_requests request
      where request.id = clearance_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.request_type = 'clearance'::public.service_request_type
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  );

create policy "requester deletes own draft clearance details" on public.clearance_request_details
  for delete using (
    exists (
      select 1 from public.service_requests request
      where request.id = clearance_request_details.request_id
        and request.requester_company_id = public.current_company_id()
        and request.request_type = 'clearance'::public.service_request_type
        and request.status = 'draft'::public.service_request_status
    )
    or public.is_staff_or_admin()
  );

create policy "allowed parties read clearance details" on public.clearance_request_details
  for select using (public.can_read_service_request(request_id));

create policy "requester and partner read own matches" on public.service_request_partner_matches
  for select using (
    public.is_staff_or_admin()
    or (
      partner_company_id = public.current_company_id()
      and public.is_company_active_for_marketplace(partner_company_id)
    )
    or exists (
      select 1 from public.service_requests request
      where request.id = service_request_partner_matches.request_id
        and request.requester_company_id = public.current_company_id()
    )
  );

-- Partner interest changes are handled through
-- set_service_request_partner_interest(uuid, text), so matched partners cannot
-- mutate match_reason or notification fields directly.

create policy "staff manages partner matches" on public.service_request_partner_matches
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "requester inserts own request documents" on public.service_request_documents
  for insert with check (
    requester_company_id = public.current_company_id()
    and uploaded_by = auth.uid()
    and exists (
      select 1
      from public.service_requests request
      where request.id = service_request_documents.request_id
        and request.requester_company_id = public.current_company_id()
        and request.requester_company_id = service_request_documents.requester_company_id
        and request.status in (
          'draft'::public.service_request_status,
          'open'::public.service_request_status,
          'bids_received'::public.service_request_status,
          'partner_selected'::public.service_request_status
        )
    )
  );

create policy "allowed parties read request documents" on public.service_request_documents
  for select using (public.can_read_service_request_document(id));

create policy "requester and bidder read bids" on public.service_bids
  for select using (public.can_read_service_bid(id));

-- Bid submission and bid selection are handled through RPCs so requesters and
-- bidders cannot bypass match checks, audit logs, or status transitions.
create policy "staff manages bids" on public.service_bids
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "allowed parties read freight bid details" on public.freight_bid_details
  for select using (public.can_read_service_bid(bid_id));

create policy "staff manages freight bid details" on public.freight_bid_details
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "allowed parties read clearance bid details" on public.clearance_bid_details
  for select using (public.can_read_service_bid(bid_id));

create policy "staff manages clearance bid details" on public.clearance_bid_details
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "requester and bidder read request questions" on public.service_request_questions
  for select using (
    public.is_staff_or_admin()
    or (
      bidder_company_id = public.current_company_id()
      and public.is_company_active_for_marketplace(bidder_company_id)
    )
    or exists (
      select 1 from public.service_requests request
      where request.id = service_request_questions.request_id
        and request.requester_company_id = public.current_company_id()
    )
  );

-- Partner questions are handled through ask_service_request_question(uuid, text),
-- and requester answers are handled through answer_service_request_question(uuid, text),
-- so neither side can bypass status checks, audit logs, or immutable identity fields.

create policy "staff manages request questions" on public.service_request_questions
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "request parties read service feedbacks" on public.service_request_feedbacks
  for select using (
    public.is_staff_or_admin()
    or reviewer_company_id = public.current_company_id()
    or reviewed_company_id = public.current_company_id()
  );

-- Feedback submission is handled through submit_service_request_feedback(...),
-- so request parties cannot bypass completed-state checks or audit logging.
create policy "staff manages service feedbacks" on public.service_request_feedbacks
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "request parties read completion reports" on public.service_request_completion_reports
  for select using (
    public.is_staff_or_admin()
    or requester_company_id = public.current_company_id()
    or selected_partner_company_id = public.current_company_id()
  );

-- Completion report writes are handled through
-- create_or_update_completion_report(uuid, jsonb) and transition RPCs, so
-- request parties cannot bypass completed-state, selected-partner,
-- payload-shape, submit/ack/review/lock, or audit checks.
create policy "staff manages completion reports" on public.service_request_completion_reports
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "request parties read completion report documents" on public.service_request_completion_report_documents
  for select using (
    public.is_staff_or_admin()
    or (
      exists (
        select 1
        from public.service_request_completion_reports report
        where report.id = service_request_completion_report_documents.completion_report_id
          and (
            report.requester_company_id = public.current_company_id()
            or report.selected_partner_company_id = public.current_company_id()
          )
      )
      and public.can_read_service_request_document(service_request_completion_report_documents.request_document_id)
    )
  );

create policy "staff manages completion report documents" on public.service_request_completion_report_documents
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "staff reads marketplace notification deliveries" on public.marketplace_notification_deliveries
  for select using (public.is_staff_or_admin());

create policy "partner reads own marketplace notification deliveries" on public.marketplace_notification_deliveries
  for select using (partner_company_id = public.current_company_id());

create policy "service role manages marketplace notification deliveries" on public.marketplace_notification_deliveries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public)
values
  ('company-verification-documents', 'company-verification-documents', false),
  ('service-request-documents', 'service-request-documents', false)
on conflict (id) do nothing;

create policy "company reads own verification document storage" on storage.objects
  for select using (
    bucket_id = 'company-verification-documents'
    and public.can_read_company_verification_storage_object(bucket_id, name)
  );

create policy "company uploads own verification document storage" on storage.objects
  for insert with check (
    bucket_id = 'company-verification-documents'
    and public.is_uuid_text(split_part(name, '/', 1))
    and split_part(name, '/', 1)::uuid = public.current_company_id()
    and exists (
      select 1
      from public.company_verification_documents document
      where document.storage_bucket = bucket_id
        and document.storage_path = name
        and document.company_id = public.current_company_id()
        and document.uploaded_by = auth.uid()
        and split_part(name, '/', 2) = document.id::text
        and public.is_company_admin()
    )
  );

create policy "allowed parties read service request document storage" on storage.objects
  for select using (
    bucket_id = 'service-request-documents'
    and public.can_read_service_request_storage_object(bucket_id, name)
  );

create policy "requester uploads service request document storage" on storage.objects
  for insert with check (
    bucket_id = 'service-request-documents'
    and public.is_uuid_text(split_part(name, '/', 1))
    and public.is_uuid_text(split_part(name, '/', 2))
    and split_part(name, '/', 1)::uuid = public.current_company_id()
    and exists (
      select 1
      from public.service_request_documents document
      join public.service_requests request on request.id = document.request_id
      where document.storage_bucket = bucket_id
        and document.storage_path = name
        and document.uploaded_by = auth.uid()
        and request.id = split_part(name, '/', 2)::uuid
        and request.requester_company_id = public.current_company_id()
        and request.status in (
          'draft'::public.service_request_status,
          'open'::public.service_request_status,
          'bids_received'::public.service_request_status,
          'partner_selected'::public.service_request_status
        )
    )
  );

create policy "staff manages marketplace document storage" on storage.objects
  for all using (
    bucket_id in ('company-verification-documents', 'service-request-documents')
    and public.is_staff_or_admin()
  ) with check (
    bucket_id in ('company-verification-documents', 'service-request-documents')
    and public.is_staff_or_admin()
  );
