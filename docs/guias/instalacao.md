# Instalacao

Este guia instala as skills em um projeto consumidor.

## Pre-requisitos

- Node.js e npm no projeto consumidor.
- Python disponivel para Graphify.
- Caminho local do backend real.

## Comando recomendado

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto.

## O que o instalador faz

- Copia as skills para `.agents/skills`.
- Instala ou valida `graphifyy==0.9.8`.
- Configura scripts `qa:*` no `package.json`.
- Adiciona estado local ao `.gitignore`.

## Scripts esperados

```json
{
  "scripts": {
    "qa:reindex": "...",
    "qa:reindex:check": "...",
    "qa:report": "...",
    "qa:fuzz": "...",
    "qa:fuzz:profile": "...",
    "qa:fuzz:lint": "...",
    "qa:fuzz:replay": "...",
    "qa:debug": "...",
    "qa:debug:open": "...",
    "qa:debug:generate": "..."
  }
}
```

## Opcoes comuns

```bash
npx @marcosquintino/qa-skills install --backend ../backend
npx @marcosquintino/qa-skills install --skip-graphify
npx @marcosquintino/qa-skills install --target .codex/skills
```

## Depois da instalacao

Peca para a IA preparar o projeto:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel,
corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites.
Nao crie suites de APIs ainda.
```
