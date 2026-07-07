"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportArtifacts = generateReportArtifacts;
exports.loadPartialSpecs = loadPartialSpecs;
exports.registerNodeEvents = registerNodeEvents;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const requestStore_1 = require("../collector/requestStore");
const buildReportModel_1 = require("../reporter/buildReportModel");
const generateHtml_1 = require("../reporter/generateHtml");
const generateJson_1 = require("../reporter/generateJson");
const fs_1 = require("../utils/fs");
const extractSourceAssertions_1 = require("../collector/extractSourceAssertions");
const extractTestTags_1 = require("../collector/extractTestTags");
const parseContractJsdoc_1 = require("../collector/parseContractJsdoc");
const screenshotEvidence_1 = require("./screenshotEvidence");
// Resolve as tags de catálogo (CatalogoTags.X) lendo o módulo de tags importado
// pelo spec e mapeando constante -> valor real declarado. Determinístico e
// degradável: se o módulo não for encontrado/parseável, as tags de catálogo
// simplesmente não resolvem (as tags string como "@bug" já foram capturadas).
async function resolveCatalogTags(planned, source, specFile) {
    const objects = new Set();
    for (const test of planned)
        for (const ref of test.catalogRefs)
            objects.add(ref.object);
    if (!objects.size)
        return;
    const maps = new Map();
    for (const object of objects) {
        const importPath = (0, extractTestTags_1.findImportSource)(source, object);
        if (!importPath || !importPath.startsWith("."))
            continue;
        const base = node_path_1.default.resolve(node_path_1.default.dirname(specFile), importPath);
        const candidates = [base, `${base}.js`, `${base}.ts`, node_path_1.default.join(base, "index.js")];
        for (const candidate of candidates) {
            try {
                const moduleSource = await node_fs_1.promises.readFile(candidate, "utf8");
                const parsed = (0, extractTestTags_1.parseCatalogModule)(moduleSource);
                if (parsed.size) {
                    maps.set(object, parsed);
                    break;
                }
            }
            catch {
                // tenta o próximo candidato
            }
        }
    }
    for (const test of planned) {
        for (const ref of test.catalogRefs) {
            const value = maps.get(ref.object)?.get(ref.name);
            if (value && !test.tags.includes(value))
                test.tags.unshift(value);
        }
    }
}
function resultFileName(specPath) {
    let hash = 5381;
    for (const character of specPath)
        hash = ((hash << 5) + hash) ^ character.charCodeAt(0);
    return `spec-${(hash >>> 0).toString(36)}.json`;
}
async function generateReportArtifacts(specs, outputDir, config = {}) {
    const report = (0, buildReportModel_1.buildReportModel)(specs, { config });
    await (0, fs_1.ensureDir)(outputDir);
    await Promise.all([(0, generateJson_1.generateJson)(report, outputDir), (0, generateHtml_1.generateHtml)(report, outputDir)]);
    return report;
}
async function loadPartialSpecs(resultsDir) {
    if (!(await (0, fs_1.pathExists)(resultsDir)))
        return [];
    const names = (await node_fs_1.promises.readdir(resultsDir)).filter((name) => name.endsWith(".json")).sort();
    const byPath = new Map();
    for (const name of names) {
        try {
            const spec = await (0, fs_1.readJsonFile)(node_path_1.default.join(resultsDir, name));
            if (spec?.specPath && Array.isArray(spec.tests))
                byPath.set(spec.specPath, spec);
        }
        catch {
            // Um parcial corrompido não impede que os demais specs gerem relatório.
        }
    }
    return Array.from(byPath.values());
}
function registerNodeEvents(on, cypressConfig, options) {
    const store = new requestStore_1.RequestStore(options.config.maskFields, options.config.maskPatterns);
    const screenshots = [];
    const screenshotsFolder = node_path_1.default.resolve(options.projectRoot, typeof cypressConfig.screenshotsFolder === "string"
        ? cypressConfig.screenshotsFolder
        : "cypress/screenshots");
    on("task", {
        "faillens:setTest": (payload) => store.setTest(payload),
        "faillens:addRequest": (payload) => store.addRequest(payload),
        "faillens:finishRequest": (payload) => store.finishRequest(payload),
        "faillens:setTestResult": (payload) => store.setTestResult(payload),
    });
    on("after:screenshot", (details) => {
        const capture = (0, screenshotEvidence_1.captureScreenshotMetadata)(details, {
            projectRoot: options.projectRoot,
            screenshotsFolder,
            outputDir: options.outputDir,
        });
        if (capture)
            screenshots.push(capture);
    });
    on("after:spec", async (spec, results) => {
        const partial = store.mergeAfterSpec(spec, results);
        const resultTests = Array.isArray(results?.tests) ? results.tests.map((item) => item) : [];
        const candidates = partial.tests.map((test) => {
            const fullTitle = (test.titlePath?.length ? test.titlePath : [test.title]).join(" > ");
            const result = resultTests.find((item) => {
                const title = Array.isArray(item.title) ? item.title.map(String).join(" > ") : String(item.title || "");
                return title === fullTitle || title === test.title;
            });
            return {
                id: test.id,
                specPath: partial.specPath,
                title: test.title,
                titlePath: test.titlePath,
                state: test.state,
                attempts: Array.isArray(result?.attempts)
                    ? result.attempts.map((item) => item)
                    : [],
            };
        });
        const associated = (0, screenshotEvidence_1.associateScreenshots)(candidates, screenshots.splice(0));
        for (const [testId, metadata] of associated)
            store.setTestScreenshots(partial.specPath, testId, metadata);
        const specFile = String(spec.absolute || node_path_1.default.resolve(options.projectRoot, partial.specPath));
        try {
            const source = await node_fs_1.promises.readFile(specFile, "utf8");
            store.mergeSourceAssertions(partial.specPath, (0, extractSourceAssertions_1.extractSourceAssertions)(source, specFile));
            const planned = (0, extractTestTags_1.extractTestTags)(source);
            await resolveCatalogTags(planned, source, specFile);
            store.mergeTestTags(partial.specPath, planned);
            store.mergeContract(partial.specPath, (0, parseContractJsdoc_1.parseContractJsdoc)(source, partial.specPath));
        }
        catch {
            // O relatório continua válido quando o spec não está disponível para leitura estática.
        }
        const enriched = store.snapshotSpec(partial.specPath);
        await (0, fs_1.writeJsonFile)(node_path_1.default.join(options.resultsDir, resultFileName(enriched.specPath)), enriched);
    });
    on("after:run", async () => {
        if (options.generateOnAfterRun === false)
            return;
        const specs = store.snapshot();
        await generateReportArtifacts(specs, options.outputDir, options.config);
        console.log(`[FailLens] Relatório gerado em ${node_path_1.default.join(options.outputDir, "index.html")}`);
    });
    return cypressConfig;
}
//# sourceMappingURL=registerNodeEvents.js.map