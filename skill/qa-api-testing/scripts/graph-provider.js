import fs from "node:fs";
import path from "node:path";
import { normalizeGraphEvidence, mergeEvidence } from "./graph-evidence-normalizer.js";
import { runGraphifyCommand } from "./graph-query.js";

function requireFile(label, filePath) {
  if (!filePath) throw new Error(`${label} is required.`);
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) throw new Error(`${label} not found: ${resolved}`);
  return resolved;
}

function safeFileName(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-|-$/g, "");
}

function defaultQueries(api) {
  return [
    `what controller handles ${api} API?`,
    `what routes are related to ${api}?`,
    `what files define endpoints for ${api}?`,
    `what request DTOs are used by ${api}?`,
    `what response DTOs are returned by ${api}?`,
    `what services are called by ${api}?`,
    `what repositories are used by ${api}?`,
    `what exception handlers process errors from ${api}?`,
    `what authentication or authorization code protects ${api}?`,
  ];
}

function toMarkdown(evidence) {
  const lines = [
    `# Graph Evidence: ${evidence.api}`,
    "",
    `Graph: ${evidence.graph}`,
    `Generated at: ${evidence.generatedAt}`,
    "",
    "> Graphify is navigation evidence only. Confirm contract details in authoritative sources.",
    "",
    "## Candidate Files",
    "",
    ...(evidence.candidateFiles.length ? evidence.candidateFiles.map((file) => `- ${file}`) : ["- None detected"]),
    "",
    "## Queries",
    "",
  ];

  for (const item of evidence.queries) {
    lines.push(`### ${item.question}`, "");
    lines.push(item.answer || "No answer.", "");
    lines.push(`Confidence: ${item.confidence}`, "");
  }

  lines.push("## Warnings", "");
  lines.push(...(evidence.warnings.length ? evidence.warnings.map((warning) => `- ${warning}`) : ["- None"]));
  lines.push("");
  return lines.join("\n");
}

export function provideGraphEvidence({ api, graphPath, cwd = process.cwd() }) {
  if (!api) throw new Error("--api is required.");
  const graph = requireFile("--graph", graphPath);
  const queryResults = [];

  for (const question of defaultQueries(api)) {
    const result = runGraphifyCommand(["query", question, "--graph", graph], { cwd, allowFailure: true });
    queryResults.push(normalizeGraphEvidence({
      question,
      answer: result.stdout,
      stderr: result.stderr,
      status: result.status,
    }));
  }

  const evidence = mergeEvidence(api, path.relative(cwd, graph) || graph, queryResults);
  const outputDir = path.join(cwd, ".faillens", "graph");
  fs.mkdirSync(outputDir, { recursive: true });
  const base = safeFileName(api);
  const jsonPath = path.join(outputDir, `${base}.graph-evidence.json`);
  const mdPath = path.join(outputDir, `${base}.graph-evidence.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, toMarkdown(evidence), "utf8");
  console.log(`Graph evidence written: ${path.relative(cwd, jsonPath)}`);
  console.log(`Graph evidence written: ${path.relative(cwd, mdPath)}`);
  return evidence.warnings.some((warning) => warning.startsWith("graphify exited")) ? 1 : 0;
}
