# ADR-0001: Choose the test layer by risk, not by tool

**Status:** Accepted

## Context

Test suites in many teams grow bottom-up from whichever tool was adopted first, which usually means
too many browser tests asserting backend behaviour. Those suites are slow, flaky and expensive to
diagnose.

## Decision

Each behaviour is tested at the lowest layer that can prove it:

- pure logic in unit tests,
- HTTP semantics in in-process API tests,
- consumer/provider compatibility in contract tests,
- database semantics in integration tests with a real engine,
- and only the critical user journey plus user-visible failure handling in the browser.

## Consequences

- The browser suite stays small (currently four specs) and fast.
- Adding a validation rule means adding a table row in `tests/unit`, not a new Playwright spec.
- Reviewers can reject a PR that tests an API status code through the UI by pointing to this record.
