# qa-debug-report

`qa-debug-report` roda o FailLens como relatorio manual de debug para falhas Cypress/API.

## Objetivo

Executar Cypress com instrumentacao temporaria, capturar requests/responses, assertions, erro real, screenshots, JSDoc e tags, e gerar HTML/JSON locais para diagnostico.

## Quando usar

- Quando uma suite Cypress falhou e voce precisa entender a execucao real.
- Quando precisa de cURL, request, response e evidencia para triagem.
- Quando quer usar a aba Replay do FailLens.
- Quando ja existe `reports/faillens/faillens-report.json` e voce quer analisar evidencias.

## Quando nao usar

- Para preparar projeto.
- Para criar suite oficial.
- Para medir cobertura estatica.
- Para substituir `qa:report`.

## Comandos

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/<api>/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/<api>/**/*.cy.js"
npm run qa:debug:open
npm run qa:debug:generate -- --input reports/faillens/faillens-report.json --output reports/faillens/index.html
```

## Artefatos

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

## Replay

A aba Replay precisa que o relatorio esteja aberto em localhost:

```bash
npm run qa:debug:open
```

Abrir `reports/faillens/index.html` por `file://` funciona para leitura, mas nao permite reenviar requests.

## Prompt recomendado

```text
Rode o debug report da API <nome-da-api> e analise as falhas reais da execucao.
Use o HTML/JSON gerado como evidencia observada, sem alterar testes ou backend sem autorizacao.
```

## Seguranca

Em ambiente controlado, o FailLens preserva tokens, senhas de teste, headers e bodies para permitir replay fiel. Nao envie esses relatorios para fora do ambiente autorizado.

## Relacao com FailLens

A skill usa o runtime vendorizado em:

```text
qa-debug-report/vendor/faillens/
```

O codigo fonte mantido fica em:

```text
packages/faillens/
```

Depois de alterar o FailLens:

```bash
npm run prepare:qa-debug-report
```
