'use strict';
require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlite3 = require('sqlite3').verbose();
const { connectProducer, publishTestResultReady } = require('./kafka');

const PROTO_PATH = path.join(__dirname, 'laboratory.proto');
const pkgDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const labProto = grpc.loadPackageDefinition(pkgDef).laboratory;

const dbPath = path.join(__dirname, 'data', 'tests.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error('❌ DB Laboratory:', err.message); });
db.serialize(() => db.run(`CREATE TABLE IF NOT EXISTS lab_tests (
  id TEXT PRIMARY KEY, patient_id TEXT, test_type TEXT, status TEXT DEFAULT 'scheduled', 
  result_data TEXT, is_abnormal BOOLEAN DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, completed_at TEXT
)`));

const query = (sql, p=[]) => new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
const all = (sql, p=[]) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
const run = (sql, p=[]) => new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));

const labService = {
  CreateTest: async (call, cb) => {
    try {
      const id = `LAB-${Date.now()}`;
      await run('INSERT INTO lab_tests (id, patient_id, test_type) VALUES (?,?,?)', [id, call.request.patient_id, call.request.test_type]);
      const test = await query('SELECT * FROM lab_tests WHERE id=?', [id]);
      cb(null, { success: true, message: 'Test created', test });
    } catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  ScheduleTest: async (call, cb) => {
    try {
      const r = await run('UPDATE lab_tests SET status=? WHERE id=?', ['in_progress', call.request.test_id]);
      if(r.changes === 0) return cb({ code: grpc.status.NOT_FOUND, details: 'Not found' }, null);
      cb(null, { success: true, message: 'Test scheduled' });
    } catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  AddTestResult: async (call, cb) => {
    try {
      const completed_at = new Date().toISOString();
      await run('UPDATE lab_tests SET status=?, result_data=?, is_abnormal=?, completed_at=? WHERE id=?', 
        ['completed', call.request.result_data, call.request.is_abnormal, completed_at, call.request.test_id]);
      const test = await query('SELECT * FROM lab_tests WHERE id=?', [call.request.test_id]);
      publishTestResultReady(test).catch(console.error);
      cb(null, { success: true, message: 'Result added', test });
    } catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  GetTestResults: async (call, cb) => {
    try { const tests = await all('SELECT * FROM lab_tests WHERE patient_id=?', [call.request.patient_id]); cb(null, { success: true, tests }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  GetTest: async (call, cb) => {
    try {
      const test = await query('SELECT * FROM lab_tests WHERE id=?', [call.request.id]);
      if (!test) {
        return cb({ 
          code: grpc.status.NOT_FOUND, 
          details: 'Lab test not found' 
        }, null);
      }
      cb(null, { success: true, message: 'Test found', test });
    } catch (e) {
      cb({ code: grpc.status.INTERNAL, details: e.message }, null);
    }
  },
  ListTests: async (_, cb) => {
    try { cb(null, { success: true, tests: await all('SELECT * FROM lab_tests') }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  }
};

async function main() {
  await connectProducer();
  const server = new grpc.Server();
  server.addService(labProto.LaboratoryService.service, labService);
  server.bindAsync('0.0.0.0:50058', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if(err) { console.error('❌ Laboratory Service:', err); return; }
    console.log(`✅ Laboratory Service gRPC + SQLite3 on port ${port}`);
  });
}
main();