## Topics Kafka
- `patient.created` : Produit par Patient Service → Consommé par Alert Service
- `appointment.confirmed` : Produit par RendezVous Service → Consommé par Alert Service
- `alert.triggered` : Produit par Alert Service → Consommé par Notification (futur)