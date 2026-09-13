## What changed

<!-- One or two sentences. Link the ADR if this changes a documented decision. -->

## Which quality layer does this touch?

- [ ] Unit / API (Vitest)
- [ ] Contract (Pact)
- [ ] Integration (Testcontainers)
- [ ] Browser E2E / accessibility (Playwright)
- [ ] Performance (k6)
- [ ] AI evaluation (Promptfoo)
- [ ] CI / tooling / docs

## Checklist

- [ ] `npm run check` passes locally
- [ ] New behaviour is tested at the lowest layer that can prove it
- [ ] Browser tests use role-based locators and web-first assertions (no `waitForTimeout`)
- [ ] Agent-generated tests were reviewed for intent, not just for passing
