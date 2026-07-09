import path from "node:path";
import { collectFiles, exists, pointerGet, readJson, toPosix } from "./common.mjs";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

export const PROFILE_VERSION = "0.1.0";

export const LEAKAGE_PATTERNS = [
  "stack",
  "stackTrace",
  "trace",
  "exception",
  "NullPointerException",
  "SQLException",
  "SqlException",
  "TypeError",
  "ReferenceError",
  "OutOfMemory",
  "at\\s+[A-Za-z0-9_.]+\\(",
  "org\\.springframework",
  "Microsoft\\.AspNetCore",
  "System\\.[A-Za-z]+Exception",
];

export function emptyProfile({ api, baseUrl = "", source }) {
  return {
    profileVersion: PROFILE_VERSION,
    kind: "qa-api-fuzz-profile",
    api,
    baseUrl,
    source,
    defaults: {
      contentType: "application/json",
      headers: {},
      leakagePatterns: LEAKAGE_PATTERNS,
    },
    operations: [],
  };
}

export function sanitizeOperationId(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function parseEndpoint(value) {
  const match = /^\s*([A-Z]+)\s+(.+?)\s*$/.exec(String(value || ""));
  if (!match) return null;
  return { method: match[1], path: match[2] };
}

export function resolveRef(document, value) {
  if (!value || typeof value !== "object") return value;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/")) {
    const resolved = pointerGet(document, value.$ref.slice(1).replace(/\//g, "/"));
    return resolveRef(document, resolved);
  }
  return value;
}

function normalizeSchema(document, schema) {
  if (!schema || typeof schema !== "object") return undefined;
  const resolved = resolveRef(document, schema);
  if (!resolved || typeof resolved !== "object") return undefined;
  const copy = { ...resolved };
  if (copy.properties) {
    copy.properties = Object.fromEntries(
      Object.entries(copy.properties).map(([key, value]) => [key, normalizeSchema(document, value) || value]),
    );
  }
  if (copy.items) copy.items = normalizeSchema(document, copy.items) || copy.items;
  if (copy.allOf) copy.allOf = copy.allOf.map((item) => normalizeSchema(document, item) || item);
  if (copy.anyOf) copy.anyOf = copy.anyOf.map((item) => normalizeSchema(document, item) || item);
  if (copy.oneOf) copy.oneOf = copy.oneOf.map((item) => normalizeSchema(document, item) || item);
  delete copy.$ref;
  return copy;
}

function mergeAllOf(schema) {
  if (!schema?.allOf) return schema;
  const merged = { ...schema, allOf: undefined, type: "object", properties: {}, required: [] };
  for (const part of schema.allOf) {
    const normalized = mergeAllOf(part);
    Object.assign(merged.properties, normalized.properties || {});
    merged.required.push(...(normalized.required || []));
  }
  merged.required = [...new Set(merged.required)];
  return merged;
}

function firstJsonContent(content = {}) {
  return (
    content["application/json"] ||
    content["application/*+json"] ||
    Object.entries(content).find(([key]) => key.includes("json"))?.[1] ||
    Object.values(content)[0]
  );
}

function normalizeParameters(document, parameters = []) {
  return parameters.map((parameter) => {
    const resolved = resolveRef(document, parameter) || parameter;
    return {
      name: resolved.name,
      in: resolved.in,
      required: Boolean(resolved.required),
      schema: normalizeSchema(document, resolved.schema || { type: resolved.type || "string" }),
      example: resolved.example,
      evidence: [`openapi parameter ${resolved.in}.${resolved.name}`],
      confidence: "confirmed",
    };
  });
}

function schemaWithEvidence(schema, evidence, confidence = "confirmed") {
  if (!schema || typeof schema !== "object") return schema;
  const next = { ...schema, "x-evidence": evidence, "x-confidence": confidence };
  if (next.properties) {
    next.properties = Object.fromEntries(
      Object.entries(next.properties).map(([key, value]) => [
        key,
        schemaWithEvidence(value, [...evidence, `property ${key}`], confidence),
      ]),
    );
  }
  if (next.items) next.items = schemaWithEvidence(next.items, [...evidence, "items"], confidence);
  return next;
}

export function normalizeOpenApiDocument(document, { api, baseUrl = "", sourcePath = "" }) {
  const isSwagger = document.swagger?.startsWith("2.");
  const sourceType = isSwagger ? "swagger" : "openapi";
  const profile = emptyProfile({
    api,
    baseUrl: baseUrl || document.servers?.[0]?.url || "",
    source: {
      type: sourceType,
      path: sourcePath,
      version: document.openapi || document.swagger || "unknown",
    },
  });

  if (isSwagger && !profile.baseUrl) {
    const scheme = document.schemes?.[0] || "http";
    const host = document.host || "";
    const basePath = document.basePath || "";
    profile.baseUrl = host ? `${scheme}://${host}${basePath}` : "";
  }

  for (const [apiPath, pathItem] of Object.entries(document.paths || {})) {
    const pathParameters = normalizeParameters(document, pathItem.parameters || []);
    for (const [methodLower, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(methodLower)) continue;
      const method = methodLower.toUpperCase();
      const opParameters = normalizeParameters(document, operation.parameters || []);
      const parameters = [...pathParameters, ...opParameters];
      const bodyParameter = parameters.find((item) => item.in === "body");
      const requestContent = firstJsonContent(operation.requestBody?.content || {});
      const requestSchema = isSwagger
        ? normalizeSchema(document, bodyParameter?.schema)
        : normalizeSchema(document, requestContent?.schema);
      const responses = {};

      for (const [status, response] of Object.entries(operation.responses || {})) {
        const resolved = resolveRef(document, response) || response;
        const responseContent = firstJsonContent(resolved.content || {});
        const responseSchema = isSwagger
          ? normalizeSchema(document, resolved.schema)
          : normalizeSchema(document, responseContent?.schema);
        responses[status] = {
          description: resolved.description || "",
          schema: responseSchema ? schemaWithEvidence(mergeAllOf(responseSchema), [`${sourceType} response ${status}`]) : undefined,
        };
      }

      const operationId = sanitizeOperationId(
        operation.operationId || `${methodLower}-${apiPath.replace(/[{}]/g, "").replace(/[^A-Za-z0-9]+/g, "-")}`,
      );
      const security = operation.security ?? document.security ?? [];
      profile.operations.push({
        id: operationId,
        method,
        path: apiPath,
        summary: operation.summary || operation.description || "",
        confidence: "confirmed",
        evidence: [`${sourceType}: ${method} ${apiPath}`],
        auth: {
          required: Array.isArray(security) && security.length > 0,
          evidence: security?.length ? [`${sourceType} security requirement`] : [],
        },
        parameters: parameters.filter((item) => item.in !== "body"),
        request: requestSchema
          ? {
              contentType: "application/json",
              schema: schemaWithEvidence(mergeAllOf(requestSchema), [`${sourceType} requestBody ${method} ${apiPath}`]),
              examples: [],
            }
          : undefined,
        responses,
        state: {},
      });
    }
  }

  return profile;
}

function inferTypeFromText(text) {
  const value = String(text || "").toLowerCase();
  if (/integer|inteiro|int\b|long\b|bigint/.test(value)) return "integer";
  if (/number|decimal|double|float|numeric|preco|valor|amount/.test(value)) return "number";
  if (/boolean|bool|ativo|flag/.test(value)) return "boolean";
  if (/array|lista|list\W|colecao/.test(value)) return "array";
  return "string";
}

function inferFieldSchema(field) {
  const raw = `${field.details || ""} ${field.raw || ""}`;
  const attributes = field.attributes || {};
  const schema = {
    type: attributes.type || attributes.tipo || inferTypeFromText(raw),
    "x-evidence": [`qa-api @campo ${field.name}: ${field.raw || field.details || "sem detalhe"}`],
    "x-confidence": attributes.type || attributes.tipo ? "confirmed" : "observed",
  };

  if (/email/i.test(raw) || attributes.format === "email") schema.format = "email";
  if (attributes.enum) schema.enum = String(attributes.enum).split("|").filter(Boolean);
  if (attributes.minLength || attributes.minlength) schema.minLength = Number(attributes.minLength || attributes.minlength);
  if (attributes.maxLength || attributes.maxlength) schema.maxLength = Number(attributes.maxLength || attributes.maxlength);
  if (attributes.minimum || attributes.min) schema.minimum = Number(attributes.minimum || attributes.min);
  if (attributes.maximum || attributes.max) schema.maximum = Number(attributes.maximum || attributes.max);
  return schema;
}

function isRequiredField(field) {
  const raw = `${field.details || ""} ${field.raw || ""}`.toLowerCase();
  const attrs = field.attributes || {};
  return attrs.required === "true" || attrs.obrigatorio === "true" || /obrigatorio|required|notnull|not null/.test(raw);
}

async function findSchemaReference(projectRoot, api, schemaName) {
  const schemaRoot = path.join(projectRoot, "cypress", "fixtures", "schemas");
  const candidates = [
    path.join(schemaRoot, `${schemaName}.schema.json`),
    path.join(schemaRoot, `${api}.schema.json`),
    path.join(schemaRoot, "erro-validacao.schema.json"),
    path.join(schemaRoot, "erro.schema.json"),
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) return toPosix(path.relative(projectRoot, candidate));
  }
  return "";
}

export async function buildProfileFromQaApi({ projectRoot, api, baseUrl = "" }) {
  const reportPath = path.join(projectRoot, ".agents", "state", "qa-api", "reports", api, "coverage.json");
  const reportExists = await exists(reportPath);
  const profile = emptyProfile({
    api,
    baseUrl,
    source: {
      type: "qa-api",
      path: reportExists ? toPosix(path.relative(projectRoot, reportPath)) : "",
      note: "Profile gerado a partir de artefatos qa-api. Revisar antes de fuzz profundo.",
    },
  });

  if (!reportExists) {
    profile.source.warning = "coverage.json nao encontrado; rode npm run qa:report -- --api <api> ou informe OpenAPI/Swagger.";
    return profile;
  }

  const report = await readJson(reportPath);
  const endpoints = (report.contract?.endpoints || []).map(parseEndpoint).filter(Boolean);
  const fields = report.contract?.fields || [];
  const required = fields.filter(isRequiredField).map((field) => field.name);
  const properties = Object.fromEntries(fields.map((field) => [field.name, inferFieldSchema(field)]));
  const requestSchema = fields.length
    ? {
        type: "object",
        additionalProperties: false,
        required,
        properties,
        "x-evidence": [`qa-api contract ${report.contract?.sourceFile || ""}`],
        "x-confidence": "observed",
      }
    : undefined;

  for (const endpoint of endpoints) {
    const hasBody = ["POST", "PUT", "PATCH"].includes(endpoint.method);
    const successSchema = await findSchemaReference(projectRoot, api, api);
    const errorSchema = await findSchemaReference(projectRoot, api, "erro-validacao");
    profile.operations.push({
      id: sanitizeOperationId(`${endpoint.method}-${endpoint.path.replace(/[{}]/g, "").replace(/[^A-Za-z0-9]+/g, "-")}`),
      method: endpoint.method,
      path: endpoint.path,
      confidence: "observed",
      evidence: [
        `qa-api @api ${endpoint.method} ${endpoint.path}`,
        report.contract?.sourceFile ? `qa-api contract file ${report.contract.sourceFile}` : "",
      ].filter(Boolean),
      auth: {
        required: "unknown",
        evidence: report.contract?.permissions?.length ? report.contract.permissions.map((item) => item.raw || item.description) : [],
      },
      parameters: (endpoint.path.match(/\{([A-Za-z0-9_-]+)\}/g) || []).map((item) => ({
        name: item.slice(1, -1),
        in: "path",
        required: true,
        schema: { type: "string", "x-confidence": "inferred", "x-evidence": [`path template ${endpoint.path}`] },
        confidence: "inferred",
        evidence: [`path template ${endpoint.path}`],
      })),
      request: hasBody && requestSchema ? { contentType: "application/json", schema: requestSchema, examples: [] } : undefined,
      responses: {
        default: {
          schemaRef: successSchema,
          evidence: successSchema ? [`qa-api schema ${successSchema}`] : [],
        },
        error: {
          schemaRef: errorSchema,
          evidence: errorSchema ? [`qa-api schema ${errorSchema}`] : [],
        },
      },
      state: {},
    });
  }

  const deleteById = profile.operations.find((item) => item.method === "DELETE" && /\{[^}]+\}/.test(item.path));
  for (const operation of profile.operations) {
    if (operation.method === "POST" && deleteById) {
      operation.state = {
        createsResource: true,
        idPointer: "/id",
        cleanup: { method: "DELETE", path: deleteById.path },
      };
    }
  }

  return profile;
}

export async function attachKnownArtifacts({ projectRoot, profile }) {
  const graphLock = path.join(projectRoot, ".agents", "state", "qa-api", "backend-graph.lock.json");
  const graphJson = path.join(projectRoot, ".agents", "state", "qa-api", "graphify-out", "graph.json");
  profile.artifacts = {
    qaApiCoverage: profile.source?.path || "",
    backendGraphLock: (await exists(graphLock)) ? toPosix(path.relative(projectRoot, graphLock)) : "",
    graphJson: (await exists(graphJson)) ? toPosix(path.relative(projectRoot, graphJson)) : "",
  };

  const schemas = await collectFiles(path.join(projectRoot, "cypress", "fixtures", "schemas"), (file) =>
    file.endsWith(".schema.json"),
  );
  profile.artifacts.schemas = schemas.map((file) => toPosix(path.relative(projectRoot, file)));
  return profile;
}
