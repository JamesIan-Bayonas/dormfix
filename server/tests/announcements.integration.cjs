const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const bcrypt = require('bcrypt');
const { PGlite } = require('@electric-sql/pglite');
process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/dormfix';
process.env.DB_SSL = 'false';
const config = require('../dist/config/dbConfig');

(async () => {
    const db = new PGlite();
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    for (const name of ['202609150001_dormfix_postgresql_schema.sql', '202610170001_announcements_and_sessions.sql']) {
        await db.exec(fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations', name), 'utf8'));
    }
    config.pool.query = (sql, params) => db.query(sql, params);
    const password = await bcrypt.hash('TEST-ONLY-password', 4);
    for (const [id, role, approved] of [['l1','landlord',true],['l2','landlord',true],['t1','tenant',true],['t2','tenant',true],['t3','tenant',true],['pending','tenant',false]]) {
        await db.query('INSERT INTO users (id,name,email,password,role,is_approved) VALUES ($1,$1,$2,$3,$4,$5)', [id,id+'@example.invalid',password,role,approved]);
    }
    await db.exec(`INSERT INTO rooms (id,landlord_id,room_number) VALUES ('r1','l1','100'),('r2','l1','200'),('r3','l2','300');
        INSERT INTO dorm_assignments (id,tenant_id,landlord_id,room_number) VALUES ('a1','t1','l1','100'),('a2','t2','l1','200'),('a3','t3','l2','300'),('a4','pending','l1','100');`);
    const { createSession, tokenHash } = require('../dist/middleware/session');
    const tokens = {};
    for (const id of ['l1','l2','t1','t2','t3','pending']) tokens[id] = await createSession(id);
    assert.notEqual((await db.query('SELECT token_hash FROM app_sessions WHERE user_id=$1',['l1'])).rows[0].token_hash, tokens.l1);
    const app = express();app.use(express.json());
    app.use('/api', require('../dist/routes/authRoutes').default);
    app.use('/api/announcements', require('../dist/routes/announcementRoutes').default);
    app.get('/api/landlord/rooms/:id', async (req,res)=>res.json((await db.query('SELECT id, room_number, capacity, 0 AS "currentOccupants" FROM rooms WHERE landlord_id=$1',[req.params.id])).rows));
    app.get('/api/tenant/details/:id', async(req,res)=>res.json(await require('../dist/repositories/tenantRepository').tenantRepository.getHousingDetails(req.params.id)));
    app.get('/api/landlord/tenants/:id',(_req,res)=>res.json([]));
    app.get(/^\/api\/(maintenance|payments|rules)\//,(_req,res)=>res.json([]));
    const serve = process.argv.includes('--serve');
    const server = app.listen(serve ? 5018 : 0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function call(actor, method='GET', suffix='', body) {
        const response = await fetch(base+'/api/announcements'+suffix, {method,headers:{...(actor?{Authorization:'Bearer '+tokens[actor]}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
        return {status:response.status,body:await response.json()};
    }
    const fields = {title:'Water interruption',body:'Water will be unavailable tomorrow morning.',roomNumber:null,priority:'important',status:'published',expiresAt:null};
    const probe = await require('../dist/repositories/announcementRepository').announcementRepository.create('l1', fields);
    await db.query('DELETE FROM announcements WHERE id=$1', [probe.id]);
    assert.equal((await call(null)).status,401);
    assert.equal((await call('pending')).status,403);
    assert.equal((await call('t1','POST','',fields)).status,403);
    assert.equal((await call('l1','POST','',{...fields,roomNumber:'300'})).status,400);
    assert.equal((await call('l1','POST','',{...fields,expiresAt:'2000-01-01T00:00:00Z'})).status,400);
    assert.equal((await call('l1','POST','',{...fields,roomNumber:'Unassigned'})).status,400);
    assert.equal((await call('l1','POST','',{...fields,title:' '.repeat(10)})).status,400);
    assert.equal((await call('l1','POST','',{...fields,body:'x'.repeat(10001)})).status,400);
    assert.equal((await call('l1','POST','',{...fields,expiresAt:'2099-02-30T10:00:00Z'})).status,400);
    assert.equal((await call('l1','POST','',{...fields,expiresAt:'2099-12-01T10:00'})).status,400);
    const badToken=await fetch(base+'/api/announcements',{headers:{Authorization:'Bearer '+'0'.repeat(64)}});assert.equal(badToken.status,401);
    await db.query("UPDATE users SET is_approved=false WHERE id='t1'");assert.equal((await call('t1')).status,403);await db.query("UPDATE users SET is_approved=true WHERE id='t1'");
    const global = (await call('l1','POST','',{...fields,landlordId:'l2'})).body;
    const targeted = (await call('l1','POST','',{...fields,title:'Room 100 inspection',roomNumber:'100'})).body;
    const draft = (await call('l1','POST','',{...fields,title:'Draft only',status:'draft'})).body;
    const other = (await call('l2','POST','',{...fields,title:'Other dorm notice',roomNumber:'300'})).body;
    const ids = async actor => (await call(actor)).body.map(record=>record.id);
    assert.deepEqual(new Set(await ids('t1')),new Set([global.id,targeted.id]));
    assert.deepEqual(await ids('t2'),[global.id]);assert.deepEqual(await ids('t3'),[other.id]);
    assert.ok(!(await ids('t1')).includes(draft.id));
    assert.equal((await call('l2','PUT','/'+global.id,{...fields,version:global.version})).status,409);
    assert.equal((await call('l2','POST','/'+global.id+'/archive',{version:global.version})).status,409);
    assert.equal((await call('l1','PUT','/'+global.id,{...fields,status:'draft',version:global.version})).status,409);
    const edited = await call('l1','PUT','/'+global.id,{...fields,title:'Updated notice',version:global.version});
    assert.equal(edited.status,200);assert.equal(edited.body.version,2);
    assert.equal((await call('l1','PUT','/'+global.id,{...fields,version:1})).status,409);
    const publishedDraft = await call('l1','PUT','/'+draft.id,{...fields,title:draft.title,version:draft.version});
    assert.equal(publishedDraft.status,200);assert.ok((await ids('t1')).includes(draft.id));
    const archived = await call('l1','POST','/'+targeted.id+'/archive',{version:targeted.version});
    assert.equal(archived.status,200);assert.equal(archived.body.status,'archived');assert.ok((await ids('t1')).includes(targeted.id));
    assert.equal((await call('l1','PUT','/'+targeted.id,{...fields,version:archived.body.version})).status,409);
    const hiddenDraft = (await call('l1','POST','',{...fields,title:'Hidden archived draft',status:'draft'})).body;
    await call('l1','POST','/'+hiddenDraft.id+'/archive',{version:hiddenDraft.version});assert.ok(!(await ids('t1')).includes(hiddenDraft.id));
    await db.query("UPDATE announcements SET expires_at=now()-interval '1 minute' WHERE id=$1",[global.id]);
    assert.ok((await ids('t1')).includes(global.id),'expired notices remain in history');
    await db.query("UPDATE dorm_assignments SET room_number='Unassigned' WHERE tenant_id='t1'");
    assert.ok(!(await ids('t1')).includes(targeted.id),'unassigned tenants do not receive room notices');assert.ok((await ids('t1')).includes(global.id));
    await db.query("UPDATE dorm_assignments SET landlord_id='l2',room_number='300' WHERE tenant_id='t1'");
    assert.deepEqual(await ids('t1'),[other.id],'relinked tenants cannot read their former dorm notices');
    await db.query("UPDATE app_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[tokenHash(tokens.t2)]);
    assert.equal((await call('t2')).status,401);
    const login = await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'t2@example.invalid',password:'TEST-ONLY-password'})});
    assert.equal(login.status,200);tokens.t2=(await login.json()).accessToken;assert.ok(tokens.t2);
    assert.equal((await call('t2')).status,200);
    const logout=await fetch(base+'/api/logout',{method:'POST',headers:{Authorization:'Bearer '+tokens.t2}});assert.equal(logout.status,204);
    assert.equal((await call('t2')).status,401);
    await db.exec('SET ROLE anon;');await assert.rejects(db.query('SELECT * FROM announcements'));await assert.rejects(db.query('SELECT * FROM app_sessions'));await db.exec('RESET ROLE;');
    console.log('PASS: migrations, validation, signed-in roles, dorm/room isolation, draft privacy, publish/edit/archive, stale versions, expiry history, assignment changes, token hashing/expiry, login/logout, and blocked direct client access');
    if (serve) {
        await db.exec("DELETE FROM announcements; UPDATE dorm_assignments SET landlord_id='l1',room_number='100' WHERE tenant_id='t1'; UPDATE users SET name='Maria Santos' WHERE id='l1'; UPDATE users SET name='Alex Reyes' WHERE id='t1';");
        console.log('ANNOUNCEMENT_FIXTURE_READY http://127.0.0.1:5018 (temporary embedded PostgreSQL only)');
        return;
    }
    await new Promise(resolve=>server.close(resolve));await db.close();await config.pool.end();
})().catch(error=>{console.error(error);process.exit(1);});
