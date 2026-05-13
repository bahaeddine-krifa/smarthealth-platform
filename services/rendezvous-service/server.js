// services/rendezvous-service/server.js
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'rendezvous.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const rdvProto = grpc.loadPackageDefinition(packageDefinition).rendezvous;

const appointments = [];

const rdvService = {
  BookAppointment: (call, callback) => {
    try {
      const newRdv = {
        id: `RDV-${Date.now()}`, ...call.request, status: 'pending',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      appointments.push(newRdv);
      callback(null, { success: true, message: 'Rendez-vous réservé', appointment: newRdv });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  GetAppointment: (call, callback) => {
    try {
      const rdv = appointments.find(r => r.id === call.request.id);
      if (!rdv) return callback({ code: grpc.status.NOT_FOUND, details: 'RDV non trouvé' }, null);
      callback(null, { success: true, message: 'OK', appointment: rdv });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  ListAppointments: (call, callback) => {
    try { callback(null, { success: true, appointments }); }
    catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  CancelAppointment: (call, callback) => {
    try {
      const idx = appointments.findIndex(r => r.id === call.request.id);
      if (idx === -1) return callback({ code: grpc.status.NOT_FOUND, details: 'RDV non trouvé' }, null);
      appointments[idx].status = 'cancelled';
      callback(null, { success: true, message: 'RDV annulé' });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  }
};

function main() {
  const server = new grpc.Server();
  server.addService(rdvProto.RendezVousService.service, rdvService);
  server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('Erreur RendezVous Service:', err); return; }
    console.log(`✅ RendezVous Service gRPC démarré sur le port ${port}`);
  });
}
main();