import assert from 'node:assert/strict';
import test from 'node:test';
import { createLoginAgentPlist, LOGIN_AGENT_LABEL } from '../src/desktop/login-item.js';

test('creates a hidden per-user launch agent for source-launched Electron', () => {
  const plist = createLoginAgentPlist({
    executable: '/Applications/Electron & Tools/Electron',
    appDirectory: '/Users/test/ctx7proxy'
  });

  assert.match(plist, new RegExp(`<string>${LOGIN_AGENT_LABEL}</string>`));
  assert.match(plist, /<string>\/Applications\/Electron &amp; Tools\/Electron<\/string>/);
  assert.match(plist, /<string>\/Users\/test\/ctx7proxy<\/string>/);
  assert.match(plist, /<string>--hidden<\/string>/);
  assert.match(plist, /<key>RunAtLoad<\/key>\s*<true\/>/);
});
