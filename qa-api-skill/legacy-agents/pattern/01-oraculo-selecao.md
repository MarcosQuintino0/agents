# Oráculo, catálogo de tipos de teste e seleção de cenários

Parte central do padrão de qualidade de testes de API. O índice e o conteúdo fundacional estão em
`../api-pattern.md`. Este arquivo concentra as regras de **oráculo**, o **catálogo de tipos de
teste**, as **técnicas** de elaboração, a **checklist incorporada**, a **robustez essencial** e o
**processo de decisão** por cenário.

> **Âncora estável:** a subseção "Tag de catálogo" fica aqui. Muitos agentes e arquivos do projeto
> referenciam essa tabela (catálogo → tag `CatalogoTags`); ela não deve mudar de lugar.

---

## Regra de oráculo

Todo teste precisa definir claramente como decidir se passou ou falhou.

Use como oráculo, nesta ordem:

1. contrato real do backend;
2. OpenAPI ou documentação aprovada;
3. regra de negócio confirmada;
4. schema e perfil do produto;
5. estado persistido consultado posteriormente;
6. invariantes universais de segurança, integridade e não-vazamento.

Se o comportamento funcional não estiver definido, não invente status ou mensagem. Um teste de
robustez pode validar que a resposta é controlada, não expõe interno e não deixa estado
inconsistente. Sem oráculo confiável, o cenário deve ficar como `Nao confirmado`, não virar teste
ambíguo.

## Oráculo de ausência e não-persistência

Para confirmar que um registro **não existe** ou **não foi persistido**, use um oráculo
determinístico:

- prefira a consulta por **chave única ou identificador** (`GET /{id}`, `GET /codigo/{codigo}`) e
  exija o status de ausência esperado (ex.: `404`);
- só use varredura de listagem paginada quando **não houver** consulta determinística e, mesmo
  assim, com filtro/ordenação que **garanta** o registro na página consultada — nunca assumindo que
  um `size` grande cobre toda a base;
- títulos que afirmam "não criar", "não persistir", "não alterar" ou "não remover" devem ser
  comprovados por essa consulta, conforme a rastreabilidade entre título e validações.

Reconsultar o mesmo identificador que já era inexistente **não** prova que outro registro foi
criado: confirme pela chave única efetivamente enviada (ex.: o `codigo` do payload).

## Segurança corporativa obrigatória

Para endpoints protegidos, segurança não depende de o controller ou service declarar todos os
comportamentos. O agente deve criar uma cobertura mínima corporativa quando houver forma técnica de
executar o cenário:

- **Sem autenticação**: enviar request sem `Authorization` e validar bloqueio conforme
  `apiConfig.statusSemAutenticacao`, além de não-vazamento.
- **Credencial inválida ou malformada**: enviar `Authorization` inválido e validar bloqueio conforme
  `apiConfig.statusCredencialInvalida` quando existir, ou `statusSemAutenticacao` como fallback,
  além de não-vazamento.
- **Escritas com acesso negado**: em `POST`, `PUT`, `PATCH` e `DELETE` sem autenticação ou com
  credencial inválida, confirmar que não houve criação, alteração ou remoção quando existir consulta
  determinística.
- **Permissão insuficiente**: quando houver usuário/credencial sem permissão configurado, criar
  cenários para operações sensíveis. Se a credencial não existir, documentar a lacuna com
  `@cobertura @permissao-insuficiente nao-confirmado` ou `it.skip` comentado; não criar teste
  executável que falhe apenas por falta de massa/configuração.

Essa cobertura usa oráculo de segurança, não contrato funcional inventado: status de bloqueio
configurado no produto, não-vazamento e integridade do estado. Mensagem exata só deve ser exigida
quando houver contrato confirmado.

Em qualquer escrita negativa de segurança, trate a operação como potencialmente mutável:

- em `POST`, registre imediatamente a resposta com `registrarParaLimpeza(response)` quando houver `body.id`,
  antes de qualquer assertion, para limpar criação indevida;
- em `PUT`/`PATCH`, reconsulte o registro original e confirme preservação;
- em `DELETE`, reconsulte o registro original e confirme que ele ainda existe.

Quando um cenário de segurança é criado por política corporativa, mas a regra exata do produto ainda
precisa revisão, documente no ponto de uso:

```js
// Cobertura corporativa obrigatória: revisar se este produto espera bloquear este tipo de acesso.
```

Use `@bug` somente quando houver execução real ou evidência documentada de que o backend violou a
regra esperada. Não marque bug por analogia com outra API ou produto.

## Catálogo de tipos de teste a avaliar

Este catálogo é a fonte única dos tipos de teste do projeto. Os agentes executores (creator,
reviewer) devem avaliá-lo por inteiro durante a descoberta e apenas aplicá-lo — não reescrevê-lo.
Avaliar não significa criar todos os testes: implemente somente os cenários classificados como
`Aplicavel`.

A coluna `Classificacao` usa as categorias definidas em `Como interpretar as regras`.

| Tipo de teste                         | Classificacao                 | Quando aplicar                                                       | Forma esperada de cobertura                                              |
| ------------------------------------- | ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Fluxo principal valido                | Essencial                     | Para cada operacao existente                                         | Um cenario representativo por operacao                                   |
| Contrato da resposta                  | Essencial                     | Em toda resposta de sucesso com body                                 | Incorporar schema, tipos, enums e campos permitidos ao cenario           |
| Regra de negocio da resposta          | Essencial                     | Quando valores retornados possuem significado funcional              | Confirmar valores, calculos, filtros e campos imutaveis no mesmo cenario |
| Persistencia apos escrita             | Essencial                     | Apos POST, PUT ou PATCH, quando existir leitura adequada             | Executar nova consulta e confirmar o estado persistido                   |
| Ausencia apos exclusao                | Essencial                     | Apos DELETE, quando existir leitura adequada                         | Executar nova consulta e confirmar ausencia                              |
| Recurso inexistente                   | Quando aplicavel              | Operacoes por identificador (o alvo da URL nao existe)                | Usar identificador inexistente seguro                                    |
| Sem autenticacao                      | Essencial para endpoint protegido | Em endpoints protegidos                                           | Confirmar bloqueio, nao-vazamento e ausencia de alteracao                |
| Credencial invalida ou expirada       | Essencial para endpoint protegido / baseado em risco | Token invalido/malformado sempre que tecnicamente possivel; expirado quando houver forma segura de simular | Confirmar bloqueio, nao-vazamento e ausencia de alteracao                |
| Permissao insuficiente                | Quando aplicavel              | Quando houver usuario/credencial sem permissao configurado; se faltar massa, documentar lacuna | Confirmar bloqueio por operacao sensivel e integridade em escritas       |
| Obrigatoriedade                       | Contratual                    | Para campos obrigatorios confirmados                                 | Campo ausente e particoes distintas relevantes                           |
| Tipo, formato e enum invalidos        | Contratual                    | Quando houver restricao confirmada                                   | Um representante relevante por particao invalida                         |
| Valores limite                        | Contratual                    | Quando houver minimo, maximo, tamanho ou intervalo confirmado        | Limite valido e primeiro valor invalido de cada lado aplicavel           |
| Regra de negocio de entrada           | Contratual                    | Para duplicidade, vinculo, imutabilidade, combinacao ou estado       | Validar resultado exato definido pelo contrato                           |
| Listagem, filtro, ordenacao e pagina  | Quando aplicavel              | Quando esses recursos existirem                                      | Validar itens, metadados e coerencia do resultado                        |
| Repeticao, duplicidade e idempotencia | Contratual / baseado em risco | Quando houver regra explicita ou risco plausivel de inconsistencia   | Validar regra exata ou apenas comportamento controlado                   |
| Entrada estruturalmente invalida      | Baseado em risco              | Body ausente, identificador/query invalida ou estrutura incompativel | Selecionar poucos casos de alto valor                                    |
| Relacionamento inexistente            | Baseado em risco              | Quando a operacao depende de outra entidade                          | Confirmar tratamento controlado e ausencia de persistencia parcial       |
| Campo controlado pelo backend         | Baseado em risco              | Quando o cliente consegue enviar id, auditoria, status ou calculado  | Confirmar que nao foi alterado indevidamente                             |
| Integridade apos operacao rejeitada   | Essencial                     | Quando uma operacao negativa pode alterar dados e existe verificacao | Consultar novamente e confirmar ausencia de alteracao indevida           |
| Contrato de erro e nao-vazamento      | Essencial                     | Em todo cenario de erro                                              | Incorporar status/shape/mensagem definidos e nenhum detalhe interno      |

Regras para usar o catálogo:

- cada tipo deve aparecer na cobertura do catálogo do plano (`COBERTURA DO CATALOGO`) como
  `Aplicavel`, `Ja coberto`, `Nao aplicavel` ou `Nao confirmado`;
- quando um tipo exigir cenário próprio, leve-o também para a `MATRIZ DE CENARIOS`;
- quando um tipo for validação incorporada, indique em quais cenários ele será coberto sem criar
  linhas ou testes artificiais;
- validações como schema, não-vazamento e persistência devem ser incorporadas ao cenário funcional,
  não transformadas automaticamente em novos `it()`;
- não repita variações que exercitam a mesma regra e recebem o mesmo tratamento.

Fronteira `@recurso-inexistente` vs `@relacionamento-inexistente`: o **alvo** da operação (id na URL)
não existe é `@recurso-inexistente`; uma **referência estrangeira** no body que não existe
(ex.: `clienteId` apontando para cliente inexistente) é `@relacionamento-inexistente`.

Exemplos de decisão:

| Cenário concreto | Tag correta | Por quê |
| ------------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `DELETE /pedidos/99999` (99999 não existe) | **`@recurso-inexistente`** | O alvo da URL não existe |
| `POST /pedidos` com `{"clienteId": 99999}` (cliente 99999 não existe) | **`@relacionamento-inexistente`** | Referência estrangeira no body não existe |
| `GET /empresas/{empresaId}/filiais` (empresaId não existe) | **`@recurso-inexistente`** | O alvo da URL não existe (mesmo que filiais sejam sub-recurso) |

## Tag de catálogo (classificação obrigatória do `it`)

Todo `it` que vira cenário próprio carrega **exatamente uma** tag primária de catálogo, que declara
sua **razão de existir**. A tag vai no 2º argumento do `it`, via constante do vocabulário fechado
`CatalogoTags` (`cypress/support/tags.js`) — a fonte única do vocabulário em runtime:

```js
it("deve rejeitar descrição com 51 caracteres por exceder o limite máximo de 50",
   { tags: [CatalogoTags.VALOR_LIMITE] }, () => { /* ... */ });
```

Use a constante, nunca a string crua: um typo vira erro de referência, em vez de sumir do relatório.

Mapeamento tipo → tag. Os tipos marcados como **incorporado** nunca recebem tag (são validação
incorporada; o relatório os deriva dos asserts):

| Tipo de teste (catálogo)              | Tag                                           |
| ------------------------------------- | --------------------------------------------- |
| Fluxo principal válido                | `@fluxo-principal`                            |
| Listagem, filtro, ordenação e página  | `@paginacao`                                  |
| Recurso inexistente                   | `@recurso-inexistente`                        |
| Obrigatoriedade                       | `@obrigatoriedade`                            |
| Valores limite                        | `@valor-limite`                               |
| Tipo, formato e enum inválidos        | `@tipo-invalido`                              |
| Regra de negócio de entrada           | `@regra-negocio`                              |
| Entrada estruturalmente inválida      | `@entrada-invalida`                           |
| Sem autenticação                      | `@sem-autenticacao`                           |
| Credencial inválida ou expirada       | `@credencial-invalida`                        |
| Permissão insuficiente                | `@permissao-insuficiente`                     |
| Repetição, duplicidade e idempotência | `@idempotencia`                               |
| Relacionamento inexistente            | `@relacionamento-inexistente`                 |
| Campo controlado pelo backend         | `@campo-controlado`                           |
| Contrato da resposta                  | incorporado (schema no cenário)               |
| Regra de negócio da resposta          | incorporado (valores no cenário de sucesso)   |
| Persistência após escrita             | incorporado (GET de verificação)              |
| Ausência após exclusão                | incorporado ao `@fluxo-principal` do DELETE   |
| Integridade após operação rejeitada   | incorporado (consulta no cenário negativo)    |
| Contrato de erro e não-vazamento      | incorporado (assert de erro + guard)          |

Fronteira `@regra-negocio` vs `@idempotencia`: duplicidade/estado **com** resultado contratual
definido (ex.: 409 esperado) é `@regra-negocio`; repetir escrita **sem** contrato de rejeição,
validando só comportamento controlado, é `@idempotencia`.

Exemplos de decisão (a regra acima é a fonte; estes casos calibram a fronteira):

| Cenário concreto | Contrato de rejeição? | Tag correta | Por quê |
| ------------------------------------- | ----------------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `POST /empresas` com CNPJ duplicado → **409 + "CNPJ já cadastrado"** | ✅ status + mensagem definidos | **`@regra-negocio`** | O oráculo é o contrato; assert o status e a mensagem exata |
| `PUT /pedido/{id}` com `status=ENCERRADO` → **400 + "não alterável"** | ✅ status + mensagem definidos | **`@regra-negocio`** | Regra de transição de estado com 4xx contratual |
| `POST /empresas` repetido → **201 de novo** (sem regra documentada) | ❌ não há contrato de rejeição | **`@idempotencia`** | Validar só comportamento controlado; **não inventar 409** |
| Repetir `DELETE /{id}` → 200/404 (sem contrato explícito) | ❌ não há contrato de rejeição | **`@idempotencia`** | Oráculo = não corrompeu estado; resposta consistente |
| `POST /usuarios` com e-mail duplicado → **500/SQL exposto** | ⚠️ a regra existe, o backend falha | **`@regra-negocio` + `@bug`** | A regra existe (409 esperado); o teste fica vermelho até o backend corrigir |

Testes data-driven (`forEach`) que geram vários `it` de tipos diferentes carregam a tag **no próprio
array de dados**, nunca fixa no loop — senão a tag mente para parte dos casos:

```js
[
  { descricao: "descrição ausente", campo: "descricao", tag: CatalogoTags.OBRIGATORIEDADE },
  { descricao: "descrição com 51 caracteres", campo: "descricao", tag: CatalogoTags.VALOR_LIMITE },
].forEach(({ descricao, campo, tag }) => {
  it(`deve retornar 400 quando ${descricao}`, { tags: [tag] }, () => { /* ... */ });
});
```

O rótulo do caso usado no título (o campo `descricao`/`caso` do array de dados) deve ser uma **string
literal**, nunca um template com constante importada (`${LIMITES.MAX + 1}`) — senão o título vira
`${...}` no relatório de cobertura, que lê as specs estaticamente. A constante continua no corpo/payload.

A tag classifica o **tipo**; o **campo** coberto não vira tag — ele é derivado do que o teste já
asserta (o argumento `campo` de `erroValidacao`, a factory `semCampo`/`comCampo` usada) cruzado com
os `@campo` do JSDoc. Metadado que pode divergir do payload real não entra; o argumento do assert,
que falha se apontar errado, é a fonte confiável.

## Técnicas para elaborar os cenários

Depois de identificar o tipo de teste aplicável, selecione a técnica adequada para elaborar o
cenário e escolher os dados:

| Tecnica inspirada no ISTQB      | Use para                                                                 |
| ------------------------------- | ------------------------------------------------------------------------ |
| Particionamento de equivalencia | Escolher representantes validos e invalidos sem testar valores repetidos |
| Analise de valor limite         | Testar o limite permitido e o primeiro valor fora dele                   |
| Tabela de decisao               | Cobrir combinacoes relevantes de condicoes e resultados                  |
| Transicao de estado             | Validar mudancas de estado permitidas e proibidas                        |
| Teste baseado em cenario        | Validar fluxos completos, CRUD e persistencia                            |
| Suposicao de erro               | Procurar falhas plausiveis de robustez e tratamento                      |
| Teste baseado em checklist      | Fortalecer assertions dentro dos cenarios existentes                     |

Os exemplos de aplicação das regras ajudam a interpretar oráculo, partições, limites, combinações, checklist e
robustez. Eles orientam a decisão, mas nunca substituem o contrato real do produto.

Pairwise, concorrência, carga e performance só devem ser propostos quando o risco justificar. Como
não fazem parte do catálogo padrão funcional, inclua-os na matriz somente quando forem propostos.

## Checklist incorporada

A checklist fortalece cenários existentes; ela não cria automaticamente novos `it()`.

| Tipo de resposta/operacao | Validacoes incorporadas quando aplicaveis                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Sucesso                   | status exato, schema fechado, regra de negocio, campos controlados e persistencia                         |
| Erro                      | status definido, schema de erro, mensagem/campo, nao-vazamento e ausencia de alteracao indevida           |
| Escrita                   | registrar antes da assertion, confirmar persistencia ou ausencia dela, preservar imutaveis e limpar dados |
| Seguranca                 | operacao bloqueada, nenhum dado alterado/protegido retornado e nenhum detalhe interno exposto             |
| Listagem/paginacao        | schema dos itens/envelope, total, pagina, filtros e ordenacao coerentes                                   |

Não crie um teste separado apenas para schema, persistência ou não-vazamento quando essas validações
podem fazer parte do cenário que já executa o comportamento.

Exemplos de decisão (quando incorporar vs quando criar `it()` próprio):

| Situação | Decisão | Por quê |
| ------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| Schema da resposta de um `POST` bem-sucedido | **Incorporar** ao `it` de criação | Faz parte do oráculo do fluxo principal; um `it` só para schema é redundância |
| Persistência após criar (re-consultar via GET) | **Incorporar** ao `it` de criação | Mesma ação principal; a consulta de verificação é a validação |
| Não-vazamento ao enviar body ausente | **`it()` próprio** (`@entrada-invalida`) | Não há fluxo funcional; o objetivo do teste É validar o erro controlado |
| Verificar se `GET` paginado está ordenado | **`it()` próprio** (`@paginacao`) | Comportamento distinto do CRUD; oráculo próprio (itens + metadados) |

## Robustez essencial

Mesmo sem regra funcional explícita, uma API deve respeitar invariantes mínimas:

- entrada controlável pelo cliente não deve expor erro interno, stack, SQL ou pacote;
- operação rejeitada não deve persistir parcialmente nem corromper estado;
- repetição de escrita não deve produzir erro bruto ou inconsistência;
- relacionamento inexistente deve receber tratamento controlado;
- campos controlados pelo backend não devem ser alterados indevidamente.

Para robustez sem contrato funcional, não exija automaticamente `400`, `409` ou mensagem exata.
Valide somente o comportamento controlado que possui oráculo confiável.

Esta lista não transforma todos os itens em testes obrigatórios. Selecione cenários por risco,
histórico, estrutura do backend ou impacto e registre a justificativa. Da mesma forma, não repita
nulo, vazio e outras variações para todos os campos quando elas representam a mesma partição e usam
o mesmo tratamento.

Exemplos de decisão (o que assertar quando **não há** contrato de erro definido):

| Cenário sem contrato | ✅ Assert correto (controlado) | ❌ Armadilha a evitar |
| ------------------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| Repetir `POST` sem regra de duplicidade | Não vazou interno + não corrompeu estado | ❌ Exigir `409` inventado |
| Enviar `clienteId` inexistente | Resposta tratada + sem persistência parcial | ❌ Assumir `400` exato |
| Body ausente em endpoint sem `@Valid` | Não expôs stack/SQL | ❌ Ignorar totalmente (checar só "não 500") |
| `DELETE` de recurso já removido | Comportamento consistente (200 ou 404) | ❌ Inventar mensagem específica |
| Campo extra no payload | Ignorado sem erro de banco | ❌ Assumir rejeição `400` |

## Processo de decisão para cada cenário

Antes de criar um novo `it()`, responda nesta ordem:

1. **O conceito existe?** Confirme no contrato, backend, documentação ou comportamento real.
2. **Qual risco ou regra ele cobre?** Identifique operação principal, partição, limite, regra de
   negócio, segurança ou robustez.
3. **Qual é o oráculo?** Defina como distinguir aprovação de falha sem inventar comportamento.
4. **Já existe cobertura equivalente?** Reuse ou fortaleça o cenário existente quando possível.
5. **A validação cabe no mesmo teste?** Incorpore schema, regra, persistência e não-vazamento ao
   cenário funcional.
6. **O custo é proporcional ao risco?** Evite combinações e variações sem benefício claro.

Não crie um novo `it()` quando:

- outro teste já cobre a mesma regra e partição;
- muda apenas um valor equivalente;
- a verificação cabe como assertion em um cenário existente;
- não existe contrato, risco ou oráculo que justifique;
- a combinação aumenta volume sem benefício claro.

Combine campos somente quando existir interação real entre eles; evite explosão combinatória e
cenários cujo custo não seja proporcional ao risco.

Classifique o resultado:

- `Aplicavel`: possui justificativa e oráculo; deve seguir para o plano;
- `Ja coberto`: existe teste adequado; não duplicar;
- `Nao aplicavel`: o conceito ou risco não existe para o endpoint;
- `Nao confirmado`: falta evidência; registrar a dúvida e não implementar automaticamente.

Exemplos de classificação (a regra acima é a fonte; estes casos calibram a escolha):

| Cenário concreto | Evidência encontrada | Classificação | Por quê |
| ------------------------------------- | -------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Consultar `GET /{id}` inexistente | Contrato define **404** | **`Aplicavel`** | Conceito e oráculo confirmados; criar o teste |
| Atualizar registro em estado `ENCERRADO` | Nenhuma fonte diz se bloqueia ou permite | **`Nao confirmado`** | Falta oráculo; não criar teste que aceite/rejeite por suposição |
| Paginação de recurso sem listagem | Não existe `GET` paginado no backend | **`Nao aplicavel`** | O conceito não existe para este endpoint |
| Duplicidade de código com `@Unique` no banco | Restrição existe, mas sem status definido | **`Aplicavel`** como robustez | Tem oráculo controlado (não vazar/não corromper) |
| Concorrência em atualização | Sem requisito ou histórico de impacto | **`Nao aplicavel`** | Nenhum risco identificado; não inflar a suíte |
