# qa-api

`qa-api` e a skill principal do ecossistema. Ela prepara projetos Cypress/API, cria suites oficiais, revisa cobertura e analisa reports.

## Objetivo

Criar testes de API fortes, rastreaveis e sustentados por contrato real do backend. A skill usa Graphify como mapa, mas confirma rotas, campos, validacoes, status e regras no codigo real.

## Quando usar

- Preparar um projeto consumidor para testes de API.
- Criar ou refatorar uma suite Cypress de API.
- Revisar testes existentes.
- Gerar `qa:report`.
- Gerar `qa:oracle`.
- Analisar reports de API e listar problemas numerados.

## Quando nao usar

- Para investigar uma falha real com replay: use `qa-debug-report`.
- Para fuzzing exploratorio: use `qa-api-fuzz`.
- Para abrir chamado: use `qa-chamado`.
- Para aceitar contrato sem backend real: nao faca isso.

## Fluxo oficial

1. Validar Graphify e lock.
2. Ler o backend real.
3. Confirmar perfil do produto e base Cypress.
4. Montar matriz endpoint x cenario.
5. Implementar somente cenarios com oraculo suficiente.
6. Rodar lint, checks e suite quando possivel.
7. Gerar `qa:report`.
8. Gerar `qa:oracle`.

## Comandos

```bash
npm run qa:reindex
npm run qa:reindex:check
npm run qa:report -- --api <nome-da-api>
npm run qa:oracle -- --api <nome-da-api>
npm run qa:oracle -- --api <nome-da-api> --faillens reports/faillens/faillens-report.json
```

## Artefatos

```text
.agents/state/qa-api/graphify-out/graph.json
.agents/state/qa-api/backend-graph.lock.json
.agents/state/qa-api/reports/<api>/coverage.html
.agents/state/qa-api/reports/<api>/coverage.json
.agents/state/qa-api/oracle/<api>/oracle.html
.agents/state/qa-api/oracle/<api>/oracle.json
```

## Prompts recomendados

Preparar projeto:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel,
corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites.
Nao crie suites de APIs ainda.
```

Criar suite:

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenario para todas as rotas da API.
Para cada rota, avalie sucesso, inexistente, validacao de payload, body ausente,
sem autenticacao, token invalido, persistencia/preservacao e nao-vazamento.
Nao deixe cenario aplicavel sem teste ou justificativa.
```

Revisar:

```text
Revise os testes da API <nome-da-api>.
Use o checklist de qualidade da skill, compare com o backend real quando necessario,
gere qa:report quando possivel e liste lacunas por severidade.
Depois gere qa:oracle para medir a forca das assertions.
```

## Regras inegociaveis

- Nao inventar contrato.
- Nao usar Graphify como contrato final.
- Nao mascarar defeito para fazer teste passar.
- Nao criar suite durante o preparo.
- Nao mexer em autenticacao real sem autorizacao.
- Nao expor token, cookie, senha ou Authorization.

## Relacao com outras skills

- Usa `graphify` para localizar o backend.
- Pode entregar problemas para `qa-chamado`.
- Nao substitui `qa-debug-report`.
- Pode alimentar `qa-api-fuzz` com artefatos e metadata.
