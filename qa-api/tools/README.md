# Tools da Skill QA API

Esta pasta contém o script determinístico de reindex:

```text
qa-api/tools/qa-reindex.mjs
```

Ele não usa `.yml` e não depende de pacotes npm externos.

## Uso direto

```bash
node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend
node .agents/skills/qa-api/tools/qa-reindex.mjs --check
node .agents/skills/qa-api/tools/qa-reindex.mjs --help
```

## Package.json recomendado

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

Troque `../backend` pelo caminho relativo correto do backend.

## Saídas geradas

O reindex deve gerar no projeto consumidor:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando existir
- `.qa-api/backend-graph.lock.json`

O lock é criado automaticamente e registra o backend usado no reindex.

## Regras

- Não crie `mapeamento-api.md` neste MVP.
- Não crie `mapeamento-api.json` neste MVP.
- Não instale Graphify automaticamente.
- Não copie Graphify para dentro de `qa-api`.
