import { randomUUID, createHash } from 'node:crypto';
import Ajv from 'ajv';
import { createClient } from './client.mjs';

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const fingerprint = quote => createHash('sha256').update(JSON.stringify(canonical(quote))).digest('hex');

/** Session-local reviewed calls. Never signs payments, sends payment headers, or retries. */
export function createWorkflow({ client = createClient(), now = Date.now, ttlMs = 300000, maxPlans = 100 } = {}) {
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || !Number.isSafeInteger(maxPlans) || maxPlans < 1) throw new Error('Invalid plan limits.');
  const plans = new Map();
  const prune = () => { for (const [id, plan] of plans) if (plan.expiresAt <= now()) plans.delete(id); };
  function validate(quote, serviceId, input, method) {
    if (!quote || quote.id !== serviceId || quote.callable !== true) throw new Error('Service is not confirmed callable.');
    if (!['GET', 'POST'].includes(method) || (quote.method && quote.method !== method)) throw new Error('Unsupported service method.');
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Input must be a JSON object.');
    if (Buffer.byteLength(JSON.stringify(input)) > 65536) throw new Error('Input exceeds 64 KiB.');
    if (!quote.input_schema || Buffer.byteLength(JSON.stringify(quote.input_schema)) > 16384) throw new Error('Missing or oversized input schema.');
    // No remote schema loading, custom keywords, coercion, defaults, or property removal.
    const ajv = new Ajv({ strict: true, allErrors: false, ownProperties: true });
    let check;
    try { check = ajv.compile(quote.input_schema); }
    catch { throw new Error('Service input schema is unsupported. Review the provider documentation.'); }
    if (!check(input)) {
      const error = check.errors[0];
      throw new Error(`Invalid service input at ${error.instancePath || '/'}: ${error.message}.`);
    }
  }
  return {
    async prepare(serviceId, input, method = 'POST') {
      const copiedInput = JSON.parse(JSON.stringify(input));
      const quote = await client.quote(serviceId);
      validate(quote, serviceId, copiedInput, method);
      prune();
      if (plans.size >= maxPlans) throw new Error('Too many pending calls. Execute, discard, or wait for existing plans to expire.');
      const planId = randomUUID();
      const expiresAt = now() + ttlMs;
      const copy = JSON.parse(JSON.stringify(quote));
      plans.set(planId, { serviceId, input: copiedInput, method, expiresAt, quoteHash: fingerprint(copy) });
      return { planId, serviceId, input: JSON.parse(JSON.stringify(copiedInput)), method, quote: copy,
        expiresAt: new Date(expiresAt).toISOString(), requiresApproval: true,
        note: 'Review before execution. This is not a price lock or payment authorization. Provider-defined pricing requires a live payment challenge.' };
    },
    discard(planId) { return plans.delete(planId); },
    async execute(planId, { approved = false } = {}) {
      if (approved !== true) throw new Error('Explicit approval is required before execution.');
      const plan = plans.get(planId);
      if (!plan) throw new Error('Unknown or already used plan. Prepare a new call.');
      // Consume before awaiting: concurrent execution cannot dispatch the same plan twice.
      plans.delete(planId);
      if (plan.expiresAt <= now()) throw new Error('Plan expired. Prepare and review a new call.');
      const quote = await client.quote(plan.serviceId);
      if (fingerprint(quote) !== plan.quoteHash) throw new Error('Service quote changed. Prepare and review a new call.');
      if (plan.expiresAt <= now()) throw new Error('Plan expired during review. Prepare a new call.');
      const started = now();
      const result = await client.call(plan.serviceId, plan.input, plan.method);
      return { receipt: { id: planId, serviceId: plan.serviceId, method: plan.method,
        status: result?.paymentRequired === true ? 'payment_required' : 'response_received',
        completedAt: new Date(now()).toISOString(), durationMs: Math.max(0, now() - started),
        automaticallyPaid: false, provenance: 'local-client-observation',
        note: 'Not a signed settlement receipt or a guarantee of provider result correctness.' }, result };
    },
  };
}
