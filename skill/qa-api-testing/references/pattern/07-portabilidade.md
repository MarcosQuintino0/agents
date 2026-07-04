# Adaptar o padrão a um novo projeto

Parte do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`.

> Dependências: garanta-as com o **`api-preparador.md`**. Este documento resume o que a camada
> `support/` precisa expor (o código vem dos templates / de uma implementação de referência).

Este padrão é genérico. Para portá-lo, o projeto precisa fornecer (em `support/`):

1. Um **perfil de stack** (`api/config.js`): baseUrl, status de bloqueio sem autenticação
   (`statusSemAutenticacao`), status de credencial inválida quando conhecido
   (`statusCredencialInvalida`), chaves de paginação e sinais de vazamento. É o **único** arquivo que
   muda por backend (fora o login).
2. Um **adapter de autenticação** (`api/auth.api.js`): login + headers (Bearer/cookie/API-key).
3. Um **wrapper de request** com log e `failOnError` (`apiRequest`).
4. Um **validador de schema** (ajv) lendo de `fixtures/schemas`.
5. O **guard de não-vazamento** e os asserts base, adaptados ao contrato de erro do produto
   (`assertions/error.assertions.js` + `api/asserts.base.js`).

Mantenha simples: não crie uma camada extra de abstração se o contrato do produto é claro. Para outro
produto, adapte os arquivos acima em vez de forçar o código do projeto atual a ser genérico demais.

Dependências comuns: `ajv` (schema), `@faker-js/faker` (massa), `prettier` (formatação), `eslint`
(análise estática) e `eslint-plugin-cypress` (boas práticas Cypress). Uma configuração flat também
pode usar `@eslint/js` e `globals`.

O projeto deve possuir os scripts:

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix"
}
```

O lint faz parte da definição de pronto:

- o creator executa `npm run lint` depois de implementar;
- o reviewer executa `npm run lint` durante a auditoria;
- uma violação real deve ser corrigida, não ocultada com `eslint-disable` ou novo caminho ignorado;
- `npm run lint:fix` só deve ser usado após revisar quais arquivos serão alterados;
- código legado pode ficar temporariamente fora do gate somente quando a exclusão estiver explícita,
  justificada e acompanhada de uma fronteira clara para código novo.
