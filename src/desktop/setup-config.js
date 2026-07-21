const authorizationHeaders = (hasProxyApiKey) => hasProxyApiKey
  ? { Authorization: 'Bearer YOUR_PROXY_ACCESS_TOKEN' }
  : null;

export const createSetupGuides = ({ endpoint, hasProxyApiKey }) => {
  if (!endpoint?.startsWith('http://')) throw new Error('Proxy endpoint is unavailable');

  const headers = authorizationHeaders(hasProxyApiKey);
  const codexLines = [
    '[mcp_servers.context7]',
    `url = "${endpoint}"`
  ];
  if (headers) {
    codexLines.push('', '[mcp_servers.context7.http_headers]', 'Authorization = "Bearer YOUR_PROXY_ACCESS_TOKEN"');
  }

  const server = { url: endpoint };
  if (headers) server.headers = headers;

  return {
    endpoint,
    codex: codexLines.join('\n'),
    generic: JSON.stringify({ mcpServers: { context7: server } }, null, 2),
    requiresAccessToken: hasProxyApiKey
  };
};
