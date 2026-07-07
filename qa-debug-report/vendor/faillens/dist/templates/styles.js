"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = void 0;
exports.styles = String.raw `
:root {
  color-scheme: dark;
  --page: #0b0e14;
  --shell: #0b0e14;
  --sidebar: #0e121a;
  --surface: #131720;
  --surface-raised: #1a2029;
  --surface-soft: #0e121a;
  --line: #212836;
  --line-strong: #2c3444;
  --text: #e8ecf4;
  --muted: #8b93a7;
  --faint: #566072;
  --accent: #35c3d1;
  --accent-soft: rgba(53, 195, 209, .16);
  --accent-line: rgba(53, 195, 209, .34);
  --on-accent: #08191c;
  --green: #3ecf8e;
  --green-soft: rgba(62, 207, 142, .14);
  --green-line: rgba(62, 207, 142, .3);
  --red: #ef5b6f;
  --red-soft: rgba(239, 91, 111, .15);
  --red-line: rgba(239, 91, 111, .34);
  --amber: #e3a13c;
  --amber-soft: rgba(227, 161, 60, .14);
  --amber-line: rgba(227, 161, 60, .3);
  --info: #5b9bff;
  --info-soft: rgba(91, 155, 255, .14);
  --info-line: rgba(91, 155, 255, .3);
  --pending: var(--faint);
  --running: var(--accent);
  --flaky: var(--amber);
  --skipped: var(--muted);
  --code: var(--surface-soft);
  --track-faint: rgba(255, 255, 255, .08);
  --divider-faint: rgba(255, 255, 255, .06);
  --shadow-card: 0 1px 4px rgba(0, 0, 0, .28);
  --shadow-drawer: -20px 0 60px rgba(0, 0, 0, .4);
  --shadow-modal: 0 24px 80px rgba(0, 0, 0, .5);
  --shadow-1: var(--shadow-card);
  --shadow-2: var(--shadow-modal);
  --font-main: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-code: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
  --mono: var(--font-code);
  --font-ui: var(--font-main);
  --f-display: 800 19px/1.3 var(--font-main);
  --f-h3: 800 15.5px/1.4 var(--font-main);
  --f-h4: 700 13px/1.3 var(--font-main);
  --f-subtitle: 400 10px/1.4 var(--font-main);
  --f-body: 400 12px/1.65 var(--font-main);
  --f-label: 500 11px/1.4 var(--font-main);
  --f-micro: 800 9.5px/1.3 var(--font-main);
  --f-badge: 800 10px/1 var(--font-code);
  --f-data-lg: 700 22px/1.15 var(--font-code);
  --f-data: 500 12px/1.75 var(--font-code);
  --f-file: 400 9.5px/1.3 var(--font-code);
  --f-meta: 400 10.5px/1.4 var(--font-code);
  --f-topbar-title: 800 16px/1.3 var(--font-main);
  --f-metrics: 400 11.5px/1.4 var(--font-main);
  --f-search: 400 12.5px/1.4 var(--font-main);
  --f-overview-num: 800 16px/1.15 var(--font-main);
  --f-overview-text: 400 11px/1.4 var(--font-main);
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 40px;
  --sidebar-w: 280px;
  --sidebar-w-collapsed: 60px;
}
[data-theme="light"] {
  color-scheme: light;
  --page: #f4f4f8;
  --shell: #f4f4f8;
  --sidebar: #eef0f5;
  --surface: #ffffff;
  --surface-raised: #f4f4f9;
  --surface-soft: #eef0f5;
  --line: #dcdce6;
  --line-strong: #c5c5d6;
  --text: #181923;
  --muted: #5d5f74;
  --faint: #8d8fa3;
  --accent: #0f8a96;
  --accent-soft: rgba(15, 138, 150, .1);
  --accent-line: rgba(15, 138, 150, .28);
  --on-accent: #ffffff;
  --green: #15803d;
  --green-soft: rgba(21, 128, 61, .1);
  --green-line: rgba(21, 128, 61, .26);
  --red: #c23a5c;
  --red-soft: rgba(194, 58, 92, .1);
  --red-line: rgba(194, 58, 92, .26);
  --amber: #946217;
  --amber-soft: rgba(148, 98, 23, .1);
  --amber-line: rgba(148, 98, 23, .26);
  --info: #2557c7;
  --info-soft: rgba(37, 87, 199, .1);
  --info-line: rgba(37, 87, 199, .26);
  --code: var(--surface-soft);
  --track-faint: rgba(20, 20, 30, .08);
  --divider-faint: rgba(20, 20, 30, .08);
  --shadow-card: 0 1px 3px rgba(20, 20, 30, .08);
  --shadow-drawer: -20px 0 60px rgba(20, 20, 30, .12);
  --shadow-modal: 0 24px 60px rgba(20, 20, 30, .16);
  --shadow-1: var(--shadow-card);
  --shadow-2: var(--shadow-modal);
}
* { box-sizing: border-box; }
::selection { background: var(--accent-soft); }
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
html { min-width: 320px; background: var(--page); height: 100%; }
body { margin: 0; height: 100%; overflow: hidden; color: var(--text); background: var(--page); font-family: var(--font-main); font-size: 13px; }
button, input { font: inherit; }
button { color: inherit; }
.icon { width: 15px; height: 15px; display: inline-block; flex: 0 0 auto; vertical-align: -3px; }
.icon svg { width: 100%; height: 100%; display: block; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; fill: none; }
[data-scroll] { scrollbar-width: thin; }
[data-scroll]::-webkit-scrollbar { width: 9px; height: 9px; }
[data-scroll]::-webkit-scrollbar-track { background: transparent; }
[data-scroll]::-webkit-scrollbar-thumb { border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; background: rgba(128, 128, 128, .28); }
[data-scroll]::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, .4); background-clip: padding-box; }
.page { height: 100%; }
.report-shell { height: 100%; display: flex; flex-direction: column; background: var(--shell); }
.topbar { flex: 0 0 auto; padding: 14px var(--sp-6); display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 20px; border-bottom: 1px solid var(--line); }
.detail-meta, .detail-state, .chips, .spec-heading, .assertion-title, .request-top, .code-head { display: flex; align-items: center; }
.report-title { margin: 0; font: var(--f-topbar-title); letter-spacing: -.02em; }
.topbar-meta { margin: 3px 0 0; color: var(--muted); font: var(--f-meta); }
.metrics-row { display: flex; align-items: center; gap: 14px; }
.metrics-text { color: var(--muted); font: var(--f-metrics); }
.metrics-sep { color: var(--faint); margin: 0 6px; }
.metrics-text strong { font-weight: 800; }
.mn-neutral { color: var(--text); }
.mn-success { color: var(--green); }
.mn-error { color: var(--red); }
.mn-warning { color: var(--amber); }
.icon-sun, .icon-moon { display: none; }
[data-theme="dark"] .icon-sun { display: inline-flex; }
[data-theme="light"] .icon-moon { display: inline-flex; }
.button { min-height: 34px; display: inline-flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-soft); color: var(--text); font: var(--f-label); cursor: pointer; transition: all .15s ease-out; }
.button:hover { border-color: var(--accent); color: var(--text); }
.button:active { transform: scale(.98); }
.button:focus-visible, .chip:focus-visible, .copy-button:focus-visible, .request-curl:focus-visible, .debug-tab:focus-visible, .test-item:focus-visible, .spec-heading:focus-visible, .passed-toggle:focus-visible, .more-btn:focus-visible, .evidence-link:focus-visible, .expand-btn:focus-visible, .fl-modal-close:focus-visible, .icon-btn:focus-visible, .drawer-close:focus-visible, .collapse-btn:focus-visible, .search-clear:focus-visible { outline: 0; box-shadow: 0 0 0 2px var(--accent-soft), 0 0 0 1px var(--accent); }
.theme-symbol { color: var(--muted); }
.icon-btn { width: 34px; height: 34px; border: 1px solid var(--line); background: var(--surface-soft); border-radius: 8px; display: grid; place-items: center; cursor: pointer; }
.icon-btn:hover { border-color: var(--accent); }
.workspace { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); transition: grid-template-columns .18s ease-out; }
.report-shell.sidebar-collapsed .workspace { grid-template-columns: var(--sidebar-w-collapsed) minmax(0, 1fr); }
.sidebar { min-height: 0; overflow-y: auto; overflow-x: hidden; padding: var(--sp-3); border-right: 1px solid var(--line); background: var(--sidebar); }
.report-shell.sidebar-collapsed .sidebar { padding: var(--sp-4) var(--sp-2); overflow: visible; }
.report-shell.sidebar-collapsed .sidebar-content { display: none; }
.sidebar-top-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.collapse-btn { flex-shrink: 0; width: 36px; height: 36px; border: 1px solid var(--line); background: var(--surface); border-radius: 8px; display: grid; place-items: center; cursor: pointer; }
.collapse-btn:hover { border-color: var(--accent); }
.search-wrap { position: relative; flex: 1; min-width: 0; height: 36px; display: flex; align-items: center; gap: var(--sp-2); padding: 0 30px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
.search-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft), 0 0 0 1px var(--accent); }
.search-wrap > span { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--faint); }
.search { width: 100%; border: 0; outline: 0; background: transparent; color: var(--text); font: var(--f-search); }
.search::placeholder { color: var(--faint); }
.search-clear { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: grid; place-items: center; border: 0; border-radius: 50%; background: transparent; color: var(--faint); font: var(--f-label); cursor: pointer; }
.search-clear:hover { background: var(--surface-soft); color: var(--text); }
.search-clear[hidden] { display: none; }
.chips { gap: 6px; margin: 12px 0 12px; flex-wrap: wrap; }
.chip { padding: 5px 8px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--muted); font: var(--f-badge); font-family: var(--font-main); font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.chip:hover { border-color: var(--line-strong); color: var(--text); }
.chip.active[data-mode="failed"] { border-color: var(--red-line); background: var(--red-soft); color: var(--red); }
.chip.active[data-mode="all"] { border-color: var(--accent-line); background: var(--accent-soft); color: var(--accent); }
.chip.active[data-mode="passed"] { border-color: var(--green-line); background: var(--green-soft); color: var(--green); }
.chip.active[data-mode="skipped"] { border-color: var(--amber-line); background: var(--amber-soft); color: var(--amber); }
.only-failures-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 2px 0 10px; padding: 8px 2px 12px; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: var(--muted); font: 400 10.5px/1.4 var(--font-main); cursor: pointer; }
.switch-track { position: relative; width: 30px; height: 17px; flex: 0 0 auto; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-soft); transition: all .15s ease-out; }
.switch-thumb { position: absolute; left: 2px; top: 2px; width: 11px; height: 11px; border-radius: 50%; background: var(--faint); transition: left .15s ease-out, background .15s ease-out; }
.only-failures-row[aria-pressed="true"] .switch-track { border-color: var(--red-line); background: var(--red-soft); }
.only-failures-row[aria-pressed="true"] .switch-thumb { left: 16px; background: var(--red); }
.expand-all-row { display: flex; justify-content: flex-end; margin-bottom: 10px; }
.expand-all-btn { padding: 0; border: 0; background: transparent; color: var(--accent); font: var(--f-label); font-size: 10.5px; font-weight: 700; cursor: pointer; }
.expand-all-btn:hover { text-decoration: underline; }
.spec-group { margin: 0 0 18px; padding-top: 14px; border-top: 1px solid var(--divider-faint); }
.spec-group:first-child { padding-top: 0; border-top: 0; }
.spec-group:last-child { margin-bottom: 4px; }
.spec-heading { width: 100%; justify-content: flex-start; gap: 0; margin: 0 0 4px; padding: 5px 8px 6px; border: 0; border-radius: var(--r-sm); background: transparent; color: var(--muted); cursor: pointer; user-select: none; transition: background .12s ease; }
.spec-heading:hover { background: var(--surface); }
.spec-chev { display: inline-block; margin-right: 7px; color: var(--muted); font: var(--f-label); transition: transform .2s ease, color .12s ease; }
.spec-group.collapsed .spec-chev { transform: rotate(-90deg); }
.spec-heading:hover .spec-name, .spec-heading:hover .spec-chev { color: var(--text); }
.spec-name { overflow: hidden; font: var(--f-badge); font-weight: 800; font-family: var(--font-main); letter-spacing: .06em; text-transform: uppercase; text-overflow: ellipsis; white-space: nowrap; }
.cnt-s { color: var(--amber); }
.spec-counts { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font: var(--f-badge); letter-spacing: .02em; white-space: nowrap; flex-shrink: 0; }
.spec-counts .cnt-f { color: var(--red); display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }
.spec-counts .cnt-p { color: var(--green); display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }
.spec-counts .cnt-p.zero { color: var(--muted); }
.spec-counts .cnt-s { color: var(--amber); display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; flex-shrink: 0; }
.spec-group.collapsed > .test-item, .spec-group.collapsed > .passed-toggle { display: none; }
.test-item { width: 100%; min-height: 44px; position: relative; display: grid; grid-template-columns: 10px minmax(0,1fr) auto; align-items: center; gap: var(--sp-2); margin: 2px 0; padding: 9px 10px; overflow: hidden; border: 1px solid transparent; border-radius: var(--r-sm); background: transparent; color: var(--text); text-align: left; cursor: pointer; transition: all .15s ease-out; }
.test-item:hover { background: var(--surface-raised); }
.test-item.active { background: var(--surface); border-left: 3px solid var(--red); padding-left: 8px; }
.test-item.active::before { content: none; }
.test-item.active.passed { background: var(--surface); border-left-color: var(--green); }
.test-item.active.skipped { border-left-color: var(--amber); }
.test-item.active.unknown { border-left-color: var(--faint); }
.test-item.is-hidden { display: none; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); }
.status-dot.failed { background: var(--red); box-shadow: 0 0 0 3px var(--red-soft); }
.status-dot.passed { background: var(--green); }
.status-dot.skipped { background: var(--amber); }
.test-title { overflow: hidden; font: var(--f-label); font-weight: 600; line-height: 1.35; text-overflow: ellipsis; }
.test-duration { color: var(--faint); font: var(--f-file); }
.passed-toggle { width: 100%; display: flex; align-items: center; gap: 7px; margin: 2px 0; padding: 8px 10px; border: 0; border-radius: var(--r-sm); background: transparent; color: var(--accent); font: var(--f-label); cursor: pointer; text-align: left; }
.passed-toggle:hover { background: var(--surface); }
.main { min-width: 0; min-height: 0; overflow-y: auto; padding: 22px 32px 60px; background: var(--shell); }
.empty-state { min-height: 50vh; display: grid; place-items: center; color: var(--muted); text-align: center; font: var(--f-body); }
.detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 16px; }
.detail-head-left { min-width: 0; flex: 1 1 auto; }
.detail-head-left h2 { margin: 0; min-width: 0; max-width: 620px; font: var(--f-display); letter-spacing: -.02em; }
.detail-head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
.detail-meta { display: flex; align-items: center; gap: 9px; margin: 5px 0 0; color: var(--muted); font: var(--f-meta); flex-wrap: wrap; }
.detail-tags { display: flex; align-items: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.badge { padding: 5px 10px; border-radius: 999px; font: var(--f-badge); letter-spacing: .03em; white-space: nowrap; flex-shrink: 0; }
.badge.failed { color: var(--red); background: var(--red-soft); border: 1px solid var(--red-line); }
.badge.passed { color: var(--green); background: var(--green-soft); border: 1px solid var(--green-line); }
.badge.skipped { color: var(--amber); background: var(--amber-soft); border: 1px solid var(--amber-line); }
.badge.unknown { color: var(--muted); background: var(--surface-raised); border: 1px solid var(--line-strong); }
.badge.sm { padding: 2px 7px; font-size: 9px; margin-left: 4px; }
.meta-chip { display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--surface); color: var(--muted); border-radius: 999px; padding: 3px 8px; font: var(--f-subtitle); white-space: nowrap; flex-shrink: 0; }
.meta-chip.accent { color: var(--accent); border-color: var(--accent-line); background: var(--accent-soft); }
.endpoint { font-family: var(--font-code); }
.endpoint .method { color: var(--text); font-weight: 700; }

.overview-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: var(--sp-5); }
.overview-card { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.overview-label { display: block; color: var(--faint); font: var(--f-micro); text-transform: uppercase; letter-spacing: .06em; }
.overview-row { display: flex; align-items: center; gap: 8px; }
.overview-row strong { font: var(--f-overview-num); color: var(--text); }
.overview-text { color: var(--muted); font: var(--f-overview-text); }
.status-chip { border-radius: 4px; padding: 1px 7px; font: var(--f-badge); font-size: 11px; white-space: nowrap; flex-shrink: 0; }
.status-chip.ok { border: 1px solid var(--green-line); color: var(--green); background: var(--green-soft); }
.status-chip.bad { border: 1px solid var(--red-line); color: var(--red); background: var(--red-soft); }

.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 10px; margin-bottom: var(--sp-4); }
.metric-card { padding: var(--sp-4); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); box-shadow: var(--shadow-card); }
.metric-card.danger { border-color: var(--red-line); background: var(--red-soft); }
.metric-card > span { display: block; color: var(--muted); font: var(--f-micro); text-transform: uppercase; letter-spacing: .05em; }
.metric-card strong { display: block; margin: 10px 0 3px; color: var(--text); font: var(--f-data-lg); }
.metric-card.danger strong { color: var(--red); }
.metric-card.success { border-color: var(--green-line); background: var(--green-soft); }
.metric-card.success strong { color: var(--green); }
.metric-card small { color: var(--muted); font: var(--f-file); }

.analysis-grid { display: grid; grid-template-columns: minmax(0,1.25fr) minmax(280px,.85fr); align-items: start; gap: 10px; margin-bottom: var(--sp-4); }
.analysis-grid.pass-layout { grid-template-columns: 1fr; }
.section-card, .panel, .card { border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); box-shadow: var(--shadow-card); }
.section-card { padding: var(--sp-4); }
.section-card.result-strip { padding: 12px 16px; }
.section-card h3, .panel-title { margin: 0 0 var(--sp-2); font: var(--f-h3); }
.hero-micro { display: inline-block; margin-bottom: 6px; color: var(--red); font: var(--f-micro); letter-spacing: .06em; text-transform: uppercase; }
.hero-micro.success { color: var(--green); }
.failure-reason p { margin: 0; color: var(--muted); font: var(--f-body); }
.assertion-list { display: flex; flex-direction: column; gap: 8px; }
.assertion-item { min-height: 46px; display: grid; grid-template-columns: 22px minmax(0,1fr) auto auto; gap: 10px; align-items: center; padding: 9px 12px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: transparent; }
.assertion-item.failed { border-color: var(--red-line); background: var(--red-soft); }
.assertion-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; color: var(--faint); }
.assertion-item.failed .assertion-icon { color: var(--red); }
.assertion-copy { min-width: 0; display: flex; flex-direction: column; color: var(--muted); font: var(--f-body); line-height: 1.4; }
.assertion-copy small { margin-top: 2px; color: var(--faint); font: var(--f-file); }
.assertion-item.failed .assertion-copy { color: var(--text); }
.assertion-status { align-self: center; color: var(--muted); font: var(--f-file); line-height: 1; }
.assertion-item.failed .assertion-status { color: var(--red); }
.assertion-item.passed .assertion-icon, .assertion-item.passed .assertion-status { color: var(--green); }
.assertion-note { color: var(--muted); }
.assertion-target { padding: 2px 6px; border: 1px solid var(--line); border-radius: 5px; color: var(--muted); font: var(--f-file); letter-spacing: .02em; text-transform: uppercase; }
.assertion-target.empty { visibility: hidden; }
.failure-banner { margin-top: 14px; padding: var(--sp-4); border: 1px solid var(--red-line); border-radius: var(--r-md); background: var(--red-soft); }
.failure-banner-label { margin-bottom: 6px; color: var(--red); font: var(--f-micro); letter-spacing: .05em; text-transform: uppercase; }
.failure-message { color: var(--text); font: var(--f-data); overflow-wrap: anywhere; }
.failure-location { margin-top: 6px; color: var(--muted); font: var(--f-file); }
.failure-banner.passed { border-color: var(--green-line); background: var(--green-soft); }
.failure-banner.passed .failure-banner-label { color: var(--green); }

.support-row { display: grid; grid-template-columns: minmax(0,1.25fr) minmax(280px,.85fr); align-items: start; gap: 10px; margin-bottom: 16px; }
.card-head { display: flex; flex-direction: column; gap: 2px; padding: var(--sp-3) var(--sp-4); border-bottom: 1px solid var(--line); }
.card-head-title { margin: 0; font: var(--f-h4); line-height: normal; }
.card-head-sub { color: var(--muted); font: var(--f-subtitle); line-height: normal; }
.card-body { padding: var(--sp-4); }
.card-body-tight { padding: var(--sp-3) var(--sp-4); }
.pill { display: inline-flex; align-items: center; border: 1px solid var(--line); background: var(--surface); color: var(--faint); border-radius: 999px; padding: 1px 7px; font: var(--f-badge); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; width: fit-content; white-space: nowrap; flex-shrink: 0; }
.pill.test { color: var(--amber); border-color: var(--amber-line); background: var(--amber-soft); }
.pill.api { color: var(--info); border-color: var(--info-line); background: var(--info-soft); }
.pill.get { color: var(--green); border-color: var(--green-line); background: var(--green-soft); }
.pill.fail { color: var(--red); border-color: var(--red-line); background: var(--red-soft); }
.pill.contract { color: var(--accent); border-color: var(--accent-line); background: var(--accent-soft); }
.pill.strong { border-radius: 999px; padding: 3px 8px; text-transform: none; letter-spacing: 0; font-family: var(--font-main); font-weight: 500; color: var(--green); border-color: var(--green-line); background: var(--green-soft); }
.proof-item { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px; margin-bottom: 8px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-soft); }
.proof-b { display: block; color: var(--text); font-weight: 700; font-size: 12px; }
.proof-span { color: var(--muted); font-size: 11px; margin-top: 2px; }
.btn-tertiary { margin-top: 4px; padding: 6px 0; border: 0; background: transparent; color: var(--accent); font: var(--f-label); font-weight: 700; cursor: pointer; text-align: left; }
.btn-tertiary:hover { text-decoration: underline; }
.fact-row { display: flex; flex-direction: column; gap: 3px; padding-top: 8px; margin-bottom: 8px; border-top: 1px solid var(--line); }
.fact-row:first-child { border-top: 0; padding-top: 0; }
.fact-label { display: block; color: var(--muted); font-size: 10px; margin-bottom: 3px; }
.fact-value { color: var(--text); font-weight: 600; font-size: 12px; }

.panel { margin-bottom: var(--sp-4); overflow: hidden; }
.panel-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 13px var(--sp-4); border-bottom: 1px solid var(--line); }
.panel-head h3 { margin: 0; font: var(--f-h3); }
.panel-hint { color: var(--muted); font: var(--f-file); }
.panel-body { padding: var(--sp-4); animation: panel-fade .14s ease-out both; }
.match-note { color: var(--green); font: var(--f-label); font-weight: 500; }
.comparison-section { margin-bottom: 16px; }
.comparison-note { display: block; margin: 0; padding: 0 var(--sp-4) var(--sp-4); }
.comparison-scroll { overflow-x: auto; }
.comparison-grid { min-width: 620px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: var(--sp-4); }
.comparison-card { min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-soft); }
.comparison-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--line); }
.comparison-actions { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
.compare-title { font: var(--f-badge); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.compare-title.bad { color: var(--red); }
.comparison-card.received.failed { border-color: var(--line); background: var(--surface-soft); }
.comparison-card.received.failed .comparison-head { color: inherit; background: transparent; }
.comparison-card.received.passed { border-color: var(--line); }
.comparison-card.received.passed .comparison-head { color: inherit; background: transparent; }
.json-lines { min-height: 118px; display: block; padding: var(--sp-4); overflow: auto; background: var(--code); color: var(--text); font: var(--f-data); white-space: pre; }
.json-line { display: block; min-height: 1.75em; padding: 0 5px; }
.json-key { color: var(--info); }
.json-str, .json-val { color: var(--text); }
.json-num, .json-bool, .json-null { color: var(--muted); }
.diff-token { border-radius: 3px; padding: 0 3px; margin: 0 -3px; background: var(--red-soft); color: var(--red); font-weight: 600; }
.diff-line { box-shadow: inset 2px 0 0 var(--red); }

.sequence-head { align-items: flex-start; }
.sequence-scroll { overflow-x: auto; }
.sequence { min-width: 640px; display: flex; flex-direction: column; gap: 4px; }
.request-row { width: 100%; display: grid; grid-template-columns: 44px minmax(0,1fr) auto; gap: 8px; align-items: center; padding: 9px 10px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-soft); color: var(--text); text-align: left; cursor: pointer; transition: border-color .15s ease-out, background .15s ease-out; }
.request-row:hover { border-color: var(--line-strong); background: var(--surface-soft); }
.request-row.active { border-color: var(--line-strong); background: var(--surface-soft); }
.request-row-main { display: contents; }
.request-method { width: 44px; flex-shrink: 0; padding: 0; border-radius: 0; color: var(--accent); background: transparent; font: var(--f-meta); font-weight: 800; white-space: nowrap; }
.request-method.get, .request-method.delete, .request-method.put, .request-method.patch, .request-method.options, .request-method.head { color: var(--accent); background: transparent; }
.request-target { min-width: 0; flex: 1 1 auto; display: flex; align-items: center; gap: 7px; overflow: hidden; }
.request-url { min-width: 0; overflow: hidden; color: var(--text); font: 600 11.5px/1.4 var(--font-code); text-overflow: ellipsis; white-space: nowrap; }
.redirect-badge { flex: 0 0 auto; padding: 2px 6px; border: 1px solid var(--accent-line); border-radius: 999px; background: var(--accent-soft); color: var(--accent); font: var(--f-file); white-space: nowrap; }
.request-bar-track { grid-column: 1 / -1; height: 4px; position: relative; overflow: hidden; border-radius: 999px; background: var(--track-faint); }
.request-bar { height: 100%; position: absolute; top: 0; left: 0; display: block; border-radius: 3px; background: var(--faint); }
.request-bar.s2, .request-bar.s3, .request-bar.s45 { background: var(--accent); }
.request-bar.snone { background: var(--faint); }
.request-bar.bad { background: var(--red); }
.request-status { flex-shrink: 0; color: var(--green); font: var(--f-meta); font-weight: 700; text-align: right; white-space: nowrap; }
.request-status.bad { color: var(--red); }
.request-tags { grid-column: 1 / -1; display: flex; gap: 5px; flex-wrap: wrap; margin-top: -1px; }
.meta-chip-tiny { border: 1px solid var(--line); background: var(--surface); color: var(--faint); border-radius: 999px; padding: 1px 6px; font: var(--f-file); font-size: 8.5px; white-space: nowrap; flex-shrink: 0; }
.seq-hop { display: flex; align-items: center; gap: 8px; padding: 2px 10px 2px 54px; font: var(--f-file); color: var(--muted); }
.seq-hop.is-hidden { display: none; }
.seq-hop-arrow { color: var(--faint); }
.seq-hop-code { color: var(--amber); font-weight: 700; }
.seq-hop-loc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.request-row.is-hidden { display: none; }

.accordion { overflow: hidden; }
.accordion-head { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 13px var(--sp-4); border: 0; background: transparent; cursor: pointer; text-align: left; }
.accordion-head-right { display: flex; align-items: center; gap: 10px; }
.accordion-chevron { display: inline-flex; color: var(--muted); transition: transform .18s ease-out; }
.accordion.open .accordion-chevron { transform: rotate(180deg); }
.accordion-body { max-height: 0; overflow: hidden; opacity: 0; padding: 0 var(--sp-4); border-top: 1px solid transparent; transition: max-height .18s ease-out, opacity .15s ease-out, padding .18s ease-out, border-color .18s ease-out; }
.accordion.open .accordion-body { max-height: 960px; opacity: 1; padding: var(--sp-3) var(--sp-4) var(--sp-4); border-color: var(--line); }
.call-filter-row { display: flex; justify-content: flex-end; gap: 6px; margin-bottom: 10px; width: 100%; }
.call-filter-btn { padding: 4px 8px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface-soft); color: var(--muted); font: var(--f-label); font-size: 9.5px; cursor: pointer; }
.call-filter-btn.active { border-color: var(--accent-line); background: var(--accent-soft); color: var(--accent); }
.cause-b { color: var(--text); }
.code-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.lang-pill { border: 1px solid var(--line-strong); background: var(--surface-soft); color: var(--muted); border-radius: 5px; padding: 2px 7px; font: var(--f-badge); white-space: nowrap; flex-shrink: 0; }

.selected-grid { display: grid; grid-template-columns: minmax(0,1.15fr) minmax(280px,.85fr); gap: 10px; }
.redirect-trail { margin-bottom: 12px; overflow: hidden; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-soft); }
.redirect-trail-title { display: flex; justify-content: space-between; gap: 12px; padding: 9px 12px; border-bottom: 1px solid var(--line); color: var(--text); font: var(--f-file); font-weight: 650; }
.redirect-trail-title span { color: var(--accent); font-weight: 600; }
.redirect-hop { display: grid; grid-template-columns: 22px 42px minmax(0,1fr); align-items: center; gap: 8px; padding: 8px 12px; border-top: 1px solid var(--line-strong); }
.redirect-hop:first-of-type { border-top: 0; }
.redirect-hop > span { color: var(--faint); font: var(--f-file); }
.redirect-hop strong { color: var(--amber); font: var(--f-file); }
.redirect-hop code { min-width: 0; overflow: hidden; color: var(--muted); font: var(--f-file); text-overflow: ellipsis; white-space: nowrap; }
.code-panel { min-width: 0; position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-soft); }
.code-panel.full-span { grid-column: 1 / -1; }
.code-head { min-height: 40px; display: flex; align-items: center; padding: 9px 10px; border-bottom: 1px solid var(--line); gap: 8px; }
.code-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); font: var(--f-file); font-weight: 650; }
.code-title.mono { font-family: var(--font-code); }
.code-head-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.copy-button { display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-1); padding: 6px 10px; border: 1px solid var(--line); border-radius: 7px; background: transparent; color: var(--muted); font: var(--f-label); cursor: pointer; transition: all .15s ease-out; }
.copy-button:hover { border-color: var(--accent); color: var(--text); }
.copy-button:active { transform: scale(.98); }
.copy-button.mini { padding: 3px 5px; border-color: transparent; font-weight: 400; display: inline-flex; align-items: center; justify-content: center; }
.copy-button.code-copy, .copy-button.compare-copy { margin-left: auto; padding: 4px 8px; border-radius: 6px; background: var(--surface); color: var(--muted); font-size: 9.5px; line-height: normal; font-weight: 400; }
.copy-button.primary { width: 100%; padding: 9px 14px; border-color: var(--accent); background: var(--accent); color: var(--on-accent); font: var(--f-label); font-weight: 700; }
.copy-button.secondary { width: 100%; padding: 9px 14px; background: var(--surface-soft); color: var(--text); font-weight: 700; }
.copy-button.copied, .request-curl.copied { border-color: var(--green-line) !important; background: var(--green-soft) !important; color: var(--green) !important; transform: scale(.97); }
.copy-check { display: inline-block; animation: copy-pop .28s ease; }
@keyframes copy-pop { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.25); } 100% { transform: scale(1); opacity: 1; } }
@keyframes panel-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
pre { margin: 0; padding: var(--sp-4); overflow-x: auto; overflow-y: auto; background: var(--code); color: var(--text); font: var(--f-data); white-space: pre; }
.code-panel pre { min-height: 150px; max-height: 320px; }
.icon-wrap { width: 26px; height: 26px; border-radius: var(--r-sm); display: grid; place-items: center; background: transparent; border: 1px solid var(--line); color: var(--muted); cursor: pointer; padding: 0; margin-left: auto; transition: border-color .15s ease-out, color .15s ease-out, background .15s ease-out, transform .15s ease-out; }
.icon-wrap:hover { border-color: var(--accent); color: var(--text); background: var(--surface); }
.icon-wrap:active { transform: scale(.98); }
.icon-wrap.tight { margin-left: 0; }
.request-curl { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 5px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: var(--muted); cursor: pointer; transition: all .15s ease-out; }
.request-row.active .request-curl { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }

.debug-tabs { flex: 0 0 auto; display: inline-flex; gap: 3px; padding: 3px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface-soft); }
.debug-tab { padding: 8px 13px; border: 0; border-radius: 7px; background: transparent; color: var(--faint); font: var(--f-label); line-height: normal; font-weight: 500; cursor: pointer; transition: background .15s ease-out, color .15s ease-out, box-shadow .15s ease-out; }
.debug-tab:hover, .debug-tab:focus-visible { color: var(--text); outline: 0; box-shadow: 0 0 0 2px var(--accent-soft), 0 0 0 1px var(--accent); }
.debug-tab.active { background: var(--surface); color: var(--text); font-weight: 700; box-shadow: inset 0 0 0 1px var(--line-strong); }
.debug-panel { margin-top: 16px; }
.reproduction-help { margin: 0 0 10px; color: var(--muted); font: var(--f-label); }
.format-chips { display: flex; gap: 6px; margin-bottom: 12px; }
.format-chip { padding: 5px 11px; border: 1px solid var(--line); border-radius: 7px; color: var(--faint); background: var(--surface-soft); font: var(--f-file); white-space: nowrap; flex-shrink: 0; }
.format-chip.active { border-color: var(--accent-line); background: var(--accent-soft); color: var(--accent); }
.reproduction-code pre { min-height: 220px; max-height: 460px; }
.empty-note { color: var(--muted); font: var(--f-label); }

.steps-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 12px; }
.step-card-compact { display: flex; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.step-num { flex: 0 0 auto; width: 20px; height: 20px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-soft); border: 1px solid var(--line); color: var(--muted); font: var(--f-badge); }
.step-text-col { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.step-title-compact { font: var(--f-label); font-weight: 700; }
.step-span-compact { color: var(--muted); font: var(--f-subtitle); }

.two-col { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(220px,.6fr); gap: var(--sp-4); align-items: start; }
.ticket { padding: var(--sp-5); }
.ticket-title { margin: 0 0 14px; font: var(--f-h3); }
.ticket-h4 { margin: 16px 0 4px; color: var(--muted); font: var(--f-micro); text-transform: uppercase; letter-spacing: .05em; }
.ticket-h4:first-of-type { margin-top: 0; }
.ticket-p { margin: 0; color: var(--text); font-family: var(--font-main); font-size: 13px; line-height: 1.6; }
.steps-col { display: flex; flex-direction: column; gap: 10px; }
.action-card { padding: var(--sp-4); }
.action-p { margin: 6px 0 12px; color: var(--muted); font: var(--f-subtitle); line-height: 1.5; }

.evidence-panel { display: grid; gap: 14px; }
.evidence-heading, .evidence-screenshot-head, .evidence-empty { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.evidence-heading h3 { margin: 0; font: var(--f-h3); }
.evidence-heading p { margin: 4px 0 0; color: var(--muted); font: var(--f-label); }
.evidence-summary, .evidence-screenshot, .evidence-empty { padding: 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-soft); }
.evidence-summary { display: grid; gap: 7px; }
.evidence-summary > span { color: var(--red); font: var(--f-file); text-transform: uppercase; }
.evidence-summary > strong { font: var(--f-body); line-height: 1.55; }
.evidence-summary > div { display: flex; gap: 16px; color: var(--muted); font: var(--f-label); }
.evidence-screenshot-head > div, .evidence-empty > div { min-width: 0; }
.evidence-screenshot strong, .evidence-empty strong { display: block; font: var(--f-label); }
.evidence-screenshot span, .evidence-empty span { display: block; overflow: hidden; margin-top: 4px; color: var(--muted); font: var(--f-file); text-overflow: ellipsis; }
.evidence-preview-wrap { margin-top: 14px; overflow: hidden; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--code); }
.evidence-preview { display: block; width: 100%; max-height: 520px; object-fit: contain; background: #080b12; }
.evidence-preview-wrap p { margin: 0; padding: 9px 12px; border-top: 1px solid var(--line); color: var(--muted); font: var(--f-file); line-height: 1.45; }
.evidence-link { flex: 0 0 auto; padding: 7px 11px; border: 1px solid var(--line); border-radius: 7px; color: var(--text); font: var(--f-file); font-weight: 650; text-decoration: none; }
.evidence-link:hover, .evidence-link:focus-visible { border-color: var(--accent); outline: 0; }
.evidence-link.disabled { color: var(--faint); cursor: not-allowed; }
.evidence-curl pre { min-height: 110px; }
.issue-preview { max-height: 360px; overflow: auto; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-soft); }
.issue-preview article { padding: 20px; color: var(--text); font-family: var(--font-main); font-size: 13px; line-height: 1.6; }
.issue-preview h1 { margin: 0 0 20px; font: var(--f-display); line-height: 1.35; }
.issue-preview h2 { margin: 22px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--line); font: var(--f-label); font-weight: 700; }
.issue-preview p { margin: 7px 0; white-space: pre-line; }
.issue-preview pre { overflow-x: auto; overflow-y: auto; margin: 8px 0; padding: 12px; border: 1px solid var(--line); border-radius: 7px; background: var(--code); color: var(--text); font: var(--f-file); line-height: 1.55; white-space: pre; }
.issue-preview table { width: 100%; margin: 8px 0; border-collapse: collapse; }
.issue-preview th, .issue-preview td { padding: 8px; border: 1px solid var(--line); text-align: left; vertical-align: top; }
.issue-preview th { background: var(--code); font: var(--f-file); text-transform: uppercase; }
.issue-preview code { color: var(--text); font-family: var(--font-code); white-space: pre-wrap; }

.skip-card .card-body { padding: var(--sp-5); }
.skip-micro { display: inline-block; margin-bottom: 8px; color: var(--amber); font: var(--f-micro); letter-spacing: .06em; text-transform: uppercase; }
.skip-card.unknown .skip-micro { color: var(--muted); }
.diagnosis-title { margin: 0 0 8px; font: var(--f-h3); }
.diagnosis-body { margin: 0 0 14px; color: var(--muted); font: var(--f-body); }
.diagnosis-meta-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }

.overlay { position: fixed; inset: 0; z-index: 180; background: rgba(0,0,0,.45); opacity: 0; transition: opacity .16s ease-out; }
.overlay.open { opacity: 1; }
.drawer { position: fixed; top: 0; right: 0; bottom: 0; z-index: 190; width: min(420px, 94vw); display: flex; flex-direction: column; background: var(--page); border-left: 1px solid var(--line-strong); box-shadow: var(--shadow-drawer); transform: translateX(100%); transition: transform .18s cubic-bezier(.2,.8,.2,1); }
.drawer.open { transform: translateX(0); }
.drawer-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: var(--sp-4); border-bottom: 1px solid var(--line); }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; display: grid; align-content: start; gap: 9px; padding: var(--sp-4); }
.drawer-actions { display: grid; gap: 8px; padding: var(--sp-4); border-top: 1px solid var(--line); }
.drawer .proof-item { gap: normal; }
.drawer .pill { font-size: 8.5px; line-height: normal; }
.drawer-close { width: 30px; height: 30px; flex: 0 0 auto; display: grid; place-items: center; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-soft); color: var(--muted); font-size: 14px; cursor: pointer; }
.drawer-close:hover { border-color: var(--accent); color: var(--text); }

.toast { position: fixed; right: 24px; bottom: 24px; z-index: 220; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--green-line); border-radius: var(--r-md); background: var(--surface); color: var(--text); box-shadow: var(--shadow-modal); opacity: 0; transform: translateY(8px); pointer-events: none; transition: opacity .15s ease, transform .18s cubic-bezier(.2,.8,.2,1); }
.toast.show { opacity: 1; transform: translateY(0); }
.toast-check { width: 19px; height: 19px; display: grid; place-items: center; border-radius: 50%; background: var(--green-soft); color: var(--green); font-weight: 800; animation: copy-pop .28s ease; }

.comparison-card .json-lines { max-height: 340px; }
.fl-modal-backdrop { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 32px; background: rgba(0,0,0,.45); opacity: 0; transition: opacity .16s ease-out; }
.fl-modal-backdrop.open { opacity: 1; }
.fl-modal { display: flex; flex-direction: column; width: min(1100px, 92vw); max-height: 86vh; border: 1px solid var(--line-strong); border-radius: var(--r-lg); background: var(--page); box-shadow: var(--shadow-modal); overflow: hidden; transform: translateY(8px) scale(.98); transition: transform .18s cubic-bezier(.2,.8,.2,1); }
.fl-modal-backdrop.open .fl-modal { transform: translateY(0) scale(1); }
.fl-modal-head { display: flex; align-items: center; gap: 10px; padding: 13px 18px; border-bottom: 1px solid var(--line); }
.fl-modal-title { font: var(--f-h3); color: var(--text); }
.fl-modal-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.fl-modal-close { width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: var(--r-sm); background: transparent; color: var(--muted); font-size: 14px; cursor: pointer; }
.fl-modal-close:hover { border-color: var(--accent); color: var(--text); }
.fl-modal-body { overflow: auto; }
.fl-modal-body .json-lines { max-height: none; min-height: 0; border-radius: 0; font: var(--f-data); }

.assert-summary { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; padding: 9px 13px; border: 1px solid var(--green-line); border-radius: var(--r-md); background: var(--green-soft); color: var(--green); font: var(--f-data); }
.assert-summary .assert-count { margin-left: auto; font: var(--f-label); }
.assertion-list.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-content: start; }
.assertion-item.is-hidden { display: none; }
.more-btn { margin-top: 12px; display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface-soft); color: var(--muted); font: var(--f-label); cursor: pointer; transition: all .15s ease-out; }
.more-btn:hover { border-color: var(--accent); color: var(--text); }
.more-chev { display: inline-block; transition: transform .2s ease; }

@media (max-width: 1260px) {
  .topbar { grid-template-columns: minmax(220px,1fr) auto; }
  .main { padding: var(--sp-4); }
}
@media (max-width: 960px) {
  .topbar { grid-template-columns: 1fr; gap: 12px; }
  .metrics-row { justify-content: flex-start; flex-wrap: wrap; }
  :root { --sidebar-w: 260px; }
  .metrics-grid, .overview-strip { grid-template-columns: 1fr 1fr; }
  .analysis-grid, .selected-grid, .support-row, .code-grid, .two-col { grid-template-columns: 1fr; }
  .sequence-head { display: block; }
}
@media (max-width: 720px) {
  .topbar { padding: 12px 16px; }
  .workspace { display: block; overflow-y: auto; }
  .sidebar, .main { overflow: visible; height: auto; }
  .sidebar { border-right: 0; border-bottom: 1px solid var(--line); }
  .main { padding: 16px 14px 40px; }
  .detail-head { flex-direction: column; align-items: flex-start; gap: 12px; }
  .detail-head-right { align-items: flex-start; }
  .debug-tabs { width: 100%; }
  .debug-tab { flex: 1; }
  .copy-button.primary { width: 100%; margin-left: 0; }
  .evidence-heading, .evidence-screenshot-head, .evidence-empty { align-items: stretch; flex-direction: column; }
  .evidence-link { text-align: center; }
  .drawer { width: 100vw; }
}
@media (max-width: 440px) {
  .metrics-grid, .overview-strip { grid-template-columns: 1fr; }
  .metrics-text { white-space: normal; line-height: 1.6; }
}
@media (max-width: 760px) { .assertion-list.two-col { grid-template-columns: 1fr; } }
`;
//# sourceMappingURL=styles.js.map