"use strict";
// Parser determinístico do contrato JSDoc (zero dependências).
//
// Lê o bloco /** ... */ que contém @contrato (formato novo) ou @api (formato
// antigo, degradado) e produz um FailLensContract estruturado. A gramática é
// chave=valor, com aspas para valores que contêm espaços ou Unicode; atributos
// desconhecidos são preservados; um atributo inválido vira aviso estruturado e
// não derruba o resto do bloco. Nunca transforma texto livre em regra por
// heurística: sem id estável, a regra não é vinculável.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseContractJsdoc = parseContractJsdoc;
const PERSISTENCE_EXPECTATIONS = new Set([
    "required", "forbidden", "preserve", "remove", "not-specified",
]);
function tokenize(input) {
    const tokens = [];
    let current = "";
    let inQuote = false;
    let escaped = false;
    for (const character of input) {
        if (character === '"' && !escaped) {
            inQuote = !inQuote;
            current += character;
            continue;
        }
        if (!inQuote && /\s/.test(character)) {
            if (current)
                tokens.push(current);
            current = "";
            continue;
        }
        current += character;
        escaped = character === "\\" && !escaped;
        if (character !== "\\")
            escaped = false;
    }
    if (current)
        tokens.push(current);
    if (inQuote)
        tokens.unclosedQuote = true;
    return tokens;
}
function coerce(value) {
    if (value === "true")
        return true;
    if (value === "false")
        return false;
    if (/^-?\d+$/.test(value))
        return Number(value);
    return value;
}
function unquote(value) {
    return value.startsWith('"') && value.endsWith('"') && value.length >= 2
        ? value.slice(1, -1).replace(/\\(["\\])/g, "$1")
        : value;
}
function parseTokens(tokens) {
    const positional = [];
    const attributes = {};
    for (const token of tokens) {
        const eq = token.indexOf("=");
        const key = eq > 0 ? token.slice(0, eq) : "";
        if (eq > 0 && /^[A-Za-z][\w-]*$/.test(key)) {
            attributes[key] = coerce(unquote(token.slice(eq + 1)));
        }
        else {
            positional.push(token);
        }
    }
    return { positional, attributes };
}
// Deriva um id de contrato a partir do caminho do spec quando não há @contrato.
// Ex.: ".../alegacao-ans/crud.cy.js" -> "alegacao-ans".
function deriveContractId(file) {
    const normalized = file.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    const folder = parts.length >= 2 ? parts[parts.length - 2] : parts[parts.length - 1] || "contrato";
    return folder.replace(/^\d+[-_]/, "").replace(/[-_]controller$/i, "") || "contrato";
}
function stripComment(block) {
    return block
        .replace(/^\/\*\*/, "")
        .replace(/\*\/$/, "")
        .split("\n")
        .map((line) => line.replace(/^\s*\*?\s?/, "").replace(/\s+$/, ""));
}
function parseField(rest, warnings) {
    const typed = rest.match(/^(\S+)\s+\{(\w+)\}\s*(.*)$/);
    const name = typed ? typed[1] : rest.split(/\s+/)[0] || "";
    const type = typed ? typed[2] : undefined;
    const remainder = typed ? typed[3] : rest.slice(name.length).trim();
    const tokens = tokenize(remainder);
    const { positional, attributes } = parseTokens(tokens);
    if (tokens.unclosedQuote)
        warnings.push({ code: "invalid-quoted-value", tag: "@campo", message: `Aspas não fechadas no campo "${name}".` });
    // Constraints em formato antigo (sem chave=valor) ficam preservadas no raw,
    // mas não viram atributos estruturados — degradação sem invenção.
    if (positional.length && !Object.keys(attributes).length) {
        warnings.push({
            code: "legacy-field",
            tag: "@campo",
            message: `Campo "${name}" usa constraints em texto livre (sem chave=valor); preservado como contexto.`,
        });
    }
    return { name, type, attributes, raw: rest.trim() };
}
function parseRule(rest, seen, warnings) {
    const tokens = tokenize(rest);
    const first = tokens[0] || "";
    // Formato antigo: "@regra 404 + "msg" — condição" começa com status numérico.
    // Sem id estável não há vínculo possível; registramos como aviso degradado.
    if (/^\d{3}\b/.test(first) || !/^[a-z][a-z0-9-]*$/.test(first)) {
        warnings.push({
            code: "rule-without-id",
            tag: "@regra",
            message: `Regra sem identificador estável: "${rest.trim()}".`,
        });
        return undefined;
    }
    const id = first;
    if (tokens.unclosedQuote) {
        warnings.push({ code: "invalid-quoted-value", tag: "@regra", ruleId: id, message: `Aspas não fechadas na regra "${id}".` });
    }
    const { attributes } = parseTokens(tokens.slice(1));
    // Regra estruturada sempre tem ao menos um atributo chave=valor. Sem isso é
    // texto livre legado (ex.: "@regra update ignora codigo do body"): não vincula.
    if (!Object.keys(attributes).length) {
        warnings.push({
            code: "rule-without-id",
            tag: "@regra",
            message: `Regra sem atributos estruturados: "${rest.trim()}".`,
        });
        return undefined;
    }
    if (seen.has(id)) {
        warnings.push({ code: "duplicate-rule", tag: "@regra", ruleId: id, message: `Regra duplicada: "${id}".` });
    }
    seen.add(id);
    let status;
    if (attributes.status !== undefined) {
        const value = Number(attributes.status);
        if (Number.isInteger(value) && value >= 100 && value <= 599)
            status = value;
        else
            warnings.push({
                code: "invalid-status",
                tag: "@regra",
                ruleId: id,
                message: `Status inválido em "${id}": ${String(attributes.status)}.`,
            });
    }
    const message = typeof attributes.message === "string" ? attributes.message : undefined;
    let persistence;
    if (attributes.persistence !== undefined) {
        const value = String(attributes.persistence);
        if (PERSISTENCE_EXPECTATIONS.has(value))
            persistence = value;
        else
            warnings.push({
                code: "invalid-persistence",
                tag: "@regra",
                ruleId: id,
                message: `Persistência inválida em "${id}": ${String(attributes.persistence)}.`,
            });
    }
    return { id, attributes, status, message, persistence, raw: rest.trim() };
}
function parseContractJsdoc(source, file) {
    const blocks = source.match(/\/\*\*[\s\S]*?\*\//g) || [];
    const block = blocks.find((candidate) => /@contrato\b/.test(candidate)) ||
        blocks.find((candidate) => /@api\b/.test(candidate));
    if (!block)
        return undefined;
    const warnings = [];
    const fields = [];
    const rules = [];
    const seenRules = new Set();
    const cobertura = [];
    let contractId;
    let api = [];
    let resumo;
    let permissao;
    let sawContrato = false;
    for (const line of stripComment(block)) {
        const match = line.match(/^@(\w+)\s*(.*)$/);
        if (!match)
            continue;
        const [, tag, rest] = match;
        switch (tag) {
            case "contrato":
                sawContrato = true;
                contractId = rest.trim().split(/\s+/)[0] || contractId;
                break;
            case "api":
                api = rest.split("|").map((part) => part.trim()).filter(Boolean);
                break;
            case "resumo":
                resumo = rest.trim();
                break;
            case "campo":
                fields.push(parseField(rest, warnings));
                break;
            case "regra": {
                const rule = parseRule(rest, seenRules, warnings);
                if (rule)
                    rules.push(rule);
                break;
            }
            case "permissao": {
                const { attributes } = parseTokens(tokenize(rest));
                permissao = Object.keys(attributes).length ? attributes : { raw: rest.trim() };
                break;
            }
            case "cobertura": {
                const cm = rest.match(/^(@[\w-]+)\s+([\w-]+)\s*(?:[—–-]\s*)?(.*)$/);
                if (cm)
                    cobertura.push({ tag: cm[1], status: cm[2], motivo: cm[3].trim() });
                break;
            }
            default:
                break;
        }
    }
    const legacy = !sawContrato;
    if (legacy) {
        warnings.push({
            code: "legacy-format",
            message: "Bloco sem @contrato; tratado como contexto geral, sem vínculo de regra específico.",
        });
    }
    return {
        id: contractId || deriveContractId(file),
        api,
        resumo,
        fields,
        rules,
        permissao,
        cobertura,
        sourceFiles: [file.replace(/\\/g, "/")],
        legacy,
        warnings,
    };
}
//# sourceMappingURL=parseContractJsdoc.js.map