"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");

const { buildReportModel, generateHtml } = require("../../dist");

// Trava o "visual geral" do relatório: a paleta Midnight Pro/Clean Light (ver
// docs/DESIGN_SYSTEM.md) e a coloração ciente de estado (passou vs. falhou).
// O detalhe é renderizado pelo clientScript no browser, então aqui assertamos
// sobre o CSS e o script embutidos no HTML — que são estáticos e independem
// dos dados.

async function generateDefaultHtml() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "faillens-visual-"));
  const report = buildReportModel([], { config: {} });
  const file = await generateHtml(report, dir);
  return fs.readFile(file, "utf8");
}

let cachedHtml;
async function html() {
  if (!cachedHtml) cachedHtml = await generateDefaultHtml();
  return cachedHtml;
}

// ─── Paleta Midnight Pro (dark) / Clean Light (light) ───────────────────────

test("paleta: tokens semânticos (accent/success/warning/error/info) definidos nos dois temas", async () => {
  const doc = await html();
  const accent = (doc.match(/--accent:/g) || []).length;
  const success = (doc.match(/--green:/g) || []).length;
  const error = (doc.match(/--red:/g) || []).length;
  assert.ok(accent >= 2, `esperava --accent nos dois temas, achei ${accent}`);
  assert.ok(success >= 2, `esperava --green nos dois temas, achei ${success}`);
  assert.ok(error >= 2, `esperava --red nos dois temas, achei ${error}`);
});

test("paleta: verde-soft/linha derivados de --green escuro #3ecf8e e claro #15803d", async () => {
  const doc = await html();
  // dark: rgb de #3ecf8e
  assert.match(doc, /--green-soft:\s*rgba\(62,\s*207,\s*142,\s*\.14\)/);
  // light: rgb de #15803d
  assert.match(doc, /--green-soft:\s*rgba\(21,\s*128,\s*61,\s*\.1\)/);
});

test("paleta: acento é azul-petróleo, não mais violeta", async () => {
  const doc = await html();
  assert.match(doc, /--accent:\s*#35c3d1/);
  assert.match(doc, /--accent:\s*#0f8a96/);
  assert.doesNotMatch(doc, /--violet/);
  assert.doesNotMatch(doc, /#9b8cfa|#5b3fd6/);
});

test("paleta: método na timeline usa acento de marca, como no protótipo", async () => {
  const doc = await html();
  assert.match(doc, /\.request-method\s*{[^}]*var\(--accent\)/);
  assert.doesNotMatch(doc, /\.request-method\.options\s*{[^}]*#c4b5fd/);
});

// ─── CSS ciente de estado ──────────────────────────────────────────────────

test("estado: card Recebido divergente permanece neutro e destaca erro só em chips/tokens", async () => {
  const doc = await html();
  assert.match(doc, /\.comparison-card\.received\.failed\s*{[^}]*background:\s*var\(--surface-soft\)/);
  assert.match(doc, /\.comparison-card\.received\.failed\s+\.comparison-head\s*{[^}]*background:\s*transparent/);
  assert.match(doc, /\.comparison-card\.received\.passed\s*{[^}]*border-color:\s*var\(--line\)/);
  // garante que NÃO existe mais a regra incondicional antiga
  assert.doesNotMatch(doc, /\.comparison-card\.received\s+\.comparison-head\s*{/);
});

test("estado: overview strip usa chip de status ok/bad conforme o resultado", async () => {
  const doc = await html();
  assert.match(doc, /overview-strip/);
  assert.match(doc, /status-chip ok/);
  assert.match(doc, /status-chip\.ok\s*{[^}]*var\(--green\)/);
  assert.match(doc, /status-chip\.bad\s*{[^}]*var\(--red\)/);
});

test("estado: banner verde para teste aprovado", async () => {
  const doc = await html();
  assert.match(doc, /\.failure-banner\.passed\s*{[^}]*var\(--green-line\)/);
});

test("estado: nota de contrato (match-note) estilizada em verde", async () => {
  const doc = await html();
  assert.match(doc, /\.match-note\s*{[^}]*var\(--green\)/);
});

// ─── Tela de sucesso no clientScript ────────────────────────────────────────

test("sucesso: analysisSections substituiu failureSections", async () => {
  const doc = await html();
  assert.match(doc, /function analysisSections/);
  assert.doesNotMatch(doc, /function failureSections/);
});

test("sucesso: ramo de teste aprovado renderiza seção verde de validação", async () => {
  const doc = await html();
  assert.match(doc, /Resposta validada/);
  assert.match(doc, /contrato satisfeito/);
  assert.match(doc, /Todas as asserções passaram/);
  assert.match(doc, /received passed/);
});

test("sucesso: falha continua mostrando 'Esperado vs. recebido' e banner de assertion", async () => {
  const doc = await html();
  assert.match(doc, /Esperado vs\. recebido/);
  assert.match(doc, /Assertion falhou/);
  assert.match(doc, /received failed/);
});

// ─── Tipografia: Inter para UI, JetBrains Mono para código ──────────────────

test("tipografia: Inter é a família principal, JetBrains Mono fica reservada a código/dados", async () => {
  const doc = await html();
  assert.match(doc, /--font-main:\s*'Inter'/);
  assert.match(doc, /--font-code:\s*'JetBrains Mono'/);
  assert.match(doc, /--f-display:\s*800 19px\/1\.3 var\(--font-main\)/);
  assert.match(doc, /--f-data:\s*500 12px\/1\.75 var\(--font-code\)/);
});

// ─── Shell: altura fixa + sidebar colapsável ────────────────────────────────

test("shell: layout ocupa 100% da viewport com scroll interno na sidebar e no main", async () => {
  const doc = await html();
  assert.match(doc, /\.report-shell\s*{[^}]*height:\s*100%/);
  assert.match(doc, /\.sidebar\s*{[^}]*overflow-y:\s*auto/);
  assert.match(doc, /\.main\s*{[^}]*overflow-y:\s*auto/);
  assert.match(doc, /sidebar-collapsed/);
  assert.match(doc, /sidebar-collapse/);
});

// ─── Diagnóstico rico: provas, regra/impacto, timeline em accordion ─────────

test("diagnóstico: provas do teste (facts) e card de regra/impacto quando os dados existem", async () => {
  const doc = await html();
  assert.match(doc, /function proofsHtml/);
  assert.match(doc, /function ruleImpactHtml/);
  assert.match(doc, /Provas do diagnóstico/);
  assert.match(doc, /\.drawer-body\s*{[^}]*padding:\s*var\(--sp-4\)/);
  assert.match(doc, /\.drawer \.proof-item\s*{[^}]*gap:\s*normal/);
  assert.match(doc, /\.drawer \.pill\s*{[^}]*font-size:\s*8\.5px/);
  assert.doesNotMatch(doc, /\.drawer \.proof-b\s*{[^}]*font-size:\s*15\.5px/);
});

test("timeline: accordion com filtro Principais/Todas substitui a antiga aba 'Chamada selecionada'", async () => {
  const doc = await html();
  assert.match(doc, /Linha do tempo das chamadas/);
  assert.match(doc, /data-call-filter="important"/);
  assert.match(doc, /data-call-filter="all"/);
  assert.match(doc, /\.accordion-body\s*{[^}]*max-height:\s*0/);
  assert.match(doc, /\.accordion\.open \.accordion-body\s*{[^}]*max-height:\s*960px/);
  assert.doesNotMatch(doc, /Chamada selecionada/);
});

test("pulado: cenário dedicado sem overview nem abas", async () => {
  const doc = await html();
  assert.match(doc, /function skipCardHtml/);
  assert.match(doc, /skip-card/);
});
