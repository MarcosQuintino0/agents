import type { FailLensReport } from "../types/report";
import { clientScript } from "./clientScript";
import { embeddedFont } from "./embeddedFont";
import { styles } from "./styles";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function safeEmbeddedJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const pad = (value: number): string => String(value).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

const icon = (path: string): string => `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">${path}</svg></span>`;
const moonIcon = icon('<path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z"></path>');
const sunIcon = icon('<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>');
const downloadIcon = icon('<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>');
const searchIcon = icon('<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>');
const chevronLeftIcon = icon('<polyline points="15 6 9 12 15 18"></polyline>');

export function reportTemplate(report: FailLensReport): string {
  const project = report.project?.name || report.specs[0]?.specPath || "Projeto Cypress";
  const theme = report.theme === "light" ? "light" : "dark";
  const meta = [formatDate(report.generatedAt), report.project?.branch, `faillens ${report.tool.version}`]
    .filter(Boolean).join(" · ");
  return `<!doctype html>
<html lang="pt-BR" data-theme="${theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' data:; font-src data:; img-src 'self' data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="generator" content="FailLens ${escapeHtml(String(report.tool.version))}">
  <title>${escapeHtml(project)} · FailLens</title>
  <style>${embeddedFont}</style>
  <style>${styles}</style>
</head>
<body>
  <div class="page">
    <div class="report-shell">
      <header class="topbar">
        <div>
          <h1 class="report-title">FailLens · ${escapeHtml(project)}</h1>
          <p class="topbar-meta">${escapeHtml(meta)}</p>
        </div>
        <div class="metrics-row">
          <span class="metrics-text"><strong class="mn-neutral">${report.summary.tests}</strong> Total<span class="metrics-sep">·</span><strong class="mn-success">${report.summary.passed}</strong> Aprovados<span class="metrics-sep">·</span><strong class="mn-error">${report.summary.failed}</strong> Falhas<span class="metrics-sep">·</span><strong class="mn-warning">${report.summary.skipped}</strong> Pulados<span class="metrics-sep">·</span><strong class="mn-neutral">${Math.round(report.summary.passRate * 10) / 10}%</strong> Sucesso</span>
          <button id="theme-toggle" class="icon-btn" aria-label="Alternar tema" title="Alternar tema"><span class="theme-symbol icon-sun">${sunIcon}</span><span class="theme-symbol icon-moon">${moonIcon}</span></button>
          <button id="export-report" class="icon-btn" aria-label="Exportar relatório" title="Exportar relatório">${downloadIcon}</button>
        </div>
      </header>
      <div class="workspace">
        <aside class="sidebar">
          <div class="sidebar-top-row">
            <div class="sidebar-content search-wrap"><span>${searchIcon}</span><input id="filter" class="search" type="search" placeholder="Buscar teste, endpoint ou tag…" aria-label="Filtrar testes"><button id="clear-filter" class="search-clear" type="button" aria-label="Limpar busca" title="Limpar busca" hidden>×</button></div>
            <button id="sidebar-collapse" class="collapse-btn" aria-label="Recolher menu lateral" title="Recolher menu lateral">${chevronLeftIcon}</button>
          </div>
          <div class="sidebar-content">
            <div class="chips" id="filter-chips">
              <button class="chip active" data-mode="all">Tudo · ${report.summary.tests}</button>
              <button class="chip" data-mode="failed">Falhas · ${report.summary.failed}</button>
              ${report.summary.passed ? `<button class="chip" data-mode="passed">Aprovados · ${report.summary.passed}</button>` : ""}
              ${report.summary.skipped ? `<button class="chip" data-mode="skipped">Pulados · ${report.summary.skipped}</button>` : ""}
            </div>
            <button id="only-failures" class="only-failures-row" aria-pressed="false"><span>Mostrar somente falhas</span><span class="switch-track"><i class="switch-thumb"></i></span></button>
            <div class="expand-all-row"><button id="expand-all" class="expand-all-btn">Expandir tudo</button></div>
            <div id="test-list"></div>
          </div>
        </aside>
        <main id="detail" class="main"></main>
      </div>
    </div>
  </div>
  <div id="toast" class="toast" role="status"></div>
  <script id="faillens-data" type="application/json">${safeEmbeddedJson(report)}</script>
  <script>${clientScript}</script>
</body>
</html>\n`;
}
