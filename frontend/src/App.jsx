import { Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Medications from './pages/Medications';
import Alerts from './pages/Alerts';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="records" element={<MedicalRecords />} />
        <Route path="medications" element={<Medications />} />
        <Route path="alerts" element={<Alerts />} />
      </Route>
    </Routes>
  );
}