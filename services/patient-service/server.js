// services/patient-service/server.js
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'patient.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const patientProto = grpc.loadPackageDefinition(packageDefinition).patient;

// Mock DB temporaire (sera remplacé par SQLite à l'étape 4)
const patients = [];

const patientService = {
  CreatePatient: (call, callback) => {
    try {
      const { name, email, phone, date_of_birth, medical_record_number } = call.request;
      const exists = patients.find(p => p.email === email);
      if (exists) return callback({ code: grpc.status.ALREADY_EXISTS, details: 'Email déjà utilisé' }, null);

      const newPatient = {
        id: `PAT-${Date.now()}`, name, email, phone, date_of_birth, medical_record_number,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      patients.push(newPatient);
      callback(null, { success: true, message: 'Patient créé avec succès', patient: newPatient });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message }, null);
    }
  },
  GetPatient: (call, callback) => {
    try {
      const patient = patients.find(p => p.id === call.request.id);
      if (!patient) return callback({ code: grpc.status.NOT_FOUND, details: 'Patient non trouvé' }, null);
      callback(null, { success: true, message: 'OK', patient });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message }, null);
    }
  },
  ListPatients: (call, callback) => {
    try { callback(null, { success: true, patients }); } 
    catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  UpdatePatient: (call, callback) => {
    try {
      const idx = patients.findIndex(p => p.id === call.request.id);
      if (idx === -1) return callback({ code: grpc.status.NOT_FOUND, details: 'Patient non trouvé' }, null);
      const updated = { ...patients[idx], ...call.request, updated_at: new Date().toISOString() };
      patients[idx] = updated;
      callback(null, { success: true, message: 'Patient mis à jour', patient: updated });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message }, null);
    }
  },
  DeletePatient: (call, callback) => {
    try {
      const idx = patients.findIndex(p => p.id === call.request.id);
      if (idx === -1) return callback({ code: grpc.status.NOT_FOUND, details: 'Patient non trouvé' }, null);
      patients.splice(idx, 1);
      callback(null, { success: true, message: 'Patient supprimé' });
    } catch (error) {
      callback({ code: grpc.status.INTERNAL, details: error.message }, null);
    }
  }
};

function main() {
  const server = new grpc.Server();
  server.addService(patientProto.PatientService.service, patientService);
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('Erreur Patient Service:', err); return; }
    console.log(`✅ Patient Service gRPC démarré sur le port ${port}`);
  });
}
main();