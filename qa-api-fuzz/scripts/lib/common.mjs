import fs from "node:fs/promises";
import path from "node:path";

export function parseArgs(argv, options = {}) {
  const booleans = new Set(options.booleans || []);
  const arrays = new Set(options.arrays || []);
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Argumento inesperado: ${arg}`);
    }

    const name = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (booleans.has(name)) {
      args[name] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Informe um valor para ${arg}.`);
    }
    if (arrays.has(name)) {
      args[name] = [...(args[name] || []), value];
    } else {
      args[name] = value;
    }
    index += 1;
  }

  return args;
}

export function toPosix(value) {
  return String(value || "").split(path.sep).join("/");
}

export function resolveInside(root, target) {
  const resolved = path.isAbsolute(target) ? path.normalize(target) : path.resolve(root, target);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Caminho fora do projeto nao permitido: ${target}`);
  }
  return resolved;
}

export async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

export async function collectFiles(root, predicate) {
  const output = [];
  if (!(await exists(root))) return output;
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await collectFiles(fullPath, predicate)));
    } else if (entry.isFile() && predicate(fullPath)) {
      output.push(fullPath);
    }
  }
  return output.sort((a, b) => a.localeCompare(b));
}

export function pointerGet(value, pointer) {
  if (!pointer || pointer === "/") return value;
  return pointer
    .split("/")
    .slice(1)
    .reduce((current, part) => {
      if (current === undefined || current === null) return undefined;
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      return current[key];
    }, value);
}

export function fillPathTemplate(template, values) {
  return template.replace(/\{([A-Za-z0-9_-]+)\}/g, (_, key) => encodeURIComponent(String(values[key] ?? "")));
}

export function parseHeaderArgs(values = []) {
  const headers = {};
  for (const value of values) {
    const index = value.indexOf(":");
    if (index === -1) {
      throw new Error(`Header invalido: ${value}. Use "Nome: valor".`);
    }
    const name = value.slice(0, index).trim();
    const headerValue = value.slice(index + 1).trim();
    if (name) headers[name] = headerValue;
  }
  return headers;
}

export function parseEnvHeaders() {
  const headers = {};
  if (process.env.QA_FUZZ_AUTH_HEADER) {
    Object.assign(headers, parseHeaderArgs([process.env.QA_FUZZ_AUTH_HEADER]));
  }
  if (process.env.QA_FUZZ_HEADERS_JSON) {
    Object.assign(headers, JSON.parse(process.env.QA_FUZZ_HEADERS_JSON));
  }
  return headers;
}

export function redactHeaders(headers = {}) {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = /authorization|cookie|token|secret|password/i.test(key) ? "<omitido>" : value;
  }
  return result;
}

export function createPrng(seedInput = "qa-api-fuzz") {
  let seed = 2166136261;
  for (const char of String(seedInput)) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(values, random) {
  return values[Math.floor(random() * values.length) % values.length];
}

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function previewValue(value) {
  if (typeof value === "string" && value.length > 180) {
    return `<string length=${value.length} preview="${value.slice(0, 80)}...">`;
  }
  if (Array.isArray(value)) return value.map(previewValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, previewValue(item)]));
  }
  return value;
}

export async function requestJson({ baseUrl, method, requestPath, headers = {}, body, timeoutMs = 30000 }) {
  const url = new URL(requestPath, baseUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: ["GET", "DELETE", "HEAD"].includes(method) ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let parsedBody = rawText;
  try {
    parsedBody = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsedBody = rawText;
  }

  return {
    url,
    method,
    status: response.status,
    ok: response.ok,
    durationMs: Date.now() - startedAt,
    contentType,
    headers: Object.fromEntries(response.headers.entries()),
    body: parsedBody,
    rawText,
  };
}

export function operationKey(operation) {
  return `${operation.method} ${operation.path}`;
}

export function nowIso() {
  return new Date().toISOString();
}
