# Publishing

This package is ready for local packaging but must not be published from this task.

Dry run:

```bash
npm run pack:dry
```

Actual publish, when a maintainer intentionally decides to do it later:

```bash
npm publish --access restricted
```

Do not add postinstall hooks for Python, uv, pipx, or Graphify.
