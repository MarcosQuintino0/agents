# Templates de Codigo: Testes de API (Cypress)

Este arquivo e um indice. Leia somente os templates necessarios para a tarefa atual, mantendo o contexto pequeno e focado.

## Regra geral

- Copie a estrutura, nao o contrato do produto.
- Adapte exemplos ao contrato real do backend em uso.
- Nao carregue todos os templates se a tarefa pedir apenas CRUD, validacao ou seguranca.
- Use os arquivos abaixo como leitura sob demanda.

## Roteamento por intencao

| Intencao | Leia |
| --- | --- |
| Camada comum de Cypress, cliente HTTP, log mascarado e config base | [cypress-base.md](cypress-base.md) |
| Login, token, headers autenticados, sem autenticacao, permissao e seguranca | [autenticacao.md](autenticacao.md) |
| JSON Schema, helper AJV e schemas de resposta/erro | [schemas.md](schemas.md) |
| Assertions genericos e asserts especificos de recurso | [asserts.md](asserts.md) |
| Contratos de erro, vazamento interno, erro de campo e mensagens | [erros.md](erros.md) |
| Payloads, massa de dados, hooks e cleanup | [fixtures.md](fixtures.md) |
| Cliente do recurso, specs CRUD, persistencia, listagem e integridade | [crud.md](crud.md) |
| Validacoes de entrada, obrigatorios, limites, tipos e data-driven | [validacoes.md](validacoes.md) |

## Ordem recomendada

1. Leia [cypress-base.md](cypress-base.md) quando a suite ainda nao tiver camada comum.
2. Leia [schemas.md](schemas.md), [asserts.md](asserts.md) e [erros.md](erros.md) conforme o tipo de oraculo necessario.
3. Leia [fixtures.md](fixtures.md) quando houver criacao de massa, setup ou cleanup.
4. Leia [crud.md](crud.md), [validacoes.md](validacoes.md) ou [autenticacao.md](autenticacao.md) conforme o cenario solicitado.
