# Database Schema Draft

Use Supabase PostgreSQL.

## Roles

`user_role` enum:
- admin
- customs_staff
- client

## Core Tables

### profiles

- id uuid primary key references auth.users
- email text
- full_name text
- role user_role
- company_id uuid null
- created_at timestamptz

### companies

- id uuid primary key
- name text
- business_no text null
- type text
- created_at timestamptz

### hs_search_requests

- id uuid primary key
- company_id uuid
- created_by uuid
- direction text -- import/export
- search_type text -- document/hs_code/product_name
- input_hs_code text null
- input_product_name text null
- product_usage text null
- material text null
- composition text null
- functions text null
- model_name text null
- origin_country text null
- export_country text null
- shipment_country text null
- destination_country text null
- basis_date date not null
- status text
- created_at timestamptz

### hs_candidates

- id uuid primary key
- request_id uuid references hs_search_requests
- hsk_code text
- hs6 text
- candidate_rank int
- confidence_score numeric
- reason text
- required_questions jsonb
- risk_notes text
- status text -- suggested/selected/rejected/staff_confirmed
- reviewed_by uuid null
- reviewed_at timestamptz null

### hs_master

- hsk_code text primary key
- hs6 text
- korean_name text
- english_name text
- import_nature_code text null
- export_nature_code text null
- quantity_unit text null
- weight_unit text null
- effective_from date
- effective_to date null
- source_version text
- status text

### standard_product_names

- id uuid primary key
- hsk_code text
- standard_name_kr text
- standard_name_en text
- required_spec_kr text
- required_spec_en text
- spec_value text null
- detailed_classification text null
- source_version text
- effective_from date
- effective_to date null
- status text

### tariff_rates

- id uuid primary key
- hsk_code text
- rate_type text
- duty_rate numeric null
- unit_duty numeric null
- country_group text null
- usage_rate_type text null
- effective_from date
- effective_to date null
- source_version text
- status text

### fta_agreements

- id uuid primary key
- agreement_code text
- agreement_name text
- country_code text
- country_name text
- effective_from date
- effective_to date null
- co_issue_method text
- issuer text
- validity_period text
- notes text
- source_version text
- status text

### fta_rates

- id uuid primary key
- agreement_id uuid references fta_agreements
- hsk_code text null
- hs6 text
- preferential_rate numeric null
- staging_category text null
- effective_from date
- effective_to date null
- source_version text
- status text

### fta_psr

- id uuid primary key
- agreement_id uuid references fta_agreements
- hs_version text
- hs6 text
- psr_code text
- psr_description text
- required_documents jsonb
- source_version text
- effective_from date
- effective_to date null
- status text

### hs_version_crosswalk

- id uuid primary key
- current_hs6 text
- hs2012_hs6 text null
- hs2017_hs6 text null
- hs2022_hs6 text null
- agreement_id uuid null
- note text

### customs_confirmation_requirements

- id uuid primary key
- hsk_code text
- direction text -- import/export
- requirement_document_name text
- related_law text
- effective_from date
- effective_to date null
- source_version text
- status text

### integrated_public_notice_requirements

- id uuid primary key
- hsk_code text
- direction text
- requirement_name text
- related_law text
- agency text
- procedure_summary text
- effective_from date
- effective_to date null
- source_version text
- status text

### requirement_playbooks

- id uuid primary key
- requirement_document_name text
- related_law text
- agency text
- application_method text
- required_documents jsonb
- expected_lead_time text
- exemption_possibility text
- common_rejection_reasons jsonb
- customer_request_template text
- staff_checklist jsonb
- status text
- updated_at timestamptz

### export_control_checks

- id uuid primary key
- hsk_code text
- control_category text
- control_number text null
- keyword text
- spec_condition text
- self_classification_needed boolean
- expert_classification_needed boolean
- license_type text null
- source_version text
- effective_from date
- effective_to date null
- status text

### ai_reports

- id uuid primary key
- request_id uuid references hs_search_requests
- company_id uuid
- report_type text
- basis_date date
- status text -- draft/pending_review/approved/published
- report_json jsonb
- customer_summary text
- staff_notes text
- created_by uuid
- reviewed_by uuid null
- reviewed_at timestamptz null
- created_at timestamptz

### legal_source_snapshots

See docs/LEGAL_UPDATE_ENGINE.md.

### legal_change_events

See docs/LEGAL_UPDATE_ENGINE.md.

### report_source_locks

- id uuid primary key
- report_id uuid references ai_reports
- source_snapshot_id uuid references legal_source_snapshots
- rule_version_id uuid null
- generated_at timestamptz

### audit_logs

- id uuid primary key
- actor_id uuid
- company_id uuid null
- action text
- target_table text
- target_id uuid
- before_json jsonb null
- after_json jsonb null
- created_at timestamptz

## RLS Principles

Client:
- can read/write own company requests and reports
- cannot approve reports
- cannot read legal update dashboard

Customs staff:
- can read all or assigned cases
- can review/approve reports
- can see legal updates

Admin:
- full access
