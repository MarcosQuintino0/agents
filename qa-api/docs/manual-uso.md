# Manual de Uso: Skill QA API

Esta skill organiza agentes de testes de API Cypress em um fluxo reutilizÃ¡vel dependente de Graphify.

## Fluxo oficial

No projeto consumidor:

1. Rode o instalador:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto do backend.

Esse comando copia `qa-api`, `qa-chamado`, `qa-debug-report` e `graphify`, instala/valida `graphifyy==0.9.8` e configura
`qa:reindex`, `qa:reindex:check`, `qa:report`, `qa:debug`, `qa:debug:open` e `qa:debug:generate` quando existir `package.json`.

2. PeÃ§a para a IA preparar a base comum:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessÃ¡rios quando possÃ­vel, corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suÃ­tes. NÃ£o crie suÃ­tes de APIs ainda.
```

3. Depois peÃ§a para criar uma suÃ­te:

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenÃ¡rio para todas as rotas da API. NÃ£o deixe cenÃ¡rio aplicÃ¡vel sem teste ou justificativa.
```

O usuÃ¡rio nÃ£o cria `.yml`. No fluxo normal, a IA deve executar `qa:reindex` e `qa:reindex:check`
quando preparar o projeto, e `qa:report` quando finalizar criaÃ§Ã£o ou revisÃ£o de suÃ­te. AÃ§Ã£o manual sÃ³
entra quando a IA nÃ£o puder executar comandos, quando faltar caminho do backend ou quando o ambiente
externo falhar.

## Fluxo manual

Use somente quando o ambiente nÃ£o puder usar o instalador ou quando a IA pedir uma aÃ§Ã£o manual.

Estrutura esperada:

```text
.agents/skills/
- qa-api/
- qa-chamado/
- qa-debug-report/
- graphify/
```

Instale a versÃ£o travada do Graphify:

```bash
uv tool install graphifyy==0.9.8
```

Alternativas:

```bash
pipx install graphifyy==0.9.8
pip install graphifyy==0.9.8
```

Configure scripts no `package.json`:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check",
    "qa:report": "node .agents/skills/qa-api/tools/qa-report.mjs",
    "qa:debug": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs run",
    "qa:debug:open": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs open",
    "qa:debug:generate": "node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs generate"
  }
}
```

## Artefatos do reindex

ObrigatÃ³rios para criaÃ§Ã£o/refatoraÃ§Ã£o:

- `.agents/state/qa-api/graphify-out/graph.json`
- `.agents/state/qa-api/backend-graph.lock.json`

Complementares:

- `.agents/state/qa-api/graphify-out/GRAPH_REPORT.md`, quando disponÃ­vel
- `.agents/state/qa-api/graphify-out/graph.html`, mapa visual humano

`graph.html` nÃ£o bloqueia testes. `graph.json` continua sendo o mapa usado pela IA.

## RelatÃ³rio oficial dos testes

Depois de criar ou revisar uma suÃ­te, a IA deve gerar o relatÃ³rio oficial quando possÃ­vel:

```bash
npm run qa:report -- --api <nome-da-api>
```

TambÃ©m Ã© possÃ­vel apontar uma pasta especÃ­fica:

```bash
npm run qa:report -- --dir cypress/e2e/apis/<nome-da-api>
```

SaÃ­das:

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

`coverage.html` Ã© a visÃ£o humana. `coverage.json` Ã© a fonte estruturada para revisÃ£o posterior pela
IA. O relatÃ³rio nÃ£o executa Cypress; ele audita JSDoc, tags `CatalogoTags`, vÃ­nculos `@regra:<id>` e
declaraÃ§Ãµes `@cobertura` nos specs gerados.

O `coverage.json` tambÃ©m inclui `coverageByEndpoint`, `catalogAssessment`, `logicalCases` para
testes data-driven e `aiNextActions`. Esses campos ajudam a IA a continuar o trabalho depois que o QA
der mais contexto.

## RelatÃ³rio manual de debug

Quando o QA quiser investigar uma falha real de execuÃ§Ã£o Cypress, use a skill irmÃ£ `qa-debug-report`:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

SaÃ­das padrÃ£o:

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

`qa:debug` executa Cypress com instrumentaÃ§Ã£o temporÃ¡ria do FailLens e gera evidÃªncias para debug,
reproduÃ§Ã£o e chamados. Ele nÃ£o deve rodar automaticamente ao criar ou revisar suÃ­tes. Use somente
quando o usuÃ¡rio pedir execuÃ§Ã£o/debug ou autorizar claramente.

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

Os status de `@cobertura` devem ser simples:

- `aplicavel`: precisa de teste.
- `nao-confirmado`: pode fazer sentido, mas falta contexto.
- `incorporado`: jÃ¡ foi validado dentro de outro teste.
- `nao-aplicavel`: o conceito claramente nÃ£o existe nesta API.

Prefira explicaÃ§Ãµes curtas para QA, como:

```text
@cobertura @valor-limite nao-confirmado - o backend nÃ£o informa tamanho mÃ¡ximo para name/email
```

## Agentes internos

| Arquivo | Uso |
| --- | --- |
| `agents/api-preparador.md` | Preparar a base compartilhada Cypress/API. |
| `agents/backend-index.md` | Validar Graphify, lock e reindex. |
| `agents/api-criador.md` | Criar ou refatorar a suÃ­te completa de uma API. |
| `agents/api-revisor.md` | Revisar uma suÃ­te existente e identificar lacunas. |
| `agents/api-analisador.md` | Analisar `report.json`/FailLens e entregar problemas numerados. |

## Templates sob demanda

`templates/api-templates.md` Ã© o Ã­ndice. Use-o para escolher arquivos certos e evitar carregar
exemplos irrelevantes.

## Regra do Graphify

Graphify Ã© obrigatÃ³rio no fluxo oficial.

Use `graph.json` como mapa estrutural para localizar controller, router, DTO, service, repository,
handler, validaÃ§Ãµes, exceptions e middlewares. Use o lock para descobrir o backend root usado no
reindex.

Graphify nÃ£o Ã© contrato final. Depois de encontrar arquivos candidatos, abra o cÃ³digo real do
backend antes de definir payload, campos, obrigatoriedade, tipos, nulabilidade, status, mensagens,
regras de negÃ³cio, persistÃªncia, seguranÃ§a e formato de erro.

## ConfiguraÃ§Ã£o por plataforma de IA

O Graphify oficial possui comandos opcionais por plataforma, como Codex, Cursor, Claude e Agent
Skills. Eles criam arquivos de suporte para consultas gerais ao grafo, mas nÃ£o sÃ£o obrigatÃ³rios para
criar testes com `qa-api` e nÃ£o substituem `qa:reindex`.

Consulte tambÃ©m:

```text
.agents/skills/graphify/README.md
```

## Regras de seguranÃ§a

- NÃ£o invente contrato.
- NÃ£o crie teste sem orÃ¡culo confiÃ¡vel.
- Durante o preparo, pode instalar dependÃªncias de teste, alterar `package.json` e criar a base comum.
- Fora do preparo, nÃ£o instale dependÃªncias nem altere `package.json` sem autorizaÃ§Ã£o.
- NÃ£o execute `qa:debug` automaticamente; ele Ã© manual para falhas reais de execuÃ§Ã£o.
- NÃ£o altere autenticaÃ§Ã£o, schemas compartilhados ou configuraÃ§Ãµes sensÃ­veis sem autorizaÃ§Ã£o.
- NÃ£o crie ferramentas legadas como `cy:log`, `relatorio-cobertura` ou `relatorio-execucao`; use
  `qa:report` para o relatÃ³rio oficial da skill.
- Nao envie logs, reports, cURL ou chamados com tokens, cookies, senhas ou Authorization para fora do ambiente controlado.
- NÃ£o mascare defeito para fazer teste passar.
- NÃ£o crie `mapeamento-api.md` ou `mapeamento-api.json`.
