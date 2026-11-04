import { createClient } from '../../src/client.mjs';
const id = process.argv[2];
if (!id) throw new Error('Usage: node examples/02-review-quote/index.mjs SERVICE_ID');
console.log(JSON.stringify(await createClient().quote(id), null, 2));
