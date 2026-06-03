create or replace function public.enforce_service_bid_detail_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid_type public.service_request_type;
begin
  select bid.bid_type
    into v_bid_type
  from public.service_bids bid
  where bid.id = new.bid_id;

  if v_bid_type is null then
    raise exception '견적 정보를 찾을 수 없습니다.';
  end if;

  if tg_table_name = 'freight_bid_details'
    and v_bid_type <> 'freight'::public.service_request_type then
    raise exception '운송 견적 상세는 운송 견적에만 연결할 수 있습니다.';
  end if;

  if tg_table_name = 'clearance_bid_details'
    and v_bid_type <> 'clearance'::public.service_request_type then
    raise exception '통관 견적 상세는 통관 견적에만 연결할 수 있습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_freight_bid_detail_type on public.freight_bid_details;
create trigger enforce_freight_bid_detail_type
  before insert or update of bid_id on public.freight_bid_details
  for each row execute function public.enforce_service_bid_detail_type();

drop trigger if exists enforce_clearance_bid_detail_type on public.clearance_bid_details;
create trigger enforce_clearance_bid_detail_type
  before insert or update of bid_id on public.clearance_bid_details
  for each row execute function public.enforce_service_bid_detail_type();

create or replace function public.enforce_service_bid_type_detail_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.bid_type is distinct from new.bid_type then
    if new.bid_type <> 'freight'::public.service_request_type
      and exists (
        select 1
        from public.freight_bid_details detail
        where detail.bid_id = new.id
      ) then
      raise exception '운송 견적 상세가 있는 견적은 운송 견적 유형을 유지해야 합니다.';
    end if;

    if new.bid_type <> 'clearance'::public.service_request_type
      and exists (
        select 1
        from public.clearance_bid_details detail
        where detail.bid_id = new.id
      ) then
      raise exception '통관 견적 상세가 있는 견적은 통관 견적 유형을 유지해야 합니다.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_service_bid_type_detail_consistency on public.service_bids;
create trigger enforce_service_bid_type_detail_consistency
  before update of bid_type on public.service_bids
  for each row execute function public.enforce_service_bid_type_detail_consistency();
