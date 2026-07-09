"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MASK_FIELDS = void 0;
exports.hasMaskRules = hasMaskRules;
exports.isSensitiveField = isSensitiveField;
exports.maskSensitiveData = maskSensitiveData;
exports.maskUrl = maskUrl;
exports.maskSensitiveText = maskSensitiveText;
exports.DEFAULT_MASK_FIELDS = [
    "authorization",
    "cookie",
    "set-cookie",
    "password",
    "senha",
    "token",
    "accessToken",
    "refreshToken",
    "apiKey",
    "secret",
    "clientSecret",
    "jwt",
    "bearer",
    "cpf",
    "cnpj",
];
function canonicalKey(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function normalizeOptions(config = []) {
    return Array.isArray(config)
        ? { fields: config, patterns: [] }
        : { fields: config.fields || [], patterns: config.patterns || [] };
}
function sensitiveSet(extraFields = []) {
    return new Set([...exports.DEFAULT_MASK_FIELDS, ...extraFields].map(canonicalKey));
}
function compileMaskPatterns(patterns = []) {
    const compiled = [];
    for (const pattern of patterns) {
        if (!pattern)
            continue;
        try {
            const slash = pattern.lastIndexOf("/");
            const isLiteral = pattern.startsWith("/") && slash > 0;
            const source = isLiteral ? pattern.slice(1, slash) : pattern;
            const rawFlags = isLiteral ? pattern.slice(slash + 1) : "gi";
            const flags = Array.from(new Set(`${rawFlags || ""}g`.split(""))).join("");
            compiled.push(new RegExp(source, flags));
        }
        catch {
            // Padrões inválidos são ignorados para não impedir a geração do relatório.
        }
    }
    return compiled;
}
function applyMaskPatterns(value, patterns) {
    let masked = value;
    for (const pattern of patterns)
        masked = masked.replace(pattern, "***");
    return masked;
}
function maskedValue(key, value) {
    const normalized = canonicalKey(key);
    const text = typeof value === "string" ? value : "";
    if (normalized === "authorization" && /^bearer\s+/i.test(text))
        return "Bearer <TOKEN>";
    if (normalized === "bearer")
        return "<TOKEN>";
    return "***";
}
function hasMaskRules(config = []) {
    const options = normalizeOptions(config);
    return Boolean(options.fields.length || options.patterns.length);
}
function isSensitiveField(key, extraFields = []) {
    return sensitiveSet(extraFields).has(canonicalKey(key));
}
function maskSensitiveData(value, config = []) {
    const options = normalizeOptions(config);
    const fields = sensitiveSet(options.fields);
    const visited = new WeakMap();
    const textHints = options.fields.map((field) => field.toLowerCase());
    const patterns = compileMaskPatterns(options.patterns);
    function walk(current) {
        if (current === null || current === undefined)
            return current;
        if (typeof current === "string") {
            const trimmed = current.trim();
            if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try {
                    return JSON.stringify(walk(JSON.parse(current)));
                }
                catch {
                    // Mantém strings que apenas se parecem com JSON.
                }
            }
            if (/^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/.test(trimmed))
                return "<TOKEN>";
            const customMasked = applyMaskPatterns(current, patterns);
            if (customMasked !== current)
                return customMasked;
            if (!/bearer|authorization|cookie|password|senha|token|api.?key|secret|jwt|cpf|cnpj|[?&]/i.test(current) &&
                !textHints.some((field) => current.toLowerCase().includes(field)))
                return current;
            return maskSensitiveText(current, options);
        }
        if (Array.isArray(current)) {
            if (visited.has(current))
                return "[Circular]";
            const result = [];
            visited.set(current, result);
            current.forEach((item) => result.push(walk(item)));
            return result;
        }
        if (typeof current === "object") {
            if (visited.has(current))
                return "[Circular]";
            const result = {};
            visited.set(current, result);
            for (const [key, item] of Object.entries(current)) {
                Object.defineProperty(result, key, {
                    value: fields.has(canonicalKey(key)) ? maskedValue(key, item) : walk(item),
                    enumerable: true,
                    configurable: true,
                    writable: true,
                });
            }
            return result;
        }
        return current;
    }
    return walk(value);
}
function maskUrl(value, config = []) {
    const options = normalizeOptions(config);
    const fields = sensitiveSet(options.fields);
    try {
        const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
        const parsed = new URL(value, "http://faillens.local");
        for (const key of Array.from(parsed.searchParams.keys())) {
            if (fields.has(canonicalKey(key)))
                parsed.searchParams.set(key, "***");
        }
        const masked = absolute
            ? parsed.toString()
            : `${parsed.pathname}${parsed.search}${parsed.hash}`;
        return applyMaskPatterns(masked, compileMaskPatterns(options.patterns));
    }
    catch {
        return applyMaskPatterns(value, compileMaskPatterns(options.patterns));
    }
}
function maskSensitiveText(value, config = []) {
    const options = normalizeOptions(config);
    let masked = value
        .replace(/\bbearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer <TOKEN>")
        .replace(/(authorization\s*[:=]\s*bearer\s+)[^\s,;"']+/gi, "$1<TOKEN>")
        .replace(/(authorization\s*[:=]\s*)[^\s,;]+/gi, "$1***")
        .replace(/((?:set-)?cookie\s*[:=]\s*)[^\r\n]+/gi, "$1***");
    masked = masked.replace(/((?:token|access\s*token|refresh\s*token|password|senha|api\s*key|secret|jwt)[^:\r\n]{0,48}:\s*expected\s+)(?:\*\*)?[^*\s][^*\r\n]*?(?:\*\*)?(\s+to\b)/gi, "$1***$2");
    for (const field of [...exports.DEFAULT_MASK_FIELDS, ...options.fields]) {
        const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        masked = masked.replace(new RegExp(`([?&]${escaped}=|["']?${escaped}["']?\\s*[:=]\\s*["']?)(?!expected\\b)[^&\\s,;"'}]+`, "gi"), "$1***");
    }
    return applyMaskPatterns(masked, compileMaskPatterns(options.patterns));
}
//# sourceMappingURL=sensitiveMask.js.map