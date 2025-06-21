import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
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
  Settings
} from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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

  const quickActions = [
    { icon: Users, label: "Members", color: "bg-emerald-100 text-emerald-600" },
    { icon: Calendar, label: "Events", color: "bg-blue-100 text-blue-600" },
    { icon: BarChart3, label: "Reports", color: "bg-purple-100 text-purple-600" },
    { icon: Monitor, label: "Kiosk", color: "bg-orange-100 text-orange-600" }
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
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="px-6 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Church className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Deacon</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="pt-12 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Built by a deacon, for deacons and pastors
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Your Church
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                    Command Center
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Deacon is the comprehensive church management system built by someone who's walked in your shoes. 
                  From member tracking to kiosk functionality, everything you need to run your ministry efficiently.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900">{action.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  onClick={() => navigate('/register')}
                >
                  Start Your Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </div>
            </div>

            {/* Right Content - Login Form */}
            <div className="lg:pl-8">
              <Card className="border border-gray-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Church className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-2">
                    Sign in to your Deacon command center
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-medium text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 py-4 text-base bg-white/50 border-gray-200 focus:border-green-500 focus:ring-green-500/20 focus:bg-white h-14 transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-base font-medium text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 py-4 text-base bg-white/50 border-gray-200 focus:border-green-500 focus:ring-green-500/20 focus:bg-white h-14 transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 h-14 text-lg font-medium transition-all duration-200 hover:scale-[1.02]"
                      disabled={loading}
                    >
                      <LogIn className="mr-3 h-5 w-5" />
                      {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </form>
                  
                  <div className="text-center pt-4">
                    <p className="text-base text-gray-600">
                      Don't have an account?{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal text-green-600 hover:text-green-700 text-base transition-colors duration-200"
                        onClick={() => navigate('/register')}
                      >
                        Sign up for free
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to run your ministry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deacon combines all the essential tools for church management into one powerful command center. 
              Built by someone who understands the unique challenges of ministry leadership.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Member Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Track your congregation with detailed profiles, attendance history, and family connections. 
                Know your members better than ever before.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Event Coordination</h3>
              <p className="text-gray-600 leading-relaxed">
                Plan services, Bible studies, potlucks, and special events with volunteer coordination. 
                Keep everyone informed and engaged.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Command className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Command Center</h3>
              <p className="text-gray-600 leading-relaxed">
                Your central hub for all church operations. Real-time insights, reporting, and 
                everything you need to make informed ministry decisions.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Monitor className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Kiosk System</h3>
              <p className="text-gray-600 leading-relaxed">
                Self-service kiosks for check-ins, information display, and member engagement. 
                Streamline your Sunday morning operations.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Small Groups</h3>
              <p className="text-gray-600 leading-relaxed">
                Manage Bible study groups, track participation, and organize study materials. 
                Foster deeper connections within your congregation.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Ready</h3>
              <p className="text-gray-600 leading-relaxed">
                Access your church command center anywhere with our mobile-optimized interface. 
                Ministry doesn't stop when you leave the office.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-20 bg-gradient-to-br from-gray-50 to-white rounded-3xl">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Built by a deacon, for deacons and pastors
              </h2>
              <p className="text-xl text-gray-600">
                Join churches that have transformed their ministry operations with Deacon
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-20">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Ready to transform your church operations?
            </h2>
            <p className="text-xl text-gray-600">
              Join churches already using Deacon as their command center. Start managing your ministry more effectively today.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg px-8 py-6 h-auto"
              onClick={() => navigate('/register')}
            >
              <Target className="mr-2 h-5 w-5" />
              Start Your Free Account Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 