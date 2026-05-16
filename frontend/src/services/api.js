// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ===== PATIENTS =====
export const getPatients = () => api.get('/patients');
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);

// ===== DOCTORS =====
export const getDoctors = () => api.get('/doctors');
export const getDoctor = (id) => api.get(`/doctors/${id}`);
export const createDoctor = (data) => api.post('/doctors', data);
export const updateDoctor = (id, data) => api.put(`/doctors/${id}`, data);
export const deleteDoctor = (id) => api.delete(`/doctors/${id}`);

// ===== APPOINTMENTS =====
export const getAppointments = () => api.get('/appointments');
export const getAppointment = (id) => api.get(`/appointments/${id}`);
export const createAppointment = (data) => api.post('/appointments', data);
export const cancelAppointment = (id, reason) => api.put(`/appointments/${id}/cancel`, { reason });

// ===== MEDICAL RECORDS =====
export const getMedicalRecords = (patientId) => 
  patientId ? api.get(`/records/patient/${patientId}`) : api.get('/records');
export const getMedicalRecord = (id) => api.get(`/records/${id}`);
export const createMedicalRecord = (data) => api.post('/records', data);
export const updateAllergies = (id, allergies) => api.put(`/records/${id}/allergies`, { allergies });

// ===== INVOICES =====
export const getInvoices = (patientId) => 
  patientId ? api.get(`/invoices/patient/${patientId}`) : api.get('/invoices');
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const processPayment = (invoiceId, method) => api.post(`/payments/${invoiceId}`, { method });

// ===== MEDICATIONS (Inventory) =====
export const getMedications = () => api.get('/medications');
export const getMedication = (id) => api.get(`/medications/${id}`);
export const createMedication = (data) => api.post('/medications', data);
export const updateStock = (id, quantityChange) => api.put(`/medications/${id}/stock`, { quantity_change: quantityChange });
export const reserveMedication = (id, quantity) => api.post(`/medications/${id}/reserve`, { quantity });
export const getLowStockMeds = () => api.get('/medications/low-stock');

// ===== LAB TESTS =====
export const getLabTests = (patientId) => 
  patientId ? api.get(`/lab-tests/patient/${patientId}`) : api.get('/lab-tests');
export const getLabTest = (id) => api.get(`/lab-tests/${id}`);
export const createLabTest = (data) => api.post('/lab-tests', data);
export const addTestResult = (id, data, abnormal) => api.put(`/lab-tests/${id}/result`, { data, abnormal });

// ===== NOTIFICATIONS =====
export const getNotifications = (userId) => api.get(`/notifications/user/${userId}`);
export const sendEmail = (data) => api.post('/notifications/email', data);
export const sendSMS = (data) => api.post('/notifications/sms', data);

// ===== ALERTS =====
export const getAlerts = () => api.get('/alerts');
export const getAlert = (id) => api.get(`/alerts/${id}`);
export const triggerAlert = (data) => api.post('/alerts', data);
export const acknowledgeAlert = (id, notes) => api.put(`/alerts/${id}/acknowledge`, { notes });

export default api;