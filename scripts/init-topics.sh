#!/bin/bash
echo "🔄 Initialisation des topics Kafka..."
docker exec smarthealth-kafka kafka-topics.sh --create --topic patient.created --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists
docker exec smarthealth-kafka kafka-topics.sh --create --topic appointment.confirmed --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1 --if-not-exists
echo "✅ Topics prêts."