import { createServer } from 'node:http';
import { AccountPool } from './account-pool.js';
import { createProxyHandler } from './proxy.js';

export const startProxyServer = async ({ apiKeys, host, port, proxyApiKey, cooldownMs, maxBodyBytes }) => {
  const pool = new AccountPool(apiKeys, { cooldownMs });
  const server = createServer(createProxyHandler({ pool, maxBodyBytes, proxyApiKey }));

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    address: `http://${host}:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
};
