# Contrato de Metadata

O contrato de metadata e a interface entre agentes, testes e relatorios. Ele define o que a IA deve escrever nos testes para que `qa:report` e FailLens consigam interpretar o oraculo.

## Metadata principal

| Metadata | Onde fica | Consumidor |
| --- | --- | --- |
| `@contrato <id>` | JSDoc do spec | `qa:report`, FailLens |
| `@api METHOD /rota` | JSDoc do spec | matriz endpoint x cenario |
| `@campo` | JSDoc do spec | contrato e cobertura |
| `@regra <id>` | JSDoc do spec | oraculo contratual |
| `@regra:<id>` | tags do `it` | vinculo teste-regra |
| `CatalogoTags.X` | tags do `it` | catalogo de cobertura |
| `@bug` | tags/comentarios | vermelho esperado |
| `phase` | chamadas HTTP | timeline semantica |

## Exemplo

```js
/**
 * @contrato produtos
 * @api POST /produtos
 * @campo codigo {string} required=true unique=true
 * @regra codigo-obrigatorio operation=POST endpoint=/produtos field=codigo condition=missing status=400
 */
describe("API produtos", () => {
  it("deve rejeitar criacao sem codigo", {
    tags: ["@regra:codigo-obrigatorio", CatalogoTags.OBRIGATORIEDADE],
  }, () => {
    // teste
  })
})
```

## Regra de ouro

O agente produz metadata. As ferramentas leem metadata. Nenhuma ferramenta deve inventar contrato ausente.
