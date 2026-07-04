# Agente: Setup Seguro de Testes de API (Cypress)

Prepara o projeto de automação para receber testes de API no padrão de qualidade definido em `api-pattern.md`.

Este agente **não cria testes de endpoint**. Ele audita e prepara a base comum: dependências,
estrutura, helpers compartilhados, schemas de erro e perfil do produto.

---

## Objetivo

Depois deste setup, o `api-criador.md` deve conseguir criar uma suíte de API sem precisar que o
usuário lembre manualmente de `config.js`, `auth.api.js`, schemas de erro ou asserts base.

Fluxo esperado:

```text
1. Rode este setup no projeto de automação.
2. Corrija/aprove as pendências que ele reportar.
3. Depois use api-criador.md para criar/refatorar testes de uma API.
```

---

## Regra principal: auditar antes de alterar

Antes de criar ou mexer em qualquer arquivo:

1. Verifique se ele já existe.
2. Se existe, leia e classifique:
   - **OK no padrão**: não altere.
   - **Existe, mas fora do padrão**: reporte o que está diferente e peça autorização antes de refatorar.
   - **Existe em outro caminho/nome**: reporte e proponha reaproveitar, mover ou criar adapter.
   - **Não existe**: proponha criação.
3. Nunca sobrescreva arquivo existente sem autorização explícita.

---

## Arquivos que o setup deve auditar

| Arquivo                                               | Ação se não existir                                            | Ação se existir fora do padrão                      |
| ----------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| `package.json`                                        | Avisar que o projeto pode não ser Node/Cypress.                | Não reescrever; só reportar scripts/deps faltantes. |
| `.prettierrc.json`                                    | Pode propor criação.                                           | Não sobrescrever; reportar diferença.               |
| `eslint.config.*` ou `.eslintrc*`                     | Pode propor configuração compatível após auditar a estrutura.  | Não sobrescrever; reportar regras e escopo.         |
| `cypress/support/api/config.js`                       | Pode propor criação após entender o produto.                   | Reportar lacunas; refatorar só com OK.              |
| `cypress/support/api/auth.api.js`                     | **Perguntar antes de criar.**                                  | **Perguntar antes de refatorar.**                   |
| `cypress/support/api/client.js`                       | Pode propor criação.                                           | Reportar diferenças; refatorar só com OK.           |
| `cypress/support/api/schema.js`                       | Pode propor criação.                                           | Reportar diferenças; refatorar só com OK.           |
| `cypress/support/api/asserts.base.js`                 | Pode propor criação.                                           | Reportar diferenças; refatorar só com OK.           |
| `cypress/support/assertions/error.assertions.js`      | Pode propor criação.                                           | Reportar diferenças; refatorar só com OK.           |
| `cypress/support/assertions/pagination.assertions.js` | Pode propor criação se o produto pagina.                       | Reportar diferenças; refatorar só com OK.           |
| `cypress/fixtures/schemas/erro.schema.json`           | Pode propor criação depois de descobrir contrato de erro.      | Reportar divergências; alterar só com OK.           |
| `cypress/fixtures/schemas/erro-validacao.schema.json` | Pode propor criação depois de descobrir contrato de validação. | Reportar divergências; alterar só com OK.           |

`auth.api.js` é sensível porque envolve login, token, headers, tenant/cliente e credenciais. Se não
existir ou estiver fora do padrão, **sempre pare e peça autorização antes de criar/refatorar**.

---

## Dependências do padrão

| Pacote                  | Para quê                                        | Verificar em      |
| ----------------------- | ----------------------------------------------- | ----------------- |
| `cypress`               | rodar os testes                                 | `devDependencies` |
| `ajv`                   | validar respostas por JSON Schema               | `devDependencies` |
| `@faker-js/faker`       | gerar massa de dados única                      | `devDependencies` |
| `prettier`              | formatação única do código                      | `devDependencies` |
| `eslint`                | detectar problemas estáticos no JavaScript      | `devDependencies` |
| `eslint-plugin-cypress` | detectar práticas inseguras ou frágeis Cypress  | `devDependencies` |
| `@eslint/js`            | aplicar regras recomendadas, se usado na config | `devDependencies` |
| `globals`               | declarar ambientes, se usado na config          | `devDependencies` |
| `acorn`                 | parser estático usado pelo `tools/relatorio-cobertura` (declare explicitamente; não confie na resolução transitiva via eslint) | `devDependencies` |

Se faltar dependência, **pergunte antes de instalar**:

```bash
npm install -D <pacotes-que-faltam>
```

Antes de propor versões, descubra a versão do Node, o gerenciador de pacotes e a configuração ESLint
existente. Instale versões compatíveis com o projeto; não force a versão mais recente nem migre
`.eslintrc*` para flat config sem autorização.

---

## Travas de lint do padrão

Além das regras recomendadas do ESLint e do `eslint-plugin-cypress`, o setup deve garantir que a
configuração contenha as **travas determinísticas** que barram anti-padrões do `api-pattern.md`.
Elas existem para que regras de higiene não dependam de revisão manual nem da auto-avaliação do
agente: o que pode ser verificado por máquina não deve ficar a cargo do modelo.

Travas mínimas (subconjunto mecânico das seções 7, 10 e 13 do `api-pattern.md`):

| Trava                                            | Onde se aplica                  | Por quê                                                          |
| ------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------- |
| Sem `cy.request` direto                          | specs `*.cy.js`                 | request deve passar por `_support/api.js`, não pelo spec         |
| Sem `cy.log(JSON.stringify(...))`                | specs `*.cy.js`                 | o log fica no client/`apiRequest`, não solto no teste            |
| Sem `it.only` / `describe.only` / `context.only` | specs `*.cy.js`                 | evita subir teste focado por engano                              |
| Sem `expect`                                     | `_support/api.js`, `payload.js` | esses arquivos não contêm assertions (regra vai em `asserts.js`) |
| Sem import de `faker`                            | `_support/api.js`               | massa de dados pertence a `payload.js`, não ao request           |
| Sem escape Unicode desnecessário                 | código novo de APIs             | mantém textos acentuados legíveis diretamente em UTF-8           |
| Request seguro                                   | `support/api/requestLogger.*`   | `cy.request` usa `log:false` e report/cURL não vazam credenciais |

Implementação (flat config, ESLint 9+). Ao portar para outro projeto, ajuste **apenas os globs de
arquivo**; a intenção das regras é a mesma:

```js
// Specs: sem cy.request direto, sem cy.log(JSON.stringify), sem .only.
{
  files: ["cypress/e2e/**/*.cy.js"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.object.name='cy'][callee.property.name='request']",
        message: "Nao use cy.request direto no spec; chame via _support/api.js (pattern secao 13).",
      },
      {
        selector:
          "CallExpression[callee.object.name='cy'][callee.property.name='log'] CallExpression[callee.object.name='JSON'][callee.property.name='stringify']",
        message: "Nao use cy.log(JSON.stringify(...)) (pattern secao 13).",
      },
      {
        selector: "Literal[raw=/\\\\u[0-9a-fA-F]{4}/]",
        message: "Escreva caracteres acentuados diretamente em UTF-8, sem escapes Unicode.",
      },
      {
        selector: "TemplateElement[value.raw=/\\\\u[0-9a-fA-F]{4}/]",
        message: "Escreva caracteres acentuados diretamente em UTF-8, sem escapes Unicode.",
      },
    ],
    "no-restricted-properties": [
      "error",
      { object: "it", property: "only", message: "Remova .only antes de commitar." },
      { object: "describe", property: "only", message: "Remova .only antes de commitar." },
      { object: "context", property: "only", message: "Remova .only antes de commitar." },
    ],
  },
},
// api.js e payload.js nao contem assertions (pattern/06-organizacao-codigo.md).
// Suporte global: arquivos de request/config (nao de assertion) — espelho do api.js/payload.js per-API.
{
  files: [
    "cypress/e2e/**/_support/api.js",
    "cypress/e2e/**/_support/payload.js",
    "cypress/support/api/client.js",
    "cypress/support/api/config.js",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.name='expect']",
        message: "api.js/payload.js/client.js/config.js nao contem assertions; use _support/asserts.js (pattern/06-organizacao-codigo.md).",
      },
    ],
  },
},
// api.js so faz chamada HTTP: faker pertence a payload.js (pattern/06-organizacao-codigo.md).
// Suporte global inteiro: massa (faker) pertence ao payload.js per-API, nao ao support global.
{
  files: ["cypress/e2e/**/_support/api.js", "cypress/support/api/*.js"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@faker-js/faker", "*faker*"],
            message: "Massa (faker) pertence a payload.js, nao a api.js (pattern/06-organizacao-codigo.md).",
          },
        ],
      },
    ],
  },
},
// Textos de negocio usam UTF-8 legivel; escapes tecnicos em regex continuam permitidos.
{
  files: ["cypress/e2e/apis/**/_support/**/*.js"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[raw=/\\\\u[0-9a-fA-F]{4}/]",
        message: "Escreva caracteres acentuados diretamente em UTF-8, sem escapes Unicode.",
      },
      {
        selector: "TemplateElement[value.raw=/\\\\u[0-9a-fA-F]{4}/]",
        message: "Escreva caracteres acentuados diretamente em UTF-8, sem escapes Unicode.",
      },
    ],
  },
},
```

Regras importantes para o setup:

- as travas **complementam** o `eslint-plugin-cypress` (que já barra `cy.wait` fixo e atribuição do
  retorno de comandos `cy`), não o substituem;
- elas cobrem apenas a parte **mecânica**; oráculo, cobertura, documentação viva, rastreabilidade
  título e assertion, comentários de fase com intenção, ausência de `return` desnecessário, asserts
  compostos por objeto nomeado, valores/mensagens nomeados e profundidade de aninhamento por fase
  continuam sendo verificados pelo `api-revisor.md`;
- **não** adicione uma trava dura de aninhamento (ex.: `max-nested-callbacks: 3`): testes legítimos
  encadeiam setup + autenticação + ação + verificação e ultrapassam três níveis de callback sem
  estarem "fazendo coisa demais". O limite é por **fase lógica** (Preparação → Ação → Validação) e é
  julgamento de revisão, não regra de máquina. Se quiser um guarda-corpo contra aninhamento extremo,
  use um limite folgado (5+), nunca 3;
- a trava de encoding deve rejeitar escapes como `\u00e7` em textos de negócio, mas preservar usos
  técnicos legítimos, como intervalos Unicode em expressões regulares;
- o wrapper central de requests deve usar `cy.request` com `log: false` e mascarar dados sensíveis
  antes de gravar no runner, `report.json`, `report.html` ou cURL;
- campos como `Authorization`, `Cookie`, `password`, `accessToken`, `refreshToken` e `token` nunca
  devem aparecer com valor real em artefatos de teste;
- se o projeto usa `.eslintrc*` legado em vez de flat config, traduza a intenção das regras sem
  migrar o formato sem autorização;
- não desative essas travas nem ignore caminhos novos só para deixar o lint verde; uma violação real
  indica anti-padrão a corrigir.

---

## Como descobrir o perfil do produto

Use `api-perfil.template.md` como checklist interno. O usuário não precisa citar esse
arquivo no prompt.

Procure no projeto atual:

- `cypress.env.json`, `.env`, variáveis usadas no CI e `cypress.config.js`;
- clientes HTTP existentes;
- helpers de login existentes;
- schemas existentes;
- specs antigas que mostram formato de sucesso/erro;
- documentação local, Swagger/OpenAPI, Postman/Insomnia se houver.

Se o usuário também informar a pasta do backend, use somente leitura para descobrir:

- formato de erro global;
- mensagens e exceptions;
- autenticação/autorização;
- status esperado para request sem token e token inválido/malformado;
- existência de usuário sem permissão, perfil somente leitura ou isolamento por tenant/cliente;
- paginação;
- padrões de vazamento da stack.

Se não conseguir descobrir algo com segurança, reporte como pergunta pendente. Não invente. Para
segurança, diferencie: sem token e token inválido são cobertura corporativa de endpoint protegido;
permissão insuficiente depende de massa/credencial sem permissão e deve virar lacuna documentada
quando essa massa não existir.

Após descobrir o perfil do produto (ou em paralelo), se o backend estiver disponível, execute ou
sugira executar o `api-mapeador.md` para gerar `.ai/agents/mapeamento/mapeamento-api.md`. Esse índice de
ponteiros acelera a fase de descoberta do `api-criador.md` em invocações futuras, sem precisar
recaçar a estrutura do backend a cada teste. O mapeador é read-only no backend e pode ser
re-rodado isoladamente quando o backend mudar.

---

## Procedimento

### 1. Auditoria inicial

Entregue uma tabela:

| Item            | Status                     | Ação proposta           |
| --------------- | -------------------------- | ----------------------- |
| Dependências    | OK/faltando                | instalar X              |
| `config.js`     | OK/faltando/fora do padrão | criar/ajustar/não mexer |
| `auth.api.js`   | OK/faltando/fora do padrão | pedir autorização       |
| Schemas de erro | OK/faltando/fora do padrão | criar/ajustar           |
| Asserts base    | OK/faltando/fora do padrão | criar/ajustar           |
| Segurança       | OK/lacuna                  | status sem token/token inválido e usuário sem permissão |
| Ferramentas de relatório | OK/faltando/fora do padrão | se faltarem, pedir ao usuário inserir (passo manual); verificar wiring e scripts |

Pare no relatório se houver qualquer criação/refatoração sensível.

### 2. Plano de alterações

Liste exatamente:

- arquivos que serão criados;
- arquivos que serão alterados;
- arquivos existentes que serão preservados;
- decisões pendentes;
- riscos.

Peça OK antes de:

- instalar pacotes;
- criar ou refatorar `auth.api.js`;
- refatorar arquivo existente fora do padrão;
- alterar schemas de erro existentes.

Pare e peça ação manual ao usuário quando:

- a pasta `tools/` não contiver `relatorio-cobertura` e/ou `relatorio-execucao`. Essas ferramentas
  são levadas por copy-paste de um projeto que já as tenha (ver `tools/README.md`); o setup não as
  cria. Liste o que falta e aguarde o usuário inserir antes de prosseguir.

### 3. Implementação

Com OK do usuário:

- instale somente dependências faltantes (inclua `acorn` explicitamente se o projeto for usar o
  `tools/relatorio-cobertura`, mesmo que hoje ele resolva via eslint);
- se a pasta `tools/` não contiver `relatorio-cobertura` e/ou `relatorio-execucao`, **pare e peça ao
  usuário para inseri-las manualmente** — é um passo manual de copy-paste; o setup **não gera** essas
  ferramentas (não há fonte de onde copiá-las num projeto novo). Aponte o `tools/README.md` como guia
  e só continue depois que as pastas existirem;
- garanta os scripts `cy:log` (`--env LOG_REPORT=true`) e `relatorio-cobertura`
  (`node tools/relatorio-cobertura`) quando ausentes;
- verifique o wiring do `relatorio-execucao` no `cypress.config.js`: imports dos geradores e as tasks
  `apiLog:*` + `after:spec` sob `LOG_REPORT`, com o `requestLogger.api.js` emitindo essas tasks;
- crie os scripts `lint` e `lint:fix` somente se estiverem ausentes;
- crie uma configuração ESLint compatível com a versão instalada somente se ela estiver ausente;
- preserve regras ESLint existentes e reporte conflitos antes de substituí-las;
- crie somente arquivos ausentes aprovados;
- refatore somente arquivos aprovados;
- preserve código existente quando ele já atende ao objetivo;
- ao criar arquivo comum, inclua comentários curtos de responsabilidade e decisões importantes;
- rode `prettier` nos arquivos alterados;
- rode `node --check` nos `.js` alterados;
- rode `npm run lint`;
- corrija violações reais; não desative regras nem ignore caminhos novos apenas para deixar o lint
  verde;
- use `npm run lint:fix` somente depois de revisar o escopo das correções automáticas.

---

## Critérios de pronto

O projeto está pronto para o `api-criador.md` quando existir:

- dependências mínimas (`cypress`, `ajv`, `@faker-js/faker`, `prettier`, `eslint`,
  `eslint-plugin-cypress` e `acorn`), além dos pacotes exigidos pela configuração adotada, como
  `@eslint/js` e `globals`;
- configuração ESLint compatível com a estrutura do projeto;
- travas de lint do padrão configuradas (ver "Travas de lint do padrão");
- scripts `lint` e `lint:fix`;
- `tools/relatorio-cobertura/` presente e `acorn` declarado no `package.json`;
- `tools/relatorio-execucao/` presente, com wiring no `cypress.config.js` (tasks `apiLog:*` +
  `after:spec` sob `LOG_REPORT`) e script `cy:log`;
- guia de portabilidade das ferramentas em `tools/README.md`;
- `support/api/client.js`;
- `support/api/schema.js`;
- `support/api/asserts.base.js`;
- `support/assertions/error.assertions.js`;
- `support/api/config.js`;
- `support/api/auth.api.js` ou decisão explícita de autenticação não aplicável;
- schemas de erro do produto;
- `npm run lint` executando sem erros no escopo mantido;
- comando de execução documentado.

---

## Saída final

Ao terminar, entregue:

- o que já existia e foi preservado;
- o que foi criado;
- o que foi alterado;
- o que ficou pendente por depender do usuário;
- comando sugerido para rodar uma suíte criada pelo `api-criador.md`.
