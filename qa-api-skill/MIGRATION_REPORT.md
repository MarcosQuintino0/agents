# Migration Report

## Summary

- Project created at `qa-api-skill/`.
- Original agents copied to `legacy-agents/`.
- `SKILL.md` is now a small router.
- Workflows were split into setup, create, review, and report analysis.
- Graphify became the preferred discovery flow.
- `api-mapeador` was downgraded to fallback in `references/backend-discovery-fallback.md`.
- Graphify scripts were created for install, doctor, build, update, query, path, explain, and evidence generation.
- Graphify installation is explicit and never automatic.
- Rule Registry and Evidence Ledger remain references/future structure.

## Legacy Mapping

| Legacy content | New role |
| --- | --- |
| `api-preparador.md` | `workflows/setup.md` |
| `api-criador.md` | `workflows/create-api-tests.md` |
| `api-revisor.md` | `workflows/review-api-tests.md` |
| `api-analisador/agente.md` | `workflows/analyze-api-report.md` |
| `api-mapeador.md` | `references/backend-discovery-fallback.md` |
| `api-pattern.md` and `pattern/*.md` | `references/` |
| `api-templates.md` | `assets/templates/api-templates.md` |

## Graphify Rules Preserved

- Use `graphify-out/graph.json` when available.
- Build graph with `npx qa-api-skill graphify:build --backend <backend-path>`.
- Install Graphify only with `npx qa-api-skill graphify:install`.
- Treat graph answers as navigation evidence, never final contract.
- Confirm every rule in backend code, OpenAPI, approved docs, or real responses.

## Ready Criteria

- [x] Project created.
- [x] Agents copied.
- [x] Skill reorganized.
- [x] SKILL.md small.
- [x] Workflows created.
- [x] Graphify integrated as preferred flow.
- [x] api-mapeador became fallback.
- [x] CLI has Graphify commands.
- [x] graphify-manager.js created.
- [x] graph-provider.js created.
- [x] graph-query-playbook.md created.
- [x] Graphify docs created.
- [x] No postinstall installing Python.
- [x] npm test passes.
- [x] npm run pack:dry passes.
- [x] README explains the flow.
- [x] MIGRATION_REPORT created.
