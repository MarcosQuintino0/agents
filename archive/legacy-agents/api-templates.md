# Agente: Templates de Código — Testes de API (Cypress)

Esqueletos para montar a camada de support e a suíte de uma API. Regras no `api-pattern.md`.

## Como usar estes templates

- Copie a estrutura, não o contrato do produto.
- O projeto de referência pode ser Java/Spring, .NET, PL/SQL, Node etc. O código do projeto deve
  ficar específico e simples para aquele produto. Os exemplos aqui são ilustrativos; adapte-os ao
  contrato real do backend em uso.
- Ao portar para outro produto, adapte `config.js`, `auth.api.js`, os schemas de erro e os asserts
  de erro. Não crie abstração extra se um arquivo direto for mais fácil de entender.
- `expect` é permitido para regra de negócio, mas nunca substitui schema AJV.
- Mantenha comentários úteis: responsabilidade do arquivo, origem do contrato, motivo de cleanup,
  motivo de `@bug` e decisões não óbvias. Não comente linha óbvia.

---

# A. Núcleo simples

### `support/api/client.js`

```js
// Cliente HTTP generico das APIs. Centraliza baseUrl, headers, log e failOnError.

import { apiConfig } from "./config";
import { headersAutenticados, headersSemAutenticacao } from "./auth.api";
import { requestApiComLog } from "./requestLogger.api";

export const montarUrl = (path) => apiConfig.baseUrl + path;

export const apiRequest = ({
  method,
  path,
  body,
  token,
  autenticado = true,
  failOnError = true,
  nome,
}) =>
  requestApiComLog(
    {
      method,
      url: montarUrl(path),
      headers: autenticado ? headersAutenticados(token) : headersSemAutenticacao(),
      ...(body !== undefined ? { body } : {}),
    },
    { nome: nome || `${method} ${path}`, failOnError },
  );
```

### `support/api/requestLogger.api.js`

Parte **portável** do padrão: executa o `cy.request` com `log: false`, **mascara credenciais** antes
de aparecerem no runner e **falha automaticamente** em 4xx/5xx quando o teste não marcou erro
esperado (`failOnError`). É isto que todo produto precisa.

A **geração de `report.json`** (tasks `apiLog:*`, flag `LOG_REPORT` e cURL reproduzível) **não** faz
parte do template genérico: ela depende de `cy.task` registrados no `cypress.config` e existe para
alimentar o `api-analisador`. É um **add-on específico do produto**. Ao portar para outro
produto, comece pelo wrapper abaixo; só adicione o report se aquele produto também tiver as tasks e
quiser usar o analisador de relatório.

```js
// Wrapper central de requests de API (portável entre produtos).
// Responsabilidades: cy.request com log: false, mascaramento de credenciais e failOnError.
// NÃO gera report.json — isso é add-on específico do produto (ver nota acima).

const CAMPOS_SENSIVEIS = [
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "senha",
  "accessToken",
  "refreshToken",
  "token",
];

const isCampoSensivel = (campo) =>
  CAMPOS_SENSIVEIS.some((s) => String(campo).toLowerCase().includes(s.toLowerCase()));

const mascararTextoSensivel = (valor) =>
  valor.replace(/((?:access_token|refresh_token|token|password|senha)=)([^&\s'"]+)/gi, "$1***");

const mascararDadosSensiveis = (valor) => {
  if (typeof valor === "string") return mascararTextoSensivel(valor);
  if (Array.isArray(valor)) return valor.map(mascararDadosSensiveis);
  if (valor && typeof valor === "object") {
    return Object.entries(valor).reduce((acc, [campo, conteudo]) => {
      acc[campo] = isCampoSensivel(campo) ? "***" : mascararDadosSensiveis(conteudo);
      return acc;
    }, {});
  }
  return valor;
};

export const requestApiComLog = (requestOptions, { nome = "API", failOnError = true } = {}) => {
  const requestComControleDeErro = {
    ...requestOptions,
    failOnStatusCode: false,
    log: false,
  };
  const requestMascarada = mascararDadosSensiveis(requestComControleDeErro);

  Cypress.log({
    name: "API REQUEST",
    displayName: "API REQ",
    message: `${requestOptions.method} ${nome}`,
    consoleProps: () => ({ request: requestMascarada }),
  });

  return cy.request(requestComControleDeErro).then((response) => {
    const responseMascarada = mascararDadosSensiveis({
      status: response.status,
      headers: response.headers,
      body: response.body,
    });

    Cypress.log({
      name: "API RESPONSE",
      displayName: "API RES",
      message: `${response.status} ${nome}`,
      consoleProps: () => ({ response: responseMascarada }),
    });

    if (failOnError && response.status >= 400) {
      expect(response.status, `${nome} deve retornar status menor que 400`).to.be.lessThan(400);
    }
    return response;
  });
};
```

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

### `support/assertions/error.assertions.js`

Adapte este arquivo ao contrato de erro do produto. O exemplo abaixo assume:

```json
{ "status": 400, "message": "Dados invalidos", "errors": [{ "field": "nome", "message": "..." }] }
```

```js
// Assertions reutilizaveis para respostas de erro deste produto.
// Adapte este arquivo quando o envelope de erro do produto for diferente.

import { apiConfig } from "../api/config";

const { statusSemAutenticacao, statusCredencialInvalida, statusSemPermissao, vazamento } =
  apiConfig;

const temCorpo = (body) => body !== undefined && body !== null && body !== "";
const corpoComoTexto = (body) =>
  !temCorpo(body) ? "" : typeof body === "string" ? body : JSON.stringify(body);

const contemChaveProibida = (valor, chaveProibida) => {
  if (!valor || typeof valor !== "object") return false;
  if (Array.isArray(valor)) return valor.some((item) => contemChaveProibida(item, chaveProibida));
  return Object.entries(valor).some(
    ([chave, conteudo]) =>
      chave.toLowerCase() === String(chaveProibida).toLowerCase() ||
      contemChaveProibida(conteudo, chaveProibida),
  );
};

export const validarNaoVazaInterno = (response) => {
  if (!temCorpo(response.body)) return;

  expect(response.headers["content-type"] || "", "erro deve ser JSON").to.contain(
    "application/json",
  );
  expect(response.body, "erro deve ser objeto JSON, nao HTML/texto/stack").to.be.an("object");

  (vazamento.chavesProibidas || []).forEach((campo) => {
    expect(contemChaveProibida(response.body, campo), `nao deve expor ${campo}`).to.be.false;
  });

  const corpo = corpoComoTexto(response.body);
  (vazamento.padroesProibidos || []).forEach((padrao) => {
    const vazou = padrao instanceof RegExp ? padrao.test(corpo) : corpo.includes(padrao);
    expect(vazou, `nao deve vazar interno: ${padrao}`).to.be.false;
  });
};

export const validarErroPadrao = (response, statusEsperado) => {
  expect(response.status).to.eq(statusEsperado);
  if (!temCorpo(response.body)) return;

  validarNaoVazaInterno(response);
  expect(response.body.status, "body.status").to.eq(statusEsperado);
  expect(response.body.message, "body.message").to.be.a("string").and.not.be.empty;
};

export const validarErroDeCampo = (response, campo, mensagem) => {
  validarErroPadrao(response, 400);
  expect(response.body.errors, "errors deve identificar campos invalidos").to.be.an("array").and.not
    .be.empty;

  const erro = response.body.errors.find((item) => item.field === campo);
  expect(erro, `erro do campo ${campo}`).to.exist;
  if (mensagem) expect(erro.message, `mensagem do campo ${campo}`).to.eq(mensagem);
};

export const validarSemAutenticacao = (response) => {
  expect(response.status, "sem autenticação deve ser bloqueado").to.be.oneOf(statusSemAutenticacao);
};

export const validarCredencialInvalida = (response) => {
  expect(response.status, "credencial invalida deve ser bloqueada").to.be.oneOf(
    statusCredencialInvalida || statusSemAutenticacao,
  );
  if (temCorpo(response.body)) validarNaoVazaInterno(response);
};

export const validarSemPermissao = (response, operacao) => {
  expect(response.status, `${operacao} sem permissão`).to.be.oneOf(statusSemPermissao);
  if (temCorpo(response.body)) validarNaoVazaInterno(response);
};

export const validarMensagemExata = (response, texto) => {
  validarNaoVazaInterno(response);
  expect(response.body.message, "mensagem de erro").to.eq(texto);
};

export const ErroAssert = {
  validarNaoVazaInterno,
  validarErroPadrao,
  validarErroDeCampo,
  validarSemAutenticacao,
  validarSemPermissao,
  validarMensagemExata,
};
```

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

---

# B. Adapter do produto

### `support/api/config.js`

```js
// Configuracoes especificas do produto atual.
// Ao portar para outro produto, ajuste sem tornar o projeto mais complexo que o necessario.

export const apiConfig = {
  baseUrl: Cypress.env("apiBaseUrl") || "http://localhost:8080/",
  statusSemAutenticacao: [401, 403],
  statusCredencialInvalida: [401, 403],
  statusSemPermissao: [403],
  paginacao: {
    chaves: ["content", "totalElements", "size", "number"],
    itemsKey: "content",
    totalKey: "totalElements",
    sizeKey: "size",
    pageKey: "number",
  },
  vazamento: {
    chavesProibidas: ["stack", "stackTrace", "trace", "exception"],
    padroesProibidos: [/Traceback/i, /NullPointerException/i, /SQLException/i],
  },
};
```

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

# C. Schemas

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

---

# D. Esqueletos por API

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

### `_support/payload.js`

```js
// Factories de payload do recurso <api>.
// Dados unicos por execucao reduzem colisao e facilitam cleanup por prefixo.

import { fakerPT_BR as faker } from "@faker-js/faker";

export const PREFIXO = "QA API Recurso";

export const nomeUnico = (sufixo = "") =>
  `${PREFIXO}${sufixo ? " " + sufixo : ""} ${Date.now()}-${faker.string.numeric(5)}`;

const valido = (sobrescritas = {}) => ({ nome: nomeUnico(), ...sobrescritas });
const semCampo = (campo, sobrescritas = {}) => {
  const payload = valido(sobrescritas);
  delete payload[campo];
  return payload;
};
const comCampo = (campo, valor, sobrescritas = {}) => valido({ ...sobrescritas, [campo]: valor });

export const RecursoPayload = { valido, semCampo, comCampo };
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

export const validarCriacaoEPersistencia = ({ resposta, consulta, enviado }) => {
  validarStatusCriacao(resposta);
  validarSchemaCriacao(resposta);
  validarStatusCriacao(consulta);
  return validarCamposPersistidos({ consulta, enviado, id: resposta.body.id });
};

// `preservado` cobre campos que o backend mantem imutaveis no update (ex.: id e codigo originais).
export const validarAtualizacaoEPersistencia = ({ resposta, consulta, enviado, preservado = {} }) => {
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

### `_support/helpers.js`

```js
// Utilitários da suite <api>: autenticação, massa de apoio e cleanup.

import { autenticarUsuarioPadraoApi } from "../../../../support/api/auth.api";
import { RecursoApi } from "./api";
import { PREFIXO, RecursoPayload } from "./payload";

let idsRegistradosParaLimpeza = [];

export const registrarParaLimpeza = (response) => {
  // Registra antes das assertions: se o teste falhar depois da criação, o cleanup ainda roda.
  if (response.body?.id) idsRegistradosParaLimpeza.push(response.body.id);
  return response;
};

export const removerDaListaDeLimpeza = (id) => {
  idsRegistradosParaLimpeza = idsRegistradosParaLimpeza.filter((item) => item !== id);
};

export const criarRegistroDeTeste = (sobrescritas = {}) => {
  const payload = RecursoPayload.valido(sobrescritas);
  return RecursoApi.criar(payload)
    .then(registrarParaLimpeza)
    .then((response) => {
      // Guarda do pré-requisito: garante que a massa de apoio existe antes de o teste avançar.
      expect(response.status, "massa de apoio deve retornar sucesso").to.be.oneOf([200, 201]);
      expect(response.body, "massa de apoio deve ter id").to.have.property("id");
      return { response, id: response.body.id, payload };
    });
};

// Helpers agregadores: combinam setup + ação principal para reduzir o aninhamento `.then` no spec
// quando o teste encadearia criar + atualizar/excluir + rebuscar. Não chamam registrarParaLimpeza
// (o cleanup já foi feito por criarRegistroDeTeste). Use só quando o encadeamento for profundo.
// `montarPayload` recebe a `criacao` e devolve o payload de atualização (útil quando o payload
// depende de valores que só existem após a criação, ex.: um código divergente do original).
export const criarEAtualizar = (montarPayload) =>
  criarRegistroDeTeste().then((criacao) => {
    const payloadAtualizado = montarPayload(criacao);
    return RecursoApi.atualizar(criacao.body.id, payloadAtualizado).then((resposta) => ({
      criacao,
      resposta,
      payloadAtualizado,
    }));
  });

export const criarEExcluir = (sobrescritas = {}) =>
  criarRegistroDeTeste(sobrescritas).then((criacao) =>
    RecursoApi.excluir(criacao.body.id).then((resposta) => ({ criacao, resposta }))
  );

// Varre todas as páginas filtrando pelo prefixo da suite para identificar registros criados por
// runs anteriores que não foram limpos (ex.: falha antes do afterEach).
const buscarIdsCriadosPelaSuite = () =>
  RecursoApi.listarPaginado({ failOnError: false }).then((response) => {
    if (response.status !== 200) return [];
    return response.body.content
      .filter((item) => item.nome?.startsWith(PREFIXO))
      .map((item) => item.id);
  });

const excluirIds = (ids) => {
  // O mesmo id pode entrar via registrarParaLimpeza() e via buscarIdsCriadosPelaSuite(); o Set evita DELETE duplo.
  const idsUnicos = [...new Set((ids || []).filter(Boolean))];
  if (!idsUnicos.length) return cy.wrap(null, { log: false });

  return cy
    .wrap(idsUnicos, { log: false })
    .each((id) => RecursoApi.excluir(id, { failOnError: false }));
};

export function setupHooks() {
  before(() => {
    autenticarUsuarioPadraoApi().then(() => {
      buscarIdsCriadosPelaSuite().then(excluirIds);
    });
  });

  beforeEach(() => {
    idsRegistradosParaLimpeza = [];
  });

  afterEach(() => {
    const ids = [...idsRegistradosParaLimpeza];
    idsRegistradosParaLimpeza = [];
    return excluirIds(ids);
  });
}
```

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
