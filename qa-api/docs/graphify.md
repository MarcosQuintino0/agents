# Graphify na Skill QA API

Graphify é obrigatório no fluxo oficial.

## Comando principal

```bash
npm run qa:reindex
```

Esse comando deve rodar no terminal comum, sem IA.

Ele deve gerar:

- `graphify-out/graph.json`
- `graphify-out/GRAPH_REPORT.md`, quando disponível
- `.qa-api/backend-graph.lock.json`

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

## Quando rodar

Rode na primeira vez do projeto e quando o backend mudar significativamente.

## Quando a skill deve parar

A skill deve parar e pedir `npm run qa:reindex` quando:

- `graphify-out/graph.json` não existir;
- `.qa-api/backend-graph.lock.json` não existir;
- a API solicitada não for encontrada;
- o grafo parecer desatualizado.

## Regra importante

Graphify é mapa estrutural, não contrato final. O contrato final vem do código real do backend.
