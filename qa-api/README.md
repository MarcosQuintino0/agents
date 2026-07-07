# QA API Skill

Skill para criar, revisar, preparar e analisar testes de API Cypress.

## Fluxo oficial

1. No projeto consumidor, rode o instalador oficial:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto do backend.

Esse comando copia as skills, instala/valida `graphifyy==0.9.8` e configura os scripts
`qa:reindex` e `qa:reindex:check` quando o projeto tiver `package.json`.

2. Confirme a estrutura instalada:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

3. Rode:

```bash
npm run qa:reindex
```

4. Peça para a IA:

```text
Crie testes para a API <nome-da-api>.
```

### Instalação manual

Se o ambiente não puder usar o instalador npm, copie manualmente:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

Depois instale a versão travada do Graphify CLI:

```bash
uv tool install graphifyy==0.9.8
```

Alternativa:

```bash
pipx install graphifyy==0.9.8
```

Valide:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
```

E configure no `package.json` do projeto consumidor:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

## O que a skill faz

- usa Graphify como mapa do backend;
- lê `.qa-api/backend-graph.lock.json` para localizar o backend usado no reindex;
- lê o código real antes de definir contrato;
- cria specs Cypress;
- cria `_support/api.js`, `_support/payload.js`, `_support/asserts.js`, `_support/helpers.js`;
- cria schemas de sucesso quando aplicável;
- aplica o catálogo de testes;
- valida status, schema, regra, persistência, não-vazamento e acesso;
- revisa a própria saída;
- analisa reports e entrega problemas numerados para a skill `qa-chamado`.

## Templates por intencao

`templates/api-templates.md` agora e um indice. A skill deve ler somente os templates necessarios
para a tarefa atual:

- `cypress-base.md`: camada comum, cliente HTTP, log mascarado e config base;
- `autenticacao.md`: login, token, sem autenticacao, permissao e seguranca;
- `schemas.md`: AJV e schemas de resposta/erro;
- `asserts.md`: asserts genericos e asserts do recurso;
- `erros.md`: contrato de erro, vazamento interno e mensagens;
- `fixtures.md`: payloads, massa de dados, hooks e cleanup;
- `crud.md`: cliente do recurso, CRUD, persistencia e listagem;
- `validacoes.md`: obrigatoriedade, limites, tipos e validacoes data-driven.

## O que a skill não faz automaticamente

- não exige arquivo `.yml`;
- não instala dependências durante a criação dos testes; a instalação do Graphify acontece no setup
  explícito com `npx @marcosquintino/qa-skills install`;
- não altera autenticação sem autorização;
- não altera schemas compartilhados sem autorização;
- não cria testes oficiais sem Graphify;
- não usa Graphify como contrato final;
- não mascara defeito para fazer teste passar;
- não cria rascunhos de chamados, use `qa-chamado` para isso.

## Lock do backend

O usuário não precisa criar `.yml`.

O script `qa:reindex` cria automaticamente:

```text
.qa-api/backend-graph.lock.json
```

A skill usa esse lock para descobrir o backend real por `backendRoot` ou `backendRootAbsolute`.

## Graphify

Graphify CLI é obrigatório no fluxo oficial e a versão fica travada na skill irmã `graphify`.

Graphify não fica dentro da `qa-api`.

Graphify deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```
