# Templates: Asserts

Leia quando precisar montar asserts genericos ou asserts de regra de negocio especificos do recurso.

---

### `support/api/asserts.base.js`

```js
// Asserts genericos usados pelas suites de API.
// O schema valida formato; asserts especificos validam regra de negocio.

import { validarContra } from "./schema";
import { ErroAssert } from "../assertions/error.assertions";

export const validarStatus = (response, esperado) =>
  expect(response.status, `status HTTP esperado ${esperado}`).to.eq(esperado);

export const validarSemConteudo = (response) => {
  expect(response.status, "deve retornar 204 No Content").to.eq(204);
  expect(response.body, "204 nao deve trazer corpo").to.eq("");
};

export const validarErroValidacao = (response, { campo, mensagem } = {}) => {
  ErroAssert.padrao(response, 400);
  return validarContra("erro-validacao", response.body).then(() => {
    if (!campo) return;
    ErroAssert.deCampo(response, campo, mensagem);
  });
};

export const validarErroNegocio = (response, status, mensagem) => {
  ErroAssert.padrao(response, status);
  return validarContra("erro", response.body).then(() => {
    if (mensagem) expect(response.body.message, "mensagem de erro").to.eq(mensagem);
  });
};

export const BaseAssert = {
  validarStatus,
  validarSemConteudo,
  validarErroValidacao,
  validarErroNegocio,
  status: validarStatus,
  semConteudo: validarSemConteudo,
  erroValidacao: validarErroValidacao,
  erroNegocio: validarErroNegocio,
  contra: validarContra,
  erro: ErroAssert,
};
```

### `support/assertions/pagination.assertions.js`

```js
// Assertions basicas para endpoints paginados.
// As chaves do envelope vem do perfil do produto em config.js.

import { apiConfig } from "../api/config";

export const validarResponsePaginado = (response) => {
  const { paginacao } = apiConfig;
  expect(response.status).to.eq(200);
  expect(response.body).to.include.keys(paginacao.chaves);
  expect(response.body[paginacao.itemsKey]).to.be.an("array");
};
```

### `_support/asserts.js`

```js
// Asserts de regra de negocio do recurso <api>.
// O schema valida formato; aqui ficam apenas valores que devem refletir o payload.

import { validarContra } from "../../../../support/api/schema";
import { BaseAssert } from "../../../../support/api/asserts.base";

export const validarContrato = (body, valoresEsperados, idEsperado) => {
  return validarContra("<api>", body).then(() => {
    // O schema já garantiu o formato; aqui validamos que os valores refletem o payload enviado.
    if (valoresEsperados)
      expect(body.nome, "nome deve refletir o enviado").to.eq(valoresEsperados.nome);
    if (idEsperado !== undefined) expect(body.id, "id deve ser mantido").to.eq(idEsperado);
    return body; // propagado para que criacaoPersistida e atualizacaoPersistida possam encadear
  });
};

export const validarCriado = (response, payload) => {
  expect(response.status, "criação deve retornar 200/201 conforme contrato").to.eq(200);
  return validarContrato(response.body, payload);
};

export const validarAtualizado = (response, payload, idEsperado) => {
  expect(response.status, "atualização deve retornar 200").to.eq(200);
  return validarContrato(response.body, payload, idEsperado);
};

// Sub-funções privadas: o composto chama apenas estas, mantendo uma camada de abstração.

const validarStatusCriacao = (resposta) => BaseAssert.validarStatus(resposta, 200);
const validarSchemaCriacao = (resposta) => validarContra("recurso", resposta.body);
const validarCamposPersistidos = ({ consulta, enviado, id }) =>
  validarContrato(consulta.body, enviado, id);

export const validarCriacaoPersistida = ({ resposta, consulta, enviado }) => {
  validarStatusCriacao(resposta);
  validarSchemaCriacao(resposta);
  validarStatusCriacao(consulta);
  return validarCamposPersistidos({ consulta, enviado, id: resposta.body.id });
};

// `preservado` cobre campos que o backend mantem imutaveis no update (ex.: id e codigo originais).
export const validarAtualizacaoPersistida = ({ resposta, consulta, enviado, preservado = {} }) => {
  const esperado = { ...enviado, ...preservado };
  validarStatusCriacao(resposta);
  validarSchemaCriacao(resposta);
  validarStatusCriacao(consulta);
  return validarContrato(consulta.body, esperado, preservado.id);
};

const validarAusenciaConfirmada = ({ consulta, mensagem }) =>
  BaseAssert.validarErroNegocio(consulta, 404, mensagem);

export const validarExclusaoEAusencia = ({ resposta, consulta, mensagem }) => {
  BaseAssert.validarSemConteudo(resposta);
  return validarAusenciaConfirmada({ consulta, mensagem });
};

// Operacao rejeitada que deve preservar o registro: valida so a preservacao. O erro da operacao
// (negocio 4xx vs sem permissao 403) fica visivel no spec, porque seu formato varia por cenario.
export const validarPreservouOriginal = ({ consulta, original }) => {
  BaseAssert.validarStatus(consulta, 200);
  return validarContrato(consulta.body, original, original.id);
};

// Variante que ja valida o erro de negocio (status + mensagem exata) junto com a preservacao.
export const validarRejeicaoPreservouRegistro = ({
  resposta,
  consulta,
  original,
  status,
  mensagem,
}) =>
  validarPreservouOriginal({ consulta, original }).then(() =>
    BaseAssert.validarErroNegocio(resposta, status, mensagem),
  );

export const RecursoAssert = {
  contrato: validarContrato,
  criado: validarCriado,
  atualizado: validarAtualizado,
  criacaoPersistida: validarCriacaoPersistida,
  atualizacaoPersistida: validarAtualizacaoPersistida,
  exclusaoConfirmada: validarExclusaoConfirmada,
  preservouOriginal: validarPreservouOriginal,
  rejeicaoPreservouRegistro: validarRejeicaoPreservouRegistro,
};
```
