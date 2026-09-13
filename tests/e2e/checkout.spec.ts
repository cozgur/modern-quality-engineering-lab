import { expect, test } from '@playwright/test';

/**
 * Browser E2E is reserved for the critical user journey and the user-visible
 * failure path. Everything else about the API is covered below the UI.
 */
test.describe('Checkout journey', () => {
  test('a customer completes the demo checkout and the order exists server-side', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Modern Quality Engineering Lab' })).toBeVisible();

    await page.getByRole('button', { name: 'Run demo checkout' }).click();

    const status = page.getByRole('status');
    await expect(status).toContainText('Order confirmed:');

    // Verify the UI claim through the API instead of trusting the text alone.
    const orderId = (await status.textContent())?.replace('Order confirmed:', '').trim();
    expect(orderId).toBeTruthy();

    const order = await request.get(`/api/orders/${orderId}`);
    expect(order.ok()).toBeTruthy();
    await expect(order.json()).resolves.toMatchObject({
      id: orderId,
      productId: 'quality-lab',
      status: 'confirmed',
    });
  });

  test('a customer sees a clear failure message when the checkout API is unavailable', async ({ page }) => {
    await page.route('**/api/checkout', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'unavailable' }),
      }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Run demo checkout' }).click();

    await expect(page.getByRole('status')).toHaveText('Checkout failed');
    await expect(page.getByRole('button', { name: 'Run demo checkout' })).toBeEnabled();
  });

  test('a customer sees a failure message when the API returns a non-JSON error page', async ({ page }) => {
    await page.route('**/api/checkout', (route) =>
      route.fulfill({ status: 502, contentType: 'text/html', body: '<h1>Bad gateway</h1>' }),
    );

    await page.goto('/');
    await page.getByRole('button', { name: 'Run demo checkout' }).click();

    await expect(page.getByRole('status')).toHaveText('Checkout failed');
  });
});

test('health endpoint is available', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});
