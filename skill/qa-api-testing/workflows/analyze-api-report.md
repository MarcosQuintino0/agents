# Analyze API Report Workflow

Use this workflow to analyze API test execution reports. It preserves the legacy `api-analisador` rule: report evidence first, and create tickets only when the user asks.

## Inputs

- `report.json`, Mochawesome JSON, JUnit XML, CI log, or Cypress output.
- Spec paths and assertion failures from the report.
- Cypress support files, schemas, fixtures, and logs when needed.
- Backend path or Graphify graph when backend confirmation is needed.

## Evidence Priority

1. Report output and failure payloads.
2. Spec code for scenario intent and assertions.
3. Cypress support helpers/schemas for hidden behavior.
4. Real API response logs when available.
5. Backend code/OpenAPI/docs for contract and likely cause.
6. Graphify/fallback only to locate candidate backend files.

## Two-Step Flow

### Step 1 - Initial Analysis

Analyze and report conclusions. Do not create tickets yet.

For each relevant failure or suspicious pass:

- scenario/spec
- observed status/body/error/log
- expected assertion or missing oracle
- classification
- confidence
- evidence
- next confirmation needed

### Step 2 - Tickets Only When Requested

If the user asks for issues/chamados after the analysis, create drafts using `assets/templates/issue-bdd-template.md`. Use only evidence from Step 1 plus any additional confirmation actually performed.

Do not create tickets for inconclusive cases, weak evidence, or pure mass/environment issues unless the user explicitly wants tracking tasks for those.

## Layered Investigation

### Layer 1 - Report Triage

Use the report to identify:

- failed tests
- flaky/retried tests
- skipped tests
- passed tests with suspicious weak assertion signals
- status/body mismatches
- timeout, network, auth, fixture, mass, or environment signals

### Layer 2 - Cypress Investigation

Read spec/support files when:

- the report does not show what was asserted
- a failure may come from test data, cleanup, auth, or schema
- a passing test may be weak or masking a backend problem
- helper code hides request, assertion, or cleanup behavior

### Layer 3 - Backend Investigation

Use Graphify first to locate likely backend files, then confirm in code or approved sources:

- controller/router
- DTO/request/response
- validation
- service/use case
- repository/gateway
- exception handling
- security/middleware
- rules and state transitions

## Classifications

- Defeito confirmado no backend: evidence directly confirms wrong backend behavior.
- Defeito provavel no backend: strong evidence points to backend but final confirmation remains.
- Defeito no teste: assertion, schema, setup, cleanup, helper, or expectation is wrong.
- Lacuna de teste: test passed or exists but does not validate the required oracle.
- Problema de ambiente/massa/dependencia: data, auth, external dependency, availability, or config explains the result.
- Inconclusivo: evidence is insufficient or conflicting.

## Confidence

- Alta: direct evidence supports the conclusion and little human confirmation remains.
- Media: evidence is strong but contract, rule, or cause still needs confirmation.
- Baixa: signs exist but evidence does not support a responsible conclusion.

Examples:

- Backend response violates confirmed contract with captured body: high.
- Failure may be business rule or mass but rule is unconfirmed: low.
- Spec expected status not present in backend/OpenAPI and no real response confirms it: medium or low.

## Signals That Require Alert

- Backend returns stack trace, SQL, class/package, framework binding, token, cookie, password, or sensitive data.
- Unauthorized write creates or mutates data.
- Passing test does not assert the behavior promised by title.
- Error contract differs from product profile.
- Cleanup fails and leaves state.
- Refactor removed coverage without replacement.

## Ticket Draft Rules

Create a draft only when:

- classification is backend defect confirmed/probable or the user explicitly asks for another type
- evidence is named and reproducible
- uncertainty is explicit
- title describes user-visible/API behavior, not test internals

Do not include random IDs, test implementation details, or mass names in the title.

## Output

Initial analysis should include:

- summary
- table of findings
- classification and confidence
- evidence used
- what is confirmed vs hypothesis
- recommended next action

Ticket output should include BDD-style description, evidence, expected/observed behavior, impact, and attachments/commands when available.
