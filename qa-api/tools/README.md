# Tools da Skill QA API

Esta pasta contém scripts determinísticos usados pela skill. Eles usam apenas Node.js nativo e não
dependem de pacotes npm externos.

## Scripts

```text
qa-api/tools/qa-reindex.mjs
qa-api/tools/qa-report.mjs
```

## Uso direto

```bash
node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend
node .agents/skills/qa-api/tools/qa-reindex.mjs --check
node .agents/skills/qa-api/tools/qa-report.mjs --api users
node .agents/skills/qa-api/tools/qa-report.mjs --dir cypress/e2e/apis/users
node .agents/skills/qa-api/tools/qa-report.mjs --api users --open
```

## Package.json recomendado

O instalador configura estes scripts quando encontra `package.json` no projeto consumidor:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check",
    "qa:report": "node .agents/skills/qa-api/tools/qa-report.mjs",
    "qa:debug": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs run",
    "qa:debug:open": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs open",
    "qa:debug:generate": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs generate"
  }
}
```

Troque `../backend` pelo caminho relativo correto do backend.

## Saídas do reindex

Obrigatórias:

- `.agents/state/qa-api/graphify-out/graph.json`
- `.agents/state/qa-api/backend-graph.lock.json`

Complementares:

- `.agents/state/qa-api/graphify-out/graph.html`
- `.agents/state/qa-api/graphify-out/GRAPH_REPORT.md`, quando existir

`graph.html` é visual humano e não bloqueia testes. O lock registra o backend usado no reindex.

## Saídas do report

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

`coverage.html` é a visão humana. `coverage.json` é a fonte estruturada para revisão posterior pela
IA.

O relatório lê specs Cypress, JSDoc de contrato, tags `CatalogoTags`, vínculos `@regra:<id>` e
declarações `@cobertura`. Ele não executa Cypress; a primeira versão é uma auditoria estática dos
testes gerados.

Para investigar falhas reais de execução Cypress, use a skill irmã `qa-debug-report` e o script
`qa:debug`. Esse fluxo gera `reports/faillens/index.html` e `reports/faillens/faillens-report.json`.

Campos importantes do `coverage.json`:

- `schemaVersion`: versão do formato do JSON.
- `tests[].logicalCases`: casos expandidos de testes data-driven.
- `tests[].endpointRefs`: endpoint provável do teste, com `confidence` e `evidence`.
- `coverage.coverageByEndpoint`: cobertura agrupada por endpoint real.
- `coverage.catalogAssessment`: catálogo completo com status `covered`, `incorporado`,
  `aplicavel`, `nao-confirmado`, `nao-aplicavel` ou `not-evaluated`.
- `aiNextActions`: próximos passos prontos para a IA continuar a revisão.

Para melhorar a precisão, escreva `@regra` com `operation`, `endpoint` e `condition`:

```text
@regra name-obrigatorio operation=POST endpoint="/users" field=name condition=missing status=400
```

Status de `@cobertura`:

- `aplicavel`: precisa de teste.
- `nao-confirmado`: pode fazer sentido, mas falta contexto, massa, usuário, regra ou limite.
- `incorporado`: já está validado dentro de outro teste.
- `nao-aplicavel`: o conceito claramente não existe nesta API.

Use explicações curtas e simples. Exemplo:

```text
@cobertura @object-level-authorization nao-confirmado - parece haver dono do recurso, mas falta usuário de outro dono para testar
```

## Regras

- Não crie `mapeamento-api.md`.
- Não crie `mapeamento-api.json`.
- Não copie Graphify para dentro de `qa-api`.
- Use a skill irmã `graphify` para travar e validar a versão do Graphify.
- Não recrie ferramentas legadas como `cy:log`, `relatorio-cobertura` ou `relatorio-execucao`; use
  `qa:report` para o relatório oficial da skill.
