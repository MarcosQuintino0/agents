"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CYPRESS_NOT_FOUND_MESSAGE = void 0;
exports.detectCypress = detectCypress;
const node_path_1 = __importDefault(require("node:path"));
const fs_1 = require("../utils/fs");
exports.CYPRESS_NOT_FOUND_MESSAGE = "Não foi possível detectar um projeto Cypress. Nesta versão, FailLens suporta apenas Cypress E2E com cypress.config.js.";
async function detectCypress(projectRoot = process.cwd(), configuredFile) {
    const root = node_path_1.default.resolve(projectRoot);
    const packageJsonPath = node_path_1.default.join(root, "package.json");
    if (!(await (0, fs_1.pathExists)(packageJsonPath)))
        throw new Error(exports.CYPRESS_NOT_FOUND_MESSAGE);
    const manifest = await (0, fs_1.readJsonFile)(packageJsonPath);
    const hasDependency = [
        manifest.dependencies,
        manifest.devDependencies,
        manifest.optionalDependencies,
        manifest.peerDependencies,
    ].some((dependencies) => Boolean(dependencies?.cypress));
    const configPath = node_path_1.default.resolve(root, configuredFile || "cypress.config.js");
    const cypressDir = node_path_1.default.join(root, "cypress");
    if (!hasDependency || !(await (0, fs_1.pathExists)(configPath)) || !(await (0, fs_1.pathExists)(cypressDir))) {
        throw new Error(exports.CYPRESS_NOT_FOUND_MESSAGE);
    }
    const supportCandidates = [
        node_path_1.default.join(cypressDir, "support", "e2e.js"),
        node_path_1.default.join(cypressDir, "support", "index.js"),
    ];
    let supportPath;
    for (const candidate of supportCandidates) {
        if (await (0, fs_1.pathExists)(candidate)) {
            supportPath = candidate;
            break;
        }
    }
    return {
        projectRoot: root,
        packageJsonPath,
        configPath,
        cypressDir,
        supportPath,
        outputDir: node_path_1.default.join(root, "reports", "faillens"),
    };
}
//# sourceMappingURL=detectCypress.js.map