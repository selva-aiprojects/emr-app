import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'server/data/db.json');

export function readDb() {
  const raw = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(raw);
}

export function writeDb(data) {
  fs.writeFileSync(dbPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function updateDb(mutator) {
  const db = readDb();
  const next = mutator(db) || db;
  writeDb(next);
  return next;
}

export function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatNow() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function tenantSlice(db, tenantId) {
  return {
    patients: db.patients.filter((x) => x.tenantId === tenantId),
    appointments: db.appointments.filter((x) => x.tenantId === tenantId),
    encounters: db.encounters.filter((x) => x.tenantId === tenantId),
    invoices: db.invoices.filter((x) => x.tenantId === tenantId),
    inventory: db.inventory.filter((x) => x.tenantId === tenantId),
    auditLogs: db.auditLogs.filter((x) => x.tenantId === tenantId),
    users: db.users.filter((x) => x.tenantId === tenantId)
  };
}
