import { useEffect, useState } from 'react';
import { 
  getPatients, createPatient, updatePatient, deletePatient 
} from '../services/api';
import FormModal from '../components/FormModal';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', date_of_birth: '', medical_record_number: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await getPatients();
      setPatients(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, formData);
      } else {
        await createPatient(formData);
      }
      setIsModalOpen(false);
      setEditingPatient(null);
      setFormData({ name: '', email: '', phone: '', date_of_birth: '', medical_record_number: '' });
      loadPatients();
    } catch (err) {
      alert('Erreur: ' + err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData(patient);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) return;
    try {
      await deletePatient(id);
      loadPatients();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleCreate = () => {
    setEditingPatient(null);
    setFormData({ name: '', email: '', phone: '', date_of_birth: '', medical_record_number: '' });
    setIsModalOpen(true);
  };

  if (loading) return <progress className="progress w-56"></progress>;
  if (error) return <div className="alert alert-error">Erreur: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">👥 Patients</h2>
        <button className="btn btn-primary" onClick={handleCreate}>+ Nouveau Patient</button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>ID</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Date Naissance</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.id}</td>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.phone || '-'}</td>
                <td>{p.date_of_birth || '-'}</td>
                <td>
                  <button className="btn btn-sm btn-info mr-2" onClick={() => handleEdit(p)}>✏️</button>
                  <button className="btn btn-sm btn-error" onClick={() => handleDelete(p.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Modifier Patient' : 'Nouveau Patient'}
        onSubmit={handleSubmit}
      >
        <input type="text" placeholder="Nom complet" className="input input-bordered w-full" required
          value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input type="email" placeholder="Email" className="input input-bordered w-full" required
          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        <input type="tel" placeholder="Téléphone" className="input input-bordered w-full"
          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input type="date" placeholder="Date de naissance" className="input input-bordered w-full"
          value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} />
        <input type="text" placeholder="Numéro dossier médical" className="input input-bordered w-full"
          value={formData.medical_record_number} onChange={e => setFormData({...formData, medical_record_number: e.target.value})} />
        <button type="submit" className="btn btn-primary w-full">
          {editingPatient ? 'Mettre à jour' : 'Créer'}
        </button>
      </FormModal>
    </div>
  );
}