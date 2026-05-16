import { useEffect, useState } from 'react';
import { getMedicalRecords, createMedicalRecord, updateAllergies } from '../services/api';
import FormModal from '../components/FormModal';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [allergies, setAllergies] = useState('');
  const [formData, setFormData] = useState({ patient_id: '', doctor_id: '', diagnosis: '', prescriptions: '', allergies: '' });

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    try { const res = await getMedicalRecords(); setRecords(res.data); setLoading(false); } catch { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMedicalRecord(formData);
      setIsModalOpen(false);
      setFormData({ patient_id: '', doctor_id: '', diagnosis: '', prescriptions: '', allergies: '' });
      loadRecords();
    } catch (err) { alert('Erreur: ' + err.message); }
  };

  const handleUpdateAllergies = async () => {
    if (!selectedRecord) return;
    try {
      await updateAllergies(selectedRecord.id, allergies);
      setIsAllergyModalOpen(false);
      loadRecords();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <progress className="progress w-56"></progress>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📋 Dossiers Médicaux</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Nouveau Dossier</button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead><tr><th>ID</th><th>Patient</th><th>Médecin</th><th>Diagnostic</th><th>Allergies</th><th>Actions</th></tr></thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.id}</td>
                <td>{r.patient_id}</td><td>{r.doctor_id}</td>
                <td>{r.diagnosis}</td><td className="max-w-xs truncate">{r.allergies || 'Aucune'}</td>
                <td>
                  <button className="btn btn-sm btn-warning" onClick={() => { setSelectedRecord(r); setAllergies(r.allergies || ''); setIsAllergyModalOpen(true); }}>🔄 Allergies</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Dossier Médical" onSubmit={handleSubmit}>
        <input type="text" placeholder="ID Patient" className="input input-bordered w-full" required
          value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})} />
        <input type="text" placeholder="ID Médecin" className="input input-bordered w-full" required
          value={formData.doctor_id} onChange={e => setFormData({...formData, doctor_id: e.target.value})} />
        <textarea placeholder="Diagnostic" className="textarea textarea-bordered w-full" required
          value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})}></textarea>
        <textarea placeholder="Prescriptions" className="textarea textarea-bordered w-full"
          value={formData.prescriptions} onChange={e => setFormData({...formData, prescriptions: e.target.value})}></textarea>
        <textarea placeholder="Allergies connues" className="textarea textarea-bordered w-full"
          value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})}></textarea>
        <button type="submit" className="btn btn-primary w-full">Créer</button>
      </FormModal>

      <FormModal isOpen={isAllergyModalOpen} onClose={() => setIsAllergyModalOpen(false)} title="Mettre à jour les Allergies" onSubmit={handleUpdateAllergies}>
        <textarea placeholder="Liste des allergies (ex: Pénicilline, Ibuprofène)" className="textarea textarea-bordered w-full" rows="3"
          value={allergies} onChange={e => setAllergies(e.target.value)}></textarea>
        <button type="submit" className="btn btn-warning w-full">Enregistrer</button>
      </FormModal>
    </div>
  );
}