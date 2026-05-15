// api-gateway/resolvers.js
'use strict';
const clients = require('./grpc-clients');

// Helper : Transforme les callbacks gRPC en Promises (requis par Apollo)
const toPromise = (client, methodName, request) => {
  return new Promise((resolve, reject) => {
    client[methodName](request, (err, res) => {
      if (err) reject(new Error(err.details || err.message));
      else resolve(res);
    });
  });
};

module.exports = {
  Query: {
    patient: (_, { id }) => toPromise(clients.patientClient, 'GetPatient', { id }).then(r => r.patient),
    patients: () => toPromise(clients.patientClient, 'ListPatients', {}).then(r => r.patients),
    doctor: (_, { id }) => toPromise(clients.doctorClient, 'GetDoctor', { id }).then(r => r.doctor),
    doctors: (_, { specialty }) => specialty 
      ? toPromise(clients.doctorClient, 'SearchDoctors', { specialty }).then(r => r.doctors)
      : toPromise(clients.doctorClient, 'ListDoctors', {}).then(r => r.doctors),
    appointment: (_, { id }) => toPromise(clients.rendezvousClient, 'GetAppointment', { id }).then(r => r.appointment),
    appointments: () => toPromise(clients.rendezvousClient, 'ListAppointments', {}).then(r => r.appointments),
    medicalRecord: (_, { id }) => toPromise(clients.medicalRecordClient, 'GetRecord', { id }).then(r => r.record),
    medicalRecords: (_, { patient_id }) => patient_id
      ? toPromise(clients.medicalRecordClient, 'GetPatientHistory', { patient_id }).then(r => r.records)
      : toPromise(clients.medicalRecordClient, 'ListRecords', {}).then(r => r.records),
    invoice: (_, { id }) => toPromise(clients.paymentClient, 'GetInvoice', { id }).then(r => r.invoice),
    invoices: (_, { patient_id }) => patient_id
      ? toPromise(clients.paymentClient, 'GetPatientInvoices', { patient_id }).then(r => r.invoices)
      : toPromise(clients.paymentClient, 'ListInvoices', {}).then(r => r.invoices),
    medication: (_, { id }) => toPromise(clients.inventoryClient, 'GetMedication', { id }).then(r => r.medication),
    medications: (_, { low_stock }) => low_stock
      ? toPromise(clients.inventoryClient, 'GetLowStockMedications', {}).then(r => r.medications)
      : toPromise(clients.inventoryClient, 'ListMedications', {}).then(r => r.medications || []),
    labTest: (_, { id }) => toPromise(clients.laboratoryClient, 'GetTest', { id }).then(r => r.test),
    labTests: (_, { patient_id }) => patient_id
      ? toPromise(clients.laboratoryClient, 'GetTestResults', { patient_id }).then(r => r.tests)
      : toPromise(clients.laboratoryClient, 'ListTests', {}).then(r => r.tests),
    notification: (_, { id }) => toPromise(clients.notificationClient, 'GetNotification', { id }).then(r => r.notification),
    notifications: (_, { user_id }) => user_id
      ? toPromise(clients.notificationClient, 'GetHistory', { user_id }).then(r => r.notifications)
      : toPromise(clients.notificationClient, 'ListNotifications', {}).then(r => r.notifications),
    alert: (_, { id }) => toPromise(clients.alertClient, 'GetAlert', { id }).then(r => r.alert),
    alerts: () => toPromise(clients.alertClient, 'ListAlerts', {}).then(r => r.alerts)
  },

  Mutation: {
    createPatient: (_, { input }) => toPromise(clients.patientClient, 'CreatePatient', input).then(r => r.patient),
    createDoctor: (_, { input }) => toPromise(clients.doctorClient, 'CreateDoctor', input).then(r => r.doctor),
    bookAppointment: (_, { input }) => toPromise(clients.rendezvousClient, 'BookAppointment', input).then(r => r.appointment),
    createMedicalRecord: (_, { input }) => toPromise(clients.medicalRecordClient, 'CreateRecord', input).then(r => r.record),
    createInvoice: (_, { input }) => toPromise(clients.paymentClient, 'CreateInvoice', input).then(r => r.invoice),
    processPayment: (_, { invoice_id, method }) => toPromise(clients.paymentClient, 'ProcessPayment', { invoice_id, payment_method: method }).then(r => r.transaction_id),
    addMedication: (_, { input }) => toPromise(clients.inventoryClient, 'AddMedication', input).then(r => r.medication),
    reserveMedication: (_, { id, quantity }) => toPromise(clients.inventoryClient, 'ReserveMedication', { medication_id: id, quantity }).then(r => r.message),
    createLabTest: (_, { input }) => toPromise(clients.laboratoryClient, 'CreateTest', input).then(r => r.test),
    addTestResult: (_, { test_id, data, abnormal }) => toPromise(clients.laboratoryClient, 'AddTestResult', { test_id, result_data: data, is_abnormal: abnormal }).then(r => r.test),
    sendNotification: (_, { input }) => toPromise(clients.notificationClient, 'SendEmail', input).then(r => r.notification),
    triggerAlert: (_, { input }) => toPromise(clients.alertClient, 'TriggerAlert', input).then(r => r.alert)
  }
};