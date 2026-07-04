# @empresa/qa-api-skill

Pacote NPM da Agent Skill `qa-api-testing` para criacao, revisao e analise de testes automatizados de API backend com Cypress, evidencia obrigatoria e Graphify como descoberta estrutural preferencial.

## O Que Este Pacote Instala

O comando `qa-api-skill init` copia a skill ativa para o projeto consumidor em:

```text
.agents/skills/qa-api-testing/
```

A skill ativa vive neste repositorio em:

```text
skill/qa-api-testing/
```

Os agentes antigos foram arquivados somente para rastreabilidade em:

```text
archive/legacy-agents/
```

## Instalar Em Um Projeto Consumidor

```bash
npm install -D @empresa/qa-api-skill
npx qa-api-skill init
```

Atualizar uma skill ja instalada cria backup antes de substituir:

```bash
npx qa-api-skill update
```

## Desenvolvimento Local

```bash
npm install
npm link
qa-api-skill init
qa-api-skill doctor
```

Para validar o pacote local:

```bash
npm test
npm run pack:dry
```

## Comandos Principais

```bash
npx qa-api-skill init
npx qa-api-skill doctor
npx qa-api-skill graphify:doctor --backend ../backend
npx qa-api-skill graphify:install
npx qa-api-skill graphify:build --backend ../backend
npx qa-api-skill graphify:update --backend ../backend
npx qa-api-skill graph-provider --api empresas --graph ../backend/graphify-out/graph.json
```

Consultas diretas:

```bash
npx qa-api-skill graphify:query --graph ../backend/graphify-out/graph.json --question "what controller handles empresas API?"
npx qa-api-skill graphify:path --graph ../backend/graphify-out/graph.json --from "EmpresasController" --to "EmpresaRepository"
npx qa-api-skill graphify:explain --graph ../backend/graphify-out/graph.json --node "EmpresasController"
```

## Usar No Agente

```text
Use a skill qa-api-testing para criar testes de API para a API Empresas.
```

## Graphify

Graphify e first-class nesta skill, mas nao e contrato final. Ele localiza controllers, DTOs, services, repositories, exceptions, security e relacoes de dominio. Toda regra deve ser confirmada no backend real, OpenAPI, documentacao aprovada ou resposta real.

A instalacao e explicita:

```bash
npx qa-api-skill graphify:install
```

Nao existe `postinstall` para Python, `uv`, `pipx` ou Graphify. O pacote Python esperado e `graphifyy`; o comando esperado e `graphify`.

## Publicacao Privada

Antes de publicar:

```bash
npm test
npm run pack:dry
```

Publicacao privada no NPM, quando o mantenedor decidir:

```bash
npm publish --access restricted
```

Este repositorio nao publica automaticamente, nao cria release e nao cria tag.

## GitLab Package Registry Futuro

Para publicar no GitLab Package Registry futuramente, configure o `.npmrc` do projeto ou pipeline com o registry do grupo/projeto e um token com permissao de publish. Exemplo conceitual:

```text
@empresa:registry=https://gitlab.example.com/api/v4/projects/<project-id>/packages/npm/
//gitlab.example.com/api/v4/projects/<project-id>/packages/npm/:_authToken=${NPM_TOKEN}
```

Depois rode `npm publish` no pipeline autorizado. Mantenha `npm test` e `npm run pack:dry` como gates antes da publicacao.

## Fora De Escopo

- Biblioteca Cypress/FailLens runtime.
- Testes frontend/UI.
- Publicacao automatica.
- Scripts avancados de AST proprio.
- Instalacao automatica de Python ou Graphify durante `npm install`.
