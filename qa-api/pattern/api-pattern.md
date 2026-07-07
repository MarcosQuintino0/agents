# Padrão de Qualidade para Testes de API com Cypress

Documento de referência para criar, revisar e manter testes de API confiáveis em projetos Cypress.
Ele define **como decidir a qualidade de um teste**, independentemente da linguagem ou stack usada
no backend.

Este documento não executa o fluxo de criação e não escolhe sozinho quais endpoints testar. Ele
estabelece as regras que devem orientar essas decisões.

---

## Como este padrão está organizado

Este arquivo é o **índice e a base fundacional** do padrão. As seções abaixo (1, 2, 6, 13) ficam
aqui porque definem o arcabouço — propósito, camadas de responsabilidade, estrutura de pastas e o
que é proibido. As regras detalhadas de validação, oráculo, convenções e documentação vivem em
arquivos focados em `pattern/`, consultados sob demanda.

A numeração das seções foi preservada intencionalmente: quando um agente ou comentário citar
"seção 4" ou "seção 11", o número continua válido. As seções 5 e 12 foram movidas para arquivos
próprios e mantêm ponteiros no lugar de origem.

### Índice do padrão

| Quando precisar de... | Consulte | (seção de origem) |
| --------------------- | -------- | ----------------- |
| Propósito, limites e glossário | este arquivo, seções 1 e 1.1 | — |
| Camadas de responsabilidade (padrão × produto × contrato) | este arquivo, seção 2 | — |
| **Como validar cada resposta por camadas** (status, schema, negócio, persistência) | `pattern/02-validacao-camadas.md` | seção 3 |
| **Oráculo, catálogo de tipos de teste, técnicas, robustez e processo de decisão** | `pattern/01-oraculo-selecao.md` | seção 4 |
| **Exemplos de aplicação das regras** (9 casos práticos) | `pattern/05-exemplos.md` | seção 5 |
| Estrutura de pastas | este arquivo, seção 6 | — |
| Organização dos arquivos de support, schemas e contrato de erro/não-vazamento | `pattern/06-organizacao-codigo.md` | seções 7, 8 e 9 |
| **Convenções** (nomenclatura do `it`, aninhamento, tags, rastreabilidade, comentários de fase) | `pattern/03-convencoes.md` | seção 10 |
| **Comentários e documentação viva** (JSDoc de contrato, categorias de comentário obrigatório) | `pattern/04-comentarios-jsdoc.md` | seção 11 |
| Adaptar o padrão a um novo projeto | `pattern/07-portabilidade.md` | seção 12 |
| Checklist comum de criação e revisão | `pattern/08-checklist-qualidade.md` | gate operacional |
| O que não fazer (anti-padrões universais) | este arquivo, seção 13 | — |

> Regra de uso: os agentes executores (`api-criador.md`, `api-revisor.md`) citam e aplicam
> estes critérios; não os redefinem. Em conflito de texto sobre os critérios, vale o que está nestes
> arquivos.

---

## 1. Propósito e limites

### Responsabilidade deste documento

- definir o padrão mínimo de qualidade das validações;
- separar regras universais, configurações do produto e contrato do endpoint;
- orientar seleção de cenários por contrato, risco e oráculo;
- definir organização de arquivos, schemas, assertions, massa e cleanup;
- fornecer exemplos de aplicação das regras.

Sobre cenários de teste: este padrão define **critérios, categorias e regras de seleção**. Ele não
determina uma lista fixa de testes para toda API. O `api-criador.md` analisa o contrato e usa
estes critérios e seu **catálogo de tipos de testes a avaliar** para decidir quais cenários são
aplicáveis.

### Fora de escopo

- instalar ou preparar dependências do projeto;
- descobrir sozinho o contrato de uma API;
- executar o fluxo de análise, planejamento e implementação;
- fornecer blocos completos de código para copiar;
- revisar ou corrigir testes sem um agente executor.

### Como usar este documento

| Momento                     | Responsável               | Como usa este padrão                                                     |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Preparar o projeto          | `api-preparador.md`       | cria ou adapta a base compartilhada necessária                           |
| Planejar e criar uma suíte  | `api-criador.md`     | consulta as regras para selecionar, planejar e implementar os cenários   |
| Implementar código Cypress  | `api-templates.md`   | fornece exemplos técnicos compatíveis com este padrão                    |
| Revisar uma suíte existente | `api-revisor.md`    | verifica se os testes obedecem às regras                                 |
| Adaptar para outro produto  | perfil/configuração local | define autenticação, erros, paginação e sinais específicos daquele stack |

Regra de uso: quando houver conflito, o contrato real do endpoint define o comportamento funcional;
este padrão define como validá-lo com qualidade e segurança.

Este documento é a fonte única dos critérios de qualidade, seleção, nomenclatura e estrutura dos
testes: catálogo de tipos, técnicas, oráculo, checklist, robustez, hierarquia
`describe`/`context`/`it`, Preparação/Ação/Validação e exemplos de aplicação das regras. Os agentes
executores (`api-criador.md`, `api-revisor.md`) citam e aplicam estes critérios; não os
redefinem. Em conflito de texto sobre esses critérios, vale o que está aqui.

### Como interpretar as regras

| Classificação        | Significado                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Obrigatória**      | deve ser aplicada sempre que tecnicamente possível, como isolamento e não-vazamento                              |
| **Essencial**        | tipo de teste a cobrir sempre que a operação e a verificação existirem, como fluxo principal e persistência      |
| **Quando aplicável** | depende de o endpoint possuir o conceito, como paginação, permissão, duplicidade ou estado                       |
| **Contratual**       | caso de "quando aplicável" que só vale com a regra confirmada no contrato, como obrigatoriedade, limites e tipos |
| **Baseada em risco** | deve ser selecionada quando evidência, histórico, estrutura ou impacto justificarem                              |
| **Proibida**         | não deve ser feita, como inventar contrato, mascarar defeito ou criar teste sem oráculo claro                    |

Quando uma regra não puder ser aplicada, registre a limitação ou marque o cenário como
`Nao confirmado`. Não preencha lacunas por suposição.

---

## 1.1 Glossário

Termos usados por todos os agentes. Use estas definições para evitar ambiguidade.

| Termo | Definição |
| ----- | --------- |
| **Oráculo** | Forma confiável de decidir se um teste passou ou falhou. Pode vir de contrato, regra de negócio, schema, persistência consultada ou invariante de segurança. |
| **Consulta de persistência** | GET posterior a POST/PUT/PATCH para confirmar que o estado foi gravado corretamente. |
| **Consulta de ausência** | GET por chave única para confirmar que um recurso não existe (ex.: 404) após DELETE ou escrita rejeitada. |
| **Validação incorporada** | Incluir schema, regra de negócio, persistência, não-vazamento e acesso dentro do mesmo cenário funcional, sem criar `it` separado. |
| **Cenário de robustez** | Teste sem regra funcional explícita, cujo oráculo é apenas comportamento controlado: não expor interno, não persistir parcialmente, não corromper estado. |
| **Massa de apoio** | Registro ou estado pré-criado no setup para servir de pré-condição de outro teste. |
| **Rastreamento** | Registrar id/recurso criado durante o teste para que o `afterEach` possa limpar, mesmo se o teste falhar. |
| **Não-vazamento** | Garantia de que respostas de erro não expõem stack trace, pacote/classe interna, SQL ou estrutura do framework. |

---

## 2. Camadas de responsabilidade

Todo teste deve separar claramente estas três camadas:

| Camada                   | O que contém                                                                                                                     | Onde deve ficar                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Padrão universal**     | Qualidade comum: schema fechado, regra de negócio, persistência, erro limpo, não-vazamento, acesso, isolamento e cleanup.        | Este documento, `api-revisor.md` e núcleo compartilhado em `cypress/support/` |
| **Perfil do produto**    | O que muda por produto ou stack: formato de erro, paginação, login, headers, status de acesso e sinais específicos de vazamento. | `config.js`, `auth.api.js`, schemas de erro e assertions compartilhadas             |
| **Contrato do endpoint** | Rotas, payloads, schemas de sucesso, mensagens, limites e regras de negócio da API específica.                                   | `fixtures/schemas/<api>.schema.json` e `e2e/apis/<api>/_support/`                   |

Não coloque regras específicas de Java, .NET, PL/SQL, Oracle ou outra stack no padrão universal. O
padrão determina que detalhes internos não podem vazar; o perfil do produto define quais sinais
representam vazamento naquela stack, como `br.com...`, `System.NullReferenceException`,
`ORA-00001` ou `Traceback`.

---

## 3. Padrão mínimo de validação

> **Conteúdo movido para `pattern/02-validacao-camadas.md`.**
>
> Define a regra mais importante do padrão: um teste não termina em "respondeu 200?". Detalha as
> camadas a validar em respostas de sucesso (status, formato, regra de negócio, persistência) e de
> erro (status, shape, mensagem, não-vazamento, acesso), além do conceito de "respostas relevantes".

---

## 4. Oráculo, checklist e robustez

> **Conteúdo movido para `pattern/01-oraculo-selecao.md`.**
>
> Contém as regras mais usadas do padrão: regra de oráculo, oráculo de ausência e não-persistência,
> segurança corporativa obrigatória (sem token, credencial inválida, permissão insuficiente), o
> **catálogo de tipos de teste a avaliar**, a **tag de catálogo** (`CatalogoTags`) com o mapeamento
> tipo→tag, as técnicas de elaboração, a checklist incorporada, a robustez essencial e o processo
> de decisão para cada cenário.
>
> Esta é a seção mais referenciada do padrão; a tabela "Tag de catálogo" tem local estável neste
> arquivo focado.

---

## 5. Exemplos de aplicação das regras

> **Conteúdo movido para `pattern/05-exemplos.md`.**
>
> Nove exemplos práticos que orientam decisões de oráculo, particionamento, valor limite, tabela de
> decisão, checklist incorporada, seleção de robustez por risco e registro na matriz de cenários.
> Consulte-os sob demanda ao planejar uma suíte.

---

## 6. Estrutura de pastas

```
cypress/
|-- e2e/apis/<api>/
|   |-- crud.cy.js                 ← fluxo feliz + regras de negócio (404, 409…)
|   |-- seguranca.cy.js            ← sem autenticação / sem permissão
|   |-- validacoes.cy.js           ← obrigatórios, limites, tipos
|   `-- _support/                  ← bastidores da API (NÃO são specs)
|       |-- api.js                 ←   chamadas HTTP do recurso
|       |-- payload.js             ←   massa de dados (factories)
|       |-- asserts.js             ←   SÓ regra de negócio (o que o schema não cobre)
|       `-- helpers.js             ←   hooks, cleanup/restauração, massa de apoio
|
|-- fixtures/schemas/
|   |-- <api>.schema.json          ← contrato de SUCESSO (derivado do backend)
|   |-- erro.schema.json           ← erro de negócio/HTTP (404, 409) — genérico
|   `-- erro-validacao.schema.json ← erro de validação de campo (400) — genérico
|
`-- support/                       ← genérico, compartilhado por TODAS as APIs
    |-- api/
    |   |-- client.js              ← wrapper de request (baseUrl + headers + log)
    |   |-- schema.js              ← validarContra(nomeSchema, corpo) via ajv
    |   `-- asserts.base.js        ← BaseAssert (status, semConteudo, erroNegocio, erroValidacao…)
    `-- assertions/
        |-- error.assertions.js    ← guard "não vaza interno" + asserts de auth/permissão
        `-- pagination.assertions.js
```

Regra de ouro: **só `*.cy.js` são testes.** O específico da API fica em `_support/`; o que se
repete entre APIs sobe para `support/`. NUNCA criar arquivo específico de uma API em `support/`.

---

## 7. Organização dos arquivos de support

> **Conteúdo movido para `pattern/06-organizacao-codigo.md`.**
>
> Este arquivo reúne as três seções originais (7, 8 e 9): responsabilidade dos arquivos
> `_support/` (`api.js`, `payload.js`, `asserts.js`, `helpers.js`) e genéricos (`support/`), a regra
> "expect no spec ou no asserts.js?", qual schema usar em cada situação (sucesso, erro de negócio,
> erro de validação) e o contrato de erro e não-vazamento.

---

## 8. Schemas: qual usar quando

> **Conteúdo movido para `pattern/06-organizacao-codigo.md`** (reunido com a seção 7 e 9).

---

## 9. Contrato de erro e não-vazamento

> **Conteúdo movido para `pattern/06-organizacao-codigo.md`** (reunido com a seção 7 e 8).

---

## 10. Convenções

> **Conteúdo movido para `pattern/03-convencoes.md`.**
>
> Hierarquia de leitura da suíte (`describe`/`context`/`it`), nomenclatura de testes (começa com
> `deve`, sem interpolar constantes no título), rastreabilidade entre título e validações, corpo do
> teste em Preparação/Ação/Validação, aninhamento e `return` nas cadeias `.then`, valores e mensagens
> nomeados, asserts compostos com objeto nomeado, codificação UTF-8, logs e credenciais, isolamento,
> cleanup obrigatório, dados únicos, cenários negativos, tags (`@seguranca`/`@melhoria`/`@bug`) e a
> referência à tag de catálogo (definida em `pattern/01-oraculo-selecao.md`).

---

## 11. Comentários e documentação viva

> **Conteúdo movido para `pattern/04-comentarios-jsdoc.md`.**
>
> Regras de comentário: responsabilidade do arquivo no topo, decisões não óbvias, origem do schema e
> motivo de `@bug`. As **seis categorias de comentário obrigatório** nos arquivos `_support`
> (constantes de domínio, sentinelas, helpers técnicos, sequência crítica, filtros defensivos,
> `return` em chains). O **bloco JSDoc de contrato** estruturado acima do `describe` (`@contrato`,
> `@api`, `@campo` e `@regra` com ID, gramática `chave=valor`, `@permissao`, `@cobertura`), o **vínculo
> `@regra:<id>`** de cada teste contratual e as regras do backend que o teste não deixa óbvias.
> Cada teste contratual possui exatamente um vínculo, títulos resolvidos são únicos no spec e regras
> contratuais exigem `operation`/`condition`; os demais atributos só entram quando aplicáveis.

---

## 12. Adaptar a um novo projeto

> **Conteúdo movido para `pattern/07-portabilidade.md`.**
>
> Resume o que a camada `support/` precisa expor (perfil de stack, autenticação, wrapper de request,
> validador de schema, guard de não-vazamento), as dependências comuns, os scripts de lint e as regras
> de pronto. Consulte ao portar o padrão para outro produto.

---

## 13. O que não fazer

- Não tornar um teste verde mascarando comportamento errado (use `@bug` + vermelho).
- Não usar `cy.request` direto no spec — sempre via `_support/api.js`.
- Não validar erro só por status, ou por "contém uma palavra".
- Não compartilhar estado entre `it`s; não deixar registro órfão.
- Não inventar contrato — derive do backend real.
- Não criar cenário sem risco, contrato ou oráculo que justifique sua existência.
- Não transformar toda variação possível de entrada em um teste separado.
- Não encher o código de comentários óbvios. Comentário bom explica motivo, contrato ou decisão.
