import { createClient } from '../../src/client.mjs';
console.log(JSON.stringify(await createClient().search(process.argv.slice(2).join(' ') || 'research'), null, 2));
