#!/usr/bin/env node

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSkills = ["qa-api", "qa-api-fuzz", "qa-chamado", "qa-debug-report", "graphify"];
const defaultTarget = path.join(".agents", "skills");
const defaultBackend = "../backend";

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

function printMainHelp() {
  log(`Uso:
  npx @marcosquintino/qa-skills install [opcoes]
  qa-skills install [opcoes]

Comandos:
  install   Instala as skills QA e valida/instala Graphify

Observacao:
  O npm usa nomes de pacote em minusculo. Use @marcosquintino/qa-skills.`);
}

function printInstallHelp() {
  log(`Uso:
  npx @marcosquintino/qa-skills install [opcoes]

Opcoes:
  --target <dir>             Pasta de destino das skills (padrao: .agents/skills)
  --skills <lista>           Skills separadas por virgula (padrao: qa-api,qa-api-fuzz,qa-chamado,qa-debug-report,graphify)
  --backend <dir>            Caminho do backend nos scripts qa:reindex (padrao: ../backend)
  --skip-graphify            Copia as skills sem instalar/validar Graphify CLI
  --force-graphify           Reinstala Graphify quando a versao encontrada for diferente
  --no-package-scripts       Nao altera package.json do projeto consumidor
  -h, --help                 Mostra esta ajuda

Exemplos:
  npx @marcosquintino/qa-skills install
  npx @marcosquintino/qa-skills install --backend ../ressus-backend
  npx @marcosquintino/qa-skills install --skip-graphify
  npx @marcosquintino/qa-skills install --target .codex/skills`);
}

function parseInstallArgs(argv) {
  const args = {
    target: defaultTarget,
    skills: [...defaultSkills],
    backend: defaultBackend,
    skipGraphify: false,
    forceGraphify: false,
    packageScripts: true,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--target") {
      args.target = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--skills") {
      args.skills = (argv[index + 1] || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === "--backend") {
      args.backend = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--skip-graphify") {
      args.skipGraphify = true;
      continue;
    }

    if (arg === "--force-graphify") {
      args.forceGraphify = true;
      continue;
    }

    if (arg === "--no-package-scripts") {
      args.packageScripts = false;
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

function assertValidInstallArgs(args) {
  if (!args.target) {
    fail("Informe um destino valido em --target.");
  }

  if (!args.skills.length) {
    fail("Informe ao menos uma skill em --skills.");
  }

  const invalidSkills = args.skills.filter((skill) => !defaultSkills.includes(skill));
  if (invalidSkills.length) {
    fail(`Skill desconhecida: ${invalidSkills.join(", ")}

Skills disponiveis: ${defaultSkills.join(", ")}`);
  }

  if (!args.skipGraphify && !args.skills.includes("graphify")) {
    fail(`Graphify CLI sera validado/instalado, mas a skill graphify nao esta na lista.

Inclua graphify em --skills ou use --skip-graphify.`);
  }
}

function safeTargetDir(projectRoot, targetInput) {
  const targetDir = path.isAbsolute(targetInput)
    ? path.normalize(targetInput)
    : path.resolve(projectRoot, targetInput);
  const relative = path.relative(projectRoot, targetDir);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`Destino fora do projeto consumidor: ${targetInput}`);
  }

  return targetDir;
}

function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(source, target);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(source, target);
    }
  }
}

function installSkills(projectRoot, targetDir, skills) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const skill of skills) {
    const sourceDir = path.join(packageRoot, skill);
    const targetSkillDir = path.join(targetDir, skill);

    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
      fail(`Skill nao encontrada no pacote: ${skill}`);
    }

    fs.rmSync(targetSkillDir, { recursive: true, force: true });
    copyDir(sourceDir, targetSkillDir);
    log(`Skill instalada: ${toPosix(path.relative(projectRoot, targetSkillDir))}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function run(command, args, cwd = process.cwd()) {
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

function commandAvailable(command, args = ["--version"]) {
  const result = run(command, args);
  return !result.error && result.status === 0;
}

function readGraphifyManifest(targetDir) {
  const manifestPath = path.join(targetDir, "graphify", "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest do Graphify nao encontrado em ${toPosix(manifestPath)}.`);
  }

  return { ...readJson(manifestPath), manifestPath };
}

function getGraphifyVersion(manifest) {
  const result = run(manifest.command || "graphify", ["--version"]);

  if (result.error || result.status !== 0) {
    return { ok: false, installed: false, raw: commandText(result), version: null };
  }

  const raw = commandText(result);
  return {
    ok: extractVersion(raw) === manifest.version,
    installed: true,
    raw,
    version: extractVersion(raw),
  };
}

function installWith(command, args) {
  if (!commandAvailable(command)) {
    return { ok: false, reason: `${command} nao encontrado` };
  }

  const result = run(command, args);
  if (result.error || result.status !== 0) {
    return { ok: false, reason: commandText(result) || `${command} falhou` };
  }

  return { ok: true, reason: commandText(result) };
}

function installGraphify(manifest, { force }) {
  const packageSpec = `${manifest.pythonPackage}==${manifest.version}`;
  const attempts = [
    {
      label: "uv",
      command: "uv",
      args: ["tool", "install", ...(force ? ["--force"] : []), packageSpec],
    },
    {
      label: "pipx",
      command: "pipx",
      args: ["install", ...(force ? ["--force"] : []), packageSpec],
    },
    {
      label: "pip",
      command: "pip",
      args: ["install", ...(force ? ["--force-reinstall"] : []), packageSpec],
    },
  ];

  const failures = [];

  for (const attempt of attempts) {
    log(`Instalando Graphify com ${attempt.label}...`);
    const result = installWith(attempt.command, attempt.args);

    if (result.ok) {
      return;
    }

    failures.push(`- ${attempt.label}: ${result.reason}`);
  }

  fail(`Nao foi possivel instalar Graphify ${packageSpec}.

Tentativas:
${failures.join("\n")}

Instale manualmente e rode novamente:
${manifest.install?.uv || `uv tool install ${packageSpec}`}`);
}

function ensureGraphify(targetDir, options) {
  const manifest = readGraphifyManifest(targetDir);
  const current = getGraphifyVersion(manifest);

  if (current.ok) {
    log(`Graphify OK: ${current.raw}`);
    return;
  }

  if (current.installed && !options.forceGraphify) {
    fail(`Versao do Graphify incompatível.

Esperada: ${manifest.version}
Encontrada: ${current.version || current.raw}

Rode novamente com --force-graphify para reinstalar a versao travada.`);
  }

  installGraphify(manifest, { force: options.forceGraphify });

  const afterInstall = getGraphifyVersion(manifest);
  if (!afterInstall.ok) {
    fail(`Graphify foi instalado, mas a versao esperada nao foi confirmada.

Esperada: ${manifest.version}
Encontrada: ${afterInstall.version || afterInstall.raw || "nao encontrada"}`);
  }

  log(`Graphify OK: ${afterInstall.raw}`);
}

function scriptValue(toolPath, args = "") {
  return `node "${toPosix(toolPath)}"${args ? ` ${args}` : ""}`;
}

function configurePackageScripts(projectRoot, targetDir, backend, skills) {
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    log("package.json nao encontrado; scripts qa:reindex nao foram configurados.");
    return;
  }

  const pkg = readJson(packageJsonPath);
  pkg.scripts = pkg.scripts || {};

  const installedSkills = new Set(skills);
  const reindexTool = path.relative(projectRoot, path.join(targetDir, "qa-api", "tools", "qa-reindex.mjs"));
  const reportTool = path.relative(projectRoot, path.join(targetDir, "qa-api", "tools", "qa-report.mjs"));
  const oracleTool = path.relative(projectRoot, path.join(targetDir, "qa-api", "tools", "qa-oracle.mjs"));
  const fuzzTool = path.relative(projectRoot, path.join(targetDir, "qa-api-fuzz", "scripts", "qa-fuzz.mjs"));
  const fuzzProfileTool = path.relative(projectRoot, path.join(targetDir, "qa-api-fuzz", "scripts", "qa-fuzz-profile.mjs"));
  const fuzzLintTool = path.relative(projectRoot, path.join(targetDir, "qa-api-fuzz", "scripts", "qa-fuzz-lint.mjs"));
  const fuzzReplayTool = path.relative(projectRoot, path.join(targetDir, "qa-api-fuzz", "scripts", "qa-fuzz-replay.mjs"));
  const debugTool = path.relative(projectRoot, path.join(targetDir, "qa-debug-report", "tools", "qa-debug-report.mjs"));
  const scripts = {};

  if (installedSkills.has("qa-api")) {
    scripts["qa:reindex"] = scriptValue(reindexTool, `--backend "${toPosix(backend)}"`);
    scripts["qa:reindex:check"] = scriptValue(reindexTool, "--check");
    scripts["qa:report"] = scriptValue(reportTool);
    scripts["qa:oracle"] = scriptValue(oracleTool);
  }

  if (installedSkills.has("qa-api-fuzz")) {
    scripts["qa:fuzz"] = scriptValue(fuzzTool);
    scripts["qa:fuzz:profile"] = scriptValue(fuzzProfileTool);
    scripts["qa:fuzz:lint"] = scriptValue(fuzzLintTool);
    scripts["qa:fuzz:replay"] = scriptValue(fuzzReplayTool);
  }

  if (installedSkills.has("qa-debug-report")) {
    scripts["qa:debug"] = scriptValue(debugTool, "run");
    scripts["qa:debug:open"] = scriptValue(debugTool, "open");
    scripts["qa:debug:generate"] = scriptValue(debugTool, "generate");
  }

  let changed = false;
  for (const [name, value] of Object.entries(scripts)) {
    if (pkg.scripts[name] && pkg.scripts[name] !== value) {
      log(`Script existente mantido: ${name}`);
      continue;
    }

    if (pkg.scripts[name] !== value) {
      pkg.scripts[name] = value;
      changed = true;
      log(`Script configurado: ${name}`);
    }
  }

  if (changed) {
    writeJson(packageJsonPath, pkg);
  }
}

function ensureGitignore(projectRoot) {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  const entries = [".agents/state/", ".qa-api/", "graphify-out/"];

  const current = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  const lines = current.split(/\r?\n/).filter((line, index, all) => line || index < all.length - 1);
  const existing = new Set(lines.map((line) => line.trim()));
  const missing = entries.filter((entry) => !existing.has(entry));

  if (!missing.length) {
    return;
  }

  const nextLines = [...lines];
  if (nextLines.length && nextLines[nextLines.length - 1] !== "") {
    nextLines.push("");
  }
  nextLines.push("# Estado local das skills QA");
  nextLines.push(...missing);

  fs.writeFileSync(gitignorePath, `${nextLines.join("\n")}\n`, "utf8");
  log("Gitignore atualizado para ignorar estado local das skills.");
}

function install(argv) {
  const args = parseInstallArgs(argv);

  if (args.help) {
    printInstallHelp();
    return;
  }

  assertValidInstallArgs(args);

  const projectRoot = process.cwd();
  const targetDir = safeTargetDir(projectRoot, args.target);

  installSkills(projectRoot, targetDir, args.skills);

  if (args.skipGraphify) {
    log("Graphify CLI nao foi instalado/validado por causa de --skip-graphify.");
  } else {
    ensureGraphify(targetDir, args);
  }

  if (args.packageScripts) {
    configurePackageScripts(projectRoot, targetDir, args.backend, args.skills);
  }

  ensureGitignore(projectRoot);

  log("");
  log("Instalacao concluida.");
  log(`Skills: ${toPosix(path.relative(projectRoot, targetDir))}`);
  const expectedScripts = [];
  if (args.skills.includes("qa-api")) expectedScripts.push("qa:reindex", "qa:reindex:check", "qa:report", "qa:oracle");
  if (args.skills.includes("qa-api-fuzz")) expectedScripts.push("qa:fuzz", "qa:fuzz:profile", "qa:fuzz:lint", "qa:fuzz:replay");
  if (args.skills.includes("qa-debug-report")) expectedScripts.push("qa:debug", "qa:debug:open", "qa:debug:generate");
  if (expectedScripts.length) log(`Scripts esperados: ${expectedScripts.join(", ")}.`);
  log("Proximo passo: peca para a IA preparar o projeto para testes de API.");
}

const [command, ...rest] = process.argv.slice(2);

if (!command || command === "--help" || command === "-h") {
  printMainHelp();
  process.exit(0);
}

if (command === "install") {
  install(rest);
  process.exit(0);
}

fail(`Comando desconhecido: ${command}`);
