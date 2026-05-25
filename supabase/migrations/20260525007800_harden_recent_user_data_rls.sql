drop policy if exists "users update own hs favorites or staff updates all" on public.hs_favorites;
create policy "users update own hs favorites or staff updates all"
  on public.hs_favorites
  for update
  using (
    created_by = auth.uid()
    or public.is_staff_or_admin()
  )
  with check (
    (
      created_by = auth.uid()
      and company_id = public.current_company_id()
    )
    or public.is_staff_or_admin()
  );

revoke all on public.account_access_events from anon, authenticated;

drop policy if exists "service role writes account access events" on public.account_access_events;
create policy "service role writes account access events"
  on public.account_access_events
  for insert
  to service_role
  with check (true);

grant select on public.account_access_events to authenticated;
