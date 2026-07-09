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
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

## Abrir em localhost

Para usar recursos interativos do relatorio, como a aba **Replay**, abra o HTML pelo servidor local
do FailLens:

```bash
npm run qa:debug:open
```

Se quiser executar os testes, gerar o relatorio e ja abrir em localhost:

```bash
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
```

O arquivo `reports/faillens/index.html` tambem abre via `file://`, mas nesse modo a aba **Replay**
nao consegue reenviar requests.

Em ambiente controlado, o FailLens mantem tokens, senhas de teste, headers e bodies no HTML/JSON para
permitir replay fiel. Na aba **Token**, o valor capturado aparece completo e pode ser editado antes de
reenviar requests autenticadas.

## Runtime

O FailLens empacotado fica em `vendor/faillens/`.

O codigo-fonte completo fica no repositorio em `packages/faillens/`. Para atualizar o runtime da
skill depois de mudar o fonte:

```bash
npm run prepare:qa-debug-report
```

O projeto consumidor recebe somente esta skill pronta; ele nao precisa conhecer `packages/faillens`.
