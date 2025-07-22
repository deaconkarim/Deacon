import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Layout } from './components/layout';
import { Dashboard } from './pages/dashboard';
import { People } from './pages/members';
import MemberProfile from './pages/member-profile';
import Events from './pages/events';
import { Donations } from './pages/donations';
import { Groups } from './pages/groups';
import { Tasks } from './pages/tasks';
import { Reports } from './pages/reports';
import { Settings } from './pages/settings';
import ChildrenCheckin from './pages/children-checkin';
import AddChild from './pages/add-child';
import EditChild from './pages/edit-child';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Invite } from './pages/invite';
import { SMS } from './pages/sms';
import AlertsPage from './pages/alerts';
import { AdminCenter } from './pages/admin-center';
import { Permissions } from './pages/permissions';
import DonatePage from './pages/donate';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import ApprovalStatus from './components/ApprovalStatus';
import PrivacyPolicy from './pages/privacy-policy';
import { TermsOfService } from './pages/terms-of-service';
import PublicLayout from './components/PublicLayout';
import Landing from './pages/landing';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import PWATest from './components/PWATest';

function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/invite/:invitationId" element={<PublicLayout><Invite /></PublicLayout>} />
        <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
        <Route path="/terms-of-service" element={<PublicLayout><TermsOfService /></PublicLayout>} />
        <Route path="/donate/:slug" element={<DonatePage />} />
        
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
          <Route path="/edit-child/:childId" element={<EditChild />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/sms" element={<SMS />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/pwa-test" element={<PWATest />} />
        </Route>
        
        {/* System Admin only routes */}
        <Route path="/admin-center" element={<AdminRoute><AdminCenter /></AdminRoute>} />
      </Routes>
    </>
  );
}

export default App;