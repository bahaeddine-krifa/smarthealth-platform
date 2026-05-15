'use strict';
const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOT = path.join(DATA_DIR, 'records.snapshot.json');

const schema = {
    title: 'medical-record schema', version: 0, primaryKey: 'id', type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 }, patient_id: { type: 'string' }, doctor_id: { type: 'string' },
        diagnosis: { type: 'string' }, prescriptions: { type: 'string' }, allergies: { type: 'string' },
        created_at: { type: 'string' }, updated_at: { type: 'string' }
    },
    required: ['id', 'patient_id', 'doctor_id', 'diagnosis'],
    indexes: ['patient_id']
};

async function load() { try { return JSON.parse(await fs.readFile(SNAPSHOT, 'utf8')); } catch { return []; } }
async function save(col) { await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(SNAPSHOT, JSON.stringify((await col.find().exec()).map(d => d.toJSON()), null, 2)); }

async function init() {
    const storage = wrappedValidateAjvStorage({ storage: getRxStorageMemory() });
    const db = await createRxDatabase({ name: 'medrec-db', storage, eventReduce: true, multiInstance: false });
    await db.addCollections({ records: { schema } });
    const initial = await load();
    if (initial.length) await db.records.bulkInsert(initial);
    return { db, records: db.records, persist: save, createId: () => `REC-${Date.now()}` };
}
module.exports = init();