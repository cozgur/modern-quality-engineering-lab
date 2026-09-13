export type Order = {
  id: string;
  productId: string;
  quantity: number;
  status: 'confirmed';
};

/**
 * Persistence boundary for orders. The HTTP layer only depends on this
 * interface, so the same API tests run against the in-memory implementation
 * and the real PostgreSQL implementation (see tests/integration).
 */
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | undefined>;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    if (this.orders.has(order.id)) {
      throw new Error(`Order ${order.id} already exists`);
    }
    this.orders.set(order.id, { ...order });
  }

  async findById(id: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    return order ? { ...order } : undefined;
  }
}
