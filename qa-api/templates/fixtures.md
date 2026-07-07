# Templates: Fixtures, Payloads e Hooks

Leia quando precisar montar payloads, dados unicos por execucao, massa de apoio, hooks ou cleanup.

---

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

---

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
