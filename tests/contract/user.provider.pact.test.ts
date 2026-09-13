import fs from 'node:fs';
import path from 'node:path';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { Verifier } from '@pact-foundation/pact';
import { createApp } from '../../src/app.js';

let server: Server;
const port = 3101;

describe('User API provider verification', () => {
  beforeAll(async () => {
    server = createApp().listen(port, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test('satisfies the consumer pact', async () => {
    const pactDir = path.resolve(process.cwd(), 'pacts');
    const pactFile = fs.readdirSync(pactDir).find((name) => name.endsWith('.json'));
    if (!pactFile) throw new Error('No consumer pact file found. Run the consumer contract test first.');

    await new Verifier({
      providerBaseUrl: `http://127.0.0.1:${port}`,
      pactUrls: [path.join(pactDir, pactFile)],
      stateHandlers: {
        'user 42 exists': async () => ({ description: 'Static demo user is available' }),
      },
    }).verifyProvider();
  }, 60_000);
});
