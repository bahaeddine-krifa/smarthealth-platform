const { patientClient } = require('./grpc-clients');

patientClient.ListPatients({}, (err, response) => {
  if (err) {
    console.error('❌ Erreur gRPC:', err);
  } else {
    console.log('✅ Connexion gRPC OK:', response);
  }
  process.exit(0);
});