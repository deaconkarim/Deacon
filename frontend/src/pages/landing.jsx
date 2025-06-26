import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col">
      {/* Hero Section */}
      <header className="w-full px-6 py-8 flex flex-col items-center text-center bg-gradient-to-b from-blue-100 to-transparent">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
          Deacon
          <span className="block bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Your Church Command Center
          </span>
        </h1>
        <img src="/church-command-center-logo.png" alt="Church Command Center Logo" className="mb-6 shadow-xl w-64 h-64 object-contain mx-auto" />
        <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto mb-8">
          All your ministry's people, events, insights, and operations—beautifully organized in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 text-lg font-semibold shadow-lg" onClick={() => navigate('/register')}>Get Started</Button>
          <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-blue-500 text-blue-700" onClick={() => document.getElementById('features').scrollIntoView({behavior: 'smooth'})}>See Features</Button>
        </div>
      </header>

      {/* Why Deacon Section */}
      <section id="features" className="max-w-6xl mx-auto py-24 px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Why Deacon?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Insights */}
          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-blue-100 hover:scale-105 transition-transform">
            <span className="inline-block mb-4"><svg width="48" height="48" fill="none" viewBox="0 0 24 24"><path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 12l5-5 5 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 17V7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <h3 className="text-2xl font-bold mb-2">Powerful Insights</h3>
            <p className="text-gray-600 text-lg">Your central hub with real-time insights, attendance tracking, and key metrics at a glance. Everything you need to run your ministry efficiently.</p>
          </div>
          {/* Management */}
          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-blue-100 hover:scale-105 transition-transform">
            <span className="inline-block mb-4"><svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2" stroke="#2563eb" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="#10b981" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="#2563eb" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="#10b981" strokeWidth="2"/></svg></span>
            <h3 className="text-2xl font-bold mb-2">Effortless Management</h3>
            <p className="text-gray-600 text-lg">People, events, tasks, and groups—organized and accessible from anywhere.</p>
          </div>
          {/* SMS & Email Communication */}
          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-blue-100 hover:scale-105 transition-transform">
            <span className="inline-block mb-4"><svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#2563eb" strokeWidth="2"/><path d="M3 7l9 6 9-6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <h3 className="text-2xl font-bold mb-2">SMS & Email Communication</h3>
            <p className="text-gray-600 text-lg">Reach your congregation instantly with built-in SMS and email tools.</p>
          </div>
          {/* Task Management */}
          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center border border-blue-100 hover:scale-105 transition-transform md:col-span-2 lg:col-span-1">
            <span className="inline-block mb-4"><svg width="48" height="48" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#10b981" strokeWidth="2"/><path d="M7 13l3 3 7-7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <h3 className="text-2xl font-bold mb-2">Task Management</h3>
            <p className="text-gray-600 text-lg">Assign, track, and complete ministry tasks with ease—never miss a detail.</p>
          </div>
        </div>
      </section>

      {/* Design Section */}
      <section className="bg-gradient-to-br from-blue-50 to-emerald-50 py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Designed for Ministry. Built for Leaders.</h2>
            <p className="text-xl text-gray-700 mb-6">Deacon is crafted to be as intuitive as it is powerful. Whether you're tracking attendance, planning events, or following up with visitors, everything is just a click away.</p>
            <ul className="list-disc pl-6 text-lg text-gray-600 space-y-2">
              <li>Modern, beautiful dashboard</li>
              <li>Lightning-fast search and navigation</li>
              <li>Mobile and kiosk ready</li>
              <li>Secure and reliable</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="max-w-6xl mx-auto py-24 px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">See Your Ministry Like Never Before</h2>
            <p className="text-xl text-gray-700 mb-6">Deacon's analytics and reporting give you actionable insights—attendance trends, giving patterns, volunteer engagement, and more.</p>
            <ul className="list-disc pl-6 text-lg text-gray-600 space-y-2">
              <li>Real-time metrics and charts</li>
              <li>Customizable reports</li>
              <li>Track growth and engagement</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Mobile & Kiosk Section */}
      <section className="bg-gradient-to-br from-blue-50 to-emerald-50 py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Everywhere You Need It</h2>
            <p className="text-xl text-gray-700 mb-6">From Sunday check-in kiosks to mobile dashboards, Deacon goes wherever your ministry does.</p>
            <ul className="list-disc pl-6 text-lg text-gray-600 space-y-2">
              <li>Mobile-optimized for leaders on the go</li>
              <li>Kiosk check-in for fast, easy attendance</li>
              <li>Cloud-based and always accessible</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="max-w-4xl mx-auto py-24 px-6 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Church Operations?</h2>
        <p className="text-xl text-gray-700 mb-8">Join churches already using Deacon as their command center. Apply for beta access to start managing your ministry more effectively.</p>
        <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-6 text-xl font-semibold shadow-xl" onClick={() => navigate('/register')}>Get Started Free</Button>
        <Button size="lg" variant="outline" className="ml-4 px-10 py-6 text-xl font-semibold border-blue-500 text-blue-700" onClick={() => navigate('/login')}>Request a Demo</Button>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 bg-gradient-to-t from-blue-100 to-transparent text-center text-gray-500 text-sm">
        <div className="mb-2">&copy; {new Date().getFullYear()} Deacon. Built by a deacon who understands ministry.</div>
        <div className="space-x-4">
          <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
          <span>|</span>
          <a href="mailto:support@deaconapp.com" className="hover:underline">Contact</a>
        </div>
      </footer>
    </div>
  );
} 