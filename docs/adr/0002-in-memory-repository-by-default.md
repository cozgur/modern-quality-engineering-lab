# ADR-0002: In-memory repository by default, PostgreSQL where semantics matter

**Status:** Accepted

## Context

The sample service needs persistence to make the checkout journey meaningful. Requiring Docker for
every test layer would slow down E2E, contract and API tests and make local onboarding harder.

## Decision

The HTTP layer depends on an `OrderRepository` interface. `createApp()` defaults to an in-memory
implementation, which the API, contract and E2E suites use. A `PostgresOrderRepository` exists for
the Testcontainers integration suite, which proves database-enforced invariants (`CHECK`, primary key)
and the full HTTP-to-database path.

## Consequences

- Only `npm run test:integration` needs Docker.
- The Playwright `webServer` starts in well under a second.
- The repository interface is small and must stay small; adding query-heavy features would push
  more tests into the integration layer, which is the intended trade-off.
