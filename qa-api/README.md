# QA API Skill

Skill para preparar projetos Cypress/API, criar suítes, revisar cobertura e analisar reports de
execução.

## Fluxo oficial

1. No projeto consumidor, rode o instalador:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto do backend.

O instalador copia `qa-api`, `qa-api-fuzz`, `qa-chamado`, `qa-debug-report` e `graphify`, instala/valida `graphifyy==0.9.8`,
configura `qa:reindex`, `qa:reindex:check`, `qa:report`, `qa:fuzz`, `qa:fuzz:profile`,
`qa:fuzz:lint`, `qa:fuzz:replay`, `qa:debug`, `qa:debug:open` e `qa:debug:generate` quando houver `package.json`, e ignora
estado local em `.gitignore`.

2. Peça para a IA preparar o projeto:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessários quando possível, corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suítes. Não crie suítes de APIs ainda.
```

3. Depois peça para criar uma suíte:

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenário para todas as rotas da API. Não deixe cenário aplicável sem teste ou justificativa.
```

O usuário não precisa criar `.yml` nem rodar `npm run` manualmente no fluxo normal. O agente executa
`qa:reindex`, `qa:reindex:check` e, ao final da criação/revisão de suítes, `qa:report` quando puder.
Ele só pede ação manual se não tiver permissão, se o caminho do backend estiver indefinido ou se o
ambiente externo falhar.

## O que a skill faz

- usa Graphify como mapa do backend;
- lê `.agents/state/qa-api/backend-graph.lock.json` para localizar o backend usado no reindex;
- lê o código real antes de definir contrato;
- prepara a base comum Cypress/API;
- cria specs Cypress e arquivos `_support`;
- aplica catálogo de testes, matriz endpoint x cenário e checklist comum;
- valida status, schema, regra, persistência, não-vazamento e acesso;
- gera `coverage.html` e `coverage.json` com `qa:report` depois que a suíte existir;
- revisa a própria saída;
- analisa `report.json`/FailLens e entrega problemas numerados para possível uso pela skill `qa-chamado`.

## O que a skill não faz automaticamente

- não exige arquivo `.yml`;
- não instala dependências fora do preparo sem autorização;
- não altera autenticação real sem autorização;
- não altera schemas compartilhados existentes sem autorização;
- não cria testes oficiais sem Graphify;
- não cria suítes de APIs durante o preparo do projeto;
- não cria ferramentas legadas como `cy:log`, `relatorio-cobertura` ou `relatorio-execucao`;
- não executa `qa:debug` automaticamente; debug de falha real é fluxo manual da skill `qa-debug-report`;
- não usa Graphify como contrato final;
- não mascara defeito para fazer teste passar;
- não cria rascunhos de chamados, use `qa-chamado` para isso.

## Artefatos do Graphify

O script `qa:reindex` cria:

```text
.agents/state/qa-api/graphify-out/graph.json
.agents/state/qa-api/graphify-out/graph.html
.agents/state/qa-api/backend-graph.lock.json
```

`graph.json` e `backend-graph.lock.json` são obrigatórios para criação/refatoração. `graph.html` é
visual humano e não bloqueia testes. `GRAPH_REPORT.md`, quando existir, é complementar.

## Relatório oficial da suíte

Depois de criar ou revisar uma suíte de API, rode:

```bash
npm run qa:report -- --api <nome-da-api>
```

Saídas:

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

O relatório é estático: ele lê specs Cypress, JSDoc, tags `CatalogoTags`, vínculos `@regra:<id>` e
declarações `@cobertura`. Ele não substitui a execução da suíte; serve para auditar rapidamente o que
foi criado, o que ficou lacuna e quais alertas de qualidade existem.

## Fuzzing investigativo

Para fuzzing/property-based de API, use a skill irma `qa-api-fuzz`.

```bash
npm run qa:fuzz:profile -- --api <nome-da-api> --base-url <url>
npm run qa:fuzz:lint -- --api <nome-da-api>
npm run qa:fuzz -- --api <nome-da-api> --mode smoke
```

`qa-api-fuzz` nao substitui os testes Cypress oficiais. Ela gera achados investigativos e so deve
promover um caso para Cypress quando houver oraculo confirmado.

## Debug manual de falhas reais

Quando o QA quiser investigar uma falha real da execução Cypress, use a skill irmã `qa-debug-report`:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

Saídas padrão:

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

`qa:debug` executa Cypress com instrumentação temporária do FailLens. Use esse relatório para
debug, reprodução, evidências de falha e apoio a chamados. Não use como substituto de `qa:report`.

Para usar a aba **Replay**, abra o relatorio em localhost com:

```bash
npm run qa:debug:open
```

Para executar os testes, gerar o relatorio e ja abrir em localhost, use:

```bash
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
```

O arquivo `reports/faillens/index.html` aberto por `file://` continua util para leitura, mas nao
permite reenviar requests pela aba Replay.

Status de cobertura:

- `aplicavel`: precisa de teste.
- `nao-confirmado`: pode fazer sentido, mas falta contexto.
- `incorporado`: já está validado dentro de outro teste.
- `nao-aplicavel`: o conceito claramente não existe nesta API.

## Templates por intenção

Leia `templates/api-templates.md` primeiro e carregue somente o que for necessário:

- `cypress-base.md`: camada comum, cliente HTTP, log mascarado e config;
- `autenticacao.md`: login, token, sem autenticação, permissão e segurança;
- `schemas.md`: AJV e schemas;
- `asserts.md`: asserts genéricos e do recurso;
- `erros.md`: contrato de erro e não-vazamento;
- `fixtures.md`: payloads, massa, hooks e cleanup;
- `crud.md`: cliente do recurso, CRUD, persistência e listagem;
- `validacoes.md`: obrigatoriedade, limites, tipos e validações.

## Graphify

Graphify CLI é obrigatório no fluxo oficial e a versão fica travada na skill irmã `graphify`.

Estrutura esperada:

```text
.agents/skills/
- qa-api/
- qa-api-fuzz/
- qa-chamado/
- qa-debug-report/
- graphify/
```
