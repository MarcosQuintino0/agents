# QA Skills

Pacote instalador das skills `qa-api`, `qa-chamado`, `qa-debug-report` e `graphify`.

## Instalação recomendada

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Esse comando:

- copia as skills para `.agents/skills`;
- instala ou valida `graphifyy==0.9.8`;
- configura `qa:reindex`, `qa:reindex:check`, `qa:report`, `qa:debug`, `qa:debug:open` e
  `qa:debug:generate` no `package.json`, quando ele existir;
- adiciona o estado local das skills ao `.gitignore`.

Depois da instalação, peça para a IA preparar o projeto:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessários quando possível, corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suítes. Não crie suítes de APIs ainda.
```

Depois que a IA criar ou revisar testes de uma API, ela pode gerar o relatório oficial:

```bash
npm run qa:report -- --api <nome-da-api>
```

Saídas padrão:

```text
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
```

Quando o QA quiser investigar uma falha real da execução Cypress, use o debug report manual:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
npm run qa:debug:open
```

Saídas padrão:

```text
reports/faillens/index.html
reports/faillens/faillens-report.json
```

`qa:report` é estático e mede cobertura dos testes gerados. `qa:debug` executa Cypress com
instrumentação temporária para investigar falhas reais.

## Opções comuns

```bash
npx @marcosquintino/qa-skills install --backend ../backend
npx @marcosquintino/qa-skills install --skip-graphify
npx @marcosquintino/qa-skills install --target .codex/skills
```

Observação: nomes de pacote npm usam minúsculo, por isso o comando usa
`@marcosquintino/qa-skills`.

## Desenvolvimento do QA Debug Report

O código-fonte completo do FailLens fica em:

```text
packages/faillens/
```

A skill instalada pelo usuário usa somente o runtime sincronizado em:

```text
qa-debug-report/vendor/faillens/
```

Depois de alterar o FailLens, atualize o runtime da skill:

```bash
npm run prepare:qa-debug-report
```
