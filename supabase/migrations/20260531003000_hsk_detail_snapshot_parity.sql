create or replace function public.lookup_hsk_detail(p_code text, p_basis_date date default current_date)
returns table (payload jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(coalesce(p_code, ''), '[^0-9]', '', 'g') as code
  ),
  rows as (
    select
      to_jsonb(snapshot.*)
      || jsonb_build_object(
        'standardNames',
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'name', standard.standard_name_kr,
              'requiredSpec', standard.required_spec_kr,
              'sourceName', standard.source_name,
              'sourceVersion', standard.source_version
            )
            order by standard.standard_name_kr
          )
          from public.standard_product_names standard
          where standard.hsk_code = snapshot.hsk_code
            and standard.status = 'published'
            and standard.effective_from <= p_basis_date
            and (standard.effective_to is null or standard.effective_to >= p_basis_date)
        ), '[]'::jsonb),
        'siblings',
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'hskCode', sibling.hsk_code,
              'koreanName', sibling.korean_name,
              'isSelected', sibling.hsk_code = snapshot.hsk_code
            )
            order by sibling.hsk_code
          )
          from public.hsk_lookup_snapshot sibling
          where sibling.hs6 = snapshot.hs6
            and sibling.snapshot_basis_date = p_basis_date
        ), '[]'::jsonb),
        'importRequirements',
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'type', req.display_type,
              'name', req.name,
              'relatedLaw', req.related_law,
              'agencyCode', req.agency_code,
              'agency', req.agency,
              'agencyContact', (
                select jsonb_build_object(
                  'agencyCode', contact.agency_code,
                  'agencyName', contact.agency_name,
                  'phone', contact.phone,
                  'email', contact.email,
                  'websiteUrl', contact.website_url,
                  'note', contact.note
                )
                from public.requirement_agency_contacts contact
                where contact.status = 'published'
                  and contact.effective_from <= p_basis_date
                  and (contact.effective_to is null or contact.effective_to >= p_basis_date)
                  and (
                    (req.agency_code is not null and contact.agency_code = req.agency_code)
                    or (req.agency is not null and contact.agency_name = req.agency)
                  )
                order by
                  case when req.agency_code is not null and contact.agency_code = req.agency_code then 0 else 1 end,
                  contact.agency_name
                limit 1
              ),
              'procedureSummary', req.procedure_summary,
              'playbook', (
                select jsonb_build_object(
                  'applicationMethod', playbook.application_method,
                  'requiredDocuments', playbook.required_documents,
                  'expectedLeadTime', playbook.expected_lead_time,
                  'exemptionPossibility', playbook.exemption_possibility,
                  'commonRejectionReasons', playbook.common_rejection_reasons,
                  'customerRequestTemplate', playbook.customer_request_template,
                  'staffChecklist', playbook.staff_checklist,
                  'category', playbook.category,
                  'riskLevel', playbook.risk_level,
                  'workflowType', playbook.workflow_type,
                  'workflowSteps', playbook.workflow_steps,
                  'sourceName', playbook.source_name,
                  'sourceUrl', playbook.source_url,
                  'sourceVersion', playbook.source_version
                )
                from public.requirement_playbooks playbook
                where playbook.requirement_document_name = req.name
                  and playbook.related_law = req.related_law
                  and playbook.status = 'published'
                  and playbook.effective_from <= p_basis_date
                  and (playbook.effective_to is null or playbook.effective_to >= p_basis_date)
                order by playbook.requirement_document_name, playbook.related_law
                limit 1
              ),
              'sourceName', req.source_name,
              'sourceVersion', req.source_version
            )
            order by req.sort_order, req.related_law, req.name
          )
          from (
            select
              0 as sort_order,
              '세관장확인'::text as display_type,
              requirement.requirement_document_name as name,
              requirement.related_law,
              requirement.agency_code,
              requirement.agency,
              null::text as procedure_summary,
              requirement.source_name,
              requirement.source_version
            from public.customs_confirmation_requirements requirement
            where requirement.hsk_code = snapshot.hsk_code
              and requirement.direction = 'import'
              and requirement.status = 'published'
              and requirement.effective_from <= p_basis_date
              and (requirement.effective_to is null or requirement.effective_to >= p_basis_date)
            union all
            select
              1 as sort_order,
              '통합공고'::text as display_type,
              notice.requirement_name as name,
              notice.related_law,
              null::text as agency_code,
              notice.agency,
              notice.procedure_summary,
              notice.source_name,
              notice.source_version
            from public.integrated_public_notice_requirements notice
            where notice.hsk_code = snapshot.hsk_code
              and notice.direction = 'import'
              and notice.status = 'published'
              and notice.effective_from <= p_basis_date
              and (notice.effective_to is null or notice.effective_to >= p_basis_date)
          ) req
        ), '[]'::jsonb),
        'originMarking',
        (
          select jsonb_build_object(
            'isTarget', target.is_target,
            'matchedPattern', target.hsk_pattern,
            'patternType', target.pattern_type,
            'conditionText', target.condition_text,
            'targetSourceName', target.source_name,
            'targetSourceUrl', target.source_url,
            'targetSourceVersion', target.source_version,
            'method', (
              select jsonb_build_object(
                'matchedPattern', method.hsk_pattern,
                'itemName', method.item_name,
                'methodSummary', method.method_summary,
                'note', method.note,
                'sourceName', method.source_name,
                'sourceUrl', method.source_url,
                'sourceVersion', method.source_version
              )
              from public.origin_marking_methods method
              where method.hsk_pattern = any(array[snapshot.hsk_code, snapshot.hs6, snapshot.hs4, snapshot.hs2])
                and method.status = 'published'
                and method.effective_from <= p_basis_date
                and (method.effective_to is null or method.effective_to >= p_basis_date)
              order by length(method.hsk_pattern) desc, method.item_name
              limit 1
            ),
            'methods',
            coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'matchedPattern', method.hsk_pattern,
                  'itemName', method.item_name,
                  'methodSummary', method.method_summary,
                  'note', method.note,
                  'sourceName', method.source_name,
                  'sourceUrl', method.source_url,
                  'sourceVersion', method.source_version
                )
                order by length(method.hsk_pattern) desc, method.item_name
              )
              from public.origin_marking_methods method
              where method.hsk_pattern = any(array[snapshot.hsk_code, snapshot.hs6, snapshot.hs4, snapshot.hs2])
                and method.status = 'published'
                and method.effective_from <= p_basis_date
                and (method.effective_to is null or method.effective_to >= p_basis_date)
            ), '[]'::jsonb)
          )
          from public.origin_marking_targets target
          where target.hsk_pattern = any(array[snapshot.hsk_code, snapshot.hs6, snapshot.hs4, snapshot.hs2])
            and target.is_target = true
            and target.status = 'published'
            and target.effective_from <= p_basis_date
            and (target.effective_to is null or target.effective_to >= p_basis_date)
          order by length(target.hsk_pattern) desc, target.hsk_pattern
          limit 1
        )
      ) as row_json
    from public.hsk_lookup_snapshot snapshot, normalized
    where snapshot.hsk_code = normalized.code
      and snapshot.snapshot_basis_date = p_basis_date
  )
  select jsonb_build_object(
    'lookupMode', 'hsk_detail',
    'basisDate', p_basis_date,
    'rows', coalesce(jsonb_agg(row_json), '[]'::jsonb)
  )
  from rows;
$$;

grant execute on function public.lookup_hsk_detail(text, date) to anon, authenticated;
