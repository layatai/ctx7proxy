import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_PORT, loadConfig, parseApiKeys } from '../src/config.js';

test('uses the uncommon default proxy port', () => {
  assert.equal(DEFAULT_PORT, 47_837);
  assert.equal(loadConfig({ CONTEXT7_API_KEYS: 'ctx7sk-a' }).port, DEFAULT_PORT);
});

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
