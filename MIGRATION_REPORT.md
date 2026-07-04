# Migration Report

## 1. Old Structure Found

The repository had three active-looking layers:

```text
agents/
├── README.md and legacy agent files in the root
├── qa-api-skill/
│   ├── package.json
│   ├── bin/
│   ├── skill/
│   ├── test/
│   └── legacy-agents/
└── duplicated pattern and analyzer folders
```

## 2. Problems Found

- Legacy agents were loose in the repository root.
- The NPM package was nested under `qa-api-skill/`.
- The same legacy agents were duplicated in the root and in `qa-api-skill/legacy-agents/`.
- The root `README.md` was still the old prompt/manual document.
- Workflows in the skill were too short compared with the original agents.
- Active references needed `api-templates.md` as a first-class reference.
- The package layout was confusing for NPM publication.

Hash comparison showed the legacy root files and nested `legacy-agents/` copies were identical for the original agents and pattern files. The active pattern references matched the legacy originals byte for byte after migration.

## 3. New Structure

```text
agents/
├── package.json
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .npmignore
├── bin/
│   └── qa-api-skill.js
├── skill/
│   └── qa-api-testing/
├── archive/
│   └── legacy-agents/
├── test/
│   └── smoke.test.mjs
└── MIGRATION_REPORT.md
```

The repository root is now the publishable NPM package.

## 4. Files Moved

Moved from `qa-api-skill/` to the repository root:

- `package.json`
- `bin/`
- `skill/`
- `test/`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `.gitignore`
- `.npmignore`
- `MIGRATION_REPORT.md`

Moved from root to `archive/legacy-agents/`:

- legacy prompt manual as `README.legacy.md`
- `api-preparador.md`
- `api-mapeador.md`
- `api-criador.md`
- `api-revisor.md`
- `api-pattern.md`
- `api-templates.md`
- `api-perfil.template.md`
- `api-analisador/`
- `mapeamento/`
- `pattern/`

Moved active template content:

- `api-templates.md` is now active at `skill/qa-api-testing/references/api-templates.md`.
- `template-chamado.md` became `skill/qa-api-testing/assets/templates/issue-bdd-template.md`.
- The archive index is `archive/legacy-agents/README.md`; the old agent manual is `archive/legacy-agents/README.legacy.md`.

## 5. Files Removed

- Removed nested `qa-api-skill/`.
- Removed nested `qa-api-skill/legacy-agents/`.
- Removed loose legacy agents from repository root.
- Removed active duplicate `skill/qa-api-testing/assets/templates/api-templates.md`.

## 6. Preserved Archive

The only archived copy of the original agents is:

```text
archive/legacy-agents/
```

This archive is not the active skill and is excluded from the NPM package by `files` and `.npmignore`.

## 7. Skill Content Corrections

- `SKILL.md` remains a small router.
- `setup.md` now preserves audit-before-change, dependencies, lint guards, config/auth/client/schema/assert rules, and authorization pauses.
- `create-api-tests.md` now preserves discovery, planning, implementation, review, delivery, Graphify-first discovery, MAPA DE REGRAS, MAPA DE CONTEXTO E MASSA, MATRIZ DE CENARIOS, oracle, catalog coverage, persistence, security, cleanup, JSDoc, tags, and `@regra`.
- `review-api-tests.md` now preserves strong status/schema/rule/persistence/security/no-leakage/cleanup/JSDoc/tag/coverage/anti-pattern checks.
- `analyze-api-report.md` now preserves two-step analysis, report-as-evidence, backend/test/mass/environment classification, confidence, and ticket creation only when requested.
- `api-mapeador.md` is retained only as fallback in `references/backend-discovery-fallback.md`.

## 8. Graphify

Graphify remains first-class:

- preferred structural discovery
- not a final contract source
- explicit installation only through `qa-api-skill graphify:install`
- no `postinstall`
- Python package: `graphifyy`
- expected CLI: `graphify`

## 9. How To Validate

```bash
npm test
npm run pack:dry
node bin/qa-api-skill.js help
node bin/qa-api-skill.js doctor
```

## 10. How To Publish

Do not publish automatically. When ready:

```bash
npm test
npm run pack:dry
npm publish --access restricted
```

For future GitLab Package Registry publication, configure `.npmrc` with the GitLab registry and token, then run `npm publish` from an authorized pipeline.

## 11. Final Checklist

- [x] package.json is at root.
- [x] bin/ is at root.
- [x] skill/qa-api-testing is at root.
- [x] nested qa-api-skill/ was removed.
- [x] loose legacy agents were removed from root.
- [x] archive/legacy-agents contains the single archived legacy copy.
- [x] qa-api-skill/legacy-agents no longer exists.
- [x] root README is the NPM package README.
- [x] workflows have operational depth.
- [x] references preserve complete pattern content.
- [x] api-mapeador became backend-discovery-fallback.md.
- [x] Graphify is the preferred flow.
- [x] Graphify is not installed by postinstall.
- [x] npm test passed.
- [x] npm run pack:dry passed.
- [x] CLI help passed.
- [x] CLI doctor passed.
