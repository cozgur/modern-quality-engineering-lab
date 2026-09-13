# ADR-0005: No screenshot baselines in this repository

**Status:** Accepted

## Context

Playwright's `toHaveScreenshot` is valuable for design-system regressions, but baselines depend on
OS, fonts and GPU rendering. Contributors on macOS and CI on Ubuntu would produce different pixels.

## Decision

Visual regression is out of scope for this repository. Structure and behaviour are asserted through
roles, text and accessibility checks instead.

## Consequences

- No platform-specific snapshot directories to maintain.
- If visual coverage is added later, baselines should be generated inside the same container image
  that CI uses, and stored per-project rather than per-developer.
