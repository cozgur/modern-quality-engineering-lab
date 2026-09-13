import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createApp } from '../../src/app.js';
import { PostgresOrderRepository } from '../../src/postgres-order-repository.js';

/**
 * Real PostgreSQL via Testcontainers. One disposable container per test file,
 * torn down afterwards. Requires Docker; see README for when this layer is
 * worth its cost compared with the in-memory repository.
 */
describe('PostgresOrderRepository (Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let repository: PostgresOrderRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    repository = new PostgresOrderRepository(pool);
    await repository.migrate();
  }, 120_000);

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  test('persists an order and reads it back with the same shape', async () => {
    await repository.save({ id: 'order-1', productId: 'quality-lab', quantity: 2, status: 'confirmed' });

    await expect(repository.findById('order-1')).resolves.toEqual({
      id: 'order-1',
      productId: 'quality-lab',
      quantity: 2,
      status: 'confirmed',
    });
  });

  test('returns undefined for an unknown id', async () => {
    await expect(repository.findById('missing')).resolves.toBeUndefined();
  });

  test('rejects duplicate ids through the primary key (unique_violation 23505)', async () => {
    const order = { id: 'order-dup', productId: 'quality-lab', quantity: 1, status: 'confirmed' as const };
    await repository.save(order);

    await expect(repository.save(order)).rejects.toMatchObject({ code: '23505' });
  });

  test('database CHECK constraint rejects a non-positive quantity even if app validation is bypassed', async () => {
    await expect(
      pool.query('INSERT INTO orders (id, product_id, quantity, status) VALUES ($1, $2, $3, $4)', [
        'order-bad',
        'quality-lab',
        0,
        'confirmed',
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });

  test('checkout through the HTTP API is persisted in PostgreSQL', async () => {
    const app = createApp({ orders: repository, newOrderId: () => 'order-http-1' });

    const created = await request(app).post('/api/checkout').send({ productId: 'quality-lab', quantity: 5 });
    expect(created.status).toBe(201);

    const row = await pool.query('SELECT product_id, quantity, status FROM orders WHERE id = $1', [
      'order-http-1',
    ]);
    expect(row.rows).toEqual([{ product_id: 'quality-lab', quantity: 5, status: 'confirmed' }]);
  });
});
