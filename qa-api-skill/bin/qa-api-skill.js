#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  buildGraph,
  checkGraphifyEnvironment,
  installGraphify,
  updateGraph,
} from "../skill/qa-api-testing/scripts/graphify-manager.js";
import {
  explainNode,
  findPath,
  queryGraph,
} from "../skill/qa-api-testing/scripts/graph-query.js";
import { provideGraphEvidence } from "../skill/qa-api-testing/scripts/graph-provider.js";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), "..");
const sourceSkill = path.join(packageRoot, "skill", "qa-api-testing");

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        parsed[key] = true;
      } else {
        parsed[key] = next;
        index += 1;
      }
    } else {
      parsed._.push(value);
    }
  }
  return parsed;
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function consumerSkillPath(cwd = process.cwd()) {
  return path.join(cwd, ".agents", "skills", "qa-api-testing");
}

function copySkill(target, { backup = false } = {}) {
  if (!fs.existsSync(sourceSkill)) {
    throw new Error(`Source skill not found: ${sourceSkill}`);
  }

  if (fs.existsSync(target)) {
    if (!backup) {
      throw new Error(`Skill already exists at ${target}. Use update to replace it with a backup.`);
    }
    const backupPath = `${target}.backup-${timestamp()}`;
    fs.cpSync(target, backupPath, { recursive: true });
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Backup created: ${path.relative(process.cwd(), backupPath)}`);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(sourceSkill, target, { recursive: true });
  console.log(`Skill installed: ${path.relative(process.cwd(), target)}`);
}

function checkPath(label, target) {
  const ok = fs.existsSync(target);
  console.log(`${ok ? "[OK]" : "[WARN]"} ${label}: ${target}`);
  return ok;
}

function compareNodeVersion() {
  const major = Number(process.versions.node.split(".")[0]);
  const ok = major >= 18;
  console.log(`${ok ? "[OK]" : "[WARN]"} Node: ${process.version} (required >= 18)`);
  return ok;
}

function runDoctor() {
  const pkg = readPackageJson();
  let warnings = 0;
  console.log(`qa-api-skill ${pkg.version}`);
  if (!compareNodeVersion()) warnings += 1;

  const installed = consumerSkillPath();
  if (!checkPath("Installed skill", installed)) warnings += 1;
  if (!checkPath("Installed SKILL.md", path.join(installed, "SKILL.md"))) warnings += 1;

  const required = [
    path.join(sourceSkill, "SKILL.md"),
    path.join(sourceSkill, "workflows"),
    path.join(sourceSkill, "references"),
    path.join(sourceSkill, "references", "graph-discovery.md"),
    path.join(sourceSkill, "references", "graph-query-playbook.md"),
    path.join(sourceSkill, "scripts", "graphify-manager.js"),
    path.join(sourceSkill, "scripts", "graph-provider.js"),
  ];
  for (const item of required) {
    if (!checkPath("Package asset", item)) warnings += 1;
  }

  const environment = checkGraphifyEnvironment({ cwd: process.cwd() });
  for (const line of environment.lines) {
    console.log(line);
  }
  warnings += environment.warnings;
  console.log(`${warnings === 0 ? "[OK]" : "[WARN]"} Doctor completed with ${warnings} warning(s).`);
  return 0;
}

function runGraphifyDoctor(options) {
  const environment = checkGraphifyEnvironment({
    cwd: process.cwd(),
    backendPath: options.backend,
    graphPath: options.graph,
  });
  console.log("Graphify environment");
  for (const line of environment.lines) {
    console.log(line);
  }
  console.log(`${environment.warnings === 0 ? "[OK]" : "[WARN]"} graphify:doctor completed with ${environment.warnings} warning(s).`);
  return 0;
}

function printHelp() {
  console.log(`qa-api-skill

Usage:
  qa-api-skill help
  qa-api-skill init
  qa-api-skill update
  qa-api-skill doctor
  qa-api-skill graphify:doctor [--backend <path>] [--graph <path>]
  qa-api-skill graphify:install
  qa-api-skill graphify:build --backend <path>
  qa-api-skill graphify:update --backend <path>
  qa-api-skill graphify:query --graph <path-to-graph.json> --question "<question>"
  qa-api-skill graphify:path --graph <path-to-graph.json> --from "<node>" --to "<node>"
  qa-api-skill graphify:explain --graph <path-to-graph.json> --node "<node>"
  qa-api-skill graph-provider --api <api-name> --graph <path-to-graph.json>

Notes:
  Graphify is a discovery tool, not a contract authority.
  Use graphify:install explicitly; npm install never installs Python tools.
`);
}

async function main() {
  const [command = "help", ...rest] = process.argv.slice(2);
  const options = parseArgs(rest);

  try {
    switch (command) {
      case "help":
      case "--help":
      case "-h":
        printHelp();
        return 0;
      case "init":
        copySkill(consumerSkillPath(), { backup: false });
        return 0;
      case "update":
        copySkill(consumerSkillPath(), { backup: true });
        return 0;
      case "doctor":
        return runDoctor();
      case "graphify:doctor":
        return runGraphifyDoctor(options);
      case "graphify:install":
        return installGraphify({ cwd: process.cwd() });
      case "graphify:build":
        return buildGraph({ backendPath: options.backend, cwd: process.cwd() });
      case "graphify:update":
        return updateGraph({ backendPath: options.backend, cwd: process.cwd() });
      case "graphify:query":
        return queryGraph({ graphPath: options.graph, question: options.question, cwd: process.cwd() });
      case "graphify:path":
        return findPath({ graphPath: options.graph, from: options.from, to: options.to, cwd: process.cwd() });
      case "graphify:explain":
        return explainNode({ graphPath: options.graph, node: options.node, cwd: process.cwd() });
      case "graph-provider":
        return provideGraphEvidence({ api: options.api, graphPath: options.graph, cwd: process.cwd() });
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        return 1;
    }
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    return 1;
  }
}

main().then((code) => {
  process.exitCode = code;
});
