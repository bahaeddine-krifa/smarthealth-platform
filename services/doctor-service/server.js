'use strict';
require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlite3 = require('sqlite3').verbose();
const { connectProducer, publishDoctorCreated } = require('./kafka');

const PROTO_PATH = path.join(__dirname, 'doctor.proto');
const pkgDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const doctorProto = grpc.loadPackageDefinition(pkgDef).doctor;

const dbPath = path.join(__dirname, 'data', 'doctors.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error('❌ DB Doctor:', err.message); });
db.serialize(() => db.run(`CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY, name TEXT, specialty TEXT, email TEXT UNIQUE, phone TEXT, cabinet_location TEXT, is_available BOOLEAN DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`));

const query = (sql, p=[]) => new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
const all = (sql, p=[]) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
const run = (sql, p=[]) => new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));

const doctorService = {
  CreateDoctor: async (call, cb) => {
    try {
      const { name, specialty, email, phone, cabinet_location } = call.request;
      const exists = await query('SELECT id FROM doctors WHERE email=?', [email]);
      if(exists) return cb({ code: grpc.status.ALREADY_EXISTS, details: 'Email déjà utilisé' }, null);
      const id = `DOC-${Date.now()}`;
      await run('INSERT INTO doctors (id, name, specialty, email, phone, cabinet_location) VALUES (?,?,?,?,?,?)', [id, name, specialty, email, phone||'', cabinet_location||'']);
      const doc = await query('SELECT * FROM doctors WHERE id=?', [id]);
      publishDoctorCreated(doc).catch(console.error);
      cb(null, { success: true, message: 'Doctor created', doctor: doc });
    } catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  GetDoctor: async (call, cb) => {
    try { const doc = await query('SELECT * FROM doctors WHERE id=?', [call.request.id]); doc ? cb(null, { success: true, doctor: doc }) : cb({ code: grpc.status.NOT_FOUND, details: 'Not found' }, null); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  SearchDoctors: async (call, cb) => {
    try { const docs = await all('SELECT * FROM doctors WHERE specialty LIKE ?', [`%${call.request.specialty}%`]); cb(null, { success: true, doctors: docs }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  UpdateAvailability: async (call, cb) => {
    try { const r = await run('UPDATE doctors SET is_available=? WHERE id=?', [call.request.is_available, call.request.id]); r.changes ? cb(null, { success: true, message: 'Updated' }) : cb({ code: grpc.status.NOT_FOUND, details: 'Not found' }, null); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  ListDoctors: async (_, cb) => {
    try { cb(null, { success: true, doctors: await all('SELECT * FROM doctors') }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  }
};

async function main() {
  await connectProducer();
  const server = new grpc.Server();
  server.addService(doctorProto.DoctorService.service, doctorService);
  server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if(err) { console.error('❌ Doctor Service:', err); return; }
    console.log(`✅ Doctor Service gRPC + SQLite3 on port ${port}`);
  });
}
main();