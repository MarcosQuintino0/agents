"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtml = generateHtml;
const node_path_1 = __importDefault(require("node:path"));
const reportTemplate_1 = require("../templates/reportTemplate");
const fs_1 = require("../utils/fs");
async function generateHtml(report, output) {
    const file = node_path_1.default.extname(output).toLowerCase() === ".html" ? output : node_path_1.default.join(output, "index.html");
    await (0, fs_1.writeTextFile)(file, (0, reportTemplate_1.reportTemplate)(report));
    return file;
}
//# sourceMappingURL=generateHtml.js.map