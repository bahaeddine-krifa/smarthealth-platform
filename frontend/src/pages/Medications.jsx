import { useEffect, useState } from 'react';
import { getMedications, createMedication, updateStock, reserveMedication } from '../services/api';
import FormModal from '../components/FormModal';

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', dosage: '', stock_quantity: 0, price: 0, supplier: '' });

  useEffect(() => { loadMeds(); }, []);

  const loadMeds = async () => {
    try { const res = await getMedications(); setMeds(res.data); setLoading(false); } catch { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMedication(formData);
      setIsModalOpen(false);
      setFormData({ name: '', dosage: '', stock_quantity: 0, price: 0, supplier: '' });
      loadMeds();
    } catch (err) { alert('Erreur: ' + err.message); }
  };

  const handleStockUpdate = async (id, qty) => {
    try { await updateStock(id, qty); loadMeds(); } catch (err) { alert(err.message); }
  };

  const handleReserve = async (id) => {
    try { await reserveMedication(id, 1); loadMeds(); } catch (err) { alert(err.message); }
  };

  if (loading) return <progress className="progress w-56"></progress>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">💊 Médicaments & Stock</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Ajouter Médicament</button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead><tr><th>ID</th><th>Nom</th><th>Dosage</th><th>Stock</th><th>Prix</th><th>Fournisseur</th><th>Actions</th></tr></thead>
          <tbody>
            {meds.map(m => (
              <tr key={m.id} className={m.is_low_stock ? 'bg-warning/10' : ''}>
                <td className="font-mono text-xs">{m.id}</td>
                <td>{m.name}</td><td>{m.dosage}</td>
                <td>
                  <span className={m.is_low_stock ? 'badge badge-error' : 'badge badge-success'}>{m.stock_quantity}</span>
                  {m.is_low_stock && <span className="ml-1 text-xs text-error">⚠️ Rupture proche</span>}
                </td>
                <td>{m.price} TND</td><td>{m.supplier || '-'}</td>
                <td>
                  <button className="btn btn-sm btn-secondary mr-1" onClick={() => handleStockUpdate(m.id, 10)}>+10 Stock</button>
                  <button className="btn btn-sm btn-info" onClick={() => handleReserve(m.id)}>📦 Réserver 1</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Médicament" onSubmit={handleSubmit}>
        <input type="text" placeholder="Nom" className="input input-bordered w-full" required
          value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input type="text" placeholder="Dosage (ex: 500mg)" className="input input-bordered w-full" required
          value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} />
        <input type="number" placeholder="Quantité initiale" className="input input-bordered w-full" required
          value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})} />
        <input type="number" step="0.01" placeholder="Prix unitaire" className="input input-bordered w-full" required
          value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
        <input type="text" placeholder="Fournisseur" className="input input-bordered w-full"
          value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
        <button type="submit" className="btn btn-primary w-full">Ajouter</button>
      </FormModal>
    </div>
  );
}