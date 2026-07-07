"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJsonSafe = toJsonSafe;
exports.stringifyForDisplay = stringifyForDisplay;
function toJsonSafe(value) {
    const seen = new WeakSet();
    const serialized = JSON.stringify(value, (_key, current) => {
        if (typeof current === "bigint")
            return current.toString();
        if (typeof current === "function" || typeof current === "symbol")
            return undefined;
        if (current instanceof Error) {
            return { name: current.name, message: current.message, stack: current.stack };
        }
        if (current && typeof current === "object") {
            if (seen.has(current))
                return "[Circular]";
            seen.add(current);
        }
        return current;
    });
    return serialized === undefined ? undefined : JSON.parse(serialized);
}
function stringifyForDisplay(value) {
    if (value === undefined)
        return "—";
    if (typeof value === "string")
        return value;
    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return String(value);
    }
}
//# sourceMappingURL=safeJson.js.map