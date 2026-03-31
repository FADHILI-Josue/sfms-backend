import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(secret, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString('base64')}$${derivedKey.toString('base64')}`;
}

export async function verifySecret(stored: string, secret: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [algo, saltB64, hashB64] = parts;
  if (algo !== 'scrypt') return false;

  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');

  const derivedKey = (await scrypt(secret, salt, expected.length)) as Buffer;
  return timingSafeEqual(expected, derivedKey);
}

