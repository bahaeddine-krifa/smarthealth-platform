'use strict';
require('dotenv').config();
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlite3 = require('sqlite3').verbose();
const { connectProducer, publishPaymentCompleted, publishInvoiceGenerated } = require('./kafka');

const PROTO_PATH = path.join(__dirname, 'payment.proto');
const pkgDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const paymentProto = grpc.loadPackageDefinition(pkgDef).payment;

const dbPath = path.join(__dirname, 'data', 'invoices.db');
const db = new sqlite3.Database(dbPath, (err) => { if(err) console.error('❌ DB Payment:', err.message); });
db.serialize(() => db.run(`CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, patient_id TEXT, appointment_id TEXT, amount REAL, currency TEXT, 
  status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP, paid_at TEXT
)`));

const query = (sql, p=[]) => new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
const all = (sql, p=[]) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
const run = (sql, p=[]) => new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));

const paymentService = {
  CreateInvoice: async (call, cb) => {
    try {
      const { patient_id, appointment_id, amount, currency } = call.request;
      const id = `INV-${Date.now()}`;
      await run('INSERT INTO invoices (id, patient_id, appointment_id, amount, currency) VALUES (?,?,?,?,?)', [id, patient_id, appointment_id, amount, currency||'USD']);
      const invoice = await query('SELECT * FROM invoices WHERE id=?', [id]);
      publishInvoiceGenerated(invoice).catch(console.error);
      cb(null, { success: true, message: 'Invoice created', invoice });
    } catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  ProcessPayment: async (call, cb) => {
    try {
      const invoice = await query('SELECT * FROM invoices WHERE id=?', [call.request.invoice_id]);
      if(!invoice || invoice.status !== 'pending') return cb({ code: grpc.status.FAILED_PRECONDITION, details: 'Invalid or already paid invoice' }, null);
      
      const paid_at = new Date().toISOString();
      await run('UPDATE invoices SET status=?, paid_at=? WHERE id=?', ['paid', paid_at, call.request.invoice_id]);
      const updated = await query('SELECT * FROM invoices WHERE id=?', [call.request.invoice_id]);
      
      publishPaymentCompleted(updated).catch(console.error);
      cb(null, { success: true, message: 'Payment processed', transaction_id: `TXN-${Date.now()}` });
    } catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  GetInvoice: async (call, cb) => {
    try { const inv = await query('SELECT * FROM invoices WHERE id=?', [call.request.id]); inv ? cb(null, { success: true, invoice: inv }) : cb({ code: grpc.status.NOT_FOUND, details: 'Not found' }, null); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  GetPatientInvoices: async (call, cb) => {
    try { const invs = await all('SELECT * FROM invoices WHERE patient_id=?', [call.request.patient_id]); cb(null, { success: true, invoices: invs }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  ListInvoices: async (_, cb) => {
    try { cb(null, { success: true, invoices: await all('SELECT * FROM invoices') }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  }
};

async function main() {
  await connectProducer();
  const server = new grpc.Server();
  server.addService(paymentProto.PaymentService.service, paymentService);
  server.bindAsync('0.0.0.0:50055', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if(err) { console.error('❌ Payment Service:', err); return; }
    console.log(`✅ Payment Service gRPC + SQLite3 on port ${port}`);
  });
}
main();