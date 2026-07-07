"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCurl = generateCurl;
const sensitiveMask_1 = require("./sensitiveMask");
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
function generateCurl(input, maskConfig = []) {
    const method = (input.method || "GET").toUpperCase();
    const methodArgument = /^[A-Z0-9-]+$/.test(method) ? method : shellQuote(method);
    const url = (0, sensitiveMask_1.maskUrl)(input.url, maskConfig);
    const headers = (0, sensitiveMask_1.maskSensitiveData)(input.headers ?? {}, maskConfig);
    const body = (0, sensitiveMask_1.maskSensitiveData)(input.body, maskConfig);
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