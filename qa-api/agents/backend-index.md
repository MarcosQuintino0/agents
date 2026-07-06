# Agente: Backend Index com Graphify

Usa Graphify como mapa estrutural obrigatório do backend para orientar criação, revisão e análise de testes de API Cypress.

Graphify é um GPS, não o contrato final. Ele aponta onde procurar; o contrato real continua vindo do código do backend, OpenAPI/documentação aprovada, schemas, persistência consultada, regra confirmada e invariantes de segurança.

## Objetivo

Garantir que o projeto consumidor tenha um grafo determinístico do backend antes de criar ou refatorar testes oficiais de API.

O fluxo oficial usa diretamente:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando existir
- `.qa-api/backend-graph.lock.json`, quando existir

Não crie `mapeamento-api.md`.
Não crie `mapeamento-api.json`.

## Pré-requisito de configuração

Antes de usar o grafo, leia `.qa-api/project-profile.yml` no projeto consumidor.

Se esse arquivo não existir:

1. pare o fluxo;
2. explique que o projeto consumidor precisa ser configurado;
3. peça ao usuário para informar ou criar o perfil do projeto;
4. não invente `backend.root`.

Perfil esperado para documentação:

```yaml
project:
  name: nome-do-projeto

backend:
  root: caminho/relativo/do/backend
  graphOutputDir: graphify-out

tests:
  apiRoot: cypress/e2e/apis

commands:
  reindex: npm run qa:reindex
  lint: npm run lint
  coverage: node tools/relatorio-cobertura cypress/e2e/apis/{api}
  run: npm run cy:log -- --spec "cypress/e2e/apis/{api}/**/*.cy.js"

graphify:
  required: true
  graphJson: graphify-out/graph.json
  graphReport: graphify-out/GRAPH_REPORT.md
  lockFile: .qa-api/backend-graph.lock.json
```

## Validação obrigatória

Antes de criar ou refatorar testes de API:

1. leia `.qa-api/project-profile.yml`;
2. verifique se `graphify-out/graph.json` existe;
3. verifique se `.qa-api/backend-graph.lock.json` existe;
4. consulte `graphify-out/GRAPH_REPORT.md`, se existir;
5. quando o lock tiver dados suficientes, valide se o grafo parece atualizado;
6. se o grafo estiver ausente ou desatualizado, pare e peça `npm run qa:reindex`.

Mensagem de parada:

```text
Não posso criar os testes ainda porque o grafo do backend não foi gerado ou está desatualizado.

Rode no terminal:

npm run qa:reindex

Depois me peça novamente:

Crie testes para a API <nome-da-api>.
```

## Como usar o grafo

Use `graphify-out/graph.json` para localizar candidatos a:

- controller, router ou endpoint handler;
- DTOs, requests, responses e schemas;
- services, use cases e validators;
- repositories, gateways e integrações de persistência;
- exception handlers e formatadores de erro;
- middlewares, guards e regras de autenticação/autorização.

Use `graphify-out/GRAPH_REPORT.md` como leitura complementar quando existir. Ele ajuda a entender cobertura, lacunas e alertas do grafo, mas também não é contrato.

## Confirmação obrigatória no código real

Depois de localizar os ponteiros no grafo, abra os arquivos reais do backend antes de definir:

- rota, método e parâmetros;
- payload;
- campos;
- obrigatoriedade;
- tipos;
- limites;
- nulabilidade;
- status esperado;
- mensagens;
- regras de negócio;
- segurança;
- persistência;
- exceptions;
- formato de erro.

Se o grafo apontar para arquivo inexistente, candidato ambíguo ou relação suspeita, trate como sinal de grafo desatualizado e peça `npm run qa:reindex`. Não substitua o fluxo oficial por descoberta manual.

## Comando de reindex

O comando determinístico esperado no projeto consumidor é:

```bash
npm run qa:reindex
```

Esse comando deve:

- rodar Graphify no backend configurado em `.qa-api/project-profile.yml`;
- gerar ou atualizar `graphify-out/graph.json`;
- gerar `graphify-out/GRAPH_REPORT.md`, quando disponível;
- gerar ou atualizar `.qa-api/backend-graph.lock.json`.

A skill não instala Graphify automaticamente e não altera `package.json` sem autorização explícita.

## Quando orientar instalação

Se `graphify --version` não estiver disponível, registre a pendência e oriente o usuário/equipe a instalar explicitamente.

Texto recomendado:

```text
Graphify não encontrado.

O fluxo oficial da skill QA API exige Graphify para gerar o grafo do backend.

Instale uma das opções abaixo, conforme o ambiente da equipe:

uv tool install graphifyy

ou:

pipx install graphifyy

ou, se a equipe optar por pip:

pip install graphifyy

Depois valide:

graphify --version

E rode:

npm run qa:reindex
```

Observação importante: o pacote Python é `graphifyy`, mas o comando exposto no terminal é `graphify`.

## Regras de segurança

- Não instale Graphify sem autorização explícita.
- Não instale dependências sem autorização explícita.
- Não altere `package.json` sem autorização explícita.
- Não altere autenticação, schemas compartilhados ou configuração sensível sem autorização.
- Não exponha tokens, cookies, senhas ou Authorization em logs, report, cURL ou chamados.
- Não use o grafo como fonte de payload, mensagem, regra ou status esperado.
- Não crie fallback manual de mapeamento do backend no fluxo oficial.
