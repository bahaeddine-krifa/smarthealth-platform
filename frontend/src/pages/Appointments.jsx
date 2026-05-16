import { useEffect, useState } from 'react';
import { getAppointments, createAppointment, cancelAppointment } from '../services/api';
import FormModal from '../components/FormModal';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '', patient_name: '', doctor_name: '',
    appointment_date: '', appointment_time: '', reason: ''
  });

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      const res = await getAppointments();
      setAppointments(res.data);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAppointment(formData);
      setIsModalOpen(false);
      setFormData({ patient_id: '', patient_name: '', doctor_name: '', appointment_date: '', appointment_time: '', reason: '' });
      loadAppointments();
    } catch (err) { alert('Erreur: ' + err.message); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    try {
      await cancelAppointment(id, 'Annulé par le patient');
      loadAppointments();
    } catch (err) { alert(err.message); }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-error', completed: 'badge-info' };
    return map[status?.toLowerCase()] || 'badge-ghost';
  };

  if (loading) return <progress className="progress w-56"></progress>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Rendez-vous</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Nouveau RDV</button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead><tr><th>ID</th><th>Patient</th><th>Médecin</th><th>Date</th><th>Heure</th><th>Motif</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id}>
                <td className="font-mono text-xs">{a.id}</td>
                <td>{a.patient_name}</td><td>{a.doctor_name}</td>
                <td>{a.appointment_date}</td><td>{a.appointment_time}</td><td>{a.reason || '-'}</td>
                <td><span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span></td>
                <td>
                  {a.status !== 'cancelled' && (
                    <button className="btn btn-sm btn-error" onClick={() => handleCancel(a.id)}> Annuler</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Rendez-vous" onSubmit={handleSubmit}>
        <input type="text" placeholder="ID Patient" className="input input-bordered w-full" required
          value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})} />
        <input type="text" placeholder="Nom Patient" className="input input-bordered w-full" required
          value={formData.patient_name} onChange={e => setFormData({...formData, patient_name: e.target.value})} />
        <input type="text" placeholder="Nom Médecin" className="input input-bordered w-full" required
          value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})} />
        <input type="date" className="input input-bordered w-full" required
          value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})} />
        <input type="time" className="input input-bordered w-full" required
          value={formData.appointment_time} onChange={e => setFormData({...formData, appointment_time: e.target.value})} />
        <textarea placeholder="Motif de consultation" className="textarea textarea-bordered w-full"
          value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
        <button type="submit" className="btn btn-primary w-full">Réserver</button>
      </FormModal>
    </div>
  );
}