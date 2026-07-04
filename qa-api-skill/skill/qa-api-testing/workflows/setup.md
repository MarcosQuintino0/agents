# Setup Workflow

Use this workflow to prepare a Cypress API testing base. It replaces the old `api-preparador.md` role while preserving its main rule: audit before changing.

## Inputs

- Cypress project path.
- Product/API profile if available.
- Existing `package.json`, Cypress config, support files, schemas, lint config, and auth helpers.

## Steps

1. Audit the existing project before editing.
2. Read `references/api-pattern.md` and `references/api-perfil.template.md` only as needed.
3. Check whether shared support files already exist:
   - `cypress/support/api/config.js`
   - `cypress/support/api/auth.api.js`
   - `cypress/support/api/client.js`
   - `cypress/support/api/schema.js`
   - `cypress/support/api/asserts.base.js`
   - `cypress/support/assertions/error.assertions.js`
   - `cypress/support/assertions/pagination.assertions.js`
4. Classify each file as OK, missing, present but out of pattern, or present in another path.
5. Ask before changing sensitive authentication files or installing dependencies.
6. Do not create business endpoint tests in this workflow.
7. Create or adjust only shared infrastructure that the user authorized.
8. Run available validation commands: lint, unit checks, or Cypress smoke commands if the project provides them.

## Graphify Role

Graphify is optional in setup. Use `npx qa-api-skill doctor` and `npx qa-api-skill graphify:doctor` to report readiness, but do not install Graphify unless the user explicitly asks or runs `graphify:install`.

## Output

- Files audited and status.
- Changes made.
- Dependencies checked or proposed.
- Warnings about auth, error schema, pagination, no-leakage, and cleanup.
- Commands run and results.
