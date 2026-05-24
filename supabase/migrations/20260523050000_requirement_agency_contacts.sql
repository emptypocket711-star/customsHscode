create table if not exists public.requirement_agency_contacts (
  id uuid primary key default gen_random_uuid(),
  agency_code text,
  agency_name text not null,
  phone text,
  email text,
  website_url text,
  note text,
  source_name text not null,
  source_url text not null,
  source_version text not null,
  effective_from date not null,
  effective_to date,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  status public.legal_record_status not null default 'draft',
  checksum text,
  constraint requirement_agency_contacts_code_or_name check (agency_code is not null or agency_name <> '')
);

create index if not exists requirement_agency_contacts_code_idx
  on public.requirement_agency_contacts(agency_code, effective_from, effective_to, status);

create index if not exists requirement_agency_contacts_name_idx
  on public.requirement_agency_contacts(agency_name, effective_from, effective_to, status);

alter table public.requirement_agency_contacts enable row level security;

drop policy if exists "published requirement agency contacts readable by app users" on public.requirement_agency_contacts;
create policy "published requirement agency contacts readable by app users" on public.requirement_agency_contacts
for select using (status = 'published'::public.legal_record_status);

drop policy if exists "staff writes requirement agency contacts" on public.requirement_agency_contacts;
create policy "staff writes requirement agency contacts" on public.requirement_agency_contacts
for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
