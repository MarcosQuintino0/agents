# QA Skills

Pacote instalador das skills `qa-api`, `qa-chamado` e `graphify`.

## Instalacao recomendada

```bash
npx @marcosquintino/qa-skills install
```

Esse comando:

- copia as skills para `.agents/skills`;
- instala ou valida `graphifyy==0.9.8`;
- configura `qa:reindex` e `qa:reindex:check` no `package.json`, quando ele existir.

## Opcoes comuns

```bash
npx @marcosquintino/qa-skills install --backend ../ressus-backend
npx @marcosquintino/qa-skills install --skip-graphify
npx @marcosquintino/qa-skills install --target .codex/skills
```

Observacao: nomes de pacote npm usam minusculo, por isso o comando usa
`@marcosquintino/qa-skills`.
