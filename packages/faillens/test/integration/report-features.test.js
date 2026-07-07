"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");

const { buildReportModel, generateHtml } = require("../../dist");

// Trava as features de UI portadas do protótipo. O detalhe é renderizado pelo
// clientScript no browser, então assertamos sobre o CSS e o script embutidos
// (estáticos) no HTML gerado.

let cached;
async function html() {
  if (cached) return cached;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "faillens-feat-"));
  const report = buildReportModel([], { config: {} });
  const file = await generateHtml(report, dir);
  cached = await fs.readFile(file, "utf8");
  return cached;
}

// ─── Fontes Inter + JetBrains Mono embutidas (standalone) ───────────────────

test("fonte: Inter embutida em base64, sem links externos", async () => {
  const doc = await html();
  assert.match(doc, /@font-face/);
  assert.match(doc, /font-family:\s*'Inter'/);
  assert.match(doc, /data:font\/woff2;base64,/);
  assert.doesNotMatch(doc, /fonts\.googleapis/i);
  assert.doesNotMatch(doc, /src:\s*url\(["']?https?:/i);
});

test("fonte: Inter é a fonte de UI e JetBrains Mono a fonte de código, ambas embutidas", async () => {
  const doc = await html();
  assert.match(doc, /--font-main:\s*'Inter'/);
  assert.match(doc, /--font-code:\s*'JetBrains Mono'/);
  assert.match(doc, /font:\s*var\(--f-body\)/);
  assert.match(doc, /font-family:\s*'JetBrains Mono'/);
});

// ─── Sequência: barra de duração, status textual, métodos, redirects ────────

test("sequência: barra segue protótipo (accent normal, error na chamada falha)", async () => {
  const doc = await html();
  assert.match(doc, /function statusBarClass/);
  assert.match(doc, /\.request-bar\.s2,\s*\.request-bar\.s3,\s*\.request-bar\.s45\s*{[^}]*var\(--accent\)/);
  assert.match(doc, /\.request-bar\.bad\s*{[^}]*var\(--red\)/);
  assert.match(doc, /\.request-bar\.snone\s*{[^}]*var\(--faint\)/);
});

test("sequência: filtro Principais/Todas usa chips de acento sem legenda visual", async () => {
  const doc = await html();
  assert.match(doc, /\.call-filter-btn\.active\s*{[^}]*var\(--accent-soft\)/);
  assert.doesNotMatch(doc, /\.sequence-legend/);
  assert.doesNotMatch(doc, /legend-dot s2"><\/i>2xx/);
});

test("sequência: métodos usam texto mono em acento, sem cores extras fora da paleta", async () => {
  const doc = await html();
  assert.match(doc, /\.request-method\s*{[^}]*var\(--accent\)/);
  assert.doesNotMatch(doc, /#c4b5fd|#f3a6c4/);
});

test("sequência: barra de duração ancorada à esquerda, largura relativa ao maior tempo", async () => {
  const doc = await html();
  assert.match(doc, /function requestRows/);
  assert.match(doc, /maxDuration/);
  assert.match(doc, /\.request-bar\s*{[^}]*left:\s*0/);
});

test("sequência: saltos de redirect inline + limite com 'mostrar mais'", async () => {
  const doc = await html();
  assert.match(doc, /seq-hop-code/);
  assert.match(doc, /data-seq-toggle/);
  assert.match(doc, /Mostrar mais/);
});

// ─── Menu lateral: contadores, colapso de suite e dos que passaram ──────────

test("menu lateral: contadores ✕ / ✓ e colapso de suite", async () => {
  const doc = await html();
  assert.match(doc, /data-spec-toggle/);
  assert.match(doc, /data-passed-toggle/);
  assert.match(doc, /spec-counts/);
  assert.match(doc, /\.cnt-f\s*{[^}]*var\(--red\)/);
  assert.match(doc, /\.cnt-p\s*{[^}]*var\(--green\)/);
  assert.match(doc, /\.cnt-p\.zero\s*{[^}]*var\(--muted\)/);
  assert.match(doc, /\.spec-group\.collapsed/);
});

// ─── Tela de sucesso: largura total + 2 colunas + resumo ────────────────────

test("sucesso: asserções em 2 colunas com resumo e 'mostrar mais'", async () => {
  const doc = await html();
  assert.match(doc, /function successAssertions/);
  assert.match(doc, /assertion-list two-col/);
  assert.match(doc, /assert-summary/);
  assert.match(doc, /\.analysis-grid\.pass-layout\s*{[^}]*1fr/);
  assert.match(doc, /data-assert-toggle/);
});

// ─── Cards Esperado/Recebido: ampliar + modal + rolagem ─────────────────────

test("comparação: botão ampliar, modal e rolagem", async () => {
  const doc = await html();
  assert.match(doc, /function openModal/);
  assert.match(doc, /expand-btn/);
  assert.match(doc, /fl-modal-backdrop/);
  assert.match(doc, /comparison-actions/);
  assert.match(doc, /comparison-scroll/);
  assert.match(doc, /\.comparison-grid\s*{[^}]*min-width:\s*620px/);
  assert.match(doc, /\.comparison-card \.json-lines\s*{[^}]*max-height:\s*340px/);
});

test("motion: tabs, drawer, modal e accordion usam transiÃ§Ãµes do design system", async () => {
  const doc = await html();
  assert.match(doc, /@keyframes panel-fade/);
  assert.match(doc, /\.debug-tab\s*{[^}]*transition:/);
  assert.match(doc, /\.drawer\s*{[^}]*transform:\s*translateX\(100%\)/);
  assert.match(doc, /\.drawer\.open\s*{[^}]*translateX\(0\)/);
  assert.match(doc, /\.fl-modal-backdrop\.open/);
  assert.match(doc, /requestAnimationFrame\(function \(\) \{\s*backdrop\.classList\.add\("open"\)/);
});

test("provas: drawer usa evidencias narrativas em vez de labels internos", async () => {
  const doc = await html();
  assert.match(doc, /function proofEvidenceCards/);
  assert.match(doc, /O teste esperava/);
  assert.match(doc, /A API retornou/);
  assert.match(doc, /O registro foi encontrado depois/);
  assert.match(doc, /Quebrou/);
  assert.match(doc, /GET posterior confirmou que houve persist/);
  assert.match(doc, /function shortProofMessage/);
  assert.doesNotMatch(doc, /Copiar provas/);
});

// ─── Sem regressão de invariante ────────────────────────────────────────────

test("standalone preservado: sem CDN, sem script/link externo", async () => {
  const doc = await html();
  assert.doesNotMatch(doc, /<link[^>]+href="https?:/i);
  assert.doesNotMatch(doc, /<script[^>]+src="https?:/i);
  assert.doesNotMatch(doc, /cdn\./i);
});
