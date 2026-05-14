'use strict';
const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'rdv.snapshot.json');

const rdvSchema = {
  title: 'rendezvous schema', version: 0, primaryKey: 'id', type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 }, patient_id: { type: 'string' },
    patient_name: { type: 'string' }, doctor_name: { type: 'string' },
    appointment_date: { type: 'string' }, appointment_time: { type: 'string' },
    reason: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
    created_at: { type: 'string' }, updated_at: { type: 'string' }
  },
  required: ['id', 'patient_id', 'appointment_date', 'appointment_time', 'status'],
  indexes: ['patient_id', 'appointment_date']
};

async function loadSnapshot() {
  try { return JSON.parse(await fs.readFile(SNAPSHOT_FILE, 'utf8')); }
  catch { return []; }
}

async function persist(collection) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const docs = await collection.find().exec();
  await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(docs.map(d => d.toJSON()), null, 2), 'utf8');
}

async function initDatabase() {
  const storage = wrappedValidateAjvStorage({ storage: getRxStorageMemory() });
  const db = await createRxDatabase({ name: 'rdv-db', storage, eventReduce: true, multiInstance: false });
  await db.addCollections({ rdv: { schema: rdvSchema } });
  
  const initial = await loadSnapshot();
  if (initial.length > 0) await db.rdv.bulkInsert(initial);
  
  return { db, rdv: db.rdv, persist, createId: () => `RDV-${Date.now()}` };
}

module.exports = initDatabase();