#!/usr/bin/env node
/* global console, process, fetch */

import path from "node:path";
import {
  parseArgs,
  parseEnvHeaders,
  parseHeaderArgs,
  readJson,
  redactHeaders,
  requestJson,
  resolveInside,
  writeJson,
} from "./lib/common.mjs";

function usage() {
  return `
Uso:
  npm run qa:fuzz:replay -- --report .agents/state/qa-api-fuzz/reports/users/fuzz-report.json --finding F001
  npm run qa:fuzz:replay -- --report .agents/state/qa-api-fuzz/reports/users/fuzz-report.json --case post-users-random-12

Opcoes:
  --report <file>        Relatorio fuzz-report.json.
  --finding <id>         Finding a reproduzir.
  --case <id>            Case a reproduzir.
  --base-url <url>       Sobrescreve baseUrl do report.
  --header "Nome: valor" Header adicional. Pode repetir.
  --out <file>           Salva resultado do replay em JSON.
  --help                 Exibe ajuda.
`.trim();
}

function selectReplayTarget(report, args) {
  if (args.finding) {
    const finding = report.findings.find((item) => item.id === args.finding);
    if (!finding) throw new Error(`Finding nao encontrado: ${args.finding}`);
    return {
      id: finding.id,
      source: "finding",
      request: finding.request,
    };
  }
  if (args.case) {
    const testCase = report.cases.find((item) => item.id === args.case);
    if (!testCase) throw new Error(`Case nao encontrado: ${args.case}`);
    return {
      id: testCase.id,
      source: "case",
      request: testCase.request,
    };
  }
  throw new Error("Informe --finding <id> ou --case <id>.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2), { booleans: ["help"], arrays: ["header"] });
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.report) throw new Error("Informe --report <file>.");

  const projectRoot = process.cwd();
  const reportPath = resolveInside(projectRoot, args.report);
  const report = await readJson(reportPath);
  const target = selectReplayTarget(report, args);
  const headers = {
    ...(target.request.headers || {}),
    ...parseEnvHeaders(),
    ...parseHeaderArgs(args.header || []),
  };
  for (const [key, value] of Object.entries(headers)) {
    if (value === "<omitido>") delete headers[key];
  }
  const baseUrl = args.baseUrl || process.env.QA_FUZZ_BASE_URL || report.baseUrl;
  if (!baseUrl) throw new Error("baseUrl ausente. Informe --base-url ou QA_FUZZ_BASE_URL.");

  const response = await requestJson({
    baseUrl,
    method: target.request.method,
    requestPath: target.request.path,
    headers,
    body: target.request.body,
  });

  const replay = {
    generatedAt: new Date().toISOString(),
    sourceReport: path.relative(projectRoot, reportPath).replace(/\\/g, "/"),
    target: {
      id: target.id,
      source: target.source,
    },
    request: {
      ...target.request,
      headers: redactHeaders(headers),
    },
    response: {
      status: response.status,
      contentType: response.contentType,
      durationMs: response.durationMs,
      body: response.body,
    },
  };

  console.log(`Replay ${target.source} ${target.id}: HTTP ${response.status} (${response.durationMs}ms)`);
  if (args.out) {
    const outPath = resolveInside(projectRoot, args.out);
    await writeJson(outPath, replay);
    console.log(`Resultado salvo em ${path.relative(projectRoot, outPath).replace(/\\/g, "/")}`);
  }
}

main().catch((error) => {
  console.error(`Erro no replay: ${error.message}`);
  process.exitCode = 1;
});
