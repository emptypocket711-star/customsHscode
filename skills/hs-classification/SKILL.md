---
name: hs-classification
description: Use for HS/HSK candidate recommendation, product-name classification workflow, required questions, and classification-risk wording.
---

# HS Classification Skill

## Trigger

Use this skill when implementing or reviewing:
- HS CODE direct lookup
- product-name HS recommendation
- HS candidate generation
- HSK selection/rejection/confirmation
- product classification questions

## Rules

1. AI recommends candidates only.
2. AI must never mark HS as final.
3. Candidate output requires:
   - HSK
   - HS6
   - rank
   - confidence
   - reason
   - missing questions
   - risk notes
4. If only HS6 is entered, require HSK 10-digit selection.
5. Ask for product function, material, composition, usage, power source, model, dimensions, and whether accessories are included.
6. Staff confirmation is required before final report publication.

## Output Language

Korean professional tone.

Use:
- “후보”
- “추천 근거”
- “추가 확인 필요”
- “담당자 검토 필요”

Avoid:
- “확정”
- “무조건”
- “문제 없음”
