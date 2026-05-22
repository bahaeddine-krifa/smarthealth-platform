#!/bin/bash
set -e  # ⚠️ Arrête le script dès la première erreur

echo "🔄 Initialisation des 10 topics Kafka pour SmartHealth Platform..."

KAFKA_CONTAINER="smarthealth-kafka"
KAFKA_BIN="/opt/kafka/bin/kafka-topics.sh"
BOOTSTRAP="localhost:9092"

# Création des 10 topics métier
echo "⏳ [1/10] Création du topic 'patient.created'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic patient.created \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [2/10] Création du topic 'appointment.confirmed'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic appointment.confirmed \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [3/10] Création du topic 'doctor.created'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic doctor.created \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [4/10] Création du topic 'payment.completed'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic payment.completed \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [5/10] Création du topic 'invoice.generated'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic invoice.generated \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [6/10] Création du topic 'record.created'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic record.created \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [7/10] Création du topic 'prescription.added'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic prescription.added \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [8/10] Création du topic 'stock.low'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic stock.low \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [9/10] Création du topic 'test.result.ready'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic test.result.ready \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "⏳ [10/10] Création du topic 'alert.triggered'..."
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" \
  --create --topic alert.triggered \
  --bootstrap-server "$BOOTSTRAP" \
  --partitions 1 --replication-factor 1 --if-not-exists

echo "✅ Tous les topics créés avec succès."
echo "📋 Liste des topics actifs :"
docker exec "$KAFKA_CONTAINER" "$KAFKA_BIN" --list --bootstrap-server "$BOOTSTRAP"