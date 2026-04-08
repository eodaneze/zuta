import * as bcrypt from 'bcrypt';

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareToken(
  plainToken: string,
  hashedToken: string,
): Promise<boolean> {
  return bcrypt.compare(plainToken, hashedToken);
}