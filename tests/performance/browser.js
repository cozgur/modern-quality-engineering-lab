import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    browser: {
      executor: 'shared-iterations',
      vus: 2,
      iterations: 4,
      options: {
        browser: { type: 'chromium' },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(baseUrl);
    const heading = page.getByRole('heading', { name: 'Modern Quality Engineering Lab' });
    check(await heading.textContent(), {
      'main heading rendered': (text) => text === 'Modern Quality Engineering Lab',
    });
  } finally {
    await page.close();
  }
}
