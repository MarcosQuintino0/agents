# Organização dos arquivos de support, schemas e contrato de erro

Parte do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`. Este arquivo reúne as seções de organização do código (que originalmente
eram as seções 7, 8 e 9 do padrão).

## Organização dos arquivos de support

### Por API (`_support/`)

| Arquivo      | Responsabilidade                                                                                                                                              | Não deve conter                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `api.js`     | funções de request de alto nível (criar, buscar, atualizar, excluir, listar). Usa o client genérico.                                                          | assertions, montagem de URL/headers crua, `cy.request` direto, orquestração de cleanup, descoberta de massa por prefixo, exclusão em lote |
| `payload.js` | factories da massa de dados (`valido`, `semCampo`, `comCampo`, limites…). Dados únicos por execução quando o recurso for criável.                             | requests, expects                                                                                                                         |
| `asserts.js` | **só** regra de negócio que o schema não expressa (valor reflete o enviado, id no update). O formato é validado pelo schema.                                  | checagem manual de tipos que o schema já cobre                                                                                            |
| `helpers.js` | hooks (`setupHooks…`), cleanup/restauração, descoberta de ids por prefixo e exclusão em lote para cleanup, `criarRegistroDeTeste` / `registrarParaRestaurar`. | lógica de request duplicada                                                                                                               |

### Genérico (`support/`)

| Arquivo                               | Responsabilidade                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/client.js`                       | monta a request (baseUrl + headers autenticados/anônimos + log) e expõe um `apiRequest({ method, path, body, token, autenticado, failOnError, nome })`. |
| `api/schema.js`                       | `validarContra(nomeSchema, corpo)` — valida o formato contra um schema de `fixtures/schemas` usando ajv.                                                |
| `api/asserts.base.js`                 | `BaseAssert`: `status`, `semConteudo`, `erroNegocio(res, status, mensagem)`, `erroValidacao(res, {campo, mensagem})`, e reexporta os asserts de erro.   |
| `assertions/error.assertions.js`      | o **guard de não-vazamento** (sem stack trace, sem pacote interno) + asserts `semAutenticacao` / `semPermissao`.                                        |
| `assertions/pagination.assertions.js` | contrato de resposta paginada.                                                                                                                          |

### `expect` no spec ou no `asserts.js`?

O `expect` é proibido **apenas** em `api.js` e `payload.js`. No spec e no `asserts.js` ele é
permitido — a regra **não** é "todo `expect` vai para o assert". O que decide onde a validação fica:

- **Extraia para `_support/asserts.js`** quando o `expect` for **(a) repetido entre testes**,
  **(b) uma invariante ou regra de negócio com nome claro** (ex.: "a página está ordenada por X", "o
  filtro só traz inativos", "itens da página casam com `numberOfElements`"), ou **(c) parte de um
  bloco composto repetido** (status + schema + contrato + persistência). Dê um nome que explique a
  intenção (`paginaOrdenadaPor`, `paginaSomente`).
- **Deixe inline no spec** quando o `expect` for **específico daquele cenário e de uso único** e
  quando lê-lo inline tornar o teste mais claro — por exemplo, conferir que a página pedida voltou
  como pedida (`number === 1`, `size === 5`). Isso é o objetivo do teste; esconder atrás de um helper
  só reduziria a clareza.

Não extraia por extrair: helper de uso único, que só embrulha um `expect` e não se repete, adiciona
indireção sem ganho e contraria a `Legibilidade do spec` (o spec deve mostrar a validação principal).

Exemplos de decisão (extrair para `_support/asserts.js` vs manter inline no spec):

| `expect` encontrado | Decisão | Por quê |
| ------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `expect(pagina.content).to.have.length(size)` em vários `it` | **Extrair** → `paginaTemItens(response, size)` | Repete entre testes; invariante com nome claro |
| `expect(item.id).to.eq(idCriado)` em 1 cenário específico | **Manter inline** | É o objetivo do teste; esconder atrás de helper reduziria a clareza |
| Bloco `status + schema + persistência` repetido em 3+ escritas | **Extrair** assert composto → `criacaoPersistida(...)` | Bloco composto que se repete; objeto nomeado é auto-explicativo |
| Helper que só embrulha 1 `expect` de uso único | **Não criar** (manter inline) | Adiciona indireção sem ganho; contraria a legibilidade do spec |

## Schemas: qual usar quando

| Situação                         | Schema                       | Helper                                               |
| -------------------------------- | ---------------------------- | ---------------------------------------------------- |
| Resposta de sucesso              | `<api>.schema.json`          | `validarContra("<api>", body)`                       |
| Erro de negócio (404, 409)       | `erro.schema.json`           | `BaseAssert.validarErroNegocio(res, status, mensagem)`      |
| Erro de validação de campo (400) | `erro-validacao.schema.json` | `BaseAssert.validarErroValidacao(res, { campo, mensagem })` |

O schema valida o **formato**; o `_support/asserts.js` valida a **regra de negócio**.
Schemas de sucesso são **derivados do código do backend** (campos/tipos reais), nunca de suposição.

## Contrato de erro e não-vazamento

O **conceito** é universal; os **sinais** de vazamento mudam por stack e ficam no perfil
`support/api/config.js` (ver `api-preparador.md`), nunca hardcoded no assert.

- **Vazamento** (reprova): stack trace (a chave varia — `trace`/`exception` no Spring, `stack` no
  Express, `stackTrace` no .NET), **namespace/classe/arquivo interno**, **SQL cru**, traceback.
  Tudo isso vem de `apiConfig.vazamento` (`chavesProibidas` + `padroesProibidos`).
- **Não** é vazamento: campos convencionais (motivo HTTP, URL chamada) — podem aparecer.
- Erro de validação (400): envelope **limpo**; idealmente identifica o **campo**.
- Erro de negócio (404/409): **mensagem exata**.
