# QA API Skill

Skill para criar, revisar, preparar e analisar testes de API Cypress.

## Fluxo oficial

1. Instale/copie a skill no projeto consumidor:

```text
.agents/skills/qa-api/
```

2. Garanta a skill irmã `graphify`:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

3. Instale a versão travada do Graphify CLI:

```bash
uv tool install graphifyy==0.9.8
```

Alternativa:

```bash
pipx install graphifyy==0.9.8
```

4. Valide:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
```

5. Configure no `package.json` do projeto consumidor:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

Troque `../backend` pelo caminho relativo correto do backend.

6. Rode:

```bash
npm run qa:reindex
```

7. Peça para a IA:

```text
Crie testes para a API <nome-da-api>.
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

## O que a skill não faz automaticamente

- não exige arquivo `.yml`;
- não instala dependências sem autorização;
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
