# graphify

`graphify` valida e executa a versao travada do Graphify usada pelo ecossistema.

## Objetivo

Gerar um mapa estrutural do backend para ajudar a IA a localizar controllers, services, validators, modelos e relacoes. O mapa acelera a descoberta, mas nao substitui leitura do codigo real.

## Versao travada

```text
graphifyy==0.9.8
```

O pacote Python e `graphifyy`; o comando no terminal e `graphify`.

## Quando usar

- Ao instalar as skills.
- Ao validar se Graphify esta na versao correta.
- Ao rodar `qa:reindex`.
- Ao diagnosticar lock ou grafo ausente/desatualizado.

## Comandos

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
node .agents/skills/graphify/tools/graphify-runner.mjs --backend ../backend
npm run qa:reindex
npm run qa:reindex:check
```

## Artefatos gerados via qa-api

```text
.agents/state/qa-api/graphify-out/graph.json
.agents/state/qa-api/graphify-out/graph.html
.agents/state/qa-api/graphify-out/GRAPH_REPORT.md
.agents/state/qa-api/backend-graph.lock.json
```

`graph.json` e `backend-graph.lock.json` sao obrigatorios para criacao/refatoracao de suites. `graph.html` e visual humano e nao bloqueia.

## Regra principal

Graphify e mapa estrutural. O contrato final vem do backend real, OpenAPI aprovado ou outra fonte autorizada.
