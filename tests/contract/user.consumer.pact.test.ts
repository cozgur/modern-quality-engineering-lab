import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { Matchers, Pact } from '@pact-foundation/pact';
import { fetchUser } from '../../src/user-client.js';

const provider = new Pact({
  consumer: 'quality-lab-web',
  provider: 'quality-lab-user-api',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('User API consumer contract', () => {
  test('returns the user shape expected by the consumer', async () => {
    const interaction = provider
      .addInteraction()
      .given('user 42 exists')
      .uponReceiving('a request for user 42')
      .withRequest('GET', '/api/users/42')
      .willRespondWith(200, (builder) => {
        builder.jsonBody({
          id: Matchers.integer(42),
          name: Matchers.string('Ada Tester'),
          plan: Matchers.string('pro'),
        });
      });

    await interaction.executeTest(async (mockServer) => {
      const user = await fetchUser(mockServer.url, 42);
      expect(user).toEqual({ id: 42, name: 'Ada Tester', plan: 'pro' });
    });
  });
});
