---
name: graphify
description: Valida e roda a versão travada do Graphify usada pelas skills de QA. Use quando precisar instalar, verificar versão, diagnosticar ou executar Graphify para gerar graphify-out/graph.json, GRAPH_REPORT.md e artefatos de grafo para skills como qa-api.
---

# Skill: Graphify

Use esta skill quando o usuário precisar configurar, validar ou rodar Graphify para gerar grafo estrutural de um projeto.

## Versão travada

Leia `manifest.json` antes de orientar instalação ou execução.

Versão atual travada:

```text
graphifyy==0.9.8
```

O pacote Python é `graphifyy`, mas o comando exposto no terminal é `graphify`.

## Instalação

Não instale automaticamente sem pedido explícito do usuário.

Opção recomendada:

```bash
uv tool install graphifyy==0.9.8
```

Alternativas:

```bash
pipx install graphifyy==0.9.8
pip install graphifyy==0.9.8
```

Depois valide:

```bash
graphify --version
```

## Runner

Use `tools/graphify-runner.mjs` para validar versão e executar Graphify de forma padronizada.

Exemplos:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
node .agents/skills/graphify/tools/graphify-runner.mjs --backend ../backend
```

## Relação com qa-api

A skill `qa-api` depende desta skill como irmã:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

## Regras

- Graphify é mapa estrutural, não contrato final.
- Não instale dependências sem autorização explícita.
- Não aceite versão diferente da travada sem atualizar `manifest.json`.
- Não exponha tokens, cookies, senhas ou credenciais em logs.
