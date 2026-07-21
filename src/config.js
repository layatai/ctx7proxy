const parsePositiveInteger = (value, fallback, name) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

export const DEFAULT_PORT = 47_837;

export const parseApiKeys = (value) => {
  if (!value?.trim()) throw new Error('CONTEXT7_API_KEYS is required');

  let keys;
  if (value.trim().startsWith('[')) {
    try {
      keys = JSON.parse(value);
    } catch {
      throw new Error('CONTEXT7_API_KEYS must be a JSON array or comma-separated list');
    }
  } else {
    keys = value.split(',');
  }

  if (!Array.isArray(keys)) throw new Error('CONTEXT7_API_KEYS must be an array');
  const normalized = [...new Set(keys.map((key) => String(key).trim()).filter(Boolean))];
  if (normalized.length === 0) throw new Error('CONTEXT7_API_KEYS contains no keys');
  if (normalized.some((key) => !key.startsWith('ctx7sk'))) {
    throw new Error('Every Context7 API key must start with ctx7sk');
  }
  return normalized;
};

export const loadConfig = (env = process.env) => ({
  apiKeys: parseApiKeys(env.CONTEXT7_API_KEYS),
  host: env.HOST || '127.0.0.1',
  port: parsePositiveInteger(env.PORT, DEFAULT_PORT, 'PORT'),
  proxyApiKey: env.PROXY_API_KEY?.trim() || null,
  cooldownMs: parsePositiveInteger(env.ACCOUNT_COOLDOWN_MS, 60_000, 'ACCOUNT_COOLDOWN_MS'),
  maxBodyBytes: parsePositiveInteger(env.MAX_BODY_BYTES, 1_048_576, 'MAX_BODY_BYTES')
});
