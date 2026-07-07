"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstrumentedConfig = createInstrumentedConfig;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const fs_1 = require("../utils/fs");
async function createInstrumentedConfig(project, config) {
    const workDir = node_path_1.default.join(project.projectRoot, ".faillens");
    const resultsDir = node_path_1.default.join(workDir, "results");
    const configPath = node_path_1.default.join(workDir, "cypress.config.generated.js");
    const supportPath = node_path_1.default.join(workDir, "support.generated.js");
    await (0, fs_1.ensureDir)(workDir);
    await node_fs_1.promises.rm(resultsDir, { recursive: true, force: true });
    await (0, fs_1.ensureDir)(resultsDir);
    await (0, fs_1.writeTextFile)(node_path_1.default.join(workDir, "package.json"), '{"type":"commonjs","private":true}\n');
    const hooksModule = require.resolve("./support/hooks");
    const captureModule = require.resolve("./support/autoCapture");
    const registerModule = require.resolve("./registerNodeEvents");
    const supportSource = [
        '"use strict";',
        project.supportPath ? `require(${JSON.stringify(project.supportPath)});` : "",
        `const { installFailLensHooks } = require(${JSON.stringify(hooksModule)});`,
        `const { installAutoCapture } = require(${JSON.stringify(captureModule)});`,
        "installFailLensHooks();",
        "installAutoCapture();",
        "",
    ].filter(Boolean).join("\n");
    await (0, fs_1.writeTextFile)(supportPath, supportSource);
    const runtimeOptions = {
        projectRoot: project.projectRoot,
        resultsDir,
        outputDir: config.outputDir,
        config,
        generateOnAfterRun: false,
    };
    const configSource = `"use strict";
const loaded = require(${JSON.stringify(project.configPath)});
const original = loaded && loaded.default ? loaded.default : loaded;
const { registerNodeEvents } = require(${JSON.stringify(registerModule)});
const originalE2e = original.e2e || {};
const originalSetup = originalE2e.setupNodeEvents;

function collector(realOn) {
  const events = new Map();
  const collect = (name, handler) => {
    const handlers = events.get(name) || [];
    handlers.push(handler);
    events.set(name, handlers);
  };
  const flush = () => {
    for (const [name, handlers] of events) {
      if (name === "task") {
        realOn(name, Object.assign({}, ...handlers));
      } else if (handlers.length === 1) {
        realOn(name, handlers[0]);
      } else {
        realOn(name, (...args) => {
          let last;
          let pending;
          for (const handler of handlers) {
            if (pending) pending = pending.then(async (previous) => {
              const value = await handler(...args);
              return value === undefined ? previous : value;
            });
            else {
              const value = handler(...args);
              if (value && typeof value.then === "function") pending = Promise.resolve(value);
              else if (value !== undefined) last = value;
            }
          }
          return pending ? pending.then((value) => value === undefined ? last : value) : last;
        });
      }
    }
  };
  return { collect, flush };
}

module.exports = {
  ...original,
  e2e: {
    ...originalE2e,
    supportFile: ${JSON.stringify(supportPath)},
    setupNodeEvents(on, config) {
      const events = collector(on);
      const attach = (resolved) => {
        const effectiveConfig = resolved && typeof resolved === "object" ? resolved : config;
        effectiveConfig.supportFile = ${JSON.stringify(supportPath)};
        if (effectiveConfig.e2e && typeof effectiveConfig.e2e === "object") {
          effectiveConfig.e2e.supportFile = ${JSON.stringify(supportPath)};
        }
        registerNodeEvents(events.collect, effectiveConfig, ${JSON.stringify(runtimeOptions)});
        events.flush();
        return effectiveConfig;
      };
      if (typeof originalSetup !== "function") return attach(config);
      const result = originalSetup(events.collect, config);
      return result && typeof result.then === "function" ? result.then(attach) : attach(result);
    }
  }
};
`;
    await (0, fs_1.writeTextFile)(configPath, configSource);
    return { workDir, configPath, supportPath, resultsDir };
}
//# sourceMappingURL=createInstrumentedConfig.js.map