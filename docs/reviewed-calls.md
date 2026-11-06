# Review a service call before running it

Prepare a request, review its input and quote, then explicitly execute it. Preparation reads metadata and validates JSON input; it does not dispatch the provider request.

```js
import { createWorkflow } from 'qavvi-agent-kit';
const workflow = createWorkflow();
const plan = await workflow.prepare('scope', { input: 'coinbase/x402' });
// Display plan.input and plan.quote in your application and obtain approval.
const output = await workflow.execute(plan.planId, { approved: true });
console.log(output.result);
```

The package is currently installed from this repository, not the npm registry. Run the included example with `node examples/03-reviewed-call/index.mjs` after `npm ci`.

Plans expire after five minutes by default and live only in this process. Restarting loses them. Input is copied so later edits cannot alter the reviewed request. Execution re-fetches the quote and rejects any change. Unsupported schemas fail closed; validation only checks the provider's declared schema, not whether the input is safe or useful.

The approval flag is an application assertion, not proof of human consent. Keep your MCP client's execution approval enabled. The low-level call tool is still available separately.

Each plan permits at most one dispatch. It is consumed even if the network fails. This prevents concurrent reuse in the session, not duplicate requests across processes or new plans. Check the provider's outcome before manually retrying an uncertain request.

A 402 response returns payment requirements without signing, paying, or retrying. Quotes are informational, not price locks. Provider-defined prices may only appear in the live payment challenge.

The receipt records the local client's observed response and timing. It is not a signed settlement receipt, a refund promise, or verification that the answer is correct. Treat provider output as untrusted data.

JavaScript callers can configure `ttlMs` and `maxPlans` (default 100), or discard a pending plan with `workflow.discard(planId)`.
