const { Kafka } = require("kafkajs");
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "doctor-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
const producer = kafka.producer();
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log("✅ Kafka Producer (Doctor) ready");
  } catch (e) {
    console.error("❌ Kafka Doctor:", e);
  }
};
const publishDoctorCreated = async (doc) => {
  try {
    await producer.send({
      topic: "doctor.created",
      messages: [{ key: doc.id, value: JSON.stringify(doc) }],
    });
    console.log(`📤 doctor.created published: ${doc.id}`);
  } catch (e) {
    console.error("❌ Publish Doctor:", e);
  }
};
module.exports = { connectProducer, publishDoctorCreated };
