# QA Debug Report

Skill para rodar o FailLens como relatorio manual de debug de falhas Cypress/API.

## Uso no consumidor

O instalador `@marcosquintino/qa-skills` configura:

```json
{
  "scripts": {
    "qa:debug": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs run",
    "qa:debug:open": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs open",
    "qa:debug:generate": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs generate"
  }
}
```

Exemplo:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

## Runtime

O FailLens empacotado fica em `vendor/faillens/`.

O codigo-fonte completo fica no repositorio em `packages/faillens/`. Para atualizar o runtime da
skill depois de mudar o fonte:

```bash
npm run prepare:qa-debug-report
```

O projeto consumidor recebe somente esta skill pronta; ele nao precisa conhecer `packages/faillens`.
