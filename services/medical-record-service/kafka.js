const { Kafka } = require('kafkajs');
const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID || 'medical-record-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] });
const producer = kafka.producer();
const connectProducer = async () => { try { await producer.connect(); console.log('✅ Kafka Producer (MedRec) ready'); } catch(e) { console.error('❌ Kafka MedRec:', e); } };
const publishRecordCreated = async (rec) => { try { await producer.send({ topic: 'record.created', messages: [{ key: rec.id, value: JSON.stringify(rec) }] }); console.log(`📤 record.created published: ${rec.id}`); } catch(e) { console.error('❌ Publish MedRec:', e); } };
module.exports = { connectProducer, publishRecordCreated };