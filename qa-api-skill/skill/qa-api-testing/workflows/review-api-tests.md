# Review API Tests Workflow

Use this workflow to audit existing Cypress API tests. It preserves the old `api-revisor.md` intent: tests must validate more than status code.

## Steps

1. Read the product profile and shared support files.
2. Use Graphify, when available, to locate backend files for the target API.
3. Confirm contract details in backend code, OpenAPI, approved docs, or real responses.
4. Read the existing suite and map every `it` to its actual assertions.
5. Compare against `references/api-pattern.md` and the relevant `references/pattern/` files.
6. Check success responses for exact status, closed schema, business values, persistence, pagination when applicable, and no leakage.
7. Check error responses for confirmed status, schema, message, field identification, no leakage, and no unintended persistence.
8. Check security coverage: missing token, invalid token when technically possible, and no-permission only with real credentials/mass.
9. Check test hygiene: no direct `cy.request` in specs, isolated tests, cleanup, tags, JSDoc contract, no `.only`, and no weak logs.
10. Run available project commands such as lint, coverage report, and targeted Cypress runs.

## Output

Lead with findings ordered by severity. Include file/line when possible, evidence source, risk, and exact correction. If correcting files, keep changes scoped to the reviewed suite and update the evidence ledger.

Do not invent missing rules. Classify missing evidence as lacuna or not confirmed.
