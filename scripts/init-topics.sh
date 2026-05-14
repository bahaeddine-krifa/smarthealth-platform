#!/bin/bash
set -e  # ⚠️ Arrête le script dès la première erreur

echo "🔄 Initialisation des topics Kafka..."

KAFKA_CONTAINER="smarthealth-kafka"
KAFKA_BIN="/opt/kafka/bin/kafka-topics.sh"
BOOTSTRAP="localhost:9092"

# Création des topics métier
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic patient.created \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic appointment.confirmed \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "✅ Topics créés avec succès."
echo "📋 Liste des topics actifs :"
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" --list --bootstrap-server "$BOOTSTRAP"