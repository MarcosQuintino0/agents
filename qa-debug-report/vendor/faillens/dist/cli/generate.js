"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = generateCommand;
const node_path_1 = __importDefault(require("node:path"));
const buildReportModel_1 = require("../reporter/buildReportModel");
const generateHtml_1 = require("../reporter/generateHtml");
const generateJson_1 = require("../reporter/generateJson");
const fs_1 = require("../utils/fs");
const open_1 = require("./open");
async function generateCommand(options, projectRoot = process.cwd()) {
    if (!options.input || !options.output) {
        throw new Error("Uso: faillens generate --input caminho.json --output caminho.html");
    }
    const input = node_path_1.default.resolve(projectRoot, options.input);
    const output = node_path_1.default.resolve(projectRoot, options.output);
    const source = await (0, fs_1.readJsonFile)(input);
    if (!source || !Array.isArray(source.specs)) {
        throw new Error("O arquivo de entrada não contém um relatório FailLens válido.");
    }
    const report = (0, buildReportModel_1.buildReportModel)(source.specs, {
        generatedAt: source.generatedAt,
        config: {
            projectName: source.project?.name,
            runId: source.project?.runId,
            branch: source.project?.branch,
            theme: source.theme || "dark",
            maskFields: [],
            maskPatterns: [],
        },
    });
    const file = await (0, generateHtml_1.generateHtml)(report, output);
    console.log(`[FailLens] HTML standalone gerado em ${file}`);
    if (options.open && !process.env.CI) {
        const reportDir = node_path_1.default.dirname(file);
        await (0, generateJson_1.generateJson)(report, reportDir);
        await (0, open_1.openReport)({ report: reportDir }, projectRoot);
    }
    return 0;
}
//# sourceMappingURL=generate.js.map