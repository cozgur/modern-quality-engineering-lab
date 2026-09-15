import { defineConfig } from 'vitest/config';

// Playwright owns tests/e2e; Vitest owns everything below the browser.
export default defineConfig({
  test: {
    include: ['tests/{unit,api,contract,integration}/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/server.ts', 'src/instrumentation.ts', 'src/postgres-order-repository.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
