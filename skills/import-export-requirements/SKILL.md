---
name: import-export-requirements
description: Use for customs confirmation requirements, integrated public notice requirements, import/export law checks, requirement playbooks, and customer request templates.
---

# Import/Export Requirements Skill

## Trigger

Use for:
- 수입요건
- 수출요건
- 세관장확인사항
- 통합공고
- 개별법령
- 인증/허가/승인/표시
- 요건 취득방법

## Required Output

- customs confirmation result
- related law
- requirement document name
- effective date
- requirement playbook
- agency
- required documents
- expected lead time
- customer request template
- staff checklist

## No-result Rule

If customs confirmation result is empty, still show:

“세관장확인대상이 아니더라도 통합공고, 개별법령, 표시·인증·유통규제 의무가 존재할 수 있습니다. 제품 용도, 성분, 기능에 따라 추가 검토가 필요합니다.”

## Safety

Do not say “수입요건 없음” or “수출요건 없음” without staff-reviewed legal basis.
