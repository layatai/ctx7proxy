import { app, BrowserWindow, clipboard, ipcMain, Menu, nativeImage, safeStorage, shell, Tray } from 'electron';
import { join } from 'node:path';
import { SettingsStore } from './settings-store.js';
import { createSetupGuides } from './setup-config.js';
import { createTrayIcon } from './tray-icon.js';
import { startProxyServer } from '../proxy-server.js';

let tray;
let window;
let proxyServer;
let runtime = { state: 'stopped', message: 'Add an account to start the proxy' };
let settings;
let store;

const encryption = () => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Operating-system secure storage is unavailable');
  }
  return {
    encrypt: (value) => safeStorage.encryptString(value).toString('base64'),
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value, 'base64'))
  };
};

const stopProxy = async () => {
  if (proxyServer) await proxyServer.close();
  proxyServer = null;
};

const restartProxy = async () => {
  await stopProxy();
  if (settings.accounts.length === 0) {
    runtime = { state: 'stopped', message: 'Add an account to start the proxy' };
  } else {
    try {
      proxyServer = await startProxyServer({
        apiKeys: settings.accounts.map(({ apiKey }) => apiKey),
        host: settings.host,
        port: settings.port,
        proxyApiKey: settings.proxyApiKey || null,
        cooldownMs: 60_000,
        maxBodyBytes: 1_048_576
      });
      runtime = { state: 'running', message: proxyServer.address };
    } catch (error) {
      runtime = { state: 'error', message: error.message };
    }
  }
  refreshTrayMenu();
};

const showWindow = () => {
  if (!window) {
    window = new BrowserWindow({
      width: 760,
      height: 680,
      minWidth: 640,
      minHeight: 560,
      title: 'ctx7proxy',
      backgroundColor: '#0d0f10',
      show: false,
      webPreferences: {
        preload: join(import.meta.dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });
    window.removeMenu();
    window.loadFile(join(import.meta.dirname, 'renderer', 'index.html'));
    window.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        window.hide();
      }
    });
  }
  window.show();
  window.focus();
};

function refreshTrayMenu() {
  if (!tray) return;
  const running = runtime.state === 'running';
  tray.setToolTip(`ctx7proxy — ${runtime.state}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: running ? `Running on port ${settings.port}` : `Proxy ${runtime.state}`, enabled: false },
    { label: `${settings.accounts.length} account${settings.accounts.length === 1 ? '' : 's'} in pool`, enabled: false },
    { type: 'separator' },
    { label: 'Open Settings', click: showWindow },
    { label: 'Copy MCP URL', enabled: running, click: () => clipboard.writeText(`${runtime.message}/mcp`) },
    { type: 'separator' },
    { label: 'Quit ctx7proxy', click: () => { app.isQuitting = true; app.quit(); } }
  ]));
}

const saveAndRestart = async (nextSettings) => {
  settings = await store.save(nextSettings);
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
  await restartProxy();
  return SettingsStore.publicView(settings, runtime);
};

const registerIpc = () => {
  ipcMain.handle('settings:get', () => SettingsStore.publicView(settings, runtime));
  ipcMain.handle('setup:get', () => createSetupGuides({
    endpoint: runtime.state === 'running' ? `${runtime.message}/mcp` : null,
    hasProxyApiKey: Boolean(settings.proxyApiKey)
  }));
  ipcMain.handle('clipboard:write', (_event, value) => {
    if (typeof value !== 'string' || value.length === 0 || value.length > 10_000) {
      throw new Error('Clipboard content is invalid');
    }
    clipboard.writeText(value);
  });
  ipcMain.handle('accounts:add', async (_event, account) => saveAndRestart({
    ...settings,
    accounts: [...settings.accounts, { label: account.label, apiKey: account.apiKey }]
  }));
  ipcMain.handle('accounts:remove', async (_event, id) => saveAndRestart({
    ...settings,
    accounts: settings.accounts.filter((account) => account.id !== id)
  }));
  ipcMain.handle('settings:update', async (_event, update) => saveAndRestart({
    ...settings,
    port: update.port,
    launchAtLogin: update.launchAtLogin,
    proxyApiKey: update.proxyApiKey === undefined ? settings.proxyApiKey : update.proxyApiKey
  }));
  ipcMain.handle('external:open', (_event, url) => {
    if (url !== 'https://context7.com/dashboard') throw new Error('URL not allowed');
    return shell.openExternal(url);
  });
};

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showWindow);
  app.whenReady().then(async () => {
    store = new SettingsStore({ path: join(app.getPath('userData'), 'settings.json'), ...encryption() });
    settings = await store.load();
    registerIpc();
    tray = new Tray(createTrayIcon(nativeImage));
    tray.on('click', showWindow);
    if (process.platform === 'darwin') app.dock.hide();
    await restartProxy();
    showWindow();
  }).catch((error) => {
    console.error(error);
    app.quit();
  });
}

app.on('window-all-closed', () => {});
app.on('before-quit', () => { app.isQuitting = true; });
app.on('will-quit', () => { if (proxyServer) proxyServer.close().catch(() => {}); });
