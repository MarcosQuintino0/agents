# qa-chamado

`qa-chamado` transforma problemas numerados e evidencias fortes em rascunhos de chamado.

## Objetivo

Gerar tickets claros, sanitizados e acionaveis, separando comportamento atual, comportamento esperado, evidencias, impacto e analise tecnica.

## Quando usar

- Depois de uma analise com problemas numerados.
- Depois de um report FailLens com evidencia observada.
- Quando o usuario pedir para transformar problemas especificos em chamados.

## Quando nao usar

- Quando ainda nao ha problema numerado.
- Quando a falha e apenas do teste Cypress.
- Quando falta evidencia do produto.
- Quando o usuario nao indicou quais problemas quer transformar.

## Entrada esperada

```text
Crie chamados para os problemas 1 e 3.
```

```text
Use qa-chamado e transforme os problemas 1 e 2 da analise da API empresa em chamados.
```

## Criterios

Gerar chamado somente para:

- defeito confirmado;
- defeito provavel com evidencias fortes;
- problema de seguranca;
- violacao de contrato;
- nao-vazamento sustentado por evidencia.

Nao gerar chamado para:

- problema exclusivo de teste;
- resultado inconclusivo;
- massa ou ambiente sem evidencia;
- numero nao selecionado.

## Sanitizacao

Sempre remover:

- tokens;
- cookies;
- senhas;
- credenciais;
- Authorization;
- headers irrelevantes.

## Saida esperada

A skill entrega apenas rascunho. Ela nao abre chamado em Jira, GitHub Issues, Azure DevOps ou qualquer ferramenta externa.
