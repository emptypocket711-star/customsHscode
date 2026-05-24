create type public.document_type as enum (
  'commercial_invoice',
  'packing_list',
  'bill_of_lading',
  'air_waybill',
  'certificate_of_origin',
  'catalog',
  'spec_sheet'
);

create type public.document_processing_status as enum (
  'uploaded',
  'extracting',
  'extracted',
  'needs_correction',
  'rejected'
);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hs_search_requests(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  uploaded_by uuid not null references auth.users(id),
  document_type public.document_type not null,
  file_name text not null,
  storage_bucket text not null default 'case-documents',
  storage_path text not null,
  mime_type text,
  file_size bigint,
  checksum text,
  status public.document_processing_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table public.extracted_document_line_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.case_documents(id) on delete cascade,
  request_id uuid not null references public.hs_search_requests(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  line_no integer not null check (line_no > 0),
  product_name text,
  model_name text,
  origin_country text,
  export_country text,
  shipment_country text,
  destination_country text,
  incoterms text,
  quantity numeric,
  unit text,
  unit_price numeric,
  total_amount numeric,
  currency text,
  confidence_score numeric(5, 4) check (confidence_score >= 0 and confidence_score <= 1),
  required_corrections jsonb not null default '[]'::jsonb,
  raw_extraction jsonb not null default '{}'::jsonb,
  status public.review_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_documents_request_id_idx on public.case_documents(request_id);
create index case_documents_company_id_idx on public.case_documents(company_id);
create index extracted_line_items_request_id_idx on public.extracted_document_line_items(request_id);
create index extracted_line_items_company_id_idx on public.extracted_document_line_items(company_id);

alter table public.case_documents enable row level security;
alter table public.extracted_document_line_items enable row level security;

create policy "company reads own documents or staff reads all" on public.case_documents
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "company inserts own documents" on public.case_documents
  for insert with check (
    company_id = public.current_company_id()
    and uploaded_by = auth.uid()
  );

create policy "staff updates documents" on public.case_documents
  for update using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

create policy "company reads own extracted line items or staff reads all" on public.extracted_document_line_items
  for select using (company_id = public.current_company_id() or public.is_staff_or_admin());

create policy "staff manages extracted line items" on public.extracted_document_line_items
  for all using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
