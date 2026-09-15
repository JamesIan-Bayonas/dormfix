const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const base = path.resolve(__dirname, '..');
process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/dormfix';
process.env.DB_SSL = 'false';
const config = require(path.join(base, 'dist/config/dbConfig.js'));
const repo = name => require(path.join(base, `dist/repositories/${name}Repository.js`))[`${name}Repository`];

(async () => {
    const db = new PGlite();
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    await db.exec(fs.readFileSync(path.resolve(base, '../supabase/migrations/202609150001_dormfix_postgresql_schema.sql'), 'utf8'));
    await db.exec(fs.readFileSync(path.resolve(base, '../supabase/tests/verify_dormfix_schema.sql'), 'utf8'));
    assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM users')).rows[0].n, 0);
    console.log('PASS: migration execution and verification SQL; temporary records rolled back');

    const originalConnect = config.pool.connect.bind(config.pool);
    const originalQuery = config.pool.query.bind(config.pool);
    config.pool.query = (sql, params) => db.query(sql, params);
    let released = 0;
    config.pool.connect = async () => ({ query: (sql, params) => db.query(sql, params), release: () => { released++; } });

    const users = repo('user'), tenants = repo('tenant'), rooms = repo('room');
    const rules = repo('rule'), maintenance = repo('maintenance'), payments = repo('payment'), chat = repo('chat');
    await users.registerTransaction({ id: 'landlord-1', name: 'Landlord', email: 'l@example.invalid',
        hashedPassword: 'TEST_ONLY', role: 'landlord', dormFixId: 'DF-L', isApproved: 1, phoneNumber: '09000000000' });
    await users.registerTransaction({ id: 'tenant-1', name: 'Tenant', email: 't@example.invalid',
        hashedPassword: 'TEST_ONLY', role: 'tenant', dormFixId: 'DF-T', isApproved: 0, landlordId: 'landlord-1' });
    assert.equal((await users.findByEmail('t@example.invalid')).is_approved, false);
    assert.equal((await users.findLandlordByDormFixId('DF-L')).id, 'landlord-1');
    assert.equal((await users.updateProfile('tenant-1', 'Updated tenant', '09111111111')).phone_number, '09111111111');
    await assert.rejects(users.registerTransaction({ id: 'duplicate', name: 'Duplicate', email: 't@example.invalid',
        hashedPassword: 'TEST_ONLY', role: 'tenant', dormFixId: 'DF-D', isApproved: 0 }), /Email already registered/);
    await assert.rejects(users.registerTransaction({ id: 'orphan', name: 'Orphan', email: 'o@example.invalid',
        hashedPassword: 'TEST_ONLY', role: 'tenant', dormFixId: 'DF-O', isApproved: 0, landlordId: 'missing' }));
    assert.equal(await users.findByEmail('o@example.invalid'), null);
    console.log('PASS: registration, duplicate email, profile RETURNING, boolean handling, registration rollback');

    await tenants.approve('tenant-1');
    assert.equal((await tenants.getByLandlord('landlord-1'))[0].isApproved, true);
    await tenants.updateApprovalStatus('tenant-1', false);
    await rooms.create('room-1', 'landlord-1', '101', 1);
    assert.equal((await rooms.findRoom('landlord-1', '101')).capacity, 1);
    await rooms.assignTenantTransaction('tenant-1', 'landlord-1', '101', '2026-09-15');
    const room = (await rooms.getByLandlord('landlord-1'))[0];
    assert.equal(room.currentOccupants, 1);
    assert.equal(typeof room.currentOccupants, 'number');
    assert.equal((await tenants.getHousingDetails('tenant-1')).roomNumber, '101');
    await users.registerTransaction({ id: 'tenant-2', name: 'Second', email: 't2@example.invalid',
        hashedPassword: 'TEST_ONLY', role: 'tenant', dormFixId: 'DF-T2', isApproved: 0, landlordId: 'landlord-1' });
    await assert.rejects(rooms.assignTenantTransaction('tenant-2', 'landlord-1', '101'), /full capacity/);
    assert.equal((await tenants.getHousingDetails('tenant-2')).roomNumber, 'Unassigned');
    await assert.rejects(rooms.assignTenantTransaction('tenant-1', 'landlord-1', '404'), /Room does not exist/);
    console.log('PASS: assignment, occupancy number, calendar date, capacity rejection and rollback');

    await rules.create({ id: 'rule-1', landlordId: 'landlord-1', ruleText: 'Quiet hours', isPriority: true });
    assert.equal((await rules.getByLandlord('landlord-1'))[0].is_priority, true);
    await rules.delete('rule-1');
    assert.equal((await rules.getByLandlord('landlord-1')).length, 0);
    await maintenance.create({ id: 'maintenance-1', tenantId: 'tenant-1', issueType: 'Plumbing',
        description: 'Leak', urgency: 'High', notificationStatus: 'Sent' });
    assert.equal((await maintenance.getByLandlord('landlord-1'))[0].notificationStatus, 'Sent');
    assert.equal((await maintenance.getByTenant('tenant-1'))[0].issueType, 'Plumbing');
    assert.equal((await maintenance.getRoomContext('tenant-1')).landlord_phone, '09000000000');
    await maintenance.updateStatus('maintenance-1', 'Resolved');
    assert.equal((await maintenance.getByTenant('tenant-1'))[0].status, 'Resolved');

    await payments.create({ id: 'payment-1', tenantId: 'tenant-1', landlordId: 'landlord-1', amount: 1234.56,
        paymentType: 'Rent', proofImage: '/uploads/test.png', datePaid: new Date('2026-09-15T14:00:00Z') });
    assert.equal((await payments.getTenantAssignment('tenant-1')).landlord_id, 'landlord-1');
    assert.equal(await payments.getTenantEmailByPaymentId('payment-1'), 't@example.invalid');
    let payment = (await payments.getByTenant('tenant-1'))[0];
    assert.equal(typeof payment.amount, 'number');
    assert.equal(payment.amount, 1234.56);
    assert.equal(payment.datePaid.toISOString(), '2026-09-15T00:00:00.000Z');
    assert.equal(payment.paymentType, 'Rent');
    await payments.updateStatus('payment-1', 'Verified');
    await payments.verify('payment-1', 'Verified', 'Checked');
    payment = (await payments.getByLandlord('landlord-1'))[0];
    assert.equal(payment.remarks, 'Checked');
    assert.equal(payment.tenantName, 'Updated tenant');

    await chat.saveMessage('chat-1', 'conversation-1', 'tenant-1', 'landlord-1', 'tenant', 'Hello');
    const history = await chat.getHistoryByRoom('conversation-1');
    assert.equal(history[0].senderId, 'tenant-1');
    assert.equal(history[0].senderRole, 'tenant');
    await chat.updateUserLastSeen('tenant-1');
    assert.ok((await chat.getUserPresence('tenant-1')).lastSeen instanceof Date);
    console.log('PASS: house rules, maintenance telemetry, payment amounts/dates, chat aliases and presence');

    await tenants.rejectTenantTransaction('tenant-1');
    assert.equal((await payments.getByTenant('tenant-1')).length, 0);
    assert.equal((await maintenance.getByTenant('tenant-1')).length, 0);
    assert.equal(await tenants.getHousingDetails('tenant-1'), null);
    await assert.rejects(tenants.relinkTransaction('tenant-1', 'invalid'), /Invalid Landlord Code/);
    await tenants.relinkTransaction('tenant-1', 'DF-L');
    assert.equal((await tenants.getHousingDetails('tenant-1')).roomNumber, 'Unassigned');
    for (const role of ['anon', 'authenticated', 'service_role']) {
        await db.exec(`SET ROLE ${role}`);
        await assert.rejects(db.query('SELECT password FROM public.users'), /permission denied/);
        await db.exec('RESET ROLE');
    }
    assert.equal(config.toDateOnly('2026-09-15'), '2026-09-15');
    assert.throws(() => config.toDateOnly('2026-02-30'), /Invalid calendar date/);
    assert.throws(() => config.toDateOnly(new Date('invalid')), /Invalid calendar date/);
    assert.ok(released >= 10);
    console.log('PASS: rejection/relink transactions, Data API role denial, date validation and client release');

    let releaseError, calls = [];
    config.pool.connect = async () => ({
        query: async sql => { calls.push(sql); if (sql === 'ROLLBACK') throw new Error('rollback failed'); },
        release: error => { releaseError = error; }
    });
    const originalError = new Error('business failure');
    await assert.rejects(config.withTransaction(async () => { throw originalError; }), e => e === originalError);
    assert.deepEqual(calls, ['BEGIN', 'ROLLBACK']);
    assert.equal(releaseError.message, 'rollback failed');
    console.log('PASS: failed rollback discards connection and preserves original error');

    config.pool.connect = originalConnect;
    config.pool.query = originalQuery;
    await config.pool.end();
    await db.close();
    console.log('ALL TESTS PASSED (embedded PostgreSQL; no hosted Supabase connection or concurrent-client test)');
})().catch(error => { console.error(error); process.exitCode = 1; });

