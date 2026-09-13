import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('Accessibility', () => {
  test('homepage has no automatically detectable WCAG A/AA violations', async ({ page }, testInfo) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    // Attach the full report so a failure is diagnosable from the HTML report alone.
    await testInfo.attach('axe-results', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });

    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}`);
    expect(summary, 'axe-core violations').toEqual([]);
  });

  test('checkout status update stays accessible after interaction', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Run demo checkout' }).click();
    await expect(page.getByRole('status')).toContainText('Order confirmed:');

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
});
