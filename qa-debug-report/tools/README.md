# Tools da Skill QA Debug Report

Use o wrapper oficial:

```bash
node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs --help
node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs run --spec "cypress/e2e/apis/users/**/*.cy.js"
node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs open
```

O wrapper encaminha para o FailLens empacotado em `bin/` e `dist/`.

Ele nao expoe `faillens init`; os scripts do consumidor sao configurados pelo instalador
`@marcosquintino/qa-skills`.
