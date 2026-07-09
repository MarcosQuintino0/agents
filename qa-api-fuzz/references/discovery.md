# Discovery Sem OpenAPI

Use este fluxo quando a API nao tiver Swagger/OpenAPI confiavel. O objetivo nao e adivinhar contrato: e montar um profile rastreavel com `evidence` e `confidence`.

## Ordem das fontes

1. `coverage.json` da `qa-api`, se existir.
2. JSDoc de contrato nos specs Cypress: `@contrato`, `@api`, `@campo`, `@regra`, `@cobertura`.
3. Schemas em `cypress/fixtures/schemas`.
4. Graphify lock e graph como mapa para chegar no backend.
5. Backend real: rotas, handlers, DTOs, validators, middleware, exception handlers.
6. Respostas reais observadas, somente como complemento.

Graphify e mapa, nao contrato final.

## Passos

1. Rodar ou validar `npm run qa:reindex` quando o grafo estiver ausente ou velho.
2. Rodar `npm run qa:report -- --api <api>` se a suite `qa-api` existir.
3. Gerar profile inicial:
   `npm run qa:fuzz:profile -- --api <api> --base-url <url>`.
4. Rodar:
   `npm run qa:fuzz:lint -- --api <api>`.
5. Abrir o backend real para completar lacunas criticas:
   - auth;
   - exemplos de path params;
   - request body;
   - campos obrigatorios;
   - formatos e enums;
   - limites;
   - cleanup;
   - relacionamentos.
6. Manter cada campo com evidencia e confidence.

## Linguagens e sinais

Java/Spring:

- rotas: `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`;
- DTO/validacao: `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@Min`, `@Max`, `@Pattern`, Bean Validation;
- auth: Spring Security, filtros, annotations de permissao.

.NET/ASP.NET:

- rotas: `[Route]`, `[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]`;
- DTO/validacao: `[Required]`, `[StringLength]`, `[MaxLength]`, `[EmailAddress]`, `[Range]`, nullable reference types;
- auth: `[Authorize]`, policies, filters.

Node/Express/Nest:

- rotas: `router.get/post/put/delete`, decorators Nest;
- validacao: Joi, Zod, Yup, class-validator, pipes, middleware customizado;
- auth: guards, middleware, interceptors.

Python/FastAPI:

- rotas: decorators `@router.get`, `@app.post`;
- DTO: Pydantic models, `Field`, validators;
- auth: dependencies, security schemes.

C++/Go/outros:

- usar Graphify e busca textual para rotas;
- procurar structs de request, validators, bindings, middlewares;
- quando faltarem anotacoes, usar `observed` ou `inferred`, nao `confirmed`.

## O que completar manualmente

O profile gerado por ferramenta deve ser tratado como rascunho quando vier de `qa-api`. Completar:

- `baseUrl`;
- headers/auth seguros;
- exemplos para path params;
- schema de entrada para POST/PUT/PATCH;
- cleanup;
- confidence dos campos;
- evidence concreta.

## Anti-padroes

- Assumir `email` por nome do campo sem fonte: use `inferred`.
- Assumir `maxLength` pelo banco sem regra de negocio: use `observed` ou registre lacuna.
- Rodar deep fuzz sem cleanup em POST.
- Promover achado de robustez para bug funcional sem contrato.
