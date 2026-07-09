# QA Skills

Pacote instalador das skills `qa-api`, `qa-api-fuzz`, `qa-chamado`, `qa-debug-report` e `graphify`.

## Instalacao Recomendada

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando:

- copia as skills para `.agents/skills`;
- instala ou valida `graphifyy==0.9.8`;
- configura `qa:reindex`, `qa:reindex:check`, `qa:report`, `qa:fuzz`, `qa:fuzz:profile`,
  `qa:fuzz:lint`, `qa:fuzz:replay`, `qa:debug`, `qa:debug:open` e `qa:debug:generate` no
  `package.json`, quando ele existir;
- adiciona o estado local das skills ao `.gitignore`.

Depois da instalacao, peca para a IA preparar o projeto:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel, corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites. Nao crie suites de APIs ainda.
```

Depois que a IA criar ou revisar testes de uma API, ela pode gerar o relatorio oficial:

```bash
npm run qa:report -- --api <nome-da-api>
```

Saidas padrao:

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

Para fuzzing investigativo de uma API:

```bash
npm run qa:fuzz:profile -- --api <nome-da-api> --base-url http://localhost:3100
npm run qa:fuzz:lint -- --api <nome-da-api>
npm run qa:fuzz -- --api <nome-da-api> --mode smoke
```

Saidas padrao:

```text
.agents/state/qa-api-fuzz/profiles/<api>.profile.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.md
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json
```

Quando o QA quiser investigar uma falha real da execucao Cypress, use o debug report manual:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

Saidas padrao:

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

`qa:report` e estatico e mede cobertura dos testes gerados. `qa:fuzz` e investigativo e explora
robustez/contrato com profile rastreavel. `qa:debug` executa Cypress com instrumentacao temporaria
para investigar falhas reais.

## Opcoes Comuns

```bash
npx @marcosquintino/qa-skills install --backend ../backend
npx @marcosquintino/qa-skills install --skip-graphify
npx @marcosquintino/qa-skills install --target .codex/skills
```

Observacao: nomes de pacote npm usam minusculo, por isso o comando usa
`@marcosquintino/qa-skills`.

## Desenvolvimento Do QA Debug Report

O codigo-fonte completo do FailLens fica em:

```text
packages/faillens/
```

A skill instalada pelo usuario usa somente o runtime sincronizado em:

```text
qa-debug-report/vendor/faillens/
```

Depois de alterar o FailLens, atualize o runtime da skill:

```bash
npm run prepare:qa-debug-report
```
