# Graphify na Skill QA API

Graphify é obrigatório no fluxo oficial e deve existir como skill irmã da `qa-api`.

Estrutura esperada:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

A versão esperada fica travada em `graphify/manifest.json`.

## Configuração mínima no projeto consumidor

Fluxo recomendado:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando copia as skills, instala/valida `graphifyy==0.9.8` e configura os scripts abaixo
quando existir `package.json`.

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

No fluxo recomendado, o instalador npm instala ou valida Graphify:

```bash
npx @marcosquintino/qa-skills install
```

Se Graphify não estiver disponível em uma instalação manual, instale explicitamente a versão
travada.

Opção recomendada:

```bash
uv tool install graphifyy==0.9.8
```

Alternativa:

```bash
pipx install graphifyy==0.9.8
```

Alternativa com pip:

```bash
pip install graphifyy==0.9.8
```

Depois valide:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
```

Observação: o pacote Python é `graphifyy`, mas o comando no terminal é `graphify`.

## Quando Graphify não for encontrado

Use esta orientação quando o projeto foi configurado manualmente:

```text
Graphify não encontrado.

O fluxo oficial da skill QA API exige Graphify para gerar o grafo do backend.

Instale uma das opções abaixo, conforme o ambiente da equipe:

uv tool install graphifyy==0.9.8

ou:

pipx install graphifyy==0.9.8

ou, se a equipe optar por pip:

pip install graphifyy==0.9.8

Depois valide:

node .agents/skills/graphify/tools/graphify-runner.mjs --check

E rode:

npm run qa:reindex
```

## Graphify CLI e Graphify Skill

Graphify CLI é obrigatório.

Graphify Skill também é obrigatória neste ecossistema, porque ela contém `manifest.json` com a versão travada.

Graphify deve ficar ao lado da `qa-api`:

```text
.agents/skills/
├── qa-api/
├── qa-chamado/
└── graphify/
```

Não copie Graphify para dentro de `qa-api`.

O Graphify oficial também oferece comandos opcionais por plataforma de IA, como:

```bash
graphify codex install
graphify cursor install
graphify claude install
graphify agents install
```

Esses comandos criam arquivos de suporte para a IA consultar o grafo de forma mais automática. Eles não substituem o `qa:reindex` e não são obrigatórios para o fluxo da `qa-api`.

Para detalhes, consulte `graphify/README.md` neste projeto e a documentação oficial:

```text
https://pypi.org/project/graphifyy/
```

## Quando a skill deve parar

A skill deve parar e pedir `npm run qa:reindex` quando:

- `graphify-out/graph.json` não existir;
- `.qa-api/backend-graph.lock.json` não existir;
- o lock não tiver `backendRoot` nem `backendRootAbsolute`;
- a API solicitada não for encontrada;
- o grafo parecer desatualizado.

## Regra importante

Graphify é mapa estrutural, não contrato final. O contrato final vem do código real do backend.
