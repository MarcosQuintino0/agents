# Graphify na Skill QA API

Graphify é obrigatório no fluxo oficial e deve existir como skill irmã da `qa-api`.

Estrutura esperada:

```text
.agents/skills/
- qa-api/
- qa-chamado/
- qa-debug-report/
- graphify/
```

A versão esperada fica travada em `graphify/manifest.json`.

## Configuração mínima

Fluxo recomendado:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando copia as skills, instala/valida `graphifyy==0.9.8` e configura scripts quando existir
`package.json`.

## Artefatos

Obrigatórios:

- `.agents/state/qa-api/graphify-out/graph.json`
- `.agents/state/qa-api/backend-graph.lock.json`

Complementares:

- `.agents/state/qa-api/graphify-out/GRAPH_REPORT.md`, quando existir
- `.agents/state/qa-api/graphify-out/graph.html`, visual humano

`graph.html` é o mapa visual dark e interativo para humanos. Ele não bloqueia criação de testes.
`graph.json` continua sendo o artefato principal para a IA navegar pelo backend.

## Check

```bash
npm run qa:reindex:check
```

O check valida se o grafo e o lock existem e se o commit do backend ainda bate, quando possível. Ele
não roda Graphify e não modifica arquivos.

## Quando reindexar

Se grafo ou lock estiverem ausentes/desatualizados, o agente deve executar:

```bash
npm run qa:reindex
```

Se o agente não puder executar comandos, deve pedir essa ação manual ao usuário.

## Regra importante

Graphify é mapa estrutural, não contrato final. O contrato final vem do código real do backend.

O Graphify oficial também oferece comandos opcionais por plataforma de IA, como:

```bash
graphify codex install
graphify cursor install
graphify claude install
graphify agents install
```

Esses comandos não substituem `qa:reindex`.
