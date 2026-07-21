import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const defaults = {
  accounts: [],
  host: '127.0.0.1',
  port: 3000,
  proxyApiKey: '',
  launchAtLogin: false
};

const validatePort = (port) => {
  const parsed = Number(port);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error('Port must be an integer between 1 and 65535');
  }
  return parsed;
};

export class SettingsStore {
  #path;
  #encrypt;
  #decrypt;

  constructor({ path, encrypt, decrypt }) {
    this.#path = path;
    this.#encrypt = encrypt;
    this.#decrypt = decrypt;
  }

  async load() {
    try {
      const stored = JSON.parse(await readFile(this.#path, 'utf8'));
      return {
        ...defaults,
        ...stored,
        accounts: (stored.accounts || []).map((account) => ({
          id: account.id,
          label: account.label,
          apiKey: this.#decrypt(account.secret)
        })),
        proxyApiKey: stored.proxySecret ? this.#decrypt(stored.proxySecret) : ''
      };
    } catch (error) {
      if (error.code === 'ENOENT') return structuredClone(defaults);
      throw new Error(`Unable to read encrypted settings: ${error.message}`);
    }
  }

  async save(input) {
    const settings = {
      host: '127.0.0.1',
      port: validatePort(input.port),
      launchAtLogin: Boolean(input.launchAtLogin),
      accounts: (input.accounts || []).map((account) => {
        const apiKey = String(account.apiKey || '').trim();
        if (!apiKey.startsWith('ctx7sk')) throw new Error('Every API key must start with ctx7sk');
        return {
          id: account.id || crypto.randomUUID(),
          label: String(account.label || 'Context7 account').trim().slice(0, 80),
          secret: this.#encrypt(apiKey)
        };
      }),
      proxySecret: input.proxyApiKey ? this.#encrypt(String(input.proxyApiKey)) : ''
    };

    await mkdir(dirname(this.#path), { recursive: true });
    const temporaryPath = `${this.#path}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
    await rename(temporaryPath, this.#path);
    return this.load();
  }

  static publicView(settings, runtime) {
    return {
      accounts: settings.accounts.map(({ id, label, apiKey }) => ({
        id,
        label,
        maskedKey: `${apiKey.slice(0, 8)}••••${apiKey.slice(-4)}`
      })),
      port: settings.port,
      launchAtLogin: settings.launchAtLogin,
      hasProxyApiKey: Boolean(settings.proxyApiKey),
      runtime
    };
  }
}
