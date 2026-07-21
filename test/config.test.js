import assert from 'node:assert/strict';
import test from 'node:test';
import { parseApiKeys } from '../src/config.js';

test('parses, trims, and deduplicates comma-separated keys', () => {
  assert.deepEqual(parseApiKeys('ctx7sk-a, ctx7sk-b,ctx7sk-a'), ['ctx7sk-a', 'ctx7sk-b']);
});

test('parses JSON array keys', () => {
  assert.deepEqual(parseApiKeys('["ctx7sk-a", "ctx7sk-b"]'), ['ctx7sk-a', 'ctx7sk-b']);
});

test('rejects missing and malformed keys', () => {
  assert.throws(() => parseApiKeys(''), /required/);
  assert.throws(() => parseApiKeys('invalid'), /must start/);
});
