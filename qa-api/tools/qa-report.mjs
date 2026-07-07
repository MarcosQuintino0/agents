#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const TOOL_VERSION = "1.0.0";

const CATALOG = [
  { label: "Fluxo principal válido", tag: "@fluxo-principal", constant: "CatalogoTags.FLUXO_PRINCIPAL" },
  { label: "Listagem, filtro, ordenação e página", tag: "@paginacao", constant: "CatalogoTags.PAGINACAO" },
  { label: "Recurso inexistente", tag: "@recurso-inexistente", constant: "CatalogoTags.RECURSO_INEXISTENTE" },
  { label: "Obrigatoriedade", tag: "@obrigatoriedade", constant: "CatalogoTags.OBRIGATORIEDADE" },
  { label: "Valores limite", tag: "@valor-limite", constant: "CatalogoTags.VALOR_LIMITE" },
  { label: "Payload excessivo", tag: "@payload-excessivo", constant: "CatalogoTags.PAYLOAD_EXCESSIVO" },
  { label: "Tipo, formato e enum inválidos", tag: "@tipo-invalido", constant: "CatalogoTags.TIPO_INVALIDO" },
  { label: "Regra de negócio de entrada", tag: "@regra-negocio", constant: "CatalogoTags.REGRA_NEGOCIO" },
  { label: "Campo desconhecido", tag: "@campo-desconhecido", constant: "CatalogoTags.CAMPO_DESCONHECIDO" },
  { label: "Mass assignment", tag: "@mass-assignment", constant: "CatalogoTags.MASS_ASSIGNMENT" },
  { label: "Entrada estruturalmente inválida", tag: "@entrada-invalida", constant: "CatalogoTags.ENTRADA_INVALIDA" },
  { label: "Content-Type inválido", tag: "@content-type-invalido", constant: "CatalogoTags.CONTENT_TYPE_INVALIDO" },
  { label: "Método não permitido", tag: "@metodo-nao-permitido", constant: "CatalogoTags.METODO_NAO_PERMITIDO" },
  { label: "Sem autenticação", tag: "@sem-autenticacao", constant: "CatalogoTags.SEM_AUTENTICACAO" },
  { label: "Credencial inválida ou expirada", tag: "@credencial-invalida", constant: "CatalogoTags.CREDENCIAL_INVALIDA" },
  { label: "Permissão insuficiente", tag: "@permissao-insuficiente", constant: "CatalogoTags.PERMISSAO_INSUFICIENTE" },
  { label: "Object-level authorization", tag: "@object-level-authorization", constant: "CatalogoTags.OBJECT_LEVEL_AUTHORIZATION" },
  { label: "Property-level authorization", tag: "@property-level-authorization", constant: "CatalogoTags.PROPERTY_LEVEL_AUTHORIZATION" },
  { label: "Repetição, duplicidade e idempotência", tag: "@idempotencia", constant: "CatalogoTags.IDEMPOTENCIA" },
  { label: "Concorrência", tag: "@concorrencia", constant: "CatalogoTags.CONCORRENCIA" },
  { label: "Rate limit", tag: "@rate-limit", constant: "CatalogoTags.RATE_LIMIT" },
  { label: "Timeout", tag: "@timeout", constant: "CatalogoTags.TIMEOUT" },
  { label: "Relacionamento inexistente", tag: "@relacionamento-inexistente", constant: "CatalogoTags.RELACIONAMENTO_INEXISTENTE" },
  { label: "Campo controlado pelo backend", tag: "@campo-controlado", constant: "CatalogoTags.CAMPO_CONTROLADO" },
];

function usage() {
  return `
Uso:
  npm run qa:report -- --api users
  npm run qa:report -- --dir cypress/e2e/apis/users
  npm run qa:report -- --api users --open

Opções:
  --api <nome>     Nome da API em cypress/e2e/apis/<nome>.
  --dir <pasta>    Pasta dos specs Cypress da API.
  --out <pasta>    Pasta de saída. Padrão: .agents/state/qa-api/reports/<api>.
  --open           Abre coverage.html ao final, quando o sistema permitir.
  --help           Exibe esta ajuda.
`.trim();
}

function parseArgs(argv) {
  const args = { open: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--open") {
      args.open = true;
    } else if (arg === "--api" || arg === "--dir" || arg === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Informe um valor para ${arg}.`);
      }
      args[arg.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
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
    throw new Error(`Caminho fora do projeto não permitido: ${target}`);
  }
  return resolved;
}

async function existsAsDirectory(dir) {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function collectSpecFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSpecFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".cy.js")) {
      files.push(fullPath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
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
  let cursor = openIndex;
  while (cursor < text.length) {
    const char = text[cursor];
    const next = text[cursor + 1];
    if (char === "'" || char === '"' || char === "`") {
      cursor = skipString(text, cursor, char);
      continue;
    }
    if (char === "/" && next === "/") {
      const end = text.indexOf("\n", cursor + 2);
      cursor = end === -1 ? text.length : end + 1;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = text.indexOf("*/", cursor + 2);
      cursor = end === -1 ? text.length : end + 2;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return cursor;
    }
    cursor += 1;
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
  return "(teste sem título detectável)";
}

function extractArrayAfterTags(callText) {
  const match = /tags\s*:\s*\[/.exec(callText);
  if (!match) return "";
  const openIndex = match.index + match[0].lastIndexOf("[");
  let depth = 0;
  for (let cursor = openIndex; cursor < callText.length; cursor += 1) {
    const char = callText[cursor];
    if (char === "'" || char === '"' || char === "`") {
      cursor = skipString(callText, cursor, char) - 1;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return callText.slice(openIndex + 1, cursor);
    }
  }
  return "";
}

function findMatchingBracketBackward(text, closeIndex) {
  let depth = 0;
  for (let cursor = closeIndex; cursor >= 0; cursor -= 1) {
    const char = text[cursor];
    if (char === "]") depth += 1;
    if (char === "[") {
      depth -= 1;
      if (depth === 0) return cursor;
    }
  }
  return -1;
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let cursor = openIndex;
  while (cursor < text.length) {
    const char = text[cursor];
    const next = text[cursor + 1];
    if (char === "'" || char === '"' || char === "`") {
      cursor = skipString(text, cursor, char);
      continue;
    }
    if (char === "/" && next === "/") {
      const end = text.indexOf("\n", cursor + 2);
      cursor = end === -1 ? text.length : end + 1;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = text.indexOf("*/", cursor + 2);
      cursor = end === -1 ? text.length : end + 2;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return cursor;
    }
    cursor += 1;
  }
  return -1;
}

function extractTopLevelObjects(arrayText) {
  const objects = [];
  for (let cursor = 0; cursor < arrayText.length; cursor += 1) {
    if (arrayText[cursor] !== "{") continue;
    const close = findMatchingBrace(arrayText, cursor);
    if (close === -1) break;
    objects.push(arrayText.slice(cursor, close + 1));
    cursor = close;
  }
  return objects;
}

function readObjectStringProperty(objectText, name) {
  const pattern = new RegExp(`\\b${name}\\s*:\\s*(['"\`])([\\s\\S]*?)\\1`);
  const match = pattern.exec(objectText);
  return match ? match[2].trim() : "";
}

function readObjectCatalogTag(objectText) {
  const match = /\btag\s*:\s*CatalogoTags\.([A-Za-z0-9_]+)/.exec(objectText);
  return match ? `CatalogoTags.${match[1]}` : "";
}

function expandTemplateTitle(title, values) {
  return title.replace(/\$\{\s*([A-Za-z0-9_]+)\s*\}/g, (match, name) => values[name] || match);
}

function parseDataDrivenCases(arrayText, baseTitle) {
  return extractTopLevelObjects(arrayText)
    .map((objectText, index) => {
      const values = {
        descricao: readObjectStringProperty(objectText, "descricao"),
        caso: readObjectStringProperty(objectText, "caso"),
        titulo: readObjectStringProperty(objectText, "titulo"),
      };
      const rule = readObjectStringProperty(objectText, "regra");
      const catalogTag = readObjectCatalogTag(objectText);
      const field = readObjectStringProperty(objectText, "campo");
      const tags = [rule ? `@regra:${rule}` : "", catalogTag].filter(Boolean);
      return {
        id: `case-${String(index + 1).padStart(2, "0")}`,
        title: expandTemplateTitle(baseTitle, values),
        field,
        tags,
        catalogTags: catalogTag ? [catalogTag] : [],
        ruleTags: rule ? [rule] : [],
        evidence: "data-driven-array",
      };
    })
    .filter((item) => item.tags.length || item.title !== baseTitle);
}

function extractDataDrivenContext(text, itIndex) {
  for (const match of text.matchAll(/\]\s*\.forEach\s*\(/g)) {
    const forEachIndex = match.index;
    const openIndex = findMatchingBracketBackward(text, forEachIndex);
    const openParen = text.indexOf("(", forEachIndex);
    const closeParen = openParen === -1 ? -1 : findMatchingParen(text, openParen);
    if (openIndex === -1 || openParen === -1 || closeParen === -1) continue;
    if (itIndex < openParen || itIndex > closeParen) continue;
    const arrayText = text.slice(openIndex + 1, forEachIndex);
    return { tags: [], arrayText };
  }
  return { tags: [], arrayText: "" };
}

function tagsFromLogicalCases(logicalCases) {
  const tags = new Set();
  for (const item of logicalCases) {
    for (const tag of item.tags) {
      tags.add(tag);
    }
  }
  return { tags: [...tags] };
}

function extractTags(callText, dataDrivenContext = { tags: [] }) {
  const tags = new Set();
  const arrayText = extractArrayAfterTags(callText);
  const literalPattern = /(['"`])([^'"`]*?)\1/g;
  for (const match of arrayText.matchAll(literalPattern)) {
    const value = match[2].trim();
    if (value && !value.includes("${")) tags.add(value);
  }
  const catalogPattern = /\bCatalogoTags\.([A-Za-z0-9_]+)/g;
  for (const match of arrayText.matchAll(catalogPattern)) {
    tags.add(`CatalogoTags.${match[1]}`);
  }
  for (const tag of dataDrivenContext.tags) {
    tags.add(tag);
  }
  return [...tags];
}

function extractTests(text, filePath, rootDir) {
  const tests = [];
  const pattern = /\bit(?:\.(skip|only))?\s*\(/g;
  for (const match of text.matchAll(pattern)) {
    const openIndex = match.index + match[0].lastIndexOf("(");
    const closeIndex = findMatchingParen(text, openIndex);
    if (closeIndex === -1) continue;
    const callText = text.slice(openIndex + 1, closeIndex);
    const title = firstStringLiteral(callText);
    const dataDrivenContext = extractDataDrivenContext(text, match.index);
    const logicalCases = dataDrivenContext.arrayText ? parseDataDrivenCases(dataDrivenContext.arrayText, title) : [];
    const tags = extractTags(callText, tagsFromLogicalCases(logicalCases));
    const ruleTags = tags
      .filter((tag) => tag.startsWith("@regra:"))
      .map((tag) => tag.slice("@regra:".length).trim())
      .filter(Boolean);
    tests.push({
      title,
      file: toPosix(path.relative(rootDir, filePath)),
      line: lineForIndex(text, match.index),
      mode: match[1] === "skip" ? "skip" : match[1] === "only" ? "only" : "active",
      source: logicalCases.length ? "data-driven" : "direct",
      logicalCases,
      tags,
      catalogTags: tags.filter((tag) => tag.startsWith("CatalogoTags.")),
      ruleTags,
      hasBug: tags.includes("@bug"),
      hasSecurity: tags.includes("@seguranca"),
    });
  }
  return tests;
}

function cleanJSDocLine(line) {
  return line.replace(/^\s*\*\s?/, "").trimEnd();
}

function parseKeyValues(text) {
  const values = {};
  const pattern = /([A-Za-z0-9_-]+)=("[^"]*"|'[^']*'|[^\s]+)/g;
  for (const match of text.matchAll(pattern)) {
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return values;
}

function coerceValue(value) {
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function parseEndpoint(value) {
  const match = /^\s*([A-Z]+)\s+(.+?)\s*$/.exec(value);
  return {
    raw: value,
    method: match ? match[1] : "",
    path: match ? match[2] : value,
  };
}

function parseRuleLine(value) {
  const [id = "", ...rest] = value.split(/\s+/);
  const description = rest.join(" ");
  const attributes = parseKeyValues(description);
  const structured = Object.fromEntries(
    Object.entries(attributes).map(([key, item]) => [key, coerceValue(item)]),
  );
  return {
    id,
    description,
    ...structured,
    attributes,
    raw: value,
  };
}

function parseCoverageLine(value) {
  const normalized = value.replace(/\s+[—-]\s+/, " -- ");
  const [head, ...tail] = normalized.split(" -- ");
  const parts = head.trim().split(/\s+/);
  return {
    id: parts[0] ?? "",
    status: parts[1] ?? "nao-informado",
    reason: tail.join(" -- ").trim(),
    raw: value,
  };
}

function parseContractBlock(block) {
  const contract = {
    id: "",
    summary: "",
    endpoints: [],
    fields: [],
    rules: [],
    permissions: [],
    coverageNotes: [],
  };
  const lines = block.split(/\r?\n/).map(cleanJSDocLine);
  for (const line of lines) {
    const match = /^@([A-Za-z0-9_-]+)\s*(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, tag, rawValue] = match;
    const value = rawValue.trim();
    if (tag === "contrato") {
      contract.id = value.split(/\s+/)[0] ?? "";
    } else if (tag === "api") {
      contract.endpoints.push(
        ...value
          .split("|")
          .map((endpoint) => endpoint.trim())
          .filter(Boolean),
      );
    } else if (tag === "resumo") {
      contract.summary = [contract.summary, value].filter(Boolean).join(" ");
    } else if (tag === "campo") {
      const [name = "", ...rest] = value.split(/\s+/);
      contract.fields.push({ name, details: rest.join(" "), attributes: parseKeyValues(value), raw: value });
    } else if (tag === "regra") {
      contract.rules.push(parseRuleLine(value));
    } else if (tag === "permissao") {
      contract.permissions.push({ description: value, raw: value });
    } else if (tag === "cobertura") {
      contract.coverageNotes.push(parseCoverageLine(value));
    }
  }
  return contract;
}

function extractContract(specs) {
  const candidates = [];
  for (const spec of specs) {
    const blockPattern = /\/\*\*([\s\S]*?)\*\//g;
    for (const match of spec.content.matchAll(blockPattern)) {
      if (/@contrato\b|@api\b/.test(match[1])) {
        candidates.push({ file: spec.file, block: match[1], preferred: path.basename(spec.file) === "crud.cy.js" });
      }
    }
  }
  const selected = candidates.find((item) => item.preferred) ?? candidates[0];
  if (!selected) {
    return { contract: parseContractBlock(""), sourceFile: "", found: false };
  }
  return {
    contract: parseContractBlock(selected.block),
    sourceFile: selected.file,
    found: true,
  };
}

function isWeakCoverageReason(note) {
  const reason = String(note.reason || "").trim();
  if (reason.length < 12) return true;
  const normalized = reason
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return [
    "nao se aplica",
    "nao aplicavel",
    "n/a",
    "sem contexto",
    "sem informacao",
    "nao identificado",
    "nao encontrado",
  ].includes(normalized);
}

function normalizeCatalogTag(tag) {
  const match = CATALOG.find((item) => item.constant === tag || item.tag === tag);
  return match?.tag ?? tag;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function endpointId(endpoint) {
  return `${endpoint.method} ${endpoint.path}`;
}

function parseContractEndpoints(contract) {
  return contract.endpoints.map((endpoint) => {
    const parsed = parseEndpoint(endpoint);
    return {
      ...parsed,
      id: endpointId(parsed),
    };
  });
}

function findEndpointByMethod(endpoints, method, predicate = () => true) {
  return endpoints.find((endpoint) => endpoint.method === method && predicate(endpoint));
}

function inferEndpointForRule(rule, endpoints) {
  const operation = String(rule.operation || "").toUpperCase();
  if (rule.endpoint) {
    const path = String(rule.endpoint);
    const exact = endpoints.find((endpoint) => endpoint.method === operation && endpoint.path === path);
    if (exact) return { endpoint: exact, confidence: "high", evidence: "rule-endpoint" };
  }
  if (!operation) return null;
  const candidates = endpoints.filter((endpoint) => endpoint.method === operation);
  if (candidates.length === 1) {
    return { endpoint: candidates[0], confidence: "high", evidence: "rule-operation" };
  }
  const text = `${rule.id} ${rule.condition || ""} ${rule.description || ""}`.toLowerCase();
  if (operation === "GET") {
    if (/list|listar|pagina|filtro|orden/.test(text)) {
      const endpoint = findEndpointByMethod(candidates, "GET", (item) => !item.path.includes("{"));
      if (endpoint) return { endpoint, confidence: "medium", evidence: "rule-operation-condition" };
    }
    if (/buscar|found|not-found|inexistente|\bid\b/.test(text)) {
      const endpoint = findEndpointByMethod(candidates, "GET", (item) => item.path.includes("{"));
      if (endpoint) return { endpoint, confidence: "medium", evidence: "rule-operation-condition" };
    }
  }
  return candidates[0] ? { endpoint: candidates[0], confidence: "low", evidence: "rule-operation-ambiguous" } : null;
}

function inferEndpointForTestTitle(test, endpoints) {
  const text = test.title.toLowerCase();
  const pick = (method, wantsId = false) =>
    findEndpointByMethod(endpoints, method, (item) => (wantsId ? item.path.includes("{") : true));

  if (/listagem|listar/.test(text)) return pick("GET", false);
  if (/buscar|inexistente/.test(text)) return pick("GET", true) || pick("GET", false);
  if (/cria|criar|criacao|criação/.test(text)) return pick("POST");
  if (/atualiza|atualizar|alterar/.test(text)) return pick("PUT", true) || pick("PATCH", true);
  if (/exclu|delet|remov/.test(text)) return pick("DELETE", true);
  return null;
}

function endpointRefsForTest(test, ruleById, ruleEndpointMap, endpoints) {
  const refs = [];
  for (const ruleId of test.ruleTags) {
    const rule = ruleById.get(ruleId);
    const mapped = ruleEndpointMap.get(ruleId);
    if (rule && mapped) {
      refs.push({
        endpoint: mapped.endpoint,
        confidence: mapped.confidence,
        evidence: mapped.evidence,
        ruleId,
      });
    }
  }
  if (!refs.length) {
    const endpoint = inferEndpointForTestTitle(test, endpoints);
    if (endpoint) {
      refs.push({ endpoint, confidence: "low", evidence: "inferred-title" });
    }
  }
  const seen = new Set();
  return refs.filter((ref) => {
    const id = endpointId(ref.endpoint);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function nextActionForCoverage(note) {
  if (note.status === "aplicavel") {
    return `Criar teste para ${note.id}${note.reason ? `: ${note.reason}` : "."}`;
  }
  if (note.status === "nao-confirmado") {
    return `Pedir contexto sobre ${note.id}${note.reason ? `: ${note.reason}` : "."}`;
  }
  return "";
}

function buildCatalogAssessment({ byTag, byLogicalCaseTag = {}, coverageByStatus }) {
  const noteByTag = new Map();
  for (const [status, notes] of Object.entries(coverageByStatus)) {
    for (const note of notes) {
      noteByTag.set(note.id, { ...note, status });
    }
  }
  return CATALOG.map((item) => {
    const testCount = (byTag[item.constant] || 0) + (byTag[item.tag] || 0);
    const logicalCaseCount = (byLogicalCaseTag[item.constant] || 0) + (byLogicalCaseTag[item.tag] || 0);
    const note = noteByTag.get(item.tag);
    const status = testCount > 0 || logicalCaseCount > 0 ? "covered" : note?.status || "not-evaluated";
    return {
      tag: item.tag,
      constant: item.constant,
      label: item.label,
      status,
      testCount,
      logicalCaseCount,
      reason: note?.reason || "",
      evidence: testCount > 0 ? "test-tags" : logicalCaseCount > 0 ? "data-driven-cases" : note ? "jsdoc-cobertura" : "none",
      confidence: testCount > 0 || logicalCaseCount > 0 || note ? "high" : "low",
      nextAction:
        status === "not-evaluated"
          ? `Avaliar se ${item.tag} faz sentido para esta API.`
          : nextActionForCoverage(note || { id: item.tag, status }),
    };
  });
}

function buildAiNextActions({ warnings, coverageNotes, rulesMissing, bugs, catalogAssessment }) {
  const actions = [];
  for (const warning of warnings) {
    actions.push({
      priority: warning.severity === "high" ? "high" : "medium",
      type: "quality-warning",
      code: warning.code,
      message: warning.message,
      evidence: warning.file ? `${warning.file}:${warning.line}` : "qa-report-warning",
    });
  }
  for (const rule of rulesMissing) {
    actions.push({
      priority: "high",
      type: "missing-rule-test",
      ruleId: rule.id,
      message: `Criar ou justificar teste para a regra ${rule.id}.`,
      evidence: "jsdoc-regra",
    });
  }
  for (const note of coverageNotes) {
    if (note.status === "aplicavel" || note.status === "nao-confirmado") {
      actions.push({
        priority: note.status === "aplicavel" ? "high" : "medium",
        type: note.status === "aplicavel" ? "needs-test" : "needs-context",
        tag: note.id,
        message: nextActionForCoverage(note),
        evidence: "jsdoc-cobertura",
      });
    }
  }
  for (const test of bugs) {
    actions.push({
      priority: "medium",
      type: "bug-follow-up",
      message: `Acompanhar teste marcado como bug: ${test.title}.`,
      evidence: `${test.file}:${test.line}`,
    });
  }
  for (const item of catalogAssessment.filter((entry) => entry.status === "not-evaluated")) {
    actions.push({
      priority: "low",
      type: "catalog-not-evaluated",
      tag: item.tag,
      message: item.nextAction,
      evidence: "catalog",
    });
  }
  return actions;
}

function buildCoverage({ api, contract, tests, sourceDir, projectRoot, contractFound }) {
  const byTag = {};
  const byLogicalCaseTag = {};
  for (const test of tests) {
    for (const tag of test.tags) {
      byTag[tag] = (byTag[tag] ?? 0) + 1;
    }
    for (const logicalCase of test.logicalCases || []) {
      for (const tag of logicalCase.tags || []) {
        byLogicalCaseTag[tag] = (byLogicalCaseTag[tag] ?? 0) + 1;
      }
    }
  }

  const endpoints = parseContractEndpoints(contract);
  const declaredRules = new Map(contract.rules.map((rule) => [rule.id, rule]));
  const ruleEndpointMap = new Map(
    contract.rules
      .map((rule) => [rule.id, inferEndpointForRule(rule, endpoints)])
      .filter(([, value]) => Boolean(value)),
  );
  const coveredRuleIds = new Set(tests.flatMap((test) => test.ruleTags));
  const rulesCovered = contract.rules.filter((rule) => coveredRuleIds.has(rule.id));
  const rulesMissing = contract.rules.filter((rule) => !coveredRuleIds.has(rule.id));
  const unknownRuleTags = [...coveredRuleIds].filter((id) => !declaredRules.has(id));
  const bugs = tests.filter((test) => test.hasBug);
  const gaps = contract.coverageNotes.filter((note) => ["aplicavel", "nao-confirmado"].includes(note.status));
  const coverageByStatus = contract.coverageNotes.reduce((acc, note) => {
    const status = note.status || "nao-informado";
    acc[status] = acc[status] || [];
    acc[status].push(note);
    return acc;
  }, {});
  const warnings = [];
  const enrichedTests = tests.map((test) => {
    const endpointRefs = endpointRefsForTest(test, declaredRules, ruleEndpointMap, endpoints).map((ref) => ({
      endpoint: endpointId(ref.endpoint),
      method: ref.endpoint.method,
      path: ref.endpoint.path,
      confidence: ref.confidence,
      evidence: ref.evidence,
      ...(ref.ruleId ? { ruleId: ref.ruleId } : {}),
    }));
    return {
      ...test,
      primaryCatalogTag: normalizeCatalogTag(test.catalogTags[0] || ""),
      catalogTagsNormalized: unique(test.catalogTags.map(normalizeCatalogTag)),
      endpointRefs,
    };
  });

  if (!contractFound) {
    warnings.push({
      code: "missing-jsdoc-contract",
      severity: "high",
      message: "Nenhum JSDoc de contrato com @contrato ou @api foi encontrado nos specs.",
    });
  }
  if (enrichedTests.length === 0) {
    warnings.push({
      code: "no-tests",
      severity: "high",
      message: "Nenhum teste it() foi detectado nos specs da API.",
    });
  }
  for (const test of enrichedTests) {
    if (test.catalogTags.length === 0) {
      warnings.push({
        code: "test-without-catalog-tag",
        severity: "medium",
        message: `Teste sem tag CatalogoTags.*: ${test.title}`,
        file: test.file,
        line: test.line,
      });
    }
    if (test.mode === "skip") {
      warnings.push({
        code: "skipped-test",
        severity: "medium",
        message: `Teste pendente com it.skip: ${test.title}`,
        file: test.file,
        line: test.line,
      });
    }
  }
  for (const id of unknownRuleTags) {
    warnings.push({
      code: "unknown-rule-tag",
      severity: "high",
      message: `Existe teste vinculado a @regra:${id}, mas essa regra não foi declarada no JSDoc.`,
    });
  }
  for (const rule of rulesMissing) {
    warnings.push({
      code: "declared-rule-without-test",
      severity: "high",
      message: `Regra declarada sem teste vinculado: ${rule.id}`,
    });
  }
  for (const note of contract.coverageNotes) {
    if (isWeakCoverageReason(note)) {
      warnings.push({
        code: "weak-coverage-reason",
        severity: note.status === "aplicavel" ? "high" : "medium",
        message: `Explique melhor a cobertura ${note.id}. Use uma frase simples dizendo o que falta ou por que não se aplica.`,
      });
    }
    if (
      note.status === "nao-aplicavel" &&
      /valor-limite|payload-excessivo/i.test(note.id || "") &&
      /nao define|não define|sem limite|limite|tamanho|maximo|máximo|minimo|mínimo/i.test(note.reason || "")
    ) {
      warnings.push({
        code: "possibly-wrong-not-applicable",
        severity: "medium",
        message: `Revise ${note.id}: falta de regra ou limite costuma ser "nao-confirmado", não "nao-aplicavel".`,
      });
    }
    if (note.status === "aplicavel") {
      warnings.push({
        code: "applicable-coverage-without-test",
        severity: "high",
        message: `Cobertura aplicável ainda sem teste: ${note.id}${note.reason ? ` - ${note.reason}` : ""}`,
      });
    }
    if (note.status === "nao-confirmado") {
      warnings.push({
        code: "unconfirmed-coverage",
        severity: "medium",
        message: `Cobertura não confirmada: ${note.id}${note.reason ? ` - ${note.reason}` : ""}`,
      });
    }
  }
  for (const test of bugs) {
    warnings.push({
      code: "bug-tag-present",
      severity: "medium",
      message: `Teste marcado com @bug: ${test.title}`,
      file: test.file,
      line: test.line,
    });
  }
  if (contract.endpoints.length > 0 && enrichedTests.length === 0) {
    for (const endpoint of contract.endpoints) {
      warnings.push({
        code: "endpoint-without-test",
        severity: "high",
        message: `Endpoint declarado sem teste associado: ${endpoint}`,
      });
    }
  }

  const catalogAssessment = buildCatalogAssessment({ byTag, byLogicalCaseTag, coverageByStatus });
  const coverageByEndpoint = endpoints.map((endpoint) => {
    const id = endpointId(endpoint);
    const endpointTests = enrichedTests.filter((test) => test.endpointRefs.some((ref) => ref.endpoint === id));
    const endpointRuleIds = new Set(
      contract.rules
        .filter((rule) => ruleEndpointMap.get(rule.id)?.endpoint.id === id)
        .map((rule) => rule.id),
    );
    const endpointRulesCovered = contract.rules.filter((rule) => endpointRuleIds.has(rule.id) && coveredRuleIds.has(rule.id));
    const endpointRulesMissing = contract.rules.filter((rule) => endpointRuleIds.has(rule.id) && !coveredRuleIds.has(rule.id));
    const catalogTagCounts = {};
    for (const test of endpointTests) {
      for (const tag of test.catalogTagsNormalized) {
        catalogTagCounts[tag] = (catalogTagCounts[tag] || 0) + 1;
      }
    }
    const refs = endpointTests.flatMap((test) => test.endpointRefs.filter((ref) => ref.endpoint === id));
    const confidence = refs.some((ref) => ref.confidence === "high")
      ? "high"
      : refs.some((ref) => ref.confidence === "medium")
        ? "medium"
        : refs.length
          ? "low"
          : "low";
    return {
      endpoint: id,
      method: endpoint.method,
      path: endpoint.path,
      confidence,
      evidence: unique(refs.map((ref) => ref.evidence)),
      tests: endpointTests.map((test) => test.id),
      rulesCovered: endpointRulesCovered,
      rulesMissing: endpointRulesMissing,
      catalogTags: Object.keys(catalogTagCounts),
      catalogTagCounts,
      coverageNotes: contract.coverageNotes.filter((note) => !byTag[note.id]),
    };
  });
  const endpointMatrix = coverageByEndpoint.map((item) => ({
    endpoint: item.endpoint,
    scope: "endpoint-level",
    confidence: item.confidence,
    scenarios: Object.fromEntries(catalogAssessment.map((entry) => [entry.tag, item.catalogTags.includes(entry.tag)])),
    note: item.evidence.length
      ? `Associação baseada em ${item.evidence.join(", ")}.`
      : "Nenhum teste associado a este endpoint foi detectado.",
  }));
  const aiNextActions = buildAiNextActions({
    warnings,
    coverageNotes: contract.coverageNotes,
    rulesMissing,
    bugs,
    catalogAssessment,
  });

  return {
    byTag,
    byLogicalCaseTag,
    coverageByStatus,
    catalogAssessment,
    coverageByEndpoint,
    rulesCovered,
    rulesMissing,
    bugs,
    gaps,
    warnings,
    endpointMatrix,
    aiNextActions,
    totals: {
      tests: enrichedTests.length,
      activeTests: enrichedTests.filter((test) => test.mode === "active").length,
      skippedTests: enrichedTests.filter((test) => test.mode === "skip").length,
      endpoints: contract.endpoints.length,
      rules: contract.rules.length,
      rulesCovered: rulesCovered.length,
      gaps: gaps.length,
      bugs: bugs.length,
      warnings: warnings.length,
      logicalCases: enrichedTests.reduce((total, test) => total + (test.logicalCases?.length || 0), 0),
      catalogEvaluated: catalogAssessment.filter((item) => item.status !== "not-evaluated").length,
      catalogNotEvaluated: catalogAssessment.filter((item) => item.status === "not-evaluated").length,
    },
    sourceDir: toPosix(path.relative(projectRoot, sourceDir)),
    api,
    tests: enrichedTests,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(severity) {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warn";
  return "ok";
}

function coverageStatusMeta(status) {
  if (status === "aplicavel") {
    return { label: "Precisa de teste", tone: "danger", title: "Precisa De Teste" };
  }
  if (status === "nao-confirmado") {
    return { label: "Precisa de contexto", tone: "warn", title: "Precisa De Contexto" };
  }
  if (status === "incorporado") {
    return { label: "Incorporado", tone: "ok", title: "Incorporado Em Outro Teste" };
  }
  if (status === "nao-aplicavel") {
    return { label: "Não se aplica", tone: "neutral", title: "Não Se Aplica" };
  }
  return { label: status || "Não informado", tone: "warn", title: "Sem Status Claro" };
}

function severityLabel(severity) {
  if (severity === "high") return "Alta";
  if (severity === "medium") return "Média";
  if (severity === "low") return "Baixa";
  return severity || "Info";
}

function renderBadge(label, tone = "neutral") {
  return `<span class="badge ${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

function warningCodeLabel(code) {
  const labels = {
    "missing-jsdoc-contract": "Contrato JSDoc ausente",
    "no-tests": "Nenhum teste detectado",
    "test-without-catalog-tag": "Teste sem tag de catálogo",
    "skipped-test": "Teste pendente",
    "unknown-rule-tag": "Regra não declarada",
    "declared-rule-without-test": "Regra sem teste",
    "weak-coverage-reason": "Justificativa fraca",
    "possibly-wrong-not-applicable": "Não aplicável suspeito",
    "applicable-coverage-without-test": "Cobertura aplicável sem teste",
    "unconfirmed-coverage": "Cobertura não confirmada",
    "bug-tag-present": "Teste marcado como bug",
    "endpoint-without-test": "Endpoint sem teste",
  };

  return labels[code] || code || "Alerta de qualidade";
}

function renderEmpty(text) {
  return `<p class="empty">${escapeHtml(text)}</p>`;
}

function renderList(items, renderItem, emptyText = "Nenhum item encontrado.") {
  if (!items.length) return renderEmpty(emptyText);
  return `<ul class="clean-list">${items.map((item) => `<li>${renderItem(item)}</li>`).join("")}</ul>`;
}

function renderMetricCard({ label, value, note, tone = "neutral" }) {
  return `<div class="metric ${escapeHtml(tone)}">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    ${note ? `<small>${escapeHtml(note)}</small>` : ""}
  </div>`;
}

function renderTable(headers, rows, emptyText, className = "") {
  if (!rows.length) return renderEmpty(emptyText);
  return `<div class="table-scroll ${escapeHtml(className)}"><table>
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>${rows.join("")}</tbody>
  </table></div>`;
}

function renderChipGroup(items, emptyText) {
  if (!items.length) return `<span class="empty">${escapeHtml(emptyText)}</span>`;
  return `<div class="chips">${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderRuleCards(rules, coveredRules) {
  if (!rules.length) return renderEmpty("Nenhuma regra declarada.");
  const coveredIds = new Set(coveredRules.map((rule) => rule.id));
  return `<div class="rule-list">${rules
    .map((rule) => {
      const covered = coveredIds.has(rule.id);
      return `<article class="rule-card">
        <div class="rule-head">
          <code>${escapeHtml(rule.id)}</code>
          ${covered ? renderBadge("OK", "ok") : renderBadge("Sem teste", "danger")}
        </div>
        <p>${escapeHtml(rule.description || rule.raw || "Sem descrição declarada.")}</p>
      </article>`;
    })
    .join("")}</div>`;
}

function renderAlertCard(warning) {
  const tone = statusClass(warning.severity);
  const location = warning.file ? `${warning.file}:${warning.line}` : "";
  return `<article class="alert-card ${tone}">
    <div class="alert-head">
      ${renderBadge(severityLabel(warning.severity), tone)}
      <span class="warning-title">${escapeHtml(warningCodeLabel(warning.code))}</span>
    </div>
    <p><strong>Problema:</strong> ${escapeHtml(warning.message)}</p>
    ${location ? `<p><strong>Local:</strong> <code>${escapeHtml(location)}</code></p>` : ""}
  </article>`;
}

function renderActionList(actions) {
  return renderList(
    actions,
    (action) => `<strong>${escapeHtml(action.title)}</strong><span>${escapeHtml(action.detail)}</span>`,
    "Nenhuma ação prioritária detectada.",
  );
}

function buildPresentation(report, tagColumns) {
  const { coverage } = report;
  const highWarnings = coverage.warnings.filter((warning) => warning.severity === "high");
  const mediumWarnings = coverage.warnings.filter((warning) => warning.severity === "medium");
  const applicableGaps = report.contract.coverageNotes.filter((note) => note.status === "aplicavel");
  const unconfirmedGaps = report.contract.coverageNotes.filter((note) => note.status === "nao-confirmado");
  const notApplicableNotes = report.contract.coverageNotes.filter((note) => note.status === "nao-aplicavel");
  const incorporatedNotes = report.contract.coverageNotes.filter((note) => note.status === "incorporado");
  const skippedTests = report.tests.filter((test) => test.mode === "skip");
  const bugTests = report.tests.filter((test) => test.hasBug);
  const hasCritical = highWarnings.length > 0 || coverage.rulesMissing.length > 0 || applicableGaps.length > 0;
  const hasAttention = hasCritical || mediumWarnings.length > 0 || skippedTests.length > 0 || bugTests.length > 0;
  const status = hasCritical
    ? { label: "Crítico", tone: "danger", detail: "Há riscos altos, lacunas aplicáveis ou regras sem teste." }
    : hasAttention
      ? { label: "Atenção", tone: "warn", detail: "Há pontos de acompanhamento antes de considerar a suíte madura." }
      : { label: "OK", tone: "ok", detail: "Nenhuma prioridade estática foi detectada neste relatório." };

  const fallbackActions = [
    ...highWarnings.map((warning) => ({
      title: "Corrigir alerta alto",
      detail: warning.file ? `${warning.message} (${warning.file}:${warning.line})` : warning.message,
    })),
    ...coverage.rulesMissing.map((rule) => ({
      title: "Cobrir regra declarada",
      detail: `${rule.id}${rule.description ? ` - ${rule.description}` : ""}`,
    })),
    ...applicableGaps.map((note) => ({
      title: "Resolver lacuna aplicável",
      detail: `${note.id}${note.reason ? ` - ${note.reason}` : ""}`,
    })),
    ...unconfirmedGaps.map((note) => ({
      title: "Dar contexto para a IA",
      detail: `${note.id}${note.reason ? ` - ${note.reason}` : ""}`,
    })),
    ...skippedTests.map((test) => ({
      title: "Revisar teste pendente",
      detail: `${test.title} (${test.file}:${test.line})`,
    })),
    ...bugTests.map((test) => ({
      title: "Acompanhar teste marcado como bug",
      detail: `${test.title} (${test.file}:${test.line})`,
    })),
  ];
  const actions = report.aiNextActions?.length
    ? report.aiNextActions.map((action) => ({
        title: action.type || "Próxima ação",
        detail: action.message || action.evidence || "",
      }))
    : fallbackActions;

  const metrics = [
    {
      label: "Testes",
      value: coverage.totals.tests,
      note: `${coverage.totals.activeTests} ativos, ${coverage.totals.skippedTests} pendentes`,
      tone: coverage.totals.skippedTests ? "warn" : "ok",
    },
    {
      label: "Regras cobertas",
      value: `${coverage.totals.rulesCovered}/${coverage.totals.rules}`,
      note: coverage.rulesMissing.length ? `${coverage.rulesMissing.length} sem teste` : "sem pendências declaradas",
      tone: coverage.rulesMissing.length ? "danger" : "ok",
    },
    {
      label: "Lacunas",
      value: coverage.totals.gaps,
      note: `${applicableGaps.length} aplicáveis, ${unconfirmedGaps.length} não confirmadas`,
      tone: applicableGaps.length ? "danger" : unconfirmedGaps.length ? "warn" : "ok",
    },
    {
      label: "Coberturas avaliadas",
      value: report.contract.coverageNotes.length,
      note: `${incorporatedNotes.length} incorporadas, ${notApplicableNotes.length} não se aplicam`,
      tone: unconfirmedGaps.length || applicableGaps.length ? "warn" : "ok",
    },
    {
      label: "Bugs",
      value: coverage.totals.bugs,
      note: bugTests.length ? "exigem evidência de execução" : "nenhuma tag @bug",
      tone: bugTests.length ? "warn" : "ok",
    },
    {
      label: "Alertas",
      value: coverage.totals.warnings,
      note: `${highWarnings.length} altos, ${mediumWarnings.length} médios`,
      tone: highWarnings.length ? "danger" : mediumWarnings.length ? "warn" : "ok",
    },
  ];

  return {
    actions,
    applicableGaps,
    bugTests,
    highWarnings,
    incorporatedNotes,
    metrics,
    notApplicableNotes,
    skippedTests,
    status,
    tagColumns,
    unconfirmedGaps,
  };
}

function renderHtml(report) {
  const totals = report.coverage.totals;
  const tagColumns = [...new Set(report.coverage.endpointMatrix.flatMap((row) => Object.keys(row.scenarios)))];
  const view = buildPresentation(report, tagColumns);
  const endpointRows = report.coverage.endpointMatrix.map((row) => {
    const detected = tagColumns.filter((tag) => row.scenarios[tag]);
    const missing = tagColumns.filter((tag) => !row.scenarios[tag]);
    return `<tr>
    <td class="endpoint-cell"><code>${escapeHtml(row.endpoint)}</code></td>
    <td>${renderChipGroup(detected, "Nenhuma cobertura detectada.")}<span class="cell-note">${escapeHtml(row.note)}</span></td>
    <td>${renderChipGroup(missing, "Sem lacunas detectadas pela matriz.")}</td>
  </tr>`;
  });
  const testRows = report.tests.map((test) => `<tr>
    <td>${escapeHtml(test.title)}</td>
    <td><code>${escapeHtml(test.file)}:${escapeHtml(test.line)}</code></td>
    <td>${renderChipGroup((test.endpointRefs || []).map((ref) => `${ref.endpoint} (${ref.confidence})`), "sem endpoint")}</td>
    <td><div class="chips">${test.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("") || '<span class="empty">sem tags</span>'}</div></td>
    <td>${test.mode === "skip" ? renderBadge("Skip", "warn") : test.mode === "only" ? renderBadge("Only", "danger") : renderBadge("Ativo", "ok")}</td>
  </tr>`);
  const coveragePriority = { aplicavel: 0, "nao-confirmado": 1, incorporado: 2, "nao-aplicavel": 3 };
  const coverageRows = [...report.contract.coverageNotes]
    .sort((a, b) => (coveragePriority[a.status] ?? 9) - (coveragePriority[b.status] ?? 9))
    .map((note) => {
      const meta = coverageStatusMeta(note.status);
      return `<tr>
    <td><code>${escapeHtml(note.id)}</code></td>
    <td>${renderBadge(meta.label, meta.tone)}</td>
    <td>${escapeHtml(note.reason || note.raw || "")}</td>
  </tr>`;
    });
  const fieldRows = report.contract.fields.map((field) => `<tr>
    <td><code>${escapeHtml(field.name)}</code></td>
    <td>${escapeHtml(field.details || field.raw || "")}</td>
  </tr>`);
  const alertRows = report.coverage.warnings.map((warning) => `<tr>
    <td>${renderBadge(severityLabel(warning.severity), statusClass(warning.severity))}</td>
    <td><strong>${escapeHtml(warningCodeLabel(warning.code))}</strong><span class="cell-note">${escapeHtml(warning.message)}</span></td>
    <td>${warning.file ? `<code>${escapeHtml(warning.file)}:${escapeHtml(warning.line)}</code>` : '<span class="empty">sem local específico</span>'}</td>
  </tr>`);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório QA API - ${escapeHtml(report.api)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f4f6f8;
      --panel: #ffffff;
      --panel-soft: #f9fafb;
      --text: #1d2433;
      --muted: #667085;
      --line: #d9dee8;
      --accent: #235789;
      --ok: #0f7b4f;
      --ok-bg: #e8f5ef;
      --warn: #9a5b00;
      --warn-bg: #fff4df;
      --danger: #bd2c2c;
      --danger-bg: #fdecec;
      --chip: #eef2ff;
      --shadow: 0 12px 32px rgba(29, 36, 51, .08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0e1117;
        --panel: #151a23;
        --panel-soft: #111722;
        --text: #eef2f7;
        --muted: #a4acb9;
        --line: #2b3341;
        --accent: #79a7ff;
        --ok: #54d39b;
        --ok-bg: #133428;
        --warn: #f0b35e;
        --warn-bg: #382815;
        --danger: #ff7d7d;
        --danger-bg: #3a1f24;
        --chip: #1f2940;
        --shadow: 0 12px 32px rgba(0, 0, 0, .22);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main { max-width: 1440px; margin: 0 auto; padding: 32px 20px 48px; }
    header { margin-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: 30px; letter-spacing: 0; }
    h2 { margin: 0 0 12px; font-size: 18px; letter-spacing: 0; }
    p { margin: 0 0 10px; }
    .muted { color: var(--muted); }
    .subtitle { max-width: 860px; font-size: 15px; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(380px, .8fr); gap: 16px; align-items: start; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 18px 0; }
    .metric, section, .executive {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .metric { padding: 14px; border-left: 4px solid var(--line); }
    .metric span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .metric strong { display: block; font-size: 25px; margin-top: 4px; }
    .metric small { display: block; color: var(--muted); margin-top: 4px; }
    .metric.ok { border-left-color: var(--ok); }
    .metric.warn { border-left-color: var(--warn); }
    .metric.danger { border-left-color: var(--danger); }
    section { padding: 18px; margin-top: 16px; overflow: hidden; }
    .executive { padding: 18px; margin: 18px 0; display: grid; grid-template-columns: minmax(180px, .45fr) minmax(0, 1fr); gap: 18px; align-items: start; }
    .status-box { border-left: 5px solid var(--line); padding: 2px 0 2px 14px; }
    .status-box strong { display: block; font-size: 28px; margin: 3px 0; }
    .status-box.ok { border-left-color: var(--ok); }
    .status-box.warn { border-left-color: var(--warn); }
    .status-box.danger { border-left-color: var(--danger); }
    .priority-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .alert-card { border: 1px solid var(--line); border-left: 4px solid var(--line); border-radius: 8px; padding: 12px; background: var(--panel-soft); }
    .alert-card.danger { border-left-color: var(--danger); }
    .alert-card.warn { border-left-color: var(--warn); }
    .alert-card.ok { border-left-color: var(--ok); }
    .alert-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
    .warning-title { font-weight: 700; }
    .table-scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
    table { width: 100%; min-width: 760px; border-collapse: collapse; table-layout: fixed; }
    th, td { border-bottom: 1px solid var(--line); padding: 14px 14px; text-align: left; vertical-align: top; }
    tbody tr:nth-child(even) { background: var(--panel-soft); }
    tbody tr:last-child td { border-bottom: 0; }
    th { position: sticky; top: 0; z-index: 1; background: var(--panel); color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    code, .chip, .badge { background: var(--chip); border: 1px solid var(--line); border-radius: 999px; padding: 2px 7px; font-size: 12px; }
    code { border-radius: 6px; }
    .badge { display: inline-flex; align-items: center; font-weight: 700; white-space: nowrap; }
    .badge.ok { color: var(--ok); background: var(--ok-bg); border-color: var(--ok); }
    .badge.warn { color: var(--warn); background: var(--warn-bg); border-color: var(--warn); }
    .badge.danger { color: var(--danger); background: var(--danger-bg); border-color: var(--danger); }
    .badge.neutral { color: var(--muted); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
    .chip { line-height: 1.35; max-width: 100%; overflow-wrap: anywhere; }
    .cell-note { display: block; color: var(--muted); margin-top: 5px; }
    .endpoint-cell { width: 180px; }
    .endpoint-cell code { display: inline-block; font-size: 13px; line-height: 1.45; white-space: normal; }
    .matrix-table table { min-width: 980px; }
    .matrix-table th:nth-child(1), .matrix-table td:nth-child(1) { width: 190px; }
    .matrix-table th:nth-child(2), .matrix-table td:nth-child(2) { width: 560px; }
    .matrix-table th:nth-child(3), .matrix-table td:nth-child(3) { width: 230px; }
    .matrix-table .cell-note { max-width: 620px; margin-top: 10px; line-height: 1.45; }
    .tests-table table { min-width: 1080px; }
    .tests-table th:nth-child(1), .tests-table td:nth-child(1) { width: 320px; }
    .tests-table th:nth-child(2), .tests-table td:nth-child(2) { width: 390px; }
    .tests-table th:nth-child(3), .tests-table td:nth-child(3) { width: 270px; }
    .tests-table th:nth-child(4), .tests-table td:nth-child(4) { width: 100px; }
    .tests-table td:first-child { font-size: 15px; line-height: 1.55; }
    .tests-table code { white-space: normal; overflow-wrap: anywhere; }
    .rule-list { display: grid; gap: 10px; }
    .rule-card { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: var(--panel-soft); }
    .rule-head { display: flex; gap: 8px; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .rule-head code { max-width: calc(100% - 72px); white-space: normal; overflow-wrap: anywhere; line-height: 1.45; }
    .rule-card p { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
    .empty { color: var(--muted); }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .danger { color: var(--danger); }
    .clean-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
    .clean-list li { border: 1px solid var(--line); border-radius: 8px; padding: 10px; background: var(--panel-soft); }
    .clean-list strong, .clean-list span { display: block; }
    .clean-list span { color: var(--muted); margin-top: 3px; }
    @media (max-width: 980px) {
      .layout, .executive { grid-template-columns: 1fr; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .priority-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 620px) {
      main { padding: 22px 12px 36px; }
      h1 { font-size: 24px; }
      .metrics { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Relatório QA API: ${escapeHtml(report.api)}</h1>
      <p class="subtitle">${escapeHtml(report.contract.summary || "Sem resumo de contrato no JSDoc.")}</p>
      <div class="meta">
        ${renderBadge(`Gerado em ${report.generatedAt}`, "neutral")}
        ${renderBadge(`Origem: ${report.sourceDir}`, "neutral")}
        ${renderBadge(`${totals.endpoints} endpoints declarados`, "neutral")}
      </div>
    </header>

    <div class="executive">
      <div class="status-box ${view.status.tone}">
        <span class="muted">Status geral</span>
        <strong>${escapeHtml(view.status.label)}</strong>
        <p>${escapeHtml(view.status.detail)}</p>
      </div>
      <div>
        <h2>Atenção Prioritária</h2>
        ${view.highWarnings.length ? `<div class="priority-grid">${view.highWarnings.map(renderAlertCard).join("")}</div>` : renderEmpty("Nenhum alerta alto detectado.")}
      </div>
    </div>

    <div class="metrics">
      ${view.metrics.map(renderMetricCard).join("")}
    </div>

    <section>
      <h2>Próximas Ações Sugeridas</h2>
      ${renderActionList(view.actions)}
    </section>

    <div class="layout">
      <div>
        <section>
          <h2>Matriz Endpoint x Cenário</h2>
          ${
            report.coverage.endpointMatrix.length && tagColumns.length
              ? renderTable(["Endpoint", "Cobertura detectada", "Não detectado"], endpointRows, "Matriz indisponível.", "matrix-table")
              : renderEmpty("Matriz indisponível: declare @api e tags nos testes para habilitar esta visão.")
          }
        </section>

        <section>
          <h2>Testes Por Spec</h2>
          ${renderTable(["Teste", "Arquivo", "Endpoint provável", "Tags", "Status"], testRows, "Nenhum teste detectado.", "tests-table")}
        </section>

        <section>
          <h2>Alertas De Qualidade</h2>
          ${renderTable(["Severidade", "Problema", "Local"], alertRows, "Nenhum alerta encontrado.")}
        </section>
      </div>

      <aside>
        <section>
          <h2>Endpoints Declarados</h2>
          ${renderList(report.contract.endpoints, (endpoint) => `<code>${escapeHtml(endpoint)}</code>`, "Nenhum @api foi declarado.")}
        </section>

        <section>
          <h2>Regras @regra</h2>
          ${renderRuleCards(report.contract.rules, report.coverage.rulesCovered)}
        </section>

        <section>
          <h2>Coberturas @cobertura</h2>
          ${renderTable(["Item", "Status", "Explicação simples"], coverageRows, "Nenhuma cobertura declarada.")}
        </section>

        <section>
          <h2>Campos @campo</h2>
          ${renderTable(["Campo", "Contrato"], fieldRows, "Nenhum campo declarado.")}
        </section>
      </aside>
    </div>
  </main>
</body>
</html>`;
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function openFile(filePath) {
  const opener =
    process.platform === "win32"
      ? { command: "cmd", args: ["/c", "start", "", filePath] }
      : process.platform === "darwin"
        ? { command: "open", args: [filePath] }
        : { command: "xdg-open", args: [filePath] };
  await new Promise((resolve) => {
    execFile(opener.command, opener.args, { windowsHide: true }, () => resolve());
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const projectRoot = process.cwd();
  const api = args.api ?? (args.dir ? path.basename(path.resolve(projectRoot, args.dir)) : "");
  if (!api) {
    throw new Error("Informe --api <nome> ou --dir <pasta>.");
  }

  const sourceDir = args.dir
    ? resolveInside(projectRoot, args.dir)
    : resolveInside(projectRoot, path.join("cypress", "e2e", "apis", api));
  if (!(await existsAsDirectory(sourceDir))) {
    throw new Error(`Pasta de specs não encontrada: ${sourceDir}`);
  }

  const outputDir = args.out
    ? resolveInside(projectRoot, args.out)
    : resolveInside(projectRoot, path.join(".agents", "state", "qa-api", "reports", api));
  await fs.mkdir(outputDir, { recursive: true });

  const specFiles = await collectSpecFiles(sourceDir);
  const specs = await Promise.all(
    specFiles.map(async (file) => ({ file, content: await fs.readFile(file, "utf8") })),
  );
  const { contract, sourceFile, found: contractFound } = extractContract(specs);
  if (!contract.id) contract.id = api;
  const tests = specs
    .flatMap((spec) => extractTests(spec.content, spec.file, projectRoot))
    .map((test, index) => ({ id: `T${String(index + 1).padStart(3, "0")}`, ...test }));
  const coverage = buildCoverage({ api, contract, tests, sourceDir, projectRoot, contractFound });
  const { tests: reportTests, ...coverageReport } = coverage;
  const htmlPath = path.join(outputDir, "coverage.html");
  const jsonPath = path.join(outputDir, "coverage.json");
  const report = {
    schemaVersion: "1.0.0",
    api,
    generatedAt: new Date().toISOString(),
    sourceDir: toPosix(path.relative(projectRoot, sourceDir)),
    contract: {
      ...contract,
      sourceFile: sourceFile ? toPosix(path.relative(projectRoot, sourceFile)) : "",
    },
    tests: reportTests,
    coverage: coverageReport,
    aiNextActions: coverage.aiNextActions,
    outputs: {
      html: toPosix(path.relative(projectRoot, htmlPath)),
      json: toPosix(path.relative(projectRoot, jsonPath)),
    },
    tool: {
      name: "qa-report",
      version: TOOL_VERSION,
      file: toPosix(path.relative(projectRoot, __filename)),
    },
  };

  await writeJson(jsonPath, report);
  await fs.writeFile(htmlPath, renderHtml(report), "utf8");

  console.log("Relatório QA API gerado.");
  console.log(`HTML: ${report.outputs.html}`);
  console.log(`JSON: ${report.outputs.json}`);
  if (coverageReport.warnings.length) {
    console.log(`Alertas: ${coverageReport.warnings.length}`);
  }
  if (args.open) {
    await openFile(htmlPath);
  }
}

main().catch((error) => {
  console.error(`Erro ao gerar relatório QA API: ${error.message}`);
  process.exitCode = 1;
});
