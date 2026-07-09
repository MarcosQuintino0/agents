---
name: qa-api
description: Cria, revisa, prepara e analisa testes de API Cypress seguindo o padrão corporativo de qualidade, usando Graphify como mapa obrigatório do backend. Use quando o usuário pedir para preparar um projeto Cypress para testes de API, criar/refatorar/revisar suítes de API, rodar ou validar o reindex do backend, gerar qa:report, ou analisar reports de execução de APIs.
---

# Skill: QA API

Use esta skill para trabalhar com testes de API Cypress em projetos consumidores.

## Fluxo oficial

1. **Preparar projeto**: use `agents/api-preparador.md`.
   - O agente deve analisar, configurar, instalar dependências de teste autorizadas, criar a base comum Cypress/API e executar validações quando possível.
   - Não crie suítes de APIs específicas nessa etapa.
2. **Criar ou refatorar testes**: use `agents/api-criador.md`.
   - Antes de implementar, valide Graphify e monte a matriz endpoint x cenário.
   - Use `pattern/08-checklist-qualidade.md` como gate de qualidade.
   - Ao final, gere `qa:report` e `qa:oracle` quando o ambiente permitir.
3. **Revisar testes existentes**: use `agents/api-revisor.md`.
   - Revise força das assertions, cobertura, segurança, persistência, cleanup, JSDoc e lacunas.
   - Ao final, gere `qa:report` e `qa:oracle` quando o ambiente permitir.
4. **Analisar execução/report**: use `agents/api-analisador.md`.
   - Aceite `cypress/logs/report.json` ou `reports/faillens/faillens-report.json` como evidência observada.
   - Entregue problemas numerados e evidências. Se o usuário pedir chamados, use `qa-chamado`.
5. **Debug manual de falha real**: use a skill irmã `qa-debug-report`.
   - Rode `qa:debug` somente quando o usuário pedir execução/debug ou autorizar claramente.
   - Não execute `qa:debug` automaticamente ao criar ou revisar suítes.

## Graphify obrigatório

Antes de criar ou refatorar testes oficiais, verifique no projeto consumidor:

- `.agents/state/qa-api/graphify-out/graph.json`
- `.agents/state/qa-api/backend-graph.lock.json`

Use `.agents/state/qa-api/graphify-out/GRAPH_REPORT.md` apenas como complemento quando existir.
Use `.agents/state/qa-api/graphify-out/graph.html` apenas como mapa visual humano; ele não bloqueia a criação de testes.

Se grafo ou lock estiverem ausentes/desatualizados, execute `npm run qa:reindex` quando o ambiente permitir. Pare e peça ação manual somente quando:

- o comando não puder ser executado;
- o script `qa:reindex` não existir e o caminho do backend não puder ser inferido;
- Graphify ou a versão travada falhar por problema externo;
- o usuário tiver pedido explicitamente para não alterar/executar nada.

O lock deve conter `backendRoot` ou `backendRootAbsolute`. Use esse caminho para abrir o backend real.
Graphify é um mapa estrutural, não o contrato final.

## Arquivos de referência

- `agents/backend-index.md`: regras de Graphify, lock e reindex.
- `pattern/api-pattern.md`: fonte central das regras de qualidade.
- `pattern/08-checklist-qualidade.md`: checklist comum para criação e revisão.
- `templates/api-templates.md`: índice dos templates técnicos. Leia somente os templates aplicáveis.
- `docs/prompts.md`: prompts curtos recomendados ao usuário.
- `docs/manual-uso.md`: manual humano de instalação e uso.

## Regras inegociáveis

- Não invente contrato, payload, regra, status, mensagem ou permissão.
- Sempre confirme o contrato no backend real ou em fonte aprovada.
- Não use Graphify como contrato final.
- Não crie `mapeamento-api.md` nem `mapeamento-api.json`.
- Não mascare defeito para fazer teste passar.
- Não exponha token, cookie, senha, Authorization ou credenciais em logs, reports, cURL ou chamados.
- Durante o preparo, pode instalar dependências de teste e criar a base comum autorizada.
- Fora do preparo, não altere autenticação, schemas compartilhados, configurações sensíveis ou dependências sem autorização.
- Use `qa:report` como relatório oficial estático das suítes geradas ou revisadas.
- Use `qa:oracle` para auditar forca das assertions. Use `--run-mutations` somente com evidencia
  FailLens quando quiser executar mutantes contra os asserts reais; ele nao deve fazer novas requests.
- Use `qa-debug-report`/`qa:debug` apenas para investigar falhas reais de execução Cypress.
- Não crie nem exija ferramentas legadas como `cy:log`, `relatorio-cobertura` ou `relatorio-execucao`.
