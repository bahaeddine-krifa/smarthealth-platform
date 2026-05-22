import { useEffect, useState } from 'react';
import { getPatients, getDoctors, getAppointments, getAlerts,getMedications } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, doctors: 0, appointments: 0, alerts: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPatients(), getDoctors(), getAppointments(), getAlerts(), getMedications()
    ]).then(([p, d, a, al, ls]) => {
      setStats({
        patients: p.data?.length || 0,
        doctors: d.data?.length || 0,
        appointments: a.data?.length || 0,
        alerts: al.data?.filter(x => x.status !== 'acknowledged').length || 0,
        lowStock: ls.data?.length || 0
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <progress className="progress w-56"></progress>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📊 Tableau de Bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card bg-primary text-primary-content shadow-lg"><div className="card-body"><h2 className="card-title">👥 Patients</h2><p className="text-4xl font-bold">{stats.patients}</p></div></div>
        <div className="card bg-secondary text-secondary-content shadow-lg"><div className="card-body"><h2 className="card-title">👨‍⚕️ Médecins</h2><p className="text-4xl font-bold">{stats.doctors}</p></div></div>
        <div className="card bg-accent text-accent-content shadow-lg"><div className="card-body"><h2 className="card-title">📅 RDV</h2><p className="text-4xl font-bold">{stats.appointments}</p></div></div>
        <div className="card bg-error text-error-content shadow-lg"><div className="card-body"><h2 className="card-title">🚨 Alertes</h2><p className="text-4xl font-bold">{stats.alerts}</p></div></div>
        <div className="card bg-warning text-warning-content shadow-lg"><div className="card-body"><h2 className="card-title">💊 Stock Faible</h2><p className="text-4xl font-bold">{stats.lowStock}</p></div></div>
      </div>
    </div>
  );
}