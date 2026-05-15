// api-gateway/grpc-clients.js - Version Docker-compatible
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Helper : Résoudre l'hôte avec fallback Docker/Local
const resolveHost = (envVar, defaultHost) => 
  process.env[envVar] || defaultHost;

const loadProto = (protoFile, packageName) => {
  const PROTO_PATH = path.join(__dirname, '..', 'services', protoFile);
  const pkg = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
  });
  return grpc.loadPackageDefinition(pkg)[packageName];
};

module.exports = {
  patientClient: new loadProto('patient-service/patient.proto', 'patient')
    .PatientService(resolveHost('PATIENT_SERVICE_HOST', 'localhost:50051'), grpc.credentials.createInsecure()),
  
  doctorClient: new loadProto('doctor-service/doctor.proto', 'doctor')
    .DoctorService(resolveHost('DOCTOR_SERVICE_HOST', 'localhost:50054'), grpc.credentials.createInsecure()),
  
  rendezvousClient: new loadProto('rendezvous-service/rendezvous.proto', 'rendezvous')
    .RendezVousService(resolveHost('RENDEZVOUS_SERVICE_HOST', 'localhost:50052'), grpc.credentials.createInsecure()),
  
  medicalRecordClient: new loadProto('medical-record-service/medical_record.proto', 'medicalrecord')
    .MedicalRecordService(resolveHost('MEDICAL_RECORD_SERVICE_HOST', 'localhost:50056'), grpc.credentials.createInsecure()),
  
  paymentClient: new loadProto('payment-service/payment.proto', 'payment')
    .PaymentService(resolveHost('PAYMENT_SERVICE_HOST', 'localhost:50055'), grpc.credentials.createInsecure()),
  
  inventoryClient: new loadProto('inventory-service/inventory.proto', 'inventory')
    .InventoryService(resolveHost('INVENTORY_SERVICE_HOST', 'localhost:50057'), grpc.credentials.createInsecure()),
  
  laboratoryClient: new loadProto('laboratory-service/laboratory.proto', 'laboratory')
    .LaboratoryService(resolveHost('LABORATORY_SERVICE_HOST', 'localhost:50058'), grpc.credentials.createInsecure()),
  
  notificationClient: new loadProto('notification-service/notification.proto', 'notification')
    .NotificationService(resolveHost('NOTIFICATION_SERVICE_HOST', 'localhost:50059'), grpc.credentials.createInsecure()),
  
  alertClient: new loadProto('alert-service/alert.proto', 'alert')
    .AlertService(resolveHost('ALERT_SERVICE_HOST', 'localhost:50053'), grpc.credentials.createInsecure())
};