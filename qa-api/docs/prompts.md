# Prompts curtos

## Prompt 1 - Preparar projeto

Use depois de instalar as skills no projeto consumidor:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessários quando possível, corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suítes. Não crie suítes de APIs ainda.
```

Resultado esperado: o agente deve analisar e implementar o preparo. Ele só deve pedir ação manual se
não puder executar comando, se o caminho do backend estiver indefinido ou se houver falha externa de
Graphify/ambiente.

## Prompt 2 - Criar testes

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenário para todas as rotas da API. Para cada rota,
avalie sucesso, inexistente, validação de payload, body ausente, sem autenticação, token inválido,
persistência/preservação e não-vazamento. Não deixe cenário aplicável sem teste ou justificativa.
```

Resultado esperado: o agente deve usar Graphify como mapa, confirmar o contrato no backend real,
criar/refatorar a suíte, gerar `qa:report` quando possível e entregar evidências finais.

## Refatorar testes

```text
Refatore os testes da API <nome-da-api>.
Preserve cobertura existente, monte a matriz endpoint x cenário, fortaleça assertions sem mascarar defeitos e gere qa:report ao final quando possível.
```

## Revisar testes

```text
Revise os testes da API <nome-da-api>.
Use o checklist de qualidade da skill, compare com o backend real quando necessário, gere qa:report quando possível e liste lacunas por severidade.
```

## Analisar execução

```text
Analise o report da API <nome-da-api>.
Entregue problemas numerados com evidências, impacto e confiança.
```

## Debug manual de falha real

Use a skill `qa-debug-report` quando quiser executar Cypress com instrumentação e gerar o relatório
FailLens:

```text
Rode o debug report da API <nome-da-api> e analise as falhas reais da execução.
Use o HTML/JSON gerado como evidência observada, sem alterar testes ou backend sem autorização.
```

Comando esperado quando o ambiente permitir:

```bash
npm run qa:debug -- --spec "cypress/e2e/apis/<nome-da-api>/**/*.cy.js"
```

## Criar chamados após análise

Use a skill `qa-chamado`:

```text
Crie chamados para os problemas 1 e 3.
```

## Fluxo manual somente quando necessário

Se o agente não puder executar comandos, ele pode pedir:

```bash
npm run qa:reindex
npm run qa:reindex:check
npm run qa:report -- --api <nome-da-api>
```

Esse é fallback operacional, não o fluxo principal esperado.
