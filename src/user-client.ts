export type User = {
  id: number;
  name: string;
  plan: string;
};

export async function fetchUser(baseUrl: string, id: number): Promise<User> {
  const response = await fetch(`${baseUrl}/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`User API failed with ${response.status}`);
  }
  return response.json() as Promise<User>;
}
