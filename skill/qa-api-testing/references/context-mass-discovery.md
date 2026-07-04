# Context And Mass Discovery

Use this reference when planning API test data, setup, isolation, and cleanup.

## Goals

- Identify the minimum valid data needed for each operation.
- Separate product/domain preconditions from test implementation details.
- Avoid tests that fail only because mass or permission setup is unavailable.
- Preserve state after negative and security scenarios.

## Discovery Questions

- Is the resource creatable by API?
- Does it require parent entities such as empresa, contrato, beneficiario, or plano?
- Are IDs generated, fixed, limited, or externally managed?
- Are there enums, statuses, dates, or configuration flags that constrain valid transitions?
- Can invalid operations create, update, or delete data accidentally?
- Is there a deterministic way to clean created data?
- Does permission testing have real credentials or profiles?

## Strategy Map

| API shape | Initial strategy |
| --- | --- |
| POST + GET + PUT/PATCH + DELETE | unique mass per run and cleanup by id |
| GET only | validate response contract and filters without mutating state |
| global config | capture original value and restore after each test |
| limited code space | find or reserve a free code deterministically |
| dependent payload | create/read parent IDs from confirmed source |
| permission sensitive | use real no-permission user or register lacuna |

## Guardrails

- Do not rely on random existing records without a fallback or cleanup plan.
- Do not make a no-permission scenario executable without real no-permission mass.
- Do not assume duplicate, pagination, transition, or deletion rules without evidence.
- Negative write operations must prove no unintended creation or mutation when possible.
