# Templates: Cypress Base

Leia quando precisar montar a camada comum de requests, log mascarado e configuracao basica do produto.

---

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

---

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

---

### `support/tags.js`

Use este vocabulário fechado para a tag primária de catálogo em cada `it`. A tag explica por que o
teste existe e alimenta o relatório `qa:report`.

```js
export const CatalogoTags = Object.freeze({
  FLUXO_PRINCIPAL: "@fluxo-principal",
  PAGINACAO: "@paginacao",
  RECURSO_INEXISTENTE: "@recurso-inexistente",
  OBRIGATORIEDADE: "@obrigatoriedade",
  VALOR_LIMITE: "@valor-limite",
  PAYLOAD_EXCESSIVO: "@payload-excessivo",
  TIPO_INVALIDO: "@tipo-invalido",
  REGRA_NEGOCIO: "@regra-negocio",
  CAMPO_DESCONHECIDO: "@campo-desconhecido",
  MASS_ASSIGNMENT: "@mass-assignment",
  ENTRADA_INVALIDA: "@entrada-invalida",
  CONTENT_TYPE_INVALIDO: "@content-type-invalido",
  METODO_NAO_PERMITIDO: "@metodo-nao-permitido",
  SEM_AUTENTICACAO: "@sem-autenticacao",
  CREDENCIAL_INVALIDA: "@credencial-invalida",
  PERMISSAO_INSUFICIENTE: "@permissao-insuficiente",
  OBJECT_LEVEL_AUTHORIZATION: "@object-level-authorization",
  PROPERTY_LEVEL_AUTHORIZATION: "@property-level-authorization",
  IDEMPOTENCIA: "@idempotencia",
  CONCORRENCIA: "@concorrencia",
  RATE_LIMIT: "@rate-limit",
  TIMEOUT: "@timeout",
  RELACIONAMENTO_INEXISTENTE: "@relacionamento-inexistente",
  CAMPO_CONTROLADO: "@campo-controlado",
});
```
