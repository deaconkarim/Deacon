import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { Layout } from './components/layout';
import { Dashboard } from './pages/dashboard';
import { People } from './pages/members';
import { MemberProfile } from './pages/member-profile';
import Events from './pages/events';
import { Donations } from './pages/donations';
import { Groups } from './pages/groups';
import { Tasks } from './pages/tasks';
import { Reports } from './pages/reports';
import { Bulletin } from './pages/bulletin';
import { Settings } from './pages/settings';
import ChildrenCheckin from './pages/children-checkin';
import AddChild from './pages/add-child';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<People />} />
          <Route path="/members/:id" element={<MemberProfile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/donations" element={<Donations />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/children-check-in" element={<ChildrenCheckin />} />
          <Route path="/children-check-in/add" element={<AddChild />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/bulletin" element={<Bulletin />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;