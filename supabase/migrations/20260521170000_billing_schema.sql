create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type public.checkout_status as enum ('draft', 'pending_payment', 'paid', 'expired', 'canceled');

create table public.billing_plans (
  id text primary key,
  name text not null,
  monthly_price_krw integer not null check (monthly_price_krw >= 0),
  case_limit integer not null check (case_limit >= 0),
  report_credits integer not null check (report_credits >= 0),
  staff_review_credits integer not null check (staff_review_credits >= 0),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  status public.subscription_status not null default 'trialing',
  current_period_start date not null,
  current_period_end date not null,
  used_cases integer not null default 0 check (used_cases >= 0),
  used_report_credits integer not null default 0 check (used_report_credits >= 0),
  used_staff_review_credits integer not null default 0 check (used_staff_review_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id text not null references public.billing_plans(id),
  amount_krw integer not null check (amount_krw >= 0),
  status public.checkout_status not null default 'draft',
  provider text,
  provider_reference text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entry_type text not null check (entry_type in ('case_created', 'report_generated', 'staff_review_requested', 'credit_granted', 'manual_adjustment')),
  amount integer not null,
  related_request_id uuid references public.hs_search_requests(id),
  related_report_id uuid references public.ai_reports(id),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index company_subscriptions_company_id_idx on public.company_subscriptions(company_id);
create index checkout_intents_company_id_idx on public.checkout_intents(company_id);
create index credit_ledger_entries_company_id_idx on public.credit_ledger_entries(company_id);

alter table public.billing_plans enable row level security;
alter table public.company_subscriptions enable row level security;
alter table public.checkout_intents enable row level security;
alter table public.credit_ledger_entries enable row level security;

create policy "authenticated users read active billing plans" on public.billing_plans
  for select using (active = true);

create policy "staff manage billing plans" on public.billing_plans
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own subscription or staff reads all" on public.company_subscriptions
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff manages company subscriptions" on public.company_subscriptions
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own checkout intents or staff reads all" on public.checkout_intents
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "company creates own checkout intents" on public.checkout_intents
  for insert with check (company_id = public.current_company_id() and created_by = auth.uid());

create policy "staff manages checkout intents" on public.checkout_intents
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own credit ledger or staff reads all" on public.credit_ledger_entries
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff writes credit ledger" on public.credit_ledger_entries
  for insert with check (public.is_staff_or_admin());
