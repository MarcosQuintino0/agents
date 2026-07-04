# Skill Design Decisions

- `SKILL.md` stays small and routes to workflows/references.
- Workflows hold procedural steps.
- References hold detailed rules, playbooks, and migrated source material.
- Scripts handle deterministic CLI integration with Graphify.
- Graphify is first-class discovery but never final contract authority.
- `api-mapeador` is retained as fallback only.
- Rule Registry and Evidence Ledger remain reference patterns and can evolve into stricter tooling later.
- The package does not install Python tools during `npm install`.
