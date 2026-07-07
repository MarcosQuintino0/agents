# Templates: Erros

Leia quando precisar padronizar assertions de erro, vazamento interno, erro de campo ou mensagens contratuais.

---

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
