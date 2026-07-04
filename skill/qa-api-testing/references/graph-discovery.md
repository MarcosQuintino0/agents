# Graph Discovery

Graphify is the preferred discovery flow for backend API tests. Use it to navigate code relationships faster, not to decide the final contract.

## Availability Decision

1. Look for `graphify-out/graph.json` near the backend root or current project root.
2. Run `npx qa-api-skill graphify:doctor --backend <backend-path>` when unsure.
3. If Graphify is missing, instruct `npx qa-api-skill graphify:install`.
4. If the graph is missing, instruct `npx qa-api-skill graphify:build --backend <backend-path>`.
5. If the graph is stale, run `npx qa-api-skill graphify:update --backend <backend-path>`.

## Generate Graph

```bash
npx qa-api-skill graphify:build --backend ./backend
```

The build should produce `graphify-out/graph.json`. The CLI writes a summary to `.faillens/graph/graphify-build-summary.md`.

## Query Graph

Prefer scoped questions:

```bash
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "what controller handles empresas API?"
npx qa-api-skill graphify:path --graph ./backend/graphify-out/graph.json --from "EmpresasController" --to "EmpresaRepository"
npx qa-api-skill graphify:explain --graph ./backend/graphify-out/graph.json --node "EmpresasController"
npx qa-api-skill graph-provider --api empresas --graph ./backend/graphify-out/graph.json
```

Do not load the full graph if a scoped query can answer the navigation question.

## Use Results

Use answers to build a candidate list of files and concepts:

- controller/router
- request and response DTOs
- services/use cases
- repositories/gateways
- entities/models
- enums/statuses
- exception handlers
- auth/security/middleware
- SQL/procedures/config

Then read the real files.

## Confirm In Real Sources

Confirm every rule in:

- backend code
- OpenAPI/Swagger
- approved documentation
- real API response

Never assert status, message, required field, type, limit, authorization behavior, or business rule from Graphify alone.

## Confidence

- Confirmada: authoritative source directly confirms the rule.
- Provavel: multiple strong sources align, but one final confirmation remains.
- Indicio: Graphify or weak evidence suggests a path or relation.
- Nao confirmada: evidence is absent, conflicting, or stale.

## Stale Graph

Treat graph evidence as stale when:

- candidate files do not exist
- recent backend changes are not represented
- routes or classes differ from current code
- `git status` or file timestamps show backend changes after graph generation

Update the graph or switch to fallback discovery.

## Fallback

If Graphify is unavailable, failed, or stale, use `backend-discovery-fallback.md`. Keep the same GPS rule: point to files, then confirm details in real sources.
