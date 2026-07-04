# Template: Perfil de Produto para Testes de API

Use este arquivo como checklist ao portar o padrão de API para outro produto.
O objetivo é descobrir o que muda por produto e adaptar poucos arquivos, mantendo o projeto simples.

Você normalmente não chama este arquivo sozinho. O `api-preparador.md` usa este checklist para
preparar a base do projeto, e o `api-criador.md` usa para confirmar que a base está pronta antes
de criar testes de endpoint.

---

## Dados do produto

- Nome:
- Stack:
- Autenticação:
- Status esperado sem token:
- Status esperado com token inválido/malformado:
- Existe forma segura de simular token expirado? Sim/Não
- Existe controle real de permissão por usuário/perfil? Sim/Não
- Existe usuário sem permissão configurado? Sim/Não
- Existe perfil somente leitura? Sim/Não
- Existe isolamento por tenant/cliente? Sim/Não
- Existe paginação? Sim/Não

---

## Contrato de erro

Descubra no backend real, OpenAPI ou respostas reais:

| Pergunta                        | Exemplo produto atual | Exemplo alternativo                    |
| ------------------------------- | --------------------- | -------------------------------------- |
| Onde fica o status no body?     | `status`       | `error.status`, `code`, vazio          |
| Onde fica a mensagem principal? | `message`      | `detail`, `title`, `mensagem`          |
| Onde ficam erros de campo?      | `errors`       | `violations`, `errors.items`, `fields` |
| Onde fica o nome do campo?      | `field`        | `property`, `path`, `campo`            |
| Onde fica a mensagem do campo?  | `message`      | `defaultMessage`, `reason`, `mensagem` |
| Sem autenticação retorna body?  | `vazio`        | `contratoErro`                         |
| Token inválido retorna body?    | `vazio`        | `contratoErro`                         |

Depois de responder, adapte:

- `fixtures/schemas/erro.schema.json`
- `fixtures/schemas/erro-validacao.schema.json`
- `support/assertions/error.assertions.js`
- `support/api/asserts.base.js`

Se o produto não identifica campo em erro de validação, registre como lacuna/bug de contrato.
Não enfraqueça o assert para ignorar isso sem decisão explícita.

---

## Não-vazamento

Use uma base corporativa pequena e adicione sinais específicos do produto:

- `stack`, `stackTrace`, `trace`, `exception`, `innerException`, `sql`, `sqlState`
- `StackTrace`, `Traceback`, `NullPointerException`, `SQLException`
- `TypeError`, `ReferenceError`, `System.NullReferenceException`
- `java.lang`, `org.springframework`, `ORA-00000`, `PLS-00000`

No `support/api/config.js`, adicione os padrões específicos:

```js
vazamento: {
  chavesProibidas: ["codes", "objectName", "rejectedValue"],
  padroesProibidos: ["br.com.empresa", "NomePackageInterno", "MinhaProcedureInterna"],
},
```

Evite padrões genéricos demais, como `table`, `column`, `procedure` ou `package`, sem contexto.
Eles podem causar falso positivo em mensagem legítima de negócio. Prefira nomes reais de pacotes,
procedures, tabelas ou prefixos internos do produto.

---

## Paginação

```js
paginacao: {
  chaves: ["content", "totalElements", "size", "number"],
  itemsKey: "content",
  totalKey: "totalElements",
  sizeKey: "size",
  pageKey: "number",
},
```

Se o produto não pagina, não gere teste de paginação. Se pagina com outro envelope, ajuste as chaves.

---

## Autenticação

`auth.api.js` deve responder:

- como fazer login;
- como guardar/retornar token;
- como montar headers autenticados;
- como montar headers sem autenticação;
- se existe usuário sem permissão.
- como enviar token inválido/malformado de forma segura;
- se existe forma segura de simular token expirado;
- se existe perfil de leitura ou outro perfil restrito para permissões insuficientes;
- se existe tenant/cliente distinto para cenários de isolamento.

Mesmo sem regra explícita no controller/service, endpoints protegidos devem receber cobertura
corporativa de segurança: sem token, token inválido/malformado e integridade de escritas negadas.
Se o produto não tem usuário sem permissão configurado, não gere teste executável de permissão
insuficiente; documente `@cobertura @permissao-insuficiente nao-confirmado`.

---

## Checklist de portabilidade

- [ ] `config.js` descreve produto, stack, contrato de erro, paginação e vazamento.
- [ ] `config.js` descreve status de acesso sem token e, quando conhecido, token inválido.
- [ ] `auth.api.js` autentica no produto real.
- [ ] `auth.api.js` ou o suporte do recurso permite enviar request sem token e com token inválido.
- [ ] Usuário sem permissão/perfil restrito está configurado ou a lacuna está documentada.
- [ ] `erro.schema.json` representa o contrato alvo de erro de negócio/HTTP.
- [ ] `erro-validacao.schema.json` representa o contrato alvo de erro de campo.
- [ ] `error.assertions.js` lê o envelope de erro real/alvo deste produto.
- [ ] Os testes de endpoint usam schema AJV + regra de negócio, não `expect` solto.
