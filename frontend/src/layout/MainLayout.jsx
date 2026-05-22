import { Outlet, Link, useLocation } from 'react-router-dom';

export default function MainLayout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active bg-primary text-primary-content' : 'hover:bg-base-200';

  return (
    <div className="min-h-screen bg-base-100 flex">
      <aside className="w-64 bg-base-200 p-4 flex flex-col gap-2">
        <h1 className="text-xl font-bold mb-4">🏥 SmartHealth</h1>
        <Link to="/" className={`btn btn-ghost justify-start ${isActive('/')}`}>📊 Dashboard</Link>
        <Link to="/patients" className={`btn btn-ghost justify-start ${isActive('/patients')}`}>👥 Patients</Link>
        <Link to="/doctors" className={`btn btn-ghost justify-start ${isActive('/doctors')}`}>👨‍⚕️ Médecins</Link>
        <Link to="/appointments" className={`btn btn-ghost justify-start ${isActive('/appointments')}`}>📅 RDV</Link>
        <Link to="/records" className={`btn btn-ghost justify-start ${isActive('/records')}`}>📋 Dossiers</Link>
        <Link to="/medications" className={`btn btn-ghost justify-start ${isActive('/medications')}`}>💊 Médicaments</Link>
        <Link to="/alerts" className={`btn btn-ghost justify-start ${isActive('/alerts')}`}>🚨 Alertes</Link>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}