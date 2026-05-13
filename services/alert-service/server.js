// services/alert-service/server.js
'use strict';
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'alert.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const alertProto = grpc.loadPackageDefinition(packageDefinition).alert;

const alerts = [];

const alertService = {
  TriggerAlert: (call, callback) => {
    try {
      const newAlert = {
        id: `ALT-${Date.now()}`, ...call.request, status: 'pending',
        triggered_at: new Date().toISOString(), resolved_at: null
      };
      alerts.push(newAlert);
      callback(null, { success: true, message: 'Alerte déclenchée', alert: newAlert });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  GetAlert: (call, callback) => {
    try {
      const alert = alerts.find(a => a.id === call.request.id);
      if (!alert) return callback({ code: grpc.status.NOT_FOUND, details: 'Alerte non trouvée' }, null);
      callback(null, { success: true, message: 'OK', alert });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  ListAlerts: (call, callback) => {
    try { callback(null, { success: true, alerts }); }
    catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  },
  AcknowledgeAlert: (call, callback) => {
    try {
      const idx = alerts.findIndex(a => a.id === call.request.id);
      if (idx === -1) return callback({ code: grpc.status.NOT_FOUND, details: 'Alerte non trouvée' }, null);
      alerts[idx].status = 'acknowledged';
      callback(null, { success: true, message: 'Alerte reconnue' });
    } catch (error) { callback({ code: grpc.status.INTERNAL, details: error.message }, null); }
  }
};

function main() {
  const server = new grpc.Server();
  server.addService(alertProto.AlertService.service, alertService);
  server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('Erreur Alert Service:', err); return; }
    console.log(`✅ Alert Service gRPC démarré sur le port ${port}`);
  });
}
main();