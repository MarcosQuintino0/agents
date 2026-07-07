"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestStore = void 0;
const curlGenerator_1 = require("./curlGenerator");
const sensitiveMask_1 = require("./sensitiveMask");
const parseAssertionError_1 = require("../reporter/diagnostics/parseAssertionError");
const format_1 = require("../utils/format");
function normalizeState(value) {
    if (value === "pending" || value === "skipped")
        return "skipped";
    return value === "passed" || value === "failed" ? value : "unknown";
}
function normalizeAssertionState(value) {
    if (["passed", "failed", "pending", "skipped"].includes(String(value))) {
        return value;
    }
    return "unknown";
}
function sameTitle(test, title) {
    const value = Array.isArray(title) ? title.map(String).join(" > ") : String(title ?? "");
    return test.title === value || test.titlePath?.join(" > ") === value;
}
function comparableAssertionTitle(value) {
    return String(value || "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
function assertionMatches(planned, observed) {
    if (planned.line && observed.line && planned.line === observed.line)
        return true;
    const expected = comparableAssertionTitle(planned.title);
    const actual = comparableAssertionTitle(observed.title);
    return Boolean(expected && actual && (actual.includes(expected) || expected.includes(actual)));
}
class RequestStore {
    specs = new Map();
    currentTestId;
    currentSpecPath = "unknown-spec";
    maskConfig;
    constructor(maskFields = [], maskPatterns = []) {
        this.maskConfig = { fields: maskFields, patterns: maskPatterns };
    }
    getSpec(specPath = this.currentSpecPath) {
        const key = specPath || "unknown-spec";
        let spec = this.specs.get(key);
        if (!spec) {
            spec = { specPath: key, durationMs: 0, tests: [] };
            this.specs.set(key, spec);
        }
        return spec;
    }
    findTest(specPath, testId) {
        const spec = this.getSpec(specPath);
        const id = testId ?? this.currentTestId;
        return spec.tests.find((test) => test.id === id);
    }
    setTest(payload) {
        this.currentSpecPath = payload.specPath || this.currentSpecPath;
        const spec = this.getSpec(this.currentSpecPath);
        const titlePath = payload.titlePath?.map(String).filter(Boolean);
        const title = titlePath?.length
            ? titlePath[titlePath.length - 1]
            : String(payload.title || "Teste sem título");
        const id = payload.id || (0, format_1.createId)("test");
        let test = spec.tests.find((item) => item.id === id);
        if (!test) {
            test = { id, title, titlePath, state: "unknown", durationMs: 0, requests: [] };
            spec.tests.push(test);
        }
        this.currentTestId = id;
        return id;
    }
    addRequest(payload) {
        const specPath = payload.specPath || this.currentSpecPath;
        let test = this.findTest(specPath, payload.testId);
        if (!test) {
            const id = this.setTest({ id: payload.testId, title: "Teste em execução", specPath });
            test = this.findTest(specPath, id);
        }
        const id = payload.id || (0, format_1.createId)("req");
        const headers = (0, sensitiveMask_1.maskSensitiveData)((0, format_1.asRecord)(payload.requestHeaders), this.maskConfig);
        const body = (0, sensitiveMask_1.maskSensitiveData)(payload.requestBody ?? null, this.maskConfig);
        const url = (0, sensitiveMask_1.maskUrl)(String(payload.url || ""), this.maskConfig);
        const request = {
            id,
            order: test.requests.length + 1,
            phase: "chamada",
            method: String(payload.method || "GET").toUpperCase(),
            url,
            originalUrl: payload.originalUrl
                ? (0, sensitiveMask_1.maskUrl)(String(payload.originalUrl), this.maskConfig)
                : undefined,
            requestHeaders: headers,
            requestBody: body,
            failOnStatusCode: payload.failOnStatusCode,
            startedAt: payload.startedAt || new Date().toISOString(),
            responseHeaders: {},
            responseBody: null,
            durationMs: 0,
            curl: (0, curlGenerator_1.generateCurl)({ method: String(payload.method || "GET"), url, headers, body }, this.maskConfig),
        };
        test.requests.push(request);
        return id;
    }
    finishRequest(payload) {
        const test = this.findTest(payload.specPath, payload.testId);
        const request = test?.requests.find((item) => item.id === payload.id);
        if (!request)
            return null;
        request.receivedStatus =
            typeof payload.receivedStatus === "number" ? payload.receivedStatus : request.receivedStatus;
        request.responseHeaders = (0, sensitiveMask_1.maskSensitiveData)((0, format_1.asRecord)(payload.responseHeaders), this.maskConfig);
        request.responseBody = (0, sensitiveMask_1.maskSensitiveData)(payload.responseBody ?? null, this.maskConfig);
        request.redirects = Array.isArray(payload.redirects)
            ? payload.redirects.map((redirect) => ({
                statusCode: typeof redirect.statusCode === "number" ? redirect.statusCode : undefined,
                location: (0, sensitiveMask_1.maskUrl)(String(redirect.location || ""), this.maskConfig),
            })).filter((redirect) => redirect.location)
            : undefined;
        request.durationMs = Math.max(0, (0, format_1.clampNumber)(payload.durationMs));
        if (payload.error)
            request.error = (0, parseAssertionError_1.parseAssertionError)(payload.error, this.maskConfig);
        request.curl = (0, curlGenerator_1.generateCurl)({
            method: request.method,
            url: request.url,
            headers: request.requestHeaders,
            body: request.requestBody,
        }, this.maskConfig);
        return null;
    }
    setTestResult(payload) {
        const test = this.findTest(payload.specPath, payload.testId);
        if (!test)
            return null;
        test.state = normalizeState(payload.state);
        test.durationMs = Math.max(0, (0, format_1.clampNumber)(payload.durationMs));
        if (payload.error)
            test.error = (0, parseAssertionError_1.parseAssertionError)(payload.error, this.maskConfig);
        if (Array.isArray(payload.assertions)) {
            test.assertions = payload.assertions.map((assertion, index) => ({
                id: String(assertion.id || `assertion-${index + 1}`),
                title: (0, sensitiveMask_1.maskSensitiveText)(String(assertion.title || "Assertion observada"), this.maskConfig),
                state: normalizeAssertionState(assertion.state),
                message: assertion.message
                    ? (0, sensitiveMask_1.maskSensitiveText)(String(assertion.message), this.maskConfig)
                    : undefined,
                expected: (0, sensitiveMask_1.maskSensitiveData)(assertion.expected, this.maskConfig),
                actual: (0, sensitiveMask_1.maskSensitiveData)(assertion.actual, this.maskConfig),
                file: assertion.file ? String(assertion.file) : undefined,
                line: typeof assertion.line === "number" ? assertion.line : undefined,
                column: typeof assertion.column === "number" ? assertion.column : undefined,
                target: assertion.target,
            }));
        }
        return null;
    }
    setTestScreenshots(specPath, testId, screenshots) {
        const test = this.findTest(specPath, testId);
        if (test && screenshots.length)
            test.evidence = { screenshots };
    }
    mergeSourceAssertions(specPath, plannedTests) {
        const spec = this.getSpec(specPath);
        for (const plannedTest of plannedTests) {
            const test = spec.tests.find((item) => sameTitle(item, plannedTest.title));
            if (!test || !plannedTest.assertions.length)
                continue;
            if (plannedTest.statusExpectation)
                test.statusExpectation = { ...plannedTest.statusExpectation };
            const observed = test.assertions || [];
            const used = new Set();
            const assertions = plannedTest.assertions.map((planned) => {
                const match = observed.find((item) => !used.has(item.id) && assertionMatches(planned, item));
                if (match)
                    used.add(match.id);
                return match
                    ? {
                        ...planned,
                        ...match,
                        id: planned.id,
                        title: planned.title,
                        file: planned.file,
                        line: planned.line,
                        column: planned.column,
                        target: planned.target,
                    }
                    : { ...planned };
            });
            let failureIndex = assertions.findIndex((item) => item.state === "failed");
            if (failureIndex < 0 && test.error?.line) {
                failureIndex = assertions.findIndex((item) => item.line === test.error?.line);
            }
            if (failureIndex < 0 && test.error?.assertionMessage) {
                const message = comparableAssertionTitle(test.error.assertionMessage);
                failureIndex = assertions.findIndex((item) => message.includes(comparableAssertionTitle(item.title)));
            }
            if (test.state === "failed" && failureIndex >= 0) {
                assertions[failureIndex] = {
                    ...assertions[failureIndex],
                    state: "failed",
                    message: assertions[failureIndex].message || test.error?.message,
                    expected: assertions[failureIndex].expected ?? test.error?.expected,
                    actual: assertions[failureIndex].actual ?? test.error?.actual,
                };
                const failedRequestOrder = plannedTest.assertions[failureIndex]?.sourceRequestOrder;
                for (let index = failureIndex + 1; index < assertions.length; index += 1) {
                    if (assertions[index].state !== "unknown")
                        continue;
                    const requestOrder = plannedTest.assertions[index]?.sourceRequestOrder;
                    assertions[index].state =
                        failedRequestOrder !== undefined && requestOrder !== undefined && requestOrder > failedRequestOrder
                            ? "skipped"
                            : "pending";
                }
            }
            if (test.state === "passed") {
                for (const assertion of assertions) {
                    if (assertion.state === "unknown")
                        assertion.state = "skipped";
                }
            }
            test.assertions = assertions.map((assertion) => {
                const { sourceRequestOrder: _sourceRequestOrder, sourceStatusExpectation: _sourceStatusExpectation, ...publicAssertion } = assertion;
                return publicAssertion;
            });
        }
    }
    // Anexa o contrato JSDoc bruto ao spec. A consolidação por @contrato e a
    // resolução de regras acontecem em buildReportModel (visão de todos os specs).
    mergeContract(specPath, contract) {
        if (contract) {
            this.getSpec(specPath).contract = (0, sensitiveMask_1.maskSensitiveData)(contract, this.maskConfig);
        }
    }
    // Liga cada teste às suas tags: vínculo @regra:<id> (ruleRefs, resolvido depois
    // no reporter) e tags de catálogo/operacionais (tags), na ordem do source.
    mergeTestTags(specPath, plannedTags) {
        const spec = this.getSpec(specPath);
        for (const planned of plannedTags) {
            if (!planned.ruleRefs.length && !planned.tags.length)
                continue;
            const matches = spec.tests.filter((item) => sameTitle(item, planned.title));
            if (matches.length !== 1)
                continue;
            const test = matches[0];
            if (planned.ruleRefs.length) {
                const refs = [];
                const seen = new Set();
                for (const ruleId of planned.ruleRefs) {
                    if (seen.has(ruleId))
                        continue;
                    seen.add(ruleId);
                    refs.push({ ruleId, resolved: false });
                }
                test.ruleRefs = refs;
            }
            if (planned.tags.length) {
                const seen = new Set();
                const tags = [];
                for (const tag of planned.tags) {
                    if (seen.has(tag))
                        continue;
                    seen.add(tag);
                    tags.push(tag);
                }
                test.tags = tags;
            }
        }
    }
    mergeAfterSpec(specInfo, results) {
        const specPath = String(specInfo.relative || specInfo.name || this.currentSpecPath);
        this.currentSpecPath = specPath;
        const spec = this.getSpec(specPath);
        const stats = (0, format_1.asRecord)(results?.stats);
        spec.durationMs = (0, format_1.clampNumber)(stats.duration ?? stats.wallClockDuration, spec.tests.reduce((sum, test) => sum + test.durationMs, 0));
        const resultTests = Array.isArray(results?.tests) ? results.tests : [];
        for (const rawTest of resultTests) {
            const resultTest = (0, format_1.asRecord)(rawTest);
            const titleParts = Array.isArray(resultTest.title) ? resultTest.title.map(String) : [String(resultTest.title ?? "")];
            let test = spec.tests.find((item) => sameTitle(item, titleParts));
            if (!test) {
                test = {
                    id: (0, format_1.createId)("test"),
                    title: titleParts[titleParts.length - 1] || "Teste sem título",
                    titlePath: titleParts,
                    state: normalizeState(resultTest.state),
                    durationMs: 0,
                    requests: [],
                };
                spec.tests.push(test);
            }
            test.state = normalizeState(resultTest.state);
            const attempts = Array.isArray(resultTest.attempts) ? resultTest.attempts : [];
            const lastAttempt = (0, format_1.asRecord)(attempts.at(-1));
            test.durationMs = (0, format_1.clampNumber)(lastAttempt.wallClockDuration ?? resultTest.duration, test.durationMs);
            const error = lastAttempt.error ?? resultTest.displayError;
            if (error && !test.error)
                test.error = (0, parseAssertionError_1.parseAssertionError)(error, this.maskConfig);
            for (const request of test.requests) {
                if (!request.error && request.durationMs === 0 && test.state === "failed" && test.error) {
                    const statusMatch = test.error.message.match(/(?:status(?:\s+code)?|response\s+status)\s*[:=]?\s*(\d{3})/i);
                    if (statusMatch)
                        request.receivedStatus = Number(statusMatch[1]);
                    const startedAt = request.startedAt ? Date.parse(request.startedAt) : Number.NaN;
                    if (Number.isFinite(startedAt))
                        request.durationMs = Math.max(0, Date.now() - startedAt);
                    request.error = {
                        name: "RequestError",
                        message: (0, sensitiveMask_1.maskSensitiveText)(test.error.message, this.maskConfig),
                        stack: test.error.stack,
                    };
                }
            }
        }
        return this.snapshotSpec(specPath);
    }
    snapshotSpec(specPath) {
        const spec = this.getSpec(specPath);
        return JSON.parse(JSON.stringify(spec));
    }
    snapshot() {
        return Array.from(this.specs.values()).map((spec) => JSON.parse(JSON.stringify(spec)));
    }
}
exports.RequestStore = RequestStore;
//# sourceMappingURL=requestStore.js.map