// api-gateway/grpc-clients.js
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Helper : Charge un fichier .proto et retourne le package gRPC
const loadProto = (protoFile, packageName) => {
  const PROTO_PATH = path.join(__dirname, '..', 'services', protoFile);
  const pkgDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  return grpc.loadPackageDefinition(pkgDef)[packageName];
};

// Helper : Résout l'hôte avec fallback Docker/Local
const resolveHost = (envVar, defaultHost) => 
  process.env[envVar] || defaultHost;

// Export des clients gRPC instanciés
module.exports = {
  // Patient Service (50051)
  patientClient: new (loadProto('patient-service/patient.proto', 'patient').PatientService)(
    resolveHost('PATIENT_SERVICE_HOST', 'localhost:50051'), 
    grpc.credentials.createInsecure()
  ),
  
  // Doctor Service (50054)
  doctorClient: new (loadProto('doctor-service/doctor.proto', 'doctor').DoctorService)(
    resolveHost('DOCTOR_SERVICE_HOST', 'localhost:50054'), 
    grpc.credentials.createInsecure()
  ),
  
  // RendezVous Service (50052)
  rendezvousClient: new (loadProto('rendezvous-service/rendezvous.proto', 'rendezvous').RendezVousService)(
    resolveHost('RENDEZVOUS_SERVICE_HOST', 'localhost:50052'), 
    grpc.credentials.createInsecure()
  ),
  
  // Medical Record Service (50056)
  medicalRecordClient: new (loadProto('medical-record-service/medical_record.proto', 'medicalrecord').MedicalRecordService)(
    resolveHost('MEDICAL_RECORD_SERVICE_HOST', 'localhost:50056'), 
    grpc.credentials.createInsecure()
  ),
  
  // Payment Service (50055)
  paymentClient: new (loadProto('payment-service/payment.proto', 'payment').PaymentService)(
    resolveHost('PAYMENT_SERVICE_HOST', 'localhost:50055'), 
    grpc.credentials.createInsecure()
  ),
  
  // Inventory Service (50057)
  inventoryClient: new (loadProto('inventory-service/inventory.proto', 'inventory').InventoryService)(
    resolveHost('INVENTORY_SERVICE_HOST', 'localhost:50057'), 
    grpc.credentials.createInsecure()
  ),
  
  // Laboratory Service (50058)
  laboratoryClient: new (loadProto('laboratory-service/laboratory.proto', 'laboratory').LaboratoryService)(
    resolveHost('LABORATORY_SERVICE_HOST', 'localhost:50058'), 
    grpc.credentials.createInsecure()
  ),
  
  // Notification Service (50059)
  notificationClient: new (loadProto('notification-service/notification.proto', 'notification').NotificationService)(
    resolveHost('NOTIFICATION_SERVICE_HOST', 'localhost:50059'), 
    grpc.credentials.createInsecure()
  ),
  
  // Alert Service (50053)
  alertClient: new (loadProto('alert-service/alert.proto', 'alert').AlertService)(
    resolveHost('ALERT_SERVICE_HOST', 'localhost:50053'), 
    grpc.credentials.createInsecure()
  )
};