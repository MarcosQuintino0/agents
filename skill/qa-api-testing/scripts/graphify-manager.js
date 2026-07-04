import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(command, args = [], { cwd = process.cwd(), allowFailure = true } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const status = typeof result.status === "number" ? result.status : 1;
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  if (!allowFailure && status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.\n${stderr || stdout || result.error?.message || "No output."}`);
  }
  return { status, stdout, stderr, error: result.error };
}

function toolVersion(command, args = ["--version"]) {
  const result = run(command, args);
  return {
    available: result.status === 0,
    output: (result.stdout || result.stderr || result.error?.message || "").trim(),
  };
}

function graphCandidates(cwd, backendPath) {
  const candidates = [path.join(cwd, "graphify-out", "graph.json")];
  if (backendPath) {
    candidates.push(path.join(path.resolve(cwd, backendPath), "graphify-out", "graph.json"));
  }
  return candidates;
}

function findGraph(cwd, backendPath) {
  return graphCandidates(cwd, backendPath).find((candidate) => fs.existsSync(candidate));
}

function lineForTool(label, info) {
  return `${info.available ? "[OK]" : "[WARN]"} ${label}: ${info.output || "not available"}`;
}

export function checkGraphifyEnvironment({ cwd = process.cwd(), backendPath, graphPath } = {}) {
  const python = toolVersion("py", ["--version"]);
  const uv = toolVersion("uv", ["--version"]);
  const pipx = toolVersion("pipx", ["--version"]);
  const graphify = toolVersion("graphify", ["--version"]);
  const graph = graphPath ? path.resolve(cwd, graphPath) : findGraph(cwd, backendPath);
  const graphExists = Boolean(graph && fs.existsSync(graph));
  const lines = [
    lineForTool("Python", python),
    lineForTool("uv", uv),
    lineForTool("pipx", pipx),
    lineForTool("graphify", graphify),
    `${graphExists ? "[OK]" : "[WARN]"} graphify-out/graph.json: ${graph || "not found"}`,
  ];
  const warnings = [python, uv, pipx, graphify].filter((tool) => !tool.available).length + (graphExists ? 0 : 1);
  return { lines, warnings, graphPath: graph || null, graphifyAvailable: graphify.available, uvAvailable: uv.available, pipxAvailable: pipx.available };
}

export function installGraphify({ cwd = process.cwd() } = {}) {
  const uv = toolVersion("uv", ["--version"]);
  if (uv.available) {
    console.log("Installing graphifyy with uv...");
    const result = run("uv", ["tool", "install", "graphifyy"], { cwd, allowFailure: true });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return result.status;
  }

  const pipx = toolVersion("pipx", ["--version"]);
  if (pipx.available) {
    console.log("Installing graphifyy with pipx...");
    const result = run("pipx", ["install", "graphifyy"], { cwd, allowFailure: true });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return result.status;
  }

  console.log("Graphify was not installed because neither uv nor pipx is available.");
  console.log("Install one of them, then run:");
  console.log("  npx qa-api-skill graphify:install");
  console.log("Manual alternatives:");
  console.log("  uv tool install graphifyy");
  console.log("  pipx install graphifyy");
  return 1;
}

function requireBackend(cwd, backendPath) {
  if (!backendPath) throw new Error("--backend is required.");
  const resolved = path.resolve(cwd, backendPath);
  if (!fs.existsSync(resolved)) throw new Error(`Backend path not found: ${resolved}`);
  if (!fs.statSync(resolved).isDirectory()) throw new Error(`Backend path is not a directory: ${resolved}`);
  return resolved;
}

function ensureGraphify() {
  const graphify = toolVersion("graphify", ["--version"]);
  if (!graphify.available) {
    throw new Error("Graphify CLI is not available. Run: npx qa-api-skill graphify:install");
  }
}

function writeBuildSummary({ cwd, backend, graphPath, command, status }) {
  const outputDir = path.join(cwd, ".faillens", "graph");
  fs.mkdirSync(outputDir, { recursive: true });
  const summaryPath = path.join(outputDir, "graphify-build-summary.md");
  const lines = [
    "# Graphify Build Summary",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Backend: ${backend}`,
    `Command: ${command}`,
    `Status: ${status}`,
    `Graph: ${graphPath || "not found"}`,
    "",
  ];
  fs.writeFileSync(summaryPath, lines.join("\n"), "utf8");
  console.log(`Summary written: ${path.relative(cwd, summaryPath)}`);
}

export function buildGraph({ backendPath, cwd = process.cwd() } = {}) {
  const backend = requireBackend(cwd, backendPath);
  ensureGraphify();
  const attempts = [
    ["build", backend],
    [backend],
  ];

  let last = null;
  for (const args of attempts) {
    console.log(`Running: graphify ${args.join(" ")}`);
    const result = run("graphify", args, { cwd, allowFailure: true });
    last = { result, args };
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    const graph = findGraph(cwd, backend);
    if (result.status === 0 && graph) {
      writeBuildSummary({ cwd, backend, graphPath: graph, command: `graphify ${args.join(" ")}`, status: "ok" });
      return 0;
    }
  }

  const graph = findGraph(cwd, backend);
  writeBuildSummary({
    cwd,
    backend,
    graphPath: graph,
    command: last ? `graphify ${last.args.join(" ")}` : "graphify",
    status: "failed",
  });
  throw new Error("Graphify finished without creating graphify-out/graph.json.");
}

export function updateGraph({ backendPath, cwd = process.cwd() } = {}) {
  const backend = requireBackend(cwd, backendPath);
  ensureGraphify();
  const existingGraph = findGraph(cwd, backend);
  if (!existingGraph) {
    console.log("No existing graph found; running build.");
    return buildGraph({ backendPath: backend, cwd });
  }

  console.log(`Running: graphify update ${backend}`);
  const result = run("graphify", ["update", backend], { cwd, allowFailure: true });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) return result.status;
  const graph = findGraph(cwd, backend);
  if (!graph) throw new Error("Graphify update completed but graphify-out/graph.json was not found.");
  writeBuildSummary({ cwd, backend, graphPath: graph, command: `graphify update ${backend}`, status: "ok" });
  return 0;
}
