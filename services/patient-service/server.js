'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlite3 = require('sqlite3').verbose();

const PROTO_PATH = path.join(__dirname, 'patient.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const patientProto = grpc.loadPackageDefinition(packageDefinition).patient;

// 1️⃣ Initialisation SQLite3
const dbPath = path.join(__dirname, 'data', 'patients.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Erreur ouverture Patient DB:', err.message);
  else console.log('✅ Connecté à Patient SQLite3');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    phone TEXT, date_of_birth TEXT, medical_record_number TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Helper Promise pour SQLite3
const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
});
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

// 2️⃣ Handlers gRPC
const patientService = {
  CreatePatient: async (call, callback) => {
    try {
      const { name, email, phone, date_of_birth, medical_record_number } = call.request;
      const existing = await query('SELECT id FROM patients WHERE email = ?', [email]);
      if (existing) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Email déjà utilisé' }, null);

      const id = `PAT-${Date.now()}`;
      await run('INSERT INTO patients (id, name, email, phone, date_of_birth, medical_record_number) VALUES (?,?,?,?,?,?)',
        [id, name, email, phone || '', date_of_birth || '', medical_record_number || '']);
      
      const patient = await query('SELECT * FROM patients WHERE id = ?', [id]);
      callback(null, { success: true, message: 'Patient créé', patient });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message }, null);
    }
  },
  GetPatient: async (call, callback) => {
    try {
      const patient = await query('SELECT * FROM patients WHERE id = ?', [call.request.id]);
      if (!patient) return callback({ code: grpc.status.NOT_FOUND, details: 'Patient non trouvé' }, null);
      callback(null, { success: true, message: 'OK', patient });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  ListPatients: async (call, callback) => {
    try {
      const patients = await all('SELECT * FROM patients');
      callback(null, { success: true, patients });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  UpdatePatient: async (call, callback) => {
    try {
      const { id, name, email, phone, date_of_birth, medical_record_number } = call.request;
      const existing = await query('SELECT id FROM patients WHERE id = ?', [id]);
      if (!existing) return callback({ code: grpc.status.NOT_FOUND, details: 'Patient non trouvé' }, null);

      await run('UPDATE patients SET name=?, email=?, phone=?, date_of_birth=?, medical_record_number=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [name, email, phone, date_of_birth, medical_record_number, id]);
      
      const updated = await query('SELECT * FROM patients WHERE id = ?', [id]);
      callback(null, { success: true, message: 'Patient mis à jour', patient: updated });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  DeletePatient: async (call, callback) => {
    try {
      const res = await run('DELETE FROM patients WHERE id = ?', [call.request.id]);
      if (res.changes === 0) return callback({ code: grpc.status.NOT_FOUND, details: 'Patient non trouvé' }, null);
      callback(null, { success: true, message: 'Patient supprimé' });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  }
};

function main() {
  const server = new grpc.Server();
  server.addService(patientProto.PatientService.service, patientService);
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('Erreur Patient Service:', err); return; }
    console.log(`✅ Patient Service gRPC + SQLite3 démarré sur le port ${port}`);
  });
}
main();