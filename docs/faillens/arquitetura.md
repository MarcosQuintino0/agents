# Arquitetura do FailLens

Fluxo simplificado:

```text
CLI
  -> detecta Cypress
  -> cria configuracao temporaria em .faillens/
  -> executa Cypress

Cypress browser
  -> sobrescreve cy.request
  -> envia eventos por cy.task

Cypress Node
  -> acumula e mascara dados
  -> salva parciais
  -> consolida specs

Reporter
  -> enriquece modelo
  -> gera JSON + HTML standalone

Visualizador local
  -> serve relatorio em 127.0.0.1
  -> habilita Replay
```

## Componentes

- `src/cli`: comandos `run`, `open`, `generate`, `init`.
- `src/cypress`: instrumentacao temporaria e hooks.
- `src/collector`: captura, normalizacao, mascara e parsing.
- `src/reporter`: diagnostico, facts, payload diff e evidencia.
- `src/templates`: HTML, CSS e JavaScript embutidos.
- `src/server`: visualizador local.

## Fronteiras

- Browser Cypress conversa com Node por `cy.task`.
- Arquivos do consumidor nao sao editados.
- HTML standalone pode abrir sem servidor.
- Replay precisa de localhost.

## Fonte completa

```text
packages/faillens/
```
