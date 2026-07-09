# Quando Usar Cada Skill

Use esta pagina quando souber o que quer fazer, mas nao tiver certeza de qual skill chamar.

| Situacao | Use | Nao use |
| --- | --- | --- |
| Preparar projeto Cypress/API do zero | `qa-api` | `qa-debug-report` |
| Criar suite oficial para uma API | `qa-api` | `qa-api-fuzz` como substituto |
| Revisar qualidade e cobertura de testes existentes | `qa-api` | `qa-chamado` |
| Gerar relatorio estatico de cobertura | `qa-api` com `qa:report` | `qa:debug` |
| Investigar falha real de execucao Cypress | `qa-debug-report` | `qa:report` como debug |
| Abrir HTML com Replay | `qa-debug-report` com `qa:debug:open` | `file://` quando precisar reenviar request |
| Explorar payloads extremos e robustez | `qa-api-fuzz` | suite oficial sem oraculo |
| Transformar analise em ticket | `qa-chamado` | qualquer skill antes de problemas numerados |
| Validar Graphify e versao travada | `graphify` | instalacao manual sem lock |

## Regras rapidas

- `qa-api` cria o que deve virar suite oficial.
- `qa-api-fuzz` investiga o que pode virar suspeita, lacuna ou futuro teste.
- `qa-debug-report` observa uma execucao real e gera evidencia.
- `qa-chamado` escreve rascunho de ticket a partir de evidencia ja analisada.
- `graphify` da mapa, nao contrato.

## Perguntas de decisao

Se a pergunta for "o que a suite cobre?", use `qa:report`.

Se a pergunta for "por que a execucao falhou?", use `qa:debug`.

Se a pergunta for "essa API aguenta entrada inesperada?", use `qa:fuzz`.

Se a pergunta for "isso deve virar ticket?", use `qa-chamado` depois da analise.
