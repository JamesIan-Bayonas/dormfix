/* Verify the configured database using only isolated records in a rolled-back
 * transaction. Never imports index.js or runs notification/socket handlers. */
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config({path:path.resolve(__dirname,'../.env'),quiet:true});
const { pool } = require('../dist/config/dbConfig');

async function verifySchema(db) {
    const expected = {
        announcements: ['id','landlord_id','title','body','room_number','priority','status','expires_at','published_at','created_at','updated_at','version'],
        app_sessions: ['token_hash','user_id','expires_at','created_at'],
    };
    for (const [table,columns] of Object.entries(expected)) {
        const found=await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['public',table]);
        assert.deepEqual(found.rows.map(row=>row.column_name).sort(),[...columns].sort(),table+' columns differ from the release schema');
        const flags=await db.query('SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass($1)',['public.'+table]);
        assert.equal(flags.rows[0]?.relrowsecurity,true,table+' must enable RLS');
        for(const role of ['anon','authenticated','service_role']){
            const exists=await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[role]);
            if(exists.rows.length){const grants=await db.query(`SELECT has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') AS allowed`,[role,'public.'+table]);assert.equal(grants.rows[0].allowed,false,role+' has direct access to '+table);}
        }
    }
    const indexes=await db.query("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename IN ('announcements','app_sessions')");
    for(const index of ['announcements_pkey','announcements_landlord_idx','app_sessions_pkey','app_sessions_user_idx','app_sessions_expiry_idx'])assert.ok(indexes.rows.some(row=>row.indexname===index),'Missing index '+index);
}

(async()=>{
    if(!process.argv.includes('--configured-database'))throw Error('Use --configured-database to run the rollback verification against DATABASE_URL.');
    const originalQuery=pool.query.bind(pool);
    const client=await pool.connect();
    let server,browser,transaction=false;
    const ids=Object.fromEntries(['landlord','otherLandlord','tenant','otherRoom','otherDorm'].map(key=>[key,crypto.randomUUID()]));
    const checks=[];
    try {
        await client.query('BEGIN');transaction=true;
        await client.query("SET LOCAL statement_timeout='10s'; SET LOCAL lock_timeout='3s'; SET LOCAL idle_in_transaction_session_timeout='120s';");
        await verifySchema(client);checks.push('configured PostgreSQL schema, RLS, direct-client grants, and indexes');
        // This override is confined to this verification process and one transaction.
        let queryQueue=Promise.resolve();
        pool.query=(sql,params)=>{
            const pending=queryQueue.then(()=>client.query(sql,params));
            queryQueue=pending.catch(()=>{});
            return pending;
        };
        const password=crypto.randomBytes(24).toString('base64url');
        const hash=await bcrypt.hash(password,4);
        const emails={};
        for(const [key,id] of Object.entries(ids)){
            emails[key]=`release-${id}@example.invalid`;
            await client.query('INSERT INTO users (id,name,email,password,role,is_approved,dorm_fix_id) VALUES ($1,$2,$3,$4,$5,true,$6)',[id,'Release verification '+key,emails[key],hash,key.includes('Landlord')||key==='landlord'?'landlord':'tenant','TEST-'+id.slice(0,8)]);
        }
        for(const [owner,room] of [['landlord','VERIFY-A'],['landlord','VERIFY-B'],['otherLandlord','VERIFY-C']])await client.query('INSERT INTO rooms (id,landlord_id,room_number) VALUES ($1,$2,$3)',[crypto.randomUUID(),ids[owner],room]);
        for(const [tenant,owner,room] of [['tenant','landlord','VERIFY-A'],['otherRoom','landlord','VERIFY-B'],['otherDorm','otherLandlord','VERIFY-C']])await client.query('INSERT INTO dorm_assignments (id,tenant_id,landlord_id,room_number) VALUES ($1,$2,$3,$4)',[crypto.randomUUID(),ids[tenant],ids[owner],room]);
        const paymentRepository=require('../dist/repositories/paymentRepository').paymentRepository;
        const maintenanceRepository=require('../dist/repositories/maintenanceRepository').maintenanceRepository;
        const paymentId=crypto.randomUUID(),requestId=crypto.randomUUID();
        await paymentRepository.create({id:paymentId,tenantId:ids.tenant,landlordId:ids.landlord,amount:2500,paymentType:'Rent',proofImage:'/verification-only-no-file',datePaid:new Date(),status:'Pending'});
        await maintenanceRepository.create({id:requestId,tenantId:ids.tenant,issueType:'Plumbing',description:'Rollback-only release verification request.',urgency:'Low',notificationStatus:'Not Required'});
        await maintenanceRepository.updateStatus(requestId,'In Progress');
        const app=express();app.use(express.json());app.use('/api',require('../dist/routes/authRoutes').default);app.use('/api/announcements',require('../dist/routes/announcementRoutes').default);
        for(const [prefix,module]of [['payments','payment'],['maintenance','maintenance'],['landlord','room'],['rules','rule'],['chat','chat']])app.use('/api/'+prefix,require('../dist/routes/'+module+'Routes').default);
        app.use('/api',require('../dist/routes/tenantRoutes').default);
        server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
        const base=`http://127.0.0.1:${server.address().port}`;
        const users={};
        for(const key of Object.keys(ids)){
            const response=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:emails[key],password})});
            assert.equal(response.status,200);users[key]=await response.json();assert.ok(users[key].accessToken);
        }
        const receipt=await (await fetch(base+'/api/payments/history/'+ids.tenant,{headers:{Authorization:'Bearer '+users.tenant.accessToken}})).json();assert.equal(receipt[0].id,paymentId);assert.equal(receipt[0].amount,2500);assert.equal(receipt[0].status,'Pending');
        const maintenance=await (await fetch(base+'/api/maintenance/'+ids.tenant,{headers:{Authorization:'Bearer '+users.tenant.accessToken}})).json();assert.equal(maintenance[0].id,requestId);assert.equal(maintenance[0].status,'In Progress');
        checks.push('payment and maintenance repositories against the configured database with numeric amounts and recorded progress');
        async function call(key,method='GET',suffix='',body){const response=await fetch(base+'/api/announcements'+suffix,{method,headers:{Authorization:'Bearer '+users[key].accessToken,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json()};}
        const draft={title:'Release verification draft',body:'Temporary rollback-only notice.',priority:'standard',status:'draft',roomNumber:null,expiresAt:null};
        const created=await call('landlord','POST','',draft);assert.equal(created.status,201);
        assert.equal((await call('tenant')).body.length,0);
        const published=await call('landlord','PUT','/'+created.body.id,{...draft,status:'published',roomNumber:'VERIFY-A',priority:'important',version:1});assert.equal(published.status,200);
        assert.equal((await call('tenant')).body.length,1);assert.equal((await call('otherRoom')).body.length,0);assert.equal((await call('otherDorm')).body.length,0);
        assert.equal((await call('tenant','POST','',draft)).status,403);
        assert.equal((await call('otherLandlord','POST','/'+created.body.id+'/archive',{version:2})).status,409);
        assert.equal((await call('landlord','PUT','/'+created.body.id,{...draft,status:'published',version:1})).status,409);
        const edited=await call('landlord','PUT','/'+created.body.id,{...draft,status:'published',roomNumber:'VERIFY-A',body:'Updated rollback-only notice.',version:2});assert.equal(edited.status,200);
        checks.push('actual login/session issuance, draft privacy, publishing, room/dorm isolation, editing, and stale-version rejection');
        if(process.argv.includes('--browser')){
            const {chromium}=require(process.env.DORMFIX_PLAYWRIGHT_MODULE||'playwright');
            browser=await chromium.launch({channel:'msedge',headless:true});
            const context=await browser.newContext({viewport:{width:1280,height:900}});
            await context.addInitScript(user=>localStorage.setItem('dormfixUser',JSON.stringify(user)),users.tenant);
            await context.route('**/socket.io/**',r=>r.abort());
            await context.route('**/api/**',async route=>{
                const request=route.request(),url=new URL(request.url());
                if(!url.pathname.startsWith('/api/'))return route.continue();
                if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,PATCH,OPTIONS'}});
                const response=await fetch(base+url.pathname+url.search,{method:request.method(),headers:{'Content-Type':'application/json',...(request.headers().authorization?{Authorization:request.headers().authorization}:{})},...(['GET','HEAD'].includes(request.method())?{}:{body:request.postData()||undefined})});
                await route.fulfill({status:response.status,body:Buffer.from(await response.arrayBuffer()),headers:{'content-type':'application/json','access-control-allow-origin':'*'}});
            });
            const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
            await page.goto(process.env.DORMFIX_PREVIEW_URL||'http://localhost:5179',{waitUntil:'domcontentloaded'});
            assert.match(await page.title(),/DormFix/i,'The configured preview URL is not the DormFix application.');
            await page.getByRole('heading',{name:draft.title,exact:true}).waitFor();
            await page.getByText('Updated rollback-only notice.',{exact:true}).waitFor();
            await page.getByRole('region',{name:'Payment proof',exact:true}).getByText('Awaiting landlord review',{exact:true}).waitFor();
            await page.getByRole('region',{name:'Active maintenance',exact:true}).getByText('1 request',{exact:true}).waitFor();
            await page.getByRole('navigation',{name:'Tenant navigation'}).getByRole('link',{name:'Maintenance',exact:true}).click();await page.getByText('Rollback-only release verification request.',{exact:true}).waitFor();
            await page.getByRole('navigation',{name:'Tenant navigation'}).getByRole('link',{name:'Payments',exact:true}).click();
            try { await page.getByRole('heading',{name:'Payment history',exact:true}).waitFor(); }
            catch(error) { console.error(JSON.stringify({url:page.url(),headings:await page.locator('h1,h2').allTextContents(),runtimeErrors:errors})); throw error; }
            await page.locator(`[aria-label="Receipt ${paymentId}"]`).getByText('Awaiting landlord review',{exact:true}).waitFor();
            await page.getByRole('navigation',{name:'Tenant navigation'}).getByRole('link',{name:'Announcements',exact:true}).click();await page.getByRole('heading',{name:draft.title,exact:true}).waitFor();
            for(const width of [1280,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
            await page.getByLabel('Appearance',{exact:true}).selectOption('dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dormfix-dark');assert.deepEqual(errors,[]);
            await browser.close();browser=null;checks.push('local frontend with real database-backed API: home summaries, payment/maintenance history, notices, 320px layout, dark appearance, no runtime errors');
        }
        const archived=await call('landlord','POST','/'+created.body.id+'/archive',{version:3});assert.equal(archived.status,200);assert.equal((await call('tenant')).body[0].status,'archived');
        const logout=await fetch(base+'/api/logout',{method:'POST',headers:{Authorization:'Bearer '+users.tenant.accessToken}});assert.equal(logout.status,204);assert.equal((await call('tenant')).status,401);
        checks.push('archive preserved in tenant history and server session revocation');
        await queryQueue;await client.query('ROLLBACK');transaction=false;
        const leftovers=await client.query('SELECT count(*)::int AS n FROM users WHERE id=ANY($1::varchar[])',[Object.values(ids)]);assert.equal(leftovers.rows[0].n,0);
        checks.push('transaction rolled back; no verification accounts retained');
        console.log(JSON.stringify({passed:true,checks,remoteChangesCommitted:false},null,2));
    } finally {
        if(browser)await browser.close();
        if(server)await new Promise(resolve=>server.close(resolve));
        if(transaction)await client.query('ROLLBACK');
        pool.query=originalQuery;client.release();await pool.end();
    }
})().catch(error=>{console.error(JSON.stringify({passed:false,message:error.message}));process.exitCode=1;});
