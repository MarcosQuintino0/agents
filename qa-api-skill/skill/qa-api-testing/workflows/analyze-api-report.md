# Analyze API Report Workflow

Use this workflow to analyze API test execution reports. It preserves the old `api-analisador` role: report evidence first, then create tickets only when asked.

## Inputs

- `report.json`, Mochawesome JSON, JUnit XML, or CI output.
- Cypress specs, schemas, support files, and logs when needed.
- Backend path or graph when root cause may be in backend behavior.

## Steps

1. Start with the report as primary evidence.
2. Identify failing, passing-with-warning, skipped, flaky, or inconclusive scenarios.
3. Read specs only when the report does not explain assertion intent.
4. Use Graphify to locate candidate backend files when backend confirmation is needed.
5. Confirm likely root cause in real code, OpenAPI, approved docs, or real responses before calling it a backend defect.
6. Separate:
   - probable backend defect
   - probable test defect
   - environment/mass/dependency issue
   - inconclusive
7. Assign confidence: high, medium, or low.
8. If the user asks for tickets, use `assets/templates/template-chamado.md`.

## Guardrails

- Do not create tickets automatically from weak evidence.
- Do not call a behavior wrong only because Graphify hints at a path.
- Do not hide passing tests that have weak assertions or missed backend defects.
- Distinguish evidence from hypothesis in every conclusion.
