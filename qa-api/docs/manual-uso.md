# Manual de Uso: Skill QA API

Esta skill organiza agentes de testes de API Cypress em um fluxo reutilizável dependente de Graphify.

## Fluxo oficial

No projeto consumidor:

1. Rode o instalador:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto do backend.

Esse comando copia `qa-api`, `qa-chamado`, `qa-debug-report` e `graphify`, instala/valida `graphifyy==0.9.8` e configura
`qa:reindex`, `qa:reindex:check`, `qa:report`, `qa:debug`, `qa:debug:open` e `qa:debug:generate` quando existir `package.json`.

2. Peça para a IA preparar a base comum:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessários quando possível, corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suítes. Não crie suítes de APIs ainda.
```

3. Depois peça para criar uma suíte:

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenário para todas as rotas da API. Não deixe cenário aplicável sem teste ou justificativa.
```

O usuário não cria `.yml`. No fluxo normal, a IA deve executar `qa:reindex` e `qa:reindex:check`
quando preparar o projeto, e `qa:report` quando finalizar criação ou revisão de suíte. Ação manual só
entra quando a IA não puder executar comandos, quando faltar caminho do backend ou quando o ambiente
externo falhar.

## Fluxo manual

Use somente quando o ambiente não puder usar o instalador ou quando a IA pedir uma ação manual.

Estrutura esperada:

```text
.agents/skills/
- qa-api/
- qa-chamado/
- qa-debug-report/
- graphify/
```

Instale a versão travada do Graphify:

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

Obrigatórios para criação/refatoração:

- `.agents/state/qa-api/graphify-out/graph.json`
- `.agents/state/qa-api/backend-graph.lock.json`

Complementares:

- `.agents/state/qa-api/graphify-out/GRAPH_REPORT.md`, quando disponível
- `.agents/state/qa-api/graphify-out/graph.html`, mapa visual humano

`graph.html` não bloqueia testes. `graph.json` continua sendo o mapa usado pela IA.

## Relatório oficial dos testes

Depois de criar ou revisar uma suíte, a IA deve gerar o relatório oficial quando possível:

```bash
npm run qa:report -- --api <nome-da-api>
```

Também é possível apontar uma pasta específica:

```bash
npm run qa:report -- --dir cypress/e2e/apis/<nome-da-api>
```

Saídas:

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

`coverage.html` é a visão humana. `coverage.json` é a fonte estruturada para revisão posterior pela
IA. O relatório não executa Cypress; ele audita JSDoc, tags `CatalogoTags`, vínculos `@regra:<id>` e
declarações `@cobertura` nos specs gerados.

O `coverage.json` também inclui `coverageByEndpoint`, `catalogAssessment`, `logicalCases` para
testes data-driven e `aiNextActions`. Esses campos ajudam a IA a continuar o trabalho depois que o QA
der mais contexto.

## Relatório manual de debug

Quando o QA quiser investigar uma falha real de execução Cypress, use a skill irmã `qa-debug-report`:

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

`qa:debug` executa Cypress com instrumentação temporária do FailLens e gera evidências para debug,
reprodução e chamados. Ele não deve rodar automaticamente ao criar ou revisar suítes. Use somente
quando o usuário pedir execução/debug ou autorizar claramente.

Os status de `@cobertura` devem ser simples:

- `aplicavel`: precisa de teste.
- `nao-confirmado`: pode fazer sentido, mas falta contexto.
- `incorporado`: já foi validado dentro de outro teste.
- `nao-aplicavel`: o conceito claramente não existe nesta API.

Prefira explicações curtas para QA, como:

```text
@cobertura @valor-limite nao-confirmado - o backend não informa tamanho máximo para name/email
```

## Agentes internos

| Arquivo | Uso |
| --- | --- |
| `agents/api-preparador.md` | Preparar a base compartilhada Cypress/API. |
| `agents/backend-index.md` | Validar Graphify, lock e reindex. |
| `agents/api-criador.md` | Criar ou refatorar a suíte completa de uma API. |
| `agents/api-revisor.md` | Revisar uma suíte existente e identificar lacunas. |
| `agents/api-analisador.md` | Analisar `report.json`/FailLens e entregar problemas numerados. |

## Templates sob demanda

`templates/api-templates.md` é o índice. Use-o para escolher arquivos certos e evitar carregar
exemplos irrelevantes.

## Regra do Graphify

Graphify é obrigatório no fluxo oficial.

Use `graph.json` como mapa estrutural para localizar controller, router, DTO, service, repository,
handler, validações, exceptions e middlewares. Use o lock para descobrir o backend root usado no
reindex.

Graphify não é contrato final. Depois de encontrar arquivos candidatos, abra o código real do
backend antes de definir payload, campos, obrigatoriedade, tipos, nulabilidade, status, mensagens,
regras de negócio, persistência, segurança e formato de erro.

## Configuração por plataforma de IA

O Graphify oficial possui comandos opcionais por plataforma, como Codex, Cursor, Claude e Agent
Skills. Eles criam arquivos de suporte para consultas gerais ao grafo, mas não são obrigatórios para
criar testes com `qa-api` e não substituem `qa:reindex`.

Consulte também:

```text
.agents/skills/graphify/README.md
```

## Regras de segurança

- Não invente contrato.
- Não crie teste sem oráculo confiável.
- Durante o preparo, pode instalar dependências de teste, alterar `package.json` e criar a base comum.
- Fora do preparo, não instale dependências nem altere `package.json` sem autorização.
- Não execute `qa:debug` automaticamente; ele é manual para falhas reais de execução.
- Não altere autenticação, schemas compartilhados ou configurações sensíveis sem autorização.
- Não crie ferramentas legadas como `cy:log`, `relatorio-cobertura` ou `relatorio-execucao`; use
  `qa:report` para o relatório oficial da skill.
- Não exponha tokens, cookies, senhas ou Authorization em logs, reports, cURL ou chamados.
- Não mascare defeito para fazer teste passar.
- Não crie `mapeamento-api.md` ou `mapeamento-api.json`.
