# Templates: CRUD

Leia quando precisar criar cliente do recurso, specs CRUD, persistencia, listagem ou integridade de escrita rejeitada.

---

### `_support/api.js`

```js
// Cliente HTTP do recurso <api>. Specs chamam estas funcoes em vez de cy.request direto.

import { apiRequest } from "../../../../support/api/client";

const PATH = "<rota>/";
const PATH_PAGED = "<rota>/paged";

export const criar = (payload, { token, failOnError = true } = {}) =>
  apiRequest({
    method: "POST",
    path: PATH,
    body: payload,
    token,
    failOnError,
    nome: "POST /<rota>",
  });

export const buscarPorId = (id, { token, failOnError = true } = {}) =>
  apiRequest({
    method: "GET",
    path: PATH + id,
    token,
    failOnError,
    nome: `GET /<rota>/${id}`,
  });

export const atualizar = (id, payload, { token, failOnError = true } = {}) =>
  apiRequest({
    method: "PUT",
    path: PATH + id,
    body: payload,
    token,
    failOnError,
    nome: `PUT /<rota>/${id}`,
  });

export const excluir = (id, { token, failOnError = true } = {}) =>
  apiRequest({
    method: "DELETE",
    path: PATH + id,
    token,
    failOnError,
    nome: `DELETE /<rota>/${id}`,
  });

export const listarPaginado = ({ token, failOnError = true } = {}) =>
  apiRequest({
    method: "GET",
    path: PATH_PAGED,
    token,
    failOnError,
    nome: "GET /<rota>/paged",
  });

export const listarPaginadoSemAuth = () =>
  apiRequest({
    method: "GET",
    path: PATH_PAGED,
    autenticado: false,
    failOnError: false,
    nome: "GET /<rota>/paged sem auth",
  });

export const listarPaginadoTokenInvalido = () =>
  apiRequest({
    method: "GET",
    path: PATH_PAGED,
    token: "token-invalido-para-teste",
    failOnError: false,
    nome: "GET /<rota>/paged com token invalido",
  });

export const criarSemAuth = (payload) =>
  apiRequest({
    method: "POST",
    path: PATH,
    body: payload,
    autenticado: false,
    failOnError: false,
    nome: "POST /<rota> sem auth",
  });
```

---

### `crud.cy.js`

Os specs abaixo demonstram a hierarquia e a nomenclatura definidas no `api-pattern.md`.
Use comentários Preparação/Ação/Validação conforme os critérios objetivos do `api-pattern.md`: eles
são obrigatórios em cenários com preparação, múltiplas chamadas, verificação de persistência ou
integridade e fluxos alternativos; são opcionais somente em testes curtos e diretos.

```js
import { RecursoApi } from "./_support/api";
import { RecursoPayload } from "./_support/payload";
import { RecursoAssert } from "./_support/asserts";
import { CatalogoTags } from "../../../support/tags";
import { BaseAssert } from "../../../support/api/asserts.base";
import { validarResponsePaginado } from "../../../support/assertions/pagination.assertions";
import { registrarParaLimpeza, removerDaListaDeLimpeza, criarRegistroDeTeste, setupHooks } from "./_support/helpers";

/**
 * @contrato <id-kebab-da-api>
 *
 * @api    POST /<rota> | GET /<rota>/{id} | PUT /<rota>/{id} | DELETE /<rota>/{id}
 *
 * @resumo <descrição do recurso no domínio>
 *
 * @campo campo1 {number}  required=true min=1 max=99 unique=true immutable=true
 * @campo campo2 {string}  required=true maxLength=50
 * @campo campo3 {enum}    required=true values="A,B" rejects=C
 * @campo campo4 {boolean} required=true filterable=true
 *
 * @regra campo2-obrigatorio operation=POST field=campo2 condition=missing status=400 message="<mensagem exata>"
 * @regra recurso-inexistente operation=GET field=id condition=not-found status=404 message="<mensagem exata>"
 * @regra campo1-duplicado operation=POST field=campo1 condition=duplicate status=409 persistence=forbidden message="<mensagem exata>"
 * @regra update-ignora-campo1 operation=PUT field=campo1 condition=immutable
 * @regra campo3-tipo-invalido operation=POST field=campo3 condition=invalid-enum status=400
 *
 * @permissao authentication=required
 */
describe("API Recurso", () => {
  setupHooks();

  context("CRUD", () => {
    it("deve criar recurso com nome valido e persistir os dados", { tags: [CatalogoTags.FLUXO_PRINCIPAL] }, () => {
      // Preparação: monta o payload válido
      const payload = RecursoPayload.valido();

      // Ação: cria o recurso
      RecursoApi.criar(payload).then((resposta) => {
        registrarParaLimpeza(resposta);

        // Validação: busca de novo e confirma que persistiu
        RecursoApi.buscarPorId(resposta.body.id).then((consulta) => {
          RecursoAssert.criacaoPersistida({ resposta, consulta, enviado: payload });
        });
      });
    });

    it("deve atualizar recurso existente e persistir os novos dados", () => {
      // Preparação: cria um registro e monta o update
      criarRegistroDeTeste().then(({ id }) => {
        const payloadAtualizado = RecursoPayload.valido();

        // Ação: atualiza o recurso
        RecursoApi.atualizar(id, payloadAtualizado).then((resposta) => {
          // Validação: busca de novo e confirma que persistiu, mantendo o id
          RecursoApi.buscarPorId(id).then((consulta) => {
            RecursoAssert.atualizacaoPersistida({
              resposta,
              consulta,
              enviado: payloadAtualizado,
              preservado: { id },
            });
          });
        });
      });
    });

    it("deve confirmar ausência do registro ao excluir recurso existente", () => {
      // Preparação: cria uma massa de apoio
      criarRegistroDeTeste().then(({ id }) => {
        // Ação: exclui o recurso
        RecursoApi.excluir(id).then((resposta) => {
          removerDaListaDeLimpeza(id);

          // Validação: reconsulta e confirma que o registro deixou de existir
          RecursoApi.buscarPorId(id, { failOnError: false }).then(
            (consulta) => {
              RecursoAssert.exclusaoConfirmada({
                resposta,
                consulta,
                mensagem: "<mensagem exata do backend>",
              });
            },
          );
        });
      });
    });

    // Este exemplo pressupõe filtro ou ordenação que garanta o registro criado na página consultada.
    it("deve listar o registro criado na página consultada", () => {
      // Preparação: cria um registro que deve aparecer na página
      criarRegistroDeTeste().then(({ id, payload }) => {
        // Ação: lista a página
        RecursoApi.listarPaginado().then((response) => {
          // Validação: envelope coerente e registro criado presente
          validarResponsePaginado(response);
          response.body.content.forEach((item) => RecursoAssert.contrato(item));

          const registroCriado = response.body.content.find((item) => item.id === id);
          expect(registroCriado, "página deve conter o registro criado").to.exist;
          RecursoAssert.contrato(registroCriado, payload, id);
        });
      });
    });
  });

  context("Regras de negocio", () => {
    it(
      "deve retornar 404 ao consultar id inexistente",
      { tags: [CatalogoTags.RECURSO_INEXISTENTE, "@regra:recurso-inexistente"] },
      () => {
        RecursoApi.buscarPorId(2147483647, { failOnError: false }).then((response) => {
          BaseAssert.validarErroNegocio(response, 404, "<mensagem exata do backend>");
        });
      },
    );
  });
});
```

Em qualquer escrita rejeitada que possa alterar dados, mantenha o fluxo visível no spec:

```text
executar escrita invalida
-> consultar novamente com credencial autorizada
-> confirmar que o estado original foi preservado
-> validar o erro esperado da escrita
```

Não crie um teste separado apenas para essa consulta de integridade; ela faz parte do próprio
cenário negativo.

Ao procurar um registro criado dentro de uma listagem paginada, use filtro ou ordenação
determinística que garanta sua presença na página consultada. Se a API não oferecer essa garantia,
não presuma que o registro estará na primeira página: valide envelope, itens e regras de paginação
com um oráculo compatível com o contrato real.
