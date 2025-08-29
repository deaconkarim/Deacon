import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { emailService } from '../lib/emailService';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBetaDialog, setShowBetaDialog] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [betaSignupData, setBetaSignupData] = useState({
    churchName: '',
    contactName: '',
    email: '',
    phone: '',
    churchSize: '',
    needs: ''
  });
  const [betaSignupLoading, setBetaSignupLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setShowLoginModal(false);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const handleBetaSignup = async (e) => {
    e.preventDefault();
    setBetaSignupLoading(true);
    
    try {
      // Save beta signup data to Supabase
      const { data, error } = await supabase
        .from('beta_signups')
        .insert([{
          church_name: betaSignupData.churchName,
          contact_name: betaSignupData.contactName,
          email: betaSignupData.email,
          phone: betaSignupData.phone || null,
          church_size: betaSignupData.churchSize,
          needs: betaSignupData.needs
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Send notification email to admin
      try {
        await emailService.sendEmail({
          to: 'admin@getdeacon.com',
          subject: 'New Beta Access Application - Deacon',
          body: `
            <h2>New Beta Access Application</h2>
            <p><strong>Church Name:</strong> ${betaSignupData.churchName}</p>
            <p><strong>Contact Name:</strong> ${betaSignupData.contactName}</p>
            <p><strong>Email:</strong> ${betaSignupData.email}</p>
            <p><strong>Phone:</strong> ${betaSignupData.phone || 'Not provided'}</p>
            <p><strong>Church Size:</strong> ${betaSignupData.churchSize}</p>
            <p><strong>Needs:</strong> ${betaSignupData.needs}</p>
            <p><strong>Application Time:</strong> ${new Date().toLocaleString()}</p>
          `,
          template_type: 'default'
        });
      } catch (emailError) {

        // Don't fail the whole process if email fails
      }
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in Deacon. We'll review your application and get back to you within 48 hours.",
      });
      
      setShowBetaDialog(false);
      setBetaSignupData({
        churchName: '',
        contactName: '',
        email: '',
        phone: '',
        churchSize: '',
        needs: ''
      });
    } catch (error) {
      console.error('Error submitting beta signup:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setBetaSignupLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* Full Screen Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 z-0"></div>
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10">
      {/* Hero Section */}
      <header className="relative px-6 py-16 md:py-24">
        
        <div className="text-center max-w-7xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-blue-200 text-sm font-semibold border border-blue-500/30">
              Next Generation Church Software
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="block mb-2">The Future of</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Church Management
            </span>
            <span className="block text-5xl md:text-7xl">is Here.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
            <strong>Deacon</strong> is the all-in-one platform that empowers churches with next level tools built for real ministry. 
            <span className="block mt-2 text-lg md:text-xl text-blue-200">
              Spend time running your ministry, not your software.
            </span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg font-bold shadow-2xl transform hover:scale-105 transition-all" 
              onClick={() => setShowBetaDialog(true)}
            >
              Apply for Beta Access
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-10 py-4 text-lg font-bold border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 backdrop-blur-sm" 
              onClick={openLoginModal}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Next-Gen Features Showcase */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Next-Gen Features
              </span>
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Powered by cutting-edge technology. Designed for real ministry impact.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI-Powered Insights */}
            <div className="group relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M15 10a5 5 0 0 0-10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">AI-Powered Insights</h3>
                <p className="text-blue-200 leading-relaxed">
                  Advanced analytics for attendance and giving trends. Predictive insights that help you make data-driven ministry decisions.
                </p>
              </div>
            </div>

            {/* Smart Event & People Management */}
            <div className="group relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Smart Management</h3>
                <p className="text-purple-200 leading-relaxed">
                  Intelligent event and people management with lightning-fast kiosk check-ins. Everything organized automatically.
                </p>
              </div>
            </div>

            {/* Seamless Communication */}
            <div className="group relative bg-gradient-to-br from-indigo-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Seamless Communication</h3>
                <p className="text-indigo-200 leading-relaxed">
                  Unified SMS and email tools that reach your congregation instantly. Smart targeting and automated follow-ups.
                </p>
              </div>
            </div>

            {/* Complete Tithing & Fundraising */}
            <div className="group relative bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Complete Tithing & Fundraising</h3>
                <p className="text-emerald-200 leading-relaxed">
                  Full donation management with recurring giving, fundraising campaigns, and automated receipts. Integrated with modern payment processing.
                </p>
              </div>
            </div>

            {/* Automated Smart Tasking */}
            <div className="group relative bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.61 1.98" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Automated Smart Tasking</h3>
                <p className="text-orange-200 leading-relaxed">
                  AI-driven task creation based on insights plus full manual task management. Never miss follow-ups or ministry opportunities again.
                </p>
              </div>
            </div>

            {/* World's Most Advanced Reporting */}
            <div className="group relative bg-gradient-to-br from-rose-900/50 to-pink-900/50 backdrop-blur-sm rounded-2xl p-6 border border-rose-500/20 hover:border-rose-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">World's Most Advanced Reporting</h3>
                <p className="text-rose-200 leading-relaxed">
                  Unparalleled analytics and reporting capabilities. Deep insights into every aspect of ministry with actionable recommendations.
                </p>
              </div>
            </div>

            {/* Advanced Automation */}
            <div className="group relative bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Advanced Automation</h3>
                <p className="text-cyan-200 leading-relaxed">
                  Set it and forget it. Automated workflows for visitor follow-up, event reminders, and task assignments.
                </p>
              </div>
            </div>

            {/* Ultimate Event Management */}
            <div className="group relative bg-gradient-to-br from-amber-900/50 to-yellow-900/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Ultimate Event Management</h3>
                <p className="text-amber-200 leading-relaxed">
                  The most sophisticated event system ever built. Recurring events, volunteer scheduling, resource management, and seamless RSVP tracking.
                </p>
              </div>
            </div>

            {/* Unified Command Center */}
            <div className="group relative bg-gradient-to-br from-violet-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-6 border border-violet-500/20 hover:border-violet-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Unified Command Center</h3>
                <p className="text-violet-200 leading-relaxed">
                  All your ministry data unified in one powerful dashboard. Real-time insights across every aspect of church life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Deacon is Different */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Why Deacon is 
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Different
              </span>
            </h2>
            <p className="text-xl text-blue-200 max-w-4xl mx-auto">
              Deacon is smarter, faster, and more powerful than anything else on the market. 
              Built with today's best technology for tomorrow's ministry needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Lightning Fast & Intuitive</h3>
                    <p className="text-blue-200 text-lg leading-relaxed">
                      Mobile-first design that's faster than any competitor. Every action happens instantly, every interface is intuitive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                      <rect x="2" y="6" width="20" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Built with Today's Best Technology</h3>
                    <p className="text-purple-200 text-lg leading-relaxed">
                      Modern cloud architecture, real-time updates, and cutting-edge security. Enterprise-grade performance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Scales with Churches of All Sizes</h3>
                    <p className="text-indigo-200 text-lg leading-relaxed">
                      From church plants to megachurches. Deacon grows with your ministry, adapting to your unique needs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-white">Designed by Ministry Leaders, for Ministry Leaders</h3>
                    <p className="text-emerald-200 text-lg leading-relaxed">
                      Every feature is crafted by people who understand real ministry challenges. Built for the mission, not just the metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/20">
                <div className="text-center">
                  <div className="text-6xl font-black text-blue-400/30 mb-4">NEXT-GEN</div>
                  <h4 className="text-3xl font-bold text-white mb-4">Command Center</h4>
                  <p className="text-blue-200 text-lg">
                    The most advanced church management platform ever created. 
                    Experience the difference that modern technology makes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/Impact Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Deacon Doesn't Just Manage Church Data—
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                It Strengthens Ministry
              </span>
            </h2>
            <p className="text-xl text-blue-200 max-w-4xl mx-auto">
              Real churches seeing real growth and engagement with Deacon's powerful platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Stats Section */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/20">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">Built for Scale & Security</h3>
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-blue-400 mb-2">Ultimate Privacy & Protection</div>
                <div className="text-blue-200 text-lg">Your data is yours, not ours. Ever.</div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-blue-400 mb-2">99.9%</div>
                  <div className="text-blue-200 text-sm">Uptime Guarantee</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-purple-400 mb-2">256-bit</div>
                  <div className="text-purple-200 text-sm">SSL Encryption</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-indigo-400 mb-2">SOC 2</div>
                  <div className="text-indigo-200 text-sm">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-violet-400 mb-2">24/7</div>
                  <div className="text-violet-200 text-sm">Support</div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-800/40 to-purple-800/40 rounded-lg border border-blue-400/30">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="text-blue-100 font-bold text-sm">Privacy-First Architecture</div>
                  <div className="text-blue-200 text-xs mt-1">We never use, share, or sell your congregation's data</div>
                </div>
              </div>
            </div>

            {/* Payment Processing Section */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/20">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">Revolutionary Payment Processing</h3>
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-emerald-400 mb-2">Accept Payments in Minutes</div>
                <div className="text-emerald-200 text-lg">Custom donation forms. Zero fees to Deacon. Maximum impact.</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-emerald-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="text-emerald-200 font-semibold">Tithing, Campaigns & Custom Funds</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-emerald-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="text-emerald-200 font-semibold">Credit Cards & Bank Accounts</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-emerald-900/20 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="text-emerald-200 font-semibold">Recurring Payments & Subscriptions</span>
                </div>
                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-emerald-800/40 to-teal-800/40 rounded-lg border border-emerald-400/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-white">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="text-emerald-100 font-bold">Zero Fees to Deacon - Keep 100%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-12 border border-blue-500/20 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Built by Ministry Leaders, for Ministry Leaders
            </h3>
            <p className="text-xl text-blue-200 mb-8">
              Every feature designed by people who understand real church challenges. 
              No more wrestling with software that doesn't get ministry.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="text-white">
                <div className="text-2xl font-bold text-blue-400">All-in-One</div>
                <div className="text-sm text-blue-200">Command Center</div>
              </div>
              <div className="text-white">
                <div className="text-2xl font-bold text-purple-400">Real-Time</div>
                <div className="text-sm text-purple-200">Dashboard & Reports</div>
              </div>
              <div className="text-white">
                <div className="text-2xl font-bold text-indigo-400">Mobile-First</div>
                <div className="text-sm text-indigo-200">Design & Kiosks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Call-to-Action Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-blue-200 text-lg font-semibold border border-blue-500/30">
              Ready to Experience the Future?
            </span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white leading-tight">
            Experience the
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Most Powerful
            </span>
            Church Software Ever Made
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-200 max-w-4xl mx-auto mb-12 leading-relaxed">
            Join the churches already revolutionizing their ministry with Deacon. 
            <span className="block mt-2 text-lg text-blue-300">
              Stop managing software. Start empowering ministry.
            </span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all" 
              onClick={() => setShowBetaDialog(true)}
            >
              Apply for Beta Access
            </Button>

          </div>
          
                      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-black text-blue-400 mb-2">✓</div>
              <div className="text-white font-semibold">Exclusive Beta Access</div>
              <div className="text-blue-300 text-sm">Limited spots available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-400 mb-2">✓</div>
              <div className="text-white font-semibold">Full Feature Access</div>
              <div className="text-purple-300 text-sm">Experience everything Deacon offers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-indigo-400 mb-2">✓</div>
              <div className="text-white font-semibold">Direct Feedback Channel</div>
              <div className="text-indigo-300 text-sm">Shape the future of Deacon</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-blue-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-4xl font-black text-blue-400 mb-4">DEACON</div>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Your Church Command Center. Built by a deacon who understands ministry.
            </p>
          </div>
          
          <div className="border-t border-blue-500/20 pt-8 text-center">
            <div className="text-blue-300 text-sm mb-4">
              &copy; {new Date().getFullYear()} Deacon. Empowering ministry through technology.
            </div>
            <div className="space-x-6 text-blue-400">
              <a href="/privacy-policy" className="hover:text-blue-300 transition-colors">Privacy Policy</a>
              <span className="text-blue-500/50">|</span>
              <a href="/terms-of-service" className="hover:text-blue-300 transition-colors">Terms of Service</a>
              <span className="text-blue-500/50">|</span>
              <a href="mailto:support@deaconapp.com" className="hover:text-blue-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-blue-500/30 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-white">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Login to Deacon</h3>
              <p className="text-blue-200">
                Access your church command center
              </p>
            </div>
            
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="your.email@church.org"
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="px-6 border-blue-400 text-blue-400 hover:bg-blue-400/10"
                  onClick={closeLoginModal}
                >
                  Cancel
                </Button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-blue-300 text-sm">
                Don't have an account? 
                <button 
                  className="text-blue-400 hover:text-blue-300 ml-1 underline"
                  onClick={() => {
                    closeLoginModal();
                    setShowBetaDialog(true);
                  }}
                >
                  Apply for Beta Access
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Beta Access Dialog */}
      {showBetaDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-blue-500/30 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-3xl font-black text-blue-400 mb-2">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-2">Apply for Beta Access</h3>
              <p className="text-blue-200">
                Join the select group of churches revolutionizing their ministry with Deacon.
              </p>
            </div>
            
            <form className="space-y-4" onSubmit={handleBetaSignup}>
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Church Name</label>
                <input 
                  type="text" 
                  required
                  value={betaSignupData.churchName}
                  onChange={(e) => setBetaSignupData(prev => ({ ...prev, churchName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="Your Church Name"
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={betaSignupData.contactName}
                  onChange={(e) => setBetaSignupData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="Pastor/Leader Name"
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={betaSignupData.email}
                  onChange={(e) => setBetaSignupData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="your.email@church.org"
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Phone (Optional)</label>
                <input 
                  type="tel" 
                  value={betaSignupData.phone}
                  onChange={(e) => setBetaSignupData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">Church Size</label>
                <select 
                  required
                  value={betaSignupData.churchSize}
                  onChange={(e) => setBetaSignupData(prev => ({ ...prev, churchSize: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Select church size</option>
                  <option value="1-50">1-50 members</option>
                  <option value="51-200">51-200 members</option>
                  <option value="201-500">201-500 members</option>
                  <option value="501-1000">501-1000 members</option>
                  <option value="1000+">1000+ members</option>
                </select>
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-semibold mb-2">What challenges is your church facing?</label>
                <textarea 
                  required
                  value={betaSignupData.needs}
                  onChange={(e) => setBetaSignupData(prev => ({ ...prev, needs: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                  placeholder="Tell us about your current challenges and what you hope to achieve with Deacon..."
                  rows="3"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit"
                  disabled={betaSignupLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 disabled:opacity-50"
                >
                  {betaSignupLoading ? 'Submitting...' : 'Apply for Beta'}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="px-6 border-blue-400 text-blue-400 hover:bg-blue-400/10"
                  onClick={() => setShowBetaDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-blue-300 text-xs">
                Beta access is limited. We'll review your application and get back to you within 48 hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 