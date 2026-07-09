# Visao Geral do Ecossistema

O QA Skills junta agentes, padroes de teste e ferramentas locais para responder a uma pergunta pratica: como criar testes de API que sejam uteis para cobertura, debug e triagem, sem depender de interpretacao manual a cada falha?

O desenho central e simples:

- os agentes leem o backend real;
- os testes carregam o oraculo em metadata estruturada;
- os relatorios leem essa metadata;
- os achados viram evidencia ou proxima acao.

## Componentes

### Agentes e skills

As skills descrevem o comportamento esperado da IA. Elas dizem quando preparar projeto, quando criar suite, quando revisar, quando investigar falha real e quando criar chamado.

### Projeto consumidor

O projeto consumidor recebe as skills em `.agents/skills`, os scripts `qa:*` no `package.json` e os estados locais em `.agents/state`.

### Graphify

Graphify cria um mapa estrutural do backend. Ele ajuda a IA a encontrar controllers, services, validators e relacoes. Ele nao e contrato final.

### Testes Cypress

Os testes oficiais sao escritos em Cypress e devem carregar metadados como `@contrato`, `@campo`, `@regra`, `@regra:<id>` e `CatalogoTags`.

### FailLens

FailLens executa Cypress com instrumentacao temporaria, captura `cy.request`, le metadata dos testes e gera relatorio HTML/JSON local para debug.

### Fuzzing

O fuzzing cria requests variados com base em OpenAPI, profile ou artefatos da `qa-api`. Ele gera achados investigativos e so promove testes oficiais quando houver oraculo confirmado.

## Contrato entre agentes e ferramentas

O ponto mais importante do ecossistema e o contrato de metadata. A IA precisa escrever testes num formato que as ferramentas consigam ler. Se o teste tem `@regra:<id>` e JSDoc de contrato, o FailLens e o `qa:report` conseguem fazer muito mais do que mostrar `expected 400 got 201`.

Leia tambem [Contrato de Metadata](../referencia/contrato-metadata.md).
