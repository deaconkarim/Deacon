import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { 
  Church, 
  LogIn, 
  Mail, 
  Lock, 
  Users, 
  Calendar, 
  BarChart3, 
  CheckCircle, 
  Star,
  ArrowRight,
  Heart,
  Shield,
  Zap,
  Play,
  Sparkles,
  Target,
  Globe,
  ChevronRight,
  Award,
  Clock,
  TrendingUp,
  BookOpen,
  Home,
  Phone,
  Command,
  Monitor,
  Settings,
  X
} from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const screenshotsRef = useRef(null);

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

  const scrollToScreenshots = () => {
    screenshotsRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const openLightbox = (imageSrc, imageAlt) => {
    setSelectedImage(imageSrc);
    setSelectedImageAlt(imageAlt);
    setShowLightbox(true);
  };

  const quickActions = [
    { 
      icon: Users, 
      label: "Members", 
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      action: scrollToScreenshots
    },
    { 
      icon: Calendar, 
      label: "Events", 
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      action: scrollToScreenshots
    },
    { 
      icon: BarChart3, 
      label: "Reports", 
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      action: scrollToScreenshots
    },
    { 
      icon: Monitor, 
      label: "Kiosk", 
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      action: scrollToScreenshots
    }
  ];

  const benefits = [
    "Built by a deacon who understands your ministry needs",
    "Complete command center for all church operations",
    "Kiosk system for check-ins and information display",
    "Real-time attendance tracking and insights",
    "Mobile-optimized for ministry on the go",
    "Dedicated support from someone who's been there"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation */}
      <nav className="px-6 py-4 border-b border-white/20 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Church className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Deacon</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Sign In Button - Visible on mobile/tablet */}
            <Button 
              size="sm" 
              variant="outline"
              className="lg:hidden bg-white/80 border-gray-200 hover:bg-white text-gray-700 hover:text-gray-900 shadow-sm" 
              onClick={() => setShowLoginModal(true)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            {/* Get Started Button - Hidden on mobile/tablet, visible on desktop */}
            <Button 
              size="sm" 
              className="hidden lg:block bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 shadow-lg" 
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="pt-16 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-500/10 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200/50">
                  <Sparkles className="h-4 w-4" />
                  Built by a deacon, for church leaders
                </div>
                <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Your Church
                  <span className="block bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Command Center
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Deacon is the comprehensive church management system built by someone who's walked in your shoes. 
                  From member tracking to kiosk functionality, everything you need to run your ministry efficiently.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-4 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm"
                    onClick={action.action}
                  >
                    <div className={`p-3 rounded-xl border ${action.color}`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-gray-900">{action.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/register')}
                >
                  Start Your Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Content - Login Form */}
            <div className="lg:pl-8 hidden lg:block">
              <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center pb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Church className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Welcome Back</CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-3">
                    Sign in to your Deacon command center
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-10 pb-10">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-semibold text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 py-4 text-base bg-white/70 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-white h-14 transition-all duration-300 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-base font-semibold text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 py-4 text-base bg-white/70 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-white h-14 transition-all duration-300 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 h-14 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl rounded-xl"
                      disabled={loading}
                    >
                      <LogIn className="mr-3 h-5 w-5" />
                      {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </form>
                  
                  <div className="text-center pt-6">
                    <p className="text-base text-gray-600">
                      Don't have an account?{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto font-semibold text-emerald-600 hover:text-emerald-700 text-base transition-colors duration-300"
                        onClick={() => navigate('/register')}
                      >
                        Sign up for free
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile/Tablet Sign In Button */}
            <div className="lg:hidden text-center pt-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="mr-3 h-5 w-5" />
                Sign In to Your Account
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Everything you need to run your ministry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Deacon combines all the essential tools for church management into one powerful command center. 
              Built by someone who understands the unique challenges of ministry leadership.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-200/50">
                <Users className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Member Management</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Track your congregation with detailed profiles, attendance history, and family connections. 
                Know your members better than ever before.
              </p>
            </div>

            <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-200/50">
                <Calendar className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Event Coordination</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Plan services, Bible studies, potlucks, and special events with volunteer coordination. 
                Keep everyone informed and engaged.
              </p>
            </div>

            <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-200/50">
                <Command className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Command Center</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Your central hub for all church operations. Real-time insights, reporting, and 
                everything you need to make informed ministry decisions.
              </p>
            </div>

            <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-200/50">
                <Monitor className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Kiosk System</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Self-service kiosks for check-ins, information display, and member engagement. 
                Streamline your Sunday morning operations.
              </p>
            </div>

            <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 border border-teal-200/50">
                <BookOpen className="h-7 w-7 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Small Groups</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Manage Bible study groups, track participation, and organize study materials. 
                Foster deeper connections within your congregation.
              </p>
            </div>

            <div className="p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 hover:bg-white/80 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 border border-pink-200/50">
                <Zap className="h-7 w-7 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mobile Ready</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Access your church command center anywhere with our mobile-optimized interface. 
                Ministry doesn't stop when you leave the office.
              </p>
            </div>
          </div>
        </div>

        {/* Screenshots Section */}
        <div className="py-24" ref={screenshotsRef}>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              See Deacon in action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get a glimpse of how Deacon transforms church management with our intuitive interface and powerful features.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Dashboard Screenshot */}
            <div className="space-y-6">
              <div 
                className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 p-4 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                onClick={() => openLightbox('/screenshot-dashboard.png', 'Deacon Dashboard')}
              >
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <img src="/screenshot-dashboard.png" alt="Deacon Dashboard" className="rounded-b-2xl w-full" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Command Center Dashboard</h3>
                <p className="text-gray-600 text-lg">
                  Your central hub with real-time insights, attendance tracking, and key metrics at a glance.
                </p>
              </div>
            </div>

            {/* Member Management Screenshot */}
            <div className="space-y-6">
              <div 
                className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 p-4 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                onClick={() => openLightbox('/screenshot-members.png', 'Deacon Member Profile')}
              >
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <img src="/screenshot-members.png" alt="Deacon Member Profile" className="rounded-b-2xl w-full" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Member Management</h3>
                <p className="text-gray-600 text-lg">
                  Comprehensive member profiles with attendance history, family connections, and detailed insights.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Screenshots Row */}
          <div className="grid lg:grid-cols-3 gap-8 mt-16">
            {/* Events Screenshot */}
            <div className="space-y-4">
              <div 
                className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 p-4 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                onClick={() => openLightbox('/screenshot-event.png', 'Deacon Event Planning')}
              >
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <img src="/screenshot-event.png" alt="Deacon Event Planning" className="rounded-b-2xl w-full" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900">Event Planning</h4>
                <p className="text-gray-600 text-sm">Organize services and coordinate volunteers seamlessly.</p>
              </div>
            </div>

            {/* Kiosk Screenshot */}
            <div className="space-y-4">
              <div 
                className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 p-4 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                onClick={() => openLightbox('/screenshot-kiosk.png', 'Deacon Kiosk System')}
              >
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <img src="/screenshot-kiosk.png" alt="Deacon Kiosk System" className="rounded-b-2xl w-full" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900">Kiosk System</h4>
                <p className="text-gray-600 text-sm">Self-service check-ins and information display.</p>
              </div>
            </div>

            {/* Reports Screenshot */}
            <div className="space-y-4">
              <div 
                className="bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50 p-4 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                onClick={() => openLightbox('/screenshot-reporting.png', 'Deacon Analytics & Reports')}
              >
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <img src="/screenshot-reporting.png" alt="Deacon Analytics & Reports" className="rounded-b-2xl w-full" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900">Analytics & Reports</h4>
                <p className="text-gray-600 text-sm">Data-driven insights to inform ministry decisions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-24 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50">
          <div className="max-w-4xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
                Built by a deacon, for church leaders
              </h2>
              <p className="text-xl text-gray-600">
                Join churches that have transformed their ministry operations with Deacon
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-gray-700 text-lg font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-24">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Ready to transform your church operations?
            </h2>
            <p className="text-xl text-gray-600">
              Join churches already using Deacon as their command center. Start managing your ministry more effectively today.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white text-xl px-10 py-8 h-auto shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 rounded-2xl font-semibold"
              onClick={() => navigate('/register')}
            >
              <Target className="mr-3 h-6 w-6" />
              Start Your Free Account Today
            </Button>
          </div>
        </div>
      </div>

      {/* Login Modal for Mobile/Tablet */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Church className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Welcome Back
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Sign in to your Deacon command center
            </p>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-sm font-semibold text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-3 text-sm bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 h-12 transition-all duration-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-password" className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="modal-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-3 text-sm bg-white border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 h-12 transition-all duration-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl rounded-lg"
              disabled={loading}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-emerald-600 hover:text-emerald-700 text-sm transition-colors duration-300"
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/register');
                }}
              >
                Sign up for free
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
              onClick={() => setShowLightbox(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center justify-center p-8">
              <img 
                src={selectedImage} 
                alt={selectedImageAlt} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageAlt}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 