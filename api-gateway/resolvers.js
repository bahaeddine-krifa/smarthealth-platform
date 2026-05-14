'use strict';
const { patientClient, rdvClient, alertClient } = require('./grpc-clients');

// Helper pour transformer les callbacks gRPC en Promises (requis par Apollo)
const toPromise = (clientMethod, request) => new Promise((resolve, reject) => {
  clientMethod.call(clientMethod, request, (err, res) => err ? reject(new Error(err.details)) : resolve(res));
});

module.exports = {
  Query: {
    patient: (_, { id }) => toPromise(patientClient.GetPatient, { id }).then(r => r.patient),
    patients: () => toPromise(patientClient.ListPatients, {}).then(r => r.patients),
    appointment: (_, { id }) => toPromise(rdvClient.GetAppointment, { id }).then(r => r.appointment),
    appointments: () => toPromise(rdvClient.ListAppointments, {}).then(r => r.appointments),
    alert: (_, { id }) => toPromise(alertClient.GetAlert, { id }).then(r => r.alert),
    alerts: () => toPromise(alertClient.ListAlerts, {}).then(r => r.alerts)
  },
  Mutation: {
    createPatient: (_, { input }) => toPromise(patientClient.CreatePatient, input).then(r => r.patient),
    bookAppointment: (_, { input }) => toPromise(rdvClient.BookAppointment, input).then(r => r.appointment),
    triggerAlert: (_, { input }) => toPromise(alertClient.TriggerAlert, input).then(r => r.alert)
  }
};