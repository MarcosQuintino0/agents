"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveReportLocation = resolveReportLocation;
exports.openReport = openReport;
exports.openCommand = openCommand;
const node_child_process_1 = require("node:child_process");
const node_path_1 = __importDefault(require("node:path"));
const localReportServer_1 = require("../server/localReportServer");
const fs_1 = require("../utils/fs");
async function resolveReportLocation(report, projectRoot) {
    const target = node_path_1.default.resolve(projectRoot, report || node_path_1.default.join("reports", "faillens"));
    const reportDir = node_path_1.default.extname(target).toLowerCase() === ".html" ? node_path_1.default.dirname(target) : target;
    if (!(await (0, fs_1.pathExists)(node_path_1.default.join(reportDir, "index.html"))) || !(await (0, fs_1.pathExists)(node_path_1.default.join(reportDir, "faillens-report.json")))) {
        throw new Error(`Não foi encontrado um relatório FailLens válido em ${reportDir}.`);
    }
    const defaultDir = node_path_1.default.resolve(projectRoot, "reports", "faillens");
    return { reportDir, projectRoot: reportDir === defaultDir ? projectRoot : node_path_1.default.resolve(projectRoot) };
}
function launchBrowser(url) {
    const command = process.platform === "win32" ? "cmd.exe" : process.platform === "darwin" ? "open" : "xdg-open";
    const args = process.platform === "win32" ? ["/d", "/s", "/c", "start", "", url] : [url];
    const child = (0, node_child_process_1.spawn)(command, args, { detached: true, stdio: "ignore", windowsHide: true });
    child.once("error", (error) => console.error(`[FailLens] Não foi possível abrir o navegador: ${error.message}`));
    child.unref();
}
async function openReport(options = {}, projectRoot = process.cwd()) {
    const location = await resolveReportLocation(options.report, projectRoot);
    const server = await (0, localReportServer_1.startReportServer)({
        ...location,
        port: options.port,
        idleTimeoutMs: options.idleTimeoutMs,
    });
    console.log(`[FailLens] Relatório aberto em ${server.url}`);
    console.log("[FailLens] O servidor será encerrado automaticamente ao fechar a última aba.");
    if (options.browser !== false)
        launchBrowser(server.url);
    const stop = () => { void server.close(); };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    try {
        await server.closed;
    }
    finally {
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
        await server.close();
    }
}
async function openCommand(options = {}, projectRoot = process.cwd()) {
    await openReport(options, projectRoot);
    return 0;
}
//# sourceMappingURL=open.js.map