# Migration From Agents

The previous standalone agents were preserved in `legacy-agents/` and reorganized into one skill.

| Legacy agent | New location |
| --- | --- |
| `api-preparador.md` | `workflows/setup.md` |
| `api-criador.md` | `workflows/create-api-tests.md` |
| `api-revisor.md` | `workflows/review-api-tests.md` |
| `api-analisador/agente.md` | `workflows/analyze-api-report.md` |
| `api-mapeador.md` | `references/backend-discovery-fallback.md` |
| `api-pattern.md` | `references/api-pattern.md` |
| `pattern/*.md` | `references/pattern/*.md` |
| `api-templates.md` | `assets/templates/api-templates.md` |

Graphify is now preferred for discovery. The old mapper remains available only when Graphify is missing, failed, stale, or explicitly out of scope.
