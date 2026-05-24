create table public.hs_confirmation_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  created_by uuid not null references auth.users(id),
  hsk_code text not null,
  basis_date date not null,
  product_name text,
  user_note text,
  supplement_snapshot jsonb not null default '{}'::jsonb,
  status public.review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hs_confirmation_requests_company_idx on public.hs_confirmation_requests(company_id, status, created_at desc);
create index hs_confirmation_requests_hsk_idx on public.hs_confirmation_requests(hsk_code, basis_date);

alter table public.hs_confirmation_requests enable row level security;

create policy "company reads own hs confirmation requests or staff reads all" on public.hs_confirmation_requests
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff updates hs confirmation requests" on public.hs_confirmation_requests
  for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

alter table public.staff_review_assignments
  drop constraint staff_review_assignments_target_table_check;

alter table public.staff_review_assignments
  add constraint staff_review_assignments_target_table_check
  check (target_table in ('hs_candidates', 'hs_confirmation_requests', 'ai_reports', 'legal_change_events', 'case_documents', 'extracted_document_line_items'));

create or replace function public.create_hs_confirmation_request(
  p_hsk_code text,
  p_basis_date date,
  p_product_name text default null,
  p_user_note text default null,
  p_supplement_snapshot jsonb default '{}'::jsonb
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
    raise exception '로그인 후 HS 확정 요청을 생성할 수 있습니다.';
  end if;

  select company_id
    into v_company_id
  from public.profiles
  where id = v_actor;

  if v_company_id is null then
    raise exception '회사 프로필이 연결된 사용자만 HS 확정 요청을 생성할 수 있습니다.';
  end if;

  if nullif(regexp_replace(coalesce(p_hsk_code, ''), '[^0-9]', '', 'g'), '') is null then
    raise exception 'HS CODE를 확인해 주세요.';
  end if;

  insert into public.hs_confirmation_requests (
    company_id,
    created_by,
    hsk_code,
    basis_date,
    product_name,
    user_note,
    supplement_snapshot
  )
  values (
    v_company_id,
    v_actor,
    regexp_replace(p_hsk_code, '[^0-9]', '', 'g'),
    p_basis_date,
    nullif(trim(coalesce(p_product_name, '')), ''),
    nullif(trim(coalesce(p_user_note, '')), ''),
    coalesce(p_supplement_snapshot, '{}'::jsonb)
  )
  returning id into v_request_id;

  insert into public.staff_review_assignments (
    company_id,
    target_table,
    target_id,
    status,
    priority,
    created_by
  )
  values (
    v_company_id,
    'hs_confirmation_requests',
    v_request_id,
    'pending_review',
    'normal',
    v_actor
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
    'create_hs_confirmation_request',
    'hs_confirmation_requests',
    v_request_id,
    jsonb_build_object(
      'hsk_code', regexp_replace(p_hsk_code, '[^0-9]', '', 'g'),
      'basis_date', p_basis_date,
      'product_name', p_product_name
    )
  );

  return v_request_id;
end;
$$;

grant execute on function public.create_hs_confirmation_request(text, date, text, text, jsonb) to authenticated;
