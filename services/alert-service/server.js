'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlite3 = require('sqlite3').verbose();

const PROTO_PATH = path.join(__dirname, 'alert.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const alertProto = grpc.loadPackageDefinition(packageDefinition).alert;

const dbPath = path.join(__dirname, 'data', 'alerts.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Erreur ouverture Alert DB:', err.message);
  else console.log('✅ Connecté à Alert SQLite3');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, patient_name TEXT NOT NULL,
    alert_type TEXT NOT NULL, severity TEXT CHECK(severity IN ('low','medium','high','critical')),
    title TEXT NOT NULL, description TEXT,
    status TEXT CHECK(status IN ('pending','acknowledged','resolved')) DEFAULT 'pending',
    triggered_at TEXT DEFAULT CURRENT_TIMESTAMP, resolved_at TEXT
  )`);
});

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
});
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

const alertService = {
  TriggerAlert: async (call, callback) => {
    try {
      const id = `ALT-${Date.now()}`;
      await run('INSERT INTO alerts (id, patient_id, patient_name, alert_type, severity, title, description) VALUES (?,?,?,?,?,?,?)',
        [id, call.request.patient_id, call.request.patient_name, call.request.alert_type, call.request.severity, call.request.title, call.request.description]);
      const alert = await query('SELECT * FROM alerts WHERE id = ?', [id]);
      callback(null, { success: true, message: 'Alerte déclenchée', alert });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  GetAlert: async (call, callback) => {
    try {
      const alert = await query('SELECT * FROM alerts WHERE id = ?', [call.request.id]);
      if (!alert) return callback({ code: grpc.status.NOT_FOUND, details: 'Alerte non trouvée' }, null);
      callback(null, { success: true, message: 'OK', alert });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  ListAlerts: async (call, callback) => {
    try {
      const alerts = await all('SELECT * FROM alerts');
      callback(null, { success: true, alerts });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  AcknowledgeAlert: async (call, callback) => {
    try {
      const res = await run('UPDATE alerts SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?', ['acknowledged', call.request.id]);
      if (res.changes === 0) return callback({ code: grpc.status.NOT_FOUND, details: 'Alerte non trouvée' }, null);
      callback(null, { success: true, message: 'Alerte reconnue' });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  }
};

function main() {
  const server = new grpc.Server();
  server.addService(alertProto.AlertService.service, alertService);
  server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('Erreur Alert Service:', err); return; }
    console.log(`✅ Alert Service gRPC + SQLite3 démarré sur le port ${port}`);
  });
}
main();