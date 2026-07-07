# Graphify Skill

Skill compartilhada para validar e rodar a versão travada do Graphify usada pelas skills de QA.

## Versão travada

```text
graphifyy==0.9.8
```

## Instalação recomendada

No projeto consumidor:

```bash
npx @marcosquintino/qa-skills install
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
├── qa-api/
├── qa-chamado/
└── graphify/
```

## Configuração por plataforma de IA

O Graphify oficial tem comandos de integração para várias IAs. Esses comandos não instalam uma versão diferente do Graphify; eles criam arquivos de suporte para cada ambiente saber consultar o grafo.

Exemplos:

```bash
graphify codex install
graphify cursor install
graphify claude install
graphify agents install
```

Use esses comandos quando quiser que a IA consulte o grafo automaticamente em perguntas gerais sobre o projeto.

Para o fluxo da `qa-api`, isso é opcional. O obrigatório é:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
npm run qa:reindex
```

### Diferença prática

```text
graphifyy / graphify CLI
= motor que gera graphify-out/graph.json

graphify-runner.mjs
= valida a versão travada e roda o motor

graphify <plataforma> install
= cria arquivos de integração para uma IA específica
```

### Onde saber mais

Documentação oficial do Graphify no PyPI:

https://pypi.org/project/graphifyy/

Na documentação oficial, veja a seção "Make your assistant always use the graph" para a lista completa de plataformas suportadas.
