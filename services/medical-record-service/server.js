'use strict';
require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const dbPromise = require('./db');
const { connectProducer, publishRecordCreated } = require('./kafka');

const PROTO_PATH = require('path').join(__dirname, 'medical_record.proto');
const proto = grpc.loadPackageDefinition(protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })).medicalrecord;

const service = {
    CreateRecord: async (call, cb) => {
        try {
            const { records, persist, createId } = await dbPromise;
            const id = createId();
            const now = new Date().toISOString();
            const doc = await records.insert({ id, ...call.request, created_at: now, updated_at: now });
            await persist(records);
            publishRecordCreated(doc.toJSON()).catch(console.error);
            cb(null, { success: true, message: 'Record created', record: doc.toJSON() });
        } catch (e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
    },
    GetRecord: async (call, cb) => {
        try { const { records } = await dbPromise; const doc = await records.findOne(call.request.id).exec(); doc ? cb(null, { success: true, record: doc.toJSON() }) : cb({ code: grpc.status.NOT_FOUND, details: 'Not found' }, null); }
        catch (e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
    },
    GetPatientHistory: async (call, cb) => {
        try { const { records } = await dbPromise; const docs = await records.find({ selector: { patient_id: call.request.patient_id } }).exec(); cb(null, { success: true, records: docs.map(d => d.toJSON()) }); }
        catch (e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
    },
    UpdateAllergies: async (call, cb) => {
        try { const { records, persist } = await dbPromise; const doc = await records.findOne(call.request.record_id).exec(); if (!doc) return cb({ code: grpc.status.NOT_FOUND, details: 'Not found' }, null); await doc.patch({ allergies: call.request.allergies, updated_at: new Date().toISOString() }); await persist(records); cb(null, { success: true, message: 'Allergies updated' }); }
        catch (e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
    },
    ListRecords: async (_, cb) => {
        try { const { records } = await dbPromise; cb(null, { success: true, records: (await records.find().exec()).map(d => d.toJSON()) }); }
        catch (e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
    }
};

async function main() {
    await connectProducer();
    const server = new grpc.Server();
    server.addService(proto.MedicalRecordService.service, service);
    server.bindAsync('0.0.0.0:50056', grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) { console.error('❌ MedRec Service:', err); return; }
        console.log(`✅ Medical Record Service gRPC + RxDB on port ${port}`);
    });
}
main();