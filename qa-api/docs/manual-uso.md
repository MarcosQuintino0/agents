# Manual de Uso: Skill QA API

Esta skill organiza agentes de testes de API Cypress em um fluxo único, reutilizável e dependente de Graphify.

## Fluxo oficial

No projeto consumidor:

1. rode o instalador oficial:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto do backend.

Esse comando copia `qa-api`, `qa-chamado` e `graphify`, instala/valida `graphifyy==0.9.8` e
configura `qa:reindex` e `qa:reindex:check` quando existir `package.json`.

2. confirme a estrutura:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

3. rode:

```bash
npm run qa:reindex
```

4. peça para a IA:

```text
Crie testes para a API <nome-da-api>.
```

O usuário não cria `.yml`. O `qa:reindex` cria automaticamente `.qa-api/backend-graph.lock.json`.

### Fluxo manual

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

Valide:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
```

Configure no `package.json`:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

## O que o reindex deve gerar

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando disponível
- `.qa-api/backend-graph.lock.json`

Se algum desses arquivos obrigatórios estiver ausente ou desatualizado, a skill deve parar e pedir `npm run qa:reindex`.

## Prompts de uso

```text
Prepare o projeto para testes de API.
Crie testes para a API empresa.
Refatore os testes da API empresa.
Revise os testes da API empresa.
Analise o report da API empresa.
```

## Agentes internos

| Arquivo | Uso |
| --- | --- |
| `agents/api-preparador.md` | Auditar e preparar a base compartilhada Cypress. |
| `agents/backend-index.md` | Validar o uso obrigatório de Graphify e orientar o reindex. |
| `agents/api-criador.md` | Criar ou refatorar a suíte completa de uma API. |
| `agents/api-revisor.md` | Revisar uma suíte existente e identificar lacunas. |
| `agents/api-analisador.md` | Analisar `report.json` e entregar problemas numerados para possível uso pela skill `qa-chamado`. |

## Templates sob demanda

`templates/api-templates.md` e apenas o indice dos templates tecnicos. Use-o para escolher os
arquivos certos e evitar carregar exemplos que nao pertencem ao cenario atual.

| Cenario | Template |
| --- | --- |
| Camada comum, cliente HTTP, log mascarado e config base | `templates/cypress-base.md` |
| Login, token, sem autenticacao, permissao e seguranca | `templates/autenticacao.md` |
| AJV e schemas de resposta/erro | `templates/schemas.md` |
| Asserts genericos e asserts do recurso | `templates/asserts.md` |
| Contrato de erro, vazamento interno e mensagens | `templates/erros.md` |
| Payloads, massa de dados, hooks e cleanup | `templates/fixtures.md` |
| Cliente do recurso, CRUD, persistencia e listagem | `templates/crud.md` |
| Obrigatoriedade, limites, tipos e validacoes data-driven | `templates/validacoes.md` |

## Regra do Graphify

Graphify é obrigatório no fluxo oficial.

Use `graphify-out/graph.json` como mapa estrutural para localizar controller, router, DTO, service, repository, handler, validações, exceptions e middlewares.

Use `.qa-api/backend-graph.lock.json` para descobrir o backend root usado no reindex.

Graphify não é contrato final. Depois de encontrar os arquivos candidatos, sempre abra o código real do backend antes de definir payload, campos, obrigatoriedade, tipos, nulabilidade, status, mensagens, regras de negócio, persistência, segurança e formato de erro.

Não faça descoberta manual como substituto quando o grafo estiver ausente. Nesse caso, pare e peça:

```bash
npm run qa:reindex
```

## Instalação do Graphify

No fluxo recomendado, o instalador npm instala ou valida Graphify:

```bash
npx @marcosquintino/qa-skills install
```

Se a instalação for manual ou se a validação da skill `graphify` falhar, instale explicitamente a
versão travada:

```bash
uv tool install graphifyy==0.9.8
```

ou:

```bash
pipx install graphifyy==0.9.8
```

ou:

```bash
pip install graphifyy==0.9.8
```

O pacote Python é `graphifyy`, mas o comando exposto no terminal é `graphify`.

## Graphify Skill

Graphify CLI é obrigatório. Graphify Skill também é obrigatória porque guarda a versão travada.

Graphify deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

O Graphify oficial também possui comandos opcionais de configuração por plataforma de IA, como Codex, Cursor, Claude e Agent Skills. Esses comandos não são obrigatórios para criar testes com `qa-api`; eles servem para fazer a IA consultar o grafo de forma mais automática em perguntas gerais sobre o projeto.

Para saber mais sobre esses tipos de configuração, consulte o README da skill Graphify deste projeto:

```text
.agents/skills/graphify/README.md
```

## Regras de segurança

- Não invente contrato.
- Não crie teste sem oráculo confiável.
- Não instale dependências sem autorização.
- Não altere `package.json` sem autorização.
- Não altere autenticação, schemas compartilhados ou configurações sensíveis sem autorização.
- Não exponha tokens, cookies, senhas ou Authorization em logs, reports, cURL ou chamados.
- Não mascare defeito para fazer teste passar.
- Não crie `mapeamento-api.md` ou `mapeamento-api.json` no novo fluxo.
