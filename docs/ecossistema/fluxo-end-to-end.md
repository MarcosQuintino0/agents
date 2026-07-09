# Fluxo End-to-End

Este e o fluxo completo pretendido para uma API.

## 1. Instalar skills

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

O instalador copia as skills, valida Graphify, cria scripts `qa:*` e ignora estado local.

## 2. Preparar projeto

Prompt recomendado:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel,
corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites.
Nao crie suites de APIs ainda.
```

Resultado esperado:

- Graphify validado;
- `graph.json` e lock criados;
- Cypress e dependencias de teste configuradas;
- base comum `cypress/support/api/*` criada ou ajustada;
- schemas e assertions compartilhadas prontas;
- projeto marcado como pronto ou com lacunas bloqueantes claras.

## 3. Criar suite oficial

Prompt recomendado:

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenario para todas as rotas da API.
Nao deixe cenario aplicavel sem teste ou justificativa.
```

A IA deve confirmar o contrato no backend real e implementar somente cenarios com oraculo suficiente.

## 4. Gerar cobertura estatica

```bash
npm run qa:report -- --api <nome-da-api>
```

Saidas:

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

## 5. Investigar falha real

Use `qa-debug-report` quando houver uma execucao Cypress que precisa de evidencias:

```bash
npm run qa:debug -- --open --spec "cypress/e2e/apis/<api>/**/*.cy.js"
```

Saidas:

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

## 6. Explorar robustez

```bash
npm run qa:fuzz:profile -- --api <nome-da-api> --base-url http://localhost:3100
npm run qa:fuzz:lint -- --api <nome-da-api>
npm run qa:fuzz -- --api <nome-da-api> --mode smoke
```

Achado de fuzz nao vira teste oficial sem replay, oraculo confirmado, massa segura e relevancia.

## 7. Criar chamado

Depois de uma analise com problemas numerados:

```text
Crie chamados para os problemas 1 e 3.
```

A skill `qa-chamado` entrega rascunhos, nao abre tickets em ferramenta externa.
