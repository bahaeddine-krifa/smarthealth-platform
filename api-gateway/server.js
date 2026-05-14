'use strict';

require('dotenv').config();

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');
const { typeDefs } = require('./typeDefs');
const resolvers = require('./resolvers');
const cors = require('cors');

const {
  patientClient,
  rdvClient,
  alertClient
} = require('./grpc-clients');

const app = express();
const PORT = process.env.PORT || 4000;

// =============================================================================
// 🔄 Helper gRPC -> Promise
// =============================================================================
const grpcCall = (client, methodName, request) => {

  return new Promise((resolve, reject) => {

    client[methodName](request, (err, response) => {

      if (err) {

        reject({
          code: err.code,
          message: err.details || err.message
        });

      } else {

        resolve(response);

      }

    });

  });

};

// =============================================================================
// 🚀 Start Gateway
// =============================================================================
async function startGateway() {

  // ===========================================================================
  // Apollo Server
  // ===========================================================================
  const server = new ApolloServer({
    typeDefs,
    resolvers
  });

  await server.start();

  // ===========================================================================
  // Middlewares
  // ===========================================================================
  app.use(cors());
  app.use(express.json());

  // ===========================================================================
  // GraphQL Endpoint
  // ===========================================================================
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({
        token: req.headers.token
      })
    })
  );

  // ===========================================================================
  // 🏥 PATIENTS API
  // ===========================================================================

  // Create Patient
  app.post('/api/patients', async (req, res) => {

    try {

      const resp = await grpcCall(
        patientClient,
        'CreatePatient',
        req.body
      );

      res.status(201).json(resp.patient);

    } catch (err) {

      const status =
        err.code === 6 ? 409 :
        err.code === 5 ? 404 : 500;

      res.status(status).json({
        error: err.message
      });

    }

  });

  // List Patients
  app.get('/api/patients', async (req, res) => {

    try {

      const resp = await grpcCall(
        patientClient,
        'ListPatients',
        {}
      );

      res.json(resp.patients);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  });

  // Get Patient By ID
  app.get('/api/patients/:id', async (req, res) => {

    try {

      const resp = await grpcCall(
        patientClient,
        'GetPatient',
        { id: req.params.id }
      );

      res.json(resp.patient);

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // Update Patient
  app.put('/api/patients/:id', async (req, res) => {

    try {

      const resp = await grpcCall(
        patientClient,
        'UpdatePatient',
        {
          id: req.params.id,
          ...req.body
        }
      );

      res.json(resp.patient);

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // Delete Patient
  app.delete('/api/patients/:id', async (req, res) => {

    try {

      const resp = await grpcCall(
        patientClient,
        'DeletePatient',
        { id: req.params.id }
      );

      res.json({
        success: true,
        message: resp.message
      });

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // ===========================================================================
  // 📅 APPOINTMENTS API
  // ===========================================================================

  // Create Appointment
  app.post('/api/appointments', async (req, res) => {

    try {

      const resp = await grpcCall(
        rdvClient,
        'BookAppointment',
        req.body
      );

      res.status(201).json(resp.appointment);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  });

  // List Appointments
  app.get('/api/appointments', async (req, res) => {

    try {

      const resp = await grpcCall(
        rdvClient,
        'ListAppointments',
        {}
      );

      res.json(resp.appointments);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  });

  // Get Appointment
  app.get('/api/appointments/:id', async (req, res) => {

    try {

      const resp = await grpcCall(
        rdvClient,
        'GetAppointment',
        { id: req.params.id }
      );

      res.json(resp.appointment);

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // Cancel Appointment
  app.put('/api/appointments/:id/cancel', async (req, res) => {

    try {

      const resp = await grpcCall(
        rdvClient,
        'CancelAppointment',
        {
          id: req.params.id,
          ...req.body
        }
      );

      res.json({
        success: true,
        message: resp.message
      });

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // ===========================================================================
  // 🚨 ALERTS API
  // ===========================================================================

  // Create Alert
  app.post('/api/alerts', async (req, res) => {

    try {

      const resp = await grpcCall(
        alertClient,
        'TriggerAlert',
        req.body
      );

      res.status(201).json(resp.alert);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  });

  // List Alerts
  app.get('/api/alerts', async (req, res) => {

    try {

      const resp = await grpcCall(
        alertClient,
        'ListAlerts',
        {}
      );

      res.json(resp.alerts);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  });

  // Get Alert
  app.get('/api/alerts/:id', async (req, res) => {

    try {

      const resp = await grpcCall(
        alertClient,
        'GetAlert',
        { id: req.params.id }
      );

      res.json(resp.alert);

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // Acknowledge Alert
  app.put('/api/alerts/:id/acknowledge', async (req, res) => {

    try {

      const resp = await grpcCall(
        alertClient,
        'AcknowledgeAlert',
        { id: req.params.id }
      );

      res.json({
        success: true,
        message: resp.message
      });

    } catch (err) {

      res.status(
        err.code === 5 ? 404 : 500
      ).json({
        error: err.message
      });

    }

  });

  // ===========================================================================
  // ❤️ Health Check
  // ===========================================================================
  app.get('/health', (req, res) => {

    res.json({
      status: 'OK',
      gateway: `http://localhost:${PORT}`,
      services: {
        patient: '50051',
        rendezvous: '50052',
        alert: '50053'
      },
      endpoints: {
        graphql: '/graphql',
        rest: {
          patients: '/api/patients',
          appointments: '/api/appointments',
          alerts: '/api/alerts'
        }
      }
    });

  });

  // ===========================================================================
  // Start Server
  // ===========================================================================
  app.listen(PORT, () => {

    console.log(`🚀 API Gateway démarrée sur http://localhost:${PORT}`);
    console.log(`📡 GraphQL Sandbox: http://localhost:${PORT}/graphql`);
    console.log(`🔗 REST API Base: http://localhost:${PORT}/api`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/health`);

  });

}

// =============================================================================
// Start Application
// =============================================================================
startGateway().catch(console.error);