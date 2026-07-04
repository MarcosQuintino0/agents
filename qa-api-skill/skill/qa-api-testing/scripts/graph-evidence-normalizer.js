const FILE_PATTERN = /(?:^|\s)([A-Za-z0-9_.-]+(?:[\\/][A-Za-z0-9_.@-]+)+\.(?:java|kt|cs|js|ts|json|yaml|yml|xml|sql|py|go|rb|php))/g;

export function normalizeGraphEvidence({ question, answer = "", stderr = "", status = 0 }) {
  const candidateFiles = [];
  const seen = new Set();
  for (const match of answer.matchAll(FILE_PATTERN)) {
    const candidate = match[1].replaceAll("\\", "/");
    if (!seen.has(candidate)) {
      seen.add(candidate);
      candidateFiles.push(candidate);
    }
  }

  const warnings = [];
  if (status !== 0) warnings.push(`graphify exited with status ${status}`);
  if (stderr.trim()) warnings.push(stderr.trim());
  if (!answer.trim()) warnings.push("empty graphify answer");

  return {
    question,
    answer: answer.trim(),
    confidence: "unknown",
    candidateFiles,
    candidateConcepts: [],
    warnings,
  };
}

export function mergeEvidence(api, graph, queryResults) {
  const files = new Set();
  const concepts = new Set();
  const warnings = [];

  for (const result of queryResults) {
    for (const file of result.candidateFiles || []) files.add(file);
    for (const concept of result.candidateConcepts || []) concepts.add(concept);
    for (const warning of result.warnings || []) warnings.push(warning);
  }

  return {
    api,
    graph,
    generatedAt: new Date().toISOString(),
    queries: queryResults.map(({ question, answer, confidence }) => ({ question, answer, confidence })),
    candidateFiles: [...files],
    candidateConcepts: [...concepts],
    warnings,
    guardrail: "Graphify evidence is navigation only. Confirm every rule in backend code, OpenAPI, approved docs, or real responses.",
  };
}
