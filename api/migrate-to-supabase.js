import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(apiDir, '..', 'data');
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) throw new Error('Set SUPABASE_DB_URL to Supabase Transaction Pooler connection string.');

const [dbText, secret, vapidText, fileNames] = await Promise.all([
  fs.readFile(path.join(dataDir, 'db.json'), 'utf8'),
  fs.readFile(path.join(dataDir, 'secret'), 'utf8'),
  fs.readFile(path.join(dataDir, 'vapid.json'), 'utf8'),
  fs.readdir(dataDir)
]);
const oldDb = JSON.parse(dbText);
const states = {};
for (const file of fileNames) {
  const match = /^state-(.+)\.json$/.exec(file);
  if (!match) continue;
  states[match[1]] = JSON.parse(await fs.readFile(path.join(dataDir, file), 'utf8'));
}

const restoreInvites = (oldDb.users || []).map(user => ({
  code: crypto.randomBytes(18).toString('base64url').toUpperCase(),
  note: 'One-time Vercel migration recovery',
  createdBy: 'migration',
  created: new Date().toISOString(),
  restoreUserId: user.id
}));
const snapshot = {
  users: oldDb.users || [],
  // Old passkeys are bound to localhost and cannot authenticate at the Vercel hostname.
  // Keep the local originals untouched; the restore codes attach new passkeys to these users.
  creds: [],
  // Browser push subscriptions are scoped to the old localhost origin.
  subs: [],
  // Supabase Auth user id → app profile id, populated when each person signs in.
  authUsers: {},
  invites: [...(oldDb.invites || []), ...restoreInvites],
  states,
  challenges: {},
  presence: {},
  sessionSecret: secret.trim(),
  vapid: JSON.parse(vapidText)
};

const sql = postgres(connectionString, { max: 1, prepare: false, ssl: 'require', connect_timeout: 10 });
try {
  await sql.begin(async tx => {
    const rows = await tx`select payload from public.opengym_snapshot where id = 1 for update`;
    if (!rows.length) throw new Error('Run supabase/001_opengym_snapshot.sql in Supabase SQL Editor first.');
    const current = rows[0].payload;
    if ((current.users || []).length || (current.creds || []).length || (current.subs || []).length ||
        (current.invites || []).length || Object.keys(current.states || {}).length)
      throw new Error('Supabase already contains gymbook data. Import stopped without overwriting it.');
    await tx`update public.opengym_snapshot set payload = ${JSON.stringify(snapshot)}::jsonb, updated_at = now() where id = 1`;
  });
} finally {
  await sql.end({ timeout: 2 });
}

console.log(`Imported ${snapshot.users.length} profile(s) and ${Object.keys(states).length} workout state file(s).`);
console.log('New passkeys are required at the Vercel hostname. Recovery codes (one use each):');
for (const invite of restoreInvites) {
  const user = snapshot.users.find(x => x.id === invite.restoreUserId);
  console.log(`${user?.name || invite.restoreUserId}: ${invite.code}`);
}
console.log('Keep these codes private. The local data folder was only read and remains unchanged.');
