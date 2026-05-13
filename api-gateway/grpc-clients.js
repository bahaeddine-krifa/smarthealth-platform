// api-gateway/grpc-clients.js
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const loadProto = (protoFile, packageName) => {
  const PROTO_PATH = path.join(__dirname, '..', 'services', protoFile);
  const pkg = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  return grpc.loadPackageDefinition(pkg)[packageName];
};

const PatientService = loadProto('patient-service/patient.proto', 'patient');
const RendezVousService = loadProto('rendezvous-service/rendezvous.proto', 'rendezvous');
const AlertService = loadProto('alert-service/alert.proto', 'alert');

module.exports = {
  patientClient: new PatientService.PatientService('localhost:50051', grpc.credentials.createInsecure()),
  rdvClient: new RendezVousService.RendezVousService('localhost:50052', grpc.credentials.createInsecure()),
  alertClient: new AlertService.AlertService('localhost:50053', grpc.credentials.createInsecure())
};