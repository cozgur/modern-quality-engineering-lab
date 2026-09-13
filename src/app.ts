import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { validateCheckout } from './checkout.js';
import { InMemoryOrderRepository, type Order, type OrderRepository } from './order-repository.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

export type AppDependencies = {
  orders: OrderRepository;
  /** Injectable so tests can assert on deterministic ids. */
  newOrderId?: () => string;
};

const demoUser = { id: 42, name: 'Ada Tester', plan: 'pro' };

export function createApp(deps: AppDependencies = { orders: new InMemoryOrderRepository() }) {
  const { orders, newOrderId = () => `order-${randomUUID()}` } = deps;
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDir));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/users/:id', (req, res) => {
    if (req.params.id !== String(demoUser.id)) {
      res.status(404).json({ error: 'user_not_found' });
      return;
    }
    res.json(demoUser);
  });

  app.post('/api/checkout', async (req, res) => {
    const validation = validateCheckout(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: 'invalid_checkout', reason: validation.reason });
      return;
    }

    const order: Order = { id: newOrderId(), ...validation.value, status: 'confirmed' };
    await orders.save(order);

    res.status(201).json({
      orderId: order.id,
      status: order.status,
      productId: order.productId,
      quantity: order.quantity,
    });
  });

  app.get('/api/orders/:id', async (req, res) => {
    const order = await orders.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'order_not_found' });
      return;
    }
    res.json(order);
  });

  app.use(errorHandler);
  return app;
}

function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isBodyParseError(error)) {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'internal_error' });
}

function isBodyParseError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed'
  );
}
