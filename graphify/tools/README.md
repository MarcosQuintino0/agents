# Tools da Skill Graphify

## Runner

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
node .agents/skills/graphify/tools/graphify-runner.mjs --backend ../backend
```

O runner:

- lê `graphify/manifest.json`;
- valida que `graphify --version` bate com a versão travada;
- roda `graphify .` no backend informado;
- não instala dependências automaticamente.

## Versão travada

Atualize somente `manifest.json` quando a equipe decidir trocar a versão do Graphify.
