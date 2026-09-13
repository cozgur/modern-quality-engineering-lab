import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/app.js';
import { InMemoryOrderRepository } from '../../src/order-repository.js';

/**
 * In-process API tests: real Express routing, JSON parsing and error handling,
 * no network, no browser. These run in milliseconds and cover the HTTP contract
 * far more thoroughly than the browser suite should.
 */
describe('HTTP API', () => {
  let ids: string[];
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    ids = ['order-test-1', 'order-test-2'];
    app = createApp({ orders: new InMemoryOrderRepository(), newOrderId: () => ids.shift() ?? 'exhausted' });
  });

  test('GET /api/health reports ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('GET /api/users/:id returns the demo user', async () => {
    const response = await request(app).get('/api/users/42');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 42, name: 'Ada Tester', plan: 'pro' });
  });

  test('GET /api/users/:id returns 404 for unknown users', async () => {
    const response = await request(app).get('/api/users/7');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'user_not_found' });
  });

  test('POST /api/checkout creates an order that can be read back', async () => {
    const created = await request(app).post('/api/checkout').send({ productId: 'quality-lab', quantity: 3 });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      orderId: 'order-test-1',
      status: 'confirmed',
      productId: 'quality-lab',
      quantity: 3,
    });

    const fetched = await request(app).get('/api/orders/order-test-1');
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual({
      id: 'order-test-1',
      productId: 'quality-lab',
      quantity: 3,
      status: 'confirmed',
    });
  });

  test('POST /api/checkout rejects an invalid payload with a reason', async () => {
    const response = await request(app).post('/api/checkout').send({ productId: '', quantity: 0 });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'invalid_checkout',
      reason: 'productId must be a non-empty string',
    });
  });

  test('POST /api/checkout rejects malformed JSON with 400 instead of 500', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .set('content-type', 'application/json')
      .send('{"productId": ');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid_json' });
  });

  test('GET /api/orders/:id returns 404 for unknown orders', async () => {
    const response = await request(app).get('/api/orders/nope');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'order_not_found' });
  });

  test('unexpected repository failures surface as a JSON 500, not a crash', async () => {
    const failing = createApp({
      orders: {
        save: async () => {
          throw new Error('database unavailable');
        },
        findById: async () => undefined,
      },
    });

    const response = await request(failing).post('/api/checkout').send({ productId: 'quality-lab' });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'internal_error' });
  });
});
