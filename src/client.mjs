export function createClient({ baseUrl = process.env.QAVVI_URL || 'https://qavvi.xyz', fetchImpl = fetch } = {}) {
  const base = new URL(baseUrl);
  if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))) {
    throw new Error('Use an HTTPS gateway URL, or HTTP localhost for development.');
  }
  async function request(path, body) {
    const response = await fetchImpl(new URL(path, base), {
      method: body === undefined ? 'GET' : 'POST', redirect: 'error',
      signal: AbortSignal.timeout(45000),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.headers.get('content-type')?.includes('json')) {
      throw new Error(`Gateway returned HTTP ${response.status} without JSON. Check QAVVI_URL and API deployment.`);
    }
    const data = await response.json();
    if (response.status === 402) return { paymentRequired: true, status: 402, challenge: response.headers.get('payment-required'), data, automaticallyPaid: false };
    if (!response.ok) throw new Error(`Gateway request failed (HTTP ${response.status}).`);
    return data;
  }
  const idPath = id => {
    if (typeof id !== 'string' || !id.trim()) throw new Error('A service ID is required.');
    return `/api/v1/services/${encodeURIComponent(id)}`;
  };
  return {
    search: (query = '', scope = 'callable') => request(`/api/v1/services?q=${encodeURIComponent(query)}${scope === 'all' ? '&scope=all' : ''}`),
    inspect: id => request(idPath(id)),
    quote: id => request(`${idPath(id)}/quote`),
    call: (id, input, method = 'POST') => {
      if (!['GET', 'POST'].includes(method)) throw new Error('Unsupported method.');
      return request(`${idPath(id)}/call`, { input, method });
    },
  };
}
