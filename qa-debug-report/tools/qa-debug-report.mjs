#!/usr/bin/env node

import { spawnSync } from "child_process";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(toolDir, "..");
const faillensBin = path.join(skillRoot, "vendor", "faillens", "bin", "faillens.js");
const allowedCommands = new Set(["run", "open", "generate"]);

function log(message = "") {
  console.log(message);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  log(`qa-debug-report

Uso:
  node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs run [--open] [-- argumentos do Cypress]
  node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs open [--report diretorio] [--port numero] [--no-browser]
  node .agents/skills/qa-debug-report/tools/qa-debug-report.mjs generate --input caminho.json --output caminho.html

Scripts recomendados:
  npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
  npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"
  npm run qa:debug:open

Saidas padrao:
  reports/faillens/index.html
  reports/faillens/faillens-report.json

Para habilitar a aba Replay, abra o relatorio em localhost:
  npm run qa:debug:open`);
}

function printRunHelp() {
  log(`Uso:
  npm run qa:debug -- --spec "cypress/e2e/apis/users/**/*.cy.js"
  npm run qa:debug -- --open --spec "cypress/e2e/apis/users/**/*.cy.js"

O comando executa Cypress com instrumentacao temporaria do FailLens e preserva o exit code do Cypress.
Argumentos apos "run" sao encaminhados ao FailLens/Cypress.

Use --open para executar, gerar e abrir o relatorio em localhost, necessario para a aba Replay.`);
}

function printOpenHelp() {
  log(`Uso:
  npm run qa:debug:open
  npm run qa:debug:open -- --report reports/faillens
  npm run qa:debug:open -- --port 4317

Abre o ultimo relatorio FailLens em um servidor local temporario em 127.0.0.1.`);
  log(`
Use este comando quando quiser usar a aba Replay. O HTML aberto via file:// e somente leitura.`);
}

function printGenerateHelp() {
  log(`Uso:
  npm run qa:debug:generate -- --input reports/faillens/faillens-report.json --output reports/faillens/index.html

Regenera o HTML standalone a partir de um JSON FailLens existente.`);
}

const [command, ...rest] = process.argv.slice(2);

if (!command || command === "--help" || command === "-h" || command === "help") {
  printHelp();
  process.exit(0);
}

if (!allowedCommands.has(command)) {
  fail(`Comando desconhecido ou nao exposto pela skill: ${command}

Comandos disponiveis: run, open, generate`);
}

if (rest.includes("--help") || rest.includes("-h")) {
  if (command === "run") printRunHelp();
  if (command === "open") printOpenHelp();
  if (command === "generate") printGenerateHelp();
  process.exit(0);
}

const result = spawnSync(process.execPath, [faillensBin, command, ...rest], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) {
  fail(`[qa-debug-report] Falha ao executar FailLens: ${result.error.message}`);
}

process.exitCode = typeof result.status === "number" ? result.status : 1;
