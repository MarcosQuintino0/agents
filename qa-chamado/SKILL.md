---
name: qa-chamado
description: Cria rascunhos de chamados de QA a partir de problemas numerados já analisados por skills de teste, especialmente qa-api. Use quando o usuário pedir para transformar problemas, falhas, evidências, reports ou análises em chamados/tickets, com sanitização de segredos e separação entre comportamento atual, esperado, evidências, impacto e análise técnica.
---

# Skill: QA Chamado

Use esta skill para transformar problemas de QA já analisados em rascunhos de chamado.

## Entrada esperada

Use uma análise anterior com problemas numerados, por exemplo:

```text
Crie chamados para os problemas 1 e 3.
Transforme os problemas 2 e 4 da análise da API empresa em chamados.
Gere rascunhos de chamado para os defeitos prováveis.
```

Se o usuário não indicar quais problemas quer transformar em chamado, pergunte quais números devem ser usados.

## Fluxo obrigatório

1. Leia a análise anterior e identifique apenas os problemas selecionados.
2. Valide se cada problema é adequado para chamado.
3. Agrupe somente problemas com mesma causa provável e mesmo comportamento incorreto.
4. Separe problemas quando causa, comportamento, recurso ou correção esperada forem diferentes.
5. Remova tokens, cookies, senhas, credenciais, Authorization e headers irrelevantes.
6. Quando existir `reports/faillens/faillens-report.json`, use-o como fonte preferencial para resultado observado, request/response, cURL, reprodução e evidências.
7. Use `agents/chamado-criador.md` e, para origem API, `templates/api-chamado.md`.
8. Entregue somente o rascunho; não abra chamado em ferramenta externa.

## Critérios

Gere rascunho somente para defeito confirmado, defeito provável com evidências fortes, ou problema de segurança/contrato/não-vazamento sustentado por evidência.

Não gere chamado para problema exclusivo de teste Cypress, validação fraca sem defeito observado, problema de ambiente/massa sem evidência, resultado inconclusivo ou número não selecionado.

Se um problema selecionado não for adequado, responda:

```text
CHAMADO NÃO GERADO - PROBLEMA <número>
Motivo: <explicação objetiva>
Ação recomendada: <correção no teste, investigação ou verificação humana>
```

## Regras inegociáveis

- Não invente contrato, causa raiz, impacto ou resultado esperado.
- Diferencie evidência de hipótese.
- Não inclua token, cookie, senha, Authorization ou credencial.
- Não transforme validação fraca em defeito de produto sem evidência do produto.
- Não agrupe comportamentos diferentes só porque são da mesma API ou tela.
