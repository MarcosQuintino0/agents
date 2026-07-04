# Graphify Installation

Graphify support is explicit. The NPM package does not install Python, uv, pipx, or Graphify during `npm install`.

## Requirements

- Python 3.10+
- `uv` recommended
- `pipx` as alternative
- PyPI package: `graphifyy`
- CLI command: `graphify`

## Commands

```bash
npx qa-api-skill graphify:install
npx qa-api-skill graphify:doctor
npx qa-api-skill graphify:build --backend ./backend
npx qa-api-skill graphify:query --graph ./backend/graphify-out/graph.json --question "show the auth flow"
```

## Install Flow

`graphify:install` tries:

1. `uv tool install graphifyy`
2. `pipx install graphifyy`
3. manual instructions if neither tool is available

No postinstall hook is used.
