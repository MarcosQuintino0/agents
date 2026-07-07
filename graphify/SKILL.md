---
name: graphify
description: Valida e executa a versão travada do Graphify usada pelas skills de QA. Use quando precisar instalar, verificar versão, diagnosticar ou executar Graphify para gerar grafo estrutural de backend e artefatos usados por qa-api.
---

# Skill: Graphify

Use esta skill para configurar, validar ou executar Graphify no ecossistema de QA.

## Versão travada

Leia `manifest.json` antes de orientar instalação ou execução.

```text
graphifyy==0.9.8
```

O pacote Python é `graphifyy`; o comando exposto no terminal é `graphify`.

## Instalação recomendada

No projeto consumidor, prefira:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando copia as skills irmãs e instala/valida a versão travada do Graphify CLI.

## Uso padronizado

Use `tools/graphify-runner.mjs` para validar versão e executar Graphify:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
node .agents/skills/graphify/tools/graphify-runner.mjs --backend ../backend
```

## Relação com qa-api

Graphify deve ficar como skill irmã:

```text
.agents/skills/
- qa-api/
- qa-chamado/
- graphify/
```

Não copie Graphify para dentro de `qa-api`.

O `qa:reindex` da `qa-api` organiza `graph.json`, `graph.html`, `GRAPH_REPORT.md` quando existir, e `backend-graph.lock.json` em `.agents/state/qa-api/`.

## Regras

- Graphify é mapa estrutural, não contrato final.
- Não aceite versão diferente da travada sem atualizar `manifest.json`.
- Não exponha tokens, cookies, senhas ou credenciais em logs.
- Comandos oficiais por plataforma de IA (`graphify codex install`, `graphify cursor install`, etc.) são opcionais para `qa-api`; eles não substituem `qa:reindex`.
