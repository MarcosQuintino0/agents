# Prompts curtos

## Criar testes

```text
Crie testes para a API <nome-da-api>.
```

## Refatorar testes

```text
Refatore os testes da API <nome-da-api>.
```

## Revisar testes

```text
Revise os testes da API <nome-da-api>.
```

## Analisar execução

```text
Analise o report da API <nome-da-api>.
```

## Preparar projeto

```text
Prepare o projeto para testes de API.
```

## Primeira vez no projeto consumidor

1. Configure no `package.json`:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend"
  }
}
```

2. Troque `../backend` pelo caminho relativo correto do backend.

3. Rode:

```bash
npm run qa:reindex
```

4. Depois peça:

```text
Crie testes para a API <nome-da-api>.
```

## Quando faltar Graphify

Se a skill pedir, rode no terminal:

```bash
npm run qa:reindex
```

Depois repita o pedido.
