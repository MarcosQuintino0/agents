"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReportServer = startReportServer;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_http_1 = require("node:http");
const node_path_1 = __importDefault(require("node:path"));
function secureTokenMatches(received, expected) {
    if (!received)
        return false;
    const left = (0, node_crypto_1.createHash)("sha256").update(received).digest();
    const right = (0, node_crypto_1.createHash)("sha256").update(expected).digest();
    return (0, node_crypto_1.timingSafeEqual)(left, right);
}
function writeSecurityHeaders(response, contentType) {
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
}
function collectEvidencePaths(report) {
    const allowed = new Set();
    if (!report || typeof report !== "object")
        return allowed;
    const specs = report.specs;
    if (!Array.isArray(specs))
        return allowed;
    for (const spec of specs) {
        const tests = spec && typeof spec === "object" ? spec.tests : undefined;
        if (!Array.isArray(tests))
            continue;
        for (const test of tests) {
            const evidence = test && typeof test === "object" ? test.evidence : undefined;
            const screenshots = evidence && typeof evidence === "object"
                ? evidence.screenshots
                : undefined;
            if (!Array.isArray(screenshots))
                continue;
            for (const screenshot of screenshots) {
                const relativePath = screenshot && typeof screenshot === "object"
                    ? screenshot.relativePath
                    : undefined;
                if (typeof relativePath === "string")
                    allowed.add(relativePath.replace(/\\/g, "/"));
            }
        }
    }
    return allowed;
}
async function startReportServer(options) {
    const host = "127.0.0.1";
    const reportDir = node_path_1.default.resolve(options.reportDir);
    const projectRoot = node_path_1.default.resolve(options.projectRoot);
    const realProjectRoot = await node_fs_1.promises.realpath(projectRoot);
    const htmlPath = node_path_1.default.join(reportDir, "index.html");
    const jsonPath = node_path_1.default.join(reportDir, "faillens-report.json");
    const [standaloneHtml, reportText] = await Promise.all([
        node_fs_1.promises.readFile(htmlPath, "utf8"),
        node_fs_1.promises.readFile(jsonPath, "utf8"),
    ]);
    const allowedEvidence = collectEvidencePaths(JSON.parse(reportText));
    const localHtml = standaloneHtml.replace(/connect-src\s+'none'/, "connect-src 'self'");
    const token = (0, node_crypto_1.randomBytes)(24).toString("base64url");
    const clients = new Set();
    let idleTimer;
    let graceTimer;
    let closing;
    let resolveClosed;
    const closed = new Promise((resolve) => { resolveClosed = resolve; });
    const server = (0, node_http_1.createServer)((request, response) => {
        const address = server.address();
        const port = address && typeof address === "object" ? address.port : options.port || 0;
        const hostHeader = request.headers.host || "";
        if (hostHeader !== `${host}:${port}` && hostHeader !== `localhost:${port}`) {
            response.writeHead(403).end("Forbidden");
            return;
        }
        const url = new URL(request.url || "/", `http://${hostHeader}`);
        const authorized = secureTokenMatches(url.searchParams.get("token"), token);
        const resetIdle = () => {
            if (idleTimer)
                clearTimeout(idleTimer);
            if (clients.size === 0)
                idleTimer = setTimeout(() => void close(), options.idleTimeoutMs ?? 15 * 60_000);
        };
        resetIdle();
        if (url.pathname === "/") {
            if (!authorized) {
                response.writeHead(403).end("Forbidden");
                return;
            }
            writeSecurityHeaders(response, "text/html; charset=utf-8");
            response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' data:; font-src data:; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'");
            response.end(localHtml);
            return;
        }
        if (url.pathname === "/__faillens/health") {
            if (!authorized) {
                response.writeHead(403).end("Forbidden");
                return;
            }
            writeSecurityHeaders(response, "application/json; charset=utf-8");
            response.end('{"status":"ok"}');
            return;
        }
        if (url.pathname === "/faillens-report.json") {
            if (!authorized) {
                response.writeHead(403).end("Forbidden");
                return;
            }
            writeSecurityHeaders(response, "application/json; charset=utf-8");
            response.end(reportText);
            return;
        }
        if (url.pathname === "/__faillens/events") {
            if (!authorized) {
                response.writeHead(403).end("Forbidden");
                return;
            }
            if (idleTimer)
                clearTimeout(idleTimer);
            if (graceTimer)
                clearTimeout(graceTimer);
            writeSecurityHeaders(response, "text/event-stream; charset=utf-8");
            response.setHeader("Connection", "keep-alive");
            response.flushHeaders();
            clients.add(response);
            response.write("event: ready\ndata: connected\n\n");
            const remove = () => {
                clients.delete(response);
                if (clients.size === 0 && !closing) {
                    graceTimer = setTimeout(() => void close(), options.closeGraceMs ?? 7_500);
                }
            };
            request.once("close", remove);
            return;
        }
        if (url.pathname === "/__faillens/evidence") {
            if (!authorized) {
                response.writeHead(403).end("Forbidden");
                return;
            }
            const relativePath = (url.searchParams.get("path") || "").replace(/\\/g, "/");
            if (!allowedEvidence.has(relativePath) || node_path_1.default.posix.extname(relativePath).toLowerCase() !== ".png") {
                response.writeHead(404).end("Not found");
                return;
            }
            const file = node_path_1.default.resolve(projectRoot, ...relativePath.split("/"));
            const relative = node_path_1.default.relative(projectRoot, file);
            if (!relative || relative.startsWith("..") || node_path_1.default.isAbsolute(relative)) {
                response.writeHead(404).end("Not found");
                return;
            }
            void node_fs_1.promises.realpath(file).then(async (realFile) => {
                const realRelative = node_path_1.default.relative(realProjectRoot, realFile);
                if (!realRelative || realRelative.startsWith("..") || node_path_1.default.isAbsolute(realRelative)) {
                    response.writeHead(404).end("Not found");
                    return;
                }
                const stat = await node_fs_1.promises.stat(realFile);
                if (!stat.isFile()) {
                    response.writeHead(404).end("Not found");
                    return;
                }
                writeSecurityHeaders(response, "image/png");
                response.setHeader("Content-Length", stat.size);
                (0, node_fs_1.createReadStream)(realFile).on("error", () => response.destroy()).pipe(response);
            }).catch(() => { if (!response.headersSent)
                response.writeHead(404).end("Not found"); });
            return;
        }
        response.writeHead(404).end("Not found");
    });
    const close = async () => {
        if (closing)
            return closing;
        closing = new Promise((resolve) => {
            if (idleTimer)
                clearTimeout(idleTimer);
            if (graceTimer)
                clearTimeout(graceTimer);
            for (const client of clients)
                client.end();
            clients.clear();
            server.close(() => { resolveClosed?.(); resolve(); });
            server.closeIdleConnections?.();
        });
        return closing;
    };
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(options.port ?? 0, host, () => { server.off("error", reject); resolve(); });
    });
    const address = server.address();
    if (!address || typeof address === "string")
        throw new Error("Não foi possível obter a porta do servidor local.");
    idleTimer = setTimeout(() => void close(), options.idleTimeoutMs ?? 15 * 60_000);
    return {
        url: `http://${host}:${address.port}/?token=${encodeURIComponent(token)}`,
        port: address.port,
        token,
        closed,
        close,
    };
}
//# sourceMappingURL=localReportServer.js.map