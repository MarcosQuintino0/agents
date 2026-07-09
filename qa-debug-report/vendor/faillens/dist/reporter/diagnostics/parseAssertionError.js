"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAssertionError = parseAssertionError;
const sensitiveMask_1 = require("../../collector/sensitiveMask");
function parseLiteral(value) {
    const clean = value.trim().replace(/[.,;]$/, "");
    if (/^-?\d+(?:\.\d+)?$/.test(clean))
        return Number(clean);
    if (clean === "true")
        return true;
    if (clean === "false")
        return false;
    if (clean === "null")
        return null;
    return clean.replace(/^['"`]|['"`]$/g, "");
}
function sourceLocation(stack) {
    if (!stack)
        return {};
    const candidates = Array.from(stack.matchAll(/(?:\(|\s|^)((?:[A-Za-z]:)?[^()\n]+?\.(?:[cm]?[jt]sx?)):(\d+):(\d+)\)?/g));
    const preferred = candidates.find((match) => !/node_modules|cypress[\\/]runner/i.test(match[1])) ?? candidates[0];
    if (!preferred)
        return {};
    return {
        file: preferred[1].trim(),
        line: Number(preferred[2]),
        column: Number(preferred[3]),
    };
}
function parseAssertionError(input, maskConfig = []) {
    const raw = input && typeof input === "object"
        ? input
        : { message: String(input ?? "Erro desconhecido") };
    const shouldMask = (0, sensitiveMask_1.hasMaskRules)(maskConfig);
    const message = shouldMask
        ? (0, sensitiveMask_1.maskSensitiveText)(String(raw.message ?? "Erro desconhecido"), maskConfig)
        : String(raw.message ?? "Erro desconhecido");
    const stack = raw.stack
        ? shouldMask ? (0, sensitiveMask_1.maskSensitiveText)(String(raw.stack), maskConfig) : String(raw.stack)
        : undefined;
    const location = sourceLocation(stack);
    const result = {
        name: String(raw.name ?? (/assert/i.test(message) ? "AssertionError" : "Error")),
        message,
        stack,
        file: raw.file ? String(raw.file) : location.file,
        line: typeof raw.line === "number" ? raw.line : location.line,
        column: typeof raw.column === "number" ? raw.column : location.column,
    };
    if (raw.expected !== undefined)
        result.expected = shouldMask ? (0, sensitiveMask_1.maskSensitiveData)(raw.expected, maskConfig) : raw.expected;
    if (raw.actual !== undefined)
        result.actual = shouldMask ? (0, sensitiveMask_1.maskSensitiveData)(raw.actual, maskConfig) : raw.actual;
    if (raw.assertionMessage) {
        result.assertionMessage = shouldMask
            ? (0, sensitiveMask_1.maskSensitiveText)(String(raw.assertionMessage), maskConfig)
            : String(raw.assertionMessage);
    }
    const descriptive = message.match(/^(?:AssertionError:\s*)?(.+?):\s*expected\s+/i);
    if (descriptive && !result.assertionMessage)
        result.assertionMessage = descriptive[1].trim();
    const gotPattern = message.match(/expected\s+(?:response\.)?status\s+to\s+(?:equal|eq|be)\s+([^\s,;]+).*?\b(?:but\s+)?got\s+([^\s,;]+)/i);
    if (gotPattern) {
        result.expected = parseLiteral(gotPattern[1]);
        result.actual = parseLiteral(gotPattern[2]);
        return result;
    }
    const forbiddenProperty = message.match(/to\s+not\s+have(?:\s+(?:own|nested))?\s+property\s+['"`]([^'"`]+)['"`]/i);
    if (forbiddenProperty) {
        const property = forbiddenProperty[1];
        result.expected ??= `ausência de ${property}`;
        result.actual ??= `${property} presente`;
        return result;
    }
    const equality = message.match(/expected\s+(.+?)\s+to\s+(?:deep(?:ly)?\s+)?(?:equal|eq)\s+([^\n,;]+?)(?:\s+but\s+got\s+.+)?$/im);
    if (equality) {
        result.actual = parseLiteral(equality[1]);
        result.expected = parseLiteral(equality[2]);
        return result;
    }
    const below = message.match(/expected\s+(.+?)\s+to\s+be\s+below\s+([^\s,;]+)/i);
    if (below) {
        result.actual = parseLiteral(below[1]);
        result.expected = parseLiteral(below[2]);
    }
    if (!result.assertionMessage && /assert|expected/i.test(message)) {
        result.assertionMessage = message.replace(/^AssertionError:\s*/i, "");
    }
    return result;
}
//# sourceMappingURL=parseAssertionError.js.map