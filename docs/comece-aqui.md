# Comece Aqui

Esta documentacao foi escrita para dois publicos: quem usa as skills em um projeto consumidor e quem mantem o pacote `@marcosquintino/qa-skills`.

Se voce esta usando as skills em um produto, pense no fluxo como uma esteira. Primeiro instala, depois prepara o projeto, depois cria ou revisa uma suite, depois gera relatorios e so entao transforma evidencias em chamados.

## Fluxo recomendado

1. Instale as skills no projeto consumidor.
2. Rode ou peca para a IA rodar o preparo do projeto.
3. Crie suites por API, sempre com matriz endpoint x cenario.
4. Gere `qa:report` para cobertura estatica.
5. Use `qa:debug` somente quando quiser investigar uma falha real de execucao.
6. Use `qa:fuzz` para robustez investigativa, sem substituir a suite oficial.
7. Use `qa-chamado` quando ja houver problemas numerados e evidencias fortes.

## Instalacao rapida

No projeto consumidor:

```bash
npx @marcosquintino/qa-skills install --backend ../backend
```

Troque `../backend` pelo caminho relativo correto do backend.

Depois peça:

```text
Prepare o projeto para testes de API.
Valide Graphify e o lock do backend, execute os comandos necessarios quando possivel,
corrija lacunas da base comum Cypress/API e deixe o projeto pronto para criar suites.
Nao crie suites de APIs ainda.
```

## O que nao fazer no inicio

- Nao peca para criar suite especifica antes do preparo.
- Nao use Graphify como contrato final da API.
- Nao rode fuzzing profundo em ambiente compartilhado sem massa e cleanup seguros.
- Nao use `qa:debug` como substituto de `qa:report`.
- Nao transforme falha de teste em chamado sem evidencia do produto.

## Proxima leitura

- [Visao Geral do Ecossistema](ecossistema/visao-geral.md)
- [Quando Usar Cada Skill](ecossistema/quando-usar-cada-skill.md)
- [Instalacao](guias/instalacao.md)
