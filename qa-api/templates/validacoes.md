# Templates: Validacoes de Entrada

Leia quando precisar cobrir obrigatoriedade, nulos, limites, tipos, enums, mensagens contratuais ou testes data-driven de validacao.

---

### `validacoes.cy.js`

```js
// Validacoes de entrada de /<rota>: obrigatorios, nulos, limites e tipos.
// Cenários com bug real do backend devem ficar @bug, sem enfraquecer os asserts.
// Ao usar @bug, documente o comportamento atual, o esperado e por que o teste permanece vermelho.

import { RecursoApi } from "./_support/api";
import { RecursoPayload } from "./_support/payload";
import { BaseAssert } from "../../../support/api/asserts.base";
import { registrarParaLimpeza, setupHooks } from "./_support/helpers";

describe("API Recurso", () => {
  setupHooks();

  context("Validacoes de entrada", () => {
    // Data-driven sobre array LITERAL: o vínculo `@regra:${regra}` só é capturado
    // estaticamente quando o `.forEach` opera sobre o array inline (não uma const).
    [
      {
        descricao: "o campo campo2 estiver ausente",
        payload: () => RecursoPayload.semCampo("campo2"),
        campo: "campo2",
        regra: "campo2-obrigatorio",
        mensagem: "<msg exata>",
      },
    ].forEach(({ descricao, payload, campo, regra, mensagem }) => {
      it(
        `deve retornar 400 quando ${descricao}`,
        { tags: [CatalogoTags.OBRIGATORIEDADE, `@regra:${regra}`, "@bug"] },
        () => {
          RecursoApi.criar(payload(), { failOnError: false }).then((response) => {
            registrarParaLimpeza(response);
            BaseAssert.validarErroValidacao(response, { campo, mensagem });
          });
        },
      );
    });
  });
});
```

Regras dos exemplos: `@api` ocupa uma única linha; `operation` e `condition` são obrigatórios em
`@regra`; `field`, `status`, `message` e `persistence` são condicionais. Cada teste contratual usa
exatamente um `@regra:<id>`, enquanto happy-path sem regra confirmada usa somente `CatalogoTags`.
Títulos resolvidos devem ser únicos no spec. Em mensagens contratuais, escreva aspas internas como
`message="Campo \"nome\" inválido"` e nunca quebre o valor em mais de uma linha.
