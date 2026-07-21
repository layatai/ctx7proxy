import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { AccountPool } from '../src/account-pool.js';
import { createProxyHandler } from '../src/proxy.js';

const startProxy = async (fetchImpl, options = {}) => {
  const pool = new AccountPool(['ctx7sk-a', 'ctx7sk-b']);
  const server = createServer(createProxyHandler({ pool, fetchImpl, ...options }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(resolve)) };
};

test('uses bearer authentication for REST and rotates accounts', async (t) => {
  const auth = [];
  const proxy = await startProxy(async (_url, init) => {
    auth.push(init.headers.get('authorization'));
    return new Response('{}', { headers: { 'content-type': 'application/json' } });
  });
  t.after(proxy.close);

  await fetch(`${proxy.url}/api/v2/libs/search?libraryName=node`);
  await fetch(`${proxy.url}/api/v2/libs/search?libraryName=node`);
  assert.deepEqual(auth, ['Bearer ctx7sk-a', 'Bearer ctx7sk-b']);
});

test('fails over after a rate-limited account', async (t) => {
  const usedKeys = [];
  const proxy = await startProxy(async (_url, init) => {
    usedKeys.push(init.headers.get('authorization'));
    return usedKeys.length === 1
      ? new Response('{"error":"limited"}', { status: 429 })
      : new Response('{"ok":true}', { status: 200 });
  });
  t.after(proxy.close);

  const response = await fetch(`${proxy.url}/api/v2/context`);
  assert.equal(response.status, 200);
  assert.deepEqual(usedKeys, ['Bearer ctx7sk-a', 'Bearer ctx7sk-b']);
});

test('does not forward content encoding after fetch decompresses the upstream body', async (t) => {
  const proxy = await startProxy(async () => new Response('{"ok":true}', {
    headers: {
      'content-type': 'application/json',
      'content-encoding': 'gzip'
    }
  }));
  t.after(proxy.close);

  const response = await fetch(`${proxy.url}/api/v2/context`);
  assert.equal(response.headers.has('content-encoding'), false);
  assert.deepEqual(await response.json(), { ok: true });
});

test('uses the Context7 header for MCP requests', async (t) => {
  let key;
  const proxy = await startProxy(async (_url, init) => {
    key = init.headers.get('context7_api_key');
    return new Response('{}', { status: 200 });
  });
  t.after(proxy.close);

  await fetch(`${proxy.url}/mcp`, { method: 'POST', body: '{}' });
  assert.equal(key, 'ctx7sk-a');
});

test('requires the configured proxy bearer token', async (t) => {
  const proxy = await startProxy(async () => new Response('{}'), { proxyApiKey: 'secret' });
  t.after(proxy.close);
  assert.equal((await fetch(`${proxy.url}/api/v2/context`)).status, 401);
  assert.equal((await fetch(`${proxy.url}/api/v2/context`, {
    headers: { authorization: 'Bearer secret' }
  })).status, 200);
});
