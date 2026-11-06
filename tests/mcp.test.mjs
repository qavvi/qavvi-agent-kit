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
    assert.equal(tools.length, 6);
    assert.equal(tools.find(t => t.name === 'call_service').annotations.readOnlyHint, false);
    const result = await client.callTool({ name: 'call_service', arguments: { serviceId: 'weather', input: { city: 'LA' } } });
    assert.equal(JSON.parse(result.content[0].text).automaticallyPaid, false);
    assert.equal(invoked, 1);
  } finally { await client.close(); await server.close(); }
});

test('MCP reviewed call validates, requires approval, and executes only once', async () => {
  let invoked = 0;
  const server = createServer({
    quote: async () => ({ id: 'scope', callable: true, input_schema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'], additionalProperties: false } }),
    call: async () => { invoked++; return { answer: 'research' }; },
  });
  const client = new Client({ name: 'review-test', version: '1.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(a); await client.connect(b);
    const invalid = await client.callTool({ name: 'prepare_service_call', arguments: { serviceId: 'scope', input: {} } });
    assert.equal(invalid.isError, true);
    const prepared = await client.callTool({ name: 'prepare_service_call', arguments: { serviceId: 'scope', input: { input: 'coinbase/x402' } } });
    const { planId } = JSON.parse(prepared.content[0].text);
    assert.equal(invoked, 0);
    const denied = await client.callTool({ name: 'execute_service_call', arguments: { planId, approved: false } });
    assert.equal(denied.isError, true);
    assert.equal(invoked, 0);
    const executed = await client.callTool({ name: 'execute_service_call', arguments: { planId, approved: true } });
    assert.equal(JSON.parse(executed.content[0].text).result.answer, 'research');
    const repeated = await client.callTool({ name: 'execute_service_call', arguments: { planId, approved: true } });
    assert.equal(repeated.isError, true);
    assert.equal(invoked, 1);
  } finally { await client.close(); await server.close(); }
});
