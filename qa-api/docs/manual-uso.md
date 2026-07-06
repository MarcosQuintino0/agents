# Manual de Uso: Skill QA API

Esta skill organiza agentes de testes de API Cypress em um fluxo único, reutilizável e dependente de Graphify.

## Fluxo oficial

No projeto consumidor:

1. copie/instale a skill em:

```text
.agents/skills/qa-api/
```

2. garanta que Graphify CLI esteja instalado:

```bash
graphify --version
```

3. configure no `package.json`:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

4. troque `../backend` pelo caminho relativo correto do backend;

5. rode:

```bash
npm run qa:reindex
```

6. peça para a IA:

```text
Crie testes para a API <nome-da-api>.
```

O usuário não cria `.yml`. O `qa:reindex` cria automaticamente `.qa-api/backend-graph.lock.json`.

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
| `agents/api-analisador.md` | Analisar `report.json` e preparar rascunhos de chamados quando solicitados. |

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

A skill não instala Graphify automaticamente.

Se `graphify --version` falhar, use a orientação de `docs/graphify.md` e instale explicitamente conforme o ambiente da equipe:

```bash
uv tool install graphifyy
```

ou:

```bash
pipx install graphifyy
```

ou:

```bash
pip install graphifyy
```

O pacote Python é `graphifyy`, mas o comando exposto no terminal é `graphify`.

## Graphify Skill

Graphify CLI é obrigatório. Graphify Skill é opcional.

Se Graphify for instalado como skill de projeto, deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

## Regras de segurança

- Não invente contrato.
- Não crie teste sem oráculo confiável.
- Não instale dependências sem autorização.
- Não altere `package.json` sem autorização.
- Não altere autenticação, schemas compartilhados ou configurações sensíveis sem autorização.
- Não exponha tokens, cookies, senhas ou Authorization em logs, reports, cURL ou chamados.
- Não mascare defeito para fazer teste passar.
- Não crie `mapeamento-api.md` ou `mapeamento-api.json` no novo fluxo.
