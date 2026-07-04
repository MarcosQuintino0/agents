# Setup Workflow

Use this workflow to prepare a Cypress project for backend API tests. It preserves the legacy `api-preparador.md` intent: audit before changing and avoid creating endpoint business tests here.

## Inputs

- Cypress project root.
- Product profile or known API conventions, if available.
- Existing config/auth/client/schema/assertion files.
- Package manager and Node version.

## Core Rule: Audit Before Altering

Before creating or modifying any file:

1. Check whether it already exists.
2. Read it when it exists.
3. Classify it:
   - OK in the pattern: do not change.
   - Exists but diverges: report the divergence and ask before refactoring.
   - Exists under another path/name: propose reuse, adapter, or move.
   - Missing: propose creation.
4. Never overwrite auth, tenant, credentials, base URL, schema, or lint files blindly.

## Files To Audit

| Area | Files | Rule |
| --- | --- | --- |
| Package | `package.json` | Identify scripts, package manager, Cypress, lint and test deps. Do not rewrite. |
| Formatting | `.prettierrc*`, `prettier.config.*` | Report differences before creating or changing. |
| Lint | `eslint.config.*`, `.eslintrc*` | Preserve current style; add guards only with compatible config. |
| Cypress config | `cypress.config.*` | Do not migrate config format without approval. |
| API config | `cypress/support/api/config.js` | Discover product base URL, pagination, error contract, status codes, no-leakage. |
| Auth | `cypress/support/api/auth.api.js` | Sensitive: ask before creating/refactoring. |
| Client | `cypress/support/api/client.js` | Centralize `cy.request` and logging. |
| Request log | `cypress/support/api/requestLogger.api.js` | Ensure secrets are masked and `log:false` is used. |
| Schema helper | `cypress/support/api/schema.js` | Validate JSON Schema with AJV. |
| Base asserts | `cypress/support/api/asserts.base.js` | Shared status/schema/no-leakage helpers. |
| Error asserts | `cypress/support/assertions/error.assertions.js` | Product error envelope and messages. |
| Pagination asserts | `cypress/support/assertions/pagination.assertions.js` | Only create/use when product paginates. |
| Error schemas | `cypress/fixtures/schemas/erro*.schema.json` | Derive from actual product contract only. |

## Dependencies

Check before proposing installation:

- `cypress`
- `ajv`
- `@faker-js/faker`
- `prettier`
- `eslint`
- `eslint-plugin-cypress`
- `@eslint/js` and `globals` when the project uses flat config
- `acorn` when coverage/report tooling parses specs

Ask before installing dependencies. Do not force newest versions or migrate lint formats without approval.

## Lint Guards To Preserve

When compatible with the project, ensure lint blocks these anti-patterns:

- direct `cy.request` inside `*.cy.js`
- `cy.log(JSON.stringify(...))` in specs
- `it.only`, `describe.only`, `context.only`
- assertions inside `_support/api.js` or `payload.js`
- `faker` imported by request wrappers instead of payload factories
- request logging that exposes token, cookie, authorization, password, or tenant secrets

If lint cannot enforce a rule safely, record the gap.

## Product Profile Discovery

Use `references/api-perfil.template.md` to discover:

- product/API identity
- base URL strategy
- auth headers and invalid credential support
- status for missing/invalid token
- no-permission user availability
- error envelope and validation error format
- pagination shape
- no-leakage expectations
- cleanup/restoration constraints

Do not copy another product's error contract or auth behavior by assumption.

## Graphify Role

Setup does not require Graphify, but the package must report readiness:

```bash
npx qa-api-skill doctor
npx qa-api-skill graphify:doctor --backend <backend-path>
```

Do not install Graphify unless the user explicitly invokes:

```bash
npx qa-api-skill graphify:install
```

## Implementation Boundaries

- Do not create endpoint/business tests.
- Do not create schemas for APIs whose contract was not confirmed.
- Do not change credentials or auth flow without approval.
- Do not weaken existing assertions to make setup pass.
- Keep setup changes limited to shared infrastructure.

## Delivery

Report:

- audited files and classifications
- changes made
- proposed changes requiring approval
- dependencies present/missing
- lint guard status
- product profile gaps
- commands run and results
