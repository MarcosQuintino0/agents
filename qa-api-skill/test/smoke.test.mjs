import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const cli = path.join(root, "bin", "qa-api-skill.js");

function runCli(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("CLI help prints usage", () => {
  const result = runCli(["help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /graphify:build/);
});

test("CLI doctor does not fail without Graphify", () => {
  const result = runCli(["doctor"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Doctor completed/);
});

test("CLI graphify:doctor warns without failing", () => {
  const result = runCli(["graphify:doctor"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Graphify environment/);
  assert.match(result.stdout, /graphify/);
});

test("package.json exposes bin", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.bin["qa-api-skill"], "./bin/qa-api-skill.js");
  assert.equal(pkg.type, "module");
});

test("SKILL.md has frontmatter", () => {
  const skill = fs.readFileSync(path.join(root, "skill", "qa-api-testing", "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: qa-api-testing\n/);
  assert.match(skill, /description: Creates, reviews, and analyzes/);
});

test("required Graphify references and scripts exist", () => {
  const required = [
    "skill/qa-api-testing/references/graph-discovery.md",
    "skill/qa-api-testing/references/graph-query-playbook.md",
    "skill/qa-api-testing/scripts/graphify-manager.js",
    "skill/qa-api-testing/scripts/graph-provider.js",
  ];
  for (const relativePath of required) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, relativePath);
  }
});
