// services/alert-service/kafka.js
require('dotenv').config();
const { Kafka } = require('kafkajs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Helper SQLite (réutilisé depuis server.js)
const db = new sqlite3.Database(path.join(__dirname, 'data', 'alerts.db'));
const run = (sql, params = []) => new Promise((res, rej) => {
  db.run(sql, params, function(err) { err ? rej(err) : res(this); });
});

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'alert-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'alert-consumer-group' });

const startConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ['patient.created', 'appointment.confirmed'], fromBeginning: true });
    console.log('✅ Kafka Consumer (Alert) abonné aux topics');

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log(`📥 [Kafka] Reçu sur ${topic} | Key: ${message.key?.toString()}`);

          // Scénario métier conforme au cahier des charges
          const alertId = `ALT-KAFKA-${Date.now()}`;
          const isPatientEvent = topic === 'patient.created';
          const alertType = isPatientEvent ? 'welcome' : 'appointment_reminder';
          const severity = isPatientEvent ? 'low' : 'medium';
          const title = isPatientEvent ? 'Nouveau patient enregistré' : 'Rendez-vous confirmé';
          const description = `Événement Kafka auto-traité: ${topic} | Patient: ${payload.name || payload.patient_name}`;

          await run(
            `INSERT INTO alerts (id, patient_id, patient_name, alert_type, severity, title, description, status, triggered_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
            [alertId, payload.id || payload.patient_id, payload.name || payload.patient_name, alertType, severity, title, description]
          );
          console.log(`✅ [Alert] Alerte auto-créée via Kafka: ${alertId}`);
        } catch (err) {
          console.error('❌ Erreur traitement message Kafka:', err.message);
        }
      },
    });
  } catch (err) {
    console.error('❌ Erreur démarrage Kafka Consumer (Alert):', err.message);
  }
};

module.exports = { startConsumer };