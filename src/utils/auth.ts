export function getAuthToken(): string | undefined {
  return process.env.THINGS_AUTH_TOKEN;
}

export function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw new Error('THINGS_AUTH_TOKEN environment variable is required for update operations');
  }
  return token;
}