# Investigar Falha Real

Use este guia quando uma execucao Cypress falhou e voce precisa de evidencias reais.

## Comando recomendado

```bash
npm run qa:debug -- --open --spec "cypress/e2e/apis/<api>/**/*.cy.js"
```

O `--open` executa, gera o relatorio e abre em localhost para habilitar Replay.

## Abrir relatorio ja existente

```bash
npm run qa:debug:open
```

## Saidas

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

## Como analisar

1. Abra o teste falho no HTML.
2. Veja diagnostico, timeline e request principal.
3. Confira expected vs received.
4. Copie cURL quando precisar reproduzir.
5. Use Replay somente em ambiente controlado.
6. Se for defeito provavel, transforme a analise em problemas numerados.
7. Use `qa-chamado` se precisar de rascunho de ticket.

## Cuidado com segredos

O relatorio pode conter tokens e payloads reais de teste para permitir replay fiel. Nao envie o HTML/JSON para fora do ambiente autorizado.
