# QA API Skill

Skill para criar, revisar, preparar e analisar testes de API Cypress.

## Fluxo oficial

1. Inicializar/configurar o projeto consumidor.
2. Rodar Graphify no projeto consumidor:

```bash
npm run qa:reindex
```

3. Pedir para a IA:

```text
Crie testes para a API <nome-da-api>.
```

## O que a skill faz

- usa Graphify como mapa do backend;
- lê o código real antes de definir contrato;
- cria specs Cypress;
- cria `_support/api.js`, `_support/payload.js`, `_support/asserts.js`, `_support/helpers.js`;
- cria schemas de sucesso quando aplicável;
- aplica o catálogo de testes;
- valida status, schema, regra, persistência, não-vazamento e acesso;
- revisa a própria saída.

## O que a skill não faz automaticamente

- não instala dependências sem autorização;
- não altera autenticação sem autorização;
- não altera schemas compartilhados sem autorização;
- não cria testes oficiais sem Graphify;
- não usa Graphify como contrato final;
- não mascara defeito para fazer teste passar.

## Instalação do Graphify

Graphify é obrigatório no fluxo oficial, mas deve ser instalado explicitamente pelo usuário/equipe.

Sugestão:

```bash
uv tool install graphifyy
```

Depois:

```bash
graphify --version
```

E no projeto consumidor:

```bash
npm run qa:reindex
```
