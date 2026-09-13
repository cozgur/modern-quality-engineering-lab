import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchUser } from '../../src/user-client.js';

describe('fetchUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('requests the user by id and returns the parsed body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 42, name: 'Ada Tester', plan: 'pro' }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUser('http://api.test', 42)).resolves.toEqual({
      id: 42,
      name: 'Ada Tester',
      plan: 'pro',
    });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/users/42');
  });

  test('throws a descriptive error on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

    await expect(fetchUser('http://api.test', 7)).rejects.toThrow('User API failed with 404');
  });
});
