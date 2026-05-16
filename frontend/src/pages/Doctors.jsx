import { useEffect, useState } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../services/api';
import FormModal from '../components/FormModal';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '', specialty: '', email: '', phone: '', cabinet_location: ''
  });

  useEffect(() => { loadDoctors(); }, []);

  const loadDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, formData);
      } else {
        await createDoctor(formData);
      }
      setIsModalOpen(false);
      setEditingDoctor(null);
      setFormData({ name: '', specialty: '', email: '', phone: '', cabinet_location: '' });
      loadDoctors();
    } catch (err) { alert('Erreur: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try { await deleteDoctor(id); loadDoctors(); } catch (err) { alert(err.message); }
  };

  if (loading) return <progress className="progress w-56"></progress>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">👨‍⚕️ Médecins</h2>
        <button className="btn btn-primary" onClick={() => { setEditingDoctor(null); setFormData({ name: '', specialty: '', email: '', phone: '', cabinet_location: '' }); setIsModalOpen(true); }}>
          + Nouveau Médecin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map(d => (
          <div key={d.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">{d.name}</h3>
              <p className="badge badge-secondary">{d.specialty}</p>
              <p>📧 {d.email}</p>
              <p>📞 {d.phone || '-'}</p>
              <p>📍 {d.cabinet_location || '-'}</p>
              <div className="card-actions justify-end mt-2">
                <button className="btn btn-sm btn-info" onClick={() => { setEditingDoctor(d); setFormData(d); setIsModalOpen(true); }}>✏️</button>
                <button className="btn btn-sm btn-error" onClick={() => handleDelete(d.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        title={editingDoctor ? 'Modifier Médecin' : 'Nouveau Médecin'} onSubmit={handleSubmit}>
        <input type="text" placeholder="Nom" className="input input-bordered w-full" required
          value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input type="text" placeholder="Spécialité" className="input input-bordered w-full" required
          value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
        <input type="email" placeholder="Email" className="input input-bordered w-full" required
          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        <input type="tel" placeholder="Téléphone" className="input input-bordered w-full"
          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input type="text" placeholder="Localisation cabinet" className="input input-bordered w-full"
          value={formData.cabinet_location} onChange={e => setFormData({...formData, cabinet_location: e.target.value})} />
        <button type="submit" className="btn btn-primary w-full">{editingDoctor ? 'Mettre à jour' : 'Créer'}</button>
      </FormModal>
    </div>
  );
}