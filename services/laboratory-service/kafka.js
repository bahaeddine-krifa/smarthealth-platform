'use strict';
require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID || 'laboratory-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] });
const producer = kafka.producer();

const connectProducer = async () => { try { await producer.connect(); console.log('✅ Kafka Producer (Laboratory) ready'); } catch(e) { console.error('❌ Kafka Lab:', e); } };

const publishTestResultReady = async (test) => {
  try {
    await producer.send({ topic: 'test.result.ready', messages: [{ key: test.id, value: JSON.stringify(test) }] });
    console.log(` test.result.ready publié: ${test.id}`);
  } catch(e) { console.error('❌ Publish TestResult:', e); }
};

module.exports = { connectProducer, publishTestResultReady };