# Evidence Ledger

Use this ledger to keep test decisions auditable.

## Evidence Types

- backend confirmed
- OpenAPI
- approved documentation
- real response
- graph indication
- fallback mapper indication

## Recommended Table

| Item | Evidence type | Location | Confidence | Decision |
| --- | --- | --- | --- | --- |
| `<rule/scenario/file>` | `<type>` | `<path/link/command>` | `<level>` | `<implemented/lacuna/question>` |

## Rules

- Record Graphify evidence as indication until confirmed.
- Record stale, missing, or conflicting evidence explicitly.
- Keep evidence close to the plan, review findings, or analysis report.
- Include command output paths such as `.faillens/graph/<api>.graph-evidence.json`.

## Confidence

- Confirmada: authoritative source confirms directly.
- Provavel: strong but not final evidence.
- Indicio: useful navigation signal only.
- Nao confirmada: no reliable confirmation.
