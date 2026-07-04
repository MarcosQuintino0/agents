# Graphify Integration

Graphify is the first-class discovery layer for this skill. It helps locate backend files, relationships, and concepts before Codex reads authoritative sources.

## Artifacts

- Graph file: `graphify-out/graph.json`
- Evidence JSON: `.faillens/graph/<api>.graph-evidence.json`
- Evidence Markdown: `.faillens/graph/<api>.graph-evidence.md`
- Build summary: `.faillens/graph/graphify-build-summary.md`

## How The Skill Uses The Graph

1. Check whether a graph exists.
2. Query the graph for controllers, DTOs, services, repositories, entities, exceptions, and security.
3. Save evidence with `graph-provider`.
4. Read candidate files in the backend.
5. Confirm every rule in backend code, OpenAPI, approved docs, or real responses.

The graph is navigation, not contract.

## Update Graph

```bash
npx qa-api-skill graphify:update --backend ./backend
```

If the graph does not exist, update falls back to build.

## CI Future

Future CI usage can run `graphify:doctor` and `graphify:update` before review jobs, then attach `.faillens/graph/*.graph-evidence.*` as artifacts. CI should still fail only on confirmed test or contract rules, not on graph hints alone.

## Monorepo

Run build/update for the specific backend package:

```bash
npx qa-api-skill graphify:build --backend ./services/empresas-api
```

Store evidence per API/resource to avoid mixing domains.

## Multiple Backends

Generate a graph per backend and pass the matching graph path to queries:

```bash
npx qa-api-skill graph-provider --api empresas --graph ./services/empresas-api/graphify-out/graph.json
npx qa-api-skill graph-provider --api contratos --graph ./services/contratos-api/graphify-out/graph.json
```
