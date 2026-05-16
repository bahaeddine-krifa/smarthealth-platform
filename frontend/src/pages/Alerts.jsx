import { useEffect, useState } from 'react';
import { getAlerts, acknowledgeAlert } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try { const res = await getAlerts(); setAlerts(res.data); setLoading(false); } catch { setLoading(false); }
  };

  const handleAcknowledge = async (id) => {
    try { await acknowledgeAlert(id, 'Pris en charge via l\'interface'); loadAlerts(); } catch (err) { alert(err.message); }
  };

  const getSeverityColor = (sev) => ({ low: 'text-info', medium: 'text-warning', high: 'text-error', critical: 'text-error font-bold' }[sev?.toLowerCase()] || 'text-base-content');

  if (loading) return <progress className="progress w-56"></progress>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🚨 Centre d'Alertes</h2>
        <span className="badge badge-lg badge-error">{alerts.filter(a => a.status !== 'acknowledged').length} actives</span>
      </div>

      <div className="grid gap-4">
        {alerts.map(a => (
          <div key={a.id} className={`card shadow-lg border-l-4 ${a.severity === 'critical' ? 'border-error bg-error/5' : a.severity === 'high' ? 'border-warning bg-warning/5' : 'border-info bg-base-100'}`}>
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-sm opacity-70">Patient: {a.patient_name} | Type: {a.alert_type}</p>
                </div>
                <span className={`font-semibold ${getSeverityColor(a.severity)}`}>{a.severity?.toUpperCase()}</span>
              </div>
              <p className="mt-2 text-sm">{a.description}</p>
              <div className="card-actions justify-end mt-2">
                {a.status !== 'acknowledged' ? (
                  <button className="btn btn-sm btn-primary" onClick={() => handleAcknowledge(a.id)}>✓ Accuser réception</button>
                ) : (
                  <span className="badge badge-success">Traitée</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}