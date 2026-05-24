# Prompt 04 — Product Name HS Recommendation

Read skills/hs-classification/SKILL.md.

Implement product-name HS recommendation skeleton.

Inputs:
- product name
- usage
- material
- composition
- function
- model
- power source
- wireless function
- battery included
- origin/shipment/destination countries
- direction
- basis date

Generate 3–5 candidates using a service abstraction.
For now, use deterministic keyword heuristics and mock data.
Do not call LLM directly unless env var and API wrapper already exist.

Each candidate must include:
- HSK
- HS6
- confidence
- reason
- required questions
- risk notes
- status suggested

Add staff select/reject/confirm actions.
