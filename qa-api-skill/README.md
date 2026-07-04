# QA API Skill

Pacote NPM da skill `qa-api-testing` para criar, revisar e analisar testes automatizados de API backend com Cypress, usando Graphify como descoberta preferencial.

## Install Package

```bash
npm install -D @empresa/qa-api-skill
```

## Install Skill

```bash
npx qa-api-skill init
```

The skill is copied to:

```text
.agents/skills/qa-api-testing/
```

To update an existing install with backup:

```bash
npx qa-api-skill update
```

## Install Graphify

Graphify is installed only by explicit command:

```bash
npx qa-api-skill graphify:install
```

This tries `uv tool install graphifyy`, then `pipx install graphifyy`. There is no `postinstall`.

## Generate Graph

```bash
npx qa-api-skill graphify:build --backend ../backend
```

## Verify

```bash
npx qa-api-skill doctor
npx qa-api-skill graphify:doctor --backend ../backend
```

## Query Graph

```bash
npx qa-api-skill graphify:query --graph ../backend/graphify-out/graph.json --question "what controller handles empresas API?"
npx qa-api-skill graphify:path --graph ../backend/graphify-out/graph.json --from "EmpresasController" --to "EmpresaRepository"
npx qa-api-skill graphify:explain --graph ../backend/graphify-out/graph.json --node "EmpresasController"
npx qa-api-skill graph-provider --api empresas --graph ../backend/graphify-out/graph.json
```

`graph-provider` writes:

```text
.faillens/graph/<api>.graph-evidence.json
.faillens/graph/<api>.graph-evidence.md
```

## Use Skill

```text
Use a skill qa-api-testing para criar testes de API para a API Empresas.
```

## What Graphify Improves

- structural discovery
- relationships between files
- domain context
- less manual search
- more efficient reading

## Limit

Graphify does not confirm rules by itself. The real backend is the source of truth, along with OpenAPI, approved docs, and real responses.

## Development

```bash
npm test
npm run pack:dry
```

Do not run `npm publish` from this task.
