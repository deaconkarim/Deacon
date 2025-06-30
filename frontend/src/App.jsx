import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard } from './pages/dashboard';
import { People } from './pages/members';
import { MemberProfile } from './pages/member-profile';
import Events from './pages/events';
import { Donations } from './pages/donations';
import { Groups } from './pages/groups';
import { Tasks } from './pages/tasks';
import { Reports } from './pages/reports';
import { Settings } from './pages/settings';
import ChildrenCheckin from './pages/children-checkin';
import AddChild from './pages/add-child';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Invite } from './pages/invite';
import { SMS } from './pages/sms';
import { ProtectedRoute } from './components/ProtectedRoute';
import ApprovalStatus from './components/ApprovalStatus';
import PrivacyPolicy from './pages/privacy-policy';
import { TermsOfService } from './pages/terms-of-service';
import PublicLayout from './components/PublicLayout';
import Landing from './pages/landing';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
      <Route path="/invite/:invitationId" element={<PublicLayout><Invite /></PublicLayout>} />
      <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
      <Route path="/terms-of-service" element={<PublicLayout><TermsOfService /></PublicLayout>} />
      
      {/* Approval status route */}
      <Route path="/approval-status" element={<ApprovalStatus />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
        <Route path="/settings" element={<Settings />} />
        <Route path="/sms" element={<SMS />} />
      </Route>
    </Routes>
  );
}

export default App;