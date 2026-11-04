#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
const args=process.argv.slice(2), command=args.shift();
const base=process.env.QAVVI_URL || 'https://qavvi.xyz';
if(new URL(base).protocol!=='https:' && !['localhost','127.0.0.1'].includes(new URL(base).hostname)) throw new Error('QAVVI_URL must use HTTPS.');
const token=process.env.QAVVI_ACCESS_TOKEN;
async function jsonFile(path){if(!path)throw new Error('A JSON file path is required.');return JSON.parse(await readFile(path,'utf8'));}
async function request(path,{method='GET',body,auth=false,payment}={}){
 if(auth&&!token)throw new Error('Set QAVVI_ACCESS_TOKEN using Copy CLI session in your Qavvi Gateway dashboard.');
 const response=await fetch(base+path,{method,redirect:'error',signal:AbortSignal.timeout(45000),headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${token}`} : {}),...(payment?{'PAYMENT-SIGNATURE':payment}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 const challenge=response.headers.get('payment-required');if(challenge)console.error('Payment challenge:',challenge);
 const receipt=response.headers.get('payment-response');
 if(receipt)console.error('Payment receipt:',receipt);
 console.log(JSON.stringify(data,null,2));
 if(!response.ok){process.exitCode=1;if(response.status===402)console.error('Payment required. Use an x402 client to authorize the quoted price. No payment was automatically made.');}
 return data;
}
try{
 switch(command){
 case 'mcp':{await import('../src/mcp.mjs').then(m=>m.start());break;}
 case 'identity-init':{const {createIdentity}=await import('./qavvi-identity.mjs');await writeFile(args[0]||'qavvi-identity.private.json',JSON.stringify(createIdentity()),{flag:'wx',mode:0o600});console.log('Private signing key created locally. Never upload or commit this file.');break;}
 case 'sign':{const {signManifest}=await import('./qavvi-identity.mjs');const service=await jsonFile(args[0]);const key=await jsonFile(args[1]);service.identity=signManifest(service,key);await writeFile(args[2]||'service.signed.json',JSON.stringify(service,null,2),{flag:'wx',mode:0o600});console.log('Signed service manifest saved. Only the public key and signature belong in the published configuration.');break;}
 case 'verify':{const {verifyManifest,fingerprint}=await import('./qavvi-identity.mjs');const service=await request(`/api/v1/services/${encodeURIComponent(args[0])}`);if(!verifyManifest(service,args[1]))throw new Error('Manifest signature or pinned fingerprint did not match.');console.log('Valid ML-DSA-65 signature. Fingerprint:',fingerprint(service.identity.publicKey));if(!args[1])console.log('No fingerprint was pinned: this checks integrity, not the identity of an independently trusted publisher.');break;}
 case 'search':await request('/api/v1/services?q='+encodeURIComponent(args.join(' ')));break;
 case 'discover':await request('/api/v1/services?scope=all&q='+encodeURIComponent(args.join(' ')));break;
 case 'quote':await request(`/api/v1/services/${encodeURIComponent(args[0])}/quote`);break;
 case 'call':{const input=await jsonFile(args[1]);const i=args.indexOf('--payment-file');const payment=i>=0?(await readFile(args[i+1],'utf8')).trim():undefined;await request(`/api/v1/services/${encodeURIComponent(args[0])}/call`,{method:'POST',body:{input,method:args.includes('--method')?args[args.indexOf('--method')+1]:'POST'},payment});break;}
 case 'publish':await request('/api/v1/services',{method:'POST',auth:true,body:await jsonFile(args[0])});break;
 case 'update':await request(`/api/v1/services/${encodeURIComponent(args[0])}`,{method:'PUT',auth:true,body:await jsonFile(args[1])});break;
 case 'test':await request(`/api/v1/services/${encodeURIComponent(args[0])}/test`,{method:'POST',auth:true,body:{input:await jsonFile(args[1])}});break;
 case 'mine':await request('/api/v1/mine',{auth:true});break;
 case 'init':{const target=args[0]||'qavvi-service.json';await writeFile(target,JSON.stringify({name:'My service',symbol:'SERVICE',description:'Describe what your service returns.',kind:'API',endpoint:'https://your-domain.example/api/run',docs_url:'https://your-domain.example/docs',method:'POST',price:'0.01',payout_wallet:'YOUR_SOLANA_PUBLIC_ADDRESS',published:false,input_schema:{type:'object',properties:{input:{type:'string'}},required:['input'],additionalProperties:false}},null,2)+'\n',{flag:'wx',mode:0o600});console.log(`Created ${target}. Replace the example endpoint and wallet before publishing.`);break;}
 default:console.log(`Qavvi CLI (Node 22+)\n\n  mcp                     Start local stdio MCP server\n  init [file.json]         Create a service configuration\n  search [query]           Find callable services\n  discover [query]         Include discovery-only listings\n  quote <id>              Inspect price and schema\n  call <id> <input.json>   Execute (does not auto-pay)\n    --payment-file <file>  Supply an x402 payment payload\n    --method GET|POST     Native provider method (default POST)\n  publish <service.json>  Create a service (QAVVI_ACCESS_TOKEN required)\n  update <id> <file.json> Update a service\n  test <id> <input.json>  Send a real owner test to the provider\n  mine                    List your services\n  identity-init [keyfile] Create a local ML-DSA-65 key\n  sign <service> <key> [output] Sign a service configuration\n  verify <id> [fingerprint] Verify a signed configuration\n\nDownload: https://qavvi.xyz/qavvi.mjs\nDocs: https://qavvi.xyz/docs\nNever share your account token or commit it to a repository.`);
 }
}catch(error){console.error(error.message);process.exitCode=1;}
