# Comentários e documentação viva

Parte do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`.

Arquivos gerados devem ter comentários úteis, como no projeto atual, mas sem excesso.

Use comentários para explicar:

- a **responsabilidade do arquivo** no topo (`api.js`, `payload.js`, `asserts.js`, `helpers.js`,
  specs e helpers compartilhados);
- decisões que não são óbvias, como cleanup por prefixo, restauração de config global, uso de
  GraphQL para limpeza, ids dependentes, status real diferente do ideal, ou `@bug`;
- de onde veio o contrato do schema (`derivado de Response.java`, OpenAPI, DTO, exception handler);
- por que um teste fica vermelho de propósito (`@bug`) e qual comportamento correto ele exige.

## Categorias de comentário obrigatório nos arquivos `_support`

As seis situações abaixo **sempre exigem comentário de 1 linha** nos arquivos `_support`, mesmo
quando o nome da constante ou função já é descritivo. Elas cobrem decisões que um leitor não
consegue deduzir lendo só o código.

### 1. Constantes que refletem restrição de domínio do produto

Constantes cujo valor vem de uma regra de negócio — não de uma escolha técnica — precisam dizer
de onde vem a restrição. O nome não basta porque o leitor não sabe se o valor é arbitrário ou
imposto pelo produto. Todo valor de limite, restrição ou sentinela derivado do backend DEVE citar a
fonte no comentário (`@Max`, `@Size`, DTO, exception handler, OpenAPI). Não basta o número; o leitor
precisa saber de onde veio para confiar e para atualizar quando o contrato mudar.

```js
// ruim: de onde vem o 99? é limite do banco, da UI, do DTO?
export const CODIGO_MAXIMO = 99;

// bom: deixa claro que é o limite declarado no DTO do backend
// Limite declarado no DTO: @Max(99) no campo codigo.
export const CODIGO_MAXIMO = 99;

// bom: explica por que o array começa em 4
// Códigos 1–3 são reservados pelo produto e não podem ser usados em testes.
const CODIGOS_CRIAVEIS = Array.from({ length: 96 }, (_, i) => i + 4);
```

### 2. Constantes sentinela (valores impossíveis para forçar 404)

Valores como `Integer.MAX_VALUE` usados como ID ou código inexistente não são óbvios pelo número.
O comentário deve explicar a estratégia e, quando o valor viola uma constraint de domínio (ex.:
código > 99), o que o endpoint retorna e por quê.

```js
// ruim: 2147483647 parece arbitrário
const ID_INEXISTENTE = 2147483647;

// bom: explica a estratégia e a garantia
// Integer.MAX_VALUE — id que nunca existirá no banco sem depender de estado externo.
const ID_INEXISTENTE = 2147483647;

// bom: explica o que muda quando o valor viola o domínio
// Maior que CODIGO_MAXIMO: a maioria dos endpoints retorna 404 por ausência, mas alguns podem
// retornar 400 por validação; ajuste conforme o contrato do endpoint testado.
const CODIGO_INEXISTENTE = 2147483647;
```

### 3. Helpers técnicos que substituem a forma mais simples

Quando o código usa uma forma defensiva em vez da mais direta, o comentário deve dizer qual
cenário a forma simples quebraria.

```js
// ruim: por que não "campo in objeto"?
const possuiCampo = (objeto, campo) =>
  Object.prototype.hasOwnProperty.call(objeto, campo);

// bom: explica o problema com a alternativa simples
// Evita falso positivo com propriedades herdadas do prototype (ex.: "toString", "constructor").
const possuiCampo = (objeto, campo) =>
  Object.prototype.hasOwnProperty.call(objeto, campo);

// ruim: por que new Set() se ids já deveria ser único?
const idsUnicos = [...new Set((ids || []).filter(Boolean))];

// bom: explica o cenário de duplicação
// O mesmo id pode entrar na lista via registrarParaLimpeza() + before(); o Set evita DELETE duplo.
const idsUnicos = [...new Set((ids || []).filter(Boolean))];
```

### 4. Sequência crítica com consequência de inversão

Quando a **ordem** das operações importa por razão não óbvia, o comentário vai no ponto de uso
— não apenas na definição da função — dizendo o que quebra se a ordem for invertida.

```js
// ruim: por que registrarParaLimpeza antes de fazer qualquer validação?
AlegacaoAnsApi.criar(payload).then((resposta) => {
  registrarParaLimpeza(resposta);
  // ...assertions
});

// bom: a razão da ordem está no ponto de uso
AlegacaoAnsApi.criar(payload).then((resposta) => {
  // Registra antes das assertions: se o teste falhar depois da criação, o cleanup ainda roda.
  registrarParaLimpeza(resposta);
  // ...assertions
});
```

Para assertions dentro de funções de setup, explicar que é uma guarda — não um teste funcional:

```js
// bom: deixa claro que a assertion garante o pré-requisito do teste, não o comportamento da API
expect(response.body, "massa de apoio deve ter id antes de continuar").to.have.property("id");
```

### 5. Filtros defensivos em query string ou request

Quando um filtro existe para proteger contra comportamento inesperado do backend, o comentário
deve dizer o que aconteceria sem ele.

```js
// ruim: por que filtrar undefined, null e ""?
.filter(([, valor]) => valor !== undefined && valor !== null && valor !== "")

// bom: explica a consequência de não filtrar
// Sem o filtro, parâmetros omitidos virariam strings "undefined" na query e o backend os trataria
// como filtro ativo, quebrando consultas que deveriam ignorar o parâmetro.
.filter(([, valor]) => valor !== undefined && valor !== null && valor !== "")
```

### 6. `return` em chains Cypress para propagar valor

O Cypress enfileira comandos automaticamente; `return` dentro de `.then()` só é necessário quando
o valor precisa ser propagado para que o chamador encadeie. Quando isso ocorrer, o comentário deve
dizer por que o retorno é necessário.

```js
// ruim: não fica claro por que retorna body
const contrato = (body, esperado) =>
  validarContra("recurso", body).then(() => {
    validarValores(body, esperado);
    return body;
  });

// bom: esclarece que o retorno é para quem encadeia
const contrato = (body, esperado) =>
  validarContra("recurso", body).then(() => {
    validarValores(body, esperado);
    return body; // propagado para que criacaoPersistida e atualizacaoPersistida possam encadear
  });
```

### 7. Chamada de helper cujo efeito colateral não é evidente no ponto de uso

Quando uma função de helper tem efeito colateral (muta lista, agenda limpeza, restaura estado) que
não é visível no call site, o comentário deve dizer qual é o efeito e por que ele é necessário ali.

```js
// ruim: o nome não revela que muta uma lista interna
registrarParaLimpeza(resposta);

// bom: diz o efeito e a razão da ordem
// Registra antes das assertions: se o teste falhar depois, o afterEach ainda limpa o recurso.
registrarParaLimpeza(resposta);

// bom: registra a remoção de um id já excluído pelo teste
// O registro já foi excluído pelo teste: remove o id da lista para o afterEach não re-deletar.
removerDaListaDeLimpeza(id);
```

## Bloco de contrato acima do `describe`

Todo `crud.cy.js` deve conter um bloco JSDoc estruturado imediatamente acima do `describe`, após
os imports, que funciona como sumário navegável do contrato da API. `validacoes.cy.js` e
`seguranca.cy.js` mantêm apenas a linha descritiva de 1 linha — o contrato completo está no crud.

O bloco usa as seguintes tags, nesta ordem. A gramática atual é **`chave=valor`**: legível por humanos
e parseável de forma determinística pelo gerador de cobertura e pelo FailLens. Valores com espaços ou
Unicode usam aspas duplas; dentro deles, use `\"` para aspas e `\\` para barra invertida. Valores não
podem ocupar várias linhas. Aspas não fechadas são inválidas; atributos desconhecidos são preservados.

```js
import { RecursoApi } from "./_support/api";
import { RecursoAssert } from "./_support/asserts";
// ... demais imports

/**
 * @contrato <id-estavel-da-api>
 *
 * @api    POST /<rota> | GET /<rota>/{id} | GET /<rota>/codigo/{codigo} | PUT /<rota>/{id} | DELETE /<rota>/{id}
 *
 * @resumo <descrição de uma linha do que o recurso representa no domínio>
 *
 * @campo campo1 {number}  required=true min=1 max=99 unique=true immutable=true
 * @campo campo2 {string}  required=true maxLength=50
 * @campo campo3 {enum}    required=true values="A,B,C" rejects=D
 * @campo campo4 {boolean} required=true filterable=true
 *
 * @regra campo2-obrigatorio operation=POST field=campo2 condition=missing status=400 message="mensagem exata"
 * @regra campo1-duplicado   operation=POST field=campo1 condition=duplicate status=409 persistence=forbidden message="mensagem exata"
 * @regra update-ignora-campo1 operation=PUT field=campo1 condition=immutable
 *
 * @permissao authentication=required
 *
 * @cobertura @relacionamento-inexistente nao-aplicavel — recurso não referencia outra entidade
 * @cobertura @campo-controlado           aplicavel — cliente pode enviar id/campo imutável; falta cenário dedicado
 */
describe("API Recurso", () => {
```

**Regras por tag:**

- **`@contrato`**: id estável e único da API, em kebab-case (ex.: `alegacao-ans`). Identifica o
  contrato e relaciona os diferentes specs (crud/validacoes/seguranca) da mesma API. É o que permite
  o vínculo `@regra:<id>` dos testes resolver de forma cross-spec.
- **`@api`**: use exatamente uma linha, listando todos os endpoints cobertos separados por `|`; se a
  API não tem endpoint por `codigo`, omita essa variante.
- **`@resumo`**: uma linha; descreve o que o recurso representa no domínio, não o que o teste faz.
- **`@campo`**: um por campo do payload; inclui tipo JS (`{number}`, `{string}`, `{enum}`,
  `{boolean}`, `{array}`) e constraints em `chave=valor`: `required`, `min`, `max`, `maxLength`,
  `unique`, `immutable`, `filterable`, `generated`. Para enums use `values="A,B,C"` (entre aspas) e
  `rejects=D` quando houver valor rejeitado. Ordenar igual ao DTO do backend.
- **`@regra`**: uma por comportamento contratual, com **ID estável** como primeiro token, seguido de
  atributos `chave=valor`. Atributos previstos: `operation` (POST/GET/PUT/DELETE), `field`,
  `condition` (missing/duplicate/too-long/above-max/invalid-enum/not-found/immutable/…),
  `status` (HTTP), `persistence` (`forbidden` quando a operação não deve persistir) e `message`
  (mensagem exata entre aspas). Regras silenciosas (ex.: campo ignorado no update) entram **sem**
  `status` e sem `message`, mas mantêm `operation`/`field`/`condition`. A mensagem deve ser
  exatamente a confirmada no backend, OpenAPI ou documentação contratual autoritativa. Uma constante
  em `payload.js` é expectativa do teste, não fonte contratual por si. **Não** declare `message`
  quando ela não for confirmada por uma fonte contratual (ex.: erro verboso de
  framework): declare só o `status`.
  `operation` e `condition` são obrigatórios. `field`, `status`, `message` e `persistence` são
  condicionais e só entram quando se aplicam e possuem fonte confirmada.

### Nomenclatura de IDs de regra

O ID é estável e único dentro do `@contrato`, em kebab-case, e descreve o comportamento — não o
número do status. O FailLens resolve primeiro pelo contrato da pasta da API, portanto contratos
diferentes podem reutilizar um ID sem gerar ambiguidade. Padrão sugerido:
`<campo>-<condição>` (`descricao-obrigatoria`, `codigo-duplicado`, `descricao-tamanho`,
`codigo-maximo`, `id-inexistente`, `update-ignora-codigo`). Quando a mesma condição existe em
operações diferentes, sufixe a operação (`processo-abi-rejeitado`, `processo-abi-rejeitado-update`).
O ID é a chave do vínculo: mudá-lo quebra a rastreabilidade, então trate-o como contrato.

### Vínculo teste → regra: `@regra:<id>`

Cada teste contratual declara exatamente uma regra por uma tag `@regra:<id>` no 2º argumento do `it`,
**junto** com a tag de catálogo e as tags operacionais. O FailLens e o gerador de cobertura leem
essa tag estaticamente — nunca por comparação de palavras do título.

```js
it(
  "deve retornar 400 quando descricao não for enviada",
  { tags: [CatalogoTags.OBRIGATORIEDADE, "@regra:descricao-obrigatoria", "@bug"] },
  () => {
    // corpo do teste continua igual
  },
);
```

Responsabilidades das tags (papéis distintos, coexistem):

- `CatalogoTags.X` classifica **por que** o teste existe (alimenta a matriz de cobertura);
- `@regra:<id>` relaciona o teste à **regra contratual** (vocabulário aberto por ID, não é catálogo);
- `@bug`/`@seguranca`/`@melhoria` são estado/finalidade operacional.

Não crie o vínculo quando não houver regra contratual confirmada. Regras de sucesso e regras
silenciosas também recebem vínculo quando são o objetivo principal do teste. Nunca coloque dois IDs
distintos no mesmo `it`; se existem dois objetivos contratuais, separe os cenários.

### Cenários data-driven

Em `forEach` sobre array literal, cada caso carrega seu próprio `regra`, e a tag usa o template:

```js
[
  { campo: "descricao", regra: "descricao-obrigatoria", mensagem: MENSAGENS.DESCRICAO_OBRIGATORIA },
  { campo: "codigo", regra: "codigo-obrigatorio", mensagem: MENSAGENS.CODIGO_OBRIGATORIO },
].forEach(({ campo, regra, mensagem }) => {
  it(
    `deve retornar 400 quando ${campo} não for enviado`,
    { tags: [CatalogoTags.OBRIGATORIEDADE, `@regra:${regra}`, "@bug"] },
    () => {
      // ...
    },
  );
});
```

A tag de vínculo só é capturada estaticamente quando o array é **literal** (mesma limitação do
gerador de cobertura). Tags geradas dinamicamente fora desse padrão não são vinculadas.
- **`@permissao`**: requerimento de autenticação e perfil de escrita. Se não há controle de
  permissão implementado no backend, omita completamente (não documente o bug aqui — ele fica
  nos `it` com `@bug`).
- **`@cobertura`**: declarar é OBRIGATÓRIO quando houver tipos do catálogo classificados como
  `nao-aplicavel`, `nao-confirmado`, `incorporado` (de forma não óbvia) ou `aplicavel` adiado (falta
  um teste que deveria existir). Só é omitível quando TODOS os tipos aplicáveis têm teste dedicado
  (nesse caso são auto-detectados pelo relatório). Formato: `@cobertura <tag> <status> — <motivo>`,
  com `<status>` em `nao-aplicavel | incorporado | aplicavel | nao-confirmado`. Declare **só os tipos
  ambíguos** — os cobertos por teste são fato automático e não entram aqui. O relatório **não infere**
  aplicabilidade: sem declaração e sem teste, o tipo vira pendência de classificação. Use
  `nao-aplicavel` quando o conceito não existe no recurso; `aplicavel` quando falta um cenário que
  deveria existir; `incorporado` quando a validação vive dentro de outro cenário. O vocabulário de
  tags é o da subseção "Tag de catálogo" de `01-oraculo-selecao.md`.

O bloco documenta o **contrato esperado confirmado por fonte autoritativa**, não o comportamento
apenas observado nem uma preferência inventada pelo agente. Bugs ficam nos `it`. Não duplique
informação que já está nas constantes de `payload.js` — o bloco é o sumário
navegável, não a fonte de verdade. Atualize o bloco quando o contrato do backend mudar.

## Regras do backend que o teste não deixa óbvias

Quando um teste depende de uma regra do backend que não é possível deduzir lendo o próprio teste,
documente essa regra em um comentário curto no ponto de uso. São casos típicos:

- um campo que o servidor **mantém ou ignora** numa operação (ex.: um identificador imutável no
  update);
- um valor **válido** que ainda assim é **rejeitado** por regra de negócio;
- um status ou mensagem **diferente do ideal** que o teste precisa aceitar;
- a origem de uma mensagem fixa usada na asserção.

Descreva o **comportamento e o motivo em linguagem natural**, como você explicaria a um colega que
está chegando agora. **Não** cite nome de classe, método ou linha do backend: essa referência
envelhece e não ajuda a entender. O comentário deve dizer _o que o sistema faz e por que o teste
espera aquilo_, não onde isso está implementado.

A procedência técnica exata (arquivo, método) pertence ao raciocínio do agente e à matriz de
cenários, para sustentar o oráculo e evitar suposição; ela não deve poluir o comentário do teste.

Todo teste marcado com `@bug` deve permitir identificar:

- o comportamento incorreto atualmente observado;
- o comportamento correto esperado;
- por que o teste permanece vermelho.

Quando vários testes compartilham exatamente o mesmo defeito, documente uma vez no topo do
`context`, em uma tabela de cenários ou próximo ao grupo, evitando comentários repetidos. Apenas a
tag `@bug`, sem explicação, não é documentação suficiente.

Evite comentários que apenas repetem o código:

```js
// ruim: cria payload
const payload = RecursoPayload.valido();
```

Prefira comentários que carregam contexto:

```js
// Registra antes da assertion para limpar mesmo se o backend criar em cenário negativo.
registrarParaLimpeza(response);
```

E, para regras do backend não óbvias, explique o comportamento em linguagem natural:

```js
// No backend, o update mantém o codigo original e ignora o que for enviado;
// por isso esperamos o codigo inalterado mesmo mandando outro valor.
const esperado = { ...payloadAtualizado, id, codigo: payload.codigo };
```

Nos schemas JSON, use `title` e `description` quando ajudarem a documentar a origem e o objetivo do
contrato. Não use `description` para narrar cada campo óbvio.
