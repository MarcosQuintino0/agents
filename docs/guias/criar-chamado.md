# Criar Chamado

Use `qa-chamado` depois de uma analise com problemas numerados.

## Prompt

```text
Crie chamados para os problemas 1 e 3.
```

## Quando gerar

- Defeito confirmado.
- Defeito provavel com evidencias fortes.
- Falha de seguranca.
- Violacao de contrato.
- Vazamento interno observado.

## Quando nao gerar

- Falha exclusiva do teste.
- Ambiente ou massa inconclusivos.
- Evidencia fraca.
- Problema nao selecionado.

## Fonte preferencial

Quando existir:

```text
reports/faillens/faillens-report.json
```

use esse JSON como fonte observada para request, response, erro, cURL e reproducoes.

## Saida

A skill entrega um rascunho de chamado. O humano decide onde abrir.
