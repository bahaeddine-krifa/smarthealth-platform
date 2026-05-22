# 📡 Topics Kafka - SmartHealth Platform

## Vue d'ensemble
Kafka est utilisé pour la communication asynchrone entre les 6 microservices. 
Chaque événement métier pertinent est publié sur un topic dédié, permettant un découplage complet entre producteurs et consommateurs.

## Liste des Topics

### 1. `patient.created`
- **Producteur** : Patient Service
- **Consommateurs** : Notification Service, Medical Record Service
- **Payload** : `{ "id": "PAT-xxx", "name": "...", "email": "...", "created_at": "..." }`
- **Scénario** : À la création d'un patient → envoi email de bienvenue + création automatique d'un dossier médical vide.

### 2. `appointment.confirmed`
- **Producteur** : RendezVous Service
- **Consommateurs** : Notification Service, Payment Service
- **Payload** : `{ "id": "RDV-xxx", "patient_id": "...", "doctor_id": "...", "date": "...", "status": "confirmed" }`
- **Scénario** : RDV confirmé → notification SMS au patient + génération automatique d'une facture en attente.

... [continuer pour les 8 autres topics] ...

## Bonnes pratiques
- Tous les messages sont sérialisés en JSON UTF-8.
- La clé du message (`key`) est toujours l'ID de l'entité principale pour garantir l'ordre par partition.
- Les consommateurs gèrent les erreurs avec retry exponentiel.
- Les topics ont `replication-factor=1` en dev, à passer à 3 en production.