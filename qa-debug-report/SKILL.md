---
name: qa-debug-report
description: Gera e analisa relatorios manuais de debug para falhas Cypress/API usando FailLens. Use quando o usuario pedir para investigar teste de API quebrado, reproduzir falha, abrir relatorio HTML de debug, gerar cURL/evidencias ou analisar reports/faillens/faillens-report.json. Nao use para preparar projeto, criar suites ou medir cobertura estatica; nesses casos use qa-api.
---

# Skill: QA Debug Report

Use esta skill quando o QA quiser investigar manualmente uma falha real de teste Cypress/API.

## Papel da skill

- Executar testes Cypress com instrumentacao temporaria do FailLens.
- Capturar `cy.request`, responses, assertions, erro real, screenshots, JSDoc, tags e `@regra:<id>`.
- Gerar HTML e JSON locais para debug, reproducao e evidencias de chamado.

Nao use esta skill para criar testes, preparar base Cypress, revisar cobertura estatica ou decidir matriz endpoint x cenario. Para isso, use `qa-api` e `qa:report`.

## Comandos

No projeto consumidor, use os scripts instalados:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

Equivalentes diretos:

```bash
node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs run --spec "cypress/e2e/apis/users/**/*.cy.js"
node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs open
node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs generate --input reports/faillens/faillens-report.json --output reports/faillens/index.html
```

## Saidas

Padrao FailLens:

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

O HTML e o JSON sao artefatos locais do consumidor. Nao copie esses arquivos para dentro das skills.

## Replay

A aba **Replay** reenvia manualmente uma request capturada usando o servidor local do FailLens. Para
usar Replay, abra o relatorio em localhost:

```bash
npm run qa:debug:open
```

Ou execute os testes e ja abra o relatorio:

```bash
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
```

O arquivo `reports/faillens/index.html` aberto por `file://` serve para leitura, mas nao consegue
reenviar requests. Replay nao roda automaticamente; o QA precisa clicar em **Enviar request** ou
**Reproduzir sequencia**.

Em ambiente controlado, o relatorio mantem tokens, senhas de teste, headers e bodies para permitir
replay fiel. A aba **Token** mostra o token capturado e permite editar o valor antes de reenviar
requests autenticadas.

## Regras

- Rode `qa:debug` somente quando o usuario pedir execucao/debug ou quando houver autorizacao clara para executar Cypress.
- Nao execute `qa:debug` automaticamente ao final da criacao de suites.
- Nao use `qa:debug` como substituto de `qa:report`; eles respondem perguntas diferentes.
- Nao envie relatorios com tokens, cookies, senhas ou Authorization para fora do ambiente controlado.
- Use o JSON FailLens como evidencia observada, nao como contrato final.
- Se o usuario pedir chamado e existir `reports/faillens/faillens-report.json`, use `qa-chamado` para transformar as evidencias em ticket.

## Referencias

- `README.md`: orientacao da skill no pacote `qa-skills`.
- `vendor/faillens/README.md`: manual completo do FailLens empacotado.
- `tools/qa-debug-report.mjs`: wrapper oficial da skill.
- `vendor/faillens/`: runtime FailLens usado pelo wrapper. Nao edite manualmente; atualize via `npm run prepare:qa-debug-report` no repositorio mantenedor.
