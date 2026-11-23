import crypto from 'crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_PREFIX = 'scrypt$';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function toHex(value: Buffer): string {
  return value.toString('hex');
}

function fromHex(value: string): Buffer {
  return Buffer.from(value, 'hex');
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Hash a password with scrypt. Format: scrypt$salt$hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${SCRYPT_PREFIX}${salt}$${toHex(derived)}`;
}

export function isHashedPassword(stored: string | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(SCRYPT_PREFIX);
}

/**
 * Verify a password against a stored hash. Legacy plaintext accounts are
 * accepted so old local stores keep working (and get upgraded on login).
 */
export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;

  if (!isHashedPassword(stored)) {
    // Legacy plaintext account.
    return safeEqual(Buffer.from(password, 'utf8'), Buffer.from(stored, 'utf8'));
  }

  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;

  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return safeEqual(derived, fromHex(hash));
}

/**
 * Create a signed session token: <userId>.<expiryMs>.<hmac>
 */
export function createToken(userId: string, secret: string, now: number = Date.now()): string {
  const expiry = now + TOKEN_TTL_MS;
  const payload = `${userId}.${expiry}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verify a session token and return the user id it belongs to.
 * Returns null for any malformed, expired or forged token.
 */
export function verifyToken(token: string | undefined, secret: string, now: number = Date.now()): string | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [userId, expiryRaw, signature] = parts;
  if (!userId || !expiryRaw || !signature) return null;

  const expiry = Number(expiryRaw);
  if (!Number.isFinite(expiry) || expiry <= now) return null;

  const expected = crypto.createHmac('sha256', secret).update(`${userId}.${expiryRaw}`).digest('hex');
  if (!safeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))) {
    return null;
  }

  return userId;
}

/**
 * Resolve (and persist on first use) the server signing secret.
 * The secret lives next to the store so restarts keep sessions valid.
 */
export function resolveSecret(existing: string | undefined, fallback: string): string {
  if (existing && existing.length >= 32) return existing;
  return fallback;
}

export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
