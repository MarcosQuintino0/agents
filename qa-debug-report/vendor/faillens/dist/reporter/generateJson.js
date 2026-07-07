"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJson = generateJson;
const node_path_1 = __importDefault(require("node:path"));
const fs_1 = require("../utils/fs");
async function generateJson(report, output) {
    const file = node_path_1.default.extname(output).toLowerCase() === ".json"
        ? output
        : node_path_1.default.join(output, "faillens-report.json");
    await (0, fs_1.writeJsonFile)(file, report);
    return file;
}
//# sourceMappingURL=generateJson.js.map