// Schéma RxDB pour les rendez-vous
export const appointmentSchema = {
  title: 'appointment schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    patient_id: { type: 'string' },
    patient_name: { type: 'string' },
    doctor_name: { type: 'string' },
    appointment_date: { type: 'string' },
    appointment_time: { type: 'string' },
    reason: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
    created_at: { type: 'string' },
    updated_at: { type: 'string' }
  },
  required: ['id', 'patient_id', 'appointment_date', 'appointment_time', 'status'],
  indexes: ['patient_id', 'appointment_date', 'status']
};