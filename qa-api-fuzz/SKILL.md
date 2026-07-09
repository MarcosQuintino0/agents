---
name: qa-api-fuzz
description: Cria e executa fuzzing investigativo de APIs usando Swagger/OpenAPI ou um Fuzz Profile gerado a partir de qa-api, Graphify, backend real, schemas Cypress e contratos JSDoc. Use quando o usuario pedir fuzzing/property-based testing de API, aumentar cobertura exploratoria alem dos testes Cypress oficiais, gerar profile de fuzz, rodar qa:fuzz, reproduzir achados de fuzz, ou auditar robustez, vazamento interno, 5xx, mass assignment, payloads extremos e contrato de resposta.
---

# Skill: QA API Fuzz

Use esta skill para explorar APIs com fuzzing sem substituir a `qa-api`.

## Papel

- `qa-api` cria testes Cypress oficiais com regras confirmadas.
- `qa-api-fuzz` cria ou recebe contrato executavel, gera requests variados e registra achados investigativos.
- Achado de fuzz so vira teste Cypress oficial quando houver oraculo confirmado.

## Fluxo

1. Identifique a entrada:
   - Swagger/OpenAPI JSON: gerar profile com `qa:fuzz:profile -- --api <api> --openapi <file>` ou `--swagger <file>`.
   - Swagger/OpenAPI YAML: preferir Schemathesis quando instalado, ou converter para JSON antes do normalizador local.
   - Sem contrato: gerar profile a partir de `qa-api`/Graphify/backend com `qa:fuzz:profile -- --api <api>`.
2. Rode `qa:fuzz:lint -- --api <api>` e revise warnings antes de fuzz profundo.
3. Rode smoke primeiro:
   `npm run qa:fuzz -- --api <api> --mode smoke`.
4. Use `--dry-run` para inspecionar requests e `--verbose` para depurar execucao.
5. Use `--mode deep` ou `--mode stateful` somente quando baseUrl, auth, massa e cleanup estiverem seguros.
6. Reproduza achados com `qa:fuzz:replay`.

## Referencias

Leia sob demanda:

- `references/discovery.md`: como criar profile sem OpenAPI, usando qa-api, Graphify e backend em varias linguagens.
- `references/profile.md`: formato do Fuzz Profile e campos obrigatorios.
- `references/oracles.md`: oraculos, severidade e regra para promover achados para Cypress.

## Ferramentas

```bash
npm run qa:fuzz:profile -- --api users
npm run qa:fuzz:lint -- --api users
npm run qa:fuzz -- --api users --mode smoke
npm run qa:fuzz -- --api users --dry-run --max-cases 10
npm run qa:fuzz:replay -- --report .agents/state/qa-api-fuzz/reports/users/fuzz-report.json --finding F001
```

Headers:

```bash
npm run qa:fuzz -- --api users --header "Authorization: Bearer <token>"
```

Ou:

```bash
QA_FUZZ_AUTH_HEADER="Authorization: Bearer <token>" npm run qa:fuzz -- --api users
```

## Regras

- Nao invente regra funcional para transformar robustez em bug.
- Sempre preserve `evidence` e `confidence` no profile.
- `confirmed` permite finding contratual; `observed` e `inferred` produzem suspeita/robustez.
- Nao rode deep fuzz contra ambiente compartilhado sem cleanup e massa segura.
- Nao exponha token, cookie ou credenciais em reports.
- Se a API cria dados, configure cleanup antes de recomendar pipeline.
