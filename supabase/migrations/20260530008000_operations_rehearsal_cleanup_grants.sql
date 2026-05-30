create policy "service role deletes lookup telemetry events" on public.lookup_telemetry_events
  for delete using (auth.role() = 'service_role');

create policy "service role deletes operations issue events" on public.operations_issue_events
  for delete using (auth.role() = 'service_role');

grant delete on public.lookup_telemetry_events to service_role;
grant delete on public.operations_issue_events to service_role;
