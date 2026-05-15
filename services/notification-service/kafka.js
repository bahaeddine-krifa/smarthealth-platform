'use strict';
require('dotenv').config();
const { Kafka } = require('kafkajs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'notifications.db'));
db.serialize(() => db.run(`CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT, channel TEXT, subject TEXT, body TEXT, status TEXT DEFAULT 'pending', sent_at TEXT
)`));
const run = (sql, p=[]) => new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));

const kafka = new Kafka({ clientId: 'notification-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'notification-group' });

const startConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: [
      'patient.created', 'appointment.confirmed', 'doctor.created', 'payment.completed',
      'invoice.generated', 'record.created', 'prescription.added', 'stock.low', 'test.result.ready', 'alert.triggered'
    ], fromBeginning: true });
    console.log('✅ Notification Consumer subscribed to 10 topics');

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          const id = `NOTIF-${Date.now()}`;
          const now = new Date().toISOString();
          // Logique métier de routage multi-canal
          let channel = 'email', subject = `Notification: ${topic}`, body = JSON.stringify(payload);
          if(topic.includes('stock') || topic.includes('alert')) channel = 'sms';
          if(topic.includes('test') || topic.includes('prescription')) channel = 'push';
          
          await run(`INSERT INTO notifications (id, user_id, channel, subject, body, status, sent_at) VALUES (?,?,?,?,?,?,?)`,
            [id, payload.patient_id || payload.user_id || 'system', channel, subject, body, 'sent', now]);
          console.log(` [Notification] ${channel} sent for ${topic} | ID: ${id}`);
        } catch(e) { console.error('❌ Notification processing error:', e.message); }
      }
    });
  } catch(e) { console.error('❌ Notification Consumer start failed:', e); }
};
module.exports = { startConsumer };