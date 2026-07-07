"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampNumber = clampNumber;
exports.round = round;
exports.createId = createId;
exports.asRecord = asRecord;
function clampNumber(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}
function createId(prefix) {
    const random = Math.random().toString(36).slice(2, 9);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
}
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
//# sourceMappingURL=format.js.map