# Agente: Backend Index com Graphify

Usa Graphify como mapa estrutural obrigatório do backend para orientar criação, revisão e análise de testes de API Cypress.

Graphify é um GPS, não o contrato final. Ele aponta onde procurar; o contrato real continua vindo do código do backend, OpenAPI/documentação aprovada, schemas, persistência consultada, regra confirmada e invariantes de segurança.

## Objetivo

Garantir que o projeto consumidor tenha um grafo determinístico do backend antes de criar ou refatorar testes oficiais de API.

O fluxo oficial usa diretamente:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando existir
- `.qa-api/backend-graph.lock.json`

Não crie `mapeamento-api.md`.
Não crie `mapeamento-api.json`.

## Como o backend é configurado

Não existe arquivo `.yml` obrigatório.

O caminho do backend é informado no script `qa:reindex` do `package.json` do projeto consumidor:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

O usuário deve trocar `../backend` pelo caminho relativo correto do backend. Não invente esse caminho.

O script gera automaticamente:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando existir
- `.qa-api/backend-graph.lock.json`

A skill usa o lock para descobrir o backend root que foi usado no reindex. O lock deve conter `backendRoot` ou `backendRootAbsolute`; se nenhum existir, trate o lock como inválido e peça `npm run qa:reindex`.

## Validação obrigatória

Antes de criar ou refatorar testes de API:

1. verifique se `graphify-out/graph.json` existe;
2. verifique se `.qa-api/backend-graph.lock.json` existe;
3. leia o lock para descobrir o backend root;
4. consulte `graphify-out/GRAPH_REPORT.md`, se existir;
5. quando possível, valide se o grafo parece atualizado;
6. se o grafo ou lock estiver ausente/desatualizado, pare e peça `npm run qa:reindex`.

Mensagem de parada:

```text
Não posso criar os testes ainda porque o grafo do backend não foi gerado.

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

O comando determinístico da skill é:

```bash
node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend
```

Package.json recomendado:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

O comando deve:

- rodar Graphify no backend informado por `--backend`;
- copiar o grafo para `graphify-out/graph.json` no projeto consumidor;
- copiar `graphify-out/GRAPH_REPORT.md`, quando existir;
- gerar ou atualizar `.qa-api/backend-graph.lock.json`.

Durante a criação/revisão de testes, a skill não instala Graphify e não altera `package.json`
sem autorização explícita. A instalação recomendada acontece antes, no setup do projeto
consumidor, com:

```bash
npx @marcosquintino/qa-skills install
```

## Graphify CLI e Graphify Skill

Graphify CLI é obrigatório.

Graphify Skill também é obrigatória neste ecossistema, porque contém `manifest.json` com a versão travada. Graphify deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

## Quando orientar instalação

Se `node .agents/skills/graphify/tools/graphify-runner.mjs --check` falhar, registre a pendência e oriente o usuário/equipe a instalar explicitamente a versão travada.

Texto recomendado:

```text
Graphify não encontrado.

O fluxo oficial da skill QA API exige Graphify para gerar o grafo do backend.

Instale uma das opções abaixo, conforme o ambiente da equipe:

uv tool install graphifyy==0.9.8

ou:

pipx install graphifyy==0.9.8

ou, se a equipe optar por pip:

pip install graphifyy==0.9.8

Depois valide:

node .agents/skills/graphify/tools/graphify-runner.mjs --check

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
