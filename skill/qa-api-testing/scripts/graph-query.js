import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function runGraphifyCommand(args, { cwd = process.cwd(), allowFailure = false } = {}) {
  const result = spawnSync("graphify", args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const status = typeof result.status === "number" ? result.status : 1;
  if (!allowFailure && status !== 0) {
    throw new Error(`graphify ${args.join(" ")} failed.\n${stderr || stdout || result.error?.message || "No output."}`);
  }
  return { status, stdout, stderr };
}

function requireFile(label, filePath) {
  if (!filePath) {
    throw new Error(`${label} is required.`);
  }
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`${label} not found: ${resolved}`);
  }
  return resolved;
}

export function queryGraph({ graphPath, question, cwd = process.cwd() }) {
  const graph = requireFile("--graph", graphPath);
  if (!question) throw new Error("--question is required.");
  const result = runGraphifyCommand(["query", question, "--graph", graph], { cwd });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  return result.status;
}

export function findPath({ graphPath, from, to, cwd = process.cwd() }) {
  const graph = requireFile("--graph", graphPath);
  if (!from) throw new Error("--from is required.");
  if (!to) throw new Error("--to is required.");
  const result = runGraphifyCommand(["path", from, to, "--graph", graph], { cwd });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  return result.status;
}

export function explainNode({ graphPath, node, cwd = process.cwd() }) {
  const graph = requireFile("--graph", graphPath);
  if (!node) throw new Error("--node is required.");
  const result = runGraphifyCommand(["explain", node, "--graph", graph], { cwd });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  return result.status;
}
