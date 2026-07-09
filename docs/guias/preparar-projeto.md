# Preparar Projeto

Preparar o projeto e a primeira acao depois da instalacao das skills. O preparo cria ou ajusta a base comum Cypress/API, valida Graphify e deixa o projeto pronto para receber suites.

## Prompt

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel,
corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites.
Nao crie suites de APIs ainda.
```

## O agente pode fazer

- Instalar dependencias de teste autorizadas.
- Criar scripts `qa:reindex` e `qa:reindex:check` quando possivel.
- Criar base comum `cypress/support/api/*`.
- Criar assertions compartilhadas.
- Criar schemas de erro.
- Rodar validacoes possiveis.

## O agente nao deve fazer

- Criar suites especificas.
- Alterar autenticacao real sem autorizacao.
- Alterar backend.
- Remover testes existentes.
- Criar ferramentas legadas de report.

## Criterio de pronto

A entrega final deve dizer:

```text
Pronto para criar suites: sim
```

ou:

```text
Pronto para criar suites: nao
```

Se nao estiver pronto, a resposta deve listar somente lacunas bloqueantes.
