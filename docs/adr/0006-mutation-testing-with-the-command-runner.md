# ADR-0006: Mutation testing runs through Stryker's command runner

**Status:** Accepted

## Context

Line coverage on `src/` was already 100%, which says nothing about whether the assertions would
notice a bug. Mutation testing answers that question by injecting faults and counting how many the
suites catch. Stryker's in-process Vitest runner is the fast path, but on Vitest 5 (Vite 8, rolldown)
it did not switch mutants inside the test workers: 134 of 138 mutants "survived" even though the
tests plainly cover the code.

## Decision

Stryker uses the `command` runner with a dedicated `vitest.stryker.config.ts` that runs only the unit
and API suites, so every mutant is exercised from disk by a fresh Vitest process. Coverage analysis
is off because the command runner cannot map tests to mutants. Contract and integration suites are
excluded on purpose: they need a Pact binary and Docker and would multiply the runtime for no
additional signal about `src/` logic.

## Consequences

- A full run takes about 40 seconds locally and a few minutes in CI, acceptable for a per-commit gate.
- The break threshold is 80; the score after acting on the first report is 96%.
- The first run exposed four real gaps that coverage hid: the static page was never requested, the
  default order-id generator was never exercised, non-`Error` throws in the repository were not
  tested, and the out-of-range quantity message was never asserted. Tests were added for each.
- The remaining survivors are equivalent mutants on defensive guards (for example replacing
  `typeof error === 'object'` with `true` inside a chain that still fails on the next check).
- Revisit the in-process runner when `@stryker-mutator/vitest-runner` declares Vitest 5 support.
