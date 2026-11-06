import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createWorkflow } from '../../src/index.mjs';

const workflow = createWorkflow();
const plan = await workflow.prepare('scope', { input: 'coinbase/x402' });
console.log(JSON.stringify(plan, null, 2));
const prompt = createInterface({ input: stdin, output: stdout });
try {
  const answer = await prompt.question('Send this request to Qavvi? Type yes to execute: ');
  if (answer.trim().toLowerCase() === 'yes') {
    console.log(JSON.stringify(await workflow.execute(plan.planId, { approved: true }), null, 2));
  } else {
    workflow.discard(plan.planId);
    console.log('Request discarded.');
  }
} finally { prompt.close(); }
