# Artefatos Gerados

## Instalacao

```text
.agents/skills/qa-api/
.agents/skills/qa-api-fuzz/
.agents/skills/qa-chamado/
.agents/skills/qa-debug-report/
.agents/skills/graphify/
```

## Graphify e qa-api

```text
.agents/state/qa-api/graphify-out/graph.json
.agents/state/qa-api/graphify-out/graph.html
.agents/state/qa-api/graphify-out/GRAPH_REPORT.md
.agents/state/qa-api/backend-graph.lock.json
```

## QA Report

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

## QA Oracle

```text
.agents/state/qa-api/oracle/<api>/oracle.html
.agents/state/qa-api/oracle/<api>/oracle.json
.agents/state/qa-api/oracle/<api>/runner/oracle-mutants.cy.js
.agents/state/qa-api/oracle/<api>/runner/oracle-mutants.cases.json
.agents/state/qa-api/oracle/<api>/runner/oracle-mutants.results.json
```

## Fuzzing

```text
.agents/state/qa-api-fuzz/profiles/<api>.profile.json
.agents/state/qa-api-fuzz/profiles/<api>.profile.md
.agents/state/qa-api-fuzz/profile-lint/<api>/profile-lint.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.md
```

## FailLens

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
.faillens/
```

`.faillens/` e temporario. `reports/faillens/` e evidencia local de debug.
