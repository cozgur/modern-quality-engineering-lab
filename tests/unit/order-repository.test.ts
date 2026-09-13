import { describe, expect, test } from 'vitest';
import { InMemoryOrderRepository, type Order } from '../../src/order-repository.js';

const order: Order = { id: 'order-1', productId: 'quality-lab', quantity: 1, status: 'confirmed' };

describe('InMemoryOrderRepository', () => {
  test('stores a copy so later mutation of the input does not leak into storage', async () => {
    const repository = new InMemoryOrderRepository();
    const input = { ...order };

    await repository.save(input);
    input.quantity = 99;

    await expect(repository.findById('order-1')).resolves.toEqual(order);
  });

  test('returns undefined for an unknown id', async () => {
    await expect(new InMemoryOrderRepository().findById('missing')).resolves.toBeUndefined();
  });

  test('rejects duplicate ids, mirroring the primary key in PostgreSQL', async () => {
    const repository = new InMemoryOrderRepository();
    await repository.save(order);

    await expect(repository.save(order)).rejects.toThrow('Order order-1 already exists');
  });
});
