import { Readable } from 'node:stream';

const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length'
]);
const DECODED_RESPONSE_HEADERS = new Set([...HOP_BY_HOP_HEADERS, 'content-encoding']);

const copyHeaders = (headers) => {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) {
      result.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  return result;
};

const readBody = async (request, limit) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('Request body too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
};

const writeResponse = (response, upstream) => {
  response.statusCode = upstream.status;
  upstream.headers.forEach((value, name) => {
    if (!DECODED_RESPONSE_HEADERS.has(name.toLowerCase())) response.setHeader(name, value);
  });
  if (!upstream.body) return response.end();
  Readable.fromWeb(upstream.body).pipe(response);
};

const isRetryable = (status) => status === 401 || status === 403 || status === 429 || status >= 500;

export const createProxyHandler = ({ pool, fetchImpl = fetch, maxBodyBytes = 1_048_576, proxyApiKey = null }) => {
  const sessions = new Map();

  return async (request, response) => {
    if (request.url === '/health') {
      response.setHeader('content-type', 'application/json');
      return response.end(JSON.stringify({ status: 'ok', accounts: pool.status() }));
    }

    if (proxyApiKey && request.headers.authorization !== `Bearer ${proxyApiKey}`) {
      response.writeHead(401, { 'content-type': 'application/json' });
      return response.end(JSON.stringify({ error: 'unauthorized' }));
    }

    try {
      const incomingUrl = new URL(request.url, 'http://proxy.local');
      const isMcp = incomingUrl.pathname === '/mcp' || incomingUrl.pathname.startsWith('/mcp/');
      const upstreamBase = isMcp ? 'https://mcp.context7.com' : 'https://context7.com';
      if (!isMcp && !incomingUrl.pathname.startsWith('/api/')) {
        response.writeHead(404, { 'content-type': 'application/json' });
        return response.end(JSON.stringify({ error: 'not_found' }));
      }

      const body = await readBody(request, maxBodyBytes);
      const sessionId = request.headers['mcp-session-id'];
      const excluded = new Set();
      let pinnedAccount = sessionId ? sessions.get(sessionId) : null;

      while (true) {
        const account = pinnedAccount && !excluded.has(pinnedAccount.id)
          ? pinnedAccount
          : pool.acquire(excluded);
        pinnedAccount = null;
        if (!account) {
          response.writeHead(503, { 'content-type': 'application/json', 'retry-after': '1' });
          return response.end(JSON.stringify({ error: 'no_available_context7_accounts' }));
        }

        const headers = copyHeaders(request.headers);
        headers.delete('authorization');
        headers.delete('context7_api_key');
        if (isMcp) headers.set('CONTEXT7_API_KEY', account.key);
        else headers.set('Authorization', `Bearer ${account.key}`);

        let upstream;
        try {
          upstream = await fetchImpl(`${upstreamBase}${incomingUrl.pathname}${incomingUrl.search}`, {
            method: request.method,
            headers,
            body,
            redirect: 'manual'
          });
        } catch {
          pool.report(account, 503);
          excluded.add(account.id);
          continue;
        }

        if (isRetryable(upstream.status)) {
          const retryAfter = Number(upstream.headers.get('retry-after'));
          pool.report(account, upstream.status, retryAfter);
          excluded.add(account.id);
          await upstream.body?.cancel();
          continue;
        }

        const returnedSessionId = upstream.headers.get('mcp-session-id');
        if (returnedSessionId) sessions.set(returnedSessionId, account);
        if (request.method === 'DELETE' && sessionId) sessions.delete(sessionId);
        return writeResponse(response, upstream);
      }
    } catch (error) {
      response.writeHead(error.statusCode || 502, { 'content-type': 'application/json' });
      return response.end(JSON.stringify({ error: error.statusCode ? 'invalid_request' : 'upstream_error' }));
    }
  };
};
