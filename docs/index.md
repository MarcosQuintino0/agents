# QA Skills

O QA Skills e um ecossistema de agentes, comandos e convencoes para criar uma trilha completa de qualidade de API. Ele ajuda a preparar projetos Cypress, gerar suites oficiais, medir cobertura estatica, investigar falhas reais com FailLens, explorar robustez com fuzzing e transformar evidencias em chamados.

O objetivo nao e apenas produzir testes. O objetivo e criar um ciclo em que a IA le o backend real, escreve testes com oraculo rastreavel, executa ferramentas locais e entrega evidencias que uma pessoa de QA ou desenvolvimento consegue usar sem reconstruir todo o contexto manualmente.

## Como o ecossistema se organiza

```text
Backend real
  -> Graphify gera um mapa estrutural
  -> qa-api confirma contrato no codigo real
  -> suites Cypress carregam JSDoc, @regra e CatalogoTags
  -> qa:report mede cobertura estatica
  -> qa-debug-report/FailLens investiga falhas reais
  -> qa-api-fuzz explora robustez e suspeitas
  -> qa-chamado transforma evidencias em tickets
```

## Skills principais

| Skill | Objetivo | Aprofundar |
| --- | --- | --- |
| `qa-api` | Preparar projetos Cypress/API, criar suites oficiais, revisar cobertura e analisar reports. | [Abrir qa-api](skills/qa-api.md) |
| `qa-api-fuzz` | Fazer fuzzing investigativo com profile rastreavel e oraculos separados por confianca. | [Abrir qa-api-fuzz](skills/qa-api-fuzz.md) |
| `qa-debug-report` | Rodar Cypress com FailLens para investigar falhas reais com HTML, JSON, cURL e Replay. | [Abrir qa-debug-report](skills/qa-debug-report.md) |
| `qa-chamado` | Transformar problemas numerados e evidencias em rascunhos de chamados sem expor segredos. | [Abrir qa-chamado](skills/qa-chamado.md) |
| `graphify` | Validar e executar a versao travada do Graphify usada como mapa do backend. | [Abrir graphify](skills/graphify.md) |

## Por onde comecar

1. Leia [Comece Aqui](comece-aqui.md) para entender a ordem recomendada.
2. Use [Instalacao](guias/instalacao.md) para instalar as skills no projeto consumidor.
3. Siga [Preparar Projeto](guias/preparar-projeto.md) antes de pedir suites de API.
4. Consulte [Quando Usar Cada Skill](ecossistema/quando-usar-cada-skill.md) quando estiver em duvida.

## Prompts mais comuns

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel,
corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites.
Nao crie suites de APIs ainda.
```

```text
Crie testes para a API <nome-da-api>.
Antes de implementar, monte a matriz endpoint x cenario para todas as rotas da API.
Nao deixe cenario aplicavel sem teste ou justificativa.
```

```text
Rode o debug report da API <nome-da-api> e analise as falhas reais da execucao.
Use o HTML/JSON gerado como evidencia observada, sem alterar testes ou backend sem autorizacao.
```
