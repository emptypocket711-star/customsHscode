create policy "company updates own document processing status" on public.case_documents
  for update using (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  )
  with check (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  );

create policy "company inserts own extracted line items" on public.extracted_document_line_items
  for insert with check (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  );

create policy "company deletes own extracted line items" on public.extracted_document_line_items
  for delete using (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  );

create policy "company updates own extracted line items" on public.extracted_document_line_items
  for update using (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  )
  with check (
    company_id = public.current_company_id()
    or public.is_staff_or_admin()
  );
