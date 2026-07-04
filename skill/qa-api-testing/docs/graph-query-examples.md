# Graph Query Examples

## Empresas

```bash
npx qa-api-skill graph-provider --api empresas --graph ./backend/graphify-out/graph.json
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what controller handles empresas API?"
```

## Contratos

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what connects contratos API to empresa and plano?"
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what exceptions are thrown in the contratos flow?"
```

## Beneficiarios

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what request DTOs are used by beneficiarios?"
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what validation annotations are connected to beneficiarios?"
```

## Planos

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what entities are connected to planos API?"
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what enums or statuses are connected to planos?"
```

## API With Relationship

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what connects empresas to contratos and beneficiarios?"
```

Confirm relationships in services, repositories, entities, SQL, or API responses before planning tests.

## API With State Rule

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what business rules connect contrato API to status transitions?"
```

Treat the answer as a candidate list; confirm exact allowed and blocked transitions in code or docs.

## API With Mass Rule

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what entities or configuration flags affect valid mass for empresas?"
```

Use the result to plan setup and cleanup, not to invent data rules.

## API With Global Error Handling

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what exception handlers process errors from empresas API?"
npx qa-api-skill graphify:explain --graph ./backend/graphify-out/graph.json --node "GlobalExceptionHandler"
```

Confirm actual error envelope and messages in handler code, OpenAPI, docs, or real responses.
