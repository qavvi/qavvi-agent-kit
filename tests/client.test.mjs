import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../src/client.mjs';

test('rejects insecure remote URLs and credentials', () => {
  for (const baseUrl of ['http://example.com', 'https://user:secret@example.com', 'file://localhost/tmp']) {
    assert.throws(() => createClient({ baseUrl }));
  }
});
test('discovery encodes query and retains discovery-only results', async () => {
  const client = createClient({ fetchImpl: async (url, options) => {
    assert.equal(url.searchParams.get('q'), 'data & tools');
    assert.equal(url.searchParams.get('scope'), 'all');
    assert.equal(options.redirect, 'error');
    return Response.json({ services: [{ callable: false }] });
  }});
  assert.equal((await client.search('data & tools', 'all')).services[0].callable, false);
});
test('402 is returned without signing or retrying', async () => {
  let calls = 0;
  const client = createClient({ fetchImpl: async (_url, options) => {
    calls++;
    assert.equal(options.headers['PAYMENT-SIGNATURE'], undefined);
    assert.deepEqual(JSON.parse(options.body), { input: { city: 'LA' }, method: 'POST' });
    return Response.json({ error: 'Payment required' }, { status: 402, headers: { 'payment-required': 'challenge' } });
  }});
  const result = await client.call('weather', { city: 'LA' });
  assert.equal(result.automaticallyPaid, false);
  assert.equal(result.challenge, 'challenge');
  assert.equal(calls, 1);
});
test('HTML error does not cause an opaque JSON parsing error', async () => {
  const client = createClient({ fetchImpl: async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }) });
  await assert.rejects(client.search('test'), /without JSON/);
});
test('provider errors do not leak response contents or retry', async () => {
  let calls = 0;
  const client = createClient({ fetchImpl: async () => { calls++; return Response.json({ secret: 'sensitive' }, { status: 500 }); } });
  await assert.rejects(client.call('id', {}), { message: 'Gateway request failed (HTTP 500).' });
  assert.equal(calls, 1);
});
