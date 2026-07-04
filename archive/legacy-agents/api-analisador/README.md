# Analisador de Relatorio de API

Este agente analisa execucoes de testes de API registradas no `report.json`. Ele usa o relatorio
como evidencia inicial e consulta testes Cypress, schemas, assertions e backend somente quando
necessario para chegar a uma conclusao responsavel.

O agente e independente dos agentes de criacao, setup e revisao de testes.

## Arquivos

| Arquivo              | Finalidade                                                                 |
| -------------------- | -------------------------------------------------------------------------- |
| `agent.md`           | Define o fluxo de analise, classificacoes, criterios e formato da entrega. |
| `ticket-template.md` | Define o formato obrigatorio dos rascunhos de chamados de backend.         |
| `README.md`          | Explica quando e como utilizar o agente.                                   |

## O que o agente faz

- analisa todos os testes relacionados a API informada;
- faz uma triagem rapida dos testes aprovados;
- investiga testes falhos e aprovacoes suspeitas;
- identifica possiveis defeitos no backend;
- identifica problemas ou validacoes fracas no Cypress;
- consulta o backend quando disponivel e necessario;
- agrupa testes afetados pela mesma causa;
- apresenta problemas numerados com confianca e limitacoes;
- cria rascunhos de chamados somente quando o usuario selecionar problemas da analise.

## O que o agente nao faz automaticamente

- nao altera testes Cypress;
- nao modifica o backend;
- nao abre chamados no board;
- nao considera toda falha como defeito do produto;
- nao considera todo teste aprovado como correto;
- nao cria chamados durante a analise inicial;
- nao inclui tokens, cookies ou credenciais nos chamados.

## Como usar

Antes da analise, gere o relatorio executando a suite desejada. Exemplo:

```bash
npm run cy:log -- --spec "cypress/e2e/apis/visualizacao-filtro/*.cy.js"
```

Depois, invoque o agente.

### Prompt simples

```text
Analise o report.json do visualizacao-filtro seguindo
.ai/agents/api-analisador/agente.md.
```

O agente localizara:

- `cypress/logs/report.json`;
- specs relacionadas a `visualizacao-filtro`;
- helpers, assertions e schemas utilizados pelos testes.

### Prompt com backend

```text
Analise o report.json da API visualizacao-filtro seguindo
.ai/agents/api-analisador/agente.md.

O backend esta em C:/projetos/ressus-backend.
Analise o codigo quando necessario. Primeiro entregue somente a analise numerada.
```

### Prompt usando uma pasta Cypress

```text
Analise no report.json todos os testes relacionados a
cypress/e2e/apis/visualizacao-filtro/ seguindo
.ai/agents/api-analisador/agente.md.

Primeiro entregue a analise. Nao altere testes nem backend.
```

### Prompt usando um endpoint

```text
Analise no report.json todas as chamadas do endpoint /visualizacao_filtro/.
Siga .ai/agents/api-analisador/agente.md e entregue somente a analise inicial.
```

### Criar chamados depois da analise

```text
Crie chamados para os problemas 1, 2 e 5 que voce listou, utilizando o padrao de
.ai/agents/api-analisador/template-chamado.md.
```

## Como funciona a analise

1. O agente filtra o `report.json` pela API, pasta ou endpoint informado.
2. Testes aprovados e aparentemente coerentes recebem uma validacao resumida.
3. Testes falhos ou aprovados com respostas suspeitas sao investigados no codigo Cypress.
4. O backend e consultado quando necessario para confirmar contrato, regra ou causa provavel.
5. Problemas sao separados entre backend, teste Cypress, validacao fraca, ambiente e inconclusivo.
6. O agente entrega problemas numerados com confianca e limitacoes.
7. Somente depois da selecao do usuario, problemas adequados podem virar rascunhos usando
   `ticket-template.md`.

## Exemplos de conclusao

Teste aprovado e saudavel:

```text
deve criar uma visualizacao de filtro com dados validos e retornar 200:
request, status e dados retornados estao coerentes; nenhum problema aparente foi identificado.
```

Teste falho por defeito provavel no backend:

```text
deve retornar 400 quando o body estiver ausente:
o status 400 foi retornado, mas a response expos detalhes internos do backend. A validacao Cypress
detectou corretamente o problema.
```

Teste aprovado com problema ignorado:

```text
deve consultar o recurso:
o teste passou, mas a response contem stack trace. Ha um possivel defeito no backend e uma lacuna
de validacao no Cypress.
```

## Resultado esperado da analise inicial

A entrega inicial e curta e voltada para decisao do usuario:

1. resumo da quantidade de testes e problemas;
2. testes saudaveis agrupados;
3. problemas numerados com classificacao, confianca, motivo, acao e limitacoes;
4. proximos passos e problemas que podem virar chamado.

Depois dessa entrega, o usuario pode selecionar quais problemas devem ser transformados em
rascunhos de chamados. Os rascunhos sempre devem passar por revisao humana antes de serem enviados
ao board.
