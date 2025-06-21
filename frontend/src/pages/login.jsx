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
  DollarSign, 
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
  Globe
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

  const stats = [
    { number: "500+", label: "Churches Trust Deacon" },
    { number: "50K+", label: "Members Managed" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const features = [
    {
      icon: Users,
      title: "Member Hub",
      description: "Complete member profiles, attendance tracking, and family connections in one place."
    },
    {
      icon: Calendar,
      title: "Event Master",
      description: "Plan and coordinate everything from Sunday services to potlucks with ease."
    },
    {
      icon: DollarSign,
      title: "Financial Stewardship",
      description: "Track tithes, offerings, and special donations with detailed reporting."
    },
    {
      icon: BarChart3,
      title: "Ministry Insights",
      description: "Data-driven insights to help your church grow and serve better."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-75"></div>
              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Church className="h-8 w-8 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Deacon
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-gray-700 hover:bg-gray-100"
              onClick={() => navigate('/register')}
            >
              Sign Up
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="pt-20 pb-32 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium border border-gray-200 shadow-sm">
              <Sparkles className="h-4 w-4 text-blue-500" />
              The Future of Church Management
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Deacon
              </span>
            </h1>
            
            <p className="text-2xl lg:text-3xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              The complete church management platform that helps you focus on what matters most: 
              <span className="text-blue-600 font-semibold"> your ministry</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-8 py-6 h-auto"
                onClick={() => navigate('/register')}
              >
                Start Your Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6 h-auto"
                onClick={() => navigate('/login')}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm lg:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
          {/* Login Form */}
          <div className="order-2 lg:order-1">
            <Card className="bg-white/90 backdrop-blur-xl border-gray-200 shadow-2xl">
              <CardHeader className="text-center space-y-1 pb-8">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-75"></div>
                    <div className="relative p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
                      <Church className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Sign in to your Deacon dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-lg py-6"
                    disabled={loading}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
                
                <div className="text-center pt-4">
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal text-blue-600 hover:text-blue-700"
                      onClick={() => navigate('/register')}
                    >
                      Sign up for free
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Preview */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Everything your church needs
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                From member management to financial tracking, Deacon provides all the tools 
                to help your ministry thrive in the digital age.
              </p>
            </div>

            <div className="grid gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white transition-colors shadow-sm">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-20">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Ready to transform your church?
            </h2>
            <p className="text-xl text-gray-700">
              Join hundreds of churches already using Deacon to grow their ministry.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-8 py-6 h-auto"
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