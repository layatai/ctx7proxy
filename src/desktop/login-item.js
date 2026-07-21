import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

export const LOGIN_AGENT_LABEL = 'dev.ctx7proxy.desktop';

const execFileAsync = promisify(execFile);
const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export const createLoginAgentPlist = ({ executable, appDirectory }) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LOGIN_AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(executable)}</string>
    <string>${escapeXml(appDirectory)}</string>
    <string>--hidden</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`;

const ignoreMissingService = async (action) => {
  try {
    await action();
  } catch (error) {
    const missingService = error.code === 5
      || String(error.stderr || error.message).includes('Could not find service');
    if (!missingService) throw error;
  }
};

export const configureLoginItem = async ({ app, appDirectory, enabled }) => {
  if (process.platform !== 'darwin' || app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return;
  }

  const agentsDirectory = join(app.getPath('home'), 'Library', 'LaunchAgents');
  const plistPath = join(agentsDirectory, `${LOGIN_AGENT_LABEL}.plist`);
  const domain = `gui/${process.getuid()}`;
  await ignoreMissingService(() => execFileAsync('launchctl', ['bootout', domain, plistPath]));

  if (!enabled) {
    await rm(plistPath, { force: true });
    return;
  }

  await mkdir(agentsDirectory, { recursive: true });
  await writeFile(plistPath, createLoginAgentPlist({
    executable: process.execPath,
    appDirectory
  }), { mode: 0o644 });
  await execFileAsync('launchctl', ['bootstrap', domain, plistPath]);
};
