# Gerar QA Report

`qa:report` gera o relatorio oficial estatico da suite criada ou revisada pela `qa-api`.

## Comando

```bash
npm run qa:report -- --api <nome-da-api>
```

Tambem e possivel informar uma pasta:

```bash
npm run qa:report -- --dir cypress/e2e/apis/<nome-da-api>
```

## Saidas

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

## O que ele mede

- Testes detectados.
- Tags de catalogo.
- Regras cobertas.
- Regras sem teste.
- Lacunas declaradas em `@cobertura`.
- Alertas de qualidade.
- Matriz endpoint x cenario.

## O que ele nao faz

- Nao executa Cypress.
- Nao substitui FailLens.
- Nao prova que o backend esta correto.
- Nao deve ser usado para replay.

Use `qa:report` para responder "o que a suite cobre?". Use `qa:debug` para responder "o que aconteceu na execucao?".
