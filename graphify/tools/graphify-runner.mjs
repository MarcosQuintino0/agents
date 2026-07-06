#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(scriptDir, "..", "manifest.json");

function fail(message, details = "") {
  console.error(message);
  if (details) {
    console.error(details);
  }
  process.exit(1);
}

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
}

function commandText(result) {
  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();
  return [stdout, stderr].filter(Boolean).join("\n");
}

function extractVersion(output) {
  const match = String(output || "").match(/\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/);
  return match ? match[0] : null;
}

function printHelp() {
  console.log(`Uso:
  node .agents/skills/graphify/tools/graphify-runner.mjs --check
  node .agents/skills/graphify/tools/graphify-runner.mjs --backend ../backend

O runner valida a versão travada em graphify/manifest.json antes de executar Graphify.`);
}

function checkGraphify(manifest) {
  const result = run(manifest.command, ["--version"], process.cwd());

  if (result.error || result.status !== 0) {
    fail(`Graphify não encontrado.

Instale a versão travada:

${manifest.install.uv}

ou:

${manifest.install.pipx}

Depois valide:

${manifest.command} --version`);
  }

  const rawVersion = commandText(result);
  const actualVersion = extractVersion(rawVersion);

  if (actualVersion !== manifest.version) {
    fail(`Versão do Graphify incompatível.

Versão esperada: ${manifest.version}
Versão encontrada: ${actualVersion || rawVersion}

Instale a versão travada:

${manifest.install.uv}`);
  }

  return rawVersion;
}

function parseArgs(argv) {
  const args = { backend: null, check: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--backend") {
      args.backend = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg === "--check") {
      args.check = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    fail(`Argumento desconhecido: ${arg}`);
  }

  return args;
}

const manifest = readManifest();
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const version = checkGraphify(manifest);

if (args.check) {
  console.log(`Graphify OK: ${version}`);
  process.exit(0);
}

if (!args.backend) {
  fail(`Uso incorreto.

Informe o caminho do backend:

node .agents/skills/graphify/tools/graphify-runner.mjs --backend ../backend`);
}

const backendRoot = path.isAbsolute(args.backend) ? args.backend : path.resolve(process.cwd(), args.backend);
if (!fs.existsSync(backendRoot) || !fs.statSync(backendRoot).isDirectory()) {
  fail(`Backend não encontrado: ${args.backend}`);
}

const result = run(manifest.command, ["."], backendRoot);
if (result.error || result.status !== 0) {
  fail(`Graphify falhou com status ${result.status ?? "desconhecido"}.`, commandText(result));
}

console.log("Graphify executado com sucesso.");
