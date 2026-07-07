"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferMainRequest = inferMainRequest;
exports.buildReportModel = buildReportModel;
const curlGenerator_1 = require("../collector/curlGenerator");
const sensitiveMask_1 = require("../collector/sensitiveMask");
const format_1 = require("../utils/format");
const diagnoseFailure_1 = require("./diagnostics/diagnoseFailure");
const parseAssertionError_1 = require("./diagnostics/parseAssertionError");
const buildPayloadDiff_1 = require("./buildPayloadDiff");
const evidence_1 = require("./evidence");
const buildBddScenario_1 = require("./buildBddScenario");
const buildFacts_1 = require("./provenance/buildFacts");
const resolveContracts_1 = require("./provenance/resolveContracts");
// Mascara mensagens e textos do contrato antes de persistir (mask-before-persistence).
function sanitizeContract(contract, maskConfig) {
    const maskAttributes = (attributes) => {
        const out = {};
        for (const [key, value] of Object.entries(attributes)) {
            out[key] = typeof value === "string" ? (0, sensitiveMask_1.maskSensitiveText)(value, maskConfig) : value;
        }
        return out;
    };
    return {
        ...contract,
        resumo: contract.resumo ? (0, sensitiveMask_1.maskSensitiveText)(contract.resumo, maskConfig) : contract.resumo,
        fields: contract.fields.map((field) => ({
            ...field,
            attributes: maskAttributes(field.attributes),
            raw: (0, sensitiveMask_1.maskSensitiveText)(field.raw, maskConfig),
        })),
        rules: contract.rules.map((rule) => ({
            ...rule,
            message: rule.message ? (0, sensitiveMask_1.maskSensitiveText)(rule.message, maskConfig) : rule.message,
            attributes: maskAttributes(rule.attributes),
            raw: (0, sensitiveMask_1.maskSensitiveText)(rule.raw, maskConfig),
        })),
        permissao: contract.permissao ? maskAttributes(contract.permissao) : contract.permissao,
    };
}
const VERSION = "0.1.0";
function numeric(value) {
    if (typeof value === "number" && Number.isFinite(value))
        return value;
    if (typeof value === "string" && /^\d{3}$/.test(value.trim()))
        return Number(value);
    return undefined;
}
function pathOf(request) {
    const raw = request.originalUrl || request.url || "";
    try {
        const parsed = new URL(raw, "http://faillens.local");
        return parsed.pathname + parsed.search;
    }
    catch (_) {
        return raw;
    }
}
const STATUS_REASON = {
    200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
    301: "Moved Permanently", 302: "Found", 304: "Not Modified",
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    405: "Method Not Allowed", 409: "Conflict", 410: "Gone",
    422: "Unprocessable Entity", 429: "Too Many Requests",
    500: "Internal Server Error", 502: "Bad Gateway",
    503: "Service Unavailable", 504: "Gateway Timeout",
};
function statusReason(code) {
    if (code == null)
        return "sem resposta";
    return STATUS_REASON[code] ? `${code} ${STATUS_REASON[code]}` : String(code);
}
function singleLine(value) {
    return String(value ?? "").replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").trim();
}
function isSafeJsonPath(value) {
    return value.split(".").every((part) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(part));
}
// "Chamada validada pelo teste": o sinal determin\u00edstico mais forte \u00e9 o request
// cujo status recebido \u00e9 igual ao 'actual' afirmado pela asser\u00e7\u00e3o. Depois disso,
// preferimos m\u00e9todos de muta\u00e7\u00e3o e a ordem. Sem palavras de t\u00edtulo nem nomes de
// endpoint \u2014 funciona em qualquer API e qualquer idioma.
function inferMainRequest(test, ruleRefs = []) {
    if (!test.requests.length)
        return undefined;
    const actual = numeric(test.error?.actual);
    const operations = new Set(ruleRefs
        .filter((ref) => ref.resolved && typeof ref.rule?.attributes.operation === "string")
        .map((ref) => String(ref.rule?.attributes.operation).toUpperCase()));
    const contractOperation = operations.size === 1 ? Array.from(operations)[0] : undefined;
    let winner = test.requests[0];
    let winnerScore = -Infinity;
    test.requests.forEach((request, index) => {
        let score = 0;
        if (contractOperation && request.method === contractOperation)
            score += 100 + index * 0.02;
        if (actual !== undefined && request.receivedStatus === actual)
            score += 50;
        if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method))
            score += 5;
        score -= index * 0.01; // empate: a a\u00e7\u00e3o costuma vir antes da verifica\u00e7\u00e3o
        if (score > winnerScore) {
            winner = request;
            winnerScore = score;
        }
    });
    return winner;
}
function maskError(error, maskConfig) {
    if (!error)
        return undefined;
    const parsed = (0, parseAssertionError_1.parseAssertionError)(error, maskConfig);
    return {
        ...parsed,
        message: (0, sensitiveMask_1.maskSensitiveText)(error.message, maskConfig),
        stack: error.stack ? (0, sensitiveMask_1.maskSensitiveText)(error.stack, maskConfig) : undefined,
        expected: (0, sensitiveMask_1.maskSensitiveData)(parsed.expected, maskConfig),
        actual: (0, sensitiveMask_1.maskSensitiveData)(parsed.actual, maskConfig),
    };
}
const TOKEN_KEY = /^(access[_-]?token|id[_-]?token|refresh[_-]?token|token|jwt)$/i;
// Nome shell-safe derivado da CHAVE real do campo: camelCase -> SNAKE_CASE.
function shellNameFromKey(key) {
    const snake = key
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^A-Za-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();
    return snake || "VALUE";
}
function collectScalars(value) {
    const out = [];
    const visited = new Set();
    const walk = (node, path) => {
        if (!node || typeof node !== "object" || visited.has(node))
            return;
        visited.add(node);
        for (const [key, child] of Object.entries(node)) {
            const nextPath = [...path, key];
            if (typeof child === "string" || typeof child === "number") {
                const text = String(child);
                if (text && text !== "***" && !/^<.*>$/.test(text))
                    out.push({ path: nextPath.join("."), key, value: text });
            }
            else {
                walk(child, nextPath);
            }
        }
    };
    walk(value, []);
    return out;
}
// Localiza um campo de token na resposta mesmo que o VALOR esteja mascarado:
// a captura é feita por caminho (jq), então só precisamos da chave/caminho.
function findTokenField(value) {
    let result;
    const visited = new Set();
    const walk = (node, path) => {
        if (result || !node || typeof node !== "object" || visited.has(node))
            return;
        visited.add(node);
        for (const [key, child] of Object.entries(node)) {
            const nextPath = [...path, key];
            if ((typeof child === "string" || typeof child === "number") && TOKEN_KEY.test(key)) {
                result = { path: nextPath.join(".") };
                return;
            }
            walk(child, nextPath);
        }
    };
    walk(value, []);
    return result;
}
function usesBearer(request) {
    return Object.entries(request.requestHeaders || {}).some(([key, value]) => /authorization/i.test(key) && /bearer/i.test(String(value)));
}
function requestText(request) {
    let body = "";
    try {
        body = JSON.stringify(request.requestBody ?? null);
    }
    catch {
        body = String(request.requestBody ?? "");
    }
    return { url: request.url || "", body };
}
function appearsIn(text, value) {
    const encoded = encodeURIComponent(value);
    return text.url.includes(value) || text.url.includes(encoded) || text.body.includes(value);
}
// Detecção 100% determinística: um valor da resposta vira variável APENAS se
// reaparecer literalmente em um request posterior (encadeamento real). Tokens
// são o único caso especial — costumam vir mascarados, então casamos pela
// chave (token/jwt/...) quando algum request seguinte usa Authorization: Bearer.
function computeChain(requests) {
    const used = requests.map(() => []);
    const generated = requests.map(() => []);
    const takenNames = new Set();
    const requestTexts = requests.map(requestText);
    const bearerUsage = requests.map(usesBearer);
    const requestOffsets = [];
    const requestChunks = requestTexts.map((text) => `${text.url}\n${text.body}\u0000`);
    let textLength = 0;
    for (const chunk of requestChunks) {
        requestOffsets.push(textLength);
        textLength += chunk.length;
    }
    const allRequestText = requestChunks.join("");
    const bearerAfter = requests.map(() => false);
    let laterBearer = false;
    for (let index = requests.length - 1; index >= 0; index -= 1) {
        bearerAfter[index] = laterBearer;
        laterBearer ||= bearerUsage[index];
    }
    const uniqueName = (base) => {
        let name = base || "VALUE";
        let suffix = 2;
        while (takenNames.has(name))
            name = `${base}_${suffix++}`;
        takenNames.add(name);
        return name;
    };
    const availableValues = new Set();
    const variableUses = new Map();
    let tokenAvailable = false;
    const requestIndexAt = (position) => {
        let low = 0;
        let high = requestOffsets.length - 1;
        while (low <= high) {
            const middle = (low + high) >>> 1;
            if (requestOffsets[middle] <= position)
                low = middle + 1;
            else
                high = middle - 1;
        }
        return Math.max(0, high);
    };
    const findUses = (value, sourceIndex) => {
        const indexes = new Set();
        const futureOffset = sourceIndex + 1 < requestOffsets.length
            ? requestOffsets[sourceIndex + 1]
            : allRequestText.length;
        const encoded = encodeURIComponent(value);
        for (const needle of encoded === value ? [value] : [value, encoded]) {
            let position = allRequestText.indexOf(needle, futureOffset);
            while (position >= 0) {
                const requestIndex = requestIndexAt(position);
                if (requestIndex > sourceIndex && appearsIn(requestTexts[requestIndex], value))
                    indexes.add(requestIndex);
                position = allRequestText.indexOf(needle, requestOffsets[requestIndex] + requestChunks[requestIndex].length);
            }
        }
        return Array.from(indexes).sort((left, right) => left - right);
    };
    requests.forEach((request, index) => {
        const scalars = collectScalars(request.responseBody);
        const newVars = [];
        const tokenField = findTokenField(request.responseBody);
        if (tokenField && isSafeJsonPath(tokenField.path) && bearerAfter[index] && !tokenAvailable) {
            const name = uniqueName("TOKEN");
            const variable = { name, ref: `$${name}`, path: tokenField.path, value: undefined, kind: "token" };
            variableUses.set(variable, bearerUsage.flatMap((uses, requestIndex) => uses && requestIndex > index ? [requestIndex] : []));
            newVars.push(variable);
        }
        scalars.forEach((scalar) => {
            if (scalar.value.length < 3)
                return;
            if (!isSafeJsonPath(scalar.path))
                return;
            if (availableValues.has(scalar.value) || newVars.some((item) => item.value === scalar.value))
                return;
            const useIndexes = findUses(scalar.value, index);
            if (!useIndexes.length)
                return;
            const name = uniqueName(shellNameFromKey(scalar.key));
            const variable = { name, ref: `$${name}`, path: scalar.path, value: scalar.value, kind: "value" };
            variableUses.set(variable, useIndexes);
            newVars.push(variable);
        });
        newVars.forEach((variable) => {
            generated[index].push(variable);
            for (const requestIndex of variableUses.get(variable) || [])
                used[requestIndex].push(variable);
            if (variable.kind === "token")
                tokenAvailable = true;
            else if (variable.value !== undefined)
                availableValues.add(variable.value);
        });
    });
    return { used, generated };
}
function applyVariable(command, variable) {
    let result = command;
    if (variable.kind === "token") {
        result = result.replace(/Bearer\s+(?:<TOKEN>|\*\*\*|[^\s'"]+)/gi, `Bearer ${variable.ref}`);
    }
    if (variable.value !== undefined) {
        const encoded = encodeURIComponent(variable.value);
        result = result
            .split(`/${variable.value}`).join(`/${variable.ref}`)
            .split(`/${encoded}`).join(`/${variable.ref}`)
            .split(`"${variable.value}"`).join(`"${variable.ref}"`);
    }
    return result.replace(/'([^'\n]*\$[A-Z_][A-Z0-9_]*[^'\n]*)'/g, '"$1"');
}
function annotateRequests(test, main, chain) {
    const mainIndex = main ? test.requests.findIndex((request) => request.id === main.id) : -1;
    const { used, generated } = chain;
    test.requests.forEach((request, index) => {
        if (request.id === main?.id)
            request.phase = "validacao";
        else if (mainIndex >= 0 && index < mainIndex)
            request.phase = "preparacao";
        else if (index > mainIndex && request.method === "GET")
            request.phase = "verificacao";
        else if (index > mainIndex && request.method === "DELETE")
            request.phase = "limpeza";
        else
            request.phase = "chamada";
        request.usedVariables = used[index].map((item) => item.ref);
        request.generatedVariables = generated[index].map((item) => item.ref);
    });
}
function buildReproductionScript(test, chain) {
    const requests = test.requests;
    if (!requests.length)
        return "";
    const { used, generated } = chain;
    const expectation = test.statusExpectation;
    const lines = [
        "# Reprodução determinística — gerada pelo FailLens",
        "# Requer curl; extração de variáveis usa jq.",
    ];
    if (test.title)
        lines.push(`# Teste: ${singleLine(test.title)}`);
    if (expectation && expectation.actual !== undefined) {
        lines.push(`# Veredito: ${test.state === "failed" ? "FALHOU" : "OK"}` +
            ` · status esperado ${singleLine(expectation.label)} · recebido ${expectation.actual}`);
    }
    requests.forEach((request, index) => {
        let command = request.curl;
        used[index].forEach((variable) => { command = applyVariable(command, variable); });
        lines.push("");
        lines.push(`# [${index + 1}] ${singleLine(request.method)} ${singleLine(pathOf(request))}` +
            `  →  ${statusReason(request.receivedStatus)}  ·  ${Math.round(request.durationMs || 0)} ms`);
        if (request.id === test.mainRequestId) {
            let mark = "#     >> chamada validada pelo teste";
            if (expectation && expectation.actual !== undefined) {
                mark += ` (esperado ${singleLine(expectation.label)}, recebido ${expectation.actual})`;
            }
            lines.push(mark);
        }
        used[index].forEach((variable) => { lines.push(`#     usa ${variable.ref}`); });
        const primary = generated[index][0];
        if (primary) {
            lines.push(`#     captura ${primary.ref}  =  campo ".${primary.path}" da resposta`);
            command = command.replace(/^curl\s+/, "curl -s ");
            lines.push(`${primary.name}=$(${command} | jq -r '.${primary.path}')`);
        }
        else {
            lines.push(command);
        }
    });
    return lines.join("\n");
}
function sanitizeRequest(request, maskConfig) {
    const sanitized = {
        ...request,
        url: (0, sensitiveMask_1.maskUrl)(request.url, maskConfig),
        originalUrl: request.originalUrl ? (0, sensitiveMask_1.maskUrl)(request.originalUrl, maskConfig) : undefined,
        requestHeaders: (0, sensitiveMask_1.maskSensitiveData)(request.requestHeaders || {}, maskConfig),
        requestBody: (0, sensitiveMask_1.maskSensitiveData)(request.requestBody, maskConfig),
        responseHeaders: (0, sensitiveMask_1.maskSensitiveData)(request.responseHeaders || {}, maskConfig),
        responseBody: (0, sensitiveMask_1.maskSensitiveData)(request.responseBody, maskConfig),
        redirects: request.redirects?.map((redirect) => ({
            statusCode: redirect.statusCode,
            location: (0, sensitiveMask_1.maskUrl)(redirect.location, maskConfig),
        })),
        error: maskError(request.error, maskConfig),
    };
    sanitized.curl = (0, curlGenerator_1.generateCurl)({
        method: sanitized.method,
        url: sanitized.url,
        headers: sanitized.requestHeaders,
        body: sanitized.requestBody,
    }, maskConfig);
    return sanitized;
}
function prepareAssertions(source, error, maskConfig) {
    if (source.assertions?.length) {
        return source.assertions.map((assertion, index) => ({
            ...assertion,
            id: assertion.id || `assertion-${index + 1}`,
            title: (0, sensitiveMask_1.maskSensitiveText)(assertion.title || "Assertion observada", maskConfig),
            message: assertion.message
                ? (0, sensitiveMask_1.maskSensitiveText)(assertion.message, maskConfig)
                : undefined,
            expected: (0, sensitiveMask_1.maskSensitiveData)(assertion.expected, maskConfig),
            actual: (0, sensitiveMask_1.maskSensitiveData)(assertion.actual, maskConfig),
        }));
    }
    if (!error)
        return [];
    return [{
            id: "assertion-failure",
            title: error.assertionMessage || "Assertion principal",
            state: "failed",
            message: error.message,
            expected: error.expected,
            actual: error.actual,
            file: error.file,
            line: error.line,
            column: error.column,
        }];
}
function resolveStatusExpectation(test, main) {
    let expectation = test.statusExpectation
        ? { source: "asserted", ...test.statusExpectation }
        : undefined;
    if (!expectation) {
        const statusAssertion = test.assertions?.find((assertion) => assertion.target === "status");
        const expected = numeric(statusAssertion?.expected);
        if (expected !== undefined) {
            expectation = { type: "exact", label: String(expected), expected, source: "asserted" };
        }
    }
    if (!expectation) {
        const expected = numeric(test.error?.expected);
        const actual = numeric(test.error?.actual);
        if (expected !== undefined && actual !== undefined) {
            expectation = { type: "exact", label: String(expected), expected, source: "asserted" };
        }
    }
    if (!expectation)
        return undefined;
    const actual = main?.receivedStatus;
    if (actual === undefined)
        return expectation;
    const matched = expectation.type === "exact"
        ? actual === expectation.expected
        : expectation.type === "set"
            ? Boolean(expectation.values?.includes(actual))
            : (expectation.min === undefined || actual >= expectation.min)
                && (expectation.max === undefined || actual <= expectation.max);
    return { ...expectation, actual, matched };
}
function prepareTest(source, maskConfig, ruleIndex, contextContractId, contracts = []) {
    const { persistenceExpectation: _sourceExpectation, persistenceEvidence: _sourceEvidence, bddScenario: _sourceBdd, ...safeSource } = source;
    const test = {
        ...safeSource,
        title: source.titlePath?.length
            ? source.titlePath[source.titlePath.length - 1]
            : source.title,
        error: maskError(source.error, maskConfig),
        requests: source.requests.map((request) => sanitizeRequest(request, maskConfig)),
        evidence: (0, evidence_1.sanitizeEvidence)(source.evidence),
    };
    // Procedência: resolve o vínculo antes de escolher a request principal, pois
    // operation= do contrato é um discriminador confiável entre setup e ação.
    const resolvedRefs = (source.ruleRefs || []).map((ref) => ruleIndex ? (0, resolveContracts_1.resolveRuleRef)(ref, ruleIndex, contextContractId) : { ...ref, resolved: false });
    const main = inferMainRequest(test, resolvedRefs);
    const chain = computeChain(test.requests);
    test.assertions = prepareAssertions(source, test.error, maskConfig);
    test.mainRequestId = main?.id;
    annotateRequests(test, main, chain);
    test.statusExpectation = resolveStatusExpectation(test, main);
    if (resolvedRefs.length) {
        // Persistimos um vínculo enxuto; os detalhes da regra ficam em report.contracts
        // (mascarado). Evita duplicar e re-vazar a mensagem da regra por teste.
        test.ruleRefs = resolvedRefs.map(({ rule: _rule, ...rest }) => rest);
        test.contractId = resolvedRefs.find((ref) => ref.resolved)?.contractId;
    }
    // Sem expectativa asserida, mas com regra contratual de status: a expectativa
    // passa a vir do contrato (fonte rastreável), nunca inventada.
    if (!test.statusExpectation) {
        const rule = resolvedRefs.find((ref) => ref.resolved && ref.rule?.status !== undefined)?.rule;
        if (rule?.status !== undefined) {
            const actual = main?.receivedStatus;
            test.statusExpectation = {
                type: "exact",
                label: String(rule.status),
                expected: rule.status,
                source: "contract",
                ...(actual !== undefined ? { actual, matched: actual === rule.status } : {}),
            };
        }
    }
    const persistence = (0, buildFacts_1.buildPersistenceState)(test, main, resolvedRefs);
    if (persistence) {
        test.persistenceExpectation = persistence.expectation;
        test.persistenceEvidence = persistence.evidence;
    }
    const facts = (0, buildFacts_1.buildFacts)(test, main, resolvedRefs, maskConfig, persistence);
    if (facts.length)
        test.facts = facts;
    test.payloadDiff = (0, buildPayloadDiff_1.buildPayloadDiff)(test.assertions, main?.responseBody, test.state === "failed");
    test.diagnosis = (0, diagnoseFailure_1.diagnoseFailure)({ test, mainRequest: main });
    const bddContractId = test.contractId || contextContractId;
    test.bddScenario = (0, buildBddScenario_1.buildBddScenario)(test, main, resolvedRefs, contracts.find((item) => item.id === bddContractId));
    test.reproductionScript = test.state === "failed" && test.requests.length
        ? buildReproductionScript(test, chain)
        : undefined;
    return test;
}
function buildReportModel(inputSpecs, options = {}) {
    const maskConfig = {
        fields: options.config?.maskFields ?? [],
        patterns: options.config?.maskPatterns ?? [],
    };
    const resolved = (0, resolveContracts_1.resolveContracts)(inputSpecs);
    const contracts = resolved.contracts.map((contract) => sanitizeContract(contract, maskConfig));
    const specs = inputSpecs.map((spec) => {
        const contextContractId = (0, resolveContracts_1.contractIdForSpec)(spec.specPath, resolved.contracts);
        const tests = spec.tests.map((test) => prepareTest(test, maskConfig, resolved.ruleIndex, contextContractId, contracts));
        return {
            specPath: spec.specPath,
            durationMs: spec.durationMs || tests.reduce((sum, test) => sum + test.durationMs, 0),
            tests,
        };
    });
    const tests = specs.flatMap((spec) => spec.tests);
    const passed = tests.filter((test) => test.state === "passed").length;
    const failed = tests.filter((test) => test.state === "failed").length;
    const skipped = tests.filter((test) => test.state === "skipped").length;
    const total = tests.length;
    return {
        generatedAt: options.generatedAt ?? new Date().toISOString(),
        tool: { name: "FailLens", packageName: "faillens", version: VERSION },
        project: {
            name: options.config?.projectName,
            runId: options.config?.runId,
            branch: options.config?.branch,
        },
        theme: options.config?.theme === "light" ? "light" : "dark",
        summary: {
            tests: total,
            passed,
            failed,
            skipped,
            requests: tests.reduce((sum, test) => sum + test.requests.length, 0),
            durationMs: specs.reduce((sum, spec) => sum + spec.durationMs, 0),
            passRate: total ? (0, format_1.round)((passed / total) * 100, 1) : 0,
        },
        specs,
        ...(contracts.length
            ? { contracts }
            : {}),
    };
}
//# sourceMappingURL=buildReportModel.js.map