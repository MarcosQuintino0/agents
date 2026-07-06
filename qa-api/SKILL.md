---
name: qa-api
description: Cria, revisa, prepara e analisa testes de API Cypress seguindo o padrão corporativo de qualidade, usando Graphify como mapa obrigatório do backend. Use quando o usuário pedir para criar, refatorar, revisar ou analisar testes de API, preparar o projeto Cypress para testes de API, rodar o fluxo de reindex do backend, ou investigar reports de execução de APIs.
---

# Skill: QA API

Use esta skill quando o usuário pedir para criar, refatorar, revisar ou analisar testes de API em Cypress.

## Entrada mínima aceita

O usuário pode pedir apenas:

```text
Crie testes para a API <nome-da-api>.
```

Também aceite variações como:

```text
Crie os testes da API <nome-da-api>.
Refatore os testes da API <nome-da-api>.
Revise os testes da API <nome-da-api>.
Analise o report da API <nome-da-api>.
Prepare o projeto para testes de API.
```

## Regra obrigatória de Graphify

O fluxo oficial exige Graphify.

Antes de criar ou refatorar testes de API, verifique se existem no projeto consumidor:

- `graphify-out/graph.json`
- `.qa-api/backend-graph.lock.json`

Use também `graphify-out/GRAPH_REPORT.md` quando existir.

Se o grafo ou lock não existir, pare e responda:

```text
Não posso criar os testes ainda porque o grafo do backend não foi gerado.

Rode no terminal:

npm run qa:reindex

Depois me peça novamente:

Crie testes para a API <nome-da-api>.
```

Se o lock existir, use o campo `backendRoot` ou `backendRootAbsolute` para localizar o código real do backend. Se o lock não tiver nenhum desses campos, trate como lock inválido e peça `npm run qa:reindex`.

Se o lock indicar que o grafo está desatualizado, pare e peça `npm run qa:reindex`.

Se o projeto consumidor ainda não tiver o script `qa:reindex`, responda:

```text
O projeto consumidor ainda não possui o script `qa:reindex`.

Configure no package.json:

"qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend"

Depois rode:

npm run qa:reindex
```

O usuário deve trocar `../backend` pelo caminho relativo correto do backend. Não invente esse caminho.

Se o grafo existir, use-o como mapa estrutural do backend. Graphify é um GPS, não o contrato final.

A skill `qa-api` não contém Graphify internamente. Graphify é uma skill irmã obrigatória no fluxo oficial.

Graphify deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

A versão esperada fica travada em `graphify/manifest.json`. O `qa-reindex.mjs` deve parar se a versão instalada do comando `graphify` for diferente.

Sempre leia o código real do backend antes de definir:

- endpoints;
- payloads;
- campos;
- tipos;
- obrigatoriedade;
- nulabilidade;
- limites;
- status esperado;
- mensagens;
- regras de negócio;
- segurança;
- persistência;
- exceptions;
- formato de erro.

## Arquivos principais desta skill

- `agents/api-preparador.md`: prepara e audita a base compartilhada Cypress.
- `agents/backend-index.md`: descreve o uso obrigatório de Graphify e o comando de reindex.
- `agents/api-criador.md`: cria ou refatora a suíte completa de uma API.
- `agents/api-revisor.md`: revisa uma suíte existente e identifica lacunas.
- `agents/api-analisador.md`: analisa `report.json` após execução dos testes.
- `pattern/api-pattern.md`: fonte única das regras de qualidade.
- `pattern/01-oraculo-selecao.md`: oráculo, catálogo de testes, tags e seleção de cenários.
- `pattern/02-validacao-camadas.md`: validação por camadas.
- `pattern/03-convencoes.md`: convenções de specs e tags.
- `pattern/04-comentarios-jsdoc.md`: documentação viva e contrato JSDoc.
- `pattern/05-exemplos.md`: exemplos de aplicação das regras.
- `pattern/06-organizacao-codigo.md`: organização de support, schemas e erros.
- `pattern/07-portabilidade.md`: adaptação para novos produtos.
- `templates/api-templates.md`: exemplos técnicos.
- `templates/api-perfil.template.md`: checklist de perfil do produto.
- `docs/graphify.md`: como rodar e validar Graphify.
- `docs/prompts.md`: prompts curtos recomendados para o usuário.

## Roteamento de intenção

Quando o usuário pedir para preparar o projeto:

- use `agents/api-preparador.md`;
- confira scripts `qa:reindex` e `qa:reindex:check`, disponibilidade de Graphify e artefatos do grafo;
- peça autorização antes de alterar `package.json` ou instalar dependências.

Quando o usuário pedir para criar ou refatorar testes:

- use `agents/api-criador.md`;
- antes de implementar, valide Graphify conforme esta skill;
- use o grafo como mapa;
- leia o backend real para confirmar contrato;
- aplique as regras de `pattern/`.

Quando o usuário pedir para revisar testes:

- use `agents/api-revisor.md`;
- se a revisão depender do backend, use Graphify apenas como apoio de navegação e confirme tudo no código real.

Quando o usuário pedir para analisar falhas, report ou execução:

- use `agents/api-analisador.md`;
- entregue problemas numerados e indique quais têm evidência suficiente para possível chamado;
- se o usuário pedir para criar chamados, use a skill `qa-chamado`.

Quando o usuário pedir para transformar problemas em chamados:

- use `qa-chamado`;
- não gere rascunhos de chamado por esta skill.

Quando o usuário perguntar como rodar o mapeamento:

- use `agents/backend-index.md` e `docs/graphify.md`.

## Regras inegociáveis

- Não invente contrato.
- Não crie teste sem oráculo confiável.
- Não use Graphify como contrato final.
- Não faça descoberta manual do backend quando o grafo estiver ausente no fluxo oficial.
- Não crie `mapeamento-api.md`.
- Não crie `mapeamento-api.json`.
- Não altere autenticação, schemas compartilhados ou configurações sensíveis sem autorização.
- Não instale dependências sem autorização.
- Não masque defeito para fazer teste passar.
- Não exponha tokens, cookies, senhas ou Authorization em logs, reports, cURL ou chamados.
