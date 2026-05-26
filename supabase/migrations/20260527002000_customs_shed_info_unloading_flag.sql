alter table public.customs_shed_info
  drop constraint if exists customs_shed_info_facility_type_source_check;

alter table public.customs_shed_info
  add constraint customs_shed_info_facility_type_source_check
  check (facility_type_source in ('unloading_place_flag', 'auto_name_rule', 'manual', 'unclassified'));

update public.customs_shed_info
set
  facility_type = case
    when unloading_place_bonded_area_yn = 'Y' then 'cy'
    when unloading_place_bonded_area_yn = 'N' then 'cfs'
    else facility_type
  end,
  facility_type_source = case
    when unloading_place_bonded_area_yn in ('Y', 'N') then 'unloading_place_flag'
    else facility_type_source
  end,
  updated_at = now()
where source_version = 'myc-openapi-api005-v1.0'
  and status = 'published'
  and unloading_place_bonded_area_yn in ('Y', 'N');
