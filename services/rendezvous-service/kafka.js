// services/rendezvous-service/kafka.js
require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'rendezvous-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer (RendezVous) connecté à', process.env.KAFKA_BROKER);
  } catch (err) {
    console.error('❌ Erreur connexion Kafka Producer (RendezVous):', err.message);
  }
};

const publishAppointmentConfirmed = async (appointment) => {
  try {
    await producer.send({
      topic: 'appointment.confirmed',
      messages: [{ key: appointment.id, value: JSON.stringify(appointment) }],
    });
    console.log(`📤 [Kafka] appointment.confirmed publié | ID: ${appointment.id}`);
  } catch (err) {
    console.error('❌ Erreur publication Kafka (RendezVous):', err.message);
  }
};

module.exports = { connectProducer, publishAppointmentConfirmed };