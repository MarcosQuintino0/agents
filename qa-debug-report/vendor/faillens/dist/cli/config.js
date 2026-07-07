"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFailLensConfig = loadFailLensConfig;
const node_path_1 = __importDefault(require("node:path"));
const sensitiveMask_1 = require("../collector/sensitiveMask");
const fs_1 = require("../utils/fs");
async function loadFailLensConfig(projectRoot) {
    const configPath = node_path_1.default.join(projectRoot, "faillens.config.js");
    let userConfig = {};
    if (await (0, fs_1.pathExists)(configPath)) {
        try {
            delete require.cache[require.resolve(configPath)];
            const loaded = require(configPath);
            userConfig = ("default" in loaded && loaded.default ? loaded.default : loaded);
        }
        catch (error) {
            throw new Error(`Não foi possível carregar faillens.config.js: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    let manifest = {};
    try {
        manifest = await (0, fs_1.readJsonFile)(node_path_1.default.join(projectRoot, "package.json"));
    }
    catch {
        // A detecção do Cypress emitirá a mensagem adequada se package.json não existir.
    }
    const outputDir = node_path_1.default.resolve(projectRoot, userConfig.outputDir || node_path_1.default.join("reports", "faillens"));
    const maskFields = Array.from(new Set([...sensitiveMask_1.DEFAULT_MASK_FIELDS, ...(userConfig.maskFields || [])]));
    const maskPatterns = Array.from(new Set((userConfig.maskPatterns || []).map((pattern) => pattern instanceof RegExp ? `/${pattern.source}/${pattern.flags}` : String(pattern)).filter(Boolean)));
    return {
        outputDir,
        projectName: userConfig.projectName || manifest.name,
        runId: userConfig.runId,
        branch: userConfig.branch,
        theme: userConfig.theme === "light" ? "light" : "dark",
        maskFields,
        maskPatterns,
        cypressConfigFile: userConfig.cypressConfigFile,
    };
}
//# sourceMappingURL=config.js.map