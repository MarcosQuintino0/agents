"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCyRequestArgs = normalizeCyRequestArgs;
const format_1 = require("../utils/format");
function resolveUrl(url, baseUrl) {
    if (!baseUrl)
        return url;
    try {
        return new URL(url, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
    }
    catch {
        return url;
    }
}
function normalizeCyRequestArgs(args, baseUrl) {
    const first = args[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
        const options = first;
        const originalUrl = typeof options.url === "string" ? options.url : "";
        return {
            method: typeof options.method === "string" ? options.method.toUpperCase() : "GET",
            url: resolveUrl(originalUrl, baseUrl),
            originalUrl,
            headers: (0, format_1.asRecord)(options.headers),
            body: Object.prototype.hasOwnProperty.call(options, "body") ? options.body : null,
            failOnStatusCode: typeof options.failOnStatusCode === "boolean" ? options.failOnStatusCode : undefined,
            originalArgsShape: "options",
        };
    }
    if (typeof first !== "string") {
        throw new TypeError("cy.request recebeu argumentos que o FailLens não conseguiu normalizar.");
    }
    if (args.length === 1) {
        return {
            method: "GET",
            url: resolveUrl(first, baseUrl),
            originalUrl: first,
            headers: {},
            body: null,
            failOnStatusCode: undefined,
            originalArgsShape: "url",
        };
    }
    const originalUrl = typeof args[1] === "string" ? args[1] : "";
    return {
        method: first.toUpperCase(),
        url: resolveUrl(originalUrl, baseUrl),
        originalUrl,
        headers: {},
        body: args.length >= 3 ? args[2] : null,
        failOnStatusCode: undefined,
        originalArgsShape: args.length >= 3 ? "method-url-body" : "method-url",
    };
}
//# sourceMappingURL=normalizeCyRequestArgs.js.map