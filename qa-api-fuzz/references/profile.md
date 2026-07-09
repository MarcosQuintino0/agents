# Fuzz Profile

O Fuzz Profile e o contrato executavel interno da `qa-api-fuzz`. Toda entrada deve virar esse formato:

- OpenAPI 3.x JSON;
- Swagger/OpenAPI 2 JSON;
- profile descoberto por `qa-api`, Graphify, backend real e schemas Cypress.

## Estrutura minima

```json
{
  "profileVersion": "0.1.0",
  "kind": "qa-api-fuzz-profile",
  "api": "users",
  "baseUrl": "http://localhost:3100",
  "source": {
    "type": "qa-api",
    "path": ".agents/state/qa-api/reports/users/coverage.json"
  },
  "defaults": {
    "contentType": "application/json",
    "headers": {},
    "leakagePatterns": ["stack", "SQLException"]
  },
  "operations": []
}
```

## Operation

```json
{
  "id": "post-users",
  "method": "POST",
  "path": "/users",
  "confidence": "observed",
  "evidence": ["qa-api @api POST /users"],
  "auth": {
    "required": "unknown",
    "evidence": []
  },
  "parameters": [],
  "request": {
    "contentType": "application/json",
    "schema": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": false,
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "x-confidence": "confirmed",
          "x-evidence": ["backend validator requireString(name)"]
        }
      }
    },
    "examples": []
  },
  "responses": {
    "201": { "schema": { "type": "object" } },
    "400": { "schemaRef": "cypress/fixtures/schemas/erro-validacao.schema.json" }
  },
  "state": {
    "createsResource": true,
    "idPointer": "/id",
    "cleanup": {
      "method": "DELETE",
      "path": "/users/{id}"
    }
  }
}
```

## Confidence

Use sempre:

- `confirmed`: contrato aprovado, OpenAPI confiavel, validator claro, DTO com anotacao objetiva, regra JSDoc confirmada.
- `observed`: evidenciado por teste, schema de resposta, comportamento observado ou convencao forte, mas ainda nao e regra final.
- `inferred`: inferido por nome, tipo aproximado, modelo de persistencia, rota ou heuristica.
- `unknown`: conhecido como lacuna; nao usar como regra.

Regra: apenas `confirmed` deve gerar finding contratual quando payload invalido for aceito. Os demais geram robustez/suspeita.

## Campos importantes

- `evidence`: lista curta com origem concreta. Sem evidencia, o lint deve avisar.
- `request.schema`: schema de entrada. E mais importante para fuzz do que schema de resposta.
- `responses`: usado para checks simples de schema e content-type.
- `state.cleanup`: obrigatorio para fuzz seguro de operacoes que criam dados.
- `parameters`: descreve path/query/header. Parametro de path sem exemplo enfraquece replay.

## Saidas esperadas

```text
.agents/state/qa-api-fuzz/profiles/<api>.profile.json
.agents/state/qa-api-fuzz/profiles/<api>.profile.md
.agents/state/qa-api-fuzz/profile-lint/<api>/profile-lint.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.json
.agents/state/qa-api-fuzz/reports/<api>/fuzz-report.md
```
