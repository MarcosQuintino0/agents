# Tools da Skill QA API

Neste MVP, a skill não inclui um conversor `graphify-to-api-map`.

O fluxo oficial usa diretamente os arquivos gerados pelo Graphify:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`

O único comando determinístico obrigatório no projeto consumidor é:

```bash
npm run qa:reindex
```

Esse comando deve ser fornecido pelo projeto consumidor ou por um pacote futuro, como:

```text
@empresa/api-test-creator
```

A função do comando é:

- rodar Graphify no backend;
- garantir que `graphify-out/graph.json` existe;
- gerar ou atualizar `.qa-api/backend-graph.lock.json`.

Não crie `mapeamento-api.md` neste MVP.
Não crie `mapeamento-api.json` neste MVP.
