import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkflow } from '../src/workflow.mjs';
const quote = () => ({id:'scope',callable:true,price:'0',input_schema:{type:'object',properties:{input:{type:'string',minLength:3}},required:['input'],additionalProperties:false}});
function setup(options={}) {
 let calls=0, current=quote();
 const client={quote:async()=>current,call:async(_id,input)=>{calls++;return {output:input};}};
 return {workflow:createWorkflow({client,...options}),client,setQuote:q=>current=q,count:()=>calls};
}
test('prepare validates input without dispatching; execution needs approval',async()=>{
 const t=setup();await assert.rejects(t.workflow.prepare('scope',{}),/Invalid service input/);
 const p=await t.workflow.prepare('scope',{input:'qavvi/website'});assert.equal(t.count(),0);
 await assert.rejects(t.workflow.execute(p.planId),/approval/);assert.equal(t.count(),0);
 const r=await t.workflow.execute(p.planId,{approved:true});assert.equal(r.receipt.status,'response_received');assert.equal(t.count(),1);
});
test('reviewed input cannot be mutated by caller or returned preview',async()=>{
 const t=setup(),input={input:'original'};const p=await t.workflow.prepare('scope',input);
 input.input='changed';p.input.input='changed again';p.quote.price='100';
 const r=await t.workflow.execute(p.planId,{approved:true});assert.equal(r.result.output.input,'original');
});
test('changed quote blocks dispatch',async()=>{
 const t=setup();const p=await t.workflow.prepare('scope',{input:'abc'});t.setQuote({...quote(),price:'1'});
 await assert.rejects(t.workflow.execute(p.planId,{approved:true}),/quote changed/);assert.equal(t.count(),0);
});
test('expired plans are blocked',async()=>{
 let time=1000;const t=setup({now:()=>time,ttlMs:100});const p=await t.workflow.prepare('scope',{input:'abc'});time+=101;
 await assert.rejects(t.workflow.execute(p.planId,{approved:true}),/expired/);assert.equal(t.count(),0);
});
test('concurrent and repeated execution cannot dispatch a plan twice',async()=>{
 const t=setup();const p=await t.workflow.prepare('scope',{input:'abc'});
 const results=await Promise.allSettled([t.workflow.execute(p.planId,{approved:true}),t.workflow.execute(p.planId,{approved:true})]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(t.count(),1);
});
test('402 produces an unpaid observation receipt with no retry',async()=>{
 const t=setup();let calls=0;t.client.call=async()=>{calls++;return {paymentRequired:true,automaticallyPaid:false,challenge:'opaque'};};
 const p=await t.workflow.prepare('scope',{input:'abc'});const r=await t.workflow.execute(p.planId,{approved:true});
 assert.equal(r.receipt.status,'payment_required');assert.equal(r.receipt.automaticallyPaid,false);assert.equal(calls,1);
});
test('network failure consumes plan and never retries',async()=>{
 const t=setup();let calls=0;t.client.call=async()=>{calls++;throw Error('Transport failed');};const p=await t.workflow.prepare('scope',{input:'abc'});
 await assert.rejects(t.workflow.execute(p.planId,{approved:true}),/Transport failed/);
 await assert.rejects(t.workflow.execute(p.planId,{approved:true}),/already used/);assert.equal(calls,1);
});
test('discovery-only, wrong ID, invalid method and unsupported schemas fail closed',async()=>{
 for(const q of [{...quote(),callable:false},{...quote(),id:'different'},{...quote(),input_schema:{$ref:'https://example.com/schema'}}]) {
  const t=setup();t.setQuote(q);await assert.rejects(t.workflow.prepare('scope',{input:'abc'}));assert.equal(t.count(),0);
 }
 const t=setup();await assert.rejects(t.workflow.prepare('scope',{input:'abc'},'DELETE'),/method/);
});
test('plan capacity, disposal and expiry cleanup bound session memory',async()=>{
 let time=0;const t=setup({maxPlans:1,ttlMs:100,now:()=>time});const p=await t.workflow.prepare('scope',{input:'abc'});
 await assert.rejects(t.workflow.prepare('scope',{input:'abc'}),/Too many/);assert.equal(t.workflow.discard(p.planId),true);
 await t.workflow.prepare('scope',{input:'abc'});time=101;await t.workflow.prepare('scope',{input:'abc'});
});
