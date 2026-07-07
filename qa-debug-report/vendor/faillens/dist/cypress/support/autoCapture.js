"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRedirects = normalizeRedirects;
exports.installAutoCapture = installAutoCapture;
const normalizeCyRequestArgs_1 = require("../../collector/normalizeCyRequestArgs");
const hooks_1 = require("./hooks");
function normalizeRedirects(value) {
    if (!Array.isArray(value))
        return [];
    return value.flatMap((item) => {
        if (typeof item === "string") {
            const match = item.match(/^\s*(\d{3})\s*:\s*(.+?)\s*$/);
            return [{ statusCode: match ? Number(match[1]) : undefined, location: match ? match[2] : item }];
        }
        if (!item || typeof item !== "object")
            return [];
        const redirect = item;
        const location = redirect.location || redirect.redirectedToUrl || redirect.headers?.location;
        if (!location)
            return [];
        const status = redirect.statusCode ?? redirect.status;
        return [{ statusCode: typeof status === "number" ? status : undefined, location: String(location) }];
    });
}
function requestId() {
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
function serializeError(error) {
    return {
        name: String(error?.name || "RequestError"),
        message: String(error?.message || error || "Falha em cy.request"),
        stack: error?.stack ? String(error.stack) : undefined,
        expected: error?.expected,
        actual: error?.actual,
    };
}
function finishPayload(item, response, error) {
    const received = response || error?.response || error?.request?.response;
    return {
        id: item.id,
        testId: item.testId,
        specPath: item.specPath,
        receivedStatus: typeof received?.status === "number"
            ? received.status
            : typeof error?.status === "number"
                ? error.status
                : undefined,
        responseHeaders: received?.headers || {},
        responseBody: received?.body ?? null,
        redirects: normalizeRedirects(received?.redirects),
        durationMs: typeof received?.duration === "number" ? received.duration : Math.max(0, Date.now() - item.startedAt),
        error: error ? serializeError(error) : undefined,
    };
}
function installAutoCapture() {
    if (Cypress.__failLensAutoCaptureInstalled)
        return;
    Cypress.__failLensAutoCaptureInstalled = true;
    Cypress.Commands.overwrite("request", (originalFn, ...args) => {
        const context = (0, hooks_1.getCurrentTestContext)();
        const normalized = (0, normalizeCyRequestArgs_1.normalizeCyRequestArgs)(args, Cypress.config("baseUrl") || undefined);
        const id = requestId();
        const item = {
            id,
            testId: context?.testId,
            specPath: context?.specPath || Cypress.spec?.relative,
            startedAt: Date.now(),
        };
        return cy.task("faillens:addRequest", {
            id,
            testId: item.testId,
            specPath: item.specPath,
            method: normalized.method,
            url: normalized.url,
            originalUrl: normalized.originalUrl,
            requestHeaders: normalized.headers,
            requestBody: normalized.body,
            failOnStatusCode: normalized.failOnStatusCode,
            startedAt: new Date(item.startedAt).toISOString(),
        }, { log: false }).then(() => {
            item.startedAt = Date.now();
            return originalFn(...args);
        }).then((response) => {
            return cy
                .task("faillens:finishRequest", finishPayload(item, response), { log: false })
                .then(() => response);
        });
    });
}
//# sourceMappingURL=autoCapture.js.map