'use strict';
require('dotenv').config();
const { Kafka } = require('kafkajs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'medications.db'));
const run = (sql, p=[]) => new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); }));
const query = (sql, p=[]) => new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));

const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID || 'inventory-service', brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'inventory-group' });

const connectProducer = async () => { try { await producer.connect(); console.log('✅ Kafka Producer (Inventory) ready'); } catch(e) { console.error('❌ Kafka Inventory:', e); } };

const publishStockLow = async (med) => { try { await producer.send({ topic: 'stock.low', messages: [{ key: med.id, value: JSON.stringify(med) }] }); console.log(`📤 stock.low publié: ${med.id}`); } catch(e) { console.error('❌ Publish StockLow:', e); } };
const publishMedicationReserved = async (med) => { try { await producer.send({ topic: 'medication.reserved', messages: [{ key: med.id, value: JSON.stringify(med) }] }); console.log(` medication.reserved publié: ${med.id}`); } catch(e) { console.error('❌ Publish Reserved:', e); } };

const startConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ['prescription.added'], fromBeginning: true });
    console.log('✅ Inventory Consumer subscribed to prescription.added');
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          const medId = payload.medication_id;
          const qty = payload.quantity || 1;
          if(!medId) return;
          
          const med = await query('SELECT * FROM medications WHERE id=?', [medId]);
          if(med && med.stock_quantity >= qty) {
            await run('UPDATE medications SET stock_quantity = stock_quantity - ?, is_low_stock = CASE WHEN stock_quantity - ? < 10 THEN 1 ELSE 0 END WHERE id=?', [qty, qty, medId]);
            const updated = await query('SELECT * FROM medications WHERE id=?', [medId]);
            publishMedicationReserved(updated).catch(console.error);
            if(updated.is_low_stock) publishStockLow(updated).catch(console.error);
          }
        } catch(e) { console.error('❌ Inventory Consumer error:', e); }
      }
    });
  } catch(e) { console.error('❌ Inventory Consumer start failed:', e); }
};

module.exports = { connectProducer, startConsumer, publishStockLow, publishMedicationReserved };