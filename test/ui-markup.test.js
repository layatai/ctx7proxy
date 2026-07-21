import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('launch-at-login control remains accessible and uses dedicated switch markup', async () => {
  const html = await readFile(new URL('../src/desktop/renderer/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/desktop/renderer/styles.css', import.meta.url), 'utf8');

  assert.match(html, /for="launch-at-login"/);
  assert.match(html, /id="launch-at-login"[^>]+role="switch"/);
  assert.match(html, /class="switch-track"/);
  assert.doesNotMatch(css, /\.toggle input\s*\{[^}]*display\s*:\s*none/);
});

test('endpoint presents the client setup helper as a primary action', async () => {
  const html = await readFile(new URL('../src/desktop/renderer/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="open-setup"[^>]*>Set up a client/);
  assert.match(html, /id="setup-dialog"/);
});
