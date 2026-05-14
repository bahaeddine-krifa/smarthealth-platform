'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const dbPromise = require('./db');
require('dotenv').config();
const { connectProducer, publishAppointmentConfirmed } = require('./kafka');
// ... autres imports

const PROTO_PATH = path.join(__dirname, 'rendezvous.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const rdvProto = grpc.loadPackageDefinition(packageDefinition).rendezvous;

const rdvService = {
  BookAppointment: async (call, callback) => {
    try {
      const { rdv, persist, createId } = await dbPromise;
      const newRdv = { id: createId(), ...call.request, status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const inserted = await rdv.insert(newRdv);
      await persist(rdv);
      callback(null, { success: true, message: 'Rendez-vous réservé', appointment: inserted.toJSON() });
      // Publier l'événement Kafka après la réservation réussie
      publishAppointmentConfirmed(newRdv).catch(console.error);
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  GetAppointment: async (call, callback) => {
    try {
      const { rdv } = await dbPromise;
      const doc = await rdv.findOne(call.request.id).exec();
      if (!doc) return callback({ code: grpc.status.NOT_FOUND, details: 'RDV non trouvé' }, null);
      callback(null, { success: true, message: 'OK', appointment: doc.toJSON() });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  ListAppointments: async (call, callback) => {
    try {
      const { rdv } = await dbPromise;
      const docs = await rdv.find().exec();
      callback(null, { success: true, appointments: docs.map(d => d.toJSON()) });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  CancelAppointment: async (call, callback) => {
    try {
      const { rdv, persist } = await dbPromise;
      const doc = await rdv.findOne(call.request.id).exec();
      if (!doc) return callback({ code: grpc.status.NOT_FOUND, details: 'RDV non trouvé' }, null);
      await doc.patch({ status: 'cancelled', updated_at: new Date().toISOString() });
      await persist(rdv);
      callback(null, { success: true, message: 'RDV annulé' });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  }
};

function main() {
  await connectProducer();
  const server = new grpc.Server();
  server.addService(rdvProto.RendezVousService.service, rdvService);
  server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('Erreur RDV Service:', err); return; }
    console.log(`✅ RendezVous Service gRPC + RxDB démarré sur le port ${port}`);
  });
}
main();