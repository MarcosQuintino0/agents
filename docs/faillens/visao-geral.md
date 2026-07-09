# FailLens

FailLens e a biblioteca e CLI usada pela `qa-debug-report` para gerar relatorios locais de falhas Cypress/API.

## O que ele faz

- Executa Cypress com instrumentacao temporaria.
- Captura `cy.request`.
- Registra request, response, erro, assertions e screenshots.
- Le JSDoc e tags de contrato quando existirem.
- Gera HTML standalone e JSON local.
- Oferece visualizador localhost para Replay.

## O que ele nao faz

- Nao usa IA em runtime.
- Nao envia telemetria.
- Nao altera arquivos Cypress do consumidor.
- Nao substitui `qa:report`.
- Nao adivinha contrato ausente.

## Comandos

No projeto consumidor, use os wrappers:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/<api>/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/<api>/**/*.cy.js"
npm run qa:debug:open
```

No desenvolvimento do pacote:

```bash
npm run prepare:qa-debug-report
```
