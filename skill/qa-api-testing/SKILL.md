---
name: qa-api-testing
description: Creates, reviews, and analyzes Cypress API test suites from backend code and Graphify knowledge graphs. Use when the user asks to prepare API testing infrastructure, generate API tests, review API test coverage, analyze API execution reports, discover backend API rules, or produce evidence-based API failure analysis.
---

# QA API Testing

## Overview

Use this skill to prepare, create, review, and analyze Cypress backend API tests with evidence-first discovery. Graphify is the preferred navigation layer; backend code, OpenAPI, approved documentation, or real responses remain the contract authority.

## Use When

- Preparing shared Cypress API infrastructure.
- Creating or refactoring tests for one backend API/resource.
- Reviewing API test coverage, assertions, tags, schemas, cleanup, and evidence.
- Analyzing API execution reports and likely backend/test/environment causes.
- Discovering backend files and rules for API testing.

## Do Not Use When

- The task is frontend/UI testing only.
- The user asks to create a Cypress runtime library or FailLens runtime.
- The request requires inventing business rules, status codes, messages, limits, or required fields.
- The work is NPM publishing; this package must not run `npm publish`.

## Common Inputs

- Cypress project path and target API/resource name.
- Backend path and optional `graphify-out/graph.json`.
- OpenAPI/Swagger, approved docs, Postman/Insomnia collection, or real API responses.
- Existing specs, schemas, support files, reports, or CI output.

## Workflows

- Setup shared API test base: read `workflows/setup.md`.
- Create API tests: read `workflows/create-api-tests.md`.
- Review API tests: read `workflows/review-api-tests.md`.
- Analyze execution report: read `workflows/analyze-api-report.md`.

## Graphify Policy

- If `graphify-out/graph.json` exists, use Graphify as the primary navigation source.
- If no graph exists, instruct or run `npx qa-api-skill graphify:build --backend <backend-path>` according to user permission and project safety.
- If Graphify is not installed, instruct `npx qa-api-skill graphify:install`.
- Do not read the whole `graph.json` when scoped CLI queries can answer the question.
- Prefer `graphify query`, `graphify path`, `graphify explain`, or `npx qa-api-skill graph-provider`.
- Treat the graph as navigation evidence only. Confirm every contract detail in authoritative sources.

## Fallback Without Graphify

When Graphify is unavailable, failed, stale, or out of scope, use `references/backend-discovery-fallback.md`. It is a GPS-style backend mapper, not a contract extractor.

## Evidence Rule

Every generated rule, scenario, finding, and defect hypothesis must name its source:
backend confirmed, OpenAPI, approved documentation, real response, Graphify indication, or fallback mapper indication.

## Guardrails

- Do not invent status, message, required field, limit, permission, or business behavior.
- Do not weaken assertions to make tests pass.
- Do not mark `@bug` without execution evidence or documented backend violation.
- Do not overwrite existing project files without reading them and explaining the change.
- Do not install Python tools unless the explicit Graphify install command is invoked.
- Do not use postinstall hooks for Python or Graphify.

## Minimum Delivery Checklist

- State whether Graphify was used, missing, stale, or replaced by fallback.
- Save or include graph evidence for creation/review discovery work.
- Confirm contract details from authoritative sources before implementing tests.
- Produce map of rules, context/mass map, and scenario matrix before test implementation.
- Report implemented scenarios, skipped/lacuna scenarios, commands run, and remaining risks.
