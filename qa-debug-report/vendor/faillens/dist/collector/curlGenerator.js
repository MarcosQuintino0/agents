"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCurl = generateCurl;
const sensitiveMask_1 = require("./sensitiveMask");
function shellText(value) {
    return value.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ");
}
function shellQuote(value) {
    return `'${shellText(value).replace(/'/g, `'\\''`)}'`;
}
function generateCurl(input, maskConfig = []) {
    const method = (input.method || "GET").toUpperCase();
    const methodArgument = /^[A-Z0-9-]+$/.test(method) ? method : shellQuote(method);
    const shouldMask = maskConfig !== false;
    const effectiveMaskConfig = maskConfig || [];
    const url = shouldMask ? (0, sensitiveMask_1.maskUrl)(input.url, effectiveMaskConfig) : input.url;
    const headers = shouldMask ? (0, sensitiveMask_1.maskSensitiveData)(input.headers ?? {}, effectiveMaskConfig) : input.headers ?? {};
    const body = shouldMask ? (0, sensitiveMask_1.maskSensitiveData)(input.body, effectiveMaskConfig) : input.body;
    const lines = [`curl -X ${methodArgument} ${shellQuote(url)}`];
    for (const [name, value] of Object.entries(headers)) {
        const rendered = Array.isArray(value) ? value.join(", ") : String(value);
        lines.push(`-H ${shellQuote(`${name}: ${rendered}`)}`);
    }
    if (body !== null && body !== undefined) {
        const rendered = typeof body === "string" ? body : JSON.stringify(body, null, 2);
        lines.push(`-d ${shellQuote(rendered)}`);
    }
    return lines.join(" \\\n  ");
}
//# sourceMappingURL=curlGenerator.js.map