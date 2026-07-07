"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const node_path_1 = __importDefault(require("node:path"));
const fs_1 = require("../utils/fs");
async function initCommand(projectRoot = process.cwd()) {
    const packagePath = node_path_1.default.join(projectRoot, "package.json");
    let manifest;
    try {
        manifest = await (0, fs_1.readJsonFile)(packagePath);
    }
    catch {
        throw new Error(`Não foi possível abrir ${packagePath}. Execute o comando na raiz do projeto.`);
    }
    manifest.scripts ||= {};
    if (manifest.scripts["test:report"]) {
        console.log('[FailLens] O script "test:report" já existe; nenhuma alteração foi feita.');
        return 0;
    }
    manifest.scripts["test:report"] = "faillens run";
    await (0, fs_1.writeJsonFile)(packagePath, manifest);
    console.log('[FailLens] Pronto! Adicionamos "test:report": "faillens run" ao package.json.');
    console.log("[FailLens] Execute: npm run test:report");
    return 0;
}
//# sourceMappingURL=init.js.map