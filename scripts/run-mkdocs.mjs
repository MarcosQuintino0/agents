#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import process from "process";

const projectRoot = process.cwd();
const candidates =
  process.platform === "win32"
    ? [path.join(projectRoot, ".venv-docs", "Scripts", "mkdocs.exe"), "mkdocs"]
    : [path.join(projectRoot, ".venv-docs", "bin", "mkdocs"), "mkdocs"];

const mkdocs = candidates.find((candidate) => candidate === "mkdocs" || fs.existsSync(candidate));
const args = process.argv.slice(2);

if (!args.length) {
  console.error("Uso: node scripts/run-mkdocs.mjs <serve|build> [opcoes]");
  process.exit(1);
}

const result = spawnSync(mkdocs, args, {
  cwd: projectRoot,
  env: {
    ...process.env,
    NO_MKDOCS_2_WARNING: "1",
  },
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) {
  console.error(`[docs] Nao foi possivel executar MkDocs: ${result.error.message}`);
  console.error("Instale as dependencias com: py -m venv .venv-docs; .\\.venv-docs\\Scripts\\python.exe -m pip install -r requirements-docs.txt");
  process.exit(1);
}

process.exitCode = typeof result.status === "number" ? result.status : 1;
