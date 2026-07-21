import assert from 'node:assert/strict';
import test from 'node:test';
import { AccountPool } from '../src/account-pool.js';

test('rotates accounts in round-robin order', () => {
  const pool = new AccountPool(['a', 'b']);
  assert.equal(pool.acquire().key, 'a');
  assert.equal(pool.acquire().key, 'b');
  assert.equal(pool.acquire().key, 'a');
});

test('skips an account while it is cooling down', () => {
  let now = 1_000;
  const pool = new AccountPool(['a', 'b'], { cooldownMs: 500, now: () => now });
  const first = pool.acquire();
  pool.report(first, 429);
  assert.equal(pool.acquire().key, 'b');
  now += 500;
  assert.equal(pool.status()[0].state, 'ready');
});

test('permanently disables rejected credentials', () => {
  const pool = new AccountPool(['a', 'b']);
  const first = pool.acquire();
  pool.report(first, 401);
  assert.equal(pool.status()[0].state, 'disabled');
  assert.equal(pool.acquire().key, 'b');
});
