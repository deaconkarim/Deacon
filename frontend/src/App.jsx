import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
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
    </Routes>
  );
}

export default App;