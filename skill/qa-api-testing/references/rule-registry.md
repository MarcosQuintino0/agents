# Rule Registry

Use this reference to document confirmed API rules before writing or reviewing tests.

## Purpose

The registry connects backend/API evidence to Cypress test intent. It prevents invented rules and makes coverage traceable.

## Minimum Fields

| Field | Required | Notes |
| --- | --- | --- |
| id | yes | stable kebab-case id when confirmed |
| operation | yes | GET, POST, PUT, PATCH, DELETE, or flow name |
| condition | yes | missing, invalid, duplicate, transition, success, forbidden, etc. |
| field | conditional | required for field-specific rules |
| status | conditional | only when confirmed |
| message | conditional | exact message only when confirmed |
| persistence | conditional | required when mutation or no-mutation is part of the oracle |
| source | yes | backend/OpenAPI/doc/real-response/graph-indication/fallback-indication |
| confidence | yes | Confirmada, Provavel, Indicio, Nao confirmada |

## JSDoc Link

When implementing tests, confirmed rules can become JSDoc lines:

```js
/**
 * @regra campo-obrigatorio operation=POST field=campo condition=missing status=400 message="mensagem exata"
 */
```

Each contractual test should link to exactly one confirmed rule with `@regra:<id>` when the test objective is contractual.

## Guardrails

- Do not create an id for a rule that is only a Graphify hint.
- Do not put exact status or message in a rule unless confirmed.
- Do not use the registry to force coverage for concepts the API does not have.
