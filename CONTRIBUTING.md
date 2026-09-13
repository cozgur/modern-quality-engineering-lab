# Contributing

Thanks for taking a look. This repository is a portfolio and teaching project, but it is run like a
real codebase: every change goes through the same quality gates.

## Setup

```bash
nvm use            # Node 22, see .nvmrc
npm ci
npx playwright install --with-deps chromium
```

Docker is required only for `npm run test:integration`.

## Before opening a PR

```bash
npm run check      # lint + format + types + unit + API tests
npm run test:contract
npm run test:e2e
```

## Conventions

- **Test at the lowest layer that proves the behaviour.** See `docs/test-strategy.md`.
- **Browser tests:** role-based locators, web-first assertions, no `waitForTimeout`.
- **Decisions that are not obvious from code** get an ADR in `docs/adr/`.
- **Agent-generated tests** are reviewed for intent, not only for a green run (ADR-0004).
- **Dependencies are pinned.** Dependabot opens grouped weekly PRs; CI must pass before merging.
