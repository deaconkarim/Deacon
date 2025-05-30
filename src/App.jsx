import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Dashboard } from '@/pages/dashboard';
import { People } from '@/pages/members';
import { Events } from '@/pages/events';
import { Groups } from '@/pages/groups';
import { Donations } from '@/pages/donations';
import { Reports } from '@/pages/reports';
import { Settings } from '@/pages/settings';
import { NotFound } from '@/pages/not-found';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="people" element={<People />} />
        <Route path="events" element={<Events />} />
        <Route path="groups" element={<Groups />} />
        <Route path="donations" element={<Donations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App; 