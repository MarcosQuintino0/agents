import { buildEvidenceHtml, buildEvidenceText, buildIssueContent } from "../reporter/evidence";
import { copyEvidenceToClipboard } from "./evidenceClipboard";

const buildEvidenceTextSource = buildEvidenceText.toString();
const buildEvidenceHtmlSource = buildEvidenceHtml.toString();
const buildIssueContentSource = buildIssueContent.toString();
const copyEvidenceSource = copyEvidenceToClipboard.toString();

export const clientScript = String.raw`
(function () {
  "use strict";
  var buildEvidenceText = ${buildEvidenceTextSource};
  var buildEvidenceHtml = ${buildEvidenceHtmlSource};
  var buildIssueContent = ${buildIssueContentSource};
  var copyEvidenceToClipboard = ${copyEvidenceSource};
  var report = JSON.parse(document.getElementById("faillens-data").textContent);
  var localToken = /^https?:$/.test(location.protocol) ? new URLSearchParams(location.search).get("token") : null;
  var all = [];
  report.specs.forEach(function (spec) {
    spec.tests.forEach(function (test) { all.push({ spec: spec, test: test }); });
  });
  var state = { mode: "all", query: "", selected: null, requestId: null, view: "diagnosis",
    onlyFailures: false, expandedSpecs: Object.create(null), passedShown: Object.create(null),
    seqShown: Object.create(null), assertShown: Object.create(null),
    timelineOpen: Object.create(null), callFilter: Object.create(null),
    drawer: null };
  var replayState = Object.create(null);
  var replayUi = { tab: Object.create(null), tokenEditing: Object.create(null),
    tokenValue: Object.create(null), sequence: Object.create(null) };
  var sidebar = document.getElementById("test-list");
  var detail = document.getElementById("detail");
  var toast = document.getElementById("toast");
  var shell = document.querySelector(".report-shell");
  var filterInput = document.getElementById("filter");
  var clearFilter = document.getElementById("clear-filter");
  var evidenceImage = { key: null, image: null, canvas: null, blob: null, dataUrl: null, blocked: false };

  function svgIcon(path) {
    return '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + path + '</svg></span>';
  }
  var CHECK_ICON = svgIcon('<path d="M20 6 9 17l-5-5"></path>');
  var X_ICON = svgIcon('<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>');
  var CLOCK_ICON = svgIcon('<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>');
  var CHEVRON_ICON = svgIcon('<path d="m6 9 6 6 6-6"></path>');
  var COPY_ICON = svgIcon('<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>');
  var EXPAND_ICON = svgIcon('<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M9 21H3v-6"></path><path d="M14 10 3 21"></path>');
  var FASTFWD_ICON = svgIcon('<polygon points="13 19 22 12 13 5 13 19"></polygon><polygon points="2 19 11 12 2 5 2 19"></polygon>');

  function e(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function json(value) {
    if (value === undefined || value === null) return value === null ? "null" : "—";
    if (typeof value === "string") return value;
    try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
  }
  function duration(ms) {
    ms = Number(ms || 0);
    return ms >= 1000 ? (ms / 1000).toFixed(ms >= 10000 ? 1 : 2).replace(/0$/, "") + "s" : Math.round(ms) + "ms";
  }
  function statusLabel(value) {
    return value === "failed" ? "Falhou" : value === "passed" ? "Aprovado" : value === "skipped" ? "Pulado" : "Desconhecido";
  }
  function assertionState(value) {
    return value === "failed" ? "Falhou" : value === "passed" ? "Aprovada" : value === "pending" ? "Pendente" : value === "skipped" ? "Pulada" : "Observada";
  }
  function assertionIcon(value) {
    return value === "failed" ? X_ICON : value === "passed" ? CHECK_ICON : value === "skipped" ? CLOCK_ICON : CLOCK_ICON;
  }
  function statusMeaning(status) {
    var labels = {
      200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
      400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
      409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests",
      500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable"
    };
    return labels[Number(status)] || (status == null ? "Sem resposta HTTP" : "Status HTTP");
  }
  function baseName(value) {
    var parts = String(value || "spec desconhecida").replace(/\\/g, "/").split("/");
    return parts[parts.length - 1];
  }
  function copyFeedback(button, success, message) {
    flash(message || (success ? "Copiado para a área de transferência" : "Não foi possível copiar"));
    if (!button || !success) return;
    var original = button.innerHTML;
    button.classList.add("copied");
    button.innerHTML = '<span class="copy-check">' + CHECK_ICON + '</span>';
    clearTimeout(button.__failLensCopyTimer);
    button.__failLensCopyTimer = setTimeout(function () {
      button.classList.remove("copied");
      button.innerHTML = original;
    }, 1400);
  }
  function flash(message) {
    toast.innerHTML = '<span class="toast-check">' + CHECK_ICON + '</span><span>' + e(message) + '</span>';
    toast.classList.add("show");
    clearTimeout(flash.timer);
    flash.timer = setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }
  function fallbackCopyValue(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var success = false;
    try { success = document.execCommand("copy"); } catch (_) {}
    area.remove();
    return success;
  }
  function fallbackCopy(text, button) {
    copyFeedback(button, fallbackCopyValue(text));
  }
  function copy(text, button) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { copyFeedback(button, true); }, function () { fallbackCopy(text, button); });
    } else fallbackCopy(text, button);
  }
  function visibleItems() {
    var query = state.query.toLowerCase();
    return all.filter(function (item) {
      var modeMatch = state.onlyFailures ? item.test.state === "failed" : (state.mode === "all" || item.test.state === state.mode);
      var requestMatch = (item.test.requests || []).some(function (request) {
        return String(request.method + " " + (request.originalUrl || request.url || "")).toLowerCase().indexOf(query) >= 0;
      });
      var tagMatch = (item.test.tags || []).some(function (tag) { return String(tag).toLowerCase().indexOf(query) >= 0; });
      return modeMatch &&
        (!query || item.test.title.toLowerCase().indexOf(query) >= 0 || item.spec.specPath.toLowerCase().indexOf(query) >= 0 || requestMatch || tagMatch);
    });
  }
  function itemKey(item) { return item.spec.specPath + "::" + item.test.id; }
  function evidenceUrl(screenshot) {
    if (!localToken || !screenshot || !screenshot.relativePath) return screenshot && screenshot.href || "";
    return "/__faillens/evidence?token=" + encodeURIComponent(localToken) + "&path=" + encodeURIComponent(screenshot.relativePath);
  }
  function selectedItem() { return all.find(function (item) { return itemKey(item) === state.selected; }); }
  function releaseEvidenceImage() {
    if (evidenceImage.image) { evidenceImage.image.onload = null; evidenceImage.image.onerror = null; }
    evidenceImage = { key: null, image: null, canvas: null, blob: null, dataUrl: null, blocked: false };
  }
  function prepareEvidenceImage(item) {
    var key = itemKey(item);
    var image = detail.querySelector("[data-evidence-preview]");
    if (!image) { releaseEvidenceImage(); return; }
    if (evidenceImage.key === key && evidenceImage.image === image) return;
    releaseEvidenceImage();
    evidenceImage.key = key;
    evidenceImage.image = image;
    var screenshot = item.test.evidence && item.test.evidence.screenshots && item.test.evidence.screenshots[0];
    if (localToken && screenshot) {
      fetch(evidenceUrl(screenshot), { credentials: "same-origin" }).then(function (response) {
        if (!response.ok) throw new Error("screenshot indisponível");
        return response.blob();
      }).then(function (blob) {
        if (evidenceImage.key !== key) return;
        evidenceImage.blob = blob;
        var reader = new FileReader();
        reader.onload = function () { if (evidenceImage.key === key) evidenceImage.dataUrl = String(reader.result || ""); };
        reader.readAsDataURL(blob);
      }).catch(function () { if (evidenceImage.key === key) evidenceImage.blocked = true; });
      return;
    }
    var prepare = function () {
      if (evidenceImage.key !== key) return;
      try {
        var canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        var context = canvas.getContext("2d");
        if (!context) throw new Error("canvas indisponível");
        context.drawImage(image, 0, 0);
        evidenceImage.canvas = canvas;
        evidenceImage.dataUrl = canvas.toDataURL("image/png");
        canvas.toBlob(function (blob) {
          if (evidenceImage.key === key) {
            evidenceImage.blob = blob;
            if (!blob) evidenceImage.blocked = true;
          }
        }, "image/png");
      } catch (_) { evidenceImage.blocked = true; evidenceImage.canvas = null; evidenceImage.dataUrl = null; }
    };
    image.onload = prepare;
    image.onerror = function () { if (evidenceImage.key === key) evidenceImage.blocked = true; };
    if (image.complete && image.naturalWidth) prepare();
  }

  function renderSidebar() {
    var visible = visibleItems();
    if (clearFilter) clearFilter.hidden = !state.query;
    if (!state.selected || !visible.some(function (item) { return itemKey(item) === state.selected; })) {
      releaseEvidenceImage();
      var preferred = visible.find(function (item) { return item.test.state === "failed"; }) || visible[0];
      state.selected = preferred ? itemKey(preferred) : null;
      state.requestId = null;
      state.view = "diagnosis";
    }
    var groups = Object.create(null);
    visible.forEach(function (item) {
      (groups[item.spec.specPath] || (groups[item.spec.specPath] = [])).push(item);
    });
    sidebar.innerHTML = Object.keys(groups).map(function (specPath) {
      var items = groups[specPath];
      var failures = items.filter(function (item) { return item.test.state === "failed"; }).length;
      var passedItems = items.filter(function (item) { return item.test.state === "passed"; });
      var passedCount = passedItems.length;
      var skippedCount = items.filter(function (item) { return item.test.state === "skipped"; }).length;
      var collapsed = !state.expandedSpecs[specPath];
      var mixed = failures > 0 && passedCount > 0;
      var showPassed = !!state.passedShown[specPath];
      var counts = (failures ? '<span class="cnt-f">' + failures + ' ' + X_ICON + '</span>' : "") +
        '<span class="cnt-p' + (passedCount ? "" : " zero") + '">' + passedCount + ' ' + CHECK_ICON + '</span>' +
        (skippedCount ? '<span class="cnt-s">' + skippedCount + ' ' + FASTFWD_ICON + '</span>' : "");
      var rows = items.map(function (item) {
        var key = itemKey(item);
        var hide = mixed && item.test.state === "passed" && !showPassed && key !== state.selected;
        return '<button class="test-item ' + e(item.test.state) + (key === state.selected ? " active" : "") + (hide ? " is-hidden" : "") + '" data-test="' + e(key) + '">' +
          '<span class="status-dot ' + e(item.test.state) + '"></span><span class="test-title">' + e(item.test.title) + '</span>' +
          '<span class="test-duration">' + e(duration(item.test.durationMs)) + '</span></button>';
      }).join("");
      var hiddenPassed = mixed ? passedItems.filter(function (item) { return itemKey(item) !== state.selected; }).length : 0;
      var passedToggle = (mixed && hiddenPassed > 0)
        ? '<button class="passed-toggle" data-passed-toggle="' + e(specPath) + '"><span class="more-chev">' + CHEVRON_ICON + '</span> ' + (showPassed ? "Ocultar Aprovados ↑" : "+" + hiddenPassed + " Aprovados ↓") + '</button>'
        : "";
      return '<section class="spec-group' + (collapsed ? " collapsed" : "") + '">' +
        '<button class="spec-heading" data-spec-toggle="' + e(specPath) + '"><span class="spec-chev">' + CHEVRON_ICON + '</span>' +
        '<span class="spec-name" title="' + e(specPath) + '">' + e(baseName(specPath)) + '</span><span class="spec-counts">' + counts + '</span></button>' +
        rows + passedToggle + '</section>';
    }).join("");
    renderDetail();
  }

  function assertionItemHtml(assertion, hidden) {
    var location = assertion.file ? baseName(assertion.file) + (assertion.line ? ':' + assertion.line : '') : '';
    return '<div class="assertion-item ' + e(assertion.state) + (hidden ? " is-hidden" : "") + '"><span class="assertion-icon">' + assertionIcon(assertion.state) + '</span>' +
      '<span class="assertion-copy"><span>' + e(assertion.title) + '</span>' +
      (assertion.state === "pending" ? '<small class="assertion-note">Não executada após a falha anterior</small>' : (location ? '<small>' + e(location) + '</small>' : '')) + '</span>' +
      '<span class="assertion-target' + (!assertion.target || assertion.target === "unknown" ? ' empty' : '') + '">' + e(assertion.target && assertion.target !== "unknown" ? assertion.target : "n/a") + '</span>' +
      '<span class="assertion-status">' + e(assertionState(assertion.state)) + '</span></div>';
  }
  function assertionsHtml(test) {
    var assertions = test.assertions || [];
    if (!assertions.length) return '<p class="empty-note">Nenhuma assertion individual foi observada pelo Cypress.</p>';
    return '<div class="assertion-list">' + assertions.map(function (a) { return assertionItemHtml(a, false); }).join("") + '</div>';
  }
  function successAssertions(test) {
    var assertions = test.assertions || [];
    if (!assertions.length) return '<p class="empty-note">Nenhuma assertion individual foi observada pelo Cypress.</p>';
    var summary = '<div class="assert-summary"><span>' + CHECK_ICON + '</span><span>Contrato satisfeito — todas as asserções passaram</span><span class="assert-count">' + assertions.length + '/' + assertions.length + '</span></div>';
    var LIMIT = 8;
    var expanded = !!state.assertShown[test.id];
    var items = assertions.map(function (a, index) {
      return assertionItemHtml(a, assertions.length > LIMIT && !expanded && index >= LIMIT);
    }).join("");
    var more = assertions.length > LIMIT
      ? '<button class="more-btn" data-assert-toggle="' + e(test.id) + '"><span class="more-chev">' + CHEVRON_ICON + '</span> ' + (expanded ? "Mostrar menos" : "Mostrar mais " + (assertions.length - LIMIT) + " asserções") + '</button>'
      : "";
    return summary + '<div class="assertion-list two-col">' + items + '</div>' + more;
  }

  var CATEGORY_LABELS = {
    "validation-not-applied": "validação obrigatória não aplicada",
    "unhandled-validation-error": "erro de validação não tratado",
    "authorization-not-enforced": "autorização não aplicada",
    "authentication-not-enforced": "autenticação não aplicada",
    "resource-not-found-mismatch": "recurso não encontrado divergente",
    "duplicate-conflict": "conflito de duplicidade",
    "success-expected-but-client-error": "erro do cliente inesperado",
    "success-expected-but-server-error": "erro do servidor inesperado",
    "persistence-mismatch": "divergência de persistência",
    "unexpected-persistence": "persistência inesperada",
    "network-error": "erro de rede",
    "timeout": "tempo limite excedido",
    "schema-contract-mismatch": "divergência de contrato de schema",
    "unknown": "diagnóstico não classificado"
  };
  function humanizeCategory(category) {
    return CATEGORY_LABELS[category] || String(category || "").replace(/-/g, " ");
  }
  function confidencePillHtml(test, passed) {
    var confidence = test.diagnosis && test.diagnosis.confidence;
    if (confidence === "high") return '<span class="pill strong">' + (passed ? "Resultado confiável" : "Diagnóstico confiável") + '</span>';
    if (confidence === "medium") return '<span class="meta-chip">Diagnóstico parcial</span>';
    if (confidence === "low") return '<span class="meta-chip">Diagnóstico incerto</span>';
    return "";
  }
  function persistencePillHtml(test) {
    var state = test.persistenceEvidence && test.persistenceEvidence.state;
    var labels = {
      "confirmed-created": "Criação confirmada por GET",
      "confirmed-absent": "Ausência confirmada por GET",
      "confirmed-preserved": "Preservação confirmada",
      "confirmed-removed": "Remoção confirmada"
    };
    return labels[state] ? '<span class="meta-chip">' + labels[state] + '</span>' : "";
  }
  function diagnosisHtml(test) {
    if (!test.diagnosis) return '<p>Nenhum diagnóstico determinístico foi necessário para este teste.</p>';
    return '<p>' + e(test.diagnosis.summary) + '</p>';
  }

  // ─── Provas do diagnóstico: leitura de test.facts (procedência observed/asserted/contract/verified) ───
  function factPill(source) {
    if (source === "asserted") return '<span class="pill test">Teste</span>';
    if (source === "observed") return '<span class="pill api">API</span>';
    if (source === "verified") return '<span class="pill get">GET</span>';
    if (source === "contract") return '<span class="pill contract">Contrato</span>';
    return '<span class="pill">Observação</span>';
  }
  function factLabel(fact) {
    var value = typeof fact.value === "object" ? json(fact.value) : String(fact.value);
    return e(fact.kind.replace(/-/g, " ")) + (value ? ': <b class="proof-b" style="display:inline">' + e(value) + '</b>' : '');
  }
  function proofCard(pill, title, detail) {
    return '<div class="proof-item">' + pill + '<b class="proof-b">' + e(title) + '</b>' +
      (detail ? '<span class="proof-span">' + e(detail) + '</span>' : '') + '</div>';
  }
  function proofLocation(test, assertion) {
    var error = test.error || {};
    var source = (assertion && assertion.file) || error.file || "";
    if (!source) return "";
    var line = (assertion && assertion.line) || error.line;
    var column = (assertion && assertion.column) || error.column;
    return baseName(source) + (line ? ':' + line + (column ? ':' + column : '') : '');
  }
  function shortProofMessage(message) {
    var text = String(message || "");
    var expectedIndex = text.indexOf("expected ");
    return expectedIndex >= 0 ? text.slice(expectedIndex) : text;
  }
  function proofEvidenceCards(test) {
    var cards = [];
    var requests = test.requests || [];
    var main = requests.find(function (request) { return request.id === test.mainRequestId; }) || requests[0];
    var expectation = test.statusExpectation || {};
    var expected = expectation.expected != null ? expectation.expected : expectation.label;
    var actual = expectation.actual != null ? expectation.actual : (main && main.receivedStatus);
    if (expected != null && expected !== "") {
      cards.push(proofCard(factPill("asserted"), "O teste esperava " + expected + ".", actual != null ? "A validação de status quebrou ao receber " + actual + "." : "A chamada principal não retornou status HTTP."));
    }
    if (main && actual != null) {
      var absent = (test.facts || []).find(function (fact) { return fact.kind === "request-field-absent" && fact.value; });
      var accepted = absent ? " aceitou um payload sem " + absent.value + "." : " respondeu à chamada principal.";
      cards.push(proofCard(factPill("observed"), "A API retornou " + actual + " " + statusMeaning(actual) + ".", "O " + main.method + " " + chainedUrl(main) + accepted));
    }
    var evidence = test.persistenceEvidence || {};
    if (evidence.state === "confirmed-created" || evidence.state === "unexpected-persistence") {
      cards.push(proofCard(factPill("verified"), "O registro foi encontrado depois.", "GET posterior confirmou que houve persistência."));
    } else if (evidence.state === "confirmed-absent") {
      cards.push(proofCard(factPill("verified"), "O registro não foi encontrado depois.", "GET posterior confirmou ausência do recurso."));
    } else if (evidence.state === "confirmed-preserved") {
      cards.push(proofCard(factPill("verified"), "O registro foi preservado.", "Verificação posterior confirmou que a mutação não alterou o recurso."));
    } else if (evidence.state === "confirmed-removed") {
      cards.push(proofCard(factPill("verified"), "O registro foi removido.", "Verificação posterior confirmou a remoção do recurso."));
    }
    var assertions = test.assertions || [];
    var failed = assertions.filter(function (assertion) { return assertion.state === "failed"; });
    if (failed.length) {
      var first = failed[0];
      var detail = [proofLocation(test, first), shortProofMessage((test.error && test.error.message) || first.message || first.title)].filter(Boolean).join(" · ");
      var total = assertions.length || failed.length;
      cards.push(proofCard('<span class="pill fail">Quebrou</span>', failed.length + " de " + total + " validaç" + (total === 1 ? "ão" : "ões") + " " + (failed.length === 1 ? "falhou." : "falharam."), detail));
    }
    if (cards.length) return cards;
    return (test.facts || []).filter(function (fact) { return fact.value !== undefined && fact.value !== null; }).map(function (fact) {
      return '<div class="proof-item">' + factPill(fact.source) + '<b class="proof-b">' + factLabel(fact) + '</b>' +
        (fact.file ? '<span class="proof-span">' + e(baseName(fact.file)) + (fact.line ? ':' + fact.line : '') + '</span>' : '') + '</div>';
    });
  }
  function proofsHtml(test) {
    var cards = proofEvidenceCards(test);
    if (!cards.length) return '';
    var LIMIT = 2;
    var visible = cards.slice(0, LIMIT);
    var rest = cards.slice(LIMIT);
    var items = visible.join("");
    var more = rest.length
      ? '<button class="btn-tertiary" data-open-drawer="proofs">+' + rest.length + ' prova' + (rest.length === 1 ? '' : 's') + ' →</button>'
      : "";
    return '<article class="card"><div class="card-head"><h4 class="card-head-title">Provas do diagnóstico</h4><span class="card-head-sub">por que essa conclusão faz sentido</span></div>' +
      '<div class="card-body">' + items + more + '</div></article>';
  }
  function allProofsHtml(test) {
    return proofEvidenceCards(test).join("") || '<p class="empty-note">Nenhuma prova de procedência disponível para este teste.</p>';
  }

  // ─── Regra, impacto e ação: leitura de ruleRefs + contracts + diagnosis ───
  function ruleImpactHtml(test) {
    var refs = (test.ruleRefs || []).filter(function (ref) { return ref.resolved; });
    var contract = (report.contracts || []).find(function (item) { return item.id === test.contractId; });
    var rules = refs.map(function (ref) {
      return contract && (contract.rules || []).find(function (rule) { return rule.id === ref.ruleId; });
    }).filter(Boolean);
    if (!refs.length && !test.diagnosis) return '';
    var rows = [];
    if (refs.length) {
      var messages = rules.map(function (rule) { return rule.message; }).filter(Boolean);
      rows.push({ label: "Regra vinculada", value: refs.map(function (ref) { return ref.ruleId; }).join(", ") });
      if (messages.length) rows.push({ label: "Regra esperada", value: messages.join(" · ") });
    }
    if (test.diagnosis) {
      rows.push({ label: "Resultado atual", value: test.diagnosis.summary });
      rows.push({ label: "Próxima ação", value: test.diagnosis.suggestedAction });
    }
    if (!rows.length) return '';
    var title = test.state === "failed" ? "Regra, impacto e ação" : "Regra, resultado e cobertura";
    var sub = test.state === "failed" ? "o que revisar primeiro" : "o que foi validado";
    return '<article class="card"><div class="card-head"><h4 class="card-head-title">' + e(title) + '</h4><span class="card-head-sub">' + e(sub) + '</span></div>' +
      '<div class="card-body">' + rows.map(function (row) {
        return '<div class="fact-row"><span class="fact-label">' + e(row.label) + '</span><b class="fact-value">' + e(row.value) + '</b></div>';
      }).join("") + '</div></article>';
  }

  function expectedPayload(test, expectedStatus) {
    var error = test.error || {};
    if (error.expected !== undefined && error.expected !== null && typeof error.expected === "object") return error.expected;
    var markers = test.payloadDiff || [];
    if (markers.some(function (marker) { return marker.kind === "whole-response"; })) {
      return { status: expectedStatus, body: "Resposta de erro; não uma coleção" };
    }
    var absent = Object.create(null);
    markers.forEach(function (marker) {
      if (!marker.evidenceOnly && marker.path.indexOf("$.") === 0) absent[marker.path.slice(2)] = "<ausente>";
    });
    if (Object.keys(absent).length) return absent;
    return { status: expectedStatus };
  }

  // ─── Tokenizador JSON estrutural: sintaxe colorida + destaque só no token divergente ───
  function parseDiffPath(path) {
    if (path === "$" || path === "") return [];
    var segments = [];
    var rest = String(path).replace(/^\$\.?/, "");
    var re = /([^.\[\]]+)|\[(\d+)\]/g;
    var match;
    while ((match = re.exec(rest))) segments.push(match[2] !== undefined ? Number(match[2]) : match[1]);
    return segments;
  }
  function pathsEqual(a, b) {
    return a.length === b.length && a.every(function (part, index) { return String(part) === String(b[index]); });
  }
  function jsonTokenSpan(kind, text) {
    var cls = kind === "key" ? "json-key" : kind === "string" ? "json-str" : kind === "number" ? "json-num" : kind === "bool" ? "json-bool" : "json-null";
    return '<span class="' + cls + '">' + e(text) + '</span>';
  }
  function renderJsonNode(value, indent, path, markers, isWhole, out) {
    var pad = "  ".repeat(indent);
    var isDiverging = isWhole || markers.some(function (marker) { return pathsEqual(marker.path, path); });
    var wrap = function (html) { return isDiverging ? '<span class="diff-token">' + html + '</span>' : html; };
    if (value === null) { out.push(wrap(jsonTokenSpan("null", "null"))); return; }
    if (Array.isArray(value)) {
      if (!value.length) { out.push(wrap("[]")); return; }
      out.push("[\n");
      value.forEach(function (item, index) {
        out.push(pad + "  ");
        renderJsonNode(item, indent + 1, path.concat(index), markers, isWhole, out);
        out.push(index < value.length - 1 ? ",\n" : "\n");
      });
      out.push(pad + "]");
      return;
    }
    if (value !== null && typeof value === "object") {
      var keys = Object.keys(value);
      if (!keys.length) { out.push(wrap("{}")); return; }
      out.push("{\n");
      keys.forEach(function (key, index) {
        out.push(pad + "  " + jsonTokenSpan("key", JSON.stringify(key)) + ": ");
        renderJsonNode(value[key], indent + 1, path.concat(key), markers, isWhole, out);
        out.push(index < keys.length - 1 ? ",\n" : "\n");
      });
      out.push(pad + "}");
      return;
    }
    if (typeof value === "string") { out.push(wrap(jsonTokenSpan("string", JSON.stringify(value)))); return; }
    if (typeof value === "boolean") { out.push(wrap(jsonTokenSpan("bool", String(value)))); return; }
    if (typeof value === "number") { out.push(wrap(jsonTokenSpan("number", String(value)))); return; }
    out.push(wrap(e(String(value))));
  }
  function highlightedJson(value, test, highlight) {
    if (typeof value !== "object" || value === null) {
      return '<code class="json-lines"><span class="json-line">' + e(json(value)) + '</span></code>';
    }
    var markers = highlight ? (test.payloadDiff || []).map(function (marker) { return { path: parseDiffPath(marker.path), reason: marker.reason, whole: marker.kind === "whole-response" || marker.path === "$" }; }) : [];
    var isWhole = markers.some(function (marker) { return marker.whole; });
    var out = [];
    renderJsonNode(value, 0, [], markers, isWhole, out);
    var rendered = out.join("");
    var lines = rendered.split("\n").map(function (line) {
      var hasDiff = /class="diff-token"/.test(line);
      return '<span class="json-line' + (hasDiff ? ' diff-line' : '') + '">' + (line || " ") + '</span>';
    });
    return '<code class="json-lines">' + lines.join("") + '</code>';
  }

  function chainedUrl(request) {
    var url = String(request.originalUrl || request.url || "");
    if (/^https?:\/\//i.test(url)) {
      try {
        var parsed = new URL(url);
        url = parsed.pathname + parsed.search + parsed.hash;
      } catch (_) {}
    }
    var identifier = (request.usedVariables || []).find(function (name) { return /_ID$|^\$ID$/.test(name); });
    if (identifier && url.indexOf(identifier) < 0) url = url.replace(/\/[^/?#]+(?=[?#]|$)/, "/" + identifier);
    return url;
  }
  function chainLoc(value) {
    try { var parsed = new URL(value, "http://faillens.local"); return parsed.pathname + parsed.search; } catch (_) { return value; }
  }

  function isBadRequest(request, test) {
    return Boolean(request.error) || (test.state === "failed" && request.id === test.mainRequestId);
  }
  function statusBarClass(request, test) {
    if (isBadRequest(request, test)) return "bad";
    var status = request.receivedStatus;
    if (status == null) return "snone";
    if (Number(status) >= 400) return "s45";
    if (Number(status) >= 300) return "s3";
    return "s2";
  }
  var PHASE_LABELS = { preparacao: "preparação", validacao: "ação principal", verificacao: "verificação", limpeza: "limpeza" };
  function requestTagsHtml(request, test) {
    var tags = [];
    var phaseLabel = PHASE_LABELS[request.phase];
    if (phaseLabel) tags.push(phaseLabel);
    (request.generatedVariables || []).forEach(function (name) { tags.push("gera " + name); });
    (request.usedVariables || []).forEach(function (name) { tags.push("usa " + name); });
    if (test.persistenceEvidence && test.persistenceEvidence.verificationRequestId === request.id) tags.push("confirma persistência");
    if (request.redirects && request.redirects.length) tags.push("seguiu " + request.redirects.length + " redirect" + (request.redirects.length === 1 ? "" : "s"));
    if (!tags.length) return "";
    return '<div class="request-tags">' + tags.map(function (tag) { return '<span class="meta-chip-tiny">' + e(tag) + '</span>'; }).join("") + '</div>';
  }
  function outcomeText(request, test, bad) {
    if (request.receivedStatus == null) return "sem resposta";
    if (!bad) return "ok";
    var expectedLabel = request.id === test.mainRequestId && test.statusExpectation && test.statusExpectation.label;
    return expectedLabel ? "esperado " + expectedLabel : "falhou";
  }
  function requestRowHtml(request, test, width, hidden) {
    var status = request.receivedStatus == null ? "—" : request.receivedStatus;
    var bad = isBadRequest(request, test);
    var methodClass = String(request.method || "get").toLowerCase();
    var redirects = request.redirects || [];
    var hops = redirects.map(function (hop) {
      return '<div class="seq-hop' + (hidden ? " is-hidden" : "") + '"><span class="seq-hop-arrow">↳</span>' +
        '<span class="seq-hop-code">' + e(hop.statusCode || "3xx") + '</span><span class="seq-hop-loc" title="' + e(hop.location) + '">' + e(chainLoc(hop.location)) + '</span></div>';
    }).join("");
    return '<div class="request-row ' + (request.id === state.requestId ? "active " : "") + (bad ? "bad " : "") + (hidden ? "is-hidden" : "") + '" data-request="' + e(request.id) + '" role="button" tabindex="0">' +
      '<div class="request-row-main">' +
      '<span class="request-method ' + e(methodClass) + '">' + e(request.method) + '</span>' +
      '<span class="request-target"><span class="request-url" title="' + e(request.originalUrl || request.url) + '">' + e(chainedUrl(request)) + '</span>' +
      (redirects.length ? '<span class="redirect-badge">seguiu ' + e(redirects.length) + ' redirect' + (redirects.length === 1 ? "" : "s") + '</span>' : "") + '</span>' +
      '<span class="request-status ' + (bad ? "bad" : "") + '">' + e(status) + ' · ' + e(outcomeText(request, test, bad)) + '</span>' +
      '</div>' +
      '<div class="request-bar-track"><span class="request-bar ' + statusBarClass(request, test) + '" style="width:' + width + '%"></span></div>' +
      requestTagsHtml(request, test) + '</div>' + hops;
  }
  function importantRequests(test) {
    return test.requests.filter(function (request) {
      return request.phase !== "limpeza" || isBadRequest(request, test);
    });
  }
  function requestRows(test) {
    var callFilter = state.callFilter[test.id] || "important";
    var important = importantRequests(test);
    var requests = (callFilter === "important" && important.length) ? important : test.requests;
    if (!test.requests.length) return '<p class="empty-note">Nenhuma chamada cy.request foi capturada neste teste.</p>';
    var maxDuration = test.requests.reduce(function (max, request) { return Math.max(max, Number(request.durationMs || 0)); }, 0) || 1;
    var LIMIT = 10;
    var expanded = !!state.seqShown[test.id];
    var hideable = requests.filter(function (request, index) {
      return index >= LIMIT && !isBadRequest(request, test) && request.id !== state.requestId;
    }).length;
    var rows = test.requests.map(function (request) {
      var width = Math.max(4, Math.round(Number(request.durationMs || 0) / maxDuration * 1000) / 10);
      var includedInFilter = requests.indexOf(request) >= 0;
      var index = requests.indexOf(request);
      var hidden = !includedInFilter || (!expanded && index >= LIMIT && !isBadRequest(request, test) && request.id !== state.requestId);
      return requestRowHtml(request, test, width, hidden);
    }).join("");
    var more = hideable > 0
      ? '<button class="more-btn" data-seq-toggle="' + e(test.id) + '"><span class="more-chev">' + CHEVRON_ICON + '</span> ' + (expanded ? "Mostrar menos" : "Mostrar mais " + hideable + " chamadas") + '</button>'
      : "";
    return rows + more;
  }

  function redirectTrailHtml(request) {
    var redirects = request.redirects || [];
    if (!redirects.length) return '';
    return '<div class="redirect-trail"><div class="redirect-trail-title">Rastro de redirects <span>' + e(redirects.length) + ' salto' + (redirects.length === 1 ? '' : 's') + '</span></div>' +
      redirects.map(function (redirect, index) {
        return '<div class="redirect-hop"><span>' + e(index + 1) + '</span><strong>' + e(redirect.statusCode || '3xx') + '</strong><code>' + e(redirect.location) + '</code></div>';
      }).join('') + '</div>';
  }

  function codePanel(title, context, content, copyKind, extraClass) {
    return '<div class="code-panel ' + e(extraClass || "") + '"><div class="code-head"><span class="lang-pill">JSON</span><span class="code-title">' + e(title) + (context ? ' · ' + e(context) : '') + '</span>' +
      '<span class="code-head-actions">' +
      (copyKind ? '<button class="copy-button mini" data-copy-kind="' + e(copyKind) + '" aria-label="Copiar" title="Copiar">' + COPY_ICON + '</button>' : '') + '</span></div><pre>' + e(content) + '</pre></div>';
  }

  // ─── Timeline: accordion com filtro Principais/Todas + code-grid da chamada selecionada ───
  function replayKey(test, request) {
    return test.id + "::" + (request && request.id || "request");
  }

  function replayScopeKey(test) {
    return test.id || "test";
  }

  function methodOptions(method) {
    return ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(function (item) {
      return '<option value="' + item + '"' + (item === method ? " selected" : "") + '>' + item + '</option>';
    }).join("");
  }

  function replayTab(test) {
    var key = replayScopeKey(test);
    return replayUi.tab[key] || "body";
  }

  function replayExpectedLabel(test) {
    var expectation = test.statusExpectation || {};
    if (expectation.label != null && expectation.label !== "") return String(expectation.label);
    if (expectation.expected != null) return String(expectation.expected);
    if (expectation.min != null && expectation.max != null) return expectation.min + "-" + expectation.max;
    return "n/a";
  }

  function replayRequestExpectedLabel(test, request) {
    if (!request) return "n/a";
    if (request.id === test.mainRequestId) return replayExpectedLabel(test);
    if (request.receivedStatus != null) return String(request.receivedStatus);
    return "n/a";
  }

  function replayMatchesExpectation(test, status) {
    if (status == null) return false;
    var expectation = test.statusExpectation || {};
    var number = Number(status);
    if (expectation.expected != null) return String(status) === String(expectation.expected);
    if (expectation.min != null && expectation.max != null && !Number.isNaN(number)) {
      return number >= Number(expectation.min) && number <= Number(expectation.max);
    }
    if (expectation.label != null && expectation.label !== "") return String(status) === String(expectation.label);
    return false;
  }

  function replayRequestMatchesExpectation(test, request, status) {
    if (!request || status == null) return false;
    if (request.id === test.mainRequestId) return replayMatchesExpectation(test, status);
    return String(status) === String(request.receivedStatus);
  }

  function replayRequestExpectationKind(test, request) {
    return request && request.id === test.mainRequestId ? "contract" : "captured";
  }

  function replayStatusMeaning(status) {
    var number = Number(status);
    return Number.isNaN(number) ? "Status HTTP" : statusMeaning(number);
  }

  function findTokenValue(value) {
    var found = "";
    var seen = [];
    function walk(node) {
      if (found || !node || typeof node !== "object" || seen.indexOf(node) >= 0) return;
      seen.push(node);
      Object.keys(node).some(function (key) {
        var child = node[key];
        if (/^(access[_-]?token|id[_-]?token|refresh[_-]?token|token|jwt)$/i.test(key) && (typeof child === "string" || typeof child === "number")) {
          found = String(child);
          return true;
        }
        walk(child);
        return Boolean(found);
      });
    }
    walk(value);
    return found;
  }

  function capturedTokenFor(test) {
    var requests = test.requests || [];
    for (var index = 0; index < requests.length; index += 1) {
      var token = findTokenValue(requests[index].responseBody);
      if (token) return token;
    }
    for (var headerIndex = 0; headerIndex < requests.length; headerIndex += 1) {
      var headers = requests[headerIndex].requestHeaders || {};
      var authKey = Object.keys(headers).find(function (key) { return key.toLowerCase() === "authorization"; });
      var authValue = authKey ? String(headers[authKey] || "") : "";
      var match = authValue.match(/^Bearer\s+(.+)$/i);
      if (match && match[1] && !/^<.*>$/.test(match[1]) && match[1] !== "***") return match[1];
    }
    return "";
  }

  function replayTokenValue(test) {
    return replayUi.tokenValue[replayScopeKey(test)] || capturedTokenFor(test);
  }

  function replayTokenPreview(test) {
    var custom = replayUi.tokenValue[replayScopeKey(test)];
    var token = custom || capturedTokenFor(test);
    if (!token) return "Nenhum token capturado neste teste";
    return (custom ? "Token editado nesta sessao: " : "Token capturado pelo relatorio: ") + token;
  }

  function replayHeadersText(request, test) {
    var headers = request.requestHeaders || {};
    var token = replayTokenValue(test);
    if (!token) return json(headers);
    var copy = {};
    Object.keys(headers).forEach(function (key) { copy[key] = headers[key]; });
    var hasAuthorization = Object.keys(copy).some(function (key) { return key.toLowerCase() === "authorization"; });
    if (hasAuthorization || (request.usedVariables || []).indexOf("$TOKEN") >= 0) {
      var authKey = Object.keys(copy).find(function (key) { return key.toLowerCase() === "authorization"; }) || "authorization";
      copy[authKey] = /^Bearer\s+/i.test(token) ? token : "Bearer " + token;
    }
    return json(copy);
  }

  function replayBodyText(request) {
    return request.requestBody === undefined ? "" : json(request.requestBody);
  }

  function replayRequestBadge(request, test) {
    var bad = isBadRequest(request, test);
    var status = request.receivedStatus == null ? "sem resposta" : String(request.receivedStatus);
    var label = bad && request.id === test.mainRequestId ? status + " != " + replayExpectedLabel(test) : status;
    return '<span class="replay-request-status ' + (bad ? "bad" : "ok") + '">' + e(label) + '</span>';
  }

  function replayRequestCollectionHtml(test) {
    var requests = test.requests || [];
    if (!requests.length) return '<p class="empty-note">Nenhuma request capturada.</p>';
    return requests.map(function (request, index) {
      var active = request.id === state.requestId;
      var bad = isBadRequest(request, test);
      var methodClass = String(request.method || "get").toLowerCase();
      var phase = request.id === test.mainRequestId ? "causadora" : (PHASE_LABELS[request.phase] || "chamada");
      return '<button class="replay-request-item ' + (active ? "active " : "") + (bad ? "bad" : "") + '" data-request="' + e(request.id) + '">' +
        '<span class="replay-request-index">' + e(index + 1) + '</span>' +
        '<span class="replay-request-copy"><span><b class="request-method ' + e(methodClass) + '">' + e(request.method || "GET") + '</b> ' +
        '<code title="' + e(request.originalUrl || request.url || "") + '">' + e(chainedUrl(request)) + '</code></span>' +
        '<small>' + e(phase) + '</small></span>' + replayRequestBadge(request, test) + '</button>';
    }).join("");
  }

  function replayInnerTabsHtml(test) {
    var active = replayTab(test);
    return '<nav class="replay-inner-tabs" aria-label="Dados do replay">' +
      '<button class="replay-inner-tab ' + (active === "token" ? "active" : "") + '" data-replay-tab="token">Token</button>' +
      '<button class="replay-inner-tab ' + (active === "body" ? "active" : "") + '" data-replay-tab="body">Body</button>' +
      '<button class="replay-inner-tab ' + (active === "headers" ? "active" : "") + '" data-replay-tab="headers">Headers</button></nav>';
  }

  function replayTabContentHtml(test, request) {
    var key = replayScopeKey(test);
    var active = replayTab(test);
    if (active === "headers") {
      return '<div class="replay-tab-panel"><div class="replay-panel-head"><b>Headers reenviados</b><span>JSON</span></div>' +
        '<textarea class="replay-textarea replay-editor-area" data-replay-headers spellcheck="false">' + e(replayHeadersText(request, test)) + '</textarea>' +
        '<p class="replay-note">Em ambiente controlado, o relatorio mantem o payload completo para permitir replay fiel.</p></div>';
    }
    if (active === "token") {
      var editing = !!replayUi.tokenEditing[key];
      if (editing) {
        var token = replayUi.tokenValue[key] || capturedTokenFor(test) || "";
        return '<div class="replay-tab-panel"><div class="replay-panel-head"><b>Editar token antes do replay</b><span>sessao local</span></div>' +
          '<label class="replay-token-field"><span>Bearer token</span><textarea class="replay-textarea replay-token-input" data-replay-token-input spellcheck="false">' + e(token) + '</textarea></label>' +
          '<div class="replay-token-actions"><button class="copy-button primary compact" data-replay-token-save>Salvar</button><button class="copy-button secondary compact" data-replay-token-cancel>Cancelar</button></div>' +
          '<p class="replay-note">O token editado fica apenas na memoria desta aba e e usado como Authorization no replay.</p></div>';
      }
      return '<div class="replay-tab-panel"><div class="replay-panel-head"><b>Token usado no replay</b><span>editavel</span></div>' +
        '<div class="replay-token-preview"><span>' + e(replayTokenPreview(test)) + '</span><button class="icon-wrap tight" data-replay-token-edit aria-label="Editar token" title="Editar token">' + svgIcon('<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>') + '</button></div>' +
        '<p class="replay-note">Use isto quando quiser trocar o token antes de reenviar requests autenticadas.</p></div>';
    }
    return '<div class="replay-tab-panel"><div class="replay-panel-head"><b>Payload enviado no replay</b><span>JSON</span></div>' +
      '<textarea class="replay-textarea replay-editor-area body" data-replay-body spellcheck="false">' + e(replayBodyText(request)) + '</textarea>' +
      '<p class="replay-note">Voce pode ajustar o corpo antes de enviar a request selecionada.</p></div>';
  }

  function replayMetricStripHtml(test, selectedRequest, entry) {
    var response = entry && entry.response || {};
    var captured = selectedRequest && selectedRequest.receivedStatus != null ? String(selectedRequest.receivedStatus) : "sem resposta";
    var replayed = response.status != null ? String(response.status) : "n/a";
    var time = response.durationMs != null ? duration(response.durationMs) : duration(selectedRequest && selectedRequest.durationMs);
    return '<div class="replay-metric-strip">' +
      '<div><span>capturado</span><strong>' + e(captured) + '</strong></div>' +
      '<div><span>esperado</span><strong>' + e(replayRequestExpectedLabel(test, selectedRequest)) + '</strong></div>' +
      '<div><span>replay</span><strong>' + e(replayed) + '</strong></div>' +
      '<div><span>tempo</span><strong>' + e(time) + '</strong></div></div>';
  }

  function replaySequenceHtml(test) {
    var seq = replayUi.sequence[replayScopeKey(test)];
    if (!seq) return "";
    var requests = test.requests || [];
    return '<div class="replay-sequence-progress">' + requests.map(function (request, index) {
      var done = seq.done && seq.done[request.id];
      var active = seq.loading && seq.index === index;
      return '<div class="replay-progress-row ' + (done ? "done " : "") + (active ? "active" : "") + '">' +
        '<span>' + e(index + 1) + '</span><b>' + e(request.method || "GET") + ' ' + e(chainedUrl(request)) + '</b><small>' +
        e(done ? "concluido" : active ? "em execucao" : "aguardando") + '</small></div>';
    }).join("") + '</div>';
  }

  function replayResponseCompareHtml(selectedRequest, response) {
    var capturedStatus = selectedRequest && selectedRequest.receivedStatus != null ? String(selectedRequest.receivedStatus) : "sem resposta";
    var replayStatus = response && response.status != null ? String(response.status) : "sem resposta";
    var capturedBody = selectedRequest ? json(selectedRequest.responseBody) : "sem corpo";
    var replayBody = response ? json(response.body) : "sem corpo";
    var sameBody = capturedBody === replayBody;
    return '<div class="replay-response-compare">' +
      '<div class="replay-response-tabs"><span>Comparacao de JSON</span><b class="replay-compare-chip ' + (sameBody ? "same" : "changed") + '">' + (sameBody ? "JSON igual" : "JSON diferente") + '</b></div>' +
      '<div class="replay-json-grid">' +
      '<section class="replay-json-panel captured"><div class="replay-json-head"><div><b>Capturado no teste</b><span>Status ' + e(capturedStatus) + '</span></div><button class="copy-button mini" data-copy-kind="captured-response" aria-label="Copiar JSON capturado" title="Copiar JSON capturado">' + COPY_ICON + '</button></div><pre class="replay-response-code">' + e(capturedBody) + '</pre></section>' +
      '<section class="replay-json-panel replayed"><div class="replay-json-head"><div><b>Replay agora</b><span>Status ' + e(replayStatus) + '</span></div><button class="copy-button mini" data-copy-kind="replay-response" aria-label="Copiar JSON do replay" title="Copiar JSON do replay">' + COPY_ICON + '</button></div><pre class="replay-response-code">' + e(replayBody) + '</pre></section>' +
      '</div></div>';
  }

  function replayResultHtml(test, selectedRequest) {
    var key = replayKey(test, selectedRequest);
    var entry = replayState[key];
    var sequence = replayUi.sequence[replayScopeKey(test)];
    if (sequence && sequence.loading) {
      return '<div class="replay-diagnostic-card running"><div class="replay-alert"><b>Reproduzindo sequencia</b><span>Executando as chamadas capturadas em ordem.</span></div>' +
        replaySequenceHtml(test) + '</div>';
    }
    if (!entry) {
      return '<div class="replay-diagnostic-card idle"><div class="replay-alert"><b>Teste quebrado detectado</b><span>Use o replay para confirmar se a API ainda viola o contrato.</span></div>' +
        replayMetricStripHtml(test, selectedRequest, null) +
        '<div class="replay-contract-summary"><b>Resumo do replay</b><pre>referencia: ' + e(replayRequestExpectationKind(test, selectedRequest) === "contract" ? "contrato do teste" : "status capturado da request") + '\nesperado: ' + e(replayRequestExpectedLabel(test, selectedRequest)) + '\ncapturado: ' + e(selectedRequest && selectedRequest.receivedStatus != null ? selectedRequest.receivedStatus : "sem resposta") + '\nendpoint: ' + e(selectedRequest ? selectedRequest.method + " " + chainedUrl(selectedRequest) : "n/a") + '</pre></div></div>';
    }
    if (entry.loading) return '<div class="replay-diagnostic-card running"><div class="replay-alert"><b>Replay em andamento</b><span>Enviando request pelo servidor local do FailLens.</span></div></div>';
    if (entry.error || entry.ok === false) {
      return '<div class="replay-diagnostic-card failed"><div class="replay-alert"><b>Replay nao concluido</b><span>' + e(entry.error || "Erro desconhecido") + '</span></div>' +
        replayMetricStripHtml(test, selectedRequest, entry) + '</div>';
    }
    var response = entry.response || {};
    var original = selectedRequest && selectedRequest.receivedStatus != null ? String(selectedRequest.receivedStatus) : "sem resposta";
    var replayed = response.status != null ? String(response.status) : "sem resposta";
    var sameStatus = original === replayed;
    var expectationKind = replayRequestExpectationKind(test, selectedRequest);
    var nowMatches = replayRequestMatchesExpectation(test, selectedRequest, response.status);
    var alertClass = expectationKind === "contract"
      ? (nowMatches ? "fixed" : (sameStatus ? "reproduced" : "changed"))
      : (nowMatches ? "fixed" : "changed");
    var title = expectationKind === "contract"
      ? (nowMatches ? "Contrato atendido agora" : (sameStatus ? "Falha reproduzida" : "Resultado mudou"))
      : (nowMatches ? "Request reproduzida" : "Resultado mudou");
    var message = expectationKind === "contract"
      ? (nowMatches
        ? "O replay retornou " + replayed + ", dentro do contrato esperado."
        : (sameStatus ? "A API retornou " + replayed + " novamente, mas o contrato exige " + replayRequestExpectedLabel(test, selectedRequest) + "." : "O replay retornou " + replayed + ", diferente do capturado " + original + "."))
      : (nowMatches
        ? "A request de preparacao retornou " + replayed + " novamente, igual ao capturado."
        : "A request retornou " + replayed + ", diferente do capturado " + original + ".");
    return '<div class="replay-diagnostic-card ' + e(alertClass) + '"><div class="replay-alert"><b>' + e(title) + '</b><span>' + e(message) + '</span></div>' +
      replayMetricStripHtml(test, selectedRequest, entry) +
      replayResponseCompareHtml(selectedRequest, response) +
      '<p class="replay-note">Status HTTP: ' + e(replayed) + ' ' + e(response.statusText || replayStatusMeaning(response.status)) + '</p></div>';
  }

  function replayHtml(test, selectedRequest) {
    if (!selectedRequest) {
      return '<article class="card"><div class="card-body"><p class="diagnosis-body">Selecione uma request para reproduzir.</p></div></article>';
    }
    if (!localToken) {
      return '<article class="card"><div class="card-body"><h3 class="diagnosis-title">Replay disponivel apenas no modo localhost</h3>' +
        '<p class="diagnosis-body">Abra este relatorio com <code>npm run qa:debug:open</code>. O arquivo local aberto diretamente no navegador nao consegue chamar o servidor local do FailLens.</p></div></article>';
    }
    var key = replayKey(test, selectedRequest);
    return '<div class="replay-v2" data-replay-shell data-replay-form="' + e(key) + '">' +
      '<div class="replay-actionbar">' +
      '<button class="replay-btn primary" data-replay-sequence>' + FASTFWD_ICON + '<span>Reproduzir sequencia</span></button>' +
      '<button class="replay-btn" data-replay-send>' + svgIcon('<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>') + '<span>Enviar request</span></button>' +
      '<button class="replay-btn muted" data-replay-culprit>' + svgIcon('<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="2"></circle>') + '<span>Ir para causadora</span></button>' +
      '<button class="replay-btn reset" data-replay-reset>' + svgIcon('<path d="M4 4v6h6"></path><path d="M20 20v-6h-6"></path><path d="M6 9a7 7 0 0 1 11.8-2.2"></path><path d="M18 15a7 7 0 0 1-11.8 2.2"></path>') + '<span>Reiniciar</span></button></div>' +
      '<div class="replay-v2-grid">' +
      '<aside class="replay-collection"><div class="replay-section-head"><b>Sequencia capturada</b><span>' + (test.requests || []).length + ' chamadas</span></div>' +
      '<div class="replay-request-list">' + replayRequestCollectionHtml(test) + '</div></aside>' +
      '<section class="replay-editor"><div class="replay-section-head"><b>Request selecionada</b><span class="replay-cause-chip">' + (selectedRequest.id === test.mainRequestId ? "causadora" : e(PHASE_LABELS[selectedRequest.phase] || "chamada")) + '</span></div>' +
      '<div class="replay-url-row"><select class="replay-input method" data-replay-method>' + methodOptions(selectedRequest.method || "GET") + '</select>' +
      '<input class="replay-input url" data-replay-url value="' + e(selectedRequest.originalUrl || selectedRequest.url || "") + '">' +
      '<span class="replay-expected">esperado ' + e(replayRequestExpectedLabel(test, selectedRequest)) + '</span></div>' +
      replayInnerTabsHtml(test) + replayTabContentHtml(test, selectedRequest) + '</section>' +
      '<aside class="replay-diagnostics"><div class="replay-section-head"><b>' + (replayState[key] ? "Resultado do replay" : "Diagnostico") + '</b><span>local</span></div>' +
      replayResultHtml(test, selectedRequest) + '</aside></div></div>';
  }

  function timelineHtml(test, selectedRequest, selectedContext) {
    var open = !!state.timelineOpen[test.id];
    var callFilter = state.callFilter[test.id] || "important";
    var failCount = test.requests.filter(function (request) { return isBadRequest(request, test); }).length;
    var important = importantRequests(test).length;
    return '<article class="card accordion' + (open ? ' open' : '') + '">' +
      '<button class="accordion-head" data-toggle-timeline="' + e(test.id) + '"><div>' +
      '<div class="card-head-title">Linha do tempo das chamadas</div>' +
      '<div class="card-head-sub">' + important + ' principa' + (important === 1 ? 'l' : 'is') + ' · ' + test.requests.length + ' no total' +
      (test.mainRequestId ? ' · causadora: <b class="cause-b">' + e((test.requests.find(function (r) { return r.id === test.mainRequestId; }) || {}).method || "") + ' ' + e(chainedUrl(test.requests.find(function (r) { return r.id === test.mainRequestId; }) || {})) + '</b>' : '') +
      '</div></div><div class="accordion-head-right">' +
      (failCount ? '<span class="pill fail">' + failCount + ' falhou</span>' : '') +
      '<span class="accordion-chevron">' + CHEVRON_ICON + '</span></div></button>' +
      '<div class="accordion-body">' +
      '<div class="call-filter-row"><button class="call-filter-btn' + (callFilter === "important" ? " active" : "") + '" data-call-filter="important">Principais</button>' +
      '<button class="call-filter-btn' + (callFilter === "all" ? " active" : "") + '" data-call-filter="all">Todas</button></div>' +
      '<div class="sequence">' + requestRows(test) + '</div>' +
      (selectedRequest ? redirectTrailHtml(selectedRequest) + '<div class="code-grid">' +
        codePanel("Request", selectedContext, json(selectedRequest.requestBody), "request", "") +
        codePanel("Response", selectedRequest.receivedStatus == null ? "sem resposta" : selectedRequest.receivedStatus + " " + statusMeaning(selectedRequest.receivedStatus), json(selectedRequest.responseBody), "response", "response-panel") +
        '</div><button class="icon-wrap" data-copy-request="' + e(selectedRequest.id) + '" style="margin-top:10px" aria-label="Copiar cURL" title="Copiar cURL desta chamada">' + COPY_ICON + '</button>'
        : '<p class="empty-note">Selecione uma chamada para ver request/response.</p>') +
      '</div></article>';
  }

  function passSummary(test) {
    var count = (test.assertions || []).length;
    if (count > 0) return 'A' + (count === 1 ? '' : 's') + ' ' + count + ' asserç' + (count === 1 ? 'ão foi satisfeita' : 'ões foram satisfeitas') + ' — resposta dentro do contrato esperado.';
    return 'Resposta dentro do contrato esperado — nenhuma asserção sinalizou divergência.';
  }
  function expandButton() {
    return '<button class="icon-wrap tight expand-btn" data-expand="1" aria-label="Ampliar" title="Ampliar">' + EXPAND_ICON + '</button>';
  }
  function comparePanelCopyButton() {
    return '<button class="copy-button compare-copy" data-copy-json aria-label="Copiar" title="Copiar">Copiar</button>';
  }
  function analysisSections(test, main, expected, actual) {
    if (test.state !== "failed" && test.state !== "passed") return '';
    var passed = test.state === "passed";
    var error = test.error || {};
    var location = error.file ? error.file + (error.line ? ':' + error.line + ':' + (error.column || 0) : '') : '';
    var receivedPayload = main ? main.responseBody : { status: actual };
    var expectedBody = passed ? receivedPayload : expectedPayload(test, expected);

    var reasonTitle = test.diagnosis ? humanizeCategory(test.diagnosis.category) : (passed ? 'Resultado' : 'Motivo da falha');
    var reasonHtml = passed
      ? '<p>' + e(test.diagnosis ? test.diagnosis.summary : 'A resposta atendeu ao status esperado e todas as asserções foram satisfeitas. Nenhuma ação necessária.') + '</p>'
      : diagnosisHtml(test);
    var heroPills = confidencePillHtml(test, passed) + persistencePillHtml(test);
    var banner = passed
      ? '<section class="failure-banner passed"><div class="failure-banner-label">Todas as asserções passaram</div><div class="failure-message">' + e(passSummary(test)) + '</div></section>'
      : '<section class="failure-banner"><div class="failure-banner-label">Assertion falhou</div><div class="failure-message">' + e(error.message || "Falha registrada sem mensagem.") + '</div>' +
        (location ? '<div class="failure-location">at ' + e(location) + '</div>' : '') + '</section>';

    var hero = '<article class="card"><div class="card-body">' +
      '<span class="hero-micro' + (passed ? ' success' : '') + '">' + e(reasonTitle) + '</span>' +
      '<h3 class="diagnosis-title">' + e(test.diagnosis ? test.diagnosis.title : (passed ? 'Resposta validada com sucesso.' : (error.message || 'Falha registrada sem mensagem.'))) + '</h3>' +
      reasonHtml + (heroPills ? '<div class="diagnosis-meta-row">' + heroPills + '</div>' : '') + banner + '</div></article>';

    var proofs = proofsHtml(test);
    var ruleImpact = ruleImpactHtml(test);
    var supportRow = (proofs || (!passed)) ? '<div class="support-row">' + hero + (proofs || '<article class="card"><div class="card-head"><h4 class="card-head-title">Asserções</h4><span class="card-head-sub">' + (test.assertions || []).length + ' avaliadas</span></div><div class="card-body">' + (passed ? successAssertions(test) : assertionsHtml(test)) + '</div></article>') + '</div>' : hero;

    var compTitle = passed ? 'Resposta validada' : 'Esperado vs. recebido';
    var compSub = passed ? 'o que o teste esperava e o que a API retornou — idênticos' : 'o que o teste esperava e o que a API realmente retornou';
    var receivedClass = passed ? 'received passed' : 'received failed';
    var persistenceSummary = test.persistenceEvidence && test.persistenceEvidence.summary;
    var compareNote = persistenceSummary || (passed ? 'Esperado e recebido são idênticos — contrato satisfeito.' : '');
    var comparison = '<article class="card">' +
      '<div class="card-head"><h4 class="card-head-title">' + compTitle + '</h4><span class="card-head-sub">' + compSub + '</span></div>' +
      '<div class="comparison-scroll" data-scroll>' +
      '<div class="comparison-grid">' +
      '<section class="comparison-card"><div class="comparison-head"><span class="compare-title">Esperado</span><span class="status-chip ok">' + e(expected) + '</span><span class="comparison-actions">' + comparePanelCopyButton() + expandButton() + '</span></div>' + highlightedJson(expectedBody, test, false) + '</section>' +
      '<section class="comparison-card ' + receivedClass + '"><div class="comparison-head"><span class="compare-title bad">Recebido</span><span class="status-chip ' + (passed ? 'ok' : 'bad') + '">' + e(actual) + '</span><span class="comparison-actions">' + comparePanelCopyButton() + expandButton() + '</span></div>' + highlightedJson(receivedPayload, test, !passed) + '</section>' +
      '</div></div>' +
      (compareNote ? '<p class="match-note comparison-note">' + e(compareNote) + '</p>' : '') + '</article>';

    var assertions = test.assertions || [];
    var failedAsserts = assertions.filter(function (a) { return a.state === "failed"; });
    var subCount = assertions.length + ' executada' + (assertions.length === 1 ? '' : 's') + (failedAsserts.length ? ' · ' + failedAsserts.length + ' falhou' : '');
    var firstFail = failedAsserts[0] || assertions[0];
    var errLoc = error.file ? baseName(error.file) + (error.line ? ':' + error.line + (error.column != null ? ':' + error.column : '') : '') : '';
    var failMsg = (firstFail && firstFail.message) || error.message || '';
    var proofExtra = failMsg && !(firstFail && firstFail.title && firstFail.title.indexOf(failMsg) !== -1) ? failMsg : '';
    var proofSpan = [errLoc, proofExtra].filter(Boolean).join(' · ');
    var extraCard = (!passed && assertions.length) ? '<article class="card"><div class="card-head"><h4 class="card-head-title">Validação que quebrou</h4><span class="card-head-sub">' + e(subCount) + '</span></div>' +
      '<div class="card-body-tight"><div class="proof-item"><span class="pill fail">Falha principal</span><b class="proof-b">' + e(firstFail ? firstFail.title : 'Validação falhou') + '</b>' +
      (proofSpan ? '<span class="proof-span">' + e(proofSpan) + '</span>' : '') + '</div>' +
      (assertions.length > 1 ? '<button class="btn-tertiary" data-open-drawer="validations">Ver as ' + assertions.length + ' validações →</button>' : '') +
      '</div></article>' : '';
    var secondRow = (ruleImpact || extraCard) ? '<div class="support-row">' + (ruleImpact || '<span></span>') + (extraCard || '<span></span>') + '</div>' : '';

    return supportRow + '<div class="comparison-section">' + comparison + '</div>' + secondRow;
  }

  // ─── Cenário pulado: card único, sem tabs/overview ───
  function skipCardHtml(test) {
    var unknown = test.state === "unknown";
    var micro = unknown ? "estado não determinado" : "teste não executado";
    var title = unknown
      ? "Este teste não pôde ser associado a um resultado conhecido."
      : "Este teste foi marcado como pulado e não foi executado.";
    var body = unknown
      ? "O FailLens recebeu chamadas de rede para este identificador antes de o Cypress reportar início ou resultado do teste — por isso ele não pôde ser classificado como aprovado, falho ou pulado."
      : "Não há evidência de execução — o Cypress reportou este teste como skip (test.skip/it.skip). Nenhuma chamada de rede foi observada.";
    return '<article class="card skip-card' + (unknown ? ' unknown' : '') + '"><div class="card-body">' +
      '<span class="skip-micro">' + e(micro) + '</span>' +
      '<h3 class="diagnosis-title">' + e(title) + '</h3>' +
      '<p class="diagnosis-body">' + e(body) + '</p>' +
      '<div class="diagnosis-meta-row"><span class="meta-chip">' + e(test.title) + '</span></div>' +
      (unknown ? '' : '<button class="btn-tertiary" data-copy-kind="skip-reason">Copiar motivo</button>') +
      '</div></article>';
  }

  function overviewStripHtml(test, main, expected, actual) {
    var okClass = String(actual) === String(expected) || test.state === "passed";
    return '<div class="overview-strip">' +
      '<div class="overview-card"><span class="overview-label">Esperado</span><div class="overview-row"><span class="status-chip ok">' + e(expected) + '</span><span class="overview-text">' + e(statusMeaning(Number(test.statusExpectation && test.statusExpectation.expected))) + '</span></div></div>' +
      '<div class="overview-card"><span class="overview-label">Recebido</span><div class="overview-row"><span class="status-chip ' + (okClass ? "ok" : "bad") + '">' + e(actual) + '</span><span class="overview-text">' + e(statusMeaning(Number(actual))) + '</span></div></div>' +
      '<div class="overview-card"><span class="overview-label">Tempo do teste</span><div class="overview-row"><strong>' + e(duration(test.durationMs)) + '</strong><span class="overview-text">' + test.requests.length + ' request' + (test.requests.length === 1 ? '' : 's') + '</span></div></div>' +
      '</div>';
  }

  function tagsRowHtml(test) {
    var tags = (test.tags || []).slice();
    var bugTag = tags.find(function (tag) { return /^@?bug$/i.test(tag); });
    var rest = tags.filter(function (tag) { return tag !== bugTag; });
    var chips = [];
    if (bugTag) chips.push('<span class="meta-chip">@bug conhecido</span>');
    if (rest.length) chips.push('<span class="meta-chip accent">+' + rest.length + ' tag' + (rest.length === 1 ? '' : 's') + '</span>');
    if (!chips.length) return '';
    return '<div class="detail-tags">' + chips.join("") + '</div>';
  }

  function tabsHtml(test) {
    var passed = test.state === "passed";
    var diagnosisLabel = passed ? "Resultado" : "Diagnóstico";
    return '<nav class="debug-tabs" role="tablist" aria-label="Detalhes do teste">' +
      '<button id="detail-tab-diagnosis" class="debug-tab ' + (state.view === "diagnosis" ? 'active' : '') + '" data-detail-tab="diagnosis" role="tab" aria-selected="' + (state.view === "diagnosis") + '" aria-controls="detail-panel-diagnosis" tabindex="' + (state.view === "diagnosis" ? '0' : '-1') + '">' + e(diagnosisLabel) + '</button>' +
      '<button id="detail-tab-script" class="debug-tab ' + (state.view === "script" ? 'active' : '') + '" data-detail-tab="script" role="tab" aria-selected="' + (state.view === "script") + '" aria-controls="detail-panel-script" tabindex="' + (state.view === "script" ? '0' : '-1') + '">Reprodução</button>' +
      '<button id="detail-tab-replay" class="debug-tab ' + (state.view === "replay" ? 'active' : '') + '" data-detail-tab="replay" role="tab" aria-selected="' + (state.view === "replay") + '" aria-controls="detail-panel-replay" tabindex="' + (state.view === "replay" ? '0' : '-1') + '">Replay</button>' +
      '<button id="detail-tab-evidence" class="debug-tab ' + (state.view === "evidence" ? 'active' : '') + '" data-detail-tab="evidence" role="tab" aria-selected="' + (state.view === "evidence") + '" aria-controls="detail-panel-evidence" tabindex="' + (state.view === "evidence" ? '0' : '-1') + '">Chamado</button></nav>';
  }
  function statusBadgeHtml(test) {
    var label = statusLabel(test.state);
    if (test.state === "failed" && test.diagnosis) label = "Falha contratual";
    else if (test.state === "passed" && (test.diagnosis || (test.assertions || []).length)) label = "Contrato cumprido";
    else if (test.state === "skipped") label = "Não executado";
    return '<span class="badge ' + e(test.state) + '">' + e(label) + '</span>';
  }
  function selectedPanel(test, selectedRequest, selectedContext, specPath, main, expected, actual) {
    var diagnosisView = state.view === "diagnosis";
    var scriptView = state.view === "script";
    var replayView = state.view === "replay";
    var content;
    if (diagnosisView) {
      content = analysisSections(test, main, expected, actual) + timelineHtml(test, selectedRequest, selectedContext);
    } else if (scriptView) {
      content = '<div class="code-panel reproduction-code"><div class="code-head"><span class="lang-pill">cURL</span><span class="code-title">Script de reprodução</span><button class="copy-button code-copy" data-copy-kind="script" aria-label="Copiar script" title="Copiar script">Copiar script</button></div>' +
        '<pre>' + e(test.reproductionScript || "Nenhuma request disponível.") + '</pre></div>';
    } else if (replayView) {
      content = replayHtml(test, selectedRequest);
    } else {
      var issue = buildIssueContent(test, specPath, report.contracts || []);
      var screenshot = test.evidence && test.evidence.screenshots && test.evidence.screenshots[0];
      var screenshotSource = evidenceUrl(screenshot);
      var screenshotHtml = screenshot
        ? '<div class="evidence-screenshot"><div class="evidence-screenshot-head"><div><strong>Screenshot do Cypress</strong><span>' + e(screenshot.fileName) + '</span></div><a class="evidence-link" href="' + e(screenshotSource) + '" target="_blank" rel="noopener noreferrer">Abrir screenshot</a></div>' +
          '<div class="evidence-preview-wrap"><img class="evidence-preview" data-evidence-preview src="' + e(screenshotSource) + '" alt="Screenshot do Cypress: ' + e(screenshot.fileName) + '" loading="lazy" decoding="async" draggable="true"><p>Clique com o botão direito na imagem para copiá-la ou arraste-a para o Jira quando a cópia automática for bloqueada.</p></div></div>'
        : '<div class="evidence-empty"><div><strong>O Cypress não gerou screenshot para este teste.</strong><span>A evidência textual e o cURL ainda podem ser copiados.</span></div><span class="evidence-link disabled" aria-disabled="true">Abrir screenshot</span></div>';
      content = issue
        ? '<div class="two-col"><article class="card ticket"><div class="card-head"><h4 class="card-head-title">Criar chamado</h4><span class="card-head-sub">Conteúdo factual, sanitizado e pronto para Jira, GitHub, Azure DevOps ou documentos.</span></div><div class="card-body">' +
          '<h3 class="ticket-title">' + e(issue.suggestedTitle) + '</h3>' +
          '<h4 class="ticket-h4">Contexto</h4><p class="ticket-p">' + e(issue.context).replace(/\n/g, '<br>') + '</p>' +
          (issue.bdd ? '<h4 class="ticket-h4">Cenário</h4><p class="ticket-p">' + e(issue.bdd).replace(/\n/g, '<br>') + '</p>' : '') +
          '<h4 class="ticket-h4">Resultado atual</h4><p class="ticket-p">' + e(issue.currentResult) + '</p>' +
          '<h4 class="ticket-h4">Resultado esperado</h4><p class="ticket-p">' + e(issue.expectedResult) + '</p>' +
          '<div class="issue-preview" style="margin-top:16px" data-scroll>' + buildEvidenceHtml(issue) + '</div>' + screenshotHtml + '</div></article>' +
          '<aside class="steps-col"><div class="card action-card"><b class="step-title-compact">Copiar chamado</b><p class="action-p">Copia o documento completo acima, pronto para colar no rastreador de bugs.</p><button class="copy-button primary" data-copy-kind="evidence">Copiar chamado</button></div>' +
          '<div class="card action-card"><b class="step-title-compact">Copiar evidências</b><p class="action-p">Copia o cURL sanitizado da chamada principal para anexar ao chamado.</p><button class="copy-button secondary" data-copy-kind="evidence-curl">Copiar evidências</button></div></aside></div>'
        : '<article class="card"><div class="card-head"><h4 class="card-head-title">Nenhuma ação necessária</h4><span class="card-head-sub">este teste ' + (test.state === "passed" ? "passou" : "não gerou falha") + ' e não gera chamado</span></div><div class="card-body"><p class="diagnosis-body">O contrato de resposta foi cumprido e nenhuma divergência foi encontrada.</p></div></article>';
    }
    return '<section class="panel debug-panel">' +
      '<div id="detail-panel-' + e(state.view) + '" class="panel-body" role="tabpanel" aria-labelledby="detail-tab-' + e(state.view) + '">' + content + '</div></section>';
  }

  function renderDetail() {
    var item = selectedItem();
    if (!item) {
      detail.innerHTML = '<div class="empty-state"><div>Selecione um teste para começar o debug.</div></div>';
      return;
    }
    var test = item.test;
    var main = test.requests.find(function (request) { return request.id === test.mainRequestId; }) || test.requests[0];
    if (!state.requestId || !test.requests.some(function (request) { return request.id === state.requestId; })) state.requestId = main ? main.id : null;
    var selectedRequest = test.requests.find(function (request) { return request.id === state.requestId; });
    var statusExpectation = test.statusExpectation || {};
    var expected = statusExpectation.label || "Não especificado";
    var actual = statusExpectation.actual != null ? String(statusExpectation.actual) : (main && main.receivedStatus != null ? String(main.receivedStatus) : "Sem resposta");
    var endpoint = main ? '<span class="endpoint">' + e(report.project && report.project.name || "projeto") + ' / <span class="method">' + e(main.method) + '</span> ' + e(chainedUrl(main)) + '</span>' : '';
    var selectedContext = selectedRequest ? selectedRequest.method + ' ' + chainedUrl(selectedRequest) : '';

    if (test.state === "skipped" || test.state === "unknown") {
      detail.innerHTML = '<header class="detail-head">' +
        '<div class="detail-head-left"><h2>' + e(test.title) + '</h2>' +
        '<p class="detail-meta">' + endpoint + '</p></div>' +
        '<div class="detail-head-right">' + statusBadgeHtml(test) + '</div></header>' +
        skipCardHtml(test);
      return;
    }

    detail.innerHTML = '<header class="detail-head">' +
      '<div class="detail-head-left"><h2>' + e(test.title) + '</h2>' +
      '<p class="detail-meta">' + endpoint + '</p>' + tagsRowHtml(test) + '</div>' +
      '<div class="detail-head-right">' + statusBadgeHtml(test) + tabsHtml(test) + '</div></header>' +
      overviewStripHtml(test, main, expected, actual) +
      selectedPanel(test, selectedRequest, selectedContext, item.spec.specPath, main, expected, actual);
    if (state.view === "evidence") prepareEvidenceImage(item);
  }

  function openDrawer(kind) {
    var item = selectedItem();
    if (!item) return;
    var test = item.test;
    var backdrop = document.createElement("div");
    backdrop.className = "overlay";
    var drawer = document.createElement("aside");
    drawer.className = "drawer";
    var title = kind === "proofs" ? "Provas do diagnóstico" : "Validações do teste";
    var sub = kind === "proofs" ? "por que essa conclusão faz sentido" : (test.assertions || []).length + " avaliadas";
    var assertionCount = (test.assertions || []).length;
    var failedCount = (test.assertions || []).filter(function (assertion) { return assertion.state === "failed"; }).length;
    sub = kind === "proofs" ? sub : assertionCount + " executada" + (assertionCount === 1 ? "" : "s") + (failedCount ? " · " + failedCount + " falhou" : "");
    var body = kind === "proofs" ? allProofsHtml(test) : assertionsHtml(test);
    var actions = kind === "proofs"
      ? '<button class="copy-button secondary" data-drawer-close="1">Fechar</button>'
      : '<button class="copy-button primary" data-copy-kind="validations">Copiar validações</button><button class="copy-button secondary" data-drawer-close="1">Fechar</button>';
    drawer.innerHTML = '<div class="drawer-head"><div><h3 class="card-head-title">' + e(title) + '</h3><p class="card-head-sub">' + e(sub) + '</p></div>' +
      '<button class="drawer-close" aria-label="Fechar">' + X_ICON + '</button></div>' +
      '<div class="drawer-body" data-scroll>' + body + '</div>' +
      '<div class="drawer-actions">' + actions + '</div>';
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    requestAnimationFrame(function () {
      backdrop.classList.add("open");
      drawer.classList.add("open");
    });
    function close() {
      backdrop.classList.remove("open");
      drawer.classList.remove("open");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { backdrop.remove(); drawer.remove(); }, 180);
    }
    function onKey(event) { if (event.key === "Escape") close(); }
    backdrop.addEventListener("click", close);
    drawer.querySelector(".drawer-close").addEventListener("click", close);
    drawer.querySelector("[data-drawer-close]").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  function openModal(title, codeElement) {
    var backdrop = document.createElement("div");
    backdrop.className = "fl-modal-backdrop";
    var clone = codeElement.cloneNode(true);
    backdrop.innerHTML = '<div class="fl-modal"><div class="fl-modal-head"><span class="fl-modal-title">' + e(title) + '</span>' +
      '<div class="fl-modal-actions"><button class="copy-button mini fl-modal-copy" aria-label="Copiar" title="Copiar">' + COPY_ICON + '</button>' +
      '<button class="fl-modal-close" aria-label="Fechar">' + X_ICON + '</button></div></div><div class="fl-modal-body"></div></div>';
    backdrop.querySelector(".fl-modal-body").appendChild(clone);
    document.body.appendChild(backdrop);
    requestAnimationFrame(function () { backdrop.classList.add("open"); });
    function close() {
      backdrop.classList.remove("open");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { backdrop.remove(); }, 180);
    }
    function onKey(event) { if (event.key === "Escape") close(); }
    backdrop.addEventListener("click", function (event) { if (event.target === backdrop) close(); });
    backdrop.querySelector(".fl-modal-close").addEventListener("click", close);
    backdrop.querySelector(".fl-modal-copy").addEventListener("click", function () {
      var text = Array.prototype.map.call(clone.querySelectorAll(".json-line"), function (line) { return line.textContent; }).join("\n");
      copy(text, backdrop.querySelector(".fl-modal-copy"));
    });
    document.addEventListener("keydown", onKey);
  }

  function replayParseHeaders(value) {
    var headers = value ? JSON.parse(value) : {};
    if (!headers || typeof headers !== "object" || Array.isArray(headers)) throw new Error("Headers precisam ser um objeto JSON.");
    return headers;
  }

  function replayParseBody(value) {
    if (!value) return undefined;
    try { return JSON.parse(value); } catch (_) { return value; }
  }

  function replayPayloadFor(test, request, form) {
    var methodField = form && form.querySelector("[data-replay-method]");
    var urlField = form && form.querySelector("[data-replay-url]");
    var headersField = form && form.querySelector("[data-replay-headers]");
    var bodyField = form && form.querySelector("[data-replay-body]");
    var method = methodField ? methodField.value : (request.method || "GET");
    var url = urlField ? urlField.value : (request.originalUrl || request.url || "");
    var headers = replayParseHeaders(headersField ? headersField.value.trim() : replayHeadersText(request, test));
    var body = replayParseBody(bodyField ? bodyField.value.trim() : replayBodyText(request));
    var token = replayTokenValue(test);
    var hasAuthorization = Object.keys(headers).some(function (key) { return key.toLowerCase() === "authorization"; });
    if (token && (hasAuthorization || (request.usedVariables || []).indexOf("$TOKEN") >= 0)) {
      var authKey = Object.keys(headers).find(function (key) { return key.toLowerCase() === "authorization"; }) || "authorization";
      headers[authKey] = /^Bearer\s+/i.test(token) ? token : "Bearer " + token;
    }
    return { method: method, url: url, headers: headers, body: body };
  }

  function sendReplayPayload(payload) {
    return fetch("/__faillens/replay?token=" + encodeURIComponent(localToken), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (response) { return response.json(); });
  }

  function runReplayRequest(test, request, form) {
    var key = replayKey(test, request);
    var payload = replayPayloadFor(test, request, form);
    replayState[key] = { loading: true };
    renderDetail();
    return sendReplayPayload(payload).then(function (result) {
      var token = result && result.response ? findTokenValue(result.response.body) : "";
      if (token) replayUi.tokenValue[replayScopeKey(test)] = token;
      replayState[key] = result;
      renderDetail();
      return result;
    }).catch(function (error) {
      replayState[key] = { ok: false, error: error.message || String(error) };
      renderDetail();
      return replayState[key];
    });
  }

  function runReplaySequence(item, form) {
    var test = item.test;
    var requests = test.requests || [];
    var scope = replayScopeKey(test);
    var mutates = requests.some(function (request) { return /^(POST|PUT|PATCH|DELETE)$/i.test(request.method || ""); });
    if (mutates && !window.confirm("Esta sequencia pode alterar dados. Enviar replay mesmo assim?")) return;
    replayUi.sequence[scope] = { loading: true, index: 0, done: Object.create(null) };
    function next(index) {
      if (index >= requests.length) {
        replayUi.sequence[scope].loading = false;
        replayUi.sequence[scope].index = requests.length;
        renderDetail();
        return Promise.resolve();
      }
      var request = requests[index];
      replayUi.sequence[scope].index = index;
      var selectedForm = request.id === state.requestId ? form : null;
      replayState[replayKey(test, request)] = { loading: true };
      renderDetail();
      return sendReplayPayload(replayPayloadFor(test, request, selectedForm)).then(function (result) {
        var token = result && result.response ? findTokenValue(result.response.body) : "";
        if (token) replayUi.tokenValue[scope] = token;
        replayState[replayKey(test, request)] = result;
        replayUi.sequence[scope].done[request.id] = true;
        return next(index + 1);
      }).catch(function (error) {
        replayState[replayKey(test, request)] = { ok: false, error: error.message || String(error) };
        replayUi.sequence[scope].done[request.id] = true;
        replayUi.sequence[scope].loading = false;
        renderDetail();
      });
    }
    next(0);
  }

  function resetReplay(test) {
    (test.requests || []).forEach(function (request) { delete replayState[replayKey(test, request)]; });
    var scope = replayScopeKey(test);
    delete replayUi.sequence[scope];
    delete replayUi.tokenEditing[scope];
    delete replayUi.tokenValue[scope];
    replayUi.tab[scope] = "body";
  }

  filterInput.addEventListener("input", function (event) {
    state.query = event.target.value;
    renderSidebar();
  });
  clearFilter.addEventListener("click", function () {
    state.query = "";
    filterInput.value = "";
    renderSidebar();
    filterInput.focus();
  });
  document.querySelector(".chips").addEventListener("click", function (event) {
    var button = event.target.closest("[data-mode]");
    if (!button) return;
    state.mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach(function (node) { node.classList.toggle("active", node.dataset.mode === state.mode); });
    renderSidebar();
  });
  document.getElementById("sidebar-collapse").addEventListener("click", function () {
    var collapsed = shell.classList.toggle("sidebar-collapsed");
    try { localStorage.setItem("faillens-sidebar-collapsed", collapsed ? "1" : "0"); } catch (_) {}
  });
  document.getElementById("only-failures").addEventListener("click", function (event) {
    state.onlyFailures = !state.onlyFailures;
    event.currentTarget.setAttribute("aria-pressed", String(state.onlyFailures));
    renderSidebar();
  });
  document.getElementById("expand-all").addEventListener("click", function (event) {
    var allExpanded = Object.keys(groupsSnapshot()).every(function (path) { return !!state.expandedSpecs[path]; });
    Object.keys(groupsSnapshot()).forEach(function (path) { state.expandedSpecs[path] = !allExpanded; });
    event.currentTarget.textContent = allExpanded ? "Expandir tudo" : "Recolher tudo";
    renderSidebar();
  });
  function groupsSnapshot() {
    var groups = Object.create(null);
    all.forEach(function (item) { groups[item.spec.specPath] = true; });
    return groups;
  }
  sidebar.addEventListener("click", function (event) {
    var specToggle = event.target.closest("[data-spec-toggle]");
    if (specToggle) {
      var path = specToggle.dataset.specToggle;
      state.expandedSpecs[path] = !state.expandedSpecs[path];
      renderSidebar();
      return;
    }
    var passedToggle = event.target.closest("[data-passed-toggle]");
    if (passedToggle) {
      var key = passedToggle.dataset.passedToggle;
      state.passedShown[key] = !state.passedShown[key];
      renderSidebar();
      return;
    }
    var button = event.target.closest("[data-test]");
    if (!button) return;
    releaseEvidenceImage();
    state.selected = button.dataset.test;
    state.requestId = null;
    state.view = "diagnosis";
    renderSidebar();
  });
  detail.addEventListener("click", function (event) {
    var current = selectedItem();
    if (!current) return;
    var seqToggle = event.target.closest("[data-seq-toggle]");
    if (seqToggle) { state.seqShown[seqToggle.dataset.seqToggle] = !state.seqShown[seqToggle.dataset.seqToggle]; renderDetail(); return; }
    var assertToggle = event.target.closest("[data-assert-toggle]");
    if (assertToggle) { state.assertShown[assertToggle.dataset.assertToggle] = !state.assertShown[assertToggle.dataset.assertToggle]; renderDetail(); return; }
    var timelineToggle = event.target.closest("[data-toggle-timeline]");
    if (timelineToggle) { var id = timelineToggle.dataset.toggleTimeline; state.timelineOpen[id] = !state.timelineOpen[id]; renderDetail(); return; }
    var callFilterBtn = event.target.closest("[data-call-filter]");
    if (callFilterBtn) { state.callFilter[current.test.id] = callFilterBtn.dataset.callFilter; renderDetail(); return; }
    var drawerBtn = event.target.closest("[data-open-drawer]");
    if (drawerBtn) { openDrawer(drawerBtn.dataset.openDrawer); return; }
    var copyJson = event.target.closest("[data-copy-json]");
    if (copyJson) {
      var copyCard = copyJson.closest(".comparison-card");
      var copyCode = copyCard && copyCard.querySelector(".json-lines");
      if (copyCode) {
        var jsonText = Array.prototype.map.call(copyCode.querySelectorAll(".json-line"), function (line) { return line.textContent; }).join("\n");
        copy(jsonText, copyJson);
      }
      return;
    }
    var expand = event.target.closest(".expand-btn");
    if (expand) {
      var card = expand.closest(".comparison-card");
      var codeElement = card && card.querySelector(".json-lines");
      if (codeElement) openModal(card.querySelector(".comparison-head").textContent.trim(), codeElement);
      return;
    }
    var directCopy = event.target.closest("[data-copy-request]");
    if (directCopy) {
      event.stopPropagation();
      var directRequest = current.test.requests.find(function (request) { return request.id === directCopy.dataset.copyRequest; });
      if (directRequest) copy(directRequest.curl || "", directCopy);
      return;
    }
    var replayTabButton = event.target.closest("[data-replay-tab]");
    if (replayTabButton) {
      replayUi.tab[replayScopeKey(current.test)] = replayTabButton.dataset.replayTab;
      renderDetail();
      return;
    }
    var replayTokenEdit = event.target.closest("[data-replay-token-edit]");
    if (replayTokenEdit) {
      replayUi.tokenEditing[replayScopeKey(current.test)] = true;
      replayUi.tab[replayScopeKey(current.test)] = "token";
      renderDetail();
      return;
    }
    var replayTokenCancel = event.target.closest("[data-replay-token-cancel]");
    if (replayTokenCancel) {
      replayUi.tokenEditing[replayScopeKey(current.test)] = false;
      replayUi.tab[replayScopeKey(current.test)] = "token";
      renderDetail();
      return;
    }
    var replayTokenSave = event.target.closest("[data-replay-token-save]");
    if (replayTokenSave) {
      var tokenInput = replayTokenSave.closest("[data-replay-form]") && replayTokenSave.closest("[data-replay-form]").querySelector("[data-replay-token-input]");
      replayUi.tokenValue[replayScopeKey(current.test)] = tokenInput ? tokenInput.value.trim() : "";
      replayUi.tokenEditing[replayScopeKey(current.test)] = false;
      replayUi.tab[replayScopeKey(current.test)] = "token";
      renderDetail();
      return;
    }
    var replayReset = event.target.closest("[data-replay-reset]");
    if (replayReset) {
      resetReplay(current.test);
      renderDetail();
      return;
    }
    var replayCulprit = event.target.closest("[data-replay-culprit]");
    if (replayCulprit) {
      state.requestId = current.test.mainRequestId || state.requestId;
      replayUi.tab[replayScopeKey(current.test)] = "body";
      renderDetail();
      return;
    }
    var replaySequence = event.target.closest("[data-replay-sequence]");
    if (replaySequence) {
      var sequenceForm = replaySequence.closest("[data-replay-shell]");
      runReplaySequence(current, sequenceForm);
      return;
    }
    var replaySend = event.target.closest("[data-replay-send]");
    if (replaySend) {
      var replayRequest = current.test.requests.find(function (request) { return request.id === state.requestId; });
      var form = replaySend.closest("[data-replay-form]");
      if (!replayRequest || !form || !localToken) return;
      try {
        var payload = replayPayloadFor(current.test, replayRequest, form);
        if (/^(POST|PUT|PATCH|DELETE)$/i.test(payload.method) && !window.confirm("Esta request pode alterar dados. Enviar replay mesmo assim?")) return;
        runReplayRequest(current.test, replayRequest, form);
      } catch (error) {
        replayState[replayKey(current.test, replayRequest)] = { ok: false, error: error.message || String(error) };
        renderDetail();
      }
      return;
    }
    var tabButton = event.target.closest("[data-detail-tab]");
    if (tabButton) {
      state.view = tabButton.dataset.detailTab;
      renderDetail();
      return;
    }
    var requestButton = event.target.closest("[data-request]");
    if (requestButton) {
      state.requestId = requestButton.dataset.request;
      renderDetail();
      return;
    }
    var copyButton = event.target.closest("[data-copy-kind]");
    if (!copyButton) return;
    var selectedRequest = current.test.requests.find(function (request) { return request.id === state.requestId; });
    var kind = copyButton.dataset.copyKind;
    if (kind === "script") copy(current.test.reproductionScript || "", copyButton);
    else if (kind === "curl") copy(selectedRequest ? selectedRequest.curl : "", copyButton);
    else if (kind === "response") copy(selectedRequest ? json(selectedRequest.responseBody) : "", copyButton);
    else if (kind === "request") copy(selectedRequest ? json(selectedRequest.requestBody) : "", copyButton);
    else if (kind === "captured-response") copy(selectedRequest ? json(selectedRequest.responseBody) : "", copyButton);
    else if (kind === "replay-response") {
      var replayResponse = selectedRequest ? replayState[replayKey(current.test, selectedRequest)] : null;
      copy(replayResponse && replayResponse.response ? json(replayResponse.response.body) : "", copyButton);
    }
    else if (kind === "replay-headers") {
      var replayHeaders = selectedRequest ? replayState[replayKey(current.test, selectedRequest)] : null;
      copy(replayHeaders && replayHeaders.response ? json(replayHeaders.response.headers) : "", copyButton);
    }
    else if (kind === "skip-reason") copy("Teste pulado: " + current.test.title, copyButton);
    else if (kind === "validations") copy((current.test.assertions || []).map(function (assertion) {
      return "[" + assertionState(assertion.state) + "] " + assertion.title + (assertion.message ? " — " + assertion.message : "");
    }).join("\n"), copyButton);
    else if (kind === "proofs") copy((current.test.facts || []).map(function (fact) {
      return fact.kind + ": " + (typeof fact.value === "object" ? json(fact.value) : String(fact.value));
    }).join("\n"), copyButton);
    else if (kind === "evidence-curl") {
      var evidenceMain = current.test.requests.find(function (request) { return request.id === current.test.mainRequestId; }) || current.test.requests[0];
      copy(evidenceMain ? evidenceMain.curl : "", copyButton);
    } else if (kind === "evidence") {
      var input = buildIssueContent(current.test, current.spec.specPath, report.contracts || []);
      if (!input) return;
      var screenshot = current.test.evidence && current.test.evidence.screenshots && current.test.evidence.screenshots[0];
      var text = buildEvidenceText(input);
      var html = buildEvidenceHtml(input, evidenceImage.key === itemKey(current) ? evidenceImage.dataUrl : null);
      copyEvidenceToClipboard({ text: text, html: html, imageBlob: evidenceImage.key === itemKey(current) ? evidenceImage.blob : null, hasScreenshot: Boolean(screenshot) }, {
        isSecureContext: window.isSecureContext,
        clipboard: navigator.clipboard,
        ClipboardItem: window.ClipboardItem,
        Blob: window.Blob,
        fallbackCopy: function (value) { return fallbackCopyValue(value); },
      }).then(function (result) {
        var messages = {
          complete: "Chamado completo copiado: texto, formatação e imagem.",
          "without-image": "Chamado copiado sem imagem. O navegador bloqueou a cópia automática do screenshot.",
          "text-only": "Chamado textual copiado. Use “Abrir screenshot” para copiar a imagem.",
          failed: "Não foi possível copiar o chamado.",
        };
        copyFeedback(copyButton, result !== "failed", messages[result]);
      });
    }
  });
  detail.addEventListener("keydown", function (event) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    var tabs = Array.prototype.slice.call(detail.querySelectorAll('[role="tab"]'));
    var index = tabs.indexOf(event.target);
    if (index < 0) return;
    event.preventDefault();
    var next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    state.view = tabs[next].dataset.detailTab;
    renderDetail();
    var target = detail.querySelector('[data-detail-tab="' + state.view + '"]');
    if (target) target.focus();
  });
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("faillens-theme", next); } catch (_) {}
  });
  document.getElementById("export-report").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "faillens-report.json";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  });
  try {
    var savedTheme = localStorage.getItem("faillens-theme");
    if (savedTheme === "light" || savedTheme === "dark") document.documentElement.dataset.theme = savedTheme;
    if (localStorage.getItem("faillens-sidebar-collapsed") === "1") shell.classList.add("sidebar-collapsed");
  } catch (_) {}
  if (localToken && window.EventSource) {
    var lifecycle = new EventSource("/__faillens/events?token=" + encodeURIComponent(localToken));
    window.addEventListener("pagehide", function () { lifecycle.close(); }, { once: true });
  }
  document.querySelectorAll("[data-mode]").forEach(function (node) { node.classList.toggle("active", node.dataset.mode === state.mode); });
  renderSidebar();
})();
`;
