create or replace function public.append_bid_submission_audit_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.service_bids%rowtype;
  v_action text;
  v_detail_summary jsonb;
begin
  select *
    into v_bid
  from public.service_bids bid
  where bid.id = new.bid_id;

  if v_bid.id is null then
    return new;
  end if;

  if tg_table_name = 'freight_bid_details' then
    v_action := 'freight_bid_submitted';
    v_detail_summary := jsonb_strip_nulls(jsonb_build_object(
      'freight_rate_amount', new.freight_rate_amount,
      'local_charge_amount', new.local_charge_amount,
      'surcharge_amount', new.surcharge_amount,
      'transit_time_days', new.transit_time_days
    ));
  elsif tg_table_name = 'clearance_bid_details' then
    v_action := 'clearance_bid_submitted';
    v_detail_summary := jsonb_strip_nulls(jsonb_build_object(
      'brokerage_fee_amount', new.brokerage_fee_amount,
      'expected_clearance_days', new.expected_clearance_days,
      'review_available', new.review_available
    ));
  else
    return new;
  end if;

  update public.audit_logs
    set after_json = coalesce(after_json, '{}'::jsonb) || jsonb_build_object(
      'submission_snapshot',
      jsonb_strip_nulls(jsonb_build_object(
        'schema_version', 1,
        'request_id', v_bid.request_id,
        'bid_type', v_bid.bid_type,
        'currency', v_bid.currency,
        'total_amount', v_bid.total_amount,
        'valid_until', v_bid.valid_until,
        'lead_time_days', v_bid.lead_time_days,
        'detail_summary', v_detail_summary
      ))
    )
  where action = v_action
    and target_table = 'service_bids'
    and target_id = new.bid_id;

  return new;
end;
$$;

drop trigger if exists append_freight_bid_submission_audit_snapshot on public.freight_bid_details;
create constraint trigger append_freight_bid_submission_audit_snapshot
  after insert or update on public.freight_bid_details
  deferrable initially deferred
  for each row execute function public.append_bid_submission_audit_snapshot();

drop trigger if exists append_clearance_bid_submission_audit_snapshot on public.clearance_bid_details;
create constraint trigger append_clearance_bid_submission_audit_snapshot
  after insert or update on public.clearance_bid_details
  deferrable initially deferred
  for each row execute function public.append_bid_submission_audit_snapshot();
