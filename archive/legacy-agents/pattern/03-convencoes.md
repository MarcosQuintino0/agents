# Convenções (hierarquia, nomenclatura, corpo do teste, aninhamento e tags)

Parte do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`. As regras de **tag de catálogo** (`CatalogoTags`) ficam em
`01-oraculo-selecao.md` (subseção "Tag de catálogo").

## Hierarquia de leitura da suíte

A estrutura deve permitir que um QA entenda rapidamente o recurso, a categoria e o comportamento
esperado sem precisar abrir helpers.

| Elemento      | Responsabilidade                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `describe`    | identificar o recurso ou endpoint sob teste                                                      |
| `context`     | agrupar uma categoria de comportamento relacionada                                               |
| `it`          | descrever um comportamento observável: resultado esperado, ação/operação e condição relevante    |
| corpo do `it` | tornar visíveis preparação, ação principal e validações por meio de Preparação, Ação e Validação |

Use `describe("API <Recurso>")` como raiz preferencial. Quando a suíte cobre exclusivamente uma
rota específica, a rota pode identificar o `describe`. Não use o `describe` para listar todos os
cenários ou validações.

Use `context` para categorias reais, por exemplo:

- `CRUD`;
- `Regras de negocio`;
- `Validacoes de entrada`;
- `Seguranca`;
- `Paginacao`.

Não crie um `context` para cada `it`, não repita o mesmo texto do `describe` e não adicione níveis
de agrupamento sem benefício para leitura.

## Nomenclatura de testes (`it`)

Estruturas recomendadas:

```text
deve [RESULTADO ESPERADO] ao [ACAO/OPERACAO] [CONDICAO]
deve [RESULTADO ESPERADO] quando [CONDICAO]
```

Regras obrigatórias:

- começar sempre com `deve`;
- usar português e nunca numerar (`Test 1`);
- preferir títulos até 120 caracteres, mas permitir títulos maiores quando isso deixar o comportamento
  e o oráculo mais claros;
- descrever um comportamento observável e um único objetivo principal;
- produzir um título resolvido único dentro do spec, inclusive depois de expandir casos data-driven;
- não incluir massa aleatória, nomes de factories, helpers ou detalhes do setup padrão;
- não listar todas as assertions executadas;
- não mencionar validações padrão, como schema e não-vazamento, exceto quando forem o objetivo
  principal do cenário;
- incluir valores específicos **como texto literal** somente quando representarem limite, regra ou
  partição relevante; **nunca interpolar constantes ou expressões no título** (ex.:
  `` `...${LIMITES.MAX + 1}...` ``) — o título é texto para leitura humana e para o relatório de
  cobertura, que lê as specs estaticamente. Escreva o número direto e mantenha a constante só no
  corpo; o literal deve refletir o limite documentado em `@campo`/`@regra`;
- incluir efeitos observáveis como `persistir os dados`, `sem criar registro`, `sem alterar o
registro original` ou `confirmar ausência` quando essas verificações fazem parte do oráculo;
- priorizar o comportamento real; status HTTP entra no título quando ajuda a diferenciar o
  resultado contratual, não apenas porque será validado.

Exemplos válidos:

```js
it("deve criar empresa com nome no limite máximo de 100 caracteres e persistir os dados", () => {});
it("deve retornar 400 quando o campo nome estiver ausente", () => {});
it("deve rejeitar atualização sem permissão sem alterar os dados originais", () => {});
it("deve retornar erro sem expor detalhes internos quando o body estiver ausente", () => {});
it("deve rejeitar descrição com 101 caracteres por exceder o limite máximo de 100", () => {});
```

Exemplos inválidos:

```js
it("deve funcionar", () => {}); // comportamento vago
it("Test 1 - cria empresa", () => {}); // numerado e nao comeca com "deve"
it("deve criar empresa com nome QA API Recurso 123456 faker", () => {}); // inclui massa/setup
it("deve retornar 400 com schema de erro e validar campo e nao-vazamento", () => {}); // lista asserts
```

## Rastreabilidade entre título e validações

Toda afirmação observável presente no título do `it` deve ser comprovada explicitamente pelas
assertions do teste.

- Se o título informa `persistir`, consulte novamente e confirme os dados gravados.
- Se informa `não criar`, confirme que nenhum novo registro foi persistido.
- Se informa `não alterar`, consulte novamente e compare com o estado original.
- Se informa `não remover`, consulte novamente e confirme que o registro continua existindo.
- Se informa um status, valide exatamente esse status.

O título não pode prometer um comportamento que o corpo do teste não comprove. Quando a afirmação
não puder ser verificada com um oráculo confiável, ajuste o título ou trate o cenário como lacuna.

## Corpo do teste: Preparação, Ação e Validação

Todo `it` deve permitir identificar estas três etapas:

| Etapa          | Objetivo                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Preparação** | preparar payload, pré-condições, autenticação e estado específico do cenário                        |
| **Ação**       | executar a única ação/operação principal que caracteriza o comportamento testado                    |
| **Validação**  | validar resposta e estado final: status, schema, negócio, persistência, integridade e não-vazamento |

Uma consulta executada depois de POST, PUT, PATCH ou DELETE para comprovar o estado final pertence
à **Validação**, não representa uma segunda ação principal. Cleanup fica no `afterEach` ou helper
apropriado e não substitui a validação do estado final.

Comentários `// Preparação`, `// Ação` e `// Validação` são obrigatórios quando o teste possuir pelo menos
uma destas características:

- preparação de registro, autenticação ou estado específico;
- duas ou mais chamadas de API relevantes para o cenário;
- verificação posterior de persistência, ausência ou integridade;
- encadeamentos em que a ação principal ou o início das assertions não sejam evidentes;
- fluxo alternativo, como provar o que ocorreu após uma operação sem permissão.

Prefira o marcador **com uma frase curta que diz o que o bloco faz**, não o rótulo seco. O rótulo
sozinho não ensina; a frase ensina. Exemplos: `// Preparação: pega um código livre e monta o
payload no limite`, `// Validação: busca de novo e confirma que persistiu`. A frase deve carregar a
intenção do bloco; quando a chamada já é auto-evidente (`// Ação: cria a alegação` sobre
`criar(payload)`), o marcador pode ser omitido para não repetir o código.

Use os marcadores **apenas em testes de três fases reais**. Em testes curtos — uma única chamada e
uma validação direta, como os `404` por id/código inexistente — os marcadores viram ruído e devem
ser omitidos. Não use os comentários para narrar linhas óbvias; eles delimitam as etapas do
comportamento.

Regra prática para decidir manter ou omitir um marcador: se a frase apenas repete o nome do método
chamado (ex.: `// Ação: cria` sobre `criar()`), **omita** — ela não agrega. Mantenha o marcador
apenas quando explicar uma condição, razão ou efeito não-óbvio (ex.: `// Ação: cria sem permissão
para provar bloqueio e preservação do original`). O marcador deve ensinar algo que o código sozinho
não revela.

Quando uma validação complexa possuir partes distintas, use subtítulos específicos dentro de
`Validação`, como `// Validação da resposta`, `// Validação da persistência` ou
`// Validação da integridade`. Persistência continua sendo parte do oráculo e não constitui uma
quarta fase.

Exemplo:

```js
describe("API Empresa", () => {
  context("CRUD", () => {
    it("deve criar e persistir uma empresa ao enviar dados validos", () => {
      // Preparação: monta o payload válido
      const payload = EmpresaPayload.valido();

      // Ação: cria a empresa
      EmpresaApi.criar(payload).then((resposta) => {
        registrarParaLimpeza(resposta);

        // Validação: busca de novo e confirma que persistiu
        EmpresaApi.buscarPorId(resposta.body.id).then((consulta) => {
          EmpresaAssert.criacaoPersistida({ resposta, consulta, enviado: payload });
        });
      });
    });
  });
});
```

## Aninhamento e `return` nas cadeias `.then`

O encadeamento `.then` aninhado é **permitido e preferido** quando o objetivo é legibilidade para
quem está chegando agora. Não use `let`, aliases (`this`/`.as()`) nem helpers de contexto só para
"achatar" a cadeia: eles costumam ser mais difíceis de ler que o aninhamento simples.

O aninhamento acompanha as fases naturais do teste — **Preparação → Ação → Validação** — e não há um
número máximo de níveis: a Preparação pode encadear várias chamadas de setup (autenticar, criar
massa de apoio, obter um código livre) e ainda assim contar como uma única fase. O sinal de "está
fazendo coisa demais, quebre em dois" não é a profundidade da cadeia, e sim o teste ter **duas ações
principais** ou a **Validação** precisar abrir muitos níveis próprios. Não ache a cadeia com `let`,
aliases ou `.as()` só para reduzir indentação — o aninhamento simples costuma ser mais legível.

Quando, mesmo assim, o aninhamento passar de 3 níveis porque o teste precisa encadear **setup +
ação principal + validação com releitura**, extraia o setup + a ação em um **helper agregador**
que devolve um objeto com os valores necessários. O agregador combina as respostas para reduzir
níveis, mas **não chama `registrarParaLimpeza`** — o cleanup já foi feito por `criarRegistroDeTeste`
no setup. Exemplo:

```js
// helpers.js — agrega criar+atualizar, devolve tudo que o teste precisa.
// `montarPayload` recebe a `criacao` e devolve o payload (útil quando ele depende de valores
// que só existem após a criação, ex.: um código divergente do original).
export const criarEAtualizar = (montarPayload) =>
  criarRegistroDeTeste().then((criacao) => {
    const payloadAtualizado = montarPayload(criacao);
    return RecursoApi.atualizar(criacao.body.id, payloadAtualizado).then((resposta) => ({
      criacao,
      resposta,
      payloadAtualizado,
    }));
  });
```

```js
// crud.cy.js — teste achatado (2 níveis em vez de 4):
it("deve atualizar...", () => {
  criarEAtualizar((criacao) => {
    const codigoDivergente = criacao.payloadUtilizado.codigo - 1 || criacao.payloadUtilizado.codigo + 1;
    return RecursoPayload.atualizado({ codigo: codigoDivergente });
  }).then(({ criacao, resposta, payloadAtualizado }) => {
    // Validação da persistência: rebusca o registro e confirma.
    RecursoApi.buscarPorId(criacao.body.id).then((consulta) => {
      RecursoAssert.atualizacaoEPersistencia({ resposta, consulta, enviado: payloadAtualizado, ... });
    });
  });
});
```

Use agregadores apenas quando o encadeamento for genuinamente profundo (3+ níveis) — não force
para testes rasos, e não crie um agregador por teste (reaproveite quando o mesmo setup+ação se
repetir entre testes da mesma operação).

Não use `return` desnecessário dentro das cadeias `.then`. No Cypress os comandos `cy.*` entram na
fila de execução automaticamente, então o `return` ali não muda o comportamento e só gera dúvida
("isso importa?"). Removê-lo deixa o teste mais limpo. **Cuidado**: isso vale para cadeias de
comandos Cypress; se algum dia o callback retornar uma `Promise` crua (não-Cypress) cujo valor
precisa ser propagado, aí o `return` é necessário — esse é o caso de exceção, não a regra.

As consultas de verificação de persistência, ausência ou integridade devem continuar visíveis no
spec (são parte da Validação). O `_support/asserts.js` pode expor asserts compostos que recebem a
resposta principal e a consulta de verificação já obtidas, mas **não** deve executar requests.

- **Legibilidade do spec**: helpers podem esconder detalhes técnicos, mas o spec deve continuar
  mostrando a preparação relevante, a operação testada e a validação principal.
- **Valores e mensagens nomeados**: valor "mágico" no meio do teste (um código, um limite, um id
  especial) vira constante nomeada com um comentário curto explicando a **regra** que o justifica
  (ex.: `const CODIGO_DIVERGENTE = 99; // o backend deve ignorar este código no update`). Mensagens
  de erro do contrato nunca ficam como string crua espalhada nos `it`: centralize-as como constante
  (ex.: `NAO_ENCONTRADA`, `mensagemCodigoDuplicado(codigo)`) reutilizada por specs e asserts.
- **Asserts compostos** (quando o mesmo bloco de status + contrato + persistência se repete):
  - extraia para um assert em `_support/asserts.js` quando esse bloco se repetir;
  - receba um **objeto nomeado** (`criacaoPersistida({ resposta, consulta, enviado })`,
    `atualizacaoPersistida({ resposta, consulta, enviado, preservado })`,
    `preservouOriginal({ consulta, original })`); nunca argumentos posicionais quando houver 3+
    valores — o objeto nomeado deixa cada argumento auto-explicativo na chamada;
  - **uma camada de abstração por composto**: o corpo do assert composto só deve chamar
    sub-funções nomeadas no mesmo nível (status, schema, campos), nunca misturar
    `BaseAssert.validarStatus(...)` cru com `expect(consulta.body.x, ...)` crú. Cada linha do composto
    lê como um passo; o detalhe fica na sub-função privada. Exemplo:
    ```js
    export const validarCriacaoEPersistencia = ({ resposta, consulta, enviado }) => {
      validarStatusCriacao(resposta);
      validarSchemaCriacao(resposta);
      validarCamposPersistidos({ consulta, enviado });
    };
    ```
    As sub-funções (`validarStatusCriacao`, etc.) são privadas ao módulo — a porta de entrada
    continua sendo o composto. Assim o júnior que precisar debugar abre o `asserts.js` e lê uma
    frase de passos claros, não uma mistura de níveis de detalhe;
  - o assert **não faz requests**; apenas valida respostas já obtidas pelo spec;
  - em cenários negativos, mantenha a validação do **erro** visível no próprio spec quando seu formato
    variar (erro de negócio 4xx vs sem permissão 403);
  - ao introduzir ou renomear um assert com objeto nomeado, ajuste a definição em
    `_support/asserts.js` **e** todas as chamadas no spec na mesma alteração — senão a chamada antiga
    quebra.
- **Codificação legível**: arquivos de código, schemas e documentação devem ser UTF-8. Escreva
  palavras acentuadas diretamente (`Alegação`, `não`, `código`), sem escapes Unicode como
  `Alega\u00e7\u00e3o`. Escapes continuam permitidos quando possuem finalidade técnica, como
  intervalos Unicode em expressões regulares.
- **Logs e credenciais**:
  - requests de API passam por um wrapper central com `cy.request` usando `log: false`;
  - tokens, senhas, cookies, headers de autorização e credenciais são mascarados antes de aparecerem
    no runner, no `report.json`, no `report.html` ou no cURL gerado;
  - nunca grave valores reais de `Authorization`, `Cookie`, `password`, `accessToken`,
    `refreshToken` ou `token` em artefatos de teste.
- **Isolamento**: cada `it` roda sozinho. Proibido compartilhar estado entre testes
  (ex.: `Cypress.env("idGerado")`).
- **Limpeza obrigatória**: tudo que o teste cria é apagado no `afterEach` — **mesmo que o teste
  falhe** (registre o id ANTES da assertion). Recurso de config global (sem create/delete) é
  **restaurado** ao valor original.
- **Dados únicos** por execução para recursos criáveis (faker + carimbo, ou um valor livre obtido
  via API quando houver limite/duplicidade).
- **Cenários negativos**: `{ failOnError: false }` para poder asseverar o erro.
- **Tags** nativas do Cypress **sempre no 2º argumento** do `it` (`{ tags: ["@bug"] }`), nunca no
  texto do título. Vocabulário permitido:
  - `@seguranca` — teste de auth/autorização
  - `@melhoria` — funciona, mas o contrato podia ser melhor (ex.: 403 onde devia 401)
  - `@bug` — **vermelho esperado**: falha por defeito do backend, não por teste quebrado
  - Não embuta número de chamado/Kanban no título nem use helper de tag que exija chamado; a tag é um
    rótulo simples no 2º argumento.
  - **Tag de catálogo** (classificação do tipo de teste): além de qualquer tag operacional, todo `it`
    que vira cenário próprio recebe **uma** tag primária de catálogo no 2º argumento, via constante
    `CatalogoTags` (vocabulário fechado). Ela alimenta o relatório de cobertura; o mapeamento, a
    fronteira `@regra-negocio` vs `@idempotencia` e o padrão data-driven estão na subseção
    "Tag de catálogo" de `01-oraculo-selecao.md`.
- **Não mascarar defeito**: se o backend está errado, assevere o comportamento **correto** → o
  teste fica vermelho com `@bug`. Nunca ajuste o teste para passar em cima do comportamento errado.
