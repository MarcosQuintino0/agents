#!/usr/bin/env node
/* global console, process, fetch, URL */

import path from "node:path";
import {
  clone,
  createPrng,
  fillPathTemplate,
  parseArgs,
  parseEnvHeaders,
  parseHeaderArgs,
  pick,
  previewValue,
  readJson,
  redactHeaders,
  requestJson,
  resolveInside,
  toPosix,
  writeJson,
  writeText,
} from "./lib/common.mjs";
import { normalizeOpenApiDocument } from "./lib/profile-utils.mjs";

const MODE_LIMITS = {
  smoke: 30,
  deep: 250,
  stateful: 120,
};

const SAFE_REJECTION = new Set([400, 401, 403, 404, 405, 409, 415, 422, 428, 429]);

function usage() {
  return `
Uso:
  npm run qa:fuzz -- --api users
  npm run qa:fuzz -- --profile .agents/state/qa-api-fuzz/profiles/users.profile.json --mode deep
  npm run qa:fuzz -- --api users --openapi openapi.json --base-url http://localhost:3100
  npm run qa:fuzz -- --api users --dry-run --max-cases 10

Opcoes:
  --api <nome>              Usa .agents/state/qa-api-fuzz/profiles/<api>.profile.json
  --profile <arquivo>       Usa um profile ja gerado.
  --openapi <arquivo>       OpenAPI JSON para normalizar em memoria.
  --swagger <arquivo>       Swagger JSON para normalizar em memoria.
  --base-url <url>          Sobrescreve baseUrl do profile.
  --mode <smoke|deep|stateful>
  --max-cases <numero>      Limite total de casos.
  --seed <valor>            Seed reproduzivel.
  --header "Nome: valor"    Header adicional. Pode repetir.
  --dry-run                 Mostra casos sem enviar requests.
  --verbose                 Mostra request/resposta de cada caso.
  --fail-on-critical        Exit code 1 quando houver finding critico.
  --help                    Exibe ajuda.
`.trim();
}

function schemaType(schema = {}) {
  if (schema.enum) return "enum";
  if (Array.isArray(schema.type)) return schema.type.find((item) => item !== "null") || schema.type[0];
  return schema.type || (schema.properties ? "object" : "string");
}

function valueForSchema(schema = {}, random = Math.random, name = "value") {
  if (schema.example !== undefined) return clone(schema.example);
  if (schema.default !== undefined) return clone(schema.default);
  if (schema.enum?.length) return clone(schema.enum[0]);

  switch (schemaType(schema)) {
    case "integer":
      return Number.isFinite(schema.minimum) ? schema.minimum : 1;
    case "number":
      return Number.isFinite(schema.minimum) ? schema.minimum : 1.25;
    case "boolean":
      return true;
    case "array":
      return [valueForSchema(schema.items || { type: "string" }, random, name)];
    case "object": {
      const required = new Set(schema.required || []);
      const entries = Object.entries(schema.properties || {});
      return Object.fromEntries(
        entries
          .filter(([key]) => required.has(key) || entries.length <= 12)
          .map(([key, value]) => [key, valueForSchema(value, random, key)]),
      );
    }
    case "string":
    default:
      if (schema.format === "email" || /email/i.test(name)) return `qa-fuzz-${Math.floor(random() * 100000)}@example.com`;
      if (schema.format === "date") return "2026-01-15";
      if (schema.format === "date-time") return "2026-01-15T10:30:00.000Z";
      if (schema.minLength && schema.minLength > 1) return "A".repeat(schema.minLength);
      return `qa-fuzz-${name}`;
  }
}

function wrongTypeValue(schema = {}) {
  switch (schemaType(schema)) {
    case "string":
      return 12345;
    case "integer":
    case "number":
      return "nao-e-numero";
    case "boolean":
      return "true";
    case "array":
      return { value: "nao-e-array" };
    case "object":
      return "nao-e-objeto";
    default:
      return { unexpected: true };
  }
}

function weirdValues(schema = {}, random = Math.random) {
  const type = schemaType(schema);
  if (type === "string") {
    const values = [
      "",
      " ",
      "A".repeat(Number(schema.maxLength || 256) + 1),
      "A".repeat(10000),
      "emoji-😀-".repeat(40),
      "controle-\u0000-null",
      "\"'\\/<>${}",
      "Robert'); DROP TABLE users;--",
      "../".repeat(80),
    ];
    if (schema.format === "email") values.push("nao-e-email", "@", "a@b", "email com espaco@example.com");
    return values;
  }
  if (type === "integer" || type === "number") {
    return [-1, 0, 1.5, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 1e308, "NaN", null];
  }
  if (type === "boolean") return ["true", "false", 1, 0, null];
  if (type === "array") return [[], [null], Array.from({ length: 100 }, () => valueForSchema(schema.items, random))];
  if (type === "object") return [null, [], "objeto-como-string", { "__proto__": { polluted: true } }];
  return [null, wrongTypeValue(schema)];
}

function confidenceFor(schema = {}, operation = {}) {
  return schema["x-confidence"] || operation.confidence || "inferred";
}

function shouldExpectReject(schema, operation, mutationKind) {
  const confidence = confidenceFor(schema, operation);
  if (!["confirmed", "contract"].includes(confidence)) return false;
  return ["missing-required", "null-required", "wrong-type", "invalid-format", "enum-invalid", "above-max", "below-min"].includes(
    mutationKind,
  );
}

function setField(payload, field, value) {
  return { ...clone(payload), [field]: value };
}

function withoutField(payload, field) {
  const next = clone(payload);
  delete next[field];
  return next;
}

function buildBodyCases(operation, random, perOperationLimit) {
  const schema = operation.request?.schema;
  if (!schema || schemaType(schema) !== "object") return [];
  const base = valueForSchema(schema, random);
  const required = new Set(schema.required || []);
  const properties = Object.entries(schema.properties || {});
  const cases = [
    {
      id: "valid-baseline",
      title: "payload valido baseline",
      body: base,
      expectation: "accept",
      reason: "controle positivo gerado pelo schema/profile",
    },
  ];

  for (const [field, fieldSchema] of properties) {
    if (required.has(field)) {
      cases.push({
        id: `${field}-missing`,
        title: `${field} ausente`,
        body: withoutField(base, field),
        expectation: shouldExpectReject(fieldSchema, operation, "missing-required") ? "reject" : "robust",
        reason: `${field} requerido conforme confidence=${confidenceFor(fieldSchema, operation)}`,
      });
      cases.push({
        id: `${field}-null`,
        title: `${field} null`,
        body: setField(base, field, null),
        expectation: shouldExpectReject(fieldSchema, operation, "null-required") ? "reject" : "robust",
        reason: `${field} null em campo requerido`,
      });
    }

    cases.push({
      id: `${field}-wrong-type`,
      title: `${field} com tipo incorreto`,
      body: setField(base, field, wrongTypeValue(fieldSchema)),
      expectation: shouldExpectReject(fieldSchema, operation, "wrong-type") ? "reject" : "robust",
      reason: `${field} deveria ser ${schemaType(fieldSchema)} conforme profile`,
    });

    for (const [index, value] of weirdValues(fieldSchema, random).entries()) {
      const mutationKind =
        fieldSchema.format === "email" && typeof value === "string" && !value.includes("@")
          ? "invalid-format"
          : typeof value === "string" && fieldSchema.maxLength && value.length > fieldSchema.maxLength
            ? "above-max"
            : "weird-value";
      cases.push({
        id: `${field}-weird-${index + 1}`,
        title: `${field} valor degenerado ${index + 1}`,
        body: setField(base, field, value),
        expectation: shouldExpectReject(fieldSchema, operation, mutationKind) ? "reject" : "robust",
        reason: `${field} com valor degenerado; mutation=${mutationKind}`,
      });
    }
  }

  cases.push({
    id: "unknown-fields",
    title: "campos desconhecidos e mass assignment",
    body: {
      ...base,
      admin: true,
      role: "ADMIN",
      ownerId: "qa-fuzz-owner",
      status: "APPROVED",
      createdAt: "1999-01-01T00:00:00.000Z",
    },
    expectation: "robust",
    reason: "campos extras/controlados devem ser tratados sem vazamento ou corrupcao",
  });

  while (cases.length < perOperationLimit) {
    const next = clone(base);
    const changes = 1 + Math.floor(random() * Math.min(3, Math.max(1, properties.length)));
    for (let index = 0; index < changes; index += 1) {
      const [field, fieldSchema] = pick(properties, random);
      next[field] = pick([...weirdValues(fieldSchema, random), wrongTypeValue(fieldSchema), null], random);
    }
    cases.push({
      id: `random-${cases.length}`,
      title: `combinacao fuzz ${cases.length}`,
      body: next,
      expectation: "robust",
      reason: "combinacao deterministica gerada por seed",
    });
  }

  return cases.slice(0, perOperationLimit);
}

function parameterValue(parameter, random) {
  if (parameter.example !== undefined) return parameter.example;
  if (parameter.examples?.length) return parameter.examples[0];
  return valueForSchema(parameter.schema || { type: "string" }, random, parameter.name);
}

function buildRequestPath(operation, random) {
  const values = {};
  for (const parameter of operation.parameters || []) {
    if (parameter.in === "path") values[parameter.name] = parameterValue(parameter, random);
  }
  let requestPath = fillPathTemplate(operation.path, values);
  const query = new URLSearchParams();
  for (const parameter of operation.parameters || []) {
    if (parameter.in === "query" && parameter.required) {
      query.set(parameter.name, String(parameterValue(parameter, random)));
    }
  }
  const queryText = query.toString();
  if (queryText) requestPath += requestPath.includes("?") ? `&${queryText}` : `?${queryText}`;
  return requestPath;
}

function buildCases(profile, random, maxCases) {
  const perOperationLimit = Math.max(1, Math.ceil(maxCases / Math.max(1, profile.operations.length)));
  const all = [];
  for (const operation of profile.operations) {
    const bodyCases = ["POST", "PUT", "PATCH"].includes(operation.method)
      ? buildBodyCases(operation, random, perOperationLimit)
      : [
          {
            id: "request-baseline",
            title: "request baseline",
            body: undefined,
            expectation: "robust",
            reason: "operacao sem body testada para resposta controlada",
          },
        ];
    for (const item of bodyCases) {
      all.push({
        id: `${operation.id}-${item.id}`,
        operationId: operation.id,
        operation,
        title: `${operation.method} ${operation.path}: ${item.title}`,
        body: item.body,
        expectation: item.expectation,
        reason: item.reason,
      });
    }
  }
  return all.slice(0, maxCases);
}

function hasLeakage(response, patterns = []) {
  const text = `${response.rawText || ""}\n${JSON.stringify(response.headers || {})}`;
  return patterns.find((pattern) => new RegExp(pattern, "i").test(text));
}

function validateSchemaSimple(schema, value, pathName = "$") {
  const errors = [];
  if (!schema || value === undefined || value === null) return errors;
  const type = schemaType(schema);
  if (type === "object") {
    if (typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${pathName} deveria ser object`);
      return errors;
    }
    for (const required of schema.required || []) {
      if (!(required in value)) errors.push(`${pathName}.${required} obrigatorio ausente`);
    }
    for (const [key, propSchema] of Object.entries(schema.properties || {})) {
      if (key in value) errors.push(...validateSchemaSimple(propSchema, value[key], `${pathName}.${key}`));
    }
  } else if (type === "array") {
    if (!Array.isArray(value)) errors.push(`${pathName} deveria ser array`);
  } else if (type === "integer") {
    if (!Number.isInteger(value)) errors.push(`${pathName} deveria ser integer`);
  } else if (type === "number") {
    if (typeof value !== "number") errors.push(`${pathName} deveria ser number`);
  } else if (type === "boolean") {
    if (typeof value !== "boolean") errors.push(`${pathName} deveria ser boolean`);
  } else if (type === "string") {
    if (typeof value !== "string") errors.push(`${pathName} deveria ser string`);
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${pathName} fora do enum`);
  return errors;
}

function responseSchemaFor(operation, status) {
  const responses = operation.responses || {};
  return responses[String(status)]?.schema || responses.default?.schema || null;
}

function analyzeCase(testCase, response, profile) {
  const findings = [];
  const leakage = hasLeakage(response, profile.defaults?.leakagePatterns || []);
  if (response.status >= 500) {
    findings.push({
      severity: "critical",
      property: "not_a_server_error",
      message: "A API retornou 5xx para payload gerado.",
    });
  }
  if (leakage) {
    findings.push({
      severity: "critical",
      property: "no_internal_leakage",
      message: `Resposta contem possivel vazamento interno: ${leakage}.`,
    });
  }
  if (response.status !== 204 && response.rawText && !response.contentType.includes("application/json")) {
    findings.push({
      severity: response.status >= 400 ? "medium" : "high",
      property: "content_type_conformance",
      message: "Resposta com corpo sem Content-Type JSON coerente.",
    });
  }
  if (testCase.expectation === "reject" && response.status >= 200 && response.status < 300) {
    findings.push({
      severity: "high",
      property: "negative_contract_acceptance",
      message: "Payload fora de contrato confirmado foi aceito.",
    });
  }
  if (testCase.expectation === "accept" && !(response.status >= 200 && response.status < 300)) {
    findings.push({
      severity: "high",
      property: "positive_contract_rejection",
      message: "Payload baseline valido nao foi aceito.",
    });
  }
  if (testCase.expectation === "reject" && response.status < 500 && !(response.status >= 200 && response.status < 300) && !SAFE_REJECTION.has(response.status)) {
    findings.push({
      severity: "medium",
      property: "controlled_rejection_status",
      message: "Payload invalido foi rejeitado com status pouco usual.",
    });
  }
  const schema = responseSchemaFor(testCase.operation, response.status);
  const schemaErrors = validateSchemaSimple(schema, response.body);
  if (schemaErrors.length) {
    findings.push({
      severity: response.status >= 500 ? "critical" : "medium",
      property: "response_schema_conformance",
      message: `Resposta nao bateu com schema simples: ${schemaErrors.slice(0, 3).join("; ")}`,
    });
  }
  return findings;
}

async function cleanupIfNeeded({ profile, testCase, response, headers }) {
  const cleanup = testCase.operation.state?.cleanup;
  if (!cleanup || !(response.status >= 200 && response.status < 300)) return null;
  const idPointer = testCase.operation.state?.idPointer || "/id";
  const id = idPointer
    .split("/")
    .slice(1)
    .reduce((current, key) => (current ? current[key] : undefined), response.body);
  if (id === undefined || id === null) return null;
  return requestJson({
    baseUrl: profile.baseUrl,
    method: cleanup.method || "DELETE",
    requestPath: fillPathTemplate(cleanup.path, { id }),
    headers,
  });
}

function markdownReport(report) {
  const lines = [
    `# QA API Fuzz - ${report.api}`,
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    `Seed: ${report.seed}`,
    `Cases: ${report.summary.cases}`,
    `Findings: ${report.summary.findings}`,
    `Critical: ${report.summary.criticalFindings}`,
    "",
    "## Findings",
    "",
  ];
  if (!report.findings.length) {
    lines.push("Nenhum finding encontrado pelos checks configurados.", "");
  } else {
    for (const finding of report.findings) {
      lines.push(`### ${finding.id}`, "");
      lines.push(`- Severity: ${finding.severity}`);
      lines.push(`- Property: ${finding.property}`);
      lines.push(`- Case: ${finding.caseTitle}`);
      lines.push(`- Status: ${finding.response.status}`);
      lines.push(`- Message: ${finding.message}`);
      lines.push(`- Replay: npm run qa:fuzz:replay -- --report ${report.outputs.json} --finding ${finding.id}`);
      lines.push("");
      lines.push("Payload:");
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(previewValue(finding.request.body), null, 2));
      lines.push("```", "");
    }
  }
  lines.push("## Cases", "");
  for (const item of report.cases) {
    lines.push(`- ${item.status}: ${item.id} -> HTTP ${item.response.status} (${item.expectation})`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function loadProfile(args, projectRoot) {
  if (args.openapi || args.swagger) {
    const input = resolveInside(projectRoot, args.openapi || args.swagger);
    if (!/\.json$/i.test(input)) {
      throw new Error("OpenAPI/Swagger YAML deve ser executado via Schemathesis ou convertido para JSON para o runner local.");
    }
    return normalizeOpenApiDocument(await readJson(input), {
      api: args.api || path.basename(input).replace(/\.[^.]+$/, ""),
      baseUrl: args.baseUrl || "",
      sourcePath: toPosix(path.relative(projectRoot, input)),
    });
  }
  const profilePath = args.profile
    ? resolveInside(projectRoot, args.profile)
    : resolveInside(projectRoot, path.join(".agents", "state", "qa-api-fuzz", "profiles", `${args.api}.profile.json`));
  return readJson(profilePath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2), {
    booleans: ["help", "dryRun", "verbose", "failOnCritical"],
    arrays: ["header"],
  });
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.api && !args.profile && !args.openapi && !args.swagger) {
    throw new Error("Informe --api, --profile, --openapi ou --swagger.");
  }

  const projectRoot = process.cwd();
  const profile = await loadProfile(args, projectRoot);
  profile.baseUrl = args.baseUrl || process.env.QA_FUZZ_BASE_URL || profile.baseUrl;
  if (!profile.baseUrl) throw new Error("Profile sem baseUrl. Informe --base-url ou QA_FUZZ_BASE_URL.");

  const mode = args.mode || "smoke";
  const maxCases = Number(args.maxCases || MODE_LIMITS[mode] || MODE_LIMITS.smoke);
  const seed = args.seed || `${profile.api}-${mode}`;
  const random = createPrng(seed);
  const headers = {
    "Content-Type": profile.defaults?.contentType || "application/json",
    ...(profile.defaults?.headers || {}),
    ...parseEnvHeaders(),
    ...parseHeaderArgs(args.header || []),
  };
  const cases = buildCases(profile, random, maxCases);

  if (args.dryRun) {
    console.log(`QA fuzz dry-run: ${profile.api}`);
    console.log(`Base URL: ${profile.baseUrl}`);
    console.log(`Seed: ${seed}`);
    console.log(`Cases: ${cases.length}`);
    for (const [index, testCase] of cases.entries()) {
      console.log(`[${index + 1}/${cases.length}] ${testCase.title}`);
      console.log(JSON.stringify(previewValue(testCase.body), null, 2));
    }
    return;
  }

  const executed = [];
  const findings = [];
  for (const [index, testCase] of cases.entries()) {
    const requestPath = buildRequestPath(testCase.operation, random);
    if (args.verbose) {
      console.log(`[${index + 1}/${cases.length}] ${testCase.operation.method} ${requestPath}`);
      console.log(JSON.stringify(previewValue(testCase.body), null, 2));
    }
    const response = await requestJson({
      baseUrl: profile.baseUrl,
      method: testCase.operation.method,
      requestPath,
      headers,
      body: testCase.body,
    });
    const caseFindings = analyzeCase(testCase, response, profile);
    const cleanup = await cleanupIfNeeded({ profile, testCase, response, headers });
    if (args.verbose) {
      console.log(`=> HTTP ${response.status} (${response.durationMs}ms)`);
      for (const finding of caseFindings) console.log(`   ${finding.severity}: ${finding.property}`);
      if (cleanup) console.log(`   cleanup: HTTP ${cleanup.status}`);
    }

    executed.push({
      id: testCase.id,
      title: testCase.title,
      operationId: testCase.operation.id,
      expectation: testCase.expectation,
      reason: testCase.reason,
      status: caseFindings.length ? "finding" : "ok",
      request: {
        method: testCase.operation.method,
        path: requestPath,
        headers: redactHeaders(headers),
        body: testCase.body,
      },
      response: {
        status: response.status,
        contentType: response.contentType,
        durationMs: response.durationMs,
      },
      cleanup: cleanup ? { status: cleanup.status, durationMs: cleanup.durationMs } : null,
    });

    for (const item of caseFindings) {
      findings.push({
        id: `F${String(findings.length + 1).padStart(3, "0")}`,
        ...item,
        caseId: testCase.id,
        caseTitle: testCase.title,
        caseReason: testCase.reason,
        operationId: testCase.operation.id,
        request: {
          method: testCase.operation.method,
          path: requestPath,
          headers: redactHeaders(headers),
          body: testCase.body,
        },
        response: {
          status: response.status,
          contentType: response.contentType,
          body: response.body,
        },
        evidence: testCase.operation.evidence || [],
        promotion: {
          suggested: item.severity === "critical" || item.property.includes("contract"),
          target: "qa-api Cypress suite",
          note: "Promova para Cypress somente com oraculo confirmado.",
        },
      });
    }
  }

  const outputDir = resolveInside(projectRoot, path.join(".agents", "state", "qa-api-fuzz", "reports", profile.api));
  const jsonPath = path.join(outputDir, "fuzz-report.json");
  const mdPath = path.join(outputDir, "fuzz-report.md");
  const report = {
    schemaVersion: "0.1.0",
    generatedAt: new Date().toISOString(),
    api: profile.api,
    mode,
    seed,
    baseUrl: profile.baseUrl,
    summary: {
      cases: executed.length,
      findings: findings.length,
      criticalFindings: findings.filter((item) => item.severity === "critical").length,
    },
    findings,
    cases: executed,
    outputs: {
      json: toPosix(path.relative(projectRoot, jsonPath)),
      markdown: toPosix(path.relative(projectRoot, mdPath)),
    },
  };
  await writeJson(jsonPath, report);
  await writeText(mdPath, markdownReport(report));

  console.log(`QA fuzz concluido para ${profile.api}.`);
  console.log(`Casos executados: ${report.summary.cases}`);
  console.log(`Achados: ${report.summary.findings}`);
  console.log(`Criticos: ${report.summary.criticalFindings}`);
  console.log(`Relatorio: ${report.outputs.markdown}`);

  if (args.failOnCritical && report.summary.criticalFindings > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Erro no QA fuzz: ${error.message}`);
  process.exitCode = 1;
});
