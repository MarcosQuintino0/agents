# Estrutura do Consumidor

Depois da instalacao e preparo, um projeto consumidor tende a ter esta estrutura.

```text
.agents/
  skills/
    qa-api/
    qa-api-fuzz/
    qa-chamado/
    qa-debug-report/
    graphify/
  state/
    qa-api/
    qa-api-fuzz/

cypress/
  fixtures/
    schemas/
  support/
    api/
    assertions/
    tags.js
  e2e/
    apis/
      <api>/
        crud.cy.js
        validacoes.cy.js
        seguranca.cy.js
        _support/

reports/
  faillens/
```

## O que versionar

Normalmente versionar:

- specs Cypress;
- support;
- fixtures;
- schemas;
- `package.json`;
- configuracoes Cypress/lint.

Normalmente ignorar:

- `.agents/state/`;
- `.faillens/`;
- `reports/`;
- `graphify-out/`;
- `.qa-api/`.

## Observacao

As skills instaladas podem ser versionadas ou tratadas como artefato local, dependendo da politica do projeto consumidor. O estado gerado deve continuar local.
