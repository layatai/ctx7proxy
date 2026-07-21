import assert from 'node:assert/strict';
import test from 'node:test';
import { createSetupGuides } from '../src/desktop/setup-config.js';

test('generates Codex and generic MCP configuration from the live endpoint', () => {
  const guides = createSetupGuides({ endpoint: 'http://127.0.0.1:3333/mcp', hasProxyApiKey: false });
  assert.match(guides.codex, /url = "http:\/\/127\.0\.0\.1:3333\/mcp"/);
  assert.deepEqual(JSON.parse(guides.generic), {
    mcpServers: { context7: { url: 'http://127.0.0.1:3333/mcp' } }
  });
  assert.equal(guides.codex.includes('Authorization'), false);
});

test('adds a safe placeholder when client authentication is enabled', () => {
  const guides = createSetupGuides({ endpoint: 'http://127.0.0.1:47837/mcp', hasProxyApiKey: true });
  assert.match(guides.codex, /Authorization = "Bearer YOUR_PROXY_ACCESS_TOKEN"/);
  assert.equal(JSON.parse(guides.generic).mcpServers.context7.headers.Authorization, 'Bearer YOUR_PROXY_ACCESS_TOKEN');
  assert.equal(guides.requiresAccessToken, true);
});

test('rejects an unavailable or non-local-style endpoint', () => {
  assert.throws(() => createSetupGuides({ endpoint: null, hasProxyApiKey: false }), /unavailable/);
  assert.throws(() => createSetupGuides({ endpoint: 'file:///tmp/proxy', hasProxyApiKey: false }), /unavailable/);
});
