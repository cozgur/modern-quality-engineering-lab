import { defineConfig } from 'vitest/config';

// Stryker mutates src/ and re-runs only the suites that need no Docker or Pact binary:
// unit and API tests are fast enough to run hundreds of times per mutation session.
export default defineConfig({
  test: {
    include: ['tests/{unit,api}/**/*.test.ts'],
  },
});
