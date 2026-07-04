# Graph Query Playbook

Use these questions with `graphify query`, `graphify path`, `graphify explain`, or `npx qa-api-skill graph-provider`.

## Locate Endpoint

- what controller handles `<api>` API?
- what routes are related to `<api>`?
- what files define endpoints for `<api>`?

## DTO And Contract

- what request DTOs are used by `<controller>`?
- what response DTOs are returned by `<controller>`?
- what validation annotations are connected to `<api>`?

## Business Rule

- what services are called by `<controller>`?
- what business rules connect `<api>` to `<entity>`?
- what exceptions are thrown in the `<api>` flow?
- what repositories are used by `<service>`?

## Context And Mass

- what entities are connected to `<api>`?
- what enums or statuses are connected to `<api>`?
- what parameters or configuration flags affect `<api>`?
- what connects `<api>` to contrato, beneficiario, empresa, plano?

## Security

- what authentication or authorization code protects `<api>`?
- what filters/interceptors/middleware affect `<api>`?

## Error

- what exception handlers process errors from `<api>`?
- what error response classes are used by `<api>`?

## Follow-up Pattern

After any answer:

1. Extract candidate files and concepts.
2. Read only the relevant source files.
3. Confirm or reject each hinted rule.
4. Mark confidence as Confirmada, Provavel, Indicio, or Nao confirmada.
5. Record evidence in the plan or `.faillens/graph/<api>.graph-evidence.*`.
