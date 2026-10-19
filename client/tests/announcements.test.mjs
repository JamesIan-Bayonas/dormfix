import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/utils/announcementPresentation.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {announcementState,currentAnnouncements,localExpiry}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const now=Date.parse('2026-10-17T10:00:00Z');
const notice=(id,extra={})=>({id,title:id,body:'Details',status:'published',priority:'standard',expiresAt:null,publishedAt:'2026-10-16T10:00:00Z',createdAt:'2026-10-16T10:00:00Z',...extra});
test('expiry boundary, drafts and archives leave current notices without changing history',()=>{
 const history=[notice('expired',{expiresAt:new Date(now).toISOString()}),notice('draft',{status:'draft'}),notice('archived',{status:'archived'}),notice('current',{expiresAt:new Date(now+1).toISOString()})];
 assert.deepEqual(currentAnnouncements(history,now).map(n=>n.id),['current']);assert.equal(history.length,4);assert.equal(announcementState(history[0],now),'Expired');
});
test('important notices sort before newer standard notices and never mutate input order',()=>{
 const history=[notice('standard',{publishedAt:'2026-10-17T09:00:00Z'}),notice('important',{priority:'important'}),notice('older',{publishedAt:'2026-10-15T10:00:00Z'})];
 assert.deepEqual(currentAnnouncements(history,now).map(n=>n.id),['important','standard','older']);assert.equal(history[0].id,'standard');
});
test('expiry editor preserves the local wall time when converting back to an instant',()=>{
 const original='2026-10-18T14:30:00Z';assert.equal(new Date(localExpiry(original)).getTime(),Date.parse(original));assert.equal(localExpiry(null),'');
});
