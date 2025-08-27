import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 px-6 py-16 md:py-24 text-center max-w-7xl mx-auto">
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg font-bold shadow-2xl transform hover:scale-105 transition-all" 
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-10 py-4 text-lg font-bold border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 backdrop-blur-sm" 
              onClick={() => document.getElementById('features').scrollIntoView({behavior: 'smooth'})}
            >
              See Features
            </Button>
          </div>
          
          {/* Logo placeholder - using text for now */}
          <div className="flex justify-center">
            <div className="text-6xl font-black text-blue-400/20">
              DEACON
            </div>
          </div>
        </div>
      </header>

      {/* Next-Gen Features Showcase */}
      <section id="features" className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Insights */}
            <div className="group relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M15 10a5 5 0 0 0-10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">AI-Powered Insights</h3>
                <p className="text-blue-200 text-lg leading-relaxed">
                  Advanced analytics for attendance and giving trends. Predictive insights that help you make data-driven ministry decisions.
                </p>
              </div>
            </div>

            {/* Smart Event & People Management */}
            <div className="group relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Smart Management</h3>
                <p className="text-purple-200 text-lg leading-relaxed">
                  Intelligent event and people management with lightning-fast kiosk check-ins. Everything organized automatically.
                </p>
              </div>
            </div>

            {/* Seamless Communication */}
            <div className="group relative bg-gradient-to-br from-indigo-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-8 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Seamless Communication</h3>
                <p className="text-indigo-200 text-lg leading-relaxed">
                  Unified SMS and email tools that reach your congregation instantly. Smart targeting and automated follow-ups.
                </p>
              </div>
            </div>

            {/* Advanced Analytics */}
            <div className="group relative bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Giving Analytics</h3>
                <p className="text-emerald-200 text-lg leading-relaxed">
                  Donation tracking with predictive insights. Understand giving patterns and optimize stewardship campaigns.
                </p>
              </div>
            </div>

            {/* Advanced Automation */}
            <div className="group relative bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Advanced Automation</h3>
                <p className="text-orange-200 text-lg leading-relaxed">
                  Set it and forget it. Automated workflows for visitor follow-up, event reminders, and task assignments.
                </p>
              </div>
            </div>

            {/* Unified Command Center */}
            <div className="group relative bg-gradient-to-br from-violet-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-8 border border-violet-500/20 hover:border-violet-400/40 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Unified Command Center</h3>
                <p className="text-violet-200 text-lg leading-relaxed">
                  All your ministry data unified in one powerful dashboard. Real-time insights across every aspect of church life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Deacon is Different */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-purple-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
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
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
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
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Growth Story 1 */}
            <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-blue-400 mb-2">40%</div>
                <div className="text-white text-lg font-semibold">Attendance Growth</div>
              </div>
              <blockquote className="text-blue-200 text-lg italic mb-4">
                "Deacon's smart insights helped us identify attendance patterns we never saw before. 
                We've grown 40% in just 8 months by following up with the right people at the right time."
              </blockquote>
              <div className="text-blue-300 font-semibold">— Pastor Sarah, Community Life Church</div>
            </div>

            {/* Growth Story 2 */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-purple-400 mb-2">60%</div>
                <div className="text-white text-lg font-semibold">Volunteer Engagement</div>
              </div>
              <blockquote className="text-purple-200 text-lg italic mb-4">
                "The task management and automated reminders transformed our volunteer coordination. 
                Our teams are more engaged and nothing falls through the cracks anymore."
              </blockquote>
              <div className="text-purple-300 font-semibold">— Mark, Grace Fellowship</div>
            </div>

            {/* Growth Story 3 */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-8 border border-indigo-500/20">
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-indigo-400 mb-2">25%</div>
                <div className="text-white text-lg font-semibold">Giving Increase</div>
              </div>
              <blockquote className="text-indigo-200 text-lg italic mb-4">
                "Deacon's giving analytics revealed opportunities we missed. 
                Our stewardship campaigns are now data-driven and incredibly effective."
              </blockquote>
              <div className="text-indigo-300 font-semibold">— Pastor David, New Hope Church</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-3xl p-12 border border-blue-500/20 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              "Deacon gave us our weekends back. What used to take hours now happens automatically."
            </h3>
            <p className="text-xl text-blue-200 mb-6">
              — Pastor Jennifer, Riverside Church (2,500 members)
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="text-white">
                <div className="text-2xl font-bold text-blue-400">5 hours</div>
                <div className="text-sm text-blue-200">Weekly time saved</div>
              </div>
              <div className="text-white">
                <div className="text-2xl font-bold text-purple-400">100%</div>
                <div className="text-sm text-purple-200">Automated follow-ups</div>
              </div>
              <div className="text-white">
                <div className="text-2xl font-bold text-indigo-400">Zero</div>
                <div className="text-sm text-indigo-200">Missed visitors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Call-to-Action Section */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
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
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-12 py-6 text-xl font-bold border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10 backdrop-blur-sm" 
              onClick={() => navigate('/login')}
            >
              Schedule a Demo
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-black text-blue-400 mb-2">✓</div>
              <div className="text-white font-semibold">14-Day Free Trial</div>
              <div className="text-blue-300 text-sm">No credit card required</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-400 mb-2">✓</div>
              <div className="text-white font-semibold">Full Feature Access</div>
              <div className="text-purple-300 text-sm">Everything you see is yours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-indigo-400 mb-2">✓</div>
              <div className="text-white font-semibold">Setup Support</div>
              <div className="text-indigo-300 text-sm">We'll help you get started</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-900 py-16 px-6">
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
  );
} 