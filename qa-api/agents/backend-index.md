# Agente: Backend Index com Graphify

Usa Graphify como mapa estrutural obrigatório do backend para orientar criação, revisão e análise de
testes de API Cypress.

Graphify aponta onde procurar. O contrato final continua vindo do código real do backend,
OpenAPI/documentação aprovada, schemas, persistência consultada, regra confirmada e invariantes de
segurança.

## Artefatos oficiais

O fluxo usa:

- `.agents/state/qa-api/graphify-out/graph.json` - obrigatório para criação/refatoração;
- `.agents/state/qa-api/backend-graph.lock.json` - obrigatório para localizar o backend real;
- `.agents/state/qa-api/graphify-out/GRAPH_REPORT.md` - complementar quando existir;
- `.agents/state/qa-api/graphify-out/graph.html` - mapa visual humano, não bloqueante.

Não crie `mapeamento-api.md` nem `mapeamento-api.json`.

## Como o backend é configurado

Não existe arquivo `.yml` obrigatório.

O caminho do backend vem do script `qa:reindex` do projeto consumidor:

```json
{
  "scripts": {
    "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend",
    "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"
  }
}
```

O usuário ou instalador deve trocar `../backend` pelo caminho relativo correto do backend.
Não invente esse caminho quando ele não puder ser inferido.

## Validação obrigatória

Antes de criar ou refatorar testes:

1. verifique `graph.json`;
2. verifique `backend-graph.lock.json`;
3. leia o lock e localize `backendRoot` ou `backendRootAbsolute`;
4. use `GRAPH_REPORT.md` apenas como complemento quando existir;
5. ignore a ausência de `graph.html` como bloqueio;
6. quando possível, execute `npm run qa:reindex:check`.

Se grafo ou lock estiverem ausentes/desatualizados, execute `npm run qa:reindex` quando o ambiente
permitir. Pare e peça ação manual somente se o comando não puder ser executado, se o script estiver
ausente sem caminho de backend claro, ou se Graphify falhar por problema externo.

## Como usar o grafo

Use `graph.json` para localizar candidatos a:

- controller, router ou endpoint handler;
- DTOs, requests, responses e schemas;
- services, use cases e validators;
- repositories, gateways e integrações de persistência;
- exception handlers e formatadores de erro;
- middlewares, guards e regras de autenticação/autorização.

Depois de localizar ponteiros no grafo, abra os arquivos reais do backend antes de definir:

- rota, método e parâmetros;
- payload;
- campos, obrigatoriedade, tipos, limites e nulabilidade;
- status esperado e mensagens;
- regras de negócio;
- segurança;
- persistência;
- exceptions;
- formato de erro.

Se o grafo apontar para arquivo inexistente, candidato ambíguo ou relação suspeita, trate como sinal
de grafo desatualizado e tente reindexar. Não substitua o fluxo oficial por descoberta manual.

## Comando de reindex

```bash
node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend
```

O comando deve:

- rodar Graphify no backend informado por `--backend`;
- copiar `graph.json` para `.agents/state/qa-api/graphify-out/`;
- gerar `graph.html` quando o Graphify suportar;
- copiar `GRAPH_REPORT.md` quando existir;
- gerar ou atualizar `.agents/state/qa-api/backend-graph.lock.json`.

## Instalação e versão

Graphify CLI é obrigatório. A skill `graphify` também é obrigatória porque contém `manifest.json`
com a versão travada.

Estrutura esperada:

```text
.agents/skills/
- qa-api/
- qa-chamado/
- qa-debug-report/
- graphify/
```

Não copie Graphify para dentro de `qa-api`.

## Regras de segurança

- Não use o grafo como fonte de payload, mensagem, regra ou status esperado.
- Não altere autenticação, schemas compartilhados ou configuração sensível sem autorização.
- Não exponha tokens, cookies, senhas ou Authorization em logs, report, cURL ou chamados.
- Não crie fallback manual de mapeamento do backend no fluxo oficial.
