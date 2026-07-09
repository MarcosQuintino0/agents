# Criar Suite de API

Este guia cobre a criacao ou refatoracao de uma suite oficial Cypress/API.

## Prompt base

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenario para todas as rotas da API.
Para cada rota, avalie sucesso, inexistente, validacao de payload, body ausente,
sem autenticacao, token invalido, persistencia/preservacao e nao-vazamento.
Nao deixe cenario aplicavel sem teste ou justificativa.
```

## Antes de implementar

A IA deve:

- validar Graphify e lock;
- localizar backend real;
- ler controllers, validators, services e handlers;
- confirmar perfil do produto;
- montar cobertura do catalogo;
- montar matriz endpoint x cenario;
- declarar estrategia de massa e cleanup.

## Arquivos esperados

Dependendo da API:

```text
cypress/e2e/apis/<api>/crud.cy.js
cypress/e2e/apis/<api>/validacoes.cy.js
cypress/e2e/apis/<api>/seguranca.cy.js
cypress/e2e/apis/<api>/_support/api.js
cypress/e2e/apis/<api>/_support/payload.js
cypress/e2e/apis/<api>/_support/asserts.js
cypress/e2e/apis/<api>/_support/helpers.js
cypress/fixtures/schemas/<api>.schema.json
```

## Metadata obrigatoria

- `@contrato`;
- `@api`;
- `@campo`;
- `@regra`;
- `@regra:<id>`;
- `CatalogoTags`;
- `phase` nas chamadas quando aplicavel.

## Depois de implementar

```bash
npm run qa:report -- --api <nome-da-api>
```

O relatorio estatico deve virar parte da evidencia final.
