# Comandos

## Instalador

```bash
npx @marcosquintino/qa-skills install --backend ../backend
npx @marcosquintino/qa-skills install --skip-graphify
npx @marcosquintino/qa-skills install --target .codex/skills
```

## qa-api

```bash
npm run qa:reindex
npm run qa:reindex:check
npm run qa:report -- --api <nome-da-api>
npm run qa:report -- --dir cypress/e2e/apis/<nome-da-api>
```

## qa-api-fuzz

```bash
npm run qa:fuzz:profile -- --api <nome-da-api> --base-url http://localhost:3100
npm run qa:fuzz:lint -- --api <nome-da-api>
npm run qa:fuzz -- --api <nome-da-api> --mode smoke
npm run qa:fuzz -- --api <nome-da-api> --dry-run --max-cases 10
npm run qa:fuzz:replay -- --report .agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json --finding F001
```

## qa-debug-report

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/<api>/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/<api>/**/*.cy.js"
npm run qa:debug:open
npm run qa:debug:generate -- --input reports/faillens/faillens-report.json --output reports/faillens/index.html
```

## Desenvolvimento do FailLens

```bash
npm run build:faillens
npm run sync:faillens
npm run prepare:qa-debug-report
```

## Documentacao

```bash
python -m mkdocs serve
python -m mkdocs build --strict
```
