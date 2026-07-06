# Graphify na Skill QA API

Graphify é obrigatório no fluxo oficial.

## Configuração mínima no projeto consumidor

No `package.json`:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

O usuário deve trocar `../backend` pelo caminho relativo correto do backend.

## Rodar reindex

```bash
npm run qa:reindex
```

Isso gera:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando existir
- `.qa-api/backend-graph.lock.json`

O lock registra o backend usado no reindex em `backendRoot` e `backendRootAbsolute`.

## Rodar check

```bash
npm run qa:reindex:check
```

Isso valida se o grafo e o lock existem e se o commit do backend ainda bate, quando possível. O check não roda Graphify e não modifica arquivos.

## Instalação

A skill não instala Graphify automaticamente.

Se Graphify não estiver disponível, instale explicitamente conforme o ambiente da equipe.

Opção recomendada:

```bash
uv tool install graphifyy
```

Alternativa:

```bash
pipx install graphifyy
```

Alternativa com pip:

```bash
pip install graphifyy
```

Depois valide:

```bash
graphify --version
```

Observação: o pacote Python é `graphifyy`, mas o comando no terminal é `graphify`.

## Quando Graphify não for encontrado

Use esta orientação:

```text
Graphify não encontrado.

O fluxo oficial da skill QA API exige Graphify para gerar o grafo do backend.

Instale uma das opções abaixo, conforme o ambiente da equipe:

uv tool install graphifyy

ou:

pipx install graphifyy

ou, se a equipe optar por pip:

pip install graphifyy

Depois valide:

graphify --version

E rode:

npm run qa:reindex
```

## Graphify CLI vs Graphify Skill

Graphify CLI é obrigatório.

Graphify Skill é opcional.

Se Graphify for instalado como skill, deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

## Quando a skill deve parar

A skill deve parar e pedir `npm run qa:reindex` quando:

- `graphify-out/graph.json` não existir;
- `.qa-api/backend-graph.lock.json` não existir;
- o lock não tiver `backendRoot` nem `backendRootAbsolute`;
- a API solicitada não for encontrada;
- o grafo parecer desatualizado.

## Regra importante

Graphify é mapa estrutural, não contrato final. O contrato final vem do código real do backend.
