import type { Pool } from 'pg';
import type { Order, OrderRepository } from './order-repository.js';

type OrderRow = {
  id: string;
  product_id: string;
  quantity: number;
  status: Order['status'];
};

/**
 * PostgreSQL-backed repository. Deliberately uses a CHECK constraint and a
 * primary key so the integration tests can prove that the database enforces
 * invariants even if application-level validation is bypassed.
 */
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async migrate(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id         text PRIMARY KEY,
        product_id text NOT NULL,
        quantity   integer NOT NULL CHECK (quantity > 0),
        status     text NOT NULL
      )
    `);
  }

  async save(order: Order): Promise<void> {
    await this.pool.query('INSERT INTO orders (id, product_id, quantity, status) VALUES ($1, $2, $3, $4)', [
      order.id,
      order.productId,
      order.quantity,
      order.status,
    ]);
  }

  async findById(id: string): Promise<Order | undefined> {
    const result = await this.pool.query<OrderRow>(
      'SELECT id, product_id, quantity, status FROM orders WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? toOrder(row) : undefined;
  }
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    status: row.status,
  };
}
