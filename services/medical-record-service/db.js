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
    title: 'medical-record schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        patient_id: { type: 'string', maxLength: 100 },
        doctor_id: { type: 'string', maxLength: 100 },
        diagnosis: { type: 'string', maxLength: 2000 },
        prescriptions: { type: 'string', maxLength: 5000 },
        allergies: { type: 'string', maxLength: 1000 },
        created_at: { type: 'string', maxLength: 50 },
        updated_at: { type: 'string', maxLength: 50 }
    },
    required: ['id', 'patient_id', 'doctor_id', 'diagnosis'],
    indexes: ['patient_id']
};

async function load() {
    try {
        return JSON.parse(await fs.readFile(SNAPSHOT, 'utf8'));
    } catch {
        return [];
    }
}

async function save(col) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const docs = await col.find().exec();
    const users = docs.map(d => d.toJSON());
    await fs.writeFile(SNAPSHOT, JSON.stringify(users, null, 2), 'utf8');
}

async function init() {
    const storage = wrappedValidateAjvStorage({ storage: getRxStorageMemory() });
    const db = await createRxDatabase({
        name: 'medrec-db',
        storage,
        eventReduce: true,
        multiInstance: false
    });
    await db.addCollections({ records: { schema } });
    const initial = await load();
    if (initial.length) await db.records.bulkInsert(initial);
    return {
        db,
        records: db.records,
        persist: save,
        createId: () => `REC-${Date.now()}`
    };
}

module.exports = init();