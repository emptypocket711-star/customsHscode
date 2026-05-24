create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type public.user_role as enum ('admin', 'customs_staff', 'client');
create type public.legal_record_status as enum ('draft', 'staged', 'reviewed', 'published', 'rejected', 'archived');
create type public.request_direction as enum ('import', 'export');
create type public.hs_search_type as enum ('document', 'hs_code', 'product_name');
create type public.review_status as enum ('draft', 'pending_review', 'approved', 'published', 'rejected', 'source_changed_after_generation');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_no text,
  type text not null default 'client',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'client',
  company_id uuid references public.companies(id),
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'customs_staff'), false)
$$;

create table public.hs_search_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  created_by uuid not null references auth.users(id),
  direction public.request_direction not null,
  search_type public.hs_search_type not null,
  input_hs_code text,
  input_product_name text,
  product_usage text,
  material text,
  composition text,
  functions text,
  model_name text,
  origin_country text,
  export_country text,
  shipment_country text,
  manufacturing_country text,
  seller_country text,
  destination_country text,
  basis_date date not null,
  status public.review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  constraint hs_request_hs_or_product_check check (
    (search_type = 'hs_code' and input_hs_code is not null)
    or (search_type = 'product_name' and input_product_name is not null)
    or search_type = 'document'
  )
);

create table public.hs_candidates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hs_search_requests(id) on delete cascade,
  hsk_code text not null,
  hs6 text not null,
  candidate_rank integer not null check (candidate_rank > 0),
  confidence_score numeric(5, 4) not null check (confidence_score >= 0 and confidence_score <= 1),
  reason text not null,
  required_questions jsonb not null default '[]'::jsonb,
  risk_notes text not null,
  status text not null default 'suggested' check (status in ('suggested', 'selected', 'rejected', 'staff_confirmed')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.hs_master (
  hsk_code text primary key,
  hs6 text not null,
  korean_name text not null,
  english_name text,
  import_nature_code text,
  export_nature_code text,
  quantity_unit text,
  weight_unit text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.standard_product_names (
  id uuid primary key default gen_random_uuid(),
  hsk_code text not null references public.hs_master(hsk_code),
  standard_name_kr text not null,
  standard_name_en text,
  required_spec_kr text,
  required_spec_en text,
  spec_value text,
  detailed_classification text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.tariff_rates (
  id uuid primary key default gen_random_uuid(),
  hsk_code text not null,
  rate_type text not null,
  duty_rate numeric,
  unit_duty numeric,
  country_group text,
  usage_rate_type text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.fta_agreements (
  id uuid primary key default gen_random_uuid(),
  agreement_code text not null,
  agreement_name text not null,
  country_code text not null,
  country_name text not null,
  co_issue_method text,
  issuer text,
  validity_period text,
  notes text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.fta_rates (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.fta_agreements(id) on delete cascade,
  hsk_code text,
  hs6 text not null,
  preferential_rate numeric,
  staging_category text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.fta_psr (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.fta_agreements(id) on delete cascade,
  hs_version text not null,
  hs6 text not null,
  psr_code text not null,
  psr_description text not null,
  required_documents jsonb not null default '[]'::jsonb,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.hs_version_crosswalk (
  id uuid primary key default gen_random_uuid(),
  current_hs6 text not null,
  hs2012_hs6 text,
  hs2017_hs6 text,
  hs2022_hs6 text,
  agreement_id uuid references public.fta_agreements(id),
  note text
);

create table public.customs_confirmation_requirements (
  id uuid primary key default gen_random_uuid(),
  hsk_code text not null,
  direction public.request_direction not null,
  requirement_document_name text not null,
  related_law text not null,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.integrated_public_notice_requirements (
  id uuid primary key default gen_random_uuid(),
  hsk_code text not null,
  direction public.request_direction not null,
  requirement_name text not null,
  related_law text not null,
  agency text,
  procedure_summary text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.requirement_playbooks (
  id uuid primary key default gen_random_uuid(),
  requirement_document_name text not null,
  related_law text not null,
  agency text,
  application_method text,
  required_documents jsonb not null default '[]'::jsonb,
  expected_lead_time text,
  exemption_possibility text,
  common_rejection_reasons jsonb not null default '[]'::jsonb,
  customer_request_template text,
  staff_checklist jsonb not null default '[]'::jsonb,
  source_name text not null default 'internal_review_playbook',
  source_url text not null default 'internal://requirement_playbooks',
  source_version text not null default 'draft',
  effective_from date not null default current_date,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text,
  updated_at timestamptz not null default now()
);

create table public.export_control_checks (
  id uuid primary key default gen_random_uuid(),
  hsk_code text not null,
  control_category text not null,
  control_number text,
  keyword text not null,
  spec_condition text not null,
  self_classification_needed boolean not null default true,
  expert_classification_needed boolean not null default false,
  license_type text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text
);

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hs_search_requests(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  report_type text not null,
  basis_date date not null,
  status public.review_status not null default 'draft',
  report_json jsonb not null default '{}'::jsonb,
  customer_summary text,
  staff_notes text,
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.legal_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  effective_from date not null,
  effective_to date,
  checksum text not null,
  raw_file_path text,
  status text not null default 'fetched' check (status in ('fetched', 'parsed', 'reviewed', 'published', 'rejected')),
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

create table public.legal_change_events (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.legal_source_snapshots(id) on delete cascade,
  source_type text not null,
  law_name text,
  article_no text,
  notice_name text,
  hsk_code text,
  change_type text not null,
  old_value jsonb,
  new_value jsonb,
  effective_from date,
  effective_to date,
  impact_area text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.report_source_locks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.ai_reports(id) on delete cascade,
  source_snapshot_id uuid not null references public.legal_source_snapshots(id),
  rule_version_id uuid,
  generated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  company_id uuid references public.companies(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index hs_search_requests_company_id_idx on public.hs_search_requests(company_id);
create index hs_search_requests_basis_date_idx on public.hs_search_requests(basis_date);
create index hs_candidates_request_id_idx on public.hs_candidates(request_id);
create index hs_master_effective_idx on public.hs_master(hsk_code, effective_from, effective_to, status);
create index tariff_rates_effective_idx on public.tariff_rates(hsk_code, effective_from, effective_to, status);
create index fta_rates_effective_idx on public.fta_rates(hs6, effective_from, effective_to, status);
create index customs_requirements_effective_idx on public.customs_confirmation_requirements(hsk_code, direction, effective_from, effective_to, status);
create index public_notice_requirements_effective_idx on public.integrated_public_notice_requirements(hsk_code, direction, effective_from, effective_to, status);
create index ai_reports_company_id_idx on public.ai_reports(company_id);
create index legal_change_events_review_idx on public.legal_change_events(review_status, risk_level);

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.hs_search_requests enable row level security;
alter table public.hs_candidates enable row level security;
alter table public.hs_master enable row level security;
alter table public.standard_product_names enable row level security;
alter table public.tariff_rates enable row level security;
alter table public.fta_agreements enable row level security;
alter table public.fta_rates enable row level security;
alter table public.fta_psr enable row level security;
alter table public.hs_version_crosswalk enable row level security;
alter table public.customs_confirmation_requirements enable row level security;
alter table public.integrated_public_notice_requirements enable row level security;
alter table public.requirement_playbooks enable row level security;
alter table public.export_control_checks enable row level security;
alter table public.ai_reports enable row level security;
alter table public.legal_source_snapshots enable row level security;
alter table public.legal_change_events enable row level security;
alter table public.report_source_locks enable row level security;
alter table public.audit_logs enable row level security;

create policy "company members read own company" on public.companies
  for select using (id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff manage companies" on public.companies
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "users read own profile or staff read all" on public.profiles
  for select using (id = auth.uid() or public.is_staff_or_admin());

create policy "users update own limited profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "staff manage profiles" on public.profiles
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "clients insert own company requests" on public.hs_search_requests
  for insert with check (
    created_by = auth.uid()
    and company_id = public.current_company_id()
  );

create policy "company reads own requests or staff reads all" on public.hs_search_requests
  for select using (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  );

create policy "staff update requests" on public.hs_search_requests
  for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "staff manage candidates" on public.hs_candidates
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads candidates for own requests" on public.hs_candidates
  for select using (
    exists (
      select 1
      from public.hs_search_requests req
      where req.id = hs_candidates.request_id
        and req.company_id = public.current_company_id()
    )
    or public.is_staff_or_admin()
  );

create policy "published legal data readable by authenticated users" on public.hs_master
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published standard names readable by authenticated users" on public.standard_product_names
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published tariff data readable by authenticated users" on public.tariff_rates
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published fta agreements readable by authenticated users" on public.fta_agreements
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published fta rates readable by authenticated users" on public.fta_rates
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published fta psr readable by authenticated users" on public.fta_psr
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "staff reads hs crosswalk" on public.hs_version_crosswalk
  for select using (public.is_staff_or_admin());

create policy "published customs requirements readable by authenticated users" on public.customs_confirmation_requirements
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published public notice requirements readable by authenticated users" on public.integrated_public_notice_requirements
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published playbooks readable by authenticated users" on public.requirement_playbooks
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "published export controls readable by authenticated users" on public.export_control_checks
  for select using (status = 'published' or public.is_staff_or_admin());

create policy "staff writes legal data hs_master" on public.hs_master
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data standard_product_names" on public.standard_product_names
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data tariff_rates" on public.tariff_rates
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data fta_agreements" on public.fta_agreements
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data fta_rates" on public.fta_rates
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data fta_psr" on public.fta_psr
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data hs_version_crosswalk" on public.hs_version_crosswalk
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data customs_requirements" on public.customs_confirmation_requirements
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data public_notice_requirements" on public.integrated_public_notice_requirements
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data playbooks" on public.requirement_playbooks
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy "staff writes legal data export_controls" on public.export_control_checks
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own reports or staff reads all" on public.ai_reports
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff manage reports" on public.ai_reports
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "staff manage snapshots" on public.legal_source_snapshots
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "staff manage change events" on public.legal_change_events
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own report locks or staff reads all" on public.report_source_locks
  for select using (
    exists (
      select 1 from public.ai_reports report
      where report.id = report_source_locks.report_id
        and (report.company_id = public.current_company_id() or public.is_staff_or_admin())
    )
  );

create policy "staff manage report locks" on public.report_source_locks
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "staff read audit logs" on public.audit_logs
  for select using (public.is_staff_or_admin());

create policy "system staff write audit logs" on public.audit_logs
  for insert with check (public.is_staff_or_admin());

insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

create policy "company users read own case document folders" on storage.objects
  for select using (
    bucket_id = 'case-documents'
    and (
      public.is_staff_or_admin()
      or split_part(name, '/', 1)::uuid = public.current_company_id()
    )
  );

create policy "company users upload to own case document folders" on storage.objects
  for insert with check (
    bucket_id = 'case-documents'
    and split_part(name, '/', 1)::uuid = public.current_company_id()
  );

create policy "staff manage case documents" on storage.objects
  for all using (
    bucket_id = 'case-documents'
    and public.is_staff_or_admin()
  ) with check (
    bucket_id = 'case-documents'
    and public.is_staff_or_admin()
  );
