'use strict';
require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { startConsumer } = require('./kafka');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'notification.proto');
const proto = grpc.loadPackageDefinition(protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true })).notification;

const db = new sqlite3.Database(path.join(__dirname, 'data', 'notifications.db'));
const query = (sql, p=[]) => new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
const all = (sql, p=[]) => new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));

const service = {
  SendEmail: async (call, cb) => { /* Logique simulation envoi email */ cb(null, { success: true, message: 'Email queued' }); },
  SendSMS: async (call, cb) => { cb(null, { success: true, message: 'SMS queued' }); },
  SendPush: async (call, cb) => { cb(null, { success: true, message: 'Push queued' }); },
  GetHistory: async (call, cb) => {
    try { const notifs = await all('SELECT * FROM notifications WHERE user_id=?', [call.request.user_id]); cb(null, { success: true, notifications: notifs }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  },
  ListNotifications: async (_, cb) => {
    try { cb(null, { success: true, notifications: await all('SELECT * FROM notifications') }); }
    catch(e) { cb({ code: grpc.status.INTERNAL, details: e.message }, null); }
  }
};

async function main() {
  await startConsumer(); // Démarre le consommateur Kafka en arrière-plan
  const server = new grpc.Server();
  server.addService(proto.NotificationService.service, service);
  server.bindAsync('0.0.0.0:50059', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if(err) { console.error('❌ Notification Service:', err); return; }
    console.log(`✅ Notification Service gRPC + Kafka Consumer on port ${port}`);
  });
}
main();