# Instalação do Graphify

A versão do Graphify fica travada em `manifest.json`.

Versão atual:

```text
graphifyy==0.9.8
```

## Opção recomendada

```bash
uv tool install graphifyy==0.9.8
```

## Alternativas

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
- A skill não instala Graphify automaticamente.
- A troca de versão deve ser intencional e registrada no `manifest.json`.

## Integração por plataforma de IA

Depois que o CLI estiver instalado, o Graphify oficial permite criar arquivos de suporte para cada IA:

```bash
graphify codex install
graphify cursor install
graphify claude install
graphify agents install
```

Esses comandos são opcionais para a `qa-api`. Eles servem para fazer a IA consultar o grafo de forma mais automática em perguntas gerais sobre o projeto.

Para o fluxo oficial da `qa-api`, basta validar a versão travada e rodar o reindex:

```bash
node .agents/skills/graphify/tools/graphify-runner.mjs --check
npm run qa:reindex
```

Referência oficial:

https://pypi.org/project/graphifyy/
