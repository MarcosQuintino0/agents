# Review API Tests Workflow

Use this workflow to audit existing Cypress API tests. It preserves the legacy `api-revisor.md` standard: a useful API test validates more than "responded with a status".

## Inputs

- API suite path or spec files.
- Backend path and optional graph.
- Existing schemas, support helpers, profile/config/auth files.
- Diff or previous suite when reviewing refactors.

## Steps

1. Read the product profile and shared support files.
2. Use Graphify to locate backend files when available; otherwise use fallback discovery.
3. Confirm contract in backend code, OpenAPI, approved docs, or real responses.
4. Read each `it` and map what it actually asserts.
5. Compare against `references/api-pattern.md` and relevant `references/pattern/` files.
6. If refactoring, compare with previous suite/diff to detect removed coverage.
7. Run static/report tooling when available.
8. Lead with findings ordered by severity.

## Success Response Checklist

- Exact expected status, not broad ranges or `oneOf` without reason.
- Closed schema validation with `additionalProperties:false` when contract allows.
- Types and enums covered by schema.
- Business values reflect request, persisted state, filters, ordering, calculated fields, or immutable fields when applicable.
- Persistence re-query after create/update/delete when the operation mutates state.
- Pagination envelope and metadata validated when pagination exists.
- Every response used by the oracle has explicit status validation.

## Error Response Checklist

- Confirmed status when the contract defines one.
- Controlled response for robustness when no exact functional contract exists.
- Error schema/envelope validated when product contract exists.
- Exact message or field mapping only when confirmed.
- No stack trace, framework binding details, package/class names, SQL internals, or sensitive data.
- Rejected writes prove no accidental creation or mutation when possible.

## Security Checklist

- Missing authentication covered for protected endpoints.
- Invalid/malformed token covered when technically possible.
- No-permission tests only when a real user/credential/profile exists.
- Unauthorized POST tracks `response.body.id` immediately when backend might create incorrectly.
- Unauthorized PUT/PATCH/DELETE re-queries state when deterministic.
- Incorrect allowed access becomes `@bug` only after execution or documented violation.

## Coverage And Scenario Checklist

Check applicable endpoint shapes:

- create: valid flow, persistence, required fields, limits, duplicate/business rules when confirmed
- read: success, not found, filters, pagination when present
- update: valid update, persistence, invalid fields, immutable fields, not found
- delete: success, absence after delete, not found, relationship block when confirmed
- global config: valid update, restoration, invalid value, nonexistent code when applicable

Do not demand pagination, duplicate, permission, or transition tests when the API lacks that concept.

## Hygiene Checklist

- No direct `cy.request` in specs.
- No `cy.log(JSON.stringify(...))`.
- No fixed waits without product reason.
- No focused tests.
- Tests are isolated; no cross-test `Cypress.env` state.
- Cleanup runs in `afterEach`, including IDs created unexpectedly.
- Config/global state is restored.
- `_support/api.js` has requests only; `_support/payload.js` has factories; `_support/asserts.js` has business assertions; `_support/helpers.js` has orchestration/cleanup.
- Specs use clear Preparation/Action/Validation structure when complex.

## JSDoc And Tags Checklist

- `crud.cy.js` has a contract block with `@contrato`, `@api`, `@resumo`, `@campo`, `@regra`, `@permissao`, and `@cobertura` where applicable.
- `@regra` entries have stable IDs, operation, condition, and only confirmed status/message.
- Each contractual test links to exactly one valid `@regra:<id>` when the rule is the test objective.
- Each standalone scenario has exactly one primary catalog tag.
- Data-driven cases carry their own rule IDs when needed.
- Missing coverage is documented with `@cobertura` instead of silently ignored.

## Anti-Patterns To Flag

- Test only checks status.
- Schema validates only a few keys manually.
- Error assertion accepts framework verbose error as OK.
- Test title promises behavior not asserted.
- Helper hides the only business assertion without readable intent.
- `@bug` added by analogy, without execution evidence.
- Weak assertion introduced only to make red test pass.
- Existing coverage removed without replacement or justification.

## Output Format

Lead with findings:

| Severity | File/line | Finding | Evidence | Fix |
| --- | --- | --- | --- | --- |

Then include:

- open questions
- commands run
- changes applied, if any
- residual risks

If no issues are found, say that clearly and mention remaining test gaps or evidence limits.
