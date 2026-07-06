#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import process from "process";

const DEFAULT_OUT = "graphify-out";
const LOCK_DIR = ".qa-api";
const LOCK_FILE = "backend-graph.lock.json";

function printHelp() {
  console.log(`Uso:
  node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend
  node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend --out graphify-out
  node .agents/skills/qa-api/tools/qa-reindex.mjs --check

Package.json recomendado:
  "qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../backend"
  "qa:reindex:check": "node .agents/skills/qa-api/tools/qa-reindex.mjs --check"`);
}

function parseArgs(argv) {
  const args = {
    backend: null,
    out: DEFAULT_OUT,
    check: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--backend") {
      args.backend = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg === "--out") {
      args.out = argv[index + 1] || null;
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

function fail(message, details = "") {
  console.error(message);
  if (details) {
    console.error(details);
  }
  process.exit(1);
}

function resolveFromProject(projectRoot, inputPath) {
  return path.isAbsolute(inputPath) ? path.normalize(inputPath) : path.resolve(projectRoot, inputPath);
}

function toPosixPath(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

function relativeToProject(projectRoot, targetPath) {
  return toPosixPath(path.relative(projectRoot, targetPath));
}

function commandText(result) {
  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();
  return [stdout, stderr].filter(Boolean).join("\n");
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });
}

function getGraphifyVersion() {
  const result = run("graphify", ["--version"], process.cwd());

  if (result.error || result.status !== 0) {
    fail(`Graphify não encontrado.

O fluxo oficial da skill QA API exige Graphify para gerar o grafo do backend.

Instale explicitamente conforme o ambiente da equipe:

uv tool install graphifyy

ou:

pipx install graphifyy

ou:

pip install graphifyy

Depois valide:

graphify --version

E rode novamente:

npm run qa:reindex`);
  }

  return commandText(result);
}

function getGitCommit(backendRoot) {
  const result = run("git", ["rev-parse", "HEAD"], backendRoot);

  if (result.error || result.status !== 0) {
    return null;
  }

  return String(result.stdout || "").trim() || null;
}

function safeOutputDir(projectRoot, outDir) {
  const resolved = resolveFromProject(projectRoot, outDir || DEFAULT_OUT);
  const relative = path.relative(projectRoot, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`Saída inválida: ${outDir}

Use um caminho dentro do projeto consumidor.`);
  }

  return resolved;
}

function locateGraphJson(projectRoot, backendRoot, outDir) {
  const candidates = [
    path.join(backendRoot, DEFAULT_OUT, "graph.json"),
    path.join(projectRoot, outDir, "graph.json"),
  ];

  if (outDir !== DEFAULT_OUT) {
    candidates.push(path.join(backendRoot, outDir, "graph.json"));
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function copyGeneratedGraph(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyGeneratedGraph(source, target);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(source, target);
    }
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Lock inválido: ${relativeToProject(process.cwd(), filePath)}

Rode:

npm run qa:reindex`);
  }
}

function graphPathFromLock(projectRoot, lock) {
  const graphJson = lock.graphJson || `${DEFAULT_OUT}/graph.json`;
  return path.isAbsolute(graphJson) ? graphJson : path.resolve(projectRoot, graphJson);
}

function runCheck(projectRoot) {
  const lockPath = path.join(projectRoot, LOCK_DIR, LOCK_FILE);

  if (!fs.existsSync(lockPath)) {
    fail(`Lock do grafo não encontrado.

Rode:

npm run qa:reindex`);
  }

  const lock = readJson(lockPath);
  const graphJsonPath = graphPathFromLock(projectRoot, lock);

  if (!fs.existsSync(graphJsonPath)) {
    fail(`Grafo do backend não encontrado: ${relativeToProject(projectRoot, graphJsonPath)}

Rode:

npm run qa:reindex`);
  }

  if (!lock.backendRoot && !lock.backendRootAbsolute) {
    fail(`Lock inválido: backendRoot ausente.

Rode:

npm run qa:reindex`);
  }

  if (lock.backendRootAbsolute) {
    const backendRoot = path.normalize(lock.backendRootAbsolute);

    if (!fs.existsSync(backendRoot) || !fs.statSync(backendRoot).isDirectory()) {
      fail(`Backend registrado no lock não existe: ${lock.backendRootAbsolute}

Rode:

npm run qa:reindex`);
    }

    const currentCommit = getGitCommit(backendRoot);
    if (lock.backendCommit && currentCommit && lock.backendCommit !== currentCommit) {
      fail(`O grafo está desatualizado em relação ao commit atual do backend.

Rode:

npm run qa:reindex`);
    }
  }

  console.log("Grafo e lock OK.");
}

function runReindex(projectRoot, args) {
  // O backend é obrigatório para evitar que a skill invente o caminho do código real.
  if (!args.backend) {
    fail(`Uso incorreto.

Informe o caminho do backend:

node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../ressus-backend

Exemplo no package.json:

"qa:reindex": "node .agents/skills/qa-api/tools/qa-reindex.mjs --backend ../ressus-backend"`);
  }

  const backendRoot = resolveFromProject(projectRoot, args.backend);
  if (!fs.existsSync(backendRoot) || !fs.statSync(backendRoot).isDirectory()) {
    fail(`Backend não encontrado: ${args.backend}`);
  }

  const outDir = args.out || DEFAULT_OUT;
  const outputDir = safeOutputDir(projectRoot, outDir);

  // Graphify não é instalado automaticamente para manter instalação e versões sob controle da equipe.
  const graphifyVersion = getGraphifyVersion();
  const graphifyResult = run("graphify", ["."], backendRoot);

  if (graphifyResult.error || graphifyResult.status !== 0) {
    fail(
      `Graphify falhou com status ${graphifyResult.status ?? "desconhecido"}.`,
      commandText(graphifyResult),
    );
  }

  const sourceGraphJson = locateGraphJson(projectRoot, backendRoot, outDir);
  if (!sourceGraphJson) {
    fail(`Graphify executou, mas não encontrei graph.json.

Caminhos verificados:
- ${toPosixPath(path.join(backendRoot, DEFAULT_OUT, "graph.json"))}
- ${toPosixPath(path.join(projectRoot, outDir, "graph.json"))}
- ${toPosixPath(path.join(backendRoot, outDir, "graph.json"))}`);
  }

  const sourceDir = path.dirname(sourceGraphJson);
  if (path.resolve(sourceDir) !== path.resolve(outputDir)) {
    copyGeneratedGraph(sourceDir, outputDir);
  }

  const finalGraphJson = path.join(outputDir, "graph.json");
  if (!fs.existsSync(finalGraphJson)) {
    fail(`Não foi possível garantir o grafo final em ${relativeToProject(projectRoot, finalGraphJson)}.`);
  }

  // O lock registra qual backend gerou o grafo, para a IA localizar o código real sem YAML.
  const lockDir = path.join(projectRoot, LOCK_DIR);
  fs.mkdirSync(lockDir, { recursive: true });

  const lock = {
    generatedAt: new Date().toISOString(),
    projectRoot: toPosixPath(projectRoot),
    backendRoot: args.backend,
    backendRootAbsolute: toPosixPath(backendRoot),
    backendCommit: getGitCommit(backendRoot),
    graphifyVersion,
    graphJson: relativeToProject(projectRoot, finalGraphJson),
    graphReport: relativeToProject(projectRoot, path.join(outputDir, "GRAPH_REPORT.md")),
    sourceGraphJson: toPosixPath(sourceGraphJson),
    tool: "qa-api/tools/qa-reindex.mjs",
  };

  fs.writeFileSync(path.join(lockDir, LOCK_FILE), `${JSON.stringify(lock, null, 2)}\n`, "utf8");

  console.log("Reindex QA API concluído.");
  console.log(`Grafo: ${lock.graphJson}`);
  console.log(`Lock: ${toPosixPath(path.join(LOCK_DIR, LOCK_FILE))}`);
}

const args = parseArgs(process.argv.slice(2));
const projectRoot = process.cwd();

if (args.help) {
  printHelp();
  process.exit(0);
}

if (args.check) {
  runCheck(projectRoot);
} else {
  runReindex(projectRoot, args);
}
