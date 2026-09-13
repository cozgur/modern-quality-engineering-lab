# ADR-0004: Agents propose tests and repairs; humans approve intent

**Status:** Accepted

## Context

Playwright ships planner, generator and healer agents, and Playwright MCP lets any agent drive a
browser. These tools accelerate exploration and maintenance, but they can also silently change what
a test *means* (for example, by "healing" an assertion to match a regression).

## Decision

Agent output is treated like a contribution from a new team member:

1. Planner output is a Markdown plan that a human reviews for scope and risk.
2. Generated tests go through the same PR review and CI as hand-written tests.
3. A healer may fix locator drift; a change to an expected value requires explicit human approval.
4. CI never invokes an agent. It runs only deterministic, version-controlled tests.

## Consequences

- Agent-assisted work is reproducible and auditable through git history.
- Reviewers have a documented reason to reject a "passing" healed test that changed business intent.
- The workflow is described in `docs/agentic-testing.md` and regenerated with `npm run agents:*`.
