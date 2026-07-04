# Create API Tests Workflow

Use this workflow to create or refactor one API/resource test suite. It preserves the legacy `api-criador.md` phases and adds Graphify as the preferred discovery path.

## Required References

Load only what the task needs:

- `references/graph-discovery.md`
- `references/graph-query-playbook.md`
- `references/api-pattern.md`
- `references/api-templates.md`
- `references/api-perfil.template.md`
- `references/context-mass-discovery.md`
- `references/rule-registry.md`
- `references/evidence-ledger.md`
- relevant files under `references/pattern/`

## Phase 1 - Discovery

Goal: understand Cypress structure, backend contract, applicable scenarios, data strategy, and evidence. Do not create or edit test files during this phase.

### 1. Verify Graphify

1. Look for `graphify-out/graph.json`.
2. Check Graphify CLI availability with `npx qa-api-skill graphify:doctor --backend <backend-path>`.
3. If Graphify is missing, instruct `npx qa-api-skill graphify:install`.
4. If the graph is missing, suggest or run `npx qa-api-skill graphify:build --backend <backend-path>` according to permission.
5. If the graph is stale, run or suggest `graphify:update`.

Graphify is navigation evidence only. It must never be the sole source for status, message, required field, limit, enum, permission, or business rule.

### 2. Query The Graph

Prefer:

```bash
npx qa-api-skill graph-provider --api <api> --graph <path-to-graph.json>
```

Use scoped queries for follow-up:

- controller/router
- routes and HTTP methods
- request DTO/model
- response DTO/model
- validation annotations or validators
- service/use case
- repository/gateway
- entity/model
- enum/status
- exception handler
- auth/security/middleware/filter
- SQL/procedure/config when present

Save graph evidence in the plan or `.faillens/graph/<api>.graph-evidence.*`.

### 3. Fallback When Graphify Is Unavailable

Use `references/backend-discovery-fallback.md`. Treat it as GPS only. It may identify files but cannot define contract.

### 4. Confirm The Product Profile

Read existing Cypress support files:

- `support/api/config.js`
- `support/api/auth.api.js`
- `support/api/client.js`
- `support/api/schema.js`
- `support/api/asserts.base.js`
- `support/assertions/error.assertions.js`
- existing error schemas
- existing API suites and helpers

If the shared base is missing, incomplete, or tied to another product, record the gap and propose running setup. Do not recreate sensitive files without approval.

### 5. Confirm The Real Contract

Use authoritative sources:

1. backend code
2. OpenAPI/Swagger
3. approved documentation
4. real API responses

Discover:

- endpoints, methods, routes, params, query strings
- authentication and permission behavior
- request fields, types, required/nullable, formats, limits
- success response fields, types, enums, nested objects
- business rules: duplicate, state transition, relationship, immutable field, calculated field
- error handling: status, envelope, messages, validation field mapping, exceptions
- persistence expectations for create/update/delete
- security behavior for missing/invalid token and no-permission users

Do not invent contract to increase coverage.

### 6. Identify API Shape

| Signal | Shape | Initial strategy |
| --- | --- | --- |
| POST + GET/{id} + PUT/PATCH + DELETE | creatable CRUD | unique data and cleanup by id |
| GET + PUT on fixed record | global config | capture original and restore |
| limited numeric/code space | limited code | find free value deterministically |
| payload depends on other IDs | dependent API | confirm safe source of parent IDs |
| real no-permission user exists | permission-sensitive API | executable permission tests |
| paged envelope exists | paginated API | validate page envelope and items |

Without explicit duplicate, pagination, transition, or permission evidence, mark as `Nao confirmado` and do not create executable tests that assume it.

### 7. Map Applicable Scenarios

Use `references/pattern/01-oraculo-selecao.md` and the catalog tags. Classify each scenario:

- `Aplicavel`
- `Ja coberto`
- `Nao aplicavel`
- `Nao confirmado`

Evaluate success, response contract, business values, required fields, invalid types/formats, limits, duplicate/idempotency, immutable fields, invalid IDs, filters, pagination, error/no-leakage, missing auth, invalid token, permission, and integrity after rejected write.

## Phase 2 - Analysis And Plan

Produce these artifacts before implementation.

### MAPA DE REGRAS

| Rule | Operation | Condition | Source | Confidence | Test impact |
| --- | --- | --- | --- | --- | --- |
| `<id or pending>` | `<method>` | `<condition>` | backend/OpenAPI/doc/response/graph | Confirmada/Provavel/Indicio/Nao confirmada | include/lacuna/question |

Rules with only Graphify evidence stay as `Indicio` until confirmed.

### MAPA DE CONTEXTO E MASSA

| Need | Source | Setup strategy | Cleanup/restoration | Risk |
| --- | --- | --- | --- | --- |
| `<entity/status/user/config>` | `<evidence>` | `<strategy>` | `<strategy>` | `<risk>` |

Every write must have cleanup or restoration. Negative writes must track accidental creation or mutation before final assertions whenever possible.

### MATRIZ DE CENARIOS

| Type | Catalog tag | Technique | Scenario | Status | Risk/Justification | Oracle/Evidence | Checklist incorporated | Spec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<type>` | `<tag>` | `<technique>` | `<scenario>` | `<status>` | `<why>` | `<oracle>` | `<items>` | `<file>` |

Only implement scenarios registered in the plan. If a new scenario appears during coding, update and justify the plan.

## Phase 3 - Implementation

Follow `references/api-pattern.md`, `references/api-templates.md`, and the relevant `references/pattern/` files.

Expected files when applicable:

- `_support/api.js`: high-level request functions only
- `_support/payload.js`: factories and mass data
- `_support/asserts.js`: API-specific business assertions
- `_support/helpers.js`: hooks, cleanup, restoration, supporting mass
- `crud.cy.js`: happy path and business rules
- `validacoes.cy.js`: validations and invalid payloads
- `seguranca.cy.js`: auth and permission scenarios
- `fixtures/schemas/<api>.schema.json`: response schemas

Implementation rules:

- No direct `cy.request` in specs.
- Validate every relevant response status explicitly.
- Success responses validate closed schema, expected fields, business values, and persistence when applicable.
- Error responses validate confirmed status, schema, message/field mapping, no-leakage, and no unintended mutation.
- Use exact messages only when confirmed.
- Keep tests isolated; do not chain via `Cypress.env` IDs across tests.
- Register created IDs before assertions so cleanup runs even after failures.
- Restore global configuration in `afterEach`.
- Use unique data for creatable resources.
- Do not make no-permission scenarios executable without real no-permission credentials/mass.
- Do not mark `@bug` without execution evidence or documented backend violation.

## JSDoc, Tags, And Rule Links

For contractual suites, keep a contract block above `describe`:

- `@contrato`
- `@api`
- `@resumo`
- `@campo`
- `@regra`
- `@permissao`
- `@cobertura`

Each contractual `it` should have:

- exactly one primary catalog tag when it is its own scenario
- `@regra:<id>` only when the rule is confirmed and is the objective of the test
- operational tags such as `@bug` only with evidence

Do not create a rule link when the behavior is not confirmed.

## Phase 4 - Review And Execution

Before final delivery:

1. Compare every implemented `it` to the scenario matrix.
2. Confirm title, tags, assertions, and oracle match.
3. Check cleanup/restoration.
4. Check no-leakage and security assertions.
5. Check JSDoc and `@regra` consistency.
6. Run available commands:
   - targeted Cypress command
   - `npm run lint`
   - coverage/report tooling such as `node tools/relatorio-cobertura <api-folder>` when available

Treat report warnings as evidence, especially missing tag, missing JSDoc, missing `@cobertura`, or weak assertions.

## Phase 5 - Delivery

Report:

- Graphify evidence path or fallback reason.
- Rules confirmed, probable, indicated, and not confirmed.
- Scenarios implemented.
- Scenarios not implemented and why.
- Mass, cleanup, and restoration strategy.
- Files changed.
- Commands run and results.
- Remaining risks and questions.

## Safety Pauses

Pause or ask when:

- auth/credentials/tenant files need creation or refactor
- product contract conflicts across sources
- write tests may mutate shared data without cleanup
- permission tests require unavailable mass
- a business rule has conflicting interpretations
- a change would remove existing coverage
