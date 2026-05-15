// api-gateway/grpc-clients.js
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Charge un service gRPC à partir de son fichier .proto
const loadProto = (protoFile, packageName) => {
  const PROTO_PATH = path.join(__dirname, '..', 'services', protoFile);
  const pkg = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  return grpc.loadPackageDefinition(pkg)[packageName];
};

// Chargement des 8 services proto
const PatientProto = loadProto('patient-service/patient.proto', 'patient');
const DoctorProto = loadProto('doctor-service/doctor.proto', 'doctor');
const RendezVousProto = loadProto('rendezvous-service/rendezvous.proto', 'rendezvous');
const MedicalRecordProto = loadProto('medical-record-service/medical_record.proto', 'medicalrecord');
const PaymentProto = loadProto('payment-service/payment.proto', 'payment');
const InventoryProto = loadProto('inventory-service/inventory.proto', 'inventory');
const LaboratoryProto = loadProto('laboratory-service/laboratory.proto', 'laboratory');
const NotificationProto = loadProto('notification-service/notification.proto', 'notification');
const AlertProto = loadProto('alert-service/alert.proto', 'alert');

// Export des clients gRPC instanciés (ports 50051 → 50059)
module.exports = {
  patientClient: new PatientProto.PatientService('localhost:50051', grpc.credentials.createInsecure()),
  doctorClient: new DoctorProto.DoctorService('localhost:50054', grpc.credentials.createInsecure()),
  rendezvousClient: new RendezVousProto.RendezVousService('localhost:50052', grpc.credentials.createInsecure()),
  medicalRecordClient: new MedicalRecordProto.MedicalRecordService('localhost:50056', grpc.credentials.createInsecure()),
  paymentClient: new PaymentProto.PaymentService('localhost:50055', grpc.credentials.createInsecure()),
  inventoryClient: new InventoryProto.InventoryService('localhost:50057', grpc.credentials.createInsecure()),
  laboratoryClient: new LaboratoryProto.LaboratoryService('localhost:50058', grpc.credentials.createInsecure()),
  notificationClient: new NotificationProto.NotificationService('localhost:50059', grpc.credentials.createInsecure()),
  alertClient: new AlertProto.AlertService('localhost:50053', grpc.credentials.createInsecure())
};