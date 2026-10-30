// Run from server/: DEMO_PASSWORD must be supplied in the environment.
require('ts-node/register');
const { pool, withTransaction } = require('../src/config/dbConfig');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const names = ['Alex Rivera', 'Mia Santos', 'Noah Reyes', 'Sofia Cruz', 'Liam Garcia', 'Isabella Ramos', 'Ethan Flores', 'Chloe Mendoza', 'Lucas Torres', 'Ava Castillo'];
const issues = [
  ['Plumbing', 'Bathroom sink drains slowly and water pools after use.', 'Medium'],
  ['Electrical', 'Ceiling light flickers when switched on.', 'High'],
  ['Appliance', 'Air conditioner runs but does not cool the room.', 'Medium'],
  ['Structural', 'Window latch is loose and needs adjustment.', 'Low'],
  ['Plumbing', 'Toilet keeps running after flushing.', 'Medium'],
  ['Electrical', 'Desk outlet has stopped supplying power; it is no longer in use.', 'High'],
  ['Appliance', 'Electric fan makes a rattling sound at medium speed.', 'Low'],
  ['Structural', 'Door hinge is loose and the door scrapes the floor.', 'Medium'],
  ['Plumbing', 'Shower tap drips even when fully closed.', 'Low'],
  ['Other', 'Study chair has a loose backrest and needs repair.', 'Low'],
];

async function main() {
  if (!process.env.DEMO_PASSWORD) throw new Error('Set DEMO_PASSWORD before running the showcase seed.');
  const hash = await bcrypt.hash(process.env.DEMO_PASSWORD, 10);
  await withTransaction(async db => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext('dormfix-showcase-seed'))");
    const { rows: [landlord] } = await db.query("SELECT id FROM users WHERE email=$1 AND role='landlord'", [process.env.DEMO_LANDLORD_EMAIL || 'landlord@gmail.com']);
    if (!landlord) throw new Error('Showcase landlord account was not found.');
    for (let i = 0; i < names.length; i++) {
      const email = `demo.tenant${String(i + 1).padStart(2, '0')}@example.com`;
      const room = `Demo-${201 + Math.floor(i / 2)}`;
      const { rows: existing } = await db.query('SELECT id FROM users WHERE email=$1', [email]);
      if (existing.length) throw new Error(`Demo account already exists: ${email}. No changes were made; seed only once.`);
      const { rows: rooms } = await db.query('SELECT id FROM rooms WHERE landlord_id=$1 AND room_number=$2', [landlord.id, room]);
      if (!rooms.length) await db.query('INSERT INTO rooms(id,landlord_id,room_number,capacity) VALUES($1,$2,$3,2)', [randomUUID(), landlord.id, room]);
      const id = randomUUID();
      await db.query("INSERT INTO users(id,name,email,password,role,dorm_fix_id,is_approved,created_at) VALUES($1,$2,$3,$4,'tenant',$5,true,now()-interval '45 days')", [id, `${names[i]} (Demo)`, email, hash, `T-DEMO-${String(i + 1).padStart(2, '0')}`]);
      await db.query("INSERT INTO dorm_assignments(id,tenant_id,landlord_id,room_number,move_in_date) VALUES($1,$2,$3,$4,current_date-45)", [randomUUID(), id, landlord.id, room]);
      for (let j = 0; j < 2; j++) {
        const issue = issues[(i + j * 3) % issues.length];
        const status = j === 1 ? 'Completed' : i < 6 ? 'Pending' : 'In Progress';
        const ageDays = j === 1 ? 14 + i : i;
        await db.query("INSERT INTO maintenance_requests(id,tenant_id,issue_type,description,urgency,status,date_submitted,admin_remarks,notification_status) VALUES($1,$2,$3,$4,$5,$6,now()-($7::int * interval '1 day'),$8,'Not Required')", [randomUUID(), id, issue[0], `[Demo] ${issue[1]}`, issue[2], status, ageDays, status === 'Completed' ? 'Demo: repair completed and checked with tenant.' : status === 'In Progress' ? 'Demo: maintenance visit scheduled.' : null]);
      }
    }
  });
  console.log('Created 10 approved demo tenants, 5 rooms, and 20 maintenance requests (6 Pending, 4 In Progress, 10 Completed).');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
