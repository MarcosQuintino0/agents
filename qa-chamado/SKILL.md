---
name: qa-chamado
description: Cria rascunhos de chamados de QA a partir de problemas numerados já analisados por skills de teste, especialmente qa-api. Use quando o usuário pedir para transformar problemas, falhas, evidências, reports ou análises em chamados/tickets, com sanitização de segredos e separação entre comportamento atual, esperado, evidências, impacto e análise técnica.
---

# Skill: QA Chamado

Use esta skill quando o usuário pedir para criar, preparar, formatar ou transformar problemas de QA em chamados.

## Entrada esperada

Use uma análise anterior com problemas numerados, por exemplo:

```text
Crie chamados para os problemas 1 e 3.
Transforme os problemas 2 e 4 da análise da API empresa em chamados.
Gere rascunhos de chamado para os defeitos prováveis.
```

Se o usuário não indicar quais problemas quer transformar em chamado, pergunte quais números devem ser usados.

## Responsabilidade

Esta skill não cria, revisa ou altera testes. Ela transforma evidências já analisadas em rascunhos de chamado.

Para o fluxo completo, leia `agents/chamado-criador.md`.

Quando a origem for API, use `templates/api-chamado.md`.

Quando a origem for outra frente e ainda não houver template específico, adapte o template sem inventar evidência e registre a limitação.

## Fluxo obrigatório

1. Leia a análise anterior e identifique apenas os problemas selecionados pelo usuário.
2. Valide se cada problema é adequado para chamado.
3. Agrupe problemas somente quando tiverem a mesma causa provável e o mesmo comportamento incorreto.
4. Separe chamados quando causa, comportamento, recurso ou correção esperada forem diferentes.
5. Remova tokens, cookies, senhas, credenciais, Authorization e headers irrelevantes.
6. Preencha o template sem criar seções alternativas.
7. Nunca abra o chamado diretamente no board; entregue somente o rascunho.

## Critérios para gerar chamado

Gere rascunho somente para:

- defeito confirmado pela análise;
- defeito provável com evidências fortes e incerteza explícita;
- problema de segurança, contrato ou não-vazamento sustentado por evidência.

Não gere chamado para:

- problema exclusivo de teste Cypress;
- validação fraca sem defeito observado no produto;
- problema de ambiente ou massa sem evidência de defeito;
- resultado inconclusivo;
- número não selecionado pelo usuário.

Se um problema selecionado não for adequado para chamado, responda:

```text
CHAMADO NÃO GERADO - PROBLEMA <número>
Motivo: <explicação objetiva>
Ação recomendada: <correção no teste, investigação ou verificação humana>
```

## Regras inegociáveis

- Não invente contrato, causa raiz, impacto ou resultado esperado.
- Diferencie evidência de hipótese.
- Não inclua token, cookie, senha, Authorization ou credencial.
- Não use detalhes extensos de logs quando um resumo sanitizado basta.
- Não transforme validação fraca em defeito de produto sem evidência do produto.
- Não agrupe comportamentos diferentes só porque são da mesma API ou tela.
- Não abra chamado diretamente em ferramenta externa.
