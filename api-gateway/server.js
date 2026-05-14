'use strict';
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs } = require('./typeDefs');
const resolvers = require('./resolvers');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Chargement du schéma
const fs = require('fs');
const path = require('path');
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8');

async function startGateway() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(cors());
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token })
  }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      gateway: `http://localhost:${PORT}`,
      services: { patient: '50051', rendezvous: '50052', alert: '50053' }
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 API Gateway démarrée sur http://localhost:${PORT}`);
    console.log(`📡 GraphQL Playground: http://localhost:${PORT}/graphql`);
  });
}

startGateway().catch(console.error);