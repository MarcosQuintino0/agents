# Templates: Schemas AJV

Leia quando precisar validar contratos por JSON Schema ou criar schemas em cypress/fixtures/schemas.

---

### `support/api/schema.js`

```js
// Valida respostas por JSON Schema usando schemas em cypress/fixtures/schemas.

import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });
const validadores = new Map();

const obterValidador = (nomeSchema) => {
  if (validadores.has(nomeSchema)) return cy.wrap(validadores.get(nomeSchema), { log: false });
  return cy.fixture(`schemas/${nomeSchema}.schema.json`).then((schema) => {
    const validar = ajv.compile(schema);
    validadores.set(nomeSchema, validar);
    return validar;
  });
};

const formatarErros = (erros) =>
  (erros || []).map((e) => `  - ${e.instancePath || "(raiz)"} ${e.message}`).join("\n");

export const validarContra = (nomeSchema, corpoResposta) =>
  obterValidador(nomeSchema).then((validar) => {
    const valido = validar(corpoResposta);
    expect(
      valido,
      `Resposta deve conformar ao schema "${nomeSchema}":\n${formatarErros(validar.errors)}`,
    ).to.be.true;
    return corpoResposta;
  });
```

### `fixtures/schemas/erro.schema.json`

Derive do contrato alvo do produto. Exemplo:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Erro",
  "description": "Contrato alvo de erro de negocio/HTTP derivado do backend do produto.",
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "message"],
  "properties": {
    "timestamp": { "type": "string" },
    "status": { "type": "integer" },
    "error": { "type": "string" },
    "path": { "type": "string" },
    "detail": { "type": "string" },
    "message": { "type": "string", "minLength": 1 }
  }
}
```

### `fixtures/schemas/erro-validacao.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ErroValidacao",
  "description": "Contrato alvo de erro de validacao de campo. Deve ser limpo e identificar o campo.",
  "type": "object",
  "additionalProperties": false,
  "required": ["status", "message"],
  "properties": {
    "timestamp": { "type": "string" },
    "status": { "type": "integer", "const": 400 },
    "message": { "type": "string", "minLength": 1 },
    "errors": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["field", "message"],
        "properties": {
          "field": { "type": "string", "minLength": 1 },
          "message": { "type": "string", "minLength": 1 }
        }
      }
    }
  }
}
```

### `fixtures/schemas/<api>.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "<Api>Response",
  "description": "Contrato de sucesso derivado do DTO/Response/OpenAPI do backend.",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "nome"],
  "properties": {
    "id": { "type": "integer" },
    "nome": { "type": "string", "minLength": 1 }
  }
}
```
