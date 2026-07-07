# Instalação do Graphify

A versão do Graphify fica travada em `manifest.json`.

```text
graphifyy==0.9.8
```

## Opção recomendada

No projeto consumidor:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando copia as skills e valida/instala `graphifyy==0.9.8`.

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
graphify --version
node .agents/skills/graphify/tools/graphify-runner.mjs --check
```

## Observações

- O pacote Python é `graphifyy`.
- O comando exposto no terminal é `graphify`.
- Durante o uso da `qa-api`, Graphify não é instalado novamente.
- A troca de versão deve ser intencional e registrada no `manifest.json`.

## Integração por plataforma de IA

Depois que o CLI estiver instalado, o Graphify oficial permite criar arquivos de suporte:

```bash
graphify codex install
graphify cursor install
graphify claude install
graphify agents install
```

Esses comandos são opcionais para a `qa-api`. Eles ajudam a IA a consultar o grafo em perguntas
gerais, mas não substituem `qa:reindex`.

Referência oficial:

```text
https://pypi.org/project/graphifyy/
```
