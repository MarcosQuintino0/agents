# Manual de Uso: Agentes de Testes de API

Bem-vindo! Este é o **manual de uso** dos agentes de IA que criam, revisam e analisam testes de
API no Cypress. Se você nunca usou antes, comece pelo **Guia de Início Rápido** abaixo.

> **O que são estes agentes?** São instruções (arquivos `.md`) que você passa para a sua IA
> (Claude, Cursor, Copilot, etc.) junto com o caminho do seu projeto. A IA lê a instrução e
> executa a tarefa descrita — preparar o projeto, mapear o backend, criar testes, etc.

---

## 🚀 Guia de Início Rápido (faça nesta ordem)

Se você está começando em um projeto de automação **zerado** (pasta vazia, sem testes, sem base),
siga exatamente os prompts abaixo, nesta ordem. Copie, cole e substitua os textos entre `< >`.

---

### ⭐ PROMPT 1 — Preparar a base do projeto (faça 1 vez no início)

> Este passo prepara o projeto Cypress: instala dependências, cria configurações, autenticação e
> a base compartilhada. Pode pedir sua autorização antes de instalar pacotes.

Copie e cole na sua IA:

```text
Analise o projeto atual e o backend em C:/caminho/do/backend seguindo
.ai/agents/api-preparador.md.

Audite a base compartilhada antes de alterar arquivos.
Preserve tudo que já estiver adequado.
Apresente as lacunas e o plano.
Peça autorização antes de instalar dependências ou criar/refatorar arquivos da base.
```

**Substitua:** `C:/caminho/do/backend` pelo caminho onde está o código-fonte da sua API.

**O que vai acontecer:** a IA vai auditar o projeto, mostrar o que falta e pedir sua autorização
antes de instalar coisas ou alterar arquivos sensíveis.

---

### ⭐ PROMPT 2 — Mapear o backend (faça 1 vez, ou quando o backend mudar)

> Este passo gera um "mapa" (índice) das APIs que existem no seu backend. Ele acelera o próximo
> passo, para a IA não ter que caçar os endpoints no código a cada vez. Não altera nada no backend.

Copie e cole na sua IA:

```text
Mapeie todas as APIs REST do backend em C:/caminho/do/backend seguindo
.ai/agents/api-mapeador.md.

Gere o índice em .ai/agents/mapeamento/mapeamento-api.md.
Não altere nenhum arquivo do backend — apenas leitura.
```

**Substitua:** `C:/caminho/do/backend` pelo caminho do seu backend.

**O que vai acontecer:** a IA vai ler o backend (em qualquer linguagem: Java, .NET, Node, Python),
encontrar os controllers e endpoints, e gerar um índice em
`.ai/agents/mapeamento/mapeamento-api.md`.

---

### ⭐ PROMPT 3 — Criar os testes de uma API (repita para cada API)

> Este passo cria a suíte de testes completa de uma API. A IA vai ler o backend (ou o mapeamento,
> se você fez o PROMPT 2), analisar o contrato, planejar os cenários e implementar os testes.

Copie e cole na sua IA:

```text
Analise o backend em C:/caminho/do/backend e crie ou refatore os testes da API
<nome-da-api> seguindo .ai/agents/api-criador.md.

- API destino: cypress/e2e/apis/<nome-da-api>/
- Comando de execução: npm run cy:log -- --spec "cypress/e2e/apis/<nome-da-api>/**/*.cy.js"

Entregue a análise, a cobertura do catálogo e a matriz de cenários, documente o
plano de implementação e siga diretamente até a execução e revisão final.
```

**Substitua:**
- `C:/caminho/do/backend` pelo caminho do seu backend
- `<nome-da-api>` pelo nome da API que você quer testar (ex.: `alegacao-ans`, `empresa`, etc.)

**O que vai acontecer:** a IA vai analisar a API, planejar os testes, escrever o código dos testes,
rodar o lint e entregar um resumo do que fez. Se o mapeamento do PROMPT 2 existir, ela vai usá-lo
para ir direto aos arquivos certos (mais rápido).

---

### PROMPT 4 (opcional) — Revisar os testes criados

> Se você já tem testes e quer saber se estão bons, use este prompt. A IA vai auditar e apontar
> lacunas, mas não vai alterar nada sem você pedir.

Copie e cole na sua IA:

```text
Revise a suíte cypress/e2e/apis/<nome-da-api>/ seguindo
.ai/agents/api-revisor.md.

Compare com o backend em C:/caminho/do/backend.
Primeiro entregue as lacunas e o plano. Não altere arquivos ainda.
```

---

### PROMPT 5 (opcional) — Analisar falhas após rodar os testes

> Depois de executar os testes e gerar o `report.json`, use este prompt para que a IA investigue
> o que passou, o que falhou e por quê.

Copie e cole na sua IA:

```text
Analise o report.json da API <nome-da-api> seguindo
.ai/agents/api-analisador/agente.md.

O backend está em C:/caminho/do/backend.
Primeiro entregue somente a análise numerada.
```

---

## Resumo visual do fluxo

```text
PROMPT 1 (1x)          PROMPT 2 (1x)         PROMPT 3 (para cada API)
preparador             mapeador              criador
   │                      │                     │
   ▼                      ▼                     ▼
Base pronta          Índice pronto          Testes criados
(config, auth,       (.ai/agents/           (specs, support,
 dependências)        mapeamento/)            schemas)
                                                    │
                                    ┌───────────────┴───────────────┐
                                    ▼                               ▼
                              PROMPT 4 (opcional)           Rodar testes no CI
                              revisor                       (npm run cy:log)
                              (audita a suíte)                      │
                                                                    ▼
                                                            PROMPT 5 (opcional)
                                                            analisador
                                                            (investiga falhas)
```

---

## Detalhes técnicos (leia se quiser entender melhor)

### Agentes executores

Agentes executores realizam análises e podem alterar arquivos quando o fluxo e as autorizações
permitirem.

| Agente                         | Responsabilidade principal                                            | Altera arquivos?                                   |
| ------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------- |
| `api-preparador.md`            | Auditar e preparar a base compartilhada dos testes de API.            | Somente após auditoria e autorizações necessárias. |
| `api-mapeador.md`              | Mapear endpoints do backend (gera índice de ponteiros em `.ai/agents/mapeamento/`). | Não altera o backend (read-only); gera só o índice no projeto de automação. |
| `api-criador.md`          | Analisar uma API, planejar e implementar sua suíte de testes.         | Sim, após documentar a análise e o plano.          |
| `api-revisor.md`         | Auditar uma suíte existente e identificar lacunas ou testes fracos.   | Somente com autorização para corrigir.             |
| `api-analisador/agente.md` | Analisar o `report.json` e investigar falhas ou aprovações suspeitas. | Não altera testes ou backend automaticamente.      |

### Documentos de referência

Documentos de referência não devem ser invocados como agentes executores. Eles fornecem regras,
checklists e exemplos usados pelos agentes.

| Documento                                | Responsabilidade                                             |
| ---------------------------------------- | ------------------------------------------------------------ |
| `api-pattern.md`                    | Fonte única de qualidade, seleção, nomenclatura e estrutura. |
| `api-templates.md`                  | Exemplos técnicos para implementar support, schemas e specs. |
| `api-perfil.template.md`        | Checklist para descobrir o que muda por produto e stack.     |
| `api-analisador/template-chamado.md` | Formato obrigatório dos rascunhos de chamados.               |

O `api-pattern.md` define o catálogo de tipos de teste, técnicas inspiradas no ISTQB, oráculo,
checklist, robustez, nomenclatura, estrutura dos specs e critérios para evitar cenários redundantes.
O creator aplica essas regras e o reviewer verifica seu cumprimento; eles não devem redefini-las.

---

## Fluxo recomendado

```text
1. api-preparador.md               -> prepara ou audita a base compartilhada
2. api-mapeador.md                 -> mapeia os endpoints do backend (índice de ponteiros)
3. api-criador.md             -> analisa, planeja, cria a suíte e gera a cobertura factual
4. api-revisor.md            -> revisa uma suíte existente e valida a cobertura factual
5. api-analisador/agente.md    -> analisa os resultados após a execução
```

O setup normalmente é executado uma vez por projeto ou quando a base compartilhada muda. O mapeador
pode ser chamado pelo preparador na primeira vez, ou isoladamente quando o backend mudar. O criador
consulta o mapeamento (se existir) antes de caçar endpoints, acelerando a descoberta. Creator,
reviewer e report analyzer podem ser usados separadamente conforme a necessidade.

---

## 🚀 Quickstart: projeto do zero

Se você está começando em um projeto de automação zerado (sem base compartilhada e sem testes),
siga esta ordem exata de prompts:

### Passo 1: Preparar a base (1 vez por projeto)
```text
Analise o projeto atual e o backend em C:/caminho/do/backend seguindo
.ai/agents/api-preparador.md.

Audite a base compartilhada antes de alterar arquivos.
Preserve tudo que já estiver adequado.
Apresente as lacunas e o plano.
Peça autorização antes de instalar dependências ou criar/refatorar arquivos da base.
```

### Passo 2: Mapear o backend (1 vez, ou quando o backend mudar)
```text
Mapeie todas as APIs REST do backend em C:/caminho/do/backend seguindo
.ai/agents/api-mapeador.md.

Gere o índice em .ai/agents/mapeamento/mapeamento-api.md.
Não altere nenhum arquivo do backend — apenas leitura.
```

### Passo 3: Criar os testes da API (repita para cada API)
```text
Analise o backend em C:/caminho/do/backend e crie ou refatore os testes da API
<nome-da-api> seguindo .ai/agents/api-criador.md.

- API destino: cypress/e2e/apis/<nome-da-api>/
- Comando de execução: npm run cy:log -- --spec "cypress/e2e/apis/<nome-da-api>/**/*.cy.js"

Entregue a análise, a cobertura do catálogo e a matriz de cenários, documente o
plano de implementação e siga diretamente até a execução e revisão final.
```

### Passo 4 (opcional): Revisar a suíte criada
```text
Revise a suíte cypress/e2e/apis/<nome-da-api>/ seguindo
.ai/agents/api-revisor.md.

Compare com o backend em C:/caminho/do/backend.
Primeiro entregue as lacunas e o plano. Não altere arquivos ainda.
```

### Passo 5 (opcional): Analisar resultados da execução
```text
Analise o report.json da API <nome-da-api> seguindo
.ai/agents/api-analisador/agente.md.

O backend está em C:/caminho/do/backend.
Primeiro entregue somente a análise numerada.
```

---

## 1. Preparar o projeto

Use `api-preparador.md` ao começar em um projeto ou quando não souber se a base compartilhada está
pronta.

### Responsabilidades

O setup:

- audita dependências, estrutura e arquivos compartilhados;
- audita configuração e scripts do ESLint;
- verifica `config.js`, autenticação, client, schemas e assertions comuns;
- identifica componentes ausentes ou fora do padrão;
- preserva arquivos adequados;
- apresenta auditoria e plano antes de alterações sensíveis.

O setup não cria testes específicos de endpoints.

### Pausas e autorizações

O setup deve pedir autorização antes de:

- instalar dependências;
- criar ou refatorar `auth.api.js`;
- refatorar arquivos existentes fora do padrão;
- alterar schemas de erro existentes.

### Prompt recomendado

```text
Analise o projeto atual e o backend em C:/caminho/do/backend seguindo
.ai/agents/api-preparador.md.

Audite a base compartilhada antes de alterar arquivos.
Preserve tudo que já estiver adequado.
Apresente as lacunas e o plano.
Peça autorização antes de instalar dependências, refatorar arquivos existentes
ou criar/refatorar auth.api.js.
```

Se o backend não estiver disponível, o setup deve registrar as limitações e não inventar contrato,
formato de erro ou sinais específicos da stack.

---

## 2. Mapear os endpoints do backend

Use `api-mapeador.md` para gerar um índice (GPS) das APIs do backend. Isso acelera a descoberta do
criador, que não precisa caçar endpoints no código a cada invocação.

### Prompt recomendado

```text
Mapeie todas as APIs REST do backend em C:/caminho/do/backend seguindo
.ai/agents/api-mapeador.md.

Gere o índice em .ai/agents/mapeamento/mapeamento-api.md.
Não altere nenhum arquivo do backend — apenas leitura.
```

> O `api-preparador.md` pode sugerir executar este passo automaticamente na primeira vez. Você pode
> re-rodar este prompt isoladamente sempre que o backend mudar significativamente.

---

## 3. Criar ou refatorar testes de uma API

Use `api-criador.md` depois que a base compartilhada estiver pronta.

### Responsabilidades

O creator:

- analisa o perfil do produto e o contrato real do endpoint;
- descobre operações, payloads, regras, erros e estratégia de dados;
- aplica o catálogo, técnicas, oráculo e regras do `api-pattern.md`;
- apresenta a cobertura do catálogo e a matriz de cenários;
- evita cenários redundantes ou sem justificativa;
- implementa somente o plano documentado;
- executa o lint e corrige violações reais sem ocultá-las;
- executa, revisa e entrega os resultados.

O creator não deve redefinir as regras do pattern nem alterar silenciosamente a base compartilhada.
Se encontrar lacunas em `config.js`, autenticação, schemas de erro ou assertions comuns, deve
registrá-las no plano e propor executar ou retomar o setup.

### Continuidade e proteções

O creator deve apresentar a análise e o plano e seguir diretamente para a implementação na mesma
execução.

Deve pedir uma decisão ao usuário somente quando precisar:

- criar ou refatorar autenticação;
- instalar dependências ou alterar configuração compartilhada sensível;
- alterar estrutura compartilhada fora do escopo solicitado;
- escolher entre estratégias de massa ou cleanup com riscos materiais diferentes;
- resolver regra importante com interpretações conflitantes.

### Prompt recomendado

```text
Analise o backend em C:/caminho/do/backend e crie ou refatore os testes da API
<nome-da-api> seguindo .ai/agents/api-criador.md.

- API destino: cypress/e2e/apis/<api>/
- Spec antiga, se existir: <caminho ou "nenhuma">
- Comando de execução: npm run cy:log -- --spec "cypress/e2e/apis/<api>/**/*.cy.js"

Entregue a análise, a cobertura do catálogo e a matriz de cenários, documente o
plano de implementação e siga diretamente até a execução e revisão final.
```

---

## 4. Revisar uma suíte existente

Use `api-revisor.md` quando uma suíte já existe e você precisa avaliar sua confiabilidade,
cobertura e aderência ao padrão.

### Responsabilidades

O reviewer:

- compara os testes com o contrato real e o perfil do produto;
- verifica se o catálogo do pattern foi considerado;
- identifica validações fracas, ausentes ou ambíguas;
- procura cenários redundantes, falta de persistência, cleanup ou isolamento;
- executa o lint e identifica práticas frágeis do JavaScript ou Cypress;
- diferencia defeito do backend de problema no teste;
- apresenta lacunas e plano de correção.

O reviewer deve consultar o `api-pattern.md` como fonte das regras. Ele não deve inventar
conceitos ausentes no produto nem enfraquecer validações para fazer testes passarem.

### Autorização

Por padrão, o reviewer primeiro entrega a auditoria. Correções e novos cenários somente devem ser
implementados após autorização.

### Prompt recomendado

```text
Revise a suíte cypress/e2e/apis/<api>/ seguindo
.ai/agents/api-revisor.md.

Compare com o backend em C:/caminho/do/backend e com as regras de
.ai/agents/api-pattern.md.

Primeiro entregue as lacunas e o plano. Não altere arquivos ainda.
```

---

## Verificações automáticas

Depois que o setup preparar o projeto, os agentes creator e reviewer devem executar:

```bash
npm run lint
```

Para aplicar somente correções automáticas revisadas:

```bash
npm run lint:fix
```

O `lint:fix` não substitui revisão. Regras não devem ser desativadas e arquivos novos não devem ser
ignorados apenas para ocultar violações.

---

## 5. Analisar o relatório de execução

Use `api-analisador/agente.md` depois de executar uma suíte e gerar
`cypress/logs/report.json`.

Esse agente é independente do setup, creator e reviewer.

### Responsabilidades

O report analyzer:

- filtra no relatório os testes relacionados à API informada;
- faz triagem de testes aprovados e investiga falhas ou aprovações suspeitas;
- consulta specs, schemas, assertions e backend quando necessário;
- diferencia defeito do backend, problema no Cypress, ambiente e caso inconclusivo;
- entrega problemas numerados com confiança e limitações.

Ele não altera testes ou backend e não cria chamados durante a análise inicial.

### Fluxo obrigatório em duas etapas

1. O agente entrega somente a análise numerada.
2. O usuário seleciona os problemas que devem virar rascunhos de chamados.

O agente nunca abre chamados diretamente no board. Os rascunhos usam
`api-analisador/template-chamado.md` e devem passar por revisão humana.

### Prompt para análise

```text
Analise o report.json da API <nome-da-api> seguindo
.ai/agents/api-analisador/agente.md.

O backend está em C:/caminho/do/backend.
Primeiro entregue somente a análise numerada.
```

### Prompt para criar rascunhos depois da análise

```text
Crie rascunhos de chamados para os problemas 1, 2 e 5 da análise anterior,
utilizando .ai/agents/api-analisador/template-chamado.md.
```

---

## 6. Gerar o relatório de cobertura (inventário)

Diferente do `api-analisador` (que analisa a **execução**, o `report.json`), o relatório de
cobertura é **estático**: responde "o que esta API testa?" sem rodar a suíte.

O script `tools/relatorio-cobertura` (sem IA, sem token) extrai por análise estática o inventário, a
matriz de catálogo, a cobertura por campo e os chamados. Gera `cobertura-<api>.md` e `.json`.

```bash
node tools/relatorio-cobertura cypress/e2e/minha-api
node tools/relatorio-cobertura cypress/e2e/minha-api/crud.cy.js
```

O `api-criador.md` deve rodar esse comando ao final da criação/refatoração. O
`api-revisor.md` deve rodar o mesmo comando durante a auditoria e tratar avisos do gerador como
evidência objetiva de lacunas de tags, JSDoc, `@cobertura` ou parse.

A classificação de cada `it` por **tag de catálogo** (`CatalogoTags`, 2º argumento) é o que alimenta a
matriz de cobertura — ver "Tag de catálogo" em `pattern/01-oraculo-selecao.md`. Detalhes de
portabilidade do script em `tools/relatorio-cobertura/README.md`.

Além do catálogo, o `crud.cy.js` declara um **contrato JSDoc estruturado** (`@contrato`, `@campo` e
`@regra` com ID estável, gramática `chave=valor`) e cada teste contratual liga-se à sua regra pela tag
`@regra:<id>` — vocabulário aberto por ID, distinto de `CatalogoTags`. Cada teste contratual usa
exatamente um vínculo e seu título resolvido é único no spec. O gerador mostra o vínculo na seção
"Vinculo regra <-> teste" e avisa sobre regra sem teste, referência inexistente, vínculo
duplicado/múltiplo, título duplicado e parte das divergências de status que puder provar
estaticamente. Esse contrato é a fonte de procedência que o FailLens usa para gerar afirmações
rastreáveis. Gramática completa em `pattern/04-comentarios-jsdoc.md`.

---

## Como adaptar para outro produto

Os agentes e as regras são genéricos. O código de automação pode e deve permanecer simples e
específico para o produto atual.

Ao adaptar para outro produto, o setup e o creator usam `api-perfil.template.md` como
checklist interno para descobrir:

- autenticação e autorização;
- formato e schemas de erro;
- paginação;
- headers e configuração;
- sinais de vazamento específicos da stack;
- assertions compartilhadas que precisam de adaptação.

O usuário normalmente não precisa mencionar `api-perfil.template.md` no prompt.

---

## Regras de colaboração

- O contrato real do endpoint define o comportamento funcional esperado.
- O `api-pattern.md` é a fonte única das regras de qualidade, seleção, nomenclatura e estrutura.
- Arquivos existentes adequados devem ser preservados.
- Alterações sensíveis ou fora do escopo solicitado exigem autorização.
- Defeitos do backend não devem ser mascarados para fazer testes passarem.
- Limitações e informações não confirmadas devem ser informadas claramente.
