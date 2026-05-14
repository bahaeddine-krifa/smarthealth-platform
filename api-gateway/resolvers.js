// api-gateway/resolvers.js
'use strict';
const { patientClient, rdvClient, alertClient } = require('./grpc-clients');

// Helper pour transformer les callbacks gRPC en Promises
const toPromise = (client, methodName, request) => {
  return new Promise((resolve, reject) => {
    client[methodName](request, (err, res) => {
      if (err) {
        reject(new Error(err.details || err.message));
      } else {
        resolve(res); // Retourne la réponse gRPC complète
      }
    });
  });
};

module.exports = {
  Query: {
    patient: (_, { id }) => 
      toPromise(patientClient, 'GetPatient', { id }).then(r => r.patient),
    
    patients: () => 
      toPromise(patientClient, 'ListPatients', {}).then(r => r.patients),
    
    appointment: (_, { id }) => 
      toPromise(rdvClient, 'GetAppointment', { id }).then(r => r.appointment),
    
    appointments: () => 
      toPromise(rdvClient, 'ListAppointments', {}).then(r => r.appointments),
    
    alert: (_, { id }) => 
      toPromise(alertClient, 'GetAlert', { id }).then(r => r.alert),
    
    alerts: () => 
      toPromise(alertClient, 'ListAlerts', {}).then(r => r.alerts)
  },
  
  Mutation: {
    // Retourne la réponse complète { success, message, patient }
    createPatient: (_, { input }) => 
      toPromise(patientClient, 'CreatePatient', input),
    
    // Retourne la réponse complète { success, message, appointment }
    bookAppointment: (_, { input }) => 
      toPromise(rdvClient, 'BookAppointment', input),
    
    // Retourne la réponse complète { success, message, alert }
    triggerAlert: (_, { input }) => 
      toPromise(alertClient, 'TriggerAlert', input)
  }
};