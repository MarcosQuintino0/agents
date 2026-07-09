#!/usr/bin/env node
/* global console, process */

import path from "node:path";
import { parseArgs, readJson, resolveInside, toPosix, writeJson, writeText } from "./lib/common.mjs";

function usage() {
  return `
Uso:
  npm run qa:fuzz:lint -- --api users
  npm run qa:fuzz:lint -- --profile .agents/state/qa-api-fuzz/profiles/users.profile.json --strict

Opcoes:
  --api <nome>       Usa .agents/state/qa-api-fuzz/profiles/<api>.profile.json
  --profile <file>   Caminho do profile.
  --out <dir>        Pasta de saida. Padrao: .agents/state/qa-api-fuzz/profile-lint/<api>
  --strict           Exit code 1 tambem para warnings.
  --help             Exibe ajuda.
`.trim();
}

function addFinding(findings, severity, code, message, target = "") {
  findings.push({ severity, code, message, target });
}

function inspectSchema(findings, schema, target) {
  if (!schema || typeof schema !== "object") {
    addFinding(findings, "warning", "missing-schema", "Operacao com body nao tem schema de request.", target);
    return;
  }

  if (schema.type === "object") {
    const props = Object.entries(schema.properties || {});
    if (!props.length) {
      addFinding(findings, "warning", "empty-object-schema", "Schema de objeto sem propriedades.", target);
    }
    for (const [name, prop] of props) {
      if (!prop?.type && !prop?.enum && !prop?.oneOf && !prop?.anyOf) {
        addFinding(findings, "warning", "field-type-unknown", `Campo sem tipo claro: ${name}.`, `${target}.${name}`);
      }
      if (!prop?.["x-evidence"]?.length) {
        addFinding(findings, "warning", "field-no-evidence", `Campo sem evidencia rastreavel: ${name}.`, `${target}.${name}`);
      }
      if (!prop?.["x-confidence"]) {
        addFinding(findings, "warning", "field-no-confidence", `Campo sem confidence: ${name}.`, `${target}.${name}`);
      }
    }
  }
}

function lintProfile(profile) {
  const findings = [];
  if (profile.kind !== "qa-api-fuzz-profile") {
    addFinding(findings, "error", "invalid-kind", "Arquivo nao parece ser um qa-api-fuzz-profile.");
  }
  if (!profile.api) addFinding(findings, "error", "missing-api", "Profile sem api.");
  if (!profile.baseUrl) addFinding(findings, "warning", "missing-base-url", "Profile sem baseUrl; use --base-url ao executar.");
  if (!Array.isArray(profile.operations) || !profile.operations.length) {
    addFinding(findings, "error", "no-operations", "Profile nao possui operacoes.");
    return findings;
  }

  for (const operation of profile.operations) {
    const target = operation.id || `${operation.method || "?"} ${operation.path || "?"}`;
    if (!operation.id) addFinding(findings, "error", "operation-no-id", "Operacao sem id.", target);
    if (!operation.method) addFinding(findings, "error", "operation-no-method", "Operacao sem method.", target);
    if (!operation.path) addFinding(findings, "error", "operation-no-path", "Operacao sem path.", target);
    if (!operation.evidence?.length) {
      addFinding(findings, "warning", "operation-no-evidence", "Operacao sem evidencia rastreavel.", target);
    }
    if (!operation.confidence) {
      addFinding(findings, "warning", "operation-no-confidence", "Operacao sem confidence.", target);
    }
    if (/\{[^}]+\}/.test(operation.path)) {
      const params = operation.parameters || [];
      const pathParams = params.filter((item) => item.in === "path");
      if (!pathParams.length) {
        addFinding(findings, "warning", "path-params-undescribed", "Path possui parametros, mas eles nao estao descritos.", target);
      }
      for (const param of pathParams) {
        if (param.example === undefined && !param.examples?.length) {
          addFinding(
            findings,
            "warning",
            "path-param-no-example",
            `Parametro de path sem exemplo; o fuzz pode usar fallback inseguro: ${param.name}.`,
            `${target}.${param.name}`,
          );
        }
      }
    }
    if (["POST", "PUT", "PATCH"].includes(operation.method)) {
      inspectSchema(findings, operation.request?.schema, target);
      if (operation.method === "POST" && operation.state?.createsResource && !operation.state?.cleanup) {
        addFinding(findings, "warning", "post-no-cleanup", "POST cria recurso, mas nao tem cleanup configurado.", target);
      }
    }
  }

  return findings;
}

function markdownReport({ profile, findings }) {
  const lines = [
    `# QA API Fuzz Profile Lint - ${profile.api || "unknown"}`,
    "",
    `Profile: ${profile.source?.path || profile.source?.type || "(sem fonte)"}`,
    `Errors: ${findings.filter((item) => item.severity === "error").length}`,
    `Warnings: ${findings.filter((item) => item.severity === "warning").length}`,
    "",
    "## Findings",
    "",
  ];
  if (!findings.length) {
    lines.push("Nenhum problema encontrado.", "");
  } else {
    for (const finding of findings) {
      lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}${finding.target ? ` (${finding.target})` : ""}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { booleans: ["help", "strict"] });
  if (args.help) {
    console.log(usage());
    return;
  }
  const projectRoot = process.cwd();
  const profilePath = args.profile
    ? resolveInside(projectRoot, args.profile)
    : resolveInside(projectRoot, path.join(".agents", "state", "qa-api-fuzz", "profiles", `${args.api}.profile.json`));
  const profile = await readJson(profilePath);
  const findings = lintProfile(profile);
  const api = profile.api || args.api || path.basename(profilePath).replace(/\.profile\.json$/i, "");
  const outDir = args.out
    ? resolveInside(projectRoot, args.out)
    : resolveInside(projectRoot, path.join(".agents", "state", "qa-api-fuzz", "profile-lint", api));
  const report = {
    schemaVersion: "0.1.0",
    api,
    profile: toPosix(path.relative(projectRoot, profilePath)),
    summary: {
      errors: findings.filter((item) => item.severity === "error").length,
      warnings: findings.filter((item) => item.severity === "warning").length,
      findings: findings.length,
    },
    findings,
  };
  await writeJson(path.join(outDir, "profile-lint.json"), report);
  await writeText(path.join(outDir, "profile-lint.md"), markdownReport({ profile, findings }));

  console.log(`Profile lint concluido para ${api}.`);
  console.log(`Erros: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  console.log(`Relatorio: ${toPosix(path.relative(projectRoot, path.join(outDir, "profile-lint.md")))}`);

  if (report.summary.errors > 0 || (args.strict && report.summary.warnings > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Erro no profile lint: ${error.message}`);
  process.exitCode = 1;
});
