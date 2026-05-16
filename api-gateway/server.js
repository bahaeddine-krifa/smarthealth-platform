'use strict';
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');
const cors = require('cors');
const { typeDefs } = require('./typeDefs');
const resolvers = require('./resolvers');
const clients = require('./grpc-clients');

const app = express();
const PORT = process.env.PORT || 4000;

// =============================================================================
// 🔄 Helper : gRPC callback → Promise + Mapping erreurs standard REST
// =============================================================================
const grpcCall = (client, methodName, request) => {
  return new Promise((resolve, reject) => {
    client[methodName](request, (err, response) => {
      if (err) reject({ code: err.code, message: err.details || err.message });
      else resolve(response);
    });
  });
};

const handleRestError = (err, res) => {
  const status = err.code === 5 ? 404 : err.code === 6 ? 409 : err.code === 3 ? 400 : 500;
  res.status(status).json({ error: err.message });
};

// =============================================================================
//  Démarrage de la Gateway
// =============================================================================
async function startGateway() {
  // Apollo Server (GraphQL)
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  // Middlewares Express
  app.use(cors());
  app.use(express.json());

  // Endpoint GraphQL
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token })
  }));

  // ===========================================================================
  // 🏥 PATIENTS (50051)
  // ===========================================================================
  app.post('/api/patients', async (req, res) => { try { res.status(201).json((await grpcCall(clients.patientClient, 'CreatePatient', req.body)).patient); } catch(e) { handleRestError(e, res); } });
  app.get('/api/patients', async (req, res) => { try { res.json((await grpcCall(clients.patientClient, 'ListPatients', {})).patients); } catch(e) { handleRestError(e, res); } });
  app.get('/api/patients/:id', async (req, res) => { try { res.json((await grpcCall(clients.patientClient, 'GetPatient', { id: req.params.id })).patient); } catch(e) { handleRestError(e, res); } });
  app.put('/api/patients/:id', async (req, res) => { try { res.json((await grpcCall(clients.patientClient, 'UpdatePatient', { id: req.params.id, ...req.body })).patient); } catch(e) { handleRestError(e, res); } });
  app.delete('/api/patients/:id', async (req, res) => { try { await grpcCall(clients.patientClient, 'DeletePatient', { id: req.params.id }); res.json({ success: true }); } catch(e) { handleRestError(e, res); } });

  // ===========================================================================
  // 👨‍⚕️ DOCTORS (50054)
  // ===========================================================================
  app.post('/api/doctors', async (req, res) => { try { res.status(201).json((await grpcCall(clients.doctorClient, 'CreateDoctor', req.body)).doctor); } catch(e) { handleRestError(e, res); } });
  app.get('/api/doctors', async (req, res) => { try { res.json((await grpcCall(clients.doctorClient, 'ListDoctors', {})).doctors); } catch(e) { handleRestError(e, res); } });
  app.get('/api/doctors/:id', async (req, res) => { try { res.json((await grpcCall(clients.doctorClient, 'GetDoctor', { id: req.params.id })).doctor); } catch(e) { handleRestError(e, res); } });
  app.put('/api/doctors/:id/availability', async (req, res) => { try { await grpcCall(clients.doctorClient, 'UpdateAvailability', { id: req.params.id, ...req.body }); res.json({ success: true }); } catch(e) { handleRestError(e, res); } });

  // ===========================================================================
  // 📅 APPOINTMENTS (50052)
  // ===========================================================================
  app.post('/api/appointments', async (req, res) => { try { res.status(201).json((await grpcCall(clients.rendezvousClient, 'BookAppointment', req.body)).appointment); } catch(e) { handleRestError(e, res); } });
  app.get('/api/appointments', async (req, res) => { try { res.json((await grpcCall(clients.rendezvousClient, 'ListAppointments', {})).appointments); } catch(e) { handleRestError(e, res); } });
  app.get('/api/appointments/:id', async (req, res) => { try { res.json((await grpcCall(clients.rendezvousClient, 'GetAppointment', { id: req.params.id })).appointment); } catch(e) { handleRestError(e, res); } });
  app.put('/api/appointments/:id/cancel', async (req, res) => { try { await grpcCall(clients.rendezvousClient, 'CancelAppointment', { id: req.params.id, ...req.body }); res.json({ success: true }); } catch(e) { handleRestError(e, res); } });

  // ===========================================================================
  // 📋 MEDICAL RECORDS (50056)
  // ===========================================================================
  app.post('/api/records', async (req, res) => { try { res.status(201).json((await grpcCall(clients.medicalRecordClient, 'CreateRecord', req.body)).record); } catch(e) { handleRestError(e, res); } });
  app.get('/api/records/:id', async (req, res) => { try { res.json((await grpcCall(clients.medicalRecordClient, 'GetRecord', { id: req.params.id })).record); } catch(e) { handleRestError(e, res); } });
  app.get('/api/records/patient/:patient_id', async (req, res) => { try { res.json((await grpcCall(clients.medicalRecordClient, 'GetPatientHistory', { patient_id: req.params.patient_id })).records); } catch(e) { handleRestError(e, res); } });
  app.put('/api/records/:id/allergies', async (req, res) => { try { await grpcCall(clients.medicalRecordClient, 'UpdateAllergies', { record_id: req.params.id, ...req.body }); res.json({ success: true }); } catch(e) { handleRestError(e, res); } });

  // ===========================================================================
  // 💰 PAYMENTS & INVOICES (50055)
  // ===========================================================================
  app.post('/api/invoices', async (req, res) => { try { res.status(201).json((await grpcCall(clients.paymentClient, 'CreateInvoice', req.body)).invoice); } catch(e) { handleRestError(e, res); } });
  app.get('/api/invoices/:id', async (req, res) => { try { res.json((await grpcCall(clients.paymentClient, 'GetInvoice', { id: req.params.id })).invoice); } catch(e) { handleRestError(e, res); } });
  app.get('/api/invoices/patient/:patient_id', async (req, res) => { try { res.json((await grpcCall(clients.paymentClient, 'GetPatientInvoices', { patient_id: req.params.patient_id })).invoices); } catch(e) { handleRestError(e, res); } });
  app.post('/api/payments/:invoice_id', async (req, res) => { try { const resp = await grpcCall(clients.paymentClient, 'ProcessPayment', { invoice_id: req.params.invoice_id, payment_method: req.body.method || 'card' }); res.json({ success: true, transaction_id: resp.transaction_id }); } catch(e) { handleRestError(e, res); } });

  // ===========================================================================
  // 💊 INVENTORY / MEDICATIONS (50057)
  // ===========================================================================
  // 1. Routes SPÉCIFIQUES d'abord (avant les routes avec :id)
  app.get('/api/medications/low-stock', async (req, res) => {
    try {
      const response = await grpcCall(clients.inventoryClient, 'GetLowStockMedications', {});
      if (!response || !response.medications) return res.json([]);
      res.json(response.medications);
    } catch(e) { handleRestError(e, res); }
  });
  
  app.put('/api/medications/:id/stock', async (req, res) => {
    try {
      await grpcCall(clients.inventoryClient, 'UpdateStock', { id: req.params.id, quantity_change: req.body.quantity_change });
      res.json({ success: true });
    } catch(e) { handleRestError(e, res); }
  });
  
  app.post('/api/medications/:id/reserve', async (req, res) => {
    try {
      await grpcCall(clients.inventoryClient, 'ReserveMedication', { medication_id: req.params.id, quantity: req.body.quantity || 1 });
      res.json({ success: true });
    } catch(e) { handleRestError(e, res); }
  });
  
  // 2. Route paramétrée ENSUITE
  app.get('/api/medications/:id', async (req, res) => {
    try {
      res.json((await grpcCall(clients.inventoryClient, 'GetMedication', { id: req.params.id })).medication);
    } catch(e) { handleRestError(e, res); }
  });
  
  // 3. Route liste en dernier (ou avant la paramétrée si pas de conflit)
  app.get('/api/medications', async (req, res) => {
    try {
      const response = await grpcCall(clients.inventoryClient, 'ListMedications', {});
      res.json(response.medications);
    } catch(e) { handleRestError(e, res); }
  });
  
  app.post('/api/medications', async (req, res) => {
    try {
      res.status(201).json((await grpcCall(clients.inventoryClient, 'AddMedication', req.body)).medication);
    } catch(e) { handleRestError(e, res); }
  });

  // ===========================================================================
  //  LABORATORY TESTS (50058)
  // ===========================================================================
  // 1. Route pour lister TOUS les tests (NOUVEAU - à placer AVANT /:id)
  app.get('/api/lab-tests', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.laboratoryClient, 'ListTests', {});
      res.json(response.tests); 
    } catch(e) { 
      handleRestError(e, res); 
    } 
  });
  
  // 2. Route paramétrée (déjà existante - doit rester APRÈS la route liste)
  app.get('/api/lab-tests/:id', async (req, res) => { 
    try { 
      res.json((await grpcCall(clients.laboratoryClient, 'GetTest', { id: req.params.id })).test); 
    } catch(e) { 
      handleRestError(e, res); 
    } 
  });
  
  // 3. Autres routes existantes...
  app.post('/api/lab-tests', async (req, res) => { 
    try { 
      res.status(201).json((await grpcCall(clients.laboratoryClient, 'CreateTest', req.body)).test); 
    } catch(e) { 
      handleRestError(e, res); 
    } 
  });
  
  app.get('/api/lab-tests/patient/:patient_id', async (req, res) => { 
    try { 
      res.json((await grpcCall(clients.laboratoryClient, 'GetTestResults', { patient_id: req.params.patient_id })).tests); 
    } catch(e) { 
      handleRestError(e, res); 
    } 
  });
  
  app.put('/api/lab-tests/:id/result', async (req, res) => { 
    try { 
      const resp = await grpcCall(clients.laboratoryClient, 'AddTestResult', { 
        test_id: req.params.id, 
        result_data: req.body.data, 
        is_abnormal: req.body.abnormal || false 
      }); 
      res.json(resp.test); 
    } catch(e) { 
      handleRestError(e, res); 
    } 
  });
  // ===========================================================================
  // 🔔 NOTIFICATIONS (50059)
  // ===========================================================================
  // 1. Routes SPÉCIFIQUES d'abord (avant les routes avec :id)
  app.post('/api/notifications/email', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.notificationClient, 'SendEmail', req.body);
      res.status(201).json(response); 
    } catch(e) { handleRestError(e, res); } 
  });
  
  app.post('/api/notifications/sms', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.notificationClient, 'SendSMS', req.body);
      res.status(201).json(response); 
    } catch(e) { handleRestError(e, res); } 
  });
  
  app.post('/api/notifications/push', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.notificationClient, 'SendPush', req.body);
      res.status(201).json(response); 
    } catch(e) { handleRestError(e, res); } 
  });
  
  // 2. Route pour lister les notifications d'un utilisateur spécifique
  app.get('/api/notifications/user/:user_id', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.notificationClient, 'GetHistory', { user_id: req.params.user_id });
      res.json(response.notifications); 
    } catch(e) { handleRestError(e, res); } 
  });
  
  // 3. Route pour lister TOUTES les notifications (NOUVEAU)
  app.get('/api/notifications', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.notificationClient, 'ListNotifications', {});
      res.json(response.notifications); 
    } catch(e) { handleRestError(e, res); } 
  });
  
  // 4. Route paramétrée (DOIT ÊTRE EN DERNIER pour ne pas capturer les routes spécifiques)
  app.get('/api/notifications/:id', async (req, res) => { 
    try { 
      const response = await grpcCall(clients.notificationClient, 'GetNotification', { id: req.params.id });
      res.json(response.notification); 
    } catch(e) { handleRestError(e, res); } 
  });
  
  // ===========================================================================
  // 🚨 ALERTS (50053)
  // ===========================================================================
  app.post('/api/alerts', async (req, res) => { try { res.status(201).json((await grpcCall(clients.alertClient, 'TriggerAlert', req.body)).alert); } catch(e) { handleRestError(e, res); } });
  app.get('/api/alerts', async (req, res) => { try { res.json((await grpcCall(clients.alertClient, 'ListAlerts', {})).alerts); } catch(e) { handleRestError(e, res); } });
  app.get('/api/alerts/:id', async (req, res) => { try { res.json((await grpcCall(clients.alertClient, 'GetAlert', { id: req.params.id })).alert); } catch(e) { handleRestError(e, res); } });
  app.put('/api/alerts/:id/acknowledge', async (req, res) => { try { await grpcCall(clients.alertClient, 'AcknowledgeAlert', { id: req.params.id }); res.json({ success: true }); } catch(e) { handleRestError(e, res); } });

  // ===========================================================================
  // ❤️ Health Check Endpoint
  // ===========================================================================
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      gateway: `http://localhost:${PORT}`,
      services: {
        patient: 50051, doctor: 50054, rendezvous: 50052, medicalrecord: 50056,
        payment: 50055, inventory: 50057, laboratory: 50058, notification: 50059, alert: 50053
      },
      interfaces: { graphql: '/graphql', rest: '/api/*' }
    });
  });

  // ===========================================================================
  // 🎧 Démarrage du serveur
  // ===========================================================================
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway démarrée sur http://localhost:${PORT}`);
    console.log(` GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`🔗 REST Base: http://localhost:${PORT}/api`);
    console.log(`❤️ Health: http://localhost:${PORT}/health`);
  });
}

// Start Application
startGateway().catch(console.error);