// services/patient-service/kafka.js
require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'patient-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer (Patient) connecté à', process.env.KAFKA_BROKER);
  } catch (err) {
    console.error('❌ Erreur connexion Kafka Producer (Patient):', err.message);
  }
};

const publishPatientCreated = async (patient) => {
  try {
    await producer.send({
      topic: 'patient.created',
      messages: [{ key: patient.id, value: JSON.stringify(patient) }],
    });
    console.log(`📤 [Kafka] patient.created publié | ID: ${patient.id}`);
  } catch (err) {
    console.error('❌ Erreur publication Kafka (Patient):', err.message);
  }
};

module.exports = { connectProducer, publishPatientCreated };