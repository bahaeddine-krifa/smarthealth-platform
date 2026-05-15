'use strict';
require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer (Payment) connecté');
  } catch (e) { console.error('❌ Erreur connexion Kafka Payment:', e.message); }
};

const publishPaymentCompleted = async (invoice) => {
  try {
    await producer.send({ topic: 'payment.completed', messages: [{ key: invoice.id, value: JSON.stringify(invoice) }] });
    console.log(`📤 payment.completed publié: ${invoice.id}`);
  } catch (e) { console.error('❌ Erreur publication payment.completed:', e.message); }
};

const publishInvoiceGenerated = async (invoice) => {
  try {
    await producer.send({ topic: 'invoice.generated', messages: [{ key: invoice.id, value: JSON.stringify(invoice) }] });
    console.log(`📤 invoice.generated publié: ${invoice.id}`);
  } catch (e) { console.error('❌ Erreur publication invoice.generated:', e.message); }
};

module.exports = { connectProducer, publishPaymentCompleted, publishInvoiceGenerated };