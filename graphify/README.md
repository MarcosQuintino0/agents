# Graphify Skill

Skill compartilhada para validar e executar a versão travada do Graphify usada pelas skills de QA.

## Versão travada

```text
graphifyy==0.9.8
```

## Instalação recomendada

No projeto consumidor:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando instala as skills e valida/instala `graphifyy==0.9.8`.

## Instalação manual

Use somente quando o ambiente não puder rodar o instalador npm:

```bash
uv tool install graphifyy==0.9.8
```

Alternativas:

```bash
pipx install graphifyy==0.9.8
pip install graphifyy==0.9.8
```

## Validação

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
```

## Uso com qa-api

Mantenha as skills como irmãs:

```text
.agents/skills/
- qa-api/
- qa-chamado/
- graphify/
```

O `qa:reindex` organiza:

- `graph.json`, obrigatório para a IA navegar pelo backend;
- `backend-graph.lock.json`, obrigatório para localizar o backend real;
- `graph.html`, visual humano e não bloqueante;
- `GRAPH_REPORT.md`, complementar quando existir.

## Configuração por plataforma de IA

O Graphify oficial tem comandos opcionais de integração para várias IAs:

```bash
graphify codex install
graphify cursor install
graphify claude install
graphify agents install
```

Esses comandos não instalam outra versão do Graphify. Eles criam arquivos de suporte para consultas
gerais ao grafo. Para o fluxo da `qa-api`, são opcionais e não substituem `qa:reindex`.

Documentação oficial:

```text
https://pypi.org/project/graphifyy/
```
