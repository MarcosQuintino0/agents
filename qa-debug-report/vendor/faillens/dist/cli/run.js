"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const createInstrumentedConfig_1 = require("../cypress/createInstrumentedConfig");
const registerNodeEvents_1 = require("../cypress/registerNodeEvents");
const detectCypress_1 = require("./detectCypress");
const config_1 = require("./config");
const open_1 = require("./open");
function resolveCypressBin(projectRoot) {
    try {
        const packageFile = require.resolve("cypress/package.json", { paths: [projectRoot] });
        const bin = node_path_1.default.join(node_path_1.default.dirname(packageFile), "bin", "cypress");
        if ((0, node_fs_1.existsSync)(bin))
            return bin;
        if ((0, node_fs_1.existsSync)(`${bin}.js`))
            return `${bin}.js`;
        throw new Error("binário ausente");
    }
    catch {
        throw new Error("O Cypress está declarado no package.json, mas não foi encontrado em node_modules. Execute npm install antes de usar o FailLens.");
    }
}
function executeCypress(projectRoot, cypressBin, configPath, forwardedArgs) {
    return new Promise((resolve, reject) => {
        const child = (0, node_child_process_1.spawn)(process.execPath, [cypressBin, "run", "--config-file", configPath, ...forwardedArgs], { cwd: projectRoot, env: process.env, stdio: "inherit", windowsHide: true });
        child.once("error", reject);
        child.once("close", (code, signal) => {
            if (signal)
                console.error(`[FailLens] Cypress foi encerrado pelo sinal ${signal}.`);
            resolve(typeof code === "number" ? code : 1);
        });
    });
}
async function runCommand(forwardedArgs = [], projectRoot = process.cwd(), options = {}) {
    console.log("[FailLens] Detectando o projeto Cypress…");
    const config = await (0, config_1.loadFailLensConfig)(projectRoot);
    const project = await (0, detectCypress_1.detectCypress)(projectRoot, config.cypressConfigFile);
    const generated = await (0, createInstrumentedConfig_1.createInstrumentedConfig)(project, config);
    const cypressBin = resolveCypressBin(project.projectRoot);
    console.log(`[FailLens] Executando Cypress com ${node_path_1.default.relative(project.projectRoot, generated.configPath)}…`);
    let exitCode = 1;
    try {
        exitCode = await executeCypress(project.projectRoot, cypressBin, generated.configPath, forwardedArgs);
    }
    finally {
        try {
            const specs = await (0, registerNodeEvents_1.loadPartialSpecs)(generated.resultsDir);
            await (0, registerNodeEvents_1.generateReportArtifacts)(specs, config.outputDir, config);
            console.log(`[FailLens] Relatório disponível em ${node_path_1.default.join(config.outputDir, "index.html")}`);
            console.log(`[FailLens] Dados disponíveis em ${node_path_1.default.join(config.outputDir, "faillens-report.json")}`);
            if (options.open && !process.env.CI) {
                await (0, open_1.openReport)({ report: config.outputDir }, project.projectRoot);
            }
        }
        catch (error) {
            console.error(`[FailLens] Não foi possível finalizar o relatório: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return exitCode;
}
//# sourceMappingURL=run.js.map