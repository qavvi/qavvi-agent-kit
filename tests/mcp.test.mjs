import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/mcp.mjs';

test('MCP lists tools and returns payment requirements without payment', async () => {
  let invoked = 0;
  const server = createServer({
    search: async () => ({ services: [] }), inspect: async () => ({ callable: true }),
    quote: async () => ({ paymentRequired: true }),
    call: async () => { invoked++; return { paymentRequired: true, automaticallyPaid: false }; },
  });
  const client = new Client({ name: 'test', version: '1.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(a); await client.connect(b);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 4);
    assert.equal(tools.find(t => t.name === 'call_service').annotations.readOnlyHint, false);
    const result = await client.callTool({ name: 'call_service', arguments: { serviceId: 'weather', input: { city: 'LA' } } });
    assert.equal(JSON.parse(result.content[0].text).automaticallyPaid, false);
    assert.equal(invoked, 1);
  } finally { await client.close(); await server.close(); }
});
