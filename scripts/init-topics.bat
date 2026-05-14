@echo off
echo 🔄 Initialisation des topics Kafka...

set KAFKA_CONTAINER=smarthealth-kafka
set KAFKA_BIN=/opt/kafka/bin/kafka-topics.sh
set BOOTSTRAP=localhost:9092

echo ⏳ Création du topic 'patient.created'...
docker exec %KAFKA_CONTAINER% %KAFKA_BIN% --create --topic patient.created --bootstrap-server %BOOTSTRAP% --partitions 1 --replication-factor 1 --if-not-exists

echo ⏳ Création du topic 'appointment.confirmed'...
docker exec %KAFKA_CONTAINER% %KAFKA_BIN% --create --topic appointment.confirmed --bootstrap-server %BOOTSTRAP% --partitions 1 --replication-factor 1 --if-not-exists

echo ✅ Topics créés avec succès.
echo 📋 Liste des topics actifs :
docker exec %KAFKA_CONTAINER% %KAFKA_BIN% --list --bootstrap-server %BOOTSTRAP%
pause