# ADR-0003: Pact files are generated in CI, not committed

**Status:** Accepted

## Context

Pact produces a JSON contract from the consumer test that the provider verification replays. In a
single repository both sides run in the same CI job, so the file can be regenerated on every run.

## Decision

`pacts/` is git-ignored. The consumer test writes the contract and the provider test reads it in the
same job. The generated pact is uploaded as a CI artifact for inspection.

## Consequences

- No stale contract can be committed by accident.
- The provider test fails fast with a clear message if the consumer test has not run first.
- In a real multi-repository setup this would be replaced by publishing to a Pact Broker and using
  `can-i-deploy`; that step is intentionally out of scope for a single-repo showcase.
