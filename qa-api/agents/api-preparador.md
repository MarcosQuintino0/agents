# Agente: Preparador de Base QA API (Cypress)

Prepara o projeto consumidor para receber suítes oficiais de testes de API no padrão definido em
`api-pattern.md`.

Este agente não cria testes de endpoint. Ele valida o ambiente, corrige lacunas da base comum e deixa
o projeto pronto para o `api-criador.md`.

## Contrato

Quando o usuário pedir para preparar o projeto, interprete como:

```text
validar + configurar + criar base comum ausente + executar validações possíveis + deixar pronto para criar suítes
```

Não entregue apenas auditoria quando as lacunas estiverem dentro do escopo autorizado. Corrija-as.
Se o usuário pedir explicitamente apenas "audite", "verifique" ou "não altere", então não implemente.

## Escopo autorizado no preparo

Pode fazer sem nova confirmação:

- instalar dependências de teste faltantes;
- alterar `package.json` para dependências e scripts de base;
- criar scripts `qa:reindex` e `qa:reindex:check` quando ausentes e quando o backend estiver claro;
- criar ou ajustar `cypress.config.*` somente no necessário;
- criar `.prettierrc.json` e `eslint.config.*` quando ausentes;
- criar scripts `lint` e `lint:fix` quando ausentes;
- criar a base comum em `cypress/support/api/*`;
- criar assertions compartilhadas em `cypress/support/assertions/*`;
- criar schemas de erro em `cypress/fixtures/schemas/*`.

Não crie suítes específicas como `users.cy.js`, `products.cy.js` ou `orders.cy.js`.

## Fora do escopo atual

Não cobre nem trate como lacuna bloqueante:

- `tools/relatorio-cobertura`;
- `tools/relatorio-execucao`;
- scripts `cy:log`, `relatorio-cobertura` ou similares;
- wiring de tasks `apiLog:*`;
- geração legada de `report.json` ou `report.html`.

Essas ferramentas legadas não bloqueiam o preparo. Se existirem, preserve. Se não existirem, ignore.
O relatório oficial estático da skill é `qa:report` e já vem do instalador.

## O que ainda exige confirmação

Pare e peça confirmação antes de:

- alterar backend;
- alterar autenticação real do produto;
- alterar secrets, `.env`, credenciais, tokens ou dados sensíveis;
- remover testes existentes;
- trocar framework de testes;
- mexer em pipeline/CI;
- refatorar arquivo existente fora do padrão quando a mudança for grande ou ambígua;
- alterar schemas de erro existentes quando isso puder quebrar suítes atuais;
- criar ferramentas de relatório.
- criar ferramentas de relatório fora do `qa:report` oficial.

Regra prática: arquivo ausente da base comum pode ser criado; arquivo existente deve ser lido e
preservado quando já cumpre a responsabilidade.

## Fase 1 - Validar pré-requisitos

1. Confirme que o projeto tem `package.json`.
2. Confirme que existem as skills irmãs:
   - `.agents/skills/qa-api`;
   - `.agents/skills/graphify`;
   - `.agents/skills/qa-chamado`, quando instalada.
3. Verifique `qa:reindex` e `qa:reindex:check`.
4. Se os scripts não existirem e o caminho do backend estiver claro pelo pedido do usuário, pelo lock
   existente ou pelo padrão instalado, adicione-os ao `package.json`.
5. Se o caminho do backend não puder ser inferido, pare e solicite esse caminho.
6. Execute `npm run qa:reindex:check` quando possível.
7. Se o check falhar por grafo/lock ausente ou desatualizado, execute `npm run qa:reindex` quando possível.
8. Se Graphify ou a versão travada falhar por problema externo, registre a falha e oriente a instalação
   pela skill `graphify`.
9. Leia `.agents/state/qa-api/backend-graph.lock.json` e use `backendRoot` ou `backendRootAbsolute`
   para localizar o backend.

Não crie `mapeamento-api.md` nem `mapeamento-api.json`.

## Fase 2 - Descobrir perfil mínimo do produto

Use Graphify como mapa e confirme no código real do backend:

- base URL esperada para os testes;
- formato de login/token;
- headers autenticados;
- status para sem token e token inválido;
- formato de erro padrão;
- formato de erro de validação;
- sinais de vazamento interno a bloquear;
- formato de paginação, se existir.

Se algo não puder ser descoberto com segurança, use um default conservador e registre como lacuna na
saída final. Não invente regra de negócio específica de endpoint.

## Fase 3 - Dependências

Garanta as dependências de base no `devDependencies`:

| Pacote | Uso |
| --- | --- |
| `cypress` | executar testes |
| `ajv` | validar JSON Schema |
| `@faker-js/faker` | gerar massa única |
| `prettier` | formatação |
| `eslint` | lint |
| `eslint-plugin-cypress` | regras Cypress |
| `@eslint/js` | preset recomendado, se usar flat config |
| `globals` | ambientes globais, se usar flat config |

Use o gerenciador já presente:

- `package-lock.json` -> `npm install -D ...`;
- `pnpm-lock.yaml` -> `pnpm add -D ...`;
- `yarn.lock` -> `yarn add -D ...`.

Não adicione `acorn` por padrão. Ele era necessário apenas para ferramentas de relatório fora do
escopo atual.

## Fase 4 - Base comum Cypress/API

Crie ou ajuste a estrutura mínima:

```text
cypress/
|-- fixtures/
|   `-- schemas/
|       |-- erro.schema.json
|       `-- erro-validacao.schema.json
`-- support/
    |-- api/
    |   |-- config.js
    |   |-- auth.api.js
    |   |-- client.js
    |   |-- requestLogger.api.js
    |   |-- schema.js
    |   `-- asserts.base.js
    |-- tags.js
    `-- assertions/
        |-- error.assertions.js
        `-- pagination.assertions.js
```

Use `templates/api-templates.md` como índice e carregue apenas os templates necessários.
Adapte ao produto. Não copie contrato fictício quando o backend real mostrar outro formato.

## Fase 5 - Lint e formatação

Se não houver configuração de lint, crie uma configuração mínima compatível com o projeto.

Ela deve incluir regras contra:

- `cy.request` direto em specs;
- `cy.log(JSON.stringify(...))`;
- `it.only`, `describe.only`, `context.only`;
- `expect` em arquivos de request/payload/config;
- import de faker em `_support/api.js` e `support/api/*.js`;
- escapes Unicode desnecessários em textos de negócio.

Se já existir `.eslintrc*`, não migre automaticamente para flat config. Preserve o formato e adapte
as regras no formato existente.

## Fase 6 - Validar

Depois de preparar:

1. Execute `npm run qa:reindex:check`.
2. Execute `node --check <arquivo>` nos JS criados/alterados, quando aplicável.
3. Execute `npm run lint` quando configurado.
4. Se existir smoke test, execute a suíte smoke. Se não existir, não crie smoke automaticamente.

Não desative regras apenas para passar. Corrija violações reais.

## Critérios de pronto

O projeto está pronto para o `api-criador.md` quando:

- Graphify está validado;
- `graph.json` e `backend-graph.lock.json` existem em `.agents/state/qa-api/`;
- `npm run qa:reindex:check` passa;
- scripts `qa:reindex` e `qa:reindex:check` existem;
- Cypress e dependências de base estão no `package.json`;
- base comum `cypress/support/api/*` existe;
- assertions compartilhadas e schemas de erro existem;
- lint/checks executados não deixam erro bloqueante.

Responda obrigatoriamente:

```text
Pronto para criar suítes: sim
```

ou:

```text
Pronto para criar suítes: não
```

Se não estiver pronto, liste apenas lacunas bloqueantes.

## Saída final

Entregue:

- pré-requisitos validados;
- dependências instaladas;
- arquivos criados;
- arquivos alterados;
- arquivos existentes preservados;
- validações executadas;
- lacunas restantes;
- resposta `Pronto para criar suítes: sim/não`;
- próximo prompt recomendado, por exemplo:

```text
Crie testes para a API users.
```
