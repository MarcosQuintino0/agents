#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { execFile } from "node:child_process";

const TOOL_VERSION = "0.1.0";
const GENERATED_FIELDS = new Set([
  "id",
  "uuid",
  "createdAt",
  "updatedAt",
  "created_at",
  "updated_at",
  "timestamp",
  "version",
]);

function usage() {
  return `
Uso:
  npm run qa:oracle -- --api users
  npm run qa:oracle -- --dir cypress/e2e/apis/users
  npm run qa:oracle -- --api users --faillens reports/faillens/faillens-report.json
  npm run qa:oracle -- --api users --open

Opcoes:
  --api <nome>        Nome da API em cypress/e2e/apis/<nome>.
  --dir <pasta>       Pasta dos specs Cypress da API.
  --out <pasta>       Pasta de saida. Padrao: .agents/state/qa-api/oracle/<api>.
  --faillens <json>   Report FailLens opcional para evidencias reais.
  --coverage <json>   coverage.json opcional gerado pelo qa:report.
  --open              Abre oracle.html ao final, quando o sistema permitir.
  --help              Exibe esta ajuda.
`.trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { open: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--open") {
      args.open = true;
    } else if (arg === "--api" || arg === "--dir" || arg === "--out" || arg === "--faillens" || arg === "--coverage") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Informe um valor para ${arg}.`);
      }
      args[arg.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Opcao desconhecida: ${arg}`);
    }
  }
  return args;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function resolveInside(root, target) {
  const resolved = path.resolve(root, target);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Caminho fora do projeto nao permitido: ${target}`);
  }
  return resolved;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function existsAsDirectory(dir) {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function collectFiles(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, predicate)));
    } else if (entry.isFile() && predicate(entry.name, fullPath)) {
      files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

async function readJsonIfExists(filePath) {
  if (!filePath || !(await pathExists(filePath))) return null;
  return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, ""));
}

function lineForIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function skipString(text, index, quote) {
  let cursor = index + 1;
  while (cursor < text.length) {
    const char = text[cursor];
    if (char === "\\") {
      cursor += 2;
      continue;
    }
    if (char === quote) return cursor + 1;
    cursor += 1;
  }
  return text.length;
}

function findMatchingParen(text, openIndex) {
  let depth = 0;
  for (let cursor = openIndex; cursor < text.length; cursor += 1) {
    const char = text[cursor];
    const next = text[cursor + 1];
    if (char === "'" || char === '"' || char === "`") {
      cursor = skipString(text, cursor, char) - 1;
      continue;
    }
    if (char === "/" && next === "/") {
      const end = text.indexOf("\n", cursor + 2);
      cursor = end === -1 ? text.length : end;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = text.indexOf("*/", cursor + 2);
      cursor = end === -1 ? text.length : end + 1;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return cursor;
    }
  }
  return -1;
}

function readLiteralAt(text, index) {
  const quote = text[index];
  let cursor = index + 1;
  let value = "";
  while (cursor < text.length) {
    const char = text[cursor];
    if (char === "\\") {
      value += text[cursor + 1] ?? "";
      cursor += 2;
      continue;
    }
    if (char === quote) {
      return { value, end: cursor + 1 };
    }
    value += char;
    cursor += 1;
  }
  return { value, end: cursor };
}

function firstStringLiteral(text) {
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "'" || char === '"' || char === "`") {
      return readLiteralAt(text, index).value.trim();
    }
  }
  return "(teste sem titulo detectavel)";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractTests(text, filePath, projectRoot) {
  const tests = [];
  const pattern = /\b(it|specify)(?:\.(only|skip))?\s*\(/g;
  let match;
  while ((match = pattern.exec(text))) {
    const openIndex = text.indexOf("(", match.index);
    const closeIndex = findMatchingParen(text, openIndex);
    if (closeIndex === -1) continue;
    const callText = text.slice(openIndex + 1, closeIndex);
    const title = firstStringLiteral(callText);
    tests.push({
      id: `${toPosix(path.relative(projectRoot, filePath))}:${lineForIndex(text, match.index)}`,
      title,
      normalizedTitle: normalizeTitle(title),
      file: toPosix(path.relative(projectRoot, filePath)),
      line: lineForIndex(text, match.index),
      mode: match[2] === "skip" ? "skip" : "active",
      source: callText,
    });
    pattern.lastIndex = closeIndex + 1;
  }
  return tests;
}

function extractContractFields(text) {
  const fields = [];
  const pattern = /@campo\s+([A-Za-z_$][\w$.-]*)\s*(?:\{([^}]+)\})?([^\n\r]*)/g;
  let match;
  while ((match = pattern.exec(text))) {
    fields.push({
      name: match[1],
      type: (match[2] || "").trim(),
      meta: (match[3] || "").trim(),
    });
  }
  return fields;
}

function addField(fields, value) {
  const field = String(value || "").trim();
  if (!field || field.length > 80) return;
  if (/^(body|response|resposta|consulta|payload|enviado|esperado|item|length|status)$/.test(field)) return;
  fields.add(field);
}

function extractAssertedFields(text) {
  const fields = new Set();
  const dotPattern =
    /\b(?:body|response\.body|resposta\.body|consulta\.body|requestBody|responseBody|payload|enviado|esperado|item|registroCriado|original)\.([A-Za-z_$][\w$]*)/g;
  let match;
  while ((match = dotPattern.exec(text))) addField(fields, match[1]);

  const bracketPattern =
    /\b(?:body|response\.body|resposta\.body|consulta\.body|payload|enviado|esperado|item|registroCriado|original)\s*\[\s*["'`]([^"'`]+)["'`]\s*\]/g;
  while ((match = bracketPattern.exec(text))) addField(fields, match[1]);

  const propertyPattern = /\b(?:property|ownProperty)\(\s*["'`]([^"'`]+)["'`]/g;
  while ((match = propertyPattern.exec(text))) addField(fields, match[1]);

  const keyArrayPattern = /\b(?:include\.keys|keys)\(\s*\[([^\]]+)\]/g;
  while ((match = keyArrayPattern.exec(text))) {
    const strings = match[1].match(/["'`]([^"'`]+)["'`]/g) || [];
    for (const item of strings) addField(fields, item.slice(1, -1));
  }

  const fieldArgPattern = /\b(?:campo|field)\s*:\s*["'`]([^"'`]+)["'`]/g;
  while ((match = fieldArgPattern.exec(text))) addField(fields, match[1]);

  return [...fields].sort((a, b) => a.localeCompare(b));
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function detectLayers(text, assertProfile = null) {
  const layers = {
    status: hasAny(text, [
      /expect\([^)]*status[^)]*\)\s*\.to\./i,
      /\bBaseAssert\.(?:validarStatus|status|validarSemConteudo|semConteudo|validarErroValidacao|erroValidacao|validarErroNegocio|erroNegocio)\b/,
      /\bErroAssert\./,
    ]),
    schema: hasAny(text, [
      /\bvalidarContra\b/,
      /\bBaseAssert\.(?:contra|validarErroValidacao|erroValidacao|validarErroNegocio|erroNegocio)\b/,
      /\bvalidarResponsePaginado\b/,
      /\.schema\.json\b/,
    ]),
    business: hasAny(text, [
      /\b[A-Z][A-Za-z0-9_]*Assert\.(?!validarStatus|status|validarSemConteudo|semConteudo)/,
      /expect\([^)]*(?:body|consulta|registroCriado|item|payload|enviado|esperado)[^)]*\)\s*\.to\./i,
      /\b(?:deep\.equal|include|property)\(/,
    ]),
    persistence: hasAny(text, [
      /\bbuscarPorId\b/,
      /\bconsulta\b/,
      /Persist/i,
      /persist/i,
      /preserv/i,
      /ausencia|ausente|exclusao|remov/i,
    ]),
    errorContract: hasAny(text, [
      /\b(?:validarErroValidacao|erroValidacao|validarErroNegocio|erroNegocio)\b/,
      /\bErroAssert\./,
      /\bmessage\b/,
      /\berrors\b/,
      /\bstatus\s*:\s*(?:400|401|403|404|409|422|500)\b/,
    ]),
    noLeak: hasAny(text, [/vazamento|vaza|stack|trace|exception|sql/i, /\bErroAssert\.(?:padrao|naoVazou|semVazamento)\b/]),
    namedResourceAssert: /\b(?!BaseAssert\b|ErroAssert\b)[A-Z][A-Za-z0-9_]*Assert\./.test(text),
    directCyRequest: /\bcy\.request\b/.test(text),
    directExpect: /\bexpect\(/.test(text),
    assertedAllPayload: hasAny(text, [
      /\bdeep\.equal\([^)]*(?:payload|enviado|esperado|original)/,
      /\.to\.include\([^)]*(?:payload|enviado|esperado|original)/,
      /\bexpect\([^)]*(?:payload|enviado|esperado|original)[^)]*\)\s*\.to\.deep\.equal/,
    ]),
  };

  if (layers.namedResourceAssert && assertProfile) {
    for (const key of ["status", "schema", "business", "persistence", "errorContract", "noLeak", "assertedAllPayload"]) {
      layers[key] = Boolean(layers[key] || assertProfile.layers[key]);
    }
  }

  return layers;
}

function inferScenario(test) {
  const text = `${test.title}\n${test.source}`.toLowerCase();
  const write = /post|put|patch|delete|cria|criacao|criar|atualiza|alterar|exclu|remove|delet/.test(text);
  const deletion = /delete|exclu|remove|delet/.test(text);
  const error =
    /erro|inval|obrig|duplic|conflito|sem autentic|permiss|inexistente|nao encontrado|400|401|403|404|409|422/.test(text);
  const empty = /204|sem conteudo|no content/.test(text);
  const list = /listar|listagem|pagin|filtro|orden/.test(text);
  return { write, deletion, error, empty, list };
}

function expectedLayersFor(test, layers) {
  const scenario = inferScenario(test);
  const expected = ["status"];
  if (!scenario.empty && !scenario.deletion) expected.push("schema");
  if (!scenario.error && !scenario.empty) expected.push("business");
  if (scenario.write || /persist|preserv|ausencia|ausente/i.test(test.title)) expected.push("persistence");
  if (scenario.error) {
    expected.push("errorContract");
    expected.push("noLeak");
  }
  if (layers.directCyRequest) expected.push("clientWrapper");
  return unique(expected);
}

function assessTest(test, assertProfile) {
  const layers = detectLayers(test.source, assertProfile);
  const expected = expectedLayersFor(test, layers);
  const missing = expected.filter((layer) => layer !== "clientWrapper" && !layers[layer]);
  const penalties = [];

  if (layers.directCyRequest) {
    penalties.push({
      code: "direct-cy-request",
      severity: "medium",
      message: "Spec usa cy.request direto; o padrao pede cliente em _support/api.js.",
    });
  }

  if (layers.status && !layers.schema && !layers.business && !layers.persistence && !layers.errorContract) {
    penalties.push({
      code: "status-only",
      severity: "high",
      message: "Teste parece validar apenas status HTTP.",
    });
  }

  for (const layer of missing) {
    penalties.push({
      code: `missing-${layer}`,
      severity: layer === "status" || layer === "business" || layer === "persistence" ? "high" : "medium",
      message: missingLayerMessage(layer),
    });
  }

  const hits = expected.filter((layer) => layer !== "clientWrapper" && layers[layer]).length;
  const expectedCount = Math.max(1, expected.filter((layer) => layer !== "clientWrapper").length);
  const penaltyPoints = penalties.reduce((total, item) => total + (item.severity === "high" ? 18 : 9), 0);
  const score = Math.max(0, Math.min(100, Math.round((hits / expectedCount) * 100 - penaltyPoints)));
  const level = score >= 85 ? "strong" : score >= 65 ? "good" : score >= 40 ? "basic" : "weak";

  return {
    layers,
    expectedLayers: expected,
    missingLayers: missing,
    score,
    level,
    risks: penalties,
    assertedFields: unique([
      ...extractAssertedFields(test.source),
      ...(layers.namedResourceAssert && assertProfile ? assertProfile.assertedFields : []),
    ]),
  };
}

function missingLayerMessage(layer) {
  const messages = {
    status: "Resposta relevante sem status HTTP explicitamente validado.",
    schema: "Resposta com corpo sem evidencia de schema/contrato validado.",
    business: "Sem evidencia de regra de negocio ou campos refletindo payload/esperado.",
    persistence: "Cenario de escrita/ausencia/preservacao sem evidencia de reconsulta ou preservacao.",
    errorContract: "Cenario de erro sem contrato de erro/mensagem/campo validado.",
    noLeak: "Cenario de erro sem evidencia de guard de nao-vazamento.",
  };
  return messages[layer] || `Camada esperada ausente: ${layer}.`;
}

function analyzeAssertProfile(assertFiles) {
  const source = assertFiles.map((item) => item.content).join("\n");
  const layers = detectLayers(source);
  const assertedFields = extractAssertedFields(source);
  return {
    files: assertFiles.map((item) => item.relativePath),
    layers,
    assertedFields,
    hasAssertFile: assertFiles.length > 0,
    warnings: buildAssertProfileWarnings(source, layers),
  };
}

function buildAssertProfileWarnings(source, layers) {
  const warnings = [];
  if (!source.trim()) {
    warnings.push({
      code: "assert-file-missing",
      severity: "medium",
      message: "_support/asserts.js nao foi encontrado; a auditoria usou apenas os specs.",
    });
    return warnings;
  }
  if (/\b(?:cy\.request|RecursoApi\.|Api\.)/.test(source)) {
    warnings.push({
      code: "assert-does-request",
      severity: "high",
      message: "Arquivo de asserts parece executar request; para mutation offline ele deve apenas validar objetos recebidos.",
    });
  }
  if (!layers.schema) {
    warnings.push({
      code: "assert-without-schema",
      severity: "medium",
      message: "Asserts do recurso nao parecem chamar validacao de schema.",
    });
  }
  if (!layers.business) {
    warnings.push({
      code: "assert-without-business-rule",
      severity: "high",
      message: "Asserts do recurso nao parecem validar campos de negocio.",
    });
  }
  return warnings;
}

function flattenJson(value, prefix = "$", output = []) {
  if (value === null || value === undefined) return output;
  if (Array.isArray(value)) {
    value.slice(0, 3).forEach((item, index) => flattenJson(item, `${prefix}[${index}]`, output));
    return output;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix === "$" ? `$.${key}` : `${prefix}.${key}`;
      if (child !== null && typeof child === "object") {
        flattenJson(child, next, output);
      } else {
        output.push({ path: next, field: key, type: child === null ? "null" : typeof child, value: child });
      }
    }
    return output;
  }
  output.push({ path: prefix, field: prefix.replace(/^\$\./, ""), type: typeof value, value });
  return output;
}

function normalizeFailLensTests(report) {
  if (!report) return [];
  const specs = Array.isArray(report.specs) ? report.specs : [];
  return specs.flatMap((spec) =>
    (Array.isArray(spec.tests) ? spec.tests : []).map((test) => ({
      ...test,
      specPath: test.specPath || spec.specPath,
      normalizedTitle: normalizeTitle(test.title || test.titlePath?.join(" > ")),
    })),
  );
}

function chooseMainRequest(test) {
  const requests = Array.isArray(test?.requests) ? test.requests : [];
  return (
    requests.find((request) => ["POST", "PUT", "PATCH", "DELETE"].includes(String(request.method || "").toUpperCase())) ||
    requests[0] ||
    null
  );
}

function observedEvidenceFor(test, failLensByTitle) {
  const observed = failLensByTitle.get(test.normalizedTitle);
  if (!observed) {
    return {
      found: false,
      requestFields: [],
      responseFields: [],
      mainRequest: null,
      state: "not-found",
    };
  }

  const requests = Array.isArray(observed.requests) ? observed.requests : [];
  const mainRequest = chooseMainRequest(observed);
  const requestFields = unique(
    requests.flatMap((request) => flattenJson(request.requestBody).map((field) => field.field)),
  ).sort((a, b) => a.localeCompare(b));
  const responseFields = unique(
    requests.flatMap((request) => flattenJson(request.responseBody).map((field) => field.field)),
  ).sort((a, b) => a.localeCompare(b));

  return {
    found: true,
    requestFields,
    responseFields,
    mainRequest: mainRequest
      ? {
          method: mainRequest.method,
          url: mainRequest.url,
          receivedStatus: mainRequest.receivedStatus,
          requestFields: unique(flattenJson(mainRequest.requestBody).map((field) => field.field)),
          responseFields: unique(flattenJson(mainRequest.responseBody).map((field) => field.field)),
        }
      : null,
    state: observed.state || "unknown",
  };
}

async function analyzeSchemas(projectRoot) {
  const schemasDir = path.join(projectRoot, "cypress", "fixtures", "schemas");
  if (!(await existsAsDirectory(schemasDir))) {
    return { found: false, files: [], closedCount: 0, fields: [] };
  }
  const files = await collectFiles(schemasDir, (name) => name.endsWith(".json"));
  const summaries = [];
  const fields = new Set();
  for (const file of files) {
    try {
      const json = JSON.parse(await fs.readFile(file, "utf8"));
      collectSchemaFields(json, fields);
      summaries.push({
        file: toPosix(path.relative(projectRoot, file)),
        closed: hasClosedObject(json),
      });
    } catch {
      summaries.push({
        file: toPosix(path.relative(projectRoot, file)),
        closed: false,
        invalid: true,
      });
    }
  }
  return {
    found: true,
    files: summaries,
    closedCount: summaries.filter((item) => item.closed).length,
    fields: [...fields].sort((a, b) => a.localeCompare(b)),
  };
}

function collectSchemaFields(schema, fields) {
  if (!schema || typeof schema !== "object") return;
  if (schema.properties && typeof schema.properties === "object") {
    for (const key of Object.keys(schema.properties)) fields.add(key);
  }
  for (const value of Object.values(schema)) {
    if (value && typeof value === "object") {
      if (Array.isArray(value)) value.forEach((item) => collectSchemaFields(item, fields));
      else collectSchemaFields(value, fields);
    }
  }
}

function hasClosedObject(schema) {
  if (!schema || typeof schema !== "object") return false;
  if (schema.additionalProperties === false) return true;
  return Object.values(schema).some((value) => {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some((item) => hasClosedObject(item));
    return hasClosedObject(value);
  });
}

function buildMutationEstimates({ test, assessment, observed, contractFields, schemaSummary }) {
  const asserted = new Set(assessment.assertedFields);
  const requestFields = new Set(observed.requestFields);
  const responseFields = observed.responseFields.length
    ? observed.responseFields
    : unique([...contractFields.map((field) => field.name), ...schemaSummary.fields]);
  const candidates = responseFields
    .filter((field) => field && !field.includes("."))
    .slice(0, 20)
    .sort((a, b) => a.localeCompare(b));
  const estimates = [];
  const schemaCanKillShape = assessment.layers.schema;
  const schemaCanKillExtra = assessment.layers.schema && schemaSummary.closedCount > 0;
  const allPayloadAsserted = assessment.layers.assertedAllPayload;

  for (const field of candidates) {
    const generated = GENERATED_FIELDS.has(field);
    const mirrored = requestFields.has(field);
    const fieldAsserted = asserted.has(field) || (allPayloadAsserted && mirrored);
    const shouldCheckValue = mirrored && !generated;

    estimates.push({
      id: `${field}:remove`,
      field,
      mutation: "remove-field",
      status: schemaCanKillShape || fieldAsserted ? "estimated-killed" : "estimated-survived",
      reason: schemaCanKillShape
        ? "schema deve detectar ausencia/tipo obrigatorio"
        : fieldAsserted
          ? "assertion toca o campo"
          : "campo nao aparece em schema/assertion detectavel",
    });

    estimates.push({
      id: `${field}:type-change`,
      field,
      mutation: "type-change",
      status: schemaCanKillShape || fieldAsserted ? "estimated-killed" : "estimated-survived",
      reason: schemaCanKillShape
        ? "schema deve detectar tipo incorreto"
        : fieldAsserted
          ? "assertion toca o campo"
          : "campo nao aparece em schema/assertion detectavel",
    });

    if (shouldCheckValue) {
      estimates.push({
        id: `${field}:value-change`,
        field,
        mutation: "value-change",
        status: fieldAsserted ? "estimated-killed" : "estimated-survived",
        reason: fieldAsserted
          ? "assertion parece comparar valor esperado/enviado"
          : "schema valida forma, mas nao prova que o valor reflete o payload",
      });
    }
  }

  if (assessment.layers.schema) {
    estimates.push({
      id: "unknown-field:extra",
      field: "__campoIndevido",
      mutation: "extra-field",
      status: schemaCanKillExtra ? "estimated-killed" : "estimated-survived",
      reason: schemaCanKillExtra
        ? "ha schema fechado com additionalProperties:false"
        : "nao foi possivel confirmar schema fechado",
    });
  }

  const survived = estimates.filter((item) => item.status === "estimated-survived");
  const killed = estimates.filter((item) => item.status === "estimated-killed");
  const notes = [];
  if (!observed.found) {
    notes.push("Sem FailLens: mutation estimada com contrato/schema/codigo, sem response real.");
  }
  if (survived.some((item) => item.mutation === "value-change")) {
    notes.push("Ha campos cujo valor poderia mudar sem evidencia de assertion especifica.");
  }
  if (test.mode === "skip") {
    notes.push("Teste pulado; mutation estimada nao representa execucao real.");
  }

  return { estimates, killed: killed.length, survived: survived.length, notes };
}

function severityRank(value) {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}

function buildAiNextActions(tests, assertProfile) {
  const actions = [];
  for (const warning of assertProfile.warnings) {
    actions.push({
      priority: warning.severity,
      type: "assert-profile-warning",
      message: warning.message,
      evidence: assertProfile.files.join(", ") || "_support/asserts.js",
    });
  }
  for (const test of tests) {
    for (const risk of test.risks) {
      actions.push({
        priority: risk.severity,
        type: "oracle-risk",
        code: risk.code,
        message: `${test.title}: ${risk.message}`,
        evidence: `${test.file}:${test.line}`,
      });
    }
    const survived = test.mutationEstimates.filter((item) => item.status === "estimated-survived");
    if (survived.length) {
      actions.push({
        priority: survived.some((item) => item.mutation === "value-change") ? "high" : "medium",
        type: "survived-mutants",
        message: `${test.title}: ${survived.length} mutantes estimados sobreviveram.`,
        evidence: `${test.file}:${test.line}`,
      });
    }
  }
  return actions.sort((left, right) => severityRank(right.priority) - severityRank(left.priority));
}

function renderHtml(report) {
  const levelLabels = {
    strong: "Forte",
    good: "Bom",
    basic: "Basico",
    weak: "Fraco",
  };
  const rows = report.tests
    .map((test) => {
      const survived = test.mutationEstimates.filter((item) => item.status === "estimated-survived");
      return `<tr>
        <td><strong>${escapeHtml(test.title)}</strong><br><span>${escapeHtml(test.file)}:${test.line}</span></td>
        <td class="level ${test.level}">${levelLabels[test.level] || test.level}</td>
        <td>${test.score}</td>
        <td>${escapeHtml(test.presentLayers.join(", ") || "-")}</td>
        <td>${escapeHtml(test.missingLayers.join(", ") || "-")}</td>
        <td>${test.mutation.killed}/${test.mutation.total}</td>
        <td>${escapeHtml(survived.slice(0, 5).map((item) => `${item.field}:${item.mutation}`).join(", ") || "-")}</td>
      </tr>`;
    })
    .join("\n");
  const actions = report.aiNextActions
    .slice(0, 12)
    .map((item) => `<li><strong>${escapeHtml(item.priority)}</strong> - ${escapeHtml(item.message)}</li>`)
    .join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>QA Oracle - ${escapeHtml(report.api)}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #1f2937; background: #f8fafc; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .muted, td span { color: #64748b; font-size: 13px; }
    .cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 22px 0; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .card strong { display: block; font-size: 24px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    th, td { padding: 11px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .level { font-weight: 700; }
    .level.strong { color: #047857; }
    .level.good { color: #0369a1; }
    .level.basic { color: #a16207; }
    .level.weak { color: #b91c1c; }
    .panel { margin-top: 22px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
<main>
  <h1>QA Oracle - ${escapeHtml(report.api)}</h1>
  <p class="muted">Auditoria estatica e mutation estimada das assertions. Nao executa requests nem altera dados.</p>
  <section class="cards">
    <div class="card">Testes<strong>${report.summary.tests}</strong></div>
    <div class="card">Score medio<strong>${report.summary.averageScore}</strong></div>
    <div class="card">Fortes<strong>${report.summary.levels.strong}</strong></div>
    <div class="card">Mutantes mortos<strong>${report.summary.mutations.estimatedKilled}</strong></div>
    <div class="card">Sobreviventes<strong>${report.summary.mutations.estimatedSurvived}</strong></div>
  </section>
  <table>
    <thead>
      <tr><th>Teste</th><th>Nivel</th><th>Score</th><th>Camadas</th><th>Lacunas</th><th>Mutantes</th><th>Sobreviventes</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <section class="panel">
    <h2>Proximas acoes</h2>
    <ul>${actions || "<li>Nenhuma acao critica detectada.</li>"}</ul>
  </section>
</main>
</body>
</html>`;
}

async function openFile(filePath) {
  const command = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", filePath] : [filePath];
  await new Promise((resolve) => {
    execFile(command, args, { windowsHide: true }, () => resolve());
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.api && !args.dir) {
    throw new Error("Informe --api ou --dir.");
  }

  const projectRoot = process.cwd();
  const sourceDir = args.dir
    ? resolveInside(projectRoot, args.dir)
    : resolveInside(projectRoot, path.join("cypress", "e2e", "apis", args.api));
  if (!(await existsAsDirectory(sourceDir))) {
    throw new Error(`Pasta de API nao encontrada: ${toPosix(path.relative(projectRoot, sourceDir))}`);
  }

  const api = args.api || path.basename(sourceDir);
  const outDir = args.out
    ? resolveInside(projectRoot, args.out)
    : resolveInside(projectRoot, path.join(".agents", "state", "qa-api", "oracle", api));
  const failLensPath = args.faillens
    ? resolveInside(projectRoot, args.faillens)
    : path.join(projectRoot, "reports", "faillens", "faillens-report.json");
  const coveragePath = args.coverage
    ? resolveInside(projectRoot, args.coverage)
    : path.join(projectRoot, ".agents", "state", "qa-api", "reports", api, "coverage.json");

  const specFiles = await collectFiles(sourceDir, (name) => name.endsWith(".cy.js"));
  const specs = await Promise.all(
    specFiles.map(async (file) => ({
      file,
      relativePath: toPosix(path.relative(projectRoot, file)),
      content: await fs.readFile(file, "utf8"),
    })),
  );
  const assertFiles = [];
  const supportAssertPath = path.join(sourceDir, "_support", "asserts.js");
  if (await pathExists(supportAssertPath)) {
    assertFiles.push({
      file: supportAssertPath,
      relativePath: toPosix(path.relative(projectRoot, supportAssertPath)),
      content: await fs.readFile(supportAssertPath, "utf8"),
    });
  }

  const assertProfile = analyzeAssertProfile(assertFiles);
  const contractFields = unique(specs.flatMap((spec) => extractContractFields(spec.content).map((field) => field.name))).map(
    (name) => ({ name }),
  );
  const schemaSummary = await analyzeSchemas(projectRoot);
  const failLensReport = await readJsonIfExists(failLensPath);
  const coverageReport = await readJsonIfExists(coveragePath);
  const failLensTests = normalizeFailLensTests(failLensReport);
  const failLensByTitle = new Map(failLensTests.map((test) => [test.normalizedTitle, test]));

  const tests = specs
    .flatMap((spec) => extractTests(spec.content, spec.file, projectRoot))
    .map((test) => {
      const assessment = assessTest(test, assertProfile);
      const observed = observedEvidenceFor(test, failLensByTitle);
      const mutation = buildMutationEstimates({ test, assessment, observed, contractFields, schemaSummary });
      return {
        id: test.id,
        title: test.title,
        file: test.file,
        line: test.line,
        mode: test.mode,
        level: assessment.level,
        score: assessment.score,
        layers: assessment.layers,
        presentLayers: Object.entries(assessment.layers)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key),
        expectedLayers: assessment.expectedLayers,
        missingLayers: assessment.missingLayers,
        risks: assessment.risks,
        assertedFields: assessment.assertedFields,
        observed,
        mutationEstimates: mutation.estimates,
        mutation: {
          total: mutation.estimates.length,
          killed: mutation.killed,
          survived: mutation.survived,
          notes: mutation.notes,
        },
      };
    });

  const totalScore = tests.reduce((total, test) => total + test.score, 0);
  const levels = {
    strong: tests.filter((test) => test.level === "strong").length,
    good: tests.filter((test) => test.level === "good").length,
    basic: tests.filter((test) => test.level === "basic").length,
    weak: tests.filter((test) => test.level === "weak").length,
  };
  const mutations = tests.reduce(
    (total, test) => ({
      total: total.total + test.mutation.total,
      estimatedKilled: total.estimatedKilled + test.mutation.killed,
      estimatedSurvived: total.estimatedSurvived + test.mutation.survived,
    }),
    { total: 0, estimatedKilled: 0, estimatedSurvived: 0 },
  );

  const report = {
    schemaVersion: "1.0.0",
    tool: { name: "qa-oracle", version: TOOL_VERSION },
    generatedAt: new Date().toISOString(),
    api,
    sourceDir: toPosix(path.relative(projectRoot, sourceDir)),
    inputs: {
      faillens: failLensReport ? toPosix(path.relative(projectRoot, failLensPath)) : null,
      coverage: coverageReport ? toPosix(path.relative(projectRoot, coveragePath)) : null,
    },
    summary: {
      tests: tests.length,
      activeTests: tests.filter((test) => test.mode === "active").length,
      averageScore: tests.length ? Math.round(totalScore / tests.length) : 0,
      levels,
      mutations,
      failLensMatchedTests: tests.filter((test) => test.observed.found).length,
      warnings: assertProfile.warnings.length + tests.reduce((total, test) => total + test.risks.length, 0),
    },
    assertProfile,
    schemaSummary,
    tests,
    aiNextActions: buildAiNextActions(tests, assertProfile),
  };

  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "oracle.json");
  const htmlPath = path.join(outDir, "oracle.html");
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(htmlPath, renderHtml(report), "utf8");

  console.log(`QA Oracle gerado: ${toPosix(path.relative(projectRoot, jsonPath))}`);
  console.log(`HTML: ${toPosix(path.relative(projectRoot, htmlPath))}`);
  console.log(
    `Resumo: ${tests.length} testes, score medio ${report.summary.averageScore}, ${mutations.estimatedSurvived} mutantes estimados sobreviventes.`,
  );

  if (args.open) {
    await openFile(htmlPath);
  }
}

main().catch((error) => {
  fail(error.message || String(error));
});
