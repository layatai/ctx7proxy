import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { SettingsStore } from '../src/desktop/settings-store.js';

test('encrypts API keys at rest and exposes only masked keys publicly', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'ctx7proxy-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'settings.json');
  const store = new SettingsStore({
    path,
    encrypt: (value) => Buffer.from(value).toString('base64'),
    decrypt: (value) => Buffer.from(value, 'base64').toString()
  });

  const saved = await store.save({
    accounts: [{ label: 'Primary', apiKey: 'ctx7sk-secret-value' }],
    port: 3333,
    proxyApiKey: 'local-secret'
  });
  const raw = await readFile(path, 'utf8');
  assert.equal(raw.includes('ctx7sk-secret-value'), false);
  assert.equal(saved.accounts[0].apiKey, 'ctx7sk-secret-value');
  const view = SettingsStore.publicView(saved, { state: 'running' });
  assert.equal('apiKey' in view.accounts[0], false);
  assert.match(view.accounts[0].maskedKey, /^ctx7sk-s/);
});

test('rejects invalid ports and keys without replacing settings', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'ctx7proxy-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = new SettingsStore({ path: join(directory, 'settings.json'), encrypt: String, decrypt: String });
  await assert.rejects(store.save({ accounts: [], port: 0 }), /Port/);
  await assert.rejects(store.save({ accounts: [{ apiKey: 'bad' }], port: 3000 }), /ctx7sk/);
});
