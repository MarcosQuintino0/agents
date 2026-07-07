"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathExists = pathExists;
exports.ensureDir = ensureDir;
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
exports.writeTextFile = writeTextFile;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
async function pathExists(target) {
    try {
        await node_fs_1.promises.access(target);
        return true;
    }
    catch {
        return false;
    }
}
async function ensureDir(directory) {
    await node_fs_1.promises.mkdir(directory, { recursive: true });
}
async function readJsonFile(file) {
    const content = await node_fs_1.promises.readFile(file, "utf8");
    return JSON.parse(content);
}
async function writeJsonFile(file, value) {
    await ensureDir(node_path_1.default.dirname(file));
    const temporary = `${file}.${process.pid}.tmp`;
    await node_fs_1.promises.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await node_fs_1.promises.rename(temporary, file);
}
async function writeTextFile(file, value) {
    await ensureDir(node_path_1.default.dirname(file));
    await node_fs_1.promises.writeFile(file, value, "utf8");
}
//# sourceMappingURL=fs.js.map