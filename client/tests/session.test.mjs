import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source=(await readFile(new URL('../src/api/session.ts',import.meta.url),'utf8')).replace('import.meta.env.VITE_API_URL',JSON.stringify('http://localhost:5000'));
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const storage=new Map(),events=[],calls=[];
globalThis.window={location:{origin:'http://localhost:5179'},dispatchEvent:event=>events.push(event)};
globalThis.localStorage={getItem:key=>storage.get(key)||null};
const {sessionFetch,sessionToken,isPrivateReceipt}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
beforeEach(()=>{storage.clear();events.length=0;calls.length=0;globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response('{}',{status:200});};});
test('private API and receipt reads carry the saved session; unrelated origins do not',async()=>{
 storage.set('dormfixUser',JSON.stringify({accessToken:'fixture-token'}));
 await sessionFetch('http://localhost:5000/api/payments/history/me');assert.equal(calls[0].init.headers.get('Authorization'),'Bearer fixture-token');
 await sessionFetch('http://localhost:5000/uploads/receipt.png');assert.equal(calls[1].init.headers.get('Authorization'),'Bearer fixture-token');
 await sessionFetch('https://example.invalid/api/data');assert.equal(calls[2].init.headers.has('Authorization'),false);
 await sessionFetch('http://localhost:5179/tests/fixtures/receipt.svg');assert.equal(calls[3].init.headers.has('Authorization'),false);
 assert.equal(isPrivateReceipt('blob:local-preview'),false);assert.equal(isPrivateReceipt('http://localhost:5000/uploads/a.png'),true);
});
test('expiry reports the actual rejected token instead of invalidating a newer sign-in',async()=>{
 storage.set('dormfixUser',JSON.stringify({accessToken:'new-token'}));globalThis.fetch=async()=>new Response('{}',{status:401});
 await sessionFetch('http://localhost:5000/api/announcements',{headers:{Authorization:'Bearer old-token'}});
 assert.equal(events[0].detail.token,'old-token');
});
test('malformed storage does not crash requests or invent a session',async()=>{
 storage.set('dormfixUser','malformed');assert.equal(sessionToken(),null);await sessionFetch('http://localhost:5000/api/rules/me');assert.equal(calls[0].init.headers.has('Authorization'),false);
});
