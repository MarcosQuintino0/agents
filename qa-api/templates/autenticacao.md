# Templates: Autenticacao e Seguranca

Leia quando o endpoint exigir login, token, permissao, bloqueio sem autenticacao ou cenarios de seguranca.

---

### `support/api/auth.api.js`

```js
// Helper de autenticacao para testes de API.
// Centralize aqui login, token e headers para os specs nao conhecerem credenciais.

const headersJson = () => ({ "Content-Type": "application/json" });

export const autenticarUsuarioApi = ({ userLogin, password }) =>
  cy
    .request({
      method: "POST",
      url: Cypress.env("loginUrl"),
      headers: headersJson(),
      body: { userLogin, password },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return response.body.accessToken;
    });

export const autenticarUsuarioPadraoApi = () =>
  autenticarUsuarioApi({
    userLogin: Cypress.env("userLogin"),
    password: Cypress.env("password"),
  }).then((token) => {
    Cypress.env("token", token);
    return token;
  });

export const headersAutenticados = (token = Cypress.env("token")) => ({
  ...headersJson(),
  Authorization: "Bearer " + token,
});

export const headersSemAutenticacao = () => headersJson();
```

---

---

### `seguranca.cy.js`

```js
// Testes de segurança de /<rota>: autenticação e permissão quando aplicável.

import { CatalogoTags } from "../../../support/tags";
import { RecursoApi } from "./_support/api";
import { RecursoPayload } from "./_support/payload";
import { RecursoAssert } from "./_support/asserts";
import { BaseAssert } from "../../../support/api/asserts.base";
import { autenticarUsuarioSemPermissaoApi } from "../../../support/api/auth.api";
import { registrarParaLimpeza, criarRegistroDeTeste, setupHooks } from "./_support/helpers";

describe("API Recurso", () => {
  setupHooks();

  context("Seguranca", () => {
    it(
      "deve bloquear listagem paginada sem autenticacao",
      { tags: [CatalogoTags.SEM_AUTENTICACAO, "@seguranca"] },
      () => {
        // Cobertura corporativa obrigatoria: endpoint protegido nao deve aceitar request sem token.
        RecursoApi.listarPaginadoSemAuth().then((response) => {
          BaseAssert.erro.validarSemAutenticacao(response);
        });
      },
    );

    it(
      "deve bloquear listagem paginada com token invalido",
      { tags: [CatalogoTags.CREDENCIAL_INVALIDA, "@seguranca"] },
      () => {
        // Cobertura corporativa obrigatoria: revisar se este produto diferencia token invalido
        // de token ausente; o oraculo minimo e bloquear e nao vazar detalhes internos.
        RecursoApi.listarPaginadoTokenInvalido().then((response) => {
          BaseAssert.erro.validarSemAutenticacao(response);
        });
      },
    );

    it(
      "deve bloquear criacao sem autenticacao sem persistir o registro",
      { tags: [CatalogoTags.SEM_AUTENTICACAO, "@seguranca"] },
      () => {
        const payload = RecursoPayload.valido();

        RecursoApi.criarSemAuth(payload).then((response) => {
          // Se houver bug e o backend criar mesmo sem token, rastreia antes da assertion para
          // garantir cleanup no afterEach.
          registrarParaLimpeza(response);
          BaseAssert.erro.validarSemAutenticacao(response);
        });
      },
    );

    /*
     * Se o produto nao tiver usuario sem permissao configurado, registre a lacuna no JSDoc:
     * @cobertura @permissao-insuficiente nao-confirmado - falta usuario sem permissao configurado.
     *
     * Opcionalmente deixe um it.skip para visibilidade humana, sem contar como cobertura executavel.
     */
    it.skip(
      "deve bloquear operacao sensivel com usuario sem permissao quando a massa existir",
      { tags: [CatalogoTags.PERMISSAO_INSUFICIENTE, "@seguranca"] },
      () => {
        // Revisar regra de seguranca: este cenario exige usuario sem permissao configurado no produto.
      },
    );

    // Exemplos executaveis de permissao insuficiente: use somente quando a credencial existir.
    it(
      "deve bloquear consulta sem permissao",
      { tags: [CatalogoTags.PERMISSAO_INSUFICIENTE, "@seguranca"] },
      () => {
        // Preparação
        criarRegistroDeTeste().then(({ id }) => {
          autenticarUsuarioSemPermissaoApi().then((tokenSemPermissao) => {
            // Ação
            RecursoApi.buscarPorId(id, { token: tokenSemPermissao, failOnError: false }).then(
              (response) => {
                // Validação
                BaseAssert.erro.validarSemPermissao(response, "GET by id");
              },
            );
          });
        });
      },
    );

    it(
      "deve bloquear criacao sem permissao sem persistir o registro",
      { tags: [CatalogoTags.PERMISSAO_INSUFICIENTE, "@seguranca"] },
      () => {
        // Preparação
        const payload = RecursoPayload.valido();

        autenticarUsuarioSemPermissaoApi().then((tokenSemPermissao) => {
          // Ação
          RecursoApi.criar(payload, { token: tokenSemPermissao, failOnError: false }).then(
            (responseSemPermissao) => {
              // Validação
              // Se o backend criar indevidamente, registra para cleanup antes de provar a
              // persistência incorreta.
              if (responseSemPermissao.body?.id) {
                registrarParaLimpeza(responseSemPermissao);
              }

              if (!responseSemPermissao.body?.id) {
                BaseAssert.erro.validarSemPermissao(responseSemPermissao, "POST");
                return;
              }

              return RecursoApi.buscarPorId(responseSemPermissao.body.id, {
                failOnError: false,
              }).then((consulta) => {
                BaseAssert.validarErroNegocio(consulta, 404, "<mensagem exata do backend>");
                BaseAssert.erro.validarSemPermissao(responseSemPermissao, "POST");
              });
            },
          );
        });
      },
    );

    it(
      "deve bloquear atualização sem permissão sem alterar o registro original",
      { tags: [CatalogoTags.PERMISSAO_INSUFICIENTE, "@seguranca"] },
      () => {
        // Preparação: cria um registro e autentica um usuário sem permissão
        criarRegistroDeTeste().then(({ id, payload }) => {
          autenticarUsuarioSemPermissaoApi().then((tokenSemPermissao) => {
            // Ação: tenta atualizar com o token sem permissão
            RecursoApi.atualizar(id, RecursoPayload.valido(), {
              token: tokenSemPermissao,
              failOnError: false,
            }).then((resposta) => {
              // Validação: bloqueio 403 e registro original preservado
              RecursoApi.buscarPorId(id).then((consulta) => {
                RecursoAssert.preservouOriginal({ consulta, original: { ...payload, id } });
                BaseAssert.erro.validarSemPermissao(resposta, "PUT");
              });
            });
          });
        });
      },
    );

    it(
      "deve bloquear exclusao sem permissao sem remover o registro",
      { tags: [CatalogoTags.PERMISSAO_INSUFICIENTE, "@seguranca"] },
      () => {
        // Preparação: cria um registro e autentica um usuário sem permissão
        criarRegistroDeTeste().then(({ id, payload }) => {
          autenticarUsuarioSemPermissaoApi().then((tokenSemPermissao) => {
            // Ação: tenta excluir com o token sem permissão
            RecursoApi.excluir(id, { token: tokenSemPermissao, failOnError: false }).then(
              (resposta) => {
                // Validação: bloqueio 403 e registro original preservado
                RecursoApi.buscarPorId(id, { failOnError: false }).then((consulta) => {
                  RecursoAssert.preservouOriginal({ consulta, original: { ...payload, id } });
                  BaseAssert.erro.validarSemPermissao(resposta, "DELETE");
                });
              },
            );
          });
        });
      },
    );
  });
});
```
