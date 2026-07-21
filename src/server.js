import { loadConfig } from './config.js';
import { startProxyServer } from './proxy-server.js';

const config = loadConfig();
const server = await startProxyServer(config);
console.log(`Context7 proxy listening on ${server.address}`);
console.log(`Loaded ${config.apiKeys.length} Context7 account(s)`);

const shutdown = () => server.close().finally(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
