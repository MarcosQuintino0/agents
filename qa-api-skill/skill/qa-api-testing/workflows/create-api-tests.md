# Create API Tests Workflow

Use this workflow to create or refactor tests for one backend API/resource. Graphify is the preferred discovery path.

## Phase 1 - Discovery

1. Verify Graphify:
   - Does `graphify-out/graph.json` exist?
   - Is the Graphify CLI installed?
   - Does the graph look current for the backend being tested?
2. If no graph exists:
   - Instruct or run, according to permission: `npx qa-api-skill graphify:build --backend <backend-path>`.
3. Query the graph:
   - Prefer `npx qa-api-skill graph-provider --api <api> --graph <path-to-graph.json>`.
   - Use scoped `graphify query`, `graphify path`, and `graphify explain` for follow-up questions.
4. List candidate files:
   - controller/router
   - request DTO
   - response DTO
   - service/use case
   - repository/gateway
   - entity/model
   - enum/status
   - exception handler
   - security/middleware/filter
   - SQL/procedure/config if present
5. Read real code and other authoritative sources.
6. Confirm contract details before planning tests.
7. Generate:
   - MAPA DE REGRAS
   - MAPA DE CONTEXTO E MASSA
   - MATRIZ DE CENARIOS
8. Implement tests only after the plan reflects confirmed evidence.

## Evidence Requirement

Save graph evidence in the plan or analysis. Every generated rule must identify whether it came from:

- backend confirmed
- OpenAPI
- approved documentation
- real response
- graph indication

Graph indication alone is never enough to assert status, message, required field, limit, permission, persistence behavior, or business rule.

## Phase 2 - Analysis And Plan

Read `references/context-mass-discovery.md`, `references/rule-registry.md`, `references/evidence-ledger.md`, and the needed pattern references. Build concise tables:

| Rule | Source | Confidence | Test impact |
| --- | --- | --- | --- |
| `<id or pending>` | backend/OpenAPI/doc/response/graph | Confirmada/Provavel/Indicio/Nao confirmada | include/lacuna/question |

| Context/mass need | Source | Setup strategy | Cleanup/restoration |
| --- | --- | --- | --- |
| `<need>` | `<evidence>` | `<strategy>` | `<strategy>` |

| Scenario | Catalog tag | Evidence | Oracle | Spec |
| --- | --- | --- | --- | --- |
| `<scenario>` | `<tag>` | `<source>` | `<oracle>` | `<file>` |

## Phase 3 - Implementation

- Follow `references/api-pattern.md` and the `references/pattern/` files.
- Use templates from `assets/templates/api-templates.md` when useful.
- Keep API-specific calls in `_support/api.js`.
- Keep payload factories in `_support/payload.js`.
- Keep business assertions in `_support/asserts.js`.
- Keep setup, cleanup, restoration, and mass helpers in `_support/helpers.js`.
- Validate success with exact status, closed schema, business values, persistence, and no leakage.
- Validate errors with contract status/shape/message only when confirmed.
- Do not create executable permission tests without real no-permission credentials or data.

## Phase 4 - Review And Execution

- Re-read the scenario matrix and compare every implemented `it`.
- Confirm every contractual test has a reliable oracle.
- Run available lint, coverage/report tools, and targeted Cypress commands.
- If a correct test exposes backend behavior, keep it explicit; do not soften assertions to pass.

## Phase 5 - Delivery

Report:

- Graphify evidence path or fallback reason.
- Rules confirmed and rules not confirmed.
- Scenarios implemented and skipped/lacuna.
- Mass and cleanup strategy.
- Files changed.
- Commands run and results.
- Remaining risks.
