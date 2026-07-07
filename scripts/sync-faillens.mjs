#!/usr/bin/env node

import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repoRoot, "packages", "faillens");
const targetRoot = path.join(repoRoot, "qa-debug-report", "vendor", "faillens");
const requiredSourceItems = ["bin", "dist", "package.json", "README.md", "LICENSE"];
const requiredOutputItems = [
  path.join("bin", "faillens.js"),
  path.join("dist", "cli", "index.js"),
  "package.json",
  "README.md",
  "LICENSE",
];

function toPosix(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

function log(message = "") {
  console.log(message);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertInsideRepo(targetPath, label) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} fora da raiz do repositorio: ${targetPath}`);
  }
  return resolved;
}

function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target);
    } else if (entry.isFile()) {
      fs.copyFileSync(source, target);
    }
  }
}

function copyItem(name) {
  const source = path.join(sourceRoot, name);
  const target = path.join(targetRoot, name);

  if (!fs.existsSync(source)) {
    fail(`Fonte ausente: ${toPosix(path.relative(repoRoot, source))}`);
  }

  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    copyDir(source, target);
  } else if (stat.isFile()) {
    fs.copyFileSync(source, target);
  }
}

assertInsideRepo(sourceRoot, "Fonte FailLens");
assertInsideRepo(targetRoot, "Destino FailLens");

if (!fs.existsSync(sourceRoot)) {
  fail("packages/faillens nao existe. Copie o codigo-fonte do FailLens antes de sincronizar.");
}

if (!fs.existsSync(path.join(sourceRoot, "dist"))) {
  fail("packages/faillens/dist nao existe. Rode npm run build:faillens antes de sincronizar.");
}

fs.rmSync(targetRoot, { recursive: true, force: true });
fs.mkdirSync(targetRoot, { recursive: true });

for (const item of requiredSourceItems) {
  copyItem(item);
}

for (const item of requiredOutputItems) {
  const output = path.join(targetRoot, item);
  if (!fs.existsSync(output)) {
    fail(`Runtime sincronizado incompleto: ${toPosix(path.relative(repoRoot, output))}`);
  }
}

log(`FailLens sincronizado em ${toPosix(path.relative(repoRoot, targetRoot))}`);
