# Architecture Decision Records

Short records of decisions that are not obvious from the code alone.
Format: context, decision, consequences. New decisions get the next number.

| ADR | Decision |
|---|---|
| [0001](0001-risk-based-layer-selection.md) | Choose the test layer by the risk it addresses, not by tool preference |
| [0002](0002-in-memory-repository-by-default.md) | The app runs on an in-memory repository unless a real database is the point |
| [0003](0003-pacts-generated-not-committed.md) | Pact files are generated in CI rather than committed |
| [0004](0004-agents-propose-humans-approve.md) | AI agents propose tests and repairs; humans approve intent |
| [0005](0005-no-visual-regression-baselines.md) | No screenshot baselines in this repository |
