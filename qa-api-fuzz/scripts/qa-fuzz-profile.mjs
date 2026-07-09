#!/usr/bin/env node
/* global console, process */

import path from "node:path";
import {
  parseArgs,
  readJson,
  resolveInside,
  toPosix,
  writeJson,
  writeText,
} from "./lib/common.mjs";
import {
  attachKnownArtifacts,
  buildProfileFromQaApi,
  normalizeOpenApiDocument,
} from "./lib/profile-utils.mjs";

function usage() {
  return `
Uso:
  npm run qa:fuzz:profile -- --api users
  npm run qa:fuzz:profile -- --api users --openapi openapi.json --base-url http://localhost:3100
  npm run qa:fuzz:profile -- --api users --swagger swagger.json

Opcoes:
  --api <nome>          Nome da API. Obrigatorio.
  --openapi <arquivo>  Contrato OpenAPI JSON.
  --swagger <arquivo>  Contrato Swagger/OpenAPI 2 JSON.
  --base-url <url>     URL base do ambiente alvo.
  --out <arquivo>      Saida do profile. Padrao: .agents/state/qa-api-fuzz/profiles/<api>.profile.json
  --help               Exibe ajuda.

Observacao:
  YAML deve ser executado via Schemathesis ou convertido para JSON antes deste normalizador sem dependencias.
`.trim();
}

function assertJsonContract(filePath) {
  if (!/\.json$/i.test(filePath)) {
    throw new Error(
      `O normalizador local aceita OpenAPI/Swagger em JSON. Para YAML, use Schemathesis direto ou converta para JSON: ${filePath}`,
    );
  }
}

function markdownProfile(profile) {
  const lines = [
    `# QA API Fuzz Profile - ${profile.api}`,
    "",
    `Source: ${profile.source?.type || "unknown"} ${profile.source?.path || ""}`.trim(),
    `Base URL: ${profile.baseUrl || "(nao definida)"}`,
    `Operations: ${profile.operations.length}`,
    "",
    "## Operations",
    "",
  ];

  for (const operation of profile.operations) {
    lines.push(`### ${operation.id}`, "");
    lines.push(`- Endpoint: ${operation.method} ${operation.path}`);
    lines.push(`- Confidence: ${operation.confidence || "unknown"}`);
    lines.push(`- Request schema: ${operation.request?.schema ? "yes" : "no"}`);
    lines.push(`- Evidence: ${(operation.evidence || []).join(" | ") || "(sem evidencia)"}`);
    if (operation.state?.cleanup) {
      lines.push(`- Cleanup: ${operation.state.cleanup.method} ${operation.state.cleanup.path}`);
    }
    lines.push("");
  }

  lines.push("## Artifacts", "");
  for (const [key, value] of Object.entries(profile.artifacts || {})) {
    if (Array.isArray(value)) lines.push(`- ${key}: ${value.length} item(ns)`);
    else lines.push(`- ${key}: ${value || "(nao encontrado)"}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { booleans: ["help"] });
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.api) throw new Error("Informe --api <nome>.");

  const projectRoot = process.cwd();
  const outputPath = args.out
    ? resolveInside(projectRoot, args.out)
    : resolveInside(projectRoot, path.join(".agents", "state", "qa-api-fuzz", "profiles", `${args.api}.profile.json`));

  let profile;
  const contractPathInput = args.openapi || args.swagger;
  if (contractPathInput) {
    const contractPath = resolveInside(projectRoot, contractPathInput);
    assertJsonContract(contractPath);
    const document = await readJson(contractPath);
    profile = normalizeOpenApiDocument(document, {
      api: args.api,
      baseUrl: args.baseUrl || "",
      sourcePath: toPosix(path.relative(projectRoot, contractPath)),
    });
  } else {
    profile = await buildProfileFromQaApi({
      projectRoot,
      api: args.api,
      baseUrl: args.baseUrl || process.env.QA_FUZZ_BASE_URL || "",
    });
  }

  if (args.baseUrl) profile.baseUrl = args.baseUrl;
  await attachKnownArtifacts({ projectRoot, profile });
  await writeJson(outputPath, profile);
  const mdPath = outputPath.replace(/\.json$/i, ".md");
  await writeText(mdPath, markdownProfile(profile));

  console.log("QA fuzz profile gerado.");
  console.log(`Profile: ${toPosix(path.relative(projectRoot, outputPath))}`);
  console.log(`Resumo: ${toPosix(path.relative(projectRoot, mdPath))}`);
  console.log(`Operacoes: ${profile.operations.length}`);
}

main().catch((error) => {
  console.error(`Erro ao gerar profile: ${error.message}`);
  process.exitCode = 1;
});
