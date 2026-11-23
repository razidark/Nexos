import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createToken,
  generateSecret,
  hashPassword,
  isHashedPassword,
  resolveSecret,
  verifyPassword,
  verifyToken,
} from './auth.ts';

const secret = 'a'.repeat(64);

test('hashPassword produces a salted scrypt hash, never the plaintext', () => {
  const hash = hashPassword('super-secret');
  assert.notEqual(hash, 'super-secret');
  assert.ok(isHashedPassword(hash));
  assert.ok(hash.startsWith('scrypt$'));
});

test('two hashes of the same password differ (random salt)', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('verifyPassword accepts the correct password', () => {
  assert.equal(verifyPassword('correct', hashPassword('correct')), true);
});

test('verifyPassword rejects a wrong password', () => {
  assert.equal(verifyPassword('wrong', hashPassword('correct')), false);
});

test('verifyPassword rejects an empty/undefined stored value', () => {
  assert.equal(verifyPassword('anything', undefined), false);
  assert.equal(verifyPassword('anything', ''), false);
});

test('legacy plaintext accounts still log in and are detected as unhashed', () => {
  assert.equal(isHashedPassword('legacyplain'), false);
  assert.equal(verifyPassword('legacyplain', 'legacyplain'), true);
  assert.equal(verifyPassword('nope', 'legacyplain'), false);
});

test('createToken round-trips through verifyToken', () => {
  const token = createToken('usr_123', secret);
  assert.equal(verifyToken(token, secret), 'usr_123');
});

test('verifyToken rejects a token signed with a different secret', () => {
  const token = createToken('usr_123', secret);
  assert.equal(verifyToken(token, 'b'.repeat(64)), null);
});

test('verifyToken rejects a tampered token', () => {
  const token = createToken('usr_123', secret);
  const tampered = token.replace('usr_123', 'usr_999');
  assert.equal(verifyToken(tampered, secret), null);
});

test('verifyToken rejects an expired token', () => {
  const past = Date.now() - 1000 * 60 * 60 * 24 * 30;
  const token = createToken('usr_123', secret, past);
  assert.equal(verifyToken(token, secret), null);
});

test('verifyToken rejects malformed and missing tokens', () => {
  assert.equal(verifyToken(undefined, secret), null);
  assert.equal(verifyToken('', secret), null);
  assert.equal(verifyToken('garbage', secret), null);
  assert.equal(verifyToken('a.b', secret), null);
});

test('resolveSecret keeps a long secret and replaces a short one', () => {
  const long = 'x'.repeat(40);
  assert.equal(resolveSecret(long, 'fallback'), long);
  assert.equal(resolveSecret('short', 'fallback'), 'fallback');
  assert.equal(resolveSecret(undefined, 'fallback'), 'fallback');
});

test('generateSecret returns a long random secret', () => {
  const generated = generateSecret();
  assert.equal(generated.length, 64);
  assert.notEqual(generated, generateSecret());
});
