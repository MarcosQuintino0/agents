# Checklist comum de qualidade QA API

Use este checklist como gate comum do `api-criador.md` e do `api-revisor.md`.

## 1. Matriz endpoint x cenário

Antes de criar ou revisar cobertura, monte ou valide a matriz para cada rota/método.

Avalie no mínimo:

- sucesso;
- recurso inexistente, quando houver identificador ou chave;
- validação de payload, quando a operação receber body;
- body ausente, quando a operação receber body;
- campo controlado ou imutável, quando o cliente puder enviar;
- sem autenticação, quando o endpoint for protegido;
- token inválido/malformado, quando houver forma técnica de enviar;
- permissão insuficiente, quando houver usuário/credencial sem permissão;
- persistência, ausência ou preservação após escrita, exclusão ou negativa de segurança;
- não-vazamento em todo erro validado;
- relacionamento inexistente, quando o payload referenciar outro recurso;
- paginação, filtros e ordenação, quando a listagem tiver esse contrato.
- valor limite e payload excessivo para campos livres, strings, listas ou bodies grandes;
- campo desconhecido e mass assignment quando o cliente envia JSON;
- autorização por dono do recurso quando houver usuário, cliente, empresa, unidade, dono ou grupo;
- content-type inválido e método não permitido quando houver risco ou contrato claro;
- rate limit, timeout e concorrência quando houver regra, histórico ou risco relevante.

Operações que compartilham o mesmo validator no backend precisam de representante por operação ou justificativa explícita de incorporação. Não aceite "testado no POST" como cobertura automática do `PUT`.

## 2. Força mínima das assertions

Cada cenário deve validar o oráculo aplicável:

- status HTTP exato em toda resposta relevante;
- schema fechado (`additionalProperties:false`) quando houver contrato de corpo;
- regra de negócio observável;
- persistência, ausência ou preservação quando houver escrita, exclusão ou negativa;
- contrato de erro com shape, mensagem exata quando confirmada e não-vazamento;
- título comprovado por assertion real.

Não aceite teste que valida só status, só chaves soltas, substring de mensagem, listagem paginada como prova de ausência, ou schema/persistência/não-vazamento em testes separados sem motivo.

Quando o script existir, rode `qa:oracle` depois de `qa:report` para medir essa regra de forma
automatica. Com `--faillens`, ele usa evidencias reais capturadas. Com `--run-mutations`, ele chama
os asserts reais em uma spec Cypress temporaria usando respostas mutadas em memoria. Ele nao deve
reenviar `POST`, `PUT`, `PATCH` ou `DELETE` para testar mutation. A limpeza do ambiente continua
sendo responsabilidade da suite Cypress normal.

## 3. Segurança e autorização

Para endpoint protegido:

- cobrir sem autenticação;
- cobrir token inválido/malformado quando tecnicamente possível;
- cobrir permissão insuficiente somente quando houver usuário/credencial sem permissão configurado;
- em `POST` negado, registrar `response.body.id` imediatamente se o backend criar indevidamente;
- em `PUT`, `PATCH` e `DELETE` negados, reconsultar e provar preservação quando houver leitura determinística;
- marcar `@bug` somente com execução real ou evidência documentada.

Ausência de massa sem permissão é lacuna documentada, não teste executável artificial.

## 4. Isolamento, massa e cleanup

- Cada `it` deve ser isolado.
- Tudo que cria, esperado ou indevido, deve ser registrado para cleanup antes das assertions finais.
- Configuração global deve guardar valor original e restaurar no `afterEach`.
- Dados criáveis devem ser únicos por execução.
- Códigos limitados devem usar valor livre obtido com segurança.
- Não use `Cypress.env` para encadear estado entre testes.

## 5. Estrutura Cypress

- Specs não devem usar `cy.request` direto; use o cliente de API.
- `api.js` deve conter chamadas HTTP unitárias.
- Orquestração, cleanup e descoberta por prefixo ficam em helpers.
- Invariantes repetidas ficam em asserts nomeados.
- `expect` inline é aceitável para validação específica e de uso único.
- Asserts com 3+ valores usam objeto nomeado.
- Não use `it.only`, `describe.only`, `context.only`, `cy.wait` fixo ou `cy.log(JSON.stringify(...))`.

## 6. Documentação e rastreabilidade

- `crud.cy.js` deve ter JSDoc de contrato quando houver contrato do recurso: `@contrato`, `@api`, `@resumo`, `@campo`, `@regra`, `@permissao` e `@cobertura`.
- Cada teste contratual deve ter exatamente um vínculo `@regra:<id>` quando houver regra contratual confirmada.
- Cada `it` que vira cenário próprio deve ter uma tag primária de `CatalogoTags` no 2º argumento.
- Tipos incorporados, como schema, persistência e não-vazamento, não recebem tag própria.
- Em data-driven, a tag e o vínculo da regra devem vir do array de dados quando variarem por caso.
- Cada `@cobertura` deve ter motivo curto e claro para QA.
- Use `nao-confirmado` quando faltar contexto, massa, usuário, regra, limite ou decisão do produto.
- Use `nao-aplicavel` somente quando o conceito claramente não existir naquela API.
- Ausência de limite em campo livre não é `nao-aplicavel` automático; trate como `nao-confirmado` ou teste de robustez seguro.
- Comentários devem explicar origem de regra, decisão de massa/cleanup/restauração ou motivo de `@bug`; não escreva comentário óbvio.

## 7. Lacunas e severidade

Classifique lacunas com critério objetivo:

| Severidade | Critério | Exemplo |
| --- | --- | --- |
| Alta | deixa defeito ou vulnerabilidade passar | status-only, sem cleanup, segurança sem preservação |
| Média | enfraquece a suíte sem mascarar defeito | título promete algo sem assertion, tag ausente |
| Baixa | higiene ou legibilidade | interpolação no título, `return` desnecessário |

Use apenas `Alta`, `Média` ou `Baixa`.

## 8. Relatório oficial e ferramentas legadas

Use `npm run qa:report -- --api <nome-da-api>` como relatório oficial estático depois de criar ou
revisar uma suíte, quando o script existir e a pasta da API estiver identificada.

O relatório oficial deve gerar:

- `.agents/state/qa-api/reports/<api>/coverage.html`;
- `.agents/state/qa-api/reports/<api>/coverage.json`.

Não crie nem exija ferramentas legadas como `cy:log`, `relatorio-cobertura` ou
`relatorio-execucao` neste fluxo.

Se ferramentas legadas existirem no projeto consumidor, preserve e use somente quando forem compatíveis. Se não existirem, registre `não configurado neste projeto` e siga sem bloquear.

`report.json` continua relevante apenas para `api-analisador.md`.

## 9. Evidências finais obrigatórias

Antes de entregar criação ou revisão, apresente:

```text
EVIDÊNCIAS DA REVISÃO FINAL
| Verificação | Resultado | Evidência ou lacuna |
| Matriz endpoint x cenário fechada | OK / Lacuna | endpoints/cenários sem teste ou justificativa |
| Títulos comprovados pelas assertions | OK / Lacuna | arquivo e cenário |
| Status de respostas relevantes | OK / Lacuna | arquivo e cenário |
| Schema, regra e erro/não-vazamento | OK / Lacuna | arquivo e cenário |
| Persistência, ausência e preservação | OK / Lacuna | arquivo e cenário |
| Segurança e autorização | OK / Lacuna | arquivo e cenário |
| Cleanup e isolamento | OK / Lacuna | arquivo e cenário |
| JSDoc, tags e vínculos @regra | OK / Lacuna | arquivo e cenário |
| Coberturas `nao-confirmado` e `nao-aplicavel` bem justificadas | OK / Lacuna | explicação simples e evidência |
| Prettier, lint e execução | Passou / Falhou / Não executado | comando e resumo |
| Relatório oficial `qa:report` | Gerado / Falhou / Não aplicável | caminhos de coverage.html e coverage.json |
```

Não declare `OK` sem revisar a implementação correspondente. Lacunas devem ser informadas, não escondidas.
